import { build } from "vite";

const preloadBundles = [
  {
    input: "src/main/preload.ts",
    outputDirectory: "dist/main",
    outputFileName: "preload.cjs"
  },
  {
    input: "src/tools/setup-wizard/preload.ts",
    outputDirectory: "dist/tools/setup-wizard",
    outputFileName: "preload.cjs"
  }
];

for (const bundle of preloadBundles) {
  await build({
    configFile: false,
    logLevel: "warn",
    build: {
      emptyOutDir: false,
      minify: false,
      outDir: bundle.outputDirectory,
      rollupOptions: {
        external: ["electron"],
        input: bundle.input,
        output: {
          entryFileNames: bundle.outputFileName,
          format: "cjs",
          codeSplitting: false
        }
      }
    }
  });
}
