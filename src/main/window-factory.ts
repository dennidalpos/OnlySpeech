import { BrowserWindow, screen } from "electron";
import { fileURLToPath } from "node:url";
import type { Bounds, DisplayAssignment, Side } from "../shared/types.js";
import { installWindowNavigationGuards } from "./window-security.js";

interface CreateOperatorWindowOptions {
  side: Side;
  assignment: DisplayAssignment;
  devServerUrl?: string;
}

const preloadPath = fileURLToPath(new URL("./preload.cjs", import.meta.url));
const rendererHtmlPath = fileURLToPath(new URL("../renderer/index.html", import.meta.url));

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function clampBoundsToVisibleArea(
  bounds: Bounds,
  options: {
    useWorkArea?: boolean;
    minimumWidth?: number;
    minimumHeight?: number;
  } = {}
): Bounds {
  const displays = screen.getAllDisplays();
  if (displays.length === 0) {
    return bounds;
  }

  const targetDisplay = screen.getDisplayMatching(bounds);
  const fallbackDisplay = targetDisplay ?? screen.getPrimaryDisplay() ?? displays[0];
  const visibleArea = options.useWorkArea ? fallbackDisplay.workArea : fallbackDisplay.bounds;
  const minimumWidth = options.minimumWidth ?? 320;
  const minimumHeight = options.minimumHeight ?? 240;
  const width = clampNumber(bounds.width, minimumWidth, Math.max(minimumWidth, visibleArea.width));
  const height = clampNumber(bounds.height, minimumHeight, Math.max(minimumHeight, visibleArea.height));
  const maxX = visibleArea.x + Math.max(0, visibleArea.width - width);
  const maxY = visibleArea.y + Math.max(0, visibleArea.height - height);

  return {
    x: clampNumber(bounds.x, visibleArea.x, maxX),
    y: clampNumber(bounds.y, visibleArea.y, maxY),
    width,
    height
  };
}

export function ensureWindowIsOnScreen(
  window: BrowserWindow,
  options: {
    useWorkArea?: boolean;
    minimumWidth?: number;
    minimumHeight?: number;
  } = {}
): void {
  if (window.isDestroyed()) {
    return;
  }

  window.setBounds(clampBoundsToVisibleArea(window.getBounds(), options));
}

export function createOperatorWindow(options: CreateOperatorWindowOptions): BrowserWindow {
  const { assignment, side, devServerUrl } = options;
  const initialBounds = clampBoundsToVisibleArea(assignment.bounds);
  const window = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    kiosk: true,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    backgroundColor: "#0d1118",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  installWindowNavigationGuards(window);

  if (devServerUrl) {
    void window.loadURL(`${devServerUrl}?side=${side}`);
  } else {
    void window.loadFile(rendererHtmlPath, { query: { side } });
  }
  window.once("ready-to-show", () => {
    syncWindowToDisplay(window, assignment);
    window.show();
  });
  window.setMenuBarVisibility(false);

  return window;
}

export function syncWindowToDisplay(window: BrowserWindow, assignment: DisplayAssignment): void {
  if (window.isDestroyed()) {
    return;
  }

  const bounds = clampBoundsToVisibleArea(assignment.bounds);
  window.setBounds(bounds);
  window.setPosition(bounds.x, bounds.y);
  window.setSize(bounds.width, bounds.height);
  window.setFullScreen(true);
  if (window.isMinimized()) {
    window.restore();
  }
  if (!window.isVisible()) {
    window.show();
  }
}
