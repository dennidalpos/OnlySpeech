import { session, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../shared/constants.js";
import type { AppState, DisplayAssignment, RendererCommand, Side, TechnicalIssue } from "../shared/types.js";
import { JsonlLogger } from "../services/logging/jsonl-logger.js";
import { DisplayManager } from "./display-manager.js";
import { createOperatorWindow, syncWindowToDisplay } from "./window-factory.js";
import { applyMediaPermissionPolicy } from "./media-permission-policy.js";

interface KioskDisplayRuntimeOptions {
  displayManager: DisplayManager;
  logger: JsonlLogger;
  getState: () => AppState;
  devServerUrl?: string;
}

export interface KioskWindowAutomationSnapshot {
  view: "visitor-language-selection" | "visitor-session" | "operator-session" | "technical-error" | "unknown";
  documentLanguage: string | null;
  direction: string | null;
  selectorTitle: string | null;
  selectorDescription: string | null;
  selectedLanguageTileLabel: string | null;
  selectedLanguageTileAriaLabel: string | null;
  activeMacroAreaLabel: string | null;
  macroAreaLabels: string[];
  currentLanguageChipTitle: string | null;
  currentLanguageChipValue: string | null;
  currentLanguageChipEnglish: string | null;
  currentLanguageChipConfigured: string | null;
  currentLanguageChipMeta: string | null;
  changeLanguageLabel: string | null;
  statusLabel: string | null;
}

export class KioskDisplayRuntime {
  private readonly windows = new Map<Side, BrowserWindow>();

  private stopWatchingDisplays: (() => void) | null = null;

  constructor(private readonly options: KioskDisplayRuntimeOptions) {}

  initialize(onDisplayChanged: () => void): void {
    applyMediaPermissionPolicy(session.defaultSession);

    this.stopWatchingDisplays = this.options.displayManager.watch(onDisplayChanged);
  }

  shutdown(): void {
    this.stopWatchingDisplays?.();
    this.stopWatchingDisplays = null;

    for (const window of this.windows.values()) {
      if (!window.isDestroyed()) {
        window.destroy();
      }
    }

    this.windows.clear();
  }

  getSnapshot(): Array<{
    side: Side;
    destroyed: boolean;
    visible: boolean;
    fullScreen: boolean;
    kiosk: boolean;
    bounds: { x: number; y: number; width: number; height: number } | null;
  }> {
    return [...this.windows.entries()].map(([side, window]) => ({
      side,
      destroyed: window.isDestroyed(),
      visible: !window.isDestroyed() && window.isVisible(),
      fullScreen: !window.isDestroyed() && window.isFullScreen(),
      kiosk: !window.isDestroyed() && window.isKiosk(),
      bounds: !window.isDestroyed() ? window.getBounds() : null
    }));
  }

  async captureWindow(side: Side): Promise<Buffer | null> {
    const window = this.windows.get(side);
    if (!window || window.isDestroyed()) {
      return null;
    }

    if (window.webContents.isLoadingMainFrame()) {
      await new Promise<void>((resolve) => {
        window.webContents.once("did-finish-load", () => resolve());
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    return window.capturePage().then((image) => image.toPNG());
  }

  async inspectWindow(side: Side): Promise<KioskWindowAutomationSnapshot | null> {
    const window = this.windows.get(side);
    if (!window || window.isDestroyed()) {
      return null;
    }

    if (window.webContents.isLoadingMainFrame()) {
      await new Promise<void>((resolve) => {
        window.webContents.once("did-finish-load", () => resolve());
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    return window.webContents.executeJavaScript(`
      (() => {
        const normalizeText = (value) => {
          if (typeof value !== "string") {
            return null;
          }

          const normalized = value.replace(/\\s+/g, " ").trim();
          return normalized.length > 0 ? normalized : null;
        };

        const queryText = (selector) => {
          const element = document.querySelector(selector);
          return normalizeText(element?.textContent ?? null);
        };

        const queryTexts = (selector) =>
          Array.from(document.querySelectorAll(selector))
            .map((element) => normalizeText(element.textContent ?? null))
            .filter((value) => typeof value === "string");

        const selectedTile = document.querySelector(".visitor-language-tile.selected");
        const secondaryButtons = Array.from(document.querySelectorAll("button.secondary-button"))
          .map((button) => normalizeText(button.textContent ?? null))
          .filter((value) => typeof value === "string");
        const statusBadge = Array.from(document.querySelectorAll(".status-badge, [class*='status-badge']"))
          .map((element) => normalizeText(element.textContent ?? null))
          .find((value) => typeof value === "string") ?? null;
        const visitorSelection = document.querySelector(".visitor-language-selection");
        const visitorSession = document.querySelector(".visitor-screen");
        const operatorSession = document.querySelector(".operator-screen");
        const technicalError = document.querySelector(".technical-error-view");
        const directionTarget = visitorSession ?? visitorSelection ?? operatorSession ?? document.body;

        return {
          view: visitorSelection
            ? "visitor-language-selection"
            : visitorSession
              ? "visitor-session"
              : operatorSession
                ? "operator-session"
                : technicalError
                  ? "technical-error"
                  : "unknown",
          documentLanguage: normalizeText(document.documentElement.getAttribute("lang")),
          direction: typeof window.getComputedStyle === "function"
            ? window.getComputedStyle(directionTarget).direction
            : null,
          selectorTitle: queryText(".visitor-language-selection h1, .language-selection h1"),
          selectorDescription: queryText(".visitor-language-selection .language-description, .language-selection .language-description"),
          selectedLanguageTileLabel: normalizeText(selectedTile?.textContent ?? null),
          selectedLanguageTileAriaLabel: normalizeText(selectedTile?.getAttribute("aria-label") ?? null),
          activeMacroAreaLabel: queryText(".world-map-hotspot.active strong"),
          macroAreaLabels: queryTexts(".world-map-hotspot strong"),
          currentLanguageChipTitle: queryText(".header-chip-row .header-chip > span"),
          currentLanguageChipValue: queryText(".header-chip-row .header-chip .header-chip-value strong"),
          currentLanguageChipEnglish: queryText(".header-chip-row .header-chip .header-chip-english"),
          currentLanguageChipConfigured: queryText(".header-chip-row .header-chip .header-chip-configured"),
          currentLanguageChipMeta: queryText(".header-chip-row .header-chip .header-chip-meta"),
          changeLanguageLabel: secondaryButtons[0] ?? null,
          statusLabel: statusBadge
        };
      })();
    `, true) as Promise<KioskWindowAutomationSnapshot>;
  }

  reconcileDisplays(): { assignments: DisplayAssignment[]; issues: TechnicalIssue[] } {
    const { assignments, issues } = this.options.displayManager.getAssignments();
    const assignedSides = new Set(assignments.map((assignment) => assignment.side));

    for (const assignment of assignments) {
      const existing = this.windows.get(assignment.side);
      if (existing && !existing.isDestroyed()) {
        syncWindowToDisplay(existing, assignment);
      } else {
        const window = createOperatorWindow({
          side: assignment.side,
          assignment,
          devServerUrl: this.options.devServerUrl
        });

        window.on("closed", () => {
          this.windows.delete(assignment.side);
        });

        window.webContents.on("did-finish-load", () => {
          this.sendCommand(assignment.side, { type: "probe-devices" });
          this.sendStateTo(assignment.side);
        });

        this.windows.set(assignment.side, window);
      }
    }

    if (assignedSides.size === 0 && this.windows.size > 0) {
      this.options.logger.log({
        session_id: this.options.getState().sessionId,
        event: "display_detection",
        details: {
          assignments,
          issues,
          preservedExistingWindows: true
        }
      });

      return { assignments, issues };
    }

    for (const [side, window] of this.windows.entries()) {
      if (!assignedSides.has(side) && !window.isDestroyed()) {
        window.close();
      }
    }

    this.options.logger.log({
      session_id: this.options.getState().sessionId,
      event: "display_detection",
      details: {
        assignments,
        issues
      }
    });

    return { assignments, issues };
  }

  sendStateTo(side: Side): void {
    const window = this.windows.get(side);
    if (!window || window.isDestroyed()) {
      return;
    }

    window.webContents.send(IPC_CHANNELS.state, this.options.getState());
  }

  broadcastState(): void {
    for (const side of this.windows.keys()) {
      this.sendStateTo(side);
    }
  }

  sendCommand(side: Side, command: RendererCommand): void {
    const window = this.windows.get(side);
    if (!window || window.isDestroyed()) {
      return;
    }

    window.webContents.send(IPC_CHANNELS.command, command);
  }

  broadcastProbeCommand(): void {
    this.sendCommand("A", { type: "probe-devices" });
    this.sendCommand("B", { type: "probe-devices" });
  }
}
