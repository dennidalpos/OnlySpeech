$repoHelpersPath = Join-Path $PSScriptRoot "..\lib\repo.ps1"
. $repoHelpersPath

function Get-EmbeddedRuntimeDoctorScript {
  return @'
import { app, BrowserWindow, screen, session } from "electron";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const NON_SELECTABLE_DEVICE_IDS = new Set(["default", "communications"]);
const PERSISTED_MICROPHONE_GROUP_PREFIX = "group:";
const PERSISTED_MICROPHONE_ENDPOINT_PREFIX = "endpoint:";
const PERSISTED_MICROPHONE_LABEL_PREFIX = "label:";
const AUDIO_PROBE_TIMEOUT_MS = 5000;
const outputPath = process.env.ONLYSPEECH_RUNTIME_DOCTOR_OUTPUT_PATH?.trim() || null;
const profileRoot = process.env.ONLYSPEECH_RUNTIME_DOCTOR_PROFILE_ROOT?.trim() || null;

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

if (profileRoot) {
  const userDataPath = join(profileRoot, "user-data");
  const sessionDataPath = join(profileRoot, "session-data");
  const cachePath = join(profileRoot, "cache");
  const gpuCachePath = join(profileRoot, "gpu-cache");

  mkdirSync(userDataPath, { recursive: true });
  mkdirSync(sessionDataPath, { recursive: true });
  mkdirSync(cachePath, { recursive: true });
  mkdirSync(gpuCachePath, { recursive: true });

  app.setPath("userData", userDataPath);
  app.setPath("sessionData", sessionDataPath);
  app.setPath("cache", cachePath);
  app.commandLine.appendSwitch("disk-cache-dir", gpuCachePath);
}

function parseArgs(args = process.argv.slice(2)) {
  const options = {
    json: false,
    requiredMonitors: 2,
    requiredMicrophones: 2,
    microphonePttMode: "dual-dedicated",
    displayAId: process.env.ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_A_ID?.trim() || null,
    displayBId: process.env.ONLYSPEECH_RUNTIME_DOCTOR_DISPLAY_B_ID?.trim() || null,
    micAId: process.env.ONLYSPEECH_RUNTIME_DOCTOR_MIC_A_ID?.trim() || null,
    micBId: process.env.ONLYSPEECH_RUNTIME_DOCTOR_MIC_B_ID?.trim() || null
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--json") {
      options.json = true;
      continue;
    }

    const nextValue = args[index + 1] ?? "";
    const assignString = (key) => {
      options[key] = nextValue.trim() || null;
      index += 1;
    };
    const assignInteger = (key) => {
      const parsedValue = Number.parseInt(nextValue, 10);
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        throw new Error(`Invalid value '${nextValue}' for ${argument}.`);
      }

      options[key] = parsedValue;
      index += 1;
    };

    switch (argument) {
      case "--required-monitors":
        assignInteger("requiredMonitors");
        break;
      case "--required-microphones":
        assignInteger("requiredMicrophones");
        break;
      case "--microphone-ptt-mode":
        assignString("microphonePttMode");
        break;
      case "--display-a-id":
        assignString("displayAId");
        break;
      case "--display-b-id":
        assignString("displayBId");
        break;
      case "--mic-a-id":
        assignString("micAId");
        break;
      case "--mic-b-id":
        assignString("micBId");
        break;
      default:
        throw new Error(`Unsupported workstation-runtime-doctor argument '${argument}'.`);
    }
  }

  return options;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function sortDisplays(displays) {
  return [...displays].sort((left, right) => {
    if (left.bounds.x !== right.bounds.x) {
      return left.bounds.x - right.bounds.x;
    }

    return left.bounds.y - right.bounds.y;
  });
}

function collectDisplays() {
  return sortDisplays(
    screen.getAllDisplays().map((display) => ({
      displayId: display.id,
      label: display.label || `Display ${display.id}`,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height
      },
      scaleFactor: display.scaleFactor
    }))
  );
}

function filterSelectableMicrophones(devices) {
  const normalizeMicrophoneLabel = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(?:audio|device|input|capture|endpoint)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const getAudioInputRole = (label) => {
    const normalized = ` ${normalizeMicrophoneLabel(label)} `;
    if (
      normalized.includes(" stereo mix ") ||
      normalized.includes(" loopback ") ||
      normalized.includes(" what u hear ") ||
      normalized.includes(" what you hear ") ||
      normalized.includes(" cable output ") ||
      normalized.includes(" voicemeter ")
    ) {
      return "virtual-loopback";
    }
    if (normalized.includes(" front mic ") || normalized.includes(" front microphone ")) {
      return "front-mic";
    }
    if (normalized.includes(" rear mic ") || normalized.includes(" rear microphone ")) {
      return "rear-mic";
    }
    if (normalized.includes(" line in ") || normalized.includes(" linein ")) {
      return "line-in";
    }
    if (normalized.includes(" microphone array ") || normalized.includes(" mic array ")) {
      return "microphone-array";
    }
    if (normalized.includes(" headset mic ") || normalized.includes(" hands free ")) {
      return "headset-mic";
    }
    if (normalized.includes(" hd audio input ") || normalized.includes(" high definition audio input ")) {
      return "hd-audio-input";
    }
    if (
      normalized.includes(" microphone ") ||
      normalized.includes(" microfono ") ||
      normalized.includes(" mic in ") ||
      normalized.includes(" mic input ") ||
      /\bmic\b/.test(normalized)
    ) {
      return "microphone";
    }
    return "generic-input";
  };
  const concreteDevices = devices
    .filter((device) => !NON_SELECTABLE_DEVICE_IDS.has(device.deviceId))
    .filter((device) => getAudioInputRole(device.label) !== "virtual-loopback")
    .filter((device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index);

  if (concreteDevices.length > 0) {
    return concreteDevices;
  }

  return devices.filter(
    (device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index
  );
}

function sortMicrophones(devices) {
  return [...devices].sort((left, right) => {
    const leftKey = `${left.label}|${left.deviceId}`;
    const rightKey = `${right.label}|${right.deviceId}`;
    return leftKey.localeCompare(rightKey, "it");
  });
}

function matchesConfiguredMicrophone(device, configuredValue) {
  if (!configuredValue) {
    return false;
  }

  const normalizeMicrophoneLabel = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(?:audio|device|input|capture|endpoint)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const getAudioInputRole = (label) => {
    const normalized = ` ${normalizeMicrophoneLabel(label)} `;
    if (normalized.includes(" front mic ") || normalized.includes(" front microphone ")) {
      return "front-mic";
    }
    if (normalized.includes(" rear mic ") || normalized.includes(" rear microphone ")) {
      return "rear-mic";
    }
    if (normalized.includes(" line in ") || normalized.includes(" linein ")) {
      return "line-in";
    }
    if (normalized.includes(" microphone array ") || normalized.includes(" mic array ")) {
      return "microphone-array";
    }
    if (normalized.includes(" headset mic ") || normalized.includes(" hands free ")) {
      return "headset-mic";
    }
    if (normalized.includes(" hd audio input ") || normalized.includes(" high definition audio input ")) {
      return "hd-audio-input";
    }
    if (
      normalized.includes(" microphone ") ||
      normalized.includes(" microfono ") ||
      normalized.includes(" mic in ") ||
      normalized.includes(" mic input ") ||
      /\bmic\b/.test(normalized)
    ) {
      return "microphone";
    }
    return "generic-input";
  };
  return (
    device.deviceId === configuredValue ||
    device.label === configuredValue ||
    (device.groupId && configuredValue === `${PERSISTED_MICROPHONE_GROUP_PREFIX}${device.groupId}`) ||
    (() => {
      if (!configuredValue.startsWith(PERSISTED_MICROPHONE_LABEL_PREFIX)) {
        return false;
      }
      try {
        return normalizeMicrophoneLabel(device.label) === decodeURIComponent(configuredValue.slice(PERSISTED_MICROPHONE_LABEL_PREFIX.length));
      } catch {
        return false;
      }
    })() ||
    (() => {
      if (!configuredValue.startsWith(PERSISTED_MICROPHONE_ENDPOINT_PREFIX)) {
        return false;
      }
      const parts = configuredValue.slice(PERSISTED_MICROPHONE_ENDPOINT_PREFIX.length).split(":");
      if (parts.length !== 3) {
        return false;
      }
      try {
        return (
          device.groupId === decodeURIComponent(parts[0]) &&
          getAudioInputRole(device.label) === decodeURIComponent(parts[1]) &&
          normalizeMicrophoneLabel(device.label) === decodeURIComponent(parts[2])
        );
      } catch {
        return false;
      }
    })()
  );
}

function findConfiguredDevice(devices, configuredValue) {
  if (!configuredValue) {
    return null;
  }

  const directMatch = devices.find((device) => matchesConfiguredMicrophone(device, configuredValue));
  if (directMatch) {
    return directMatch;
  }

  if (configuredValue.startsWith(PERSISTED_MICROPHONE_ENDPOINT_PREFIX)) {
    const parts = configuredValue.slice(PERSISTED_MICROPHONE_ENDPOINT_PREFIX.length).split(":");
    if (parts.length === 3) {
      try {
        const groupId = decodeURIComponent(parts[0]);
        const role = decodeURIComponent(parts[1]);
        const normalizedLabel = decodeURIComponent(parts[2]);
        const normalizeMicrophoneLabel = (value) =>
          String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[()]/g, " ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\b(?:audio|device|input|capture|endpoint)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const getAudioInputRole = (label) => {
          const normalized = ` ${normalizeMicrophoneLabel(label)} `;
          if (normalized.includes(" front mic ") || normalized.includes(" front microphone ")) {
            return "front-mic";
          }
          if (normalized.includes(" rear mic ") || normalized.includes(" rear microphone ")) {
            return "rear-mic";
          }
          if (normalized.includes(" line in ") || normalized.includes(" linein ")) {
            return "line-in";
          }
          if (normalized.includes(" microphone array ") || normalized.includes(" mic array ")) {
            return "microphone-array";
          }
          if (normalized.includes(" headset mic ") || normalized.includes(" hands free ")) {
            return "headset-mic";
          }
          if (normalized.includes(" hd audio input ") || normalized.includes(" high definition audio input ")) {
            return "hd-audio-input";
          }
          if (
            normalized.includes(" microphone ") ||
            normalized.includes(" microfono ") ||
            normalized.includes(" mic in ") ||
            normalized.includes(" mic input ") ||
            /\bmic\b/.test(normalized)
          ) {
            return "microphone";
          }
          return "generic-input";
        };
        const sameGroup = devices.filter((device) => device.groupId === groupId);
        const sameGroupRole = sameGroup.filter((device) => getAudioInputRole(device.label) === role);
        if (sameGroupRole.length === 1) {
          return sameGroupRole[0];
        }
        if (sameGroup.length === 1) {
          return sameGroup[0];
        }
        const sameRoleAndLabel = devices.filter((device) => {
          const deviceRole = getAudioInputRole(device.label);
          const deviceLabel = normalizeMicrophoneLabel(device.label);
          return deviceRole === role && deviceLabel === normalizedLabel;
        });
        if (sameRoleAndLabel.length === 1) {
          return sameRoleAndLabel[0];
        }
        const sameNormalizedLabel = devices.filter(
          (device) => normalizeMicrophoneLabel(device.label) === normalizedLabel
        );
        if (sameNormalizedLabel.length === 1) {
          return sameNormalizedLabel[0];
        }
        const sameRole = devices.filter((device) => getAudioInputRole(device.label) === role);
        if (sameRole.length === 1) {
          return sameRole[0];
        }
      } catch {}
    }
  }

  if (configuredValue.startsWith(PERSISTED_MICROPHONE_GROUP_PREFIX)) {
    const groupId = configuredValue.slice(PERSISTED_MICROPHONE_GROUP_PREFIX.length);
    const matches = devices.filter((device) => device.groupId === groupId);
    return matches.length === 1 ? matches[0] : null;
  }

  return null;
}

function resolveDisplayAssignments(displays, options) {
  const configuredDisplayA = options.displayAId ? Number.parseInt(options.displayAId, 10) : null;
  const configuredDisplayB = options.displayBId ? Number.parseInt(options.displayBId, 10) : null;
  const configuredA = Number.isFinite(configuredDisplayA)
    ? displays.find((display) => display.displayId === configuredDisplayA) ?? null
    : null;
  const configuredB = Number.isFinite(configuredDisplayB)
    ? displays.find((display) => display.displayId === configuredDisplayB) ?? null
    : null;
  const displayA = configuredA ?? displays[0] ?? null;
  const displayB =
    (configuredB && configuredB.displayId !== displayA?.displayId ? configuredB : null) ??
    displays.find((display) => display.displayId !== displayA?.displayId) ??
    null;

  const assignments = [];
  if (displayA) {
    assignments.push({ side: "A", displayId: displayA.displayId, label: displayA.label });
  }

  if (displayB) {
    assignments.push({ side: "B", displayId: displayB.displayId, label: displayB.label });
  }

  const issues = [];
  if (displays.length < options.requiredMonitors) {
    issues.push("Fewer than the required monitors are active.");
  }

  if (options.displayAId && !configuredA) {
    issues.push(`Configured DISPLAY_A_ID '${options.displayAId}' is not currently available.`);
  }

  if (options.displayBId && !configuredB) {
    issues.push(`Configured DISPLAY_B_ID '${options.displayBId}' is not currently available.`);
  }

  return { assignments, issues };
}

function resolveMicrophoneAssignments(devices, options) {
  const uniqueDevices = sortMicrophones(filterSelectableMicrophones(devices));
  const microphonePttMode = options.microphonePttMode ?? "dual-dedicated";
  const oneMicFallbackActive =
    microphonePttMode === "dual-dedicated" &&
    uniqueDevices.length === 1 &&
    options.requiredMicrophones >= 2;
  const sharedMicrophoneMode = oneMicFallbackActive || microphonePttMode === "single-shared";
  const requiresConfiguredMicA = Boolean(options.micAId) && !oneMicFallbackActive;
  const requiresConfiguredMicB = Boolean(options.micBId) && !oneMicFallbackActive;
  let microphoneA = findConfiguredDevice(uniqueDevices, options.micAId);
  let microphoneB = findConfiguredDevice(uniqueDevices, options.micBId);

  if (oneMicFallbackActive) {
    microphoneA = uniqueDevices[0] ?? null;
    microphoneB = microphoneA;
  } else {
    if (!microphoneA && !requiresConfiguredMicA) {
      microphoneA = uniqueDevices[0] ?? null;
    }

    if (!microphoneB && !requiresConfiguredMicB) {
      microphoneB = sharedMicrophoneMode
        ? microphoneA
        : (uniqueDevices.find((device) => device.deviceId !== microphoneA?.deviceId) ?? null);
    }

    if (!sharedMicrophoneMode && microphoneA && microphoneB && microphoneA.deviceId === microphoneB.deviceId) {
      microphoneB = null;
    }
  }

  const assignments = [];
  if (microphoneA) {
    assignments.push({ side: "A", deviceId: microphoneA.deviceId, label: microphoneA.label });
  }

  if (microphoneB) {
    assignments.push({ side: "B", deviceId: microphoneB.deviceId, label: microphoneB.label });
  }

  const issues = [];
  if (!oneMicFallbackActive && uniqueDevices.length < options.requiredMicrophones) {
    issues.push("Fewer than the required assignable microphones are available.");
  }

  if (options.micAId && !oneMicFallbackActive && !findConfiguredDevice(uniqueDevices, options.micAId)) {
    issues.push(`Configured MIC_A_ID '${options.micAId}' is not currently available.`);
  }

  if (options.micBId && !oneMicFallbackActive && !findConfiguredDevice(uniqueDevices, options.micBId)) {
    issues.push(`Configured MIC_B_ID '${options.micBId}' is not currently available.`);
  }

  if (!sharedMicrophoneMode && microphoneA && !microphoneB && options.requiredMicrophones >= 2) {
    issues.push("Only one distinct microphone is currently assignable.");
  }

  return {
    allDevices: sortMicrophones(
      devices.filter(
        (device, index, all) => all.findIndex((candidate) => candidate.deviceId === device.deviceId) === index
      )
    ),
    assignableDevices: uniqueDevices,
    assignments,
    issues
  };
}

async function probeAudioInputs() {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html><body></body></html>");
  });

  const port = await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind workstation runtime doctor server."));
        return;
      }

      resolve(address.port);
    });
  });

  const hiddenWindow = new BrowserWindow({
    show: false,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false
    }
  });

  try {
    await withTimeout(
      hiddenWindow.loadURL(`http://127.0.0.1:${port}/`),
      AUDIO_PROBE_TIMEOUT_MS,
      "Timed out while opening the workstation runtime doctor probe window."
    );
    return await withTimeout(
      hiddenWindow.webContents.executeJavaScript(
        `(async () => {
        const stopStream = (stream) => {
          for (const track of stream.getTracks()) {
            track.stop();
          }
        };

        if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.enumerateDevices) {
          return {
            permissionGranted: false,
            error: "Browser media devices are not available in this Electron runtime.",
            devices: []
          };
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          stopStream(stream);
          const devices = (await navigator.mediaDevices.enumerateDevices())
            .filter((device) => device.kind === "audioinput")
            .map((device) => ({
              deviceId: device.deviceId,
              groupId: device.groupId,
              label: device.label || "Microfono senza nome"
            }));

          return {
            permissionGranted: true,
            error: null,
            devices
          };
        } catch (error) {
          return {
            permissionGranted: false,
            error: error instanceof Error ? error.message : String(error),
            devices: []
          };
        }
      })()`,
        true
      ),
      AUDIO_PROBE_TIMEOUT_MS,
      "Timed out while probing microphone permissions and audio devices."
    );
  } finally {
    if (!hiddenWindow.isDestroyed()) {
      hiddenWindow.destroy();
    }

    await new Promise((resolve) => {
      server.close(() => resolve(undefined));
    });
  }
}

async function run() {
  const options = parseArgs();

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === "media");
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media");
  });

  const displays = collectDisplays();
  const displayDiagnostics = resolveDisplayAssignments(displays, options);
  const audioProbe = await probeAudioInputs().catch((error) => ({
    permissionGranted: false,
    error: error instanceof Error ? error.message : String(error),
    devices: []
  }));
  const microphoneDiagnostics = resolveMicrophoneAssignments(audioProbe.devices, options);

  const summary = {
    displays,
    displayAssignments: displayDiagnostics.assignments,
    displayIssues: displayDiagnostics.issues,
    microphonePermissionGranted: audioProbe.permissionGranted,
    microphoneError: audioProbe.error,
    microphones: microphoneDiagnostics.allDevices,
    assignableMicrophones: microphoneDiagnostics.assignableDevices,
    microphoneAssignments: microphoneDiagnostics.assignments,
    microphoneIssues: microphoneDiagnostics.issues
  };

  const serializedSummary = options.json ? JSON.stringify(summary) : JSON.stringify(summary, null, 2);

  if (outputPath) {
    writeFileSync(outputPath, `${serializedSummary}\n`, "utf8");
  } else {
    process.stdout.write(`${serializedSummary}\n`);
  }
}

app.whenReady()
  .then(run)
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    app.quit();
  });
'@
}

function Invoke-WorkstationRuntimeDoctor {
  param(
    [string[]]$ForwardedArguments = @(),
    [string]$RepoRoot = (Resolve-OnlySpeechRepoRoot -ScriptRoot $PSScriptRoot)
  )

  $electronCliPath = Join-Path $RepoRoot "node_modules\electron\cli.js"
  $electronExecutablePath = Join-Path $RepoRoot "node_modules\electron\dist\electron.exe"
  if (-not (Test-Path -LiteralPath $electronCliPath)) {
    throw "Electron runtime files are missing. Run npm run bootstrap."
  }

  $tempScriptPath = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-workstation-runtime-doctor-$([guid]::NewGuid()).mjs"
  $tempOutputPath = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-workstation-runtime-doctor-$([guid]::NewGuid()).json"
  $tempProfileRoot = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-workstation-runtime-doctor-$([guid]::NewGuid())"
  $tempStdoutPath = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-workstation-runtime-doctor-$([guid]::NewGuid()).stdout.log"
  $tempStderrPath = Join-Path ([System.IO.Path]::GetTempPath()) "onlyspeech-workstation-runtime-doctor-$([guid]::NewGuid()).stderr.log"
  Set-Content -LiteralPath $tempScriptPath -Value (Get-EmbeddedRuntimeDoctorScript) -Encoding UTF8

  $previousOutputPath = $env:ONLYSPEECH_RUNTIME_DOCTOR_OUTPUT_PATH
  $previousProfileRoot = $env:ONLYSPEECH_RUNTIME_DOCTOR_PROFILE_ROOT
  $env:ONLYSPEECH_RUNTIME_DOCTOR_OUTPUT_PATH = $tempOutputPath
  $env:ONLYSPEECH_RUNTIME_DOCTOR_PROFILE_ROOT = $tempProfileRoot

  try {
    if (Test-Path -LiteralPath $electronExecutablePath) {
      $startArguments = @($tempScriptPath) + $ForwardedArguments
      $process = Start-Process `
        -FilePath $electronExecutablePath `
        -ArgumentList $startArguments `
        -WorkingDirectory $RepoRoot `
        -RedirectStandardOutput $tempStdoutPath `
        -RedirectStandardError $tempStderrPath `
        -PassThru `
        -Wait `
        -NoNewWindow
      $exitCode = $process.ExitCode
    } else {
      & node $electronCliPath $tempScriptPath @ForwardedArguments
      $exitCode = $LASTEXITCODE
    }

    $global:LASTEXITCODE = $exitCode

    if (Test-Path -LiteralPath $tempOutputPath) {
      Get-Content -LiteralPath $tempOutputPath -Raw | Write-Output
    } elseif (Test-Path -LiteralPath $tempStdoutPath) {
      Get-Content -LiteralPath $tempStdoutPath -Raw | Write-Output
    }

    if ($exitCode -ne 0 -and (Test-Path -LiteralPath $tempStderrPath)) {
      $stderrContent = Get-Content -LiteralPath $tempStderrPath -Raw
      if (-not [string]::IsNullOrWhiteSpace($stderrContent)) {
        $stderrContent | Write-Output
      }
    }
  } finally {
    $env:ONLYSPEECH_RUNTIME_DOCTOR_OUTPUT_PATH = $previousOutputPath
    $env:ONLYSPEECH_RUNTIME_DOCTOR_PROFILE_ROOT = $previousProfileRoot

    if (Test-Path -LiteralPath $tempScriptPath) {
      Remove-Item -LiteralPath $tempScriptPath -Force
    }

    if (Test-Path -LiteralPath $tempOutputPath) {
      Remove-Item -LiteralPath $tempOutputPath -Force
    }

    if (Test-Path -LiteralPath $tempProfileRoot) {
      Remove-Item -LiteralPath $tempProfileRoot -Recurse -Force
    }

    if (Test-Path -LiteralPath $tempStdoutPath) {
      Remove-Item -LiteralPath $tempStdoutPath -Force
    }

    if (Test-Path -LiteralPath $tempStderrPath) {
      Remove-Item -LiteralPath $tempStderrPath -Force
    }
  }
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-WorkstationRuntimeDoctor -ForwardedArguments $args
  exit $LASTEXITCODE
}
