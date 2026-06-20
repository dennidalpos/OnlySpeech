import type { BrowserWindow } from "electron";

/** Blocks renderer-initiated top-level navigation and all popup creation. */
export function installWindowNavigationGuards(window: BrowserWindow): void {
  window.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
