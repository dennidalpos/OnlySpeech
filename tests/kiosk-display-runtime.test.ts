import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DisplayAssignment, TechnicalIssue } from "../src/shared/types.js";
import type { DisplayManager } from "../src/main/display-manager.js";

const runtimeMocks = vi.hoisted(() => ({
  createOperatorWindow: vi.fn(),
  syncWindowToDisplay: vi.fn(),
  applyMediaPermissionPolicy: vi.fn(),
  log: vi.fn()
}));

vi.mock("electron", () => ({
  session: {
    defaultSession: {}
  }
}));

vi.mock("../src/main/window-factory.js", () => ({
  createOperatorWindow: runtimeMocks.createOperatorWindow,
  syncWindowToDisplay: runtimeMocks.syncWindowToDisplay
}));

vi.mock("../src/main/media-permission-policy.js", () => ({
  applyMediaPermissionPolicy: runtimeMocks.applyMediaPermissionPolicy
}));

import { KioskDisplayRuntime } from "../src/main/kiosk-display-runtime.js";

function createAssignment(side: "A" | "B", displayId: number): DisplayAssignment {
  return {
    side,
    displayId,
    label: `Display ${displayId}`,
    bounds: { x: displayId === 1 ? 0 : 1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1
  };
}

function createWindowMock() {
  let destroyed = false;
  let visible = false;
  const listeners = new Map<string, () => void>();

  return {
    on: vi.fn((event: string, listener: () => void) => {
      listeners.set(event, listener);
    }),
    close: vi.fn(() => {
      destroyed = true;
      listeners.get("closed")?.();
    }),
    destroy: vi.fn(() => {
      destroyed = true;
      listeners.get("closed")?.();
    }),
    isDestroyed: vi.fn(() => destroyed),
    isVisible: vi.fn(() => visible),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    show: vi.fn(() => {
      visible = true;
    }),
    webContents: {
      on: vi.fn(),
      send: vi.fn()
    }
  };
}

describe("KioskDisplayRuntime", () => {
  beforeEach(() => {
    runtimeMocks.createOperatorWindow.mockReset();
    runtimeMocks.syncWindowToDisplay.mockReset();
    runtimeMocks.applyMediaPermissionPolicy.mockReset();
    runtimeMocks.log.mockReset();
  });

  it("preserves the existing window when display assignments transiently disappear", () => {
    const windowA = createWindowMock();
    const displayManager = {
      getAssignments: vi.fn()
        .mockReturnValueOnce({
          assignments: [createAssignment("A", 1)],
          issues: []
        })
        .mockReturnValueOnce({
          assignments: [],
          issues: [
            {
              code: "missing-monitor",
              message: "Sono necessari due monitor attivi per avviare la sessione.",
              retryable: true
            } satisfies TechnicalIssue
          ]
        }),
      watch: vi.fn(() => () => undefined)
    };

    runtimeMocks.createOperatorWindow.mockReturnValue(windowA);

    const runtime = new KioskDisplayRuntime({
      displayManager: displayManager as unknown as DisplayManager,
      logger: { log: runtimeMocks.log } as never,
      getState: () => ({ sessionId: "session-1" }) as never
    });

    runtime.reconcileDisplays();
    runtime.reconcileDisplays();

    expect(runtimeMocks.createOperatorWindow).toHaveBeenCalledTimes(1);
    expect(windowA.close).not.toHaveBeenCalled();
    expect(runtimeMocks.log).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          preservedExistingWindows: true
        })
      })
    );
  });

  it("re-syncs the surviving side and closes only the missing-side window after a monitor loss", () => {
    const windowA = createWindowMock();
    const windowB = createWindowMock();
    const displayManager = {
      getAssignments: vi.fn()
        .mockReturnValueOnce({
          assignments: [createAssignment("A", 1), createAssignment("B", 2)],
          issues: []
        })
        .mockReturnValueOnce({
          assignments: [createAssignment("A", 1)],
          issues: [
            {
              code: "missing-monitor",
              message: "Sono necessari due monitor attivi per avviare la sessione.",
              retryable: true
            } satisfies TechnicalIssue
          ]
        }),
      watch: vi.fn(() => () => undefined)
    };

    runtimeMocks.createOperatorWindow
      .mockReturnValueOnce(windowA)
      .mockReturnValueOnce(windowB);

    const runtime = new KioskDisplayRuntime({
      displayManager: displayManager as unknown as DisplayManager,
      logger: { log: runtimeMocks.log } as never,
      getState: () => ({ sessionId: "session-1" }) as never
    });

    runtime.reconcileDisplays();
    runtime.reconcileDisplays();

    expect(runtimeMocks.syncWindowToDisplay).toHaveBeenCalledWith(windowA, expect.objectContaining({ side: "A" }));
    expect(windowB.close).toHaveBeenCalledTimes(1);
    expect(windowA.close).not.toHaveBeenCalled();
  });
});
