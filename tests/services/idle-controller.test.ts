import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleController } from "../../src/services/privacy/idle-controller.js";

describe("IdleController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires clear and hard reset in sequence", () => {
    const onClear = vi.fn();
    const onHardReset = vi.fn();
    const controller = new IdleController({
      clearAfterMs: 1000,
      hardResetAfterMs: 3000,
      onClear,
      onHardReset
    });

    controller.start();

    vi.advanceTimersByTime(999);
    expect(onClear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClear).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(onHardReset).toHaveBeenCalledTimes(1);
  });

  it("resets timers on activity", () => {
    const onClear = vi.fn();
    const onHardReset = vi.fn();
    const controller = new IdleController({
      clearAfterMs: 1000,
      hardResetAfterMs: 3000,
      onClear,
      onHardReset
    });

    controller.start();
    vi.advanceTimersByTime(800);
    controller.activity();
    vi.advanceTimersByTime(800);

    expect(onClear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onHardReset).not.toHaveBeenCalled();
  });
});
