import { screen, type Display } from "electron";

export interface DisplaySnapshot {
  id: number;
  label: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeDisplayFixtureEntry(value: unknown): DisplaySnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const bounds = candidate.bounds as Record<string, unknown> | undefined;

  if (
    !isFiniteNumber(candidate.id) ||
    typeof candidate.label !== "string" ||
    !bounds ||
    !isFiniteNumber(bounds.x) ||
    !isFiniteNumber(bounds.y) ||
    !isFiniteNumber(bounds.width) ||
    !isFiniteNumber(bounds.height) ||
    !isFiniteNumber(candidate.scaleFactor)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    label: candidate.label,
    bounds: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    },
    scaleFactor: candidate.scaleFactor
  };
}

function parseDisplayFixture(rawFixture: string | undefined): DisplaySnapshot[] | null {
  if (!rawFixture) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawFixture);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const displays = parsed
      .map((entry) => normalizeDisplayFixtureEntry(entry))
      .filter((entry): entry is DisplaySnapshot => entry !== null);

    return displays.length > 0 ? displays : null;
  } catch {
    return null;
  }
}

export function getAvailableDisplays(env: NodeJS.ProcessEnv = process.env): DisplaySnapshot[] {
  const fixtureDisplays = parseDisplayFixture(env.ONLYSPEECH_DISPLAY_FIXTURE);
  const displays = fixtureDisplays ?? (screen.getAllDisplays() as Display[]);

  return [...displays]
    .map((display) => ({
      id: display.id,
      label: display.label || `Display ${display.id}`,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height
      },
      scaleFactor: display.scaleFactor
    }))
    .sort((left, right) => {
      if (left.bounds.x !== right.bounds.x) {
        return left.bounds.x - right.bounds.x;
      }

      return left.bounds.y - right.bounds.y;
    });
}
