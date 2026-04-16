import { app, BrowserWindow } from "electron";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const options = {
    outputPath: resolve(process.cwd(), "media", "marketplace-demo", "onlyspeech-marketplace-demo.mp4"),
    posterPath: resolve(
      process.cwd(),
      "media",
      "marketplace-demo",
      "onlyspeech-marketplace-demo-poster.png"
    )
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output" && argv[index + 1]) {
      options.outputPath = resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument === "--poster" && argv[index + 1]) {
      options.posterPath = resolve(process.cwd(), argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const pageUrl = pathToFileURL(
    join(process.cwd(), "tooling", "docs", "marketplace-demo-video.html")
  ).href;

  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
  await app.whenReady();

  const window = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1080,
    useContentSize: true,
    backgroundColor: "#07111f",
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      contextIsolation: true
    }
  });

  try {
    await window.loadURL(pageUrl);
    const result = await window.webContents.executeJavaScript(
      "window.renderMarketplaceDemoVideo()",
      true
    );

    mkdirSync(dirname(options.outputPath), { recursive: true });
    mkdirSync(dirname(options.posterPath), { recursive: true });
    writeFileSync(options.outputPath, Buffer.from(result.videoBase64, "base64"));
    writeFileSync(options.posterPath, Buffer.from(result.posterBase64, "base64"));

    console.log(
      JSON.stringify({
        outputPath: options.outputPath,
        posterPath: options.posterPath,
        durationMs: result.durationMs,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes
      })
    );
  } finally {
    window.destroy();
    app.quit();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
  app.quit();
});
