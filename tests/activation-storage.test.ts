import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type ActivationStorageEncryptionAdapter,
  clearPersistedActivationState,
  createPersistedActivationState,
  loadPersistedActivationState,
  persistActivationState
} from "../src/main/activation-storage.js";
import { getActivationStateFilePath } from "../src/main/runtime-paths.js";

function createXorAdapter(key = 0x5a): ActivationStorageEncryptionAdapter {
  return {
    isEncryptionAvailable: () => true,
    encryptString: (value: string) => {
      const buf = Buffer.from(value, "utf8");
      for (let i = 0; i < buf.length; i++) {
        buf[i] ^= key;
      }
      return buf;
    },
    decryptString: (value: Buffer) => {
      const buf = Buffer.from(value);
      for (let i = 0; i < buf.length; i++) {
        buf[i] ^= key;
      }
      return buf.toString("utf8");
    }
  };
}

const tempDirectories: string[] = [];

function createTempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "onlyspeech-activation-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("activation storage", () => {
  it("persists the activation state under the workstation config path", () => {
    const userDataPath = createTempDirectory();
    const activationStateFilePath = getActivationStateFilePath(userDataPath);
    const state = createPersistedActivationState({
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z"
    });

    persistActivationState(activationStateFilePath, state);

    expect(existsSync(activationStateFilePath)).toBe(true);
    expect(loadPersistedActivationState(activationStateFilePath)).toEqual({
      schemaVersion: 1,
      activationToken: "OS1.payload.signature",
      claims: {
        keyId: "ks1",
        email: "buyer@example.com",
        plan: "annual",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: "2027-04-07T10:30:00.000Z"
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-07T10:35:00.000Z",
      lastTrustedUtc: "2026-04-07T10:35:00.000Z"
    });
    expect(readFileSync(activationStateFilePath, "utf8")).toContain("\"activationToken\": \"OS1.payload.signature\"");
  });

  it("persists lifetime activations with a null expiry and explicit trusted time", () => {
    const userDataPath = createTempDirectory();
    const activationStateFilePath = getActivationStateFilePath(userDataPath);
    const state = createPersistedActivationState({
      activationToken: "OS1.lifetime.signature",
      claims: {
        keyId: "ks2",
        email: "buyer@example.com",
        plan: "lifetime",
        issuedAt: "2026-04-07T10:30:00.000Z",
        expiresAt: null
      },
      activatedAt: "2026-04-07T10:35:00.000Z",
      lastValidatedAt: "2026-04-08T07:00:00.000Z",
      lastTrustedUtc: "2026-04-08T07:00:00.000Z"
    });

    persistActivationState(activationStateFilePath, state);

    expect(loadPersistedActivationState(activationStateFilePath)).toEqual(state);
  });

  it("removes the persisted activation state when clearing the workstation-local unlock record", () => {
    const userDataPath = createTempDirectory();
    const activationStateFilePath = getActivationStateFilePath(userDataPath);

    persistActivationState(
      activationStateFilePath,
      createPersistedActivationState({
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "monthly",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2026-05-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z"
      })
    );

    clearPersistedActivationState(activationStateFilePath);

    expect(loadPersistedActivationState(activationStateFilePath)).toBeNull();
  });

  describe("encrypted storage", () => {
    it("persists and loads activation state as an opaque encrypted blob", () => {
      const userDataPath = createTempDirectory();
      const activationStateFilePath = getActivationStateFilePath(userDataPath);
      const adapter = createXorAdapter();
      const state = createPersistedActivationState({
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "annual",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2027-04-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z"
      });

      persistActivationState(activationStateFilePath, state, adapter);

      const raw = readFileSync(activationStateFilePath, "utf8");
      const envelope = JSON.parse(raw) as Record<string, unknown>;
      expect(envelope.encryptedWith).toBe("electron.safeStorage");
      expect(typeof envelope.data).toBe("string");
      expect(raw).not.toContain("OS1.payload.signature");
      expect(raw).not.toContain("buyer@example.com");

      expect(loadPersistedActivationState(activationStateFilePath, adapter)).toEqual({
        schemaVersion: 1,
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "annual",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2027-04-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z",
        lastValidatedAt: "2026-04-07T10:35:00.000Z",
        lastTrustedUtc: "2026-04-07T10:35:00.000Z"
      });
    });

    it("throws when loading an encrypted file without an adapter", () => {
      const userDataPath = createTempDirectory();
      const activationStateFilePath = getActivationStateFilePath(userDataPath);
      const adapter = createXorAdapter();
      const state = createPersistedActivationState({
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "monthly",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2026-05-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z"
      });

      persistActivationState(activationStateFilePath, state, adapter);

      expect(() => loadPersistedActivationState(activationStateFilePath)).toThrow(
        "Activation state is encrypted but no decryption adapter is available."
      );
    });

    it("throws when loading an encrypted file with an unavailable adapter", () => {
      const userDataPath = createTempDirectory();
      const activationStateFilePath = getActivationStateFilePath(userDataPath);
      const adapter = createXorAdapter();
      const unavailableAdapter: ActivationStorageEncryptionAdapter = {
        ...adapter,
        isEncryptionAvailable: () => false
      };
      const state = createPersistedActivationState({
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "monthly",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2026-05-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z"
      });

      persistActivationState(activationStateFilePath, state, adapter);

      expect(() => loadPersistedActivationState(activationStateFilePath, unavailableAdapter)).toThrow(
        "Activation state is encrypted but no decryption adapter is available."
      );
    });

    it("falls back to plain JSON when the adapter reports encryption unavailable", () => {
      const userDataPath = createTempDirectory();
      const activationStateFilePath = getActivationStateFilePath(userDataPath);
      const unavailableAdapter: ActivationStorageEncryptionAdapter = {
        isEncryptionAvailable: () => false,
        encryptString: () => { throw new Error("should not be called"); },
        decryptString: () => { throw new Error("should not be called"); }
      };
      const state = createPersistedActivationState({
        activationToken: "OS1.payload.signature",
        claims: {
          keyId: "ks1",
          email: "buyer@example.com",
          plan: "annual",
          issuedAt: "2026-04-07T10:30:00.000Z",
          expiresAt: "2027-04-07T10:30:00.000Z"
        },
        activatedAt: "2026-04-07T10:35:00.000Z"
      });

      persistActivationState(activationStateFilePath, state, unavailableAdapter);

      const raw = readFileSync(activationStateFilePath, "utf8");
      expect(raw).toContain("\"activationToken\": \"OS1.payload.signature\"");
      expect(loadPersistedActivationState(activationStateFilePath)).toEqual(expect.objectContaining({
        activationToken: "OS1.payload.signature"
      }));
    });
  });

  it("rejects malformed persisted state instead of silently accepting it", () => {
    const userDataPath = createTempDirectory();
    const activationStateFilePath = getActivationStateFilePath(userDataPath);
    mkdirSync(join(userDataPath, "config"), { recursive: true });

    writeFileSync(
      activationStateFilePath,
      JSON.stringify(
        {
          schemaVersion: 1,
          activationToken: "OS1.payload.signature",
          claims: {
            keyId: "ks1",
            email: "buyer@example.com",
            plan: "lifetime",
            issuedAt: "2026-04-07T10:30:00.000Z",
            expiresAt: "2027-04-07T10:30:00.000Z"
          },
          activatedAt: "2026-04-07T10:35:00.000Z",
          lastValidatedAt: "2026-04-07T10:35:00.000Z",
          lastTrustedUtc: "2026-04-07T10:35:00.000Z"
        },
        null,
        2
      ) + "\n",
      "utf8"
    );

    expect(() => loadPersistedActivationState(activationStateFilePath)).toThrow(
      "Lifetime activation state must persist expiresAt as null."
    );
  });
});
