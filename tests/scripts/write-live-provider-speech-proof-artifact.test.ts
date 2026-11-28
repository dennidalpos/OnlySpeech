import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts", "support", "commissioning", "write-live-provider-speech-proof-artifact.ps1");
const tempDirectories: string[] = [];

function createTempDirectory(name: string): string {
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), `${name}-`)));
  tempDirectories.push(directory);
  return directory;
}

function runPowerShellJson(script: string): unknown {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { cwd: repoRoot, encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
  }

  return JSON.parse(result.stdout.trim());
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("New-LiveProviderSpeechProofArtifact", () => {
  it("writes a deterministic live-provider speech proof template with env readiness hints", () => {
    const tempRepo = createTempDirectory("onlyspeech-live-provider-proof");
    const envPath = join(tempRepo, ".env");
    const localAppData = join(tempRepo, "localappdata");
    mkdirSync(localAppData, { recursive: true });

    writeFileSync(
      envPath,
      [
        "TRANSLATION_PROVIDER=chatgpt",
        "CHATGPT_API_KEY=test-key",
        "CHATGPT_MODEL=gpt-4o-mini",
        "CHATGPT_TRANSCRIBE_MODEL=whisper-1",
        "CHATGPT_TTS_MODEL=gpt-4o-mini-tts",
        "CHATGPT_TTS_VOICE=alloy",
        "TEXT_TO_SPEECH_ENABLED=true"
      ].join("\n"),
      "utf8"
    );

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const localAppDataLiteral = localAppData.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  $env:LOCALAPPDATA = '${localAppDataLiteral}'`,
        `  New-LiveProviderSpeechProofArtifact -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 12 -Compress`,
        "}"
      ].join("\n")
    ) as {
      outputPath: string;
      artifact: {
        env_readiness: {
          env_file_present: boolean;
          translation_provider: string | null;
          speech_provider: string | null;
          text_to_speech_enabled: boolean | null;
          azure: { speech_configured: boolean; translator_configured: boolean };
          chatgpt: { translation_configured: boolean; speech_configured: boolean; tts_configured: boolean };
        };
        notes: string;
        scenarios: Array<{ id: string; provider: string; status: string }>;
      };
    };

    const writtenArtifact = JSON.parse(readFileSync(result.outputPath, "utf8")) as typeof result.artifact;

    expect(result.outputPath).toBe(join(tempRepo, "artifacts", "logs", "live-provider-speech-proof.json"));
    expect(result.artifact.env_readiness).toEqual({
      env_file_present: true,
      translation_provider: "chatgpt",
      speech_provider: "chatgpt",
      text_to_speech_enabled: true,
      azure: {
        speech_configured: false,
        translator_configured: false
      },
      chatgpt: {
        translation_configured: true,
        speech_configured: true,
        tts_configured: true
      }
    });
    expect(result.artifact.notes).toContain("real workstation speech pass");
    expect(result.artifact.notes).not.toContain("WS-DP01");
    expect(result.artifact.scenarios).toHaveLength(10);
    expect(result.artifact.scenarios.every((scenario) => scenario.status === "pending")).toBe(true);
    expect(result.artifact.scenarios.map((scenario) => scenario.id)).toContain("live-microphone-validation-azure");
    expect(result.artifact.scenarios.map((scenario) => scenario.id)).toContain("final-turn-validation-chatgpt");
    expect(writtenArtifact).toEqual(result.artifact);
  });

  it("prefers the packaged runtime profile when LOCALAPPDATA contains OnlySpeech/.env", () => {
    const tempRepo = createTempDirectory("onlyspeech-live-provider-proof-packaged");
    const localAppData = join(tempRepo, "localappdata");
    const packagedEnvDirectory = join(localAppData, "OnlySpeech");
    mkdirSync(packagedEnvDirectory, { recursive: true });
    writeFileSync(join(tempRepo, ".env"), "TRANSLATION_PROVIDER=azure\n", "utf8");
    writeFileSync(
      join(packagedEnvDirectory, ".env"),
      [
        "TRANSLATION_PROVIDER=chatgpt",
        "CHATGPT_API_KEY=test-key",
        "CHATGPT_MODEL=gpt-4o-mini",
        "CHATGPT_TRANSCRIBE_MODEL=whisper-1"
      ].join("\n"),
      "utf8"
    );

    const repoLiteral = tempRepo.replace(/'/g, "''");
    const localAppDataLiteral = localAppData.replace(/'/g, "''");
    const result = runPowerShellJson(
      [
        `& { . '${scriptPath}'`,
        `  $env:LOCALAPPDATA = '${localAppDataLiteral}'`,
        `  New-LiveProviderSpeechProofArtifact -RepoRoot '${repoLiteral}' | ConvertTo-Json -Depth 12 -Compress`,
        "}"
      ].join("\n")
    ) as {
      artifact: {
        runtime_env_path: string;
        env_readiness: {
          env_file_present: boolean;
          translation_provider: string | null;
        };
      };
    };

    expect(result.artifact.runtime_env_path).toBe(join(localAppData, "OnlySpeech", ".env"));
    expect(result.artifact.env_readiness).toMatchObject({
      env_file_present: true,
      translation_provider: "chatgpt"
    });
  });

  it("writes the requested artifact path when invoked as a script", () => {
    const outputRoot = createTempDirectory("onlyspeech-live-provider-proof-script");
    const outputPath = join(outputRoot, "live-provider-speech-proof.json");

    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-OutputPath", outputPath],
      { cwd: repoRoot, encoding: "utf8" }
    );

    if (result.status !== 0) {
      throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }

    expect(result.stdout.trim()).toContain("Live provider speech proof artifact written to");
    expect(existsSync(outputPath)).toBe(true);

    const artifact = JSON.parse(readFileSync(outputPath, "utf8")) as {
      schema_version: number;
      notes: string;
      scenarios: Array<{ id: string }>;
    };

    expect(artifact.schema_version).toBe(1);
    expect(artifact.notes).not.toContain("WS-DP01");
    expect(artifact.scenarios).toHaveLength(10);
  });
});
