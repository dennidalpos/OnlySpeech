import { app, BrowserWindow } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const manifestPath = process.argv.find((argument) => argument.endsWith(".json"));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageHtml(asset) {
  const sourceBase64 = readFileSync(asset.sourcePath).toString("base64");
  const compact = asset.height < 1500;
  return `<!doctype html>
    <html lang="it">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
          body {
            color: #f7fbff;
            font-family: "Segoe UI", Arial, sans-serif;
            background:
              radial-gradient(circle at 85% 10%, rgba(39, 196, 221, .24), transparent 32%),
              radial-gradient(circle at 12% 88%, rgba(50, 112, 204, .24), transparent 34%),
              linear-gradient(145deg, #07111f 0%, #0d2941 55%, #0d526b 100%);
          }
          .frame { height: 100%; padding: ${compact ? 62 : 96}px 64px; display: flex; flex-direction: column; }
          .brand { display: flex; align-items: center; gap: 18px; font-size: 30px; font-weight: 700; letter-spacing: .02em; }
          .mark { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; background: #82e8f7; color: #061522; font-weight: 900; }
          .step { margin-top: ${compact ? 42 : 76}px; color: #91e8f5; font-size: 24px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
          h1 { margin: 14px 0 0; max-width: 920px; font-size: ${compact ? 62 : 72}px; line-height: 1.04; letter-spacing: -.035em; }
          .screen {
            margin-top: ${compact ? 42 : 74}px;
            padding: 14px;
            border-radius: 34px;
            background: rgba(255,255,255,.11);
            box-shadow: 0 30px 80px rgba(0,0,0,.38);
            border: 1px solid rgba(180,235,247,.24);
          }
          .screen img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 22px; }
          .benefit { margin: ${compact ? 42 : 70}px 0 0; font-size: ${compact ? 31 : 38}px; line-height: 1.34; color: #d7edf4; }
          .footer { margin-top: auto; display: flex; justify-content: space-between; align-items: end; color: #a9cfda; font-size: 23px; }
          .cta { color: #07111f; background: #91e8f5; padding: 16px 24px; border-radius: 999px; font-weight: 800; }
        </style>
      </head>
      <body>
        <main class="frame">
          <div class="brand"><span class="mark">OS</span><span>OnlySpeech</span></div>
          <div class="step">Step ${String(asset.sequence).padStart(2, "0")} · ${escapeHtml(asset.formatLabel)}</div>
          <h1>${escapeHtml(asset.title)}</h1>
          <div class="screen"><img alt="${escapeHtml(asset.title)}" src="data:image/png;base64,${sourceBase64}"></div>
          <p class="benefit">${escapeHtml(asset.benefit)}</p>
          <div class="footer"><span>Conversazioni in presenza, senza barriere linguistiche.</span><span class="cta">Scopri OnlySpeech</span></div>
        </main>
      </body>
    </html>`;
}

async function writePngWithRetry(outputPath, buffer) {
  let lastError;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await writeFile(outputPath, buffer);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

async function renderAsset(window, asset) {
  const htmlPath = join(dirname(manifestPath), `compose-${asset.sequence}-${asset.width}x${asset.height}.html`);
  writeFileSync(htmlPath, pageHtml(asset), "utf8");
  // Frameless Windows windows retain an 8 px resize border on each side.
  window.setSize(asset.width + 16, asset.height + 8);
  await window.loadFile(htmlPath);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: asset.width, height: asset.height });
  mkdirSync(dirname(asset.outputPath), { recursive: true });
  await writePngWithRetry(asset.outputPath, image.toPNG());
}

async function main() {
  if (!manifestPath) {
    throw new Error("A JSON composition manifest is required.");
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  app.commandLine.appendSwitch("force-device-scale-factor", "1");
  await app.whenReady();
  const window = new BrowserWindow({
    width: 1080,
    height: 1920,
    useContentSize: true,
    show: false,
    frame: false,
    resizable: true,
    backgroundColor: "#07111f",
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  try {
    for (const asset of manifest.assets) {
      await renderAsset(window, asset);
    }
  } finally {
    window.destroy();
  }
  console.log(`Composed ${manifest.assets.length} social assets.`);
  app.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  app.exit(1);
});
