import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const electronBinary = require("electron");

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
  const harnessPath = resolve(
    process.cwd(),
    "tooling",
    "docs",
    "render-marketplace-demo-video-electron.mjs"
  );

  const child = spawn(
    electronBinary,
    [harnessPath, "--output", options.outputPath, "--poster", options.posterPath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env
      },
      stdio: "inherit"
    }
  );

  await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Marketplace demo renderer exited with code ${code ?? "unknown"}.`));
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
