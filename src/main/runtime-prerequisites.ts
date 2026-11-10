import { existsSync } from "node:fs";
import { join } from "node:path";

export interface RuntimePrerequisite {
  name: string;
  ok: boolean;
  minimumVersion: string;
  reason: string;
  install: string;
  verify: string;
}

export function getPackagedRuntimePrerequisites(options: {
  platform?: NodeJS.Platform;
  arch?: string;
  systemRoot?: string;
  exists?: (path: string) => boolean;
} = {}): RuntimePrerequisite[] {
  const platform = options.platform ?? process.platform;
  const arch = options.arch ?? process.arch;
  const systemRoot = options.systemRoot ?? process.env.SystemRoot ?? "C:\\Windows";
  const pathExists = options.exists ?? existsSync;
  const system32 = join(systemRoot, "System32");

  return [
    {
      name: "Windows 10/11 x64",
      ok: platform === "win32" && arch === "x64",
      minimumVersion: "Windows 10 x64 or Windows 11 x64",
      reason: "OnlySpeech is packaged and validated as a Windows x64 Electron workstation app.",
      install: "Run OnlySpeech on an updated Windows 10 or Windows 11 x64 workstation.",
      verify: "[Environment]::Is64BitOperatingSystem"
    },
    {
      name: "Windows Media Foundation",
      ok: pathExists(join(system32, "mfplat.dll")) && pathExists(join(system32, "mfreadwrite.dll")),
      minimumVersion: "Windows 10/11 Media Feature Pack components",
      reason: "Microphone capture and live speech validation require Windows media components.",
      install: "On Windows N editions, install the official Microsoft Media Feature Pack, then reboot.",
      verify: 'Test-Path "$env:SystemRoot\\System32\\mfplat.dll"; Test-Path "$env:SystemRoot\\System32\\mfreadwrite.dll"'
    }
  ];
}

export function formatPackagedRuntimePrerequisiteFailure(
  prerequisites: RuntimePrerequisite[]
): string {
  const failures = prerequisites.filter((prerequisite) => !prerequisite.ok);
  if (failures.length === 0) {
    return "";
  }

  return [
    "OnlySpeech cannot start because this workstation is missing required software.",
    "",
    ...failures.flatMap((failure) => [
      `- ${failure.name}`,
      `  Required: ${failure.minimumVersion}`,
      `  Why: ${failure.reason}`,
      `  Install: ${failure.install}`,
      `  Verify: ${failure.verify}`
    ])
  ].join("\n");
}
