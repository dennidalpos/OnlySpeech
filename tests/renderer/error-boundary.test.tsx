// @vitest-environment jsdom

import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../../src/renderer/operator/components/ErrorBoundary.js";

let container: HTMLDivElement | null = null;
let root: ReactDOM.Root | null = null;

function bodyText(): string {
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function CrashingComponent() {
  throw new Error("Simulated component rendering crash");
}

afterEach(async () => {
  await act(async () => {
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
  container?.remove();
  container = null;
  document.body.innerHTML = "";
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error output during component crash tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    await act(async () => {
      root?.render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );
      await Promise.resolve();
    });

    expect(bodyText()).toContain("Child Content");
    expect(bodyText()).not.toContain("System Crash Recovery");
  });

  it("catches rendering errors and shows the crash recovery UI", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    await act(async () => {
      root?.render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      );
      await Promise.resolve();
    });

    expect(bodyText()).toContain("System Crash Recovery");
    expect(bodyText()).toContain("Si è verificato un errore imprevisto.");
    expect(bodyText()).toContain("Simulated component rendering crash");
  });
});
