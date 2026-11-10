import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseEnv } from "dotenv";
import { describe, expect, it } from "vitest";
import {
  RUNTIME_ENV_DEFAULTS,
  RUNTIME_ENV_KEY_ORDER,
  renderDotEnvExample
} from "../../src/shared/runtime-env-contract.js";

const testsDir = dirname(fileURLToPath(import.meta.url));
const envExamplePath = resolve(testsDir, "..", "..", ".env.example");

describe("runtime env contract", () => {
  it("keeps the checked-in .env.example aligned with the canonical runtime env surface", () => {
    const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n");

    expect(normalizeLineEndings(readFileSync(envExamplePath, "utf8"))).toBe(renderDotEnvExample());
  });

  it("renders every declared runtime env key in canonical order", () => {
    const parsed = parseEnv(renderDotEnvExample());

    expect(Object.keys(parsed)).toEqual([...RUNTIME_ENV_KEY_ORDER]);

    for (const key of RUNTIME_ENV_KEY_ORDER) {
      expect(parsed[key]).toBe(RUNTIME_ENV_DEFAULTS[key]);
    }
  });
});
