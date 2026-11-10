import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: [...configDefaults.exclude],
    maxWorkers: 4,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "artifacts/coverage",
      include: [
        "src/main/activation-{flow,state,storage,validator}.ts",
        "src/main/ipc{,-payloads}.ts",
        "src/main/{setup-wizard-access,runtime-secrets}.ts",
        "src/shared/{config,runtime-env-contract,runtime-env-normalization}.ts",
        "src/services/speech/{translation-provider-service,provider-adapters,live-speech-client}.ts"
      ],
      thresholds: {
        statements: 75,
        branches: 65,
        functions: 75,
        lines: 75
      }
    }
  }
});
