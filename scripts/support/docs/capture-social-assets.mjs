import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const electronBinary = require("electron");
const repoRoot = process.cwd();
const tempDirectories = [];
let child = null;

const STORYBOARD = [
  {
    sequence: 1,
    side: "A",
    view: "visitor-language-selection",
    slug: "scegli-la-lingua",
    title: "La conversazione parte dalla lingua giusta",
    benefit: "L’operatore imposta la propria lingua con una selezione visuale e immediata.",
    ready: (state) => state.sides.A.hasCommittedLanguageSelection !== true
  },
  {
    sequence: 2,
    side: "B",
    view: "visitor-language-selection",
    slug: "lingua-del-visitatore",
    title: "Ogni visitatore si sente subito accolto",
    benefit: "Il secondo schermo guida la persona nella propria lingua, senza mediazioni tecniche.",
    ready: (state) => state.sides.A.hasCommittedLanguageSelection === true && state.sides.B.hasCommittedLanguageSelection !== true
  },
  {
    sequence: 3,
    side: "A",
    view: "operator-session",
    slug: "richiesta-operatore",
    title: "Parla normalmente. OnlySpeech traduce.",
    benefit: "La prenotazione OS-24817 e le date dal 21 al 24 giugno diventano subito comprensibili.",
    ready: (state) => state.activeSide === "A" && state.sides.A.localTranscript.includes("OS-24817")
  },
  {
    sequence: 4,
    side: "B",
    view: "visitor-session",
    slug: "risposta-visitatore",
    title: "La risposta arriva chiara, nel contesto",
    benefit: "Colazione inclusa e checkout alle 11:00: i dettagli importanti non si perdono.",
    ready: (state) => state.activeSide === "B" && state.sides.B.localTranscript.includes("十一点")
  },
  {
    sequence: 5,
    side: "A",
    view: "operator-session",
    slug: "conversazione-completata",
    title: "Un dialogo completo, leggibile da entrambi",
    benefit: "Trascrizione, traduzione e storico restano ordinati nello stesso flusso operativo.",
    ready: (state) => state.activeSide === null && state.conversationHistory.length >= 2
  }
];

const OUTPUT_FORMATS = [
  { directory: "vertical", suffix: "vertical-9x16", formatLabel: "Stories 9:16", width: 1080, height: 1920 },
  { directory: "feed", suffix: "feed-4x5", formatLabel: "Feed 4:5", width: 1080, height: 1350 }
];

function parseArgs(argv) {
  const options = { outputRoot: resolve(repoRoot, "social_assets") };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output-root" && argv[index + 1]) {
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

function waitForCondition(factory, timeoutMs = 60000) {
  const startedAt = Date.now();
  return new Promise((resolveCondition, rejectCondition) => {
    const tick = async () => {
      try {
        const value = await factory();
        if (value !== null) return resolveCondition(value);
        if (Date.now() - startedAt >= timeoutMs) return rejectCondition(new Error(`Timed out after ${timeoutMs} ms.`));
        setTimeout(tick, 150);
      } catch (error) {
        rejectCondition(error);
      }
    };
    void tick();
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchJson(port, path, body) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Request to ${path} failed with ${response.status}.`);
  return response.json();
}

function terminateChild() {
  if (!child || child.exitCode !== null || child.killed) return;
  spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}

function getPngDimensions(filePath) {
  const bytes = readFileSync(filePath);
  const pngSignature = "89504e470d0a1a0a";
  if (bytes.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`${filePath} is not a PNG file.`);
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

function writeRuntimeEnv(runtimeRoot) {
  writeFileSync(join(runtimeRoot, ".env"), [
    "APP_MODE=demo",
    "DEMO_SLIDE_INTERVAL_SECONDS=30",
    "MICROPHONE_PTT_MODE=single-shared",
    "TEXT_TO_SPEECH_ENABLED=true",
    "VISITOR_CONVERSATION_HISTORY_ENABLED=true",
    "RUNTIME_DISCLOSURE_MODE=disabled",
    "REQUIRED_MONITORS=2",
    "REQUIRED_MICROPHONES=1",
    "DISPLAY_A_ID=101",
    "DISPLAY_B_ID=202",
    "MIC_A_ID=fixture-shared-mic",
    "MIC_B_ID=fixture-shared-mic",
    "TRANSLATION_PROVIDER=chatgpt",
    "DEFAULT_TARGET_LANG_A=en",
    "DEFAULT_TARGET_LANG_B=zh-Hans",
    "LOG_LEVEL=info"
  ].join("\n"), "utf8");
}

async function captureWindow(port, side, outputPath) {
  const payload = await fetchJson(port, "/capture", { target: "kiosk", side });
  writeFileSync(outputPath, Buffer.from(payload.pngBase64, "base64"));
}

async function captureStoryboard(sourceRoot) {
  const runtimeRoot = createTempDirectory("onlyspeech-social-runtime");
  const automationRoot = createTempDirectory("onlyspeech-social-automation");
  const appDataRoot = createTempDirectory("onlyspeech-social-appdata");
  const localAppDataRoot = createTempDirectory("onlyspeech-social-localappdata");
  const portFilePath = join(automationRoot, "automation-port.txt");
  writeRuntimeEnv(runtimeRoot);

  child = spawn(electronBinary, ["."], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ONLYSPEECH_TEST_AUTOMATION: "1",
      ONLYSPEECH_AUTOMATION_PORT_FILE: portFilePath,
      ONLYSPEECH_RUNTIME_ROOT: runtimeRoot,
      ONLYSPEECH_DISPLAY_FIXTURE: JSON.stringify([
        { id: 101, label: "Reception desk", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
        { id: 202, label: "Visitor display", bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
      ]),
      APPDATA: appDataRoot,
      LOCALAPPDATA: localAppDataRoot
    },
    stdio: "pipe"
  });

  const port = await waitForCondition(() => {
    try {
      const value = Number(readFileSync(portFilePath, "utf8").trim());
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }, 40000);

  await fetchJson(port, "/kiosk/demo-restart-paused", {});
  await waitForCondition(async () => {
    const snapshot = await fetchJson(port, "/snapshot");
    return snapshot.kiosk?.windows?.length === 2 ? snapshot : null;
  }, 40000);

  for (const step of STORYBOARD) {
    console.log(`[storyboard] waiting for step ${step.sequence}: ${step.slug}`);
    await fetchJson(port, "/kiosk/demo-storyboard-step", { step: step.sequence });
    let snapshot;
    try {
      snapshot = await waitForCondition(async () => {
        const current = await fetchJson(port, "/snapshot");
        return current.kiosk?.state && step.ready(current.kiosk.state) ? current : null;
      }, 45000);
    } catch (error) {
      const current = await fetchJson(port, "/snapshot");
      const state = current.kiosk?.state;
      throw new Error(
        [
          `Storyboard step ${step.sequence} (${step.slug}) timed out.`,
          `activeSide=${state?.activeSide ?? "unknown"}`,
          `languageA=${state?.sides?.A?.selectedTargetLanguage ?? "null"}`,
          `languageB=${state?.sides?.B?.selectedTargetLanguage ?? "null"}`,
          `history=${state?.conversationHistory?.length ?? "unknown"}`
        ].join(" "),
        { cause: error }
      );
    }
    await sleep(700);

    if (!step.ready(snapshot.kiosk.state)) throw new Error(`Storyboard step ${step.sequence} did not reach its expected state.`);
    const sourcePath = join(sourceRoot, `${String(step.sequence).padStart(2, "0")}-${step.slug}.png`);
    await captureWindow(port, step.side, sourcePath);
    step.sourcePath = sourcePath;
    console.log(`[storyboard] captured step ${step.sequence}: ${step.view}`);
  }
}

function composeAssets(outputRoot, sourceRoot) {
  const manifestPath = join(sourceRoot, "manifest.json");
  const assets = STORYBOARD.flatMap((step) => OUTPUT_FORMATS.map((format) => ({
    ...format,
    sequence: step.sequence,
    title: step.title,
    benefit: step.benefit,
    sourcePath: step.sourcePath,
    outputPath: join(outputRoot, format.directory, `${String(step.sequence).padStart(2, "0")}-${step.slug}-${format.suffix}.png`)
  })));
  writeFileSync(manifestPath, JSON.stringify({ assets }, null, 2), "utf8");
  const helperPath = join(repoRoot, "scripts", "support", "docs", "compose-social-assets.mjs");
  const result = spawnSync(electronBinary, [helperPath, manifestPath], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n"));
  return assets;
}

function validateComposedAssets(outputRoot, assets) {
  const expectedCount = STORYBOARD.length * OUTPUT_FORMATS.length;
  if (assets.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} social assets in the manifest, found ${assets.length}.`);
  }

  const generatedManifest = {
    generatedBy: "npm run docs:social-assets",
    formats: OUTPUT_FORMATS.map(({ directory, suffix, formatLabel, width, height }) => ({
      directory,
      suffix,
      formatLabel,
      width,
      height
    })),
    storyboard: STORYBOARD.map(({ sequence, slug, title, benefit, side, view }) => ({
      sequence,
      slug,
      title,
      benefit,
      side,
      view
    })),
    assets: assets.map(({ sequence, directory, suffix, width, height, outputPath }) => ({
      sequence,
      directory,
      fileName: outputPath.split(/[\\/]/).at(-1),
      suffix,
      width,
      height
    }))
  };
  writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(generatedManifest, null, 2)}\n`, "utf8");

  const failures = [];
  for (const asset of assets) {
    if (!existsSync(asset.outputPath)) {
      failures.push(`missing ${asset.outputPath}`);
      continue;
    }

    try {
      const dimensions = getPngDimensions(asset.outputPath);
      if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
        failures.push(
          `${asset.outputPath} has ${dimensions.width}x${dimensions.height}, expected ${asset.width}x${asset.height}`
        );
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (failures.length > 0) {
    throw new Error(`Social asset validation failed:\n${failures.join("\n")}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sourceRoot = createTempDirectory("onlyspeech-social-source");
  mkdirSync(options.outputRoot, { recursive: true });
  try {
    await captureStoryboard(sourceRoot);
    terminateChild();
    child = null;
    const assets = composeAssets(options.outputRoot, sourceRoot);
    validateComposedAssets(options.outputRoot, assets);
    console.log(`Generated and validated ${assets.length} social assets in ${options.outputRoot}`);
  } finally {
    terminateChild();
    for (const directory of tempDirectories.splice(0)) {
      try { rmSync(directory, { recursive: true, force: true }); } catch { /* Electron may retain profile files briefly. */ }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
