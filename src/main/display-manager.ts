import { screen } from "electron";
import type { DisplayAssignment, RuntimeConfig, TechnicalIssue } from "../shared/types.js";
import { getAvailableDisplays, type DisplaySnapshot } from "./display-source.js";

function displayToAssignment(side: "A" | "B", display: DisplaySnapshot): DisplayAssignment {
  return {
    side,
    displayId: display.id,
    label: display.label || `Display ${display.id}`,
    bounds: {
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height
    },
    scaleFactor: display.scaleFactor
  };
}

export class DisplayManager {
  constructor(private readonly config: RuntimeConfig) {}

  getAssignments(): { assignments: DisplayAssignment[]; issues: TechnicalIssue[] } {
    const displays = getAvailableDisplays();

    const assignments: DisplayAssignment[] = [];
    const issues: TechnicalIssue[] = [];

    const configuredA =
      this.config.displayAId !== null
        ? displays.find((display) => display.id === this.config.displayAId) ?? null
        : null;
    const configuredB =
      this.config.displayBId !== null
        ? displays.find((display) => display.id === this.config.displayBId) ?? null
        : null;
    const assignedA = configuredA ?? displays[0];
    const assignedB =
      (configuredB && configuredB.id !== assignedA?.id ? configuredB : null) ??
      displays.find((display) => display.id !== assignedA?.id) ??
      null;

    if (assignedA) {
      assignments.push(displayToAssignment("A", assignedA));
    }

    if (assignedB) {
      assignments.push(displayToAssignment("B", assignedB));
    }

    if (assignments.length < this.config.requiredMonitors) {
      issues.push({
        code: "missing-monitor",
        message: "Sono necessari due monitor attivi per avviare la sessione.",
        retryable: true
      });
    }

    return { assignments, issues };
  }

  watch(callback: () => void): () => void {
    let pendingCallback: NodeJS.Timeout | null = null;
    const debouncedCallback = () => {
      if (pendingCallback) {
        clearTimeout(pendingCallback);
      }

      pendingCallback = setTimeout(() => {
        pendingCallback = null;
        callback();
      }, 300);
    };

    screen.on("display-added", debouncedCallback);
    screen.on("display-removed", debouncedCallback);
    screen.on("display-metrics-changed", debouncedCallback);

    return () => {
      if (pendingCallback) {
        clearTimeout(pendingCallback);
        pendingCallback = null;
      }

      screen.removeListener("display-added", debouncedCallback);
      screen.removeListener("display-removed", debouncedCallback);
      screen.removeListener("display-metrics-changed", debouncedCallback);
    };
  }
}
