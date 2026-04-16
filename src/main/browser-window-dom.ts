import { once } from "node:events";
import type { BrowserWindow } from "electron";

export interface BrowserWindowSelectorInspection {
  exists: boolean;
  text: string | null;
  value: string | null;
  hidden: boolean | null;
  disabled: boolean | null;
  disabledReason: string | null;
}

export async function waitForBrowserWindowReady(
  window: BrowserWindow
): Promise<void> {
  if (window.webContents.isLoadingMainFrame()) {
    await once(window.webContents, "did-finish-load");
  }

  await new Promise((resolve) => setTimeout(resolve, 200));
}

export async function captureBrowserWindowPng(
  window: BrowserWindow
): Promise<Buffer> {
  await waitForBrowserWindowReady(window);
  const image = await window.capturePage();
  return image.toPNG();
}

export async function inspectBrowserWindowSelectors(
  window: BrowserWindow,
  selectors: string[]
): Promise<Record<string, BrowserWindowSelectorInspection>> {
  await waitForBrowserWindowReady(window);

  return window.webContents.executeJavaScript(
    `(() => {
      const selectors = ${JSON.stringify(selectors)};
      return Object.fromEntries(selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
          return [selector, {
            exists: false,
            text: null,
            value: null,
            hidden: null,
            disabled: null,
            disabledReason: null
          }];
        }

        const value =
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
            ? element.value
            : null;
        const disabled =
          element instanceof HTMLButtonElement ||
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
            ? element.disabled
            : null;

        return [selector, {
          exists: true,
          text: element.textContent ? element.textContent.trim() : "",
          value,
          hidden: element.hidden,
          disabled,
          disabledReason: element.getAttribute("data-disabled-reason")
        }];
      }));
    })()`
  );
}

export async function clickBrowserWindowSelector(
  window: BrowserWindow,
  selector: string
): Promise<void> {
  await waitForBrowserWindowReady(window);
  await window.webContents.executeJavaScript(
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) {
        throw new Error("Wizard element not found: ${selector}");
      }

      element.click();
      return true;
    })()`
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
}

export function focusBrowserWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}
