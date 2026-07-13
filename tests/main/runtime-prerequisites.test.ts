import { describe, expect, it } from "vitest";
import {
  formatPackagedRuntimePrerequisiteFailure,
  getPackagedRuntimePrerequisites
} from "../../src/main/runtime-prerequisites.js";

describe("packaged runtime prerequisite fallback", () => {
  it("passes when the packaged runtime prerequisites are present", () => {
    const prerequisites = getPackagedRuntimePrerequisites({
      platform: "win32",
      arch: "x64",
      systemRoot: "C:\\Windows",
      exists: () => true
    });

    expect(formatPackagedRuntimePrerequisiteFailure(prerequisites)).toBe("");
  });

  it("reports missing media components with the same user-facing action", () => {
    const prerequisites = getPackagedRuntimePrerequisites({
      platform: "win32",
      arch: "x64",
      systemRoot: "C:\\Windows",
      exists: (path) => !path.endsWith("mfreadwrite.dll")
    });
    const message = formatPackagedRuntimePrerequisiteFailure(prerequisites);

    expect(message).toContain("Windows Media Foundation");
    expect(message).toContain("official Microsoft Media Feature Pack");
    expect(message).toContain("mfreadwrite.dll");
  });
});
