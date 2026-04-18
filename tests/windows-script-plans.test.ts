import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const describeWindows = process.platform === "win32" ? describe : describe.skip;
const repoRoot = process.cwd();
const helperPath = join(repoRoot, "scripts", "internal", "lib", "plans.ps1");
const runtimeLogsScriptPath = join(repoRoot, "scripts", "internal", "runtime", "manage-runtime-logs.ps1");
const windowsStartScriptPath = join(repoRoot, "scripts", "internal", "runtime", "run-workstation.ps1");
const commissioningArtifactScriptPath = join(repoRoot, "scripts", "internal", "commissioning", "write-commissioning-artifact.ps1");
const workstationRuntimeDoctorScriptPath = join(repoRoot, "scripts", "internal", "runtime", "workstation-runtime-doctor.ps1");
const tempDirectories: string[] = [];

function normalizeExistingPath(path: string): string {
  return realpathSync.native(path);
}

function toPowerShellString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function runPowerShell(args: string[], envOverrides: NodeJS.ProcessEnv = {}): string {
  const result = spawnSync("powershell.exe", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides
    }
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `PowerShell command failed with exit code ${result.status}.`,
        result.stdout.trim(),
        result.stderr.trim()
      ]
        .filter((value) => value.length > 0)
        .join("\n")
    );
  }

  return result.stdout.trim();
}

function extractLastJsonObject(output: string): unknown {
  const normalizedLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let index = normalizedLines.length - 1; index >= 0; index -= 1) {
    const candidate = normalizedLines[index];
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
      continue;
    }

    return JSON.parse(candidate);
  }

  throw new Error(`No JSON payload found in output:\n${output}`);
}

function runPowerShellJson(script: string): unknown {
  return JSON.parse(
    runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script
    ])
  );
}

function createTempDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describeWindows("windows script helpers", () => {
  it("delegates source-mode startup to the internal source launcher", () => {
    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      windowsStartScriptPath,
      "-SkipInstall",
      "-SkipDoctor",
      "-SkipBuild",
      "-DryRun"
    ]);

    expect(output).toContain("[start] powershell.exe -ExecutionPolicy Bypass -File");
    expect(output).toContain(join(repoRoot, "scripts", "internal", "runtime", "start-local.ps1"));
  });

  it("launches the packaged executable without an empty ArgumentList when no wizard arguments are requested", () => {
    const packagedExecutablePath = join(repoRoot, "artifacts", "packages", "win-unpacked", "OnlySpeech.exe");
    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      [
        "& {",
        "  function Start-Process {",
        "    param(",
        "      [string]$FilePath,",
        "      [object[]]$ArgumentList,",
        "      [string]$WorkingDirectory",
        "    )",
        "    [pscustomobject]@{",
        "      FilePath = $FilePath",
        "      WorkingDirectory = $WorkingDirectory",
        "      HasArgumentList = $PSBoundParameters.ContainsKey('ArgumentList')",
        "      ArgumentCount = if ($null -eq $ArgumentList) { -1 } else { $ArgumentList.Count }",
        "    } | ConvertTo-Json -Compress",
        "  }",
        "  function Test-Path {",
        "    param(",
        "      [string]$Path,",
        "      [string]$LiteralPath",
        "    )",
        `    if ($Path -eq ${toPowerShellString(packagedExecutablePath)} -or $LiteralPath -eq ${toPowerShellString(packagedExecutablePath)}) {`,
        "      return $true",
        "    }",
        "    Microsoft.PowerShell.Management\\Test-Path @PSBoundParameters",
        "  }",
        `  & ${toPowerShellString(windowsStartScriptPath)} -SkipInstall -SkipDoctor -PreferPackaged`,
        "}"
      ].join("\n")
    ]);

    const invocation = extractLastJsonObject(output) as {
      FilePath: string;
      WorkingDirectory: string;
      HasArgumentList: boolean;
      ArgumentCount: number;
    };

    expect(invocation.FilePath).toBe(packagedExecutablePath);
    expect(invocation.WorkingDirectory).toBe(repoRoot);
    expect(invocation.HasArgumentList).toBe(false);
    expect(invocation.ArgumentCount).toBe(-1);
  });

  it("builds a deterministic cleanup plan for runtime logs", () => {
    const plan = runPowerShellJson(
      [
        "& {",
        `  . ${toPowerShellString(helperPath)}`,
        "  $files = @(",
        "    [pscustomobject]@{",
        "      Name = '2026-03-01.jsonl'",
        "      FullName = 'C:\\logs\\2026-03-01.jsonl'",
        "      Length = 10",
        "      LastWriteTime = [datetime]'2026-03-01T00:00:00Z'",
        "    },",
        "    [pscustomobject]@{",
        "      Name = '2026-03-20.jsonl'",
        "      FullName = 'C:\\logs\\2026-03-20.jsonl'",
        "      Length = 20",
        "      LastWriteTime = [datetime]'2026-03-20T00:00:00Z'",
        "    }",
        "  )",
        "  $plan = Get-OnlySpeechRuntimeLogPlan `",
        "    -Mode cleanup `",
        "    -RequestedPath '' `",
        "    -ExportDirectory '' `",
        "    -OlderThanDays 14 `",
        "    -RepoRoot 'D:\\Repo' `",
        "    -LocalAppData 'C:\\Users\\Installer\\AppData\\Local' `",
        "    -Files $files `",
        "    -ExistingPaths @('C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\logs') `",
        "    -Now ([datetime]'2026-03-27T12:00:00Z')",
        "  $plan | ConvertTo-Json -Depth 6 -Compress",
        "}"
      ].join("\n")
    ) as {
      SourcePath: string;
      ExportDirectory: string;
      Operations: Array<{ Action: string; Name: string; SourcePath: string }>;
    };

    expect(plan.SourcePath).toBe("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\logs");
    expect(plan.ExportDirectory).toBe("D:\\Repo\\artifacts\\logs\\runtime-logs");
    expect(plan.Operations).toEqual([
      {
        Action: "remove",
        Name: "2026-03-01.jsonl",
        SourcePath: "C:\\logs\\2026-03-01.jsonl"
      }
    ]);
  });

  it("prefers LocalAppData runtime logs when both current and legacy locations exist", () => {
    const resolvedSourcePath = runPowerShell(
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "& {",
          `  . ${toPowerShellString(helperPath)}`,
          "  Resolve-OnlySpeechRuntimeLogSourcePath `",
          "    -RequestedPath '' `",
          "    -ExistingPaths @(",
          "      'C:\\Users\\Installer\\AppData\\Roaming\\OnlySpeech\\logs',",
          "      'C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\logs'",
          "    ) `",
          "    -LocalAppData 'C:\\Users\\Installer\\AppData\\Local'",
          "}"
        ].join("\n")
      ]
    );

    expect(resolvedSourcePath).toBe("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\logs");
  });

  it("falls back to the canonical LocalAppData runtime log path when no log directory exists yet", () => {
    const resolvedSourcePath = runPowerShell(
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "& {",
          `  . ${toPowerShellString(helperPath)}`,
          "  Resolve-OnlySpeechRuntimeLogSourcePath `",
          "    -RequestedPath '' `",
          "    -ExistingPaths @() `",
          "    -LocalAppData 'C:\\Users\\Installer\\AppData\\Local'",
          "}"
        ].join("\n")
      ]
    );

    expect(resolvedSourcePath).toBe("C:\\Users\\Installer\\AppData\\Local\\OnlySpeech\\logs");
  });

  it("derives the canonical LocalAppData root when the env var is missing", () => {
    const resolvedLocalAppData = runPowerShell(
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "& {",
          `  . ${toPowerShellString(helperPath)}`,
          "  Resolve-OnlySpeechCanonicalLocalAppDataPath `",
          "    -LocalAppData '' `",
          "    -SpecialFolderPath 'C:\\Users\\Installer\\AppData\\Local'",
          "}"
        ].join("\n")
      ]
    );

    expect(resolvedLocalAppData).toBe("C:\\Users\\Installer\\AppData\\Local");
  });
});

describeWindows("manage-runtime-logs.ps1", () => {
  it("reports the canonical LocalAppData runtime log path even before logs exist", () => {
    const localAppDataRoot = createTempDirectory("onlyspeech-empty-localappdata");
    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      runtimeLogsScriptPath,
      "-Mode",
      "report"
    ], {
      LOCALAPPDATA: localAppDataRoot
    });

    expect(output).toContain(`[runtime-logs] source=${join(localAppDataRoot, "OnlySpeech", "logs")}`);
    expect(output).toContain("[runtime-logs] files=0");
  });

  it("exports runtime jsonl files to the requested directory", () => {
    const sourceDirectory = createTempDirectory("onlyspeech-runtime-source");
    const exportDirectory = createTempDirectory("onlyspeech-runtime-export");

    writeFileSync(join(sourceDirectory, "2026-03-26.jsonl"), '{"event":"a"}\n', "utf8");
    writeFileSync(join(sourceDirectory, "2026-03-27.jsonl"), '{"event":"b"}\n', "utf8");
    writeFileSync(join(sourceDirectory, "ignore.txt"), "nope", "utf8");

    runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      runtimeLogsScriptPath,
      "-Mode",
      "export",
      "-SourcePath",
      sourceDirectory,
      "-ExportDirectory",
      exportDirectory
    ]);

    expect(readdirSync(exportDirectory).sort()).toEqual(["2026-03-26.jsonl", "2026-03-27.jsonl"]);
    expect(readFileSync(join(exportDirectory, "2026-03-26.jsonl"), "utf8")).toBe('{"event":"a"}\n');
    expect(readFileSync(join(exportDirectory, "2026-03-27.jsonl"), "utf8")).toBe('{"event":"b"}\n');
  });

  it("removes only log files older than the retention threshold", () => {
    const sourceDirectory = createTempDirectory("onlyspeech-runtime-cleanup");
    const oldLogPath = join(sourceDirectory, "2026-03-01.jsonl");
    const recentLogPath = join(sourceDirectory, "2026-03-27.jsonl");

    writeFileSync(oldLogPath, '{"event":"old"}\n', "utf8");
    writeFileSync(recentLogPath, '{"event":"recent"}\n', "utf8");
    utimesSync(oldLogPath, new Date("2026-03-01T00:00:00Z"), new Date("2026-03-01T00:00:00Z"));
    utimesSync(recentLogPath, new Date(), new Date());

    runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      runtimeLogsScriptPath,
      "-Mode",
      "cleanup",
      "-SourcePath",
      sourceDirectory,
      "-OlderThanDays",
      "14"
    ]);

    expect(existsSync(oldLogPath)).toBe(false);
    expect(existsSync(recentLogPath)).toBe(true);
  });
});

describeWindows("write-commissioning-artifact.ps1", () => {
  it("writes a canonical target-station validation template when requested", () => {
    const outputDirectory = createTempDirectory("onlyspeech-commissioning-template");
    const templatePath = join(outputDirectory, "target-station-validation.template.json");
    const outputPath = join(outputDirectory, "commissioning-evidence.json");
    const canonicalValidationPath = join(repoRoot, "artifacts", "logs", "target-station-validation.json");
    const previousCanonicalValidation = existsSync(canonicalValidationPath)
      ? readFileSync(canonicalValidationPath, "utf8")
      : null;

    if (previousCanonicalValidation !== null) {
      rmSync(canonicalValidationPath, { force: true });
    }

    try {
      const result = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          commissioningArtifactScriptPath,
          "-OutputPath",
          outputPath,
          "-SkipDoctor",
          "-SkipRuntimeLogExport",
          "-WriteTargetStationValidationTemplatePath",
          templatePath
        ],
        {
          cwd: repoRoot,
          encoding: "utf8"
        }
      );

      if (result.status !== 0) {
        throw new Error(
          [
            `PowerShell command failed with exit code ${result.status}.`,
            result.stdout.trim(),
            result.stderr.trim()
          ]
            .filter((value) => value.length > 0)
            .join("\n")
        );
      }

      const template = JSON.parse(readFileSync(templatePath, "utf8").replace(/^\uFEFF/, "")) as {
        schema_version: number;
        checks: Array<{ id: string; status: string; description: string; checked_at: null; notes: null }>;
      };
      const artifact = JSON.parse(readFileSync(outputPath, "utf8").replace(/^\uFEFF/, "")) as {
        target_station_validation: { template_path: string; summary: { pending: number; total: number } };
      };

      expect(template.schema_version).toBe(1);
      expect(template.checks).toHaveLength(10);
      expect(template.checks[0]).toMatchObject({
        id: "fullscreen-displays",
        status: "pending"
      });
      expect(template.checks.at(-1)).toMatchObject({
        id: "touch-input",
        status: "pending"
      });
      expect(normalizeExistingPath(artifact.target_station_validation.template_path)).toBe(
        normalizeExistingPath(templatePath)
      );
      expect(artifact.target_station_validation.summary).toMatchObject({
        total: 10,
        pending: 10
      });
    } finally {
      if (previousCanonicalValidation !== null) {
        writeFileSync(canonicalValidationPath, previousCanonicalValidation, "utf8");
      }
    }
  });

  it("merges manual target-station validation results into the commissioning artifact", () => {
    const appDataRoot = createTempDirectory("onlyspeech-appdata");
    const localAppDataRoot = createTempDirectory("onlyspeech-localappdata");
    const runtimeLogsDirectory = join(localAppDataRoot, "OnlySpeech", "logs");
    const outputDirectory = createTempDirectory("onlyspeech-commissioning");
    const validationPath = join(outputDirectory, "target-station-validation.json");
    const outputPath = join(outputDirectory, "commissioning-evidence.json");
    mkdirSync(runtimeLogsDirectory, { recursive: true });
    writeFileSync(join(runtimeLogsDirectory, "2026-03-28.jsonl"), '{"event":"runtime"}\n', "utf8");
    writeFileSync(
      validationPath,
      JSON.stringify(
        {
          station_id: "station-a",
          validated_by: "Installer",
          notes: "Validated during onsite commissioning.",
          checks: [
            {
              id: "fullscreen-displays",
              status: "passed",
              checked_at: "2026-03-28T17:10:00",
              notes: "Both displays entered fullscreen."
            },
            {
              id: "touch-input",
              status: "failed",
              notes: "Secondary panel touch input not detected."
            }
          ]
        },
        null,
        2
      ),
      "utf8"
    );

    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        commissioningArtifactScriptPath,
        "-OutputPath",
        outputPath,
        "-SkipDoctor",
        "-SkipRuntimeLogExport",
        "-TargetStationValidationPath",
        validationPath
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          APPDATA: appDataRoot,
          LOCALAPPDATA: localAppDataRoot
        }
      }
    );

    if (result.status !== 0) {
      throw new Error(
        [
          `PowerShell command failed with exit code ${result.status}.`,
          result.stdout.trim(),
          result.stderr.trim()
        ]
          .filter((value) => value.length > 0)
          .join("\n")
      );
    }

    const artifact = JSON.parse(readFileSync(outputPath, "utf8").replace(/^\uFEFF/, "")) as {
      runtime_logs: { file_count: number; export_skipped: boolean };
      target_station_validation: {
        template_path: string | null;
        source_path: string;
        metadata: { station_id?: string; validated_by?: string; notes?: string };
        summary: { total: number; pending: number; passed: number; failed: number; not_applicable: number };
        checks: Array<{ id: string; status: string; notes?: string; checked_at?: string }>;
      };
      remaining_target_station_checks: Array<{ id: string; status: string }>;
    };

    expect(artifact.runtime_logs.file_count).toBe(1);
    expect(artifact.runtime_logs.export_skipped).toBe(true);
    expect(artifact.target_station_validation.template_path).toBeNull();
    expect(normalizeExistingPath(artifact.target_station_validation.source_path)).toBe(
      normalizeExistingPath(validationPath)
    );
    expect(artifact.target_station_validation.metadata).toEqual({
      station_id: "station-a",
      validated_by: "Installer",
      notes: "Validated during onsite commissioning."
    });
    expect(artifact.target_station_validation.summary).toEqual({
      total: 10,
      pending: 8,
      passed: 1,
      failed: 1,
      not_applicable: 0
    });
    expect(
      artifact.target_station_validation.checks.find((check) => check.id === "fullscreen-displays")
    ).toMatchObject({
      id: "fullscreen-displays",
      status: "passed",
      checked_at: "2026-03-28T17:10:00",
      notes: "Both displays entered fullscreen."
    });
    expect(artifact.target_station_validation.checks.find((check) => check.id === "touch-input")).toMatchObject({
      id: "touch-input",
      status: "failed",
      notes: "Secondary panel touch input not detected."
    });
    expect(artifact.remaining_target_station_checks).not.toContainEqual(
      expect.objectContaining({ id: "fullscreen-displays" })
    );
    expect(artifact.remaining_target_station_checks).toContainEqual(
      expect.objectContaining({ id: "touch-input", status: "failed" })
    );
  });

  it("uses the canonical retained validation file when no override path is passed", () => {
    const outputDirectory = createTempDirectory("onlyspeech-commissioning-canonical");
    const outputPath = join(outputDirectory, "commissioning-evidence.json");
    const canonicalValidationDirectory = join(repoRoot, "artifacts", "logs");
    const canonicalValidationPath = join(canonicalValidationDirectory, "target-station-validation.json");
    const previousCanonicalValidation = existsSync(canonicalValidationPath)
      ? readFileSync(canonicalValidationPath, "utf8")
      : null;

    mkdirSync(canonicalValidationDirectory, { recursive: true });
    writeFileSync(
      canonicalValidationPath,
      JSON.stringify(
        {
          station_id: "canonical-station",
          checks: [
            {
              id: "runtime-log-review",
              status: "passed",
              notes: "Runtime log inventory reviewed."
            }
          ]
        },
        null,
        2
      ),
      "utf8"
    );

    try {
      const result = spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          commissioningArtifactScriptPath,
          "-OutputPath",
          outputPath,
          "-SkipDoctor",
          "-SkipRuntimeLogExport"
        ],
        {
          cwd: repoRoot,
          encoding: "utf8"
        }
      );

      if (result.status !== 0) {
        throw new Error(
          [
            `PowerShell command failed with exit code ${result.status}.`,
            result.stdout.trim(),
            result.stderr.trim()
          ]
            .filter((value) => value.length > 0)
            .join("\n")
        );
      }

      const artifact = JSON.parse(readFileSync(outputPath, "utf8").replace(/^\uFEFF/, "")) as {
        target_station_validation: {
          source_path: string;
          metadata: { station_id?: string };
          summary: { pending: number; passed: number; total: number };
        };
        remaining_target_station_checks: Array<{ id: string; status: string }>;
      };

      expect(normalizeExistingPath(artifact.target_station_validation.source_path)).toBe(
        normalizeExistingPath(canonicalValidationPath)
      );
      expect(artifact.target_station_validation.metadata).toEqual({
        station_id: "canonical-station"
      });
      expect(artifact.target_station_validation.summary).toEqual({
        total: 10,
        pending: 9,
        passed: 1,
        failed: 0,
        not_applicable: 0
      });
      expect(artifact.remaining_target_station_checks).not.toContainEqual(
        expect.objectContaining({ id: "runtime-log-review" })
      );
    } finally {
      if (previousCanonicalValidation === null) {
        rmSync(canonicalValidationPath, { force: true });
      } else {
        writeFileSync(canonicalValidationPath, previousCanonicalValidation, "utf8");
      }
    }
  });
});

describeWindows("workstation-runtime-doctor.ps1", () => {
  it("keeps endpoint microphone matching aligned with the runtime fallback chain", () => {
    const script = readFileSync(workstationRuntimeDoctorScriptPath, "utf8");

    expect(script).toContain("const sameRoleAndLabel = devices.filter((device) => {");
    expect(script).toContain("const sameNormalizedLabel = devices.filter(");
    expect(script).toContain("const sameRole = devices.filter((device) => getAudioInputRole(device.label) === role);");
  });

  it("replays the structured diagnostics payload even when the Electron process emits only stderr noise", () => {
    const fakeRepoRoot = createTempDirectory("onlyspeech-runtime-doctor-repo");
    const fakeElectronDirectory = join(fakeRepoRoot, "node_modules", "electron");
    mkdirSync(fakeElectronDirectory, { recursive: true });

    writeFileSync(
      join(fakeElectronDirectory, "cli.js"),
      [
        "const { writeFileSync, mkdirSync } = require('node:fs');",
        "const { dirname } = require('node:path');",
        "const outputPath = process.env.ONLYSPEECH_RUNTIME_DOCTOR_OUTPUT_PATH;",
        "const profileRoot = process.env.ONLYSPEECH_RUNTIME_DOCTOR_PROFILE_ROOT;",
        "if (!outputPath) {",
        "  console.error('missing output path');",
        "  process.exit(1);",
        "}",
        "if (profileRoot) {",
        "  mkdirSync(profileRoot, { recursive: true });",
        "}",
        "mkdirSync(dirname(outputPath), { recursive: true });",
        "writeFileSync(outputPath, JSON.stringify({ ok: true, source: 'file' }) + '\\n', 'utf8');",
        "console.error('[fake-electron] cache warning');"
      ].join('\n'),
      "utf8"
    );

    const output = runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      [
        "& {",
        `  . ${toPowerShellString(workstationRuntimeDoctorScriptPath)}`,
        `  Invoke-WorkstationRuntimeDoctor -RepoRoot ${toPowerShellString(fakeRepoRoot)} -ForwardedArguments @('--json')`,
        "}"
      ].join("\n")
    ]);

    expect(extractLastJsonObject(output)).toEqual({
      ok: true,
      source: "file"
    });
  });
});
