import { describe, expect, it, vi } from "vitest";
import { installWindowNavigationGuards } from "../../src/main/window-factory.js";

describe("installWindowNavigationGuards", () => {
  it("blocks renderer navigation and popup creation", () => {
    let navigationListener: ((event: { preventDefault: () => void }) => void) | undefined;
    const setWindowOpenHandler = vi.fn();
    const window = {
      webContents: {
        on: vi.fn((_event: string, listener: typeof navigationListener) => { navigationListener = listener; }),
        setWindowOpenHandler
      }
    };
    installWindowNavigationGuards(window as never);
    const preventDefault = vi.fn();
    navigationListener?.({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(setWindowOpenHandler.mock.calls[0]?.[0]()).toEqual({ action: "deny" });
  });
});
