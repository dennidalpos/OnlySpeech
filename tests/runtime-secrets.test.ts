import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getRuntimeEnvFilePath, getRuntimeSecretsFilePath } from "../src/main/runtime-paths.js";
import {
  isSecureRuntimeSecretStorageEnabled,
  loadRuntimeEnvironment,
  persistRuntimeSecrets,
  redactSecureRuntimeSecrets
} from "../src/main/runtime-secrets.js";

const safeStorageAdapter = {
  isEncryptionAvailable: () => true,
  encryptString: (value: string) => Buffer.from(`encrypted:${value}`, "utf8"),
  decryptString: (value: Buffer) => value.toString("utf8").replace(/^encrypted:/, "")
};

describe("runtime secure secrets", () => {
  it("enables Windows secure storage only for packaged builds", () => {
    expect(isSecureRuntimeSecretStorageEnabled({ isPackaged: true, platform: "win32" })).toBe(true);
    expect(isSecureRuntimeSecretStorageEnabled({ isPackaged: false, platform: "win32" })).toBe(false);
    expect(isSecureRuntimeSecretStorageEnabled({ isPackaged: true, platform: "linux" })).toBe(false);
  });

  it("stores provider secrets outside the env file for packaged Windows installs", () => {
    const runtimeRoot = mkdtempSync(join(tmpdir(), "onlyspeech-runtime-"));
    const userDataPath = join(runtimeRoot, "user-data");
    const secretsFilePath = getRuntimeSecretsFilePath(userDataPath);

    writeFileSync(
      getRuntimeEnvFilePath(runtimeRoot),
      [
        "TRANSLATION_PROVIDER=chatgpt",
        "CHATGPT_MODEL=gpt-4o-mini",
        "CHATGPT_TRANSCRIBE_MODEL=whisper-1",
        "AZURE_SPEECH_REGION=westeurope",
        ""
      ].join("\n"),
      "utf8"
    );

    const result = persistRuntimeSecrets(
      {
        CHATGPT_API_KEY: "chatgpt-secret",
        AZURE_SPEECH_KEY: "azure-secret",
        AZURE_TRANSLATOR_KEY: "translator-secret"
      },
      {
        runtimeRoot,
        secretsFilePath,
        secureStorageEnabled: true,
        safeStorageAdapter
      }
    );

    expect(result.storedKeys).toEqual(["AZURE_SPEECH_KEY", "AZURE_TRANSLATOR_KEY", "CHATGPT_API_KEY"]);
    expect(readFileSync(secretsFilePath, "utf8")).not.toContain("chatgpt-secret");
    expect(readFileSync(secretsFilePath, "utf8")).not.toContain("azure-secret");
    expect(readFileSync(secretsFilePath, "utf8")).not.toContain("translator-secret");

    expect(
      loadRuntimeEnvironment({
        runtimeRoot,
        secretsFilePath,
        secureStorageEnabled: true,
        safeStorageAdapter
      })
    ).toMatchObject({
      TRANSLATION_PROVIDER: "chatgpt",
      CHATGPT_MODEL: "gpt-4o-mini",
      CHATGPT_TRANSCRIBE_MODEL: "whisper-1",
      AZURE_SPEECH_REGION: "westeurope",
      CHATGPT_API_KEY: "chatgpt-secret",
      AZURE_SPEECH_KEY: "azure-secret",
      AZURE_TRANSLATOR_KEY: "translator-secret"
    });
  });

  it("removes the secure secret file when no provider secrets remain", () => {
    const runtimeRoot = mkdtempSync(join(tmpdir(), "onlyspeech-runtime-"));
    const userDataPath = join(runtimeRoot, "user-data");
    const secretsFilePath = getRuntimeSecretsFilePath(userDataPath);

    persistRuntimeSecrets(
      { CHATGPT_API_KEY: "chatgpt-secret" },
      {
        runtimeRoot,
        secretsFilePath,
        secureStorageEnabled: true,
        safeStorageAdapter
      }
    );

    expect(existsSync(secretsFilePath)).toBe(true);

    persistRuntimeSecrets(
      {},
      {
        runtimeRoot,
        secretsFilePath,
        secureStorageEnabled: true,
        safeStorageAdapter
      }
    );

    expect(existsSync(secretsFilePath)).toBe(false);
  });

  it("redacts provider secrets from env values before writing release env files", () => {
    expect(
      redactSecureRuntimeSecrets({
        CHATGPT_API_KEY: "chatgpt-secret",
        AZURE_SPEECH_KEY: "azure-secret",
        AZURE_TRANSLATOR_KEY: "translator-secret",
        CHATGPT_MODEL: "gpt-4o-mini"
      })
    ).toEqual({
      CHATGPT_API_KEY: "",
      AZURE_SPEECH_KEY: "",
      AZURE_TRANSLATOR_KEY: "",
      CHATGPT_MODEL: "gpt-4o-mini"
    });
  });
});
