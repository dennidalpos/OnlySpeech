import type { Side } from "../shared/types.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { SessionStore } from "../services/session/session-store.js";

interface DemoExchange {
  side: Side;
  transcript: string;
  translation: string;
  detectedLanguage: string;
}

interface DemoCycle {
  sideLanguages: Record<Side, string>;
  visitorConversationHistoryEnabled: boolean;
  exchanges: DemoExchange[];
}

interface DemoRuntimeControllerOptions {
  sessionStore: SessionStore;
  logger: JsonlLogger;
  broadcastState: () => void;
  slideIntervalSeconds: number;
}

const DEMO_CYCLES: DemoCycle[] = [
  {
    sideLanguages: {
      A: "en",
      B: "zh-Hans"
    },
    visitorConversationHistoryEnabled: false,
    exchanges: [
      {
        side: "A",
        transcript: "Good morning. I can help you with check-in today.",
        translation: "早上好。我今天可以协助您办理登记。",
        detectedLanguage: "en-US"
      },
      {
        side: "B",
        transcript: "谢谢。我需要我的预订编号。",
        translation: "Thank you. I need my booking reference.",
        detectedLanguage: "zh-CN"
      }
    ]
  },
  {
    sideLanguages: {
      A: "en",
      B: "yue"
    },
    visitorConversationHistoryEnabled: true,
    exchanges: [
      {
        side: "A",
        transcript: "Welcome back. We can continue from your previous request.",
        translation: "歡迎返嚟。我哋可以由你之前嘅請求繼續。",
        detectedLanguage: "en-US"
      },
      {
        side: "B",
        transcript: "好呀，我只需要確認返探訪時間。",
        translation: "Perfect. I only need to confirm the appointment time.",
        detectedLanguage: "yue-HK"
      }
    ]
  }
];

const DEMO_LOOP_TIMINGS = {
  resetPauseMs: 650,
  sideSelectionGapMs: 900,
  firstExchangeDelayMs: 1800,
  exchangeDurationMs: 1500,
  exchangeGapMs: 900,
  loopRestartPauseMs: 1600
} as const;

const DEFAULT_DEMO_CYCLE_DURATION_MS =
  DEMO_LOOP_TIMINGS.firstExchangeDelayMs +
  DEMO_CYCLES[0]!.exchanges.length * DEMO_LOOP_TIMINGS.exchangeDurationMs +
  Math.max(0, DEMO_CYCLES[0]!.exchanges.length - 1) * DEMO_LOOP_TIMINGS.exchangeGapMs +
  DEMO_LOOP_TIMINGS.loopRestartPauseMs;

interface ScheduledAction {
  action: () => void;
  remainingMs: number;
  timeout: NodeJS.Timeout | null;
  dueAtMs: number | null;
}

interface DemoLoopTimings {
  resetPauseMs: number;
  sideSelectionGapMs: number;
  firstExchangeDelayMs: number;
  exchangeDurationMs: number;
  exchangeGapMs: number;
  loopRestartPauseMs: number;
}

function resolveSlideIntervalMs(slideIntervalSeconds: number): number {
  const normalizedSeconds = Number.isFinite(slideIntervalSeconds) ? slideIntervalSeconds : 8;
  return Math.max(4_000, Math.round(normalizedSeconds * 1_000));
}

function scaleTiming(value: number, scale: number, minimumMs: number): number {
  return Math.max(minimumMs, Math.round(value * scale));
}

function buildLoopTimings(slideIntervalSeconds: number): DemoLoopTimings {
  const cycleDurationMs = resolveSlideIntervalMs(slideIntervalSeconds);
  const scale = cycleDurationMs / DEFAULT_DEMO_CYCLE_DURATION_MS;

  return {
    resetPauseMs: scaleTiming(DEMO_LOOP_TIMINGS.resetPauseMs, scale, 250),
    sideSelectionGapMs: scaleTiming(DEMO_LOOP_TIMINGS.sideSelectionGapMs, scale, 250),
    firstExchangeDelayMs: scaleTiming(DEMO_LOOP_TIMINGS.firstExchangeDelayMs, scale, 900),
    exchangeDurationMs: scaleTiming(DEMO_LOOP_TIMINGS.exchangeDurationMs, scale, 700),
    exchangeGapMs: scaleTiming(DEMO_LOOP_TIMINGS.exchangeGapMs, scale, 300),
    loopRestartPauseMs: scaleTiming(DEMO_LOOP_TIMINGS.loopRestartPauseMs, scale, 500)
  };
}

export class DemoRuntimeController {
  private readonly scheduledActions = new Set<ScheduledAction>();

  private disposed = false;

  private paused = false;

  private cycleIndex = 0;

  constructor(private readonly options: DemoRuntimeControllerOptions) {}

  start(): void {
    this.restart();
  }

  stop(): void {
    this.disposed = true;
    this.clearScheduledActions();
  }

  pause(): void {
    if (this.disposed || this.paused) {
      return;
    }

    this.paused = true;
    const now = Date.now();
    for (const scheduledAction of this.scheduledActions) {
      if (scheduledAction.timeout) {
        clearTimeout(scheduledAction.timeout);
        scheduledAction.timeout = null;
      }

      scheduledAction.remainingMs = Math.max(0, (scheduledAction.dueAtMs ?? now) - now);
      scheduledAction.dueAtMs = null;
    }
  }

  resume(): void {
    if (this.disposed || !this.paused) {
      return;
    }

    this.paused = false;
    for (const scheduledAction of this.scheduledActions) {
      this.armScheduledAction(scheduledAction);
    }
  }

  restart(): void {
    this.clearScheduledActions();
    this.disposed = false;
    this.paused = false;
    this.runCycle(DEMO_CYCLES[this.cycleIndex % DEMO_CYCLES.length] ?? DEMO_CYCLES[0]!);
    this.cycleIndex += 1;
  }

  private runCycle(cycle: DemoCycle): void {
    const loopTimings = buildLoopTimings(this.options.slideIntervalSeconds);
    const cycleLabel = `${cycle.sideLanguages.A}->${cycle.sideLanguages.B}`;
    this.options.sessionStore.hardReset();
    this.options.sessionStore.setVisitorConversationHistoryEnabled(cycle.visitorConversationHistoryEnabled);
    this.options.broadcastState();
    this.options.logger.log({
      session_id: this.options.sessionStore.getState().sessionId,
      event: "demo_cycle_start",
      details: {
        cycle: cycleLabel,
        visitor_history: cycle.visitorConversationHistoryEnabled
      }
    });

    this.schedule(loopTimings.resetPauseMs, () => {
      this.options.sessionStore.setTargetLanguage("A", cycle.sideLanguages.A);
      this.options.broadcastState();
    });

    this.schedule(loopTimings.resetPauseMs + loopTimings.sideSelectionGapMs, () => {
      this.options.sessionStore.setTargetLanguage("B", cycle.sideLanguages.B);
      this.options.broadcastState();
    });

    cycle.exchanges.forEach((exchange, index) => {
      const exchangeOffset =
        loopTimings.firstExchangeDelayMs +
        index * (loopTimings.exchangeDurationMs + loopTimings.exchangeGapMs);

      this.schedule(exchangeOffset, () => {
        this.options.sessionStore.setActiveSide(exchange.side);
        this.options.broadcastState();
      });

      this.schedule(exchangeOffset + 550, () => {
        this.options.sessionStore.updateSpeech(
          exchange.side,
          exchange.transcript,
          exchange.translation,
          exchange.detectedLanguage
        );
        this.options.broadcastState();
      });

      this.schedule(exchangeOffset + loopTimings.exchangeDurationMs, () => {
        this.options.sessionStore.appendConversationTurn(
          exchange.side,
          exchange.transcript,
          exchange.translation,
          exchange.detectedLanguage
        );
        this.options.sessionStore.setActiveSide(null);
        this.options.broadcastState();
      });
    });

    const loopDuration =
      loopTimings.firstExchangeDelayMs +
      cycle.exchanges.length * loopTimings.exchangeDurationMs +
      Math.max(0, cycle.exchanges.length - 1) * loopTimings.exchangeGapMs;

    this.schedule(loopDuration + loopTimings.loopRestartPauseMs, () => {
      this.runCycle(DEMO_CYCLES[this.cycleIndex % DEMO_CYCLES.length] ?? DEMO_CYCLES[0]!);
      this.cycleIndex += 1;
    });
  }

  private schedule(delayMs: number, action: () => void): void {
    const scheduledAction: ScheduledAction = {
      action,
      remainingMs: delayMs,
      timeout: null,
      dueAtMs: null
    };

    this.scheduledActions.add(scheduledAction);

    if (!this.paused) {
      this.armScheduledAction(scheduledAction);
    }
  }

  private armScheduledAction(scheduledAction: ScheduledAction): void {
    if (this.disposed) {
      return;
    }

    scheduledAction.dueAtMs = Date.now() + scheduledAction.remainingMs;
    scheduledAction.timeout = setTimeout(() => {
      this.scheduledActions.delete(scheduledAction);
      scheduledAction.timeout = null;
      scheduledAction.dueAtMs = null;
      if (this.disposed || this.paused) {
        return;
      }

      scheduledAction.action();
    }, scheduledAction.remainingMs);
  }

  private clearScheduledActions(): void {
    for (const scheduledAction of this.scheduledActions) {
      if (scheduledAction.timeout) {
        clearTimeout(scheduledAction.timeout);
      }
    }

    this.scheduledActions.clear();
  }
}
