// @vitest-environment jsdom

import { act } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActivationApp } from "../src/renderer/activation/ActivationApp.js";
import type { OnlySpeechRendererApi } from "../src/shared/onlyspeech-api.js";

let container: HTMLDivElement | null = null;
let root: ReactDOM.Root | null = null;

function bodyText(): string {
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

async function dispatchInput(element: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  const eventCtor = element.ownerDocument.defaultView?.Event ?? Event;
  const prototype = element instanceof HTMLTextAreaElement
    ? (element.ownerDocument.defaultView?.HTMLTextAreaElement.prototype ?? HTMLTextAreaElement.prototype)
    : (element.ownerDocument.defaultView?.HTMLInputElement.prototype ?? HTMLInputElement.prototype);
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new eventCtor("input", { bubbles: true }));
    element.dispatchEvent(new eventCtor("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function dispatchSubmit(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

async function renderActivationApp(api: OnlySpeechRendererApi): Promise<void> {
  window.onlySpeech = api;
  container = document.createElement("div");
  container.id = "root";
  document.body.innerHTML = "";
  document.body.appendChild(container);
  root = ReactDOM.createRoot(container);

  await act(async () => {
    root?.render(<ActivationApp />);
    await Promise.resolve();
  });
}

beforeEach(() => {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: "en-US"
  });
});

afterEach(async () => {
  await act(async () => {
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
  container?.remove();
  container = null;
  document.body.innerHTML = "";
  delete (window as Partial<Window>).onlySpeech;
});

function createApi(overrides: Partial<OnlySpeechRendererApi> = {}): OnlySpeechRendererApi {
  return {
    getActivationGateState: vi.fn(async () => ({
      status: "required",
      message: "Activation is required before startup can continue."
    })),
    submitActivation: vi.fn(async () => ({
      ok: true,
      status: "success",
      message: "Activation successful."
    })),
    sendOperatorAction: vi.fn(),
    openSetupWizard: vi.fn(),
    sendDeviceProbe: vi.fn(),
    sendSpeechEvent: vi.fn(),
    processSpeechTurn: vi.fn(),
    synthesizeTextToSpeech: vi.fn(),
    requestTextToSpeech: vi.fn(),
    stopTextToSpeech: vi.fn(),
    sendTextToSpeechEvent: vi.fn(),
    shutdownComputer: vi.fn(),
    onState: vi.fn(() => () => undefined),
    onCommand: vi.fn(() => () => undefined),
    ...overrides
  };
}

describe("activation ui", () => {
  it("renders the required activation state from the main-process bridge", async () => {
    await renderActivationApp(createApi());

    expect(bodyText()).toContain("Unlock this workstation");
    expect(bodyText()).toContain("Activation is required before startup can continue.");
  });

  it("renders packaged startup failure states already returned by the main process", async () => {
    await renderActivationApp(createApi({
      getActivationGateState: vi.fn(async () => ({
        status: "clock-rollback",
        message: "Local clock rollback exceeds the offline activation tolerance."
      }))
    }));

    expect(bodyText()).toContain("Local clock rollback exceeds the offline activation tolerance.");
  });

  it("refreshes the activation status from the dedicated retry action", async () => {
    const api = createApi({
      getActivationGateState: vi.fn()
        .mockResolvedValueOnce({
          status: "required",
          message: "Activation is required before startup can continue."
        })
        .mockResolvedValueOnce({
          status: "invalid-code",
          message: "Activation code is invalid."
        })
    });

    await renderActivationApp(api);
    await dispatchSubmit(document.querySelector(".activation-tertiary-button") as HTMLButtonElement);

    expect(api.getActivationGateState).toHaveBeenCalledTimes(2);
    expect(bodyText()).toContain("Activation code is invalid.");
  });

  it("keeps technical refresh failures available behind the details toggle", async () => {
    const api = createApi({
      getActivationGateState: vi.fn()
        .mockResolvedValueOnce({
          status: "required",
          message: "Activation is required before startup can continue."
        })
        .mockRejectedValueOnce(new Error("Bridge refresh failed."))
    });

    await renderActivationApp(api);
    await dispatchSubmit(document.querySelector(".activation-tertiary-button") as HTMLButtonElement);

    expect(bodyText()).toContain("Activation services are unavailable in this runtime.");

    const detailsButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Error details")
    ) as HTMLButtonElement | undefined;

    expect(detailsButton).toBeDefined();

    await dispatchSubmit(detailsButton as HTMLButtonElement);

    expect(bodyText()).toContain("Bridge refresh failed.");
  });

  it("shows activation errors returned by the main process", async () => {
    const api = createApi({
      submitActivation: vi.fn(async () => ({
        ok: false,
        status: "email-mismatch",
        message: "Activation code does not match the provided customer email."
      }))
    });

    await renderActivationApp(api);

    await dispatchInput(document.querySelector('input[name="activation-email"]') as HTMLInputElement, "buyer@example.com");
    await dispatchInput(document.querySelector('textarea[name="activation-code"]') as HTMLTextAreaElement, "OS1.payload.signature");
    await dispatchSubmit(document.querySelector(".activation-submit") as HTMLButtonElement);

    expect(api.submitActivation).toHaveBeenCalledWith({
      email: "buyer@example.com",
      activationCode: "OS1.payload.signature"
    });
    expect(bodyText()).toContain("Activation code does not match the provided customer email.");
  });

  it("shows expired activation failures returned by the main process", async () => {
    const api = createApi({
      submitActivation: vi.fn(async () => ({
        ok: false,
        status: "expired-license",
        message: "The stored activation is expired."
      }))
    });

    await renderActivationApp(api);

    await dispatchInput(document.querySelector('input[name="activation-email"]') as HTMLInputElement, "buyer@example.com");
    await dispatchInput(document.querySelector('textarea[name="activation-code"]') as HTMLTextAreaElement, "OS1.payload.signature");
    await dispatchSubmit(document.querySelector(".activation-submit") as HTMLButtonElement);

    expect(bodyText()).toContain("The stored activation is expired.");
  });

  it("shows a success state after activation is accepted", async () => {
    await renderActivationApp(createApi());

    await dispatchInput(document.querySelector('input[name="activation-email"]') as HTMLInputElement, "buyer@example.com");
    await dispatchInput(document.querySelector('textarea[name="activation-code"]') as HTMLTextAreaElement, "OS1.payload.signature");
    await dispatchSubmit(document.querySelector(".activation-submit") as HTMLButtonElement);

    expect(bodyText()).toContain("Activation accepted. Continuing startup...");
  });

  it("clears the local form fields without changing the status area", async () => {
    await renderActivationApp(createApi());

    const emailInput = document.querySelector('input[name="activation-email"]') as HTMLInputElement;
    const codeInput = document.querySelector('textarea[name="activation-code"]') as HTMLTextAreaElement;

    await dispatchInput(emailInput, "buyer@example.com");
    await dispatchInput(codeInput, "OS1.payload.signature");
    await dispatchSubmit(document.querySelector(".activation-secondary-button") as HTMLButtonElement);

    expect(emailInput.value).toBe("");
    expect(codeInput.value).toBe("");
    expect(bodyText()).toContain("Activation is required before startup can continue.");
  });

  it("shows the trial-exhausted state when the packaged trial is no longer available", async () => {
    const api = createApi({
      submitTrial: vi.fn(async () => ({
        ok: false,
        status: "trial-exhausted",
        message: "The trial has already been used on this device. Purchase a license to continue."
      }))
    });

    await renderActivationApp(api);
    await dispatchSubmit(document.querySelector(".activation-trial-button") as HTMLButtonElement);

    expect(bodyText()).toContain("The trial has already been used on this device. Purchase a license to continue.");
  });
});
