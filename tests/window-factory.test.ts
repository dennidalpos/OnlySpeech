import { beforeEach, describe, expect, it, vi } from "vitest";

const electronMocks = vi.hoisted(() => ({
  getAllDisplays: vi.fn(),
  getDisplayMatching: vi.fn(),
  getPrimaryDisplay: vi.fn()
}));

vi.mock("electron", () => ({
  BrowserWindow: class MockBrowserWindow {},
  screen: {
    getAllDisplays: electronMocks.getAllDisplays,
    getDisplayMatching: electronMocks.getDisplayMatching,
    getPrimaryDisplay: electronMocks.getPrimaryDisplay
  }
}));

import { clampBoundsToVisibleArea } from "../src/main/window-factory.js";

describe("window-factory bounds recovery", () => {
  beforeEach(() => {
    electronMocks.getAllDisplays.mockReset();
    electronMocks.getDisplayMatching.mockReset();
    electronMocks.getPrimaryDisplay.mockReset();
  });

  it("clamps an off-screen window back onto the primary display", () => {
    const primaryDisplay = {
      id: 10,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 }
    };
    electronMocks.getAllDisplays.mockReturnValue([primaryDisplay]);
    electronMocks.getDisplayMatching.mockReturnValue(primaryDisplay);
    electronMocks.getPrimaryDisplay.mockReturnValue(primaryDisplay);

    expect(
      clampBoundsToVisibleArea({
        x: -4000,
        y: -2500,
        width: 2560,
        height: 1440
      })
    ).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    });
  });

  it("keeps a control window inside the visible work area after topology changes", () => {
    const primaryDisplay = {
      id: 10,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1600, height: 900 }
    };
    electronMocks.getAllDisplays.mockReturnValue([primaryDisplay]);
    electronMocks.getDisplayMatching.mockReturnValue(primaryDisplay);
    electronMocks.getPrimaryDisplay.mockReturnValue(primaryDisplay);

    expect(
      clampBoundsToVisibleArea(
        {
          x: 1700,
          y: 950,
          width: 1200,
          height: 900
        },
        {
          useWorkArea: true,
          minimumWidth: 900,
          minimumHeight: 640
        }
      )
    ).toEqual({
      x: 400,
      y: 0,
      width: 1200,
      height: 900
    });
  });
});
