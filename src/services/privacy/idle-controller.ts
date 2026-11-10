interface IdleControllerOptions {
  clearAfterMs: number;
  hardResetAfterMs: number;
  onClear: () => void;
  onHardReset: () => void;
}

export class IdleController {
  private clearTimer: NodeJS.Timeout | null = null;

  private hardResetTimer: NodeJS.Timeout | null = null;

  private started = false;

  constructor(private readonly options: IdleControllerOptions) {}

  start(): void {
    this.started = true;
    this.activity();
  }

  stop(): void {
    this.started = false;
    this.clearTimers();
  }

  activity(): void {
    if (!this.started) {
      return;
    }

    this.clearTimers();

    if (this.options.clearAfterMs > 0) {
      this.clearTimer = setTimeout(() => {
        this.options.onClear();
      }, this.options.clearAfterMs);
    }

    if (this.options.hardResetAfterMs > 0) {
      this.hardResetTimer = setTimeout(() => {
        this.options.onHardReset();
      }, this.options.hardResetAfterMs);
    }
  }

  private clearTimers(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    if (this.hardResetTimer) {
      clearTimeout(this.hardResetTimer);
      this.hardResetTimer = null;
    }
  }
}
