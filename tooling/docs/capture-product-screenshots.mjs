import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const electronBinary = require("electron");
const repoRoot = process.cwd();
const tempDirectories = [];
const childProcesses = new Set();

function parseArgs(argv) {
  const options = {
    outputRoot: resolve(repoRoot, "docs", "product", "screenshots")
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output-root" && argv[index + 1]) {
      options.outputRoot = resolve(repoRoot, argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

function createTempDirectory(name) {
  const directory = mkdtempSync(join(tmpdir(), `${name}-`));
  tempDirectories.push(directory);
  return directory;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function waitForCondition(factory, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolveCondition, rejectCondition) => {
    const tick = async () => {
      try {
        const value = await factory();
        if (value !== null) {
          resolveCondition(value);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          rejectCondition(new Error(`Timed out after ${timeoutMs} ms.`));
          return;
        }

        setTimeout(tick, 250);
      } catch (error) {
        rejectCondition(error);
      }
    };

    void tick();
  });
}

async function waitForAutomationPort(portFilePath) {
  return waitForCondition(() => {
    try {
      const value = readFileSync(portFilePath, "utf8").trim();
      const port = Number(value);
      return Number.isFinite(port) && port > 0 ? port : null;
    } catch {
      return null;
    }
  }, 40000);
}

async function fetchJson(port, path, init) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}.`);
  }

  return response.json();
}

function terminateChildProcess(child) {
  if (child.exitCode !== null || child.killed) {
    return;
  }

  spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
    stdio: "ignore"
  });
}

function terminateAllChildren() {
  for (const child of childProcesses) {
    terminateChildProcess(child);
  }
  childProcesses.clear();
}

function spawnElectronApp({ args, runtimeRoot }) {
  const automationRoot = createTempDirectory("onlyspeech-docs-automation");
  const appDataRoot = createTempDirectory("onlyspeech-docs-appdata");
  const localAppDataRoot = createTempDirectory("onlyspeech-docs-localappdata");
  const portFilePath = join(automationRoot, "automation-port.txt");

  const child = spawn(electronBinary, ["."].concat(args), {
    cwd: repoRoot,
    env: {
      ...process.env,
      ONLYSPEECH_TEST_AUTOMATION: "1",
      ONLYSPEECH_AUTOMATION_PORT_FILE: portFilePath,
      ONLYSPEECH_RUNTIME_ROOT: runtimeRoot,
      ONLYSPEECH_DISPLAY_FIXTURE: JSON.stringify([
        {
          id: 101,
          label: "Fixture A",
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        },
        {
          id: 202,
          label: "Fixture B",
          bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1
        }
      ]),
      APPDATA: appDataRoot,
      LOCALAPPDATA: localAppDataRoot
    },
    stdio: "pipe"
  });

  childProcesses.add(child);
  return { child, portFilePath };
}

async function captureWindow(port, request, outputPath) {
  const payload = await fetchJson(port, "/capture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  writeFileSync(outputPath, Buffer.from(payload.pngBase64, "base64"));
}

function writeDemoRuntimeEnv(runtimeRoot) {
  writeFileSync(
    join(runtimeRoot, ".env"),
    [
      "APP_MODE=demo",
      "DEMO_SLIDE_INTERVAL_SECONDS=12",
      "MICROPHONE_PTT_MODE=single-shared",
      "TEXT_TO_SPEECH_ENABLED=true",
      "REQUIRED_MONITORS=2",
      "REQUIRED_MICROPHONES=1",
      "DISPLAY_A_ID=101",
      "DISPLAY_B_ID=202",
      "MIC_A_ID=fixture-shared-mic",
      "MIC_B_ID=fixture-shared-mic",
      "TRANSLATION_PROVIDER=chatgpt",
      "DEFAULT_TARGET_LANG_A=en",
      "DEFAULT_TARGET_LANG_B=it",
      "LOG_LEVEL=info"
    ].join("\n"),
    "utf8"
  );
}

async function generateWizardScreenshots(outputRoot) {
  const runtimeRoot = createTempDirectory("onlyspeech-docs-wizard-runtime");
  const app = spawnElectronApp({
    args: [],
    runtimeRoot
  });
  const port = await waitForAutomationPort(app.portFilePath);

  await waitForCondition(async () => {
    const snapshot = await fetchJson(port, "/snapshot");
    return snapshot.setupWizard?.controlWindowOpen ? snapshot : null;
  }, 40000);

  const wizardTargets = [
    { section: "stations", fileName: "setup-stations.png" },
    { section: "languages", fileName: "setup-languages-tts.png" },
    { section: "diagnostics", fileName: "setup-diagnostics.png" }
  ];

  for (const target of wizardTargets) {
    await fetchJson(port, "/wizard/section", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ section: target.section })
    });
    await sleep(350);
    await captureWindow(port, { target: "wizard-control" }, join(outputRoot, target.fileName));
  }

  terminateAllChildren();
}

async function generateRuntimeScreenshots(outputRoot) {
  const runtimeRoot = createTempDirectory("onlyspeech-docs-demo-runtime");
  writeDemoRuntimeEnv(runtimeRoot);

  const app = spawnElectronApp({
    args: [],
    runtimeRoot
  });
  const port = await waitForAutomationPort(app.portFilePath);

  await waitForCondition(async () => {
    const snapshot = await fetchJson(port, "/snapshot");
    return snapshot.kiosk?.windows?.length === 2 ? snapshot : null;
  }, 40000);

  await waitForCondition(async () => {
    const snapshot = await fetchJson(port, "/snapshot");
    return snapshot.kiosk?.state?.conversationHistory?.length >= 2 ? snapshot : null;
  }, 20000);

  await sleep(250);
  await captureWindow(port, { target: "kiosk", side: "A" }, join(outputRoot, "runtime-operator-view.png"));
  await captureWindow(port, { target: "kiosk", side: "B" }, join(outputRoot, "runtime-visitor-view.png"));

  terminateAllChildren();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.outputRoot, { recursive: true });

  try {
    await generateWizardScreenshots(options.outputRoot);
    await generateRuntimeScreenshots(options.outputRoot);
    console.log(`Generated product screenshots in ${options.outputRoot}`);
  } finally {
    terminateAllChildren();

    for (const directory of tempDirectories.splice(0)) {
      try {
        rmSync(directory, { recursive: true, force: true });
      } catch {
        // Electron can hold profile files briefly after process termination on Windows.
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
