import { BrowserWindow, screen } from "electron";
import { fileURLToPath } from "node:url";
import { clampBoundsToVisibleArea, installWindowNavigationGuards } from "./window-factory.js";

interface CreateActivationWindowOptions {
  devServerUrl?: string;
  onClosed?: () => void;
}

const preloadPath = fileURLToPath(new URL("./preload.cjs", import.meta.url));
const activationHtmlPath = fileURLToPath(new URL("../renderer/activation.html", import.meta.url));

export function createActivationWindow(options: CreateActivationWindowOptions = {}): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const initialBounds = clampBoundsToVisibleArea(
    {
      x: primaryDisplay.workArea.x + Math.max(40, Math.floor(primaryDisplay.workArea.width * 0.08)),
      y: primaryDisplay.workArea.y + Math.max(40, Math.floor(primaryDisplay.workArea.height * 0.08)),
      width: Math.min(1180, primaryDisplay.workArea.width),
      height: Math.min(820, primaryDisplay.workArea.height)
    },
    {
      useWorkArea: true,
      minimumWidth: 860,
      minimumHeight: 620
    }
  );

  const window = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    x: initialBounds.x,
    y: initialBounds.y,
    autoHideMenuBar: true,
    backgroundColor: "#101314",
    minimizable: false,
    maximizable: false,
    resizable: true,
    show: false,
    title: "OnlySpeech Activation",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  installWindowNavigationGuards(window);

  if (options.devServerUrl) {
    const normalizedUrl = options.devServerUrl.endsWith("/")
      ? options.devServerUrl
      : `${options.devServerUrl}/`;
    void window.loadURL(`${normalizedUrl}activation.html`);
  } else {
    void window.loadFile(activationHtmlPath);
  }

  window.once("ready-to-show", () => {
    window.show();
    window.focus();
  });
  window.on("closed", () => {
    options.onClosed?.();
  });

  return window;
}
