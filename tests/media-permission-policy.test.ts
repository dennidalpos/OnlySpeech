import { describe, expect, it, vi } from "vitest";
import { applyMediaPermissionPolicy } from "../src/main/media-permission-policy.js";

function makeSession() {
  let checkHandler: ((_webContents: unknown, permission: string) => boolean) | null = null;
  let requestHandler: ((_webContents: unknown, permission: string, callback: (granted: boolean) => void) => void) | null = null;

  return {
    setPermissionCheckHandler: vi.fn((handler) => {
      checkHandler = handler;
    }),
    setPermissionRequestHandler: vi.fn((handler) => {
      requestHandler = handler;
    }),
    invokeCheckHandler: (permission: string) => {
      if (!checkHandler) throw new Error("checkHandler not set");
      return checkHandler(null, permission);
    },
    invokeRequestHandler: (permission: string): boolean => {
      if (!requestHandler) throw new Error("requestHandler not set");
      let result = false;
      requestHandler(null, permission, (granted) => { result = granted; });
      return result;
    }
  };
}

describe("applyMediaPermissionPolicy", () => {
  it("registers both permission handlers on the session", () => {
    const session = makeSession();
    applyMediaPermissionPolicy(session as never);
    expect(session.setPermissionCheckHandler).toHaveBeenCalledTimes(1);
    expect(session.setPermissionRequestHandler).toHaveBeenCalledTimes(1);
  });

  it("allows only the media permission via checkHandler", () => {
    const session = makeSession();
    applyMediaPermissionPolicy(session as never);
    expect(session.invokeCheckHandler("media")).toBe(true);
    expect(session.invokeCheckHandler("geolocation")).toBe(false);
    expect(session.invokeCheckHandler("notifications")).toBe(false);
  });

  it("grants only the media permission via requestHandler", () => {
    const session = makeSession();
    applyMediaPermissionPolicy(session as never);
    expect(session.invokeRequestHandler("media")).toBe(true);
    expect(session.invokeRequestHandler("geolocation")).toBe(false);
    expect(session.invokeRequestHandler("notifications")).toBe(false);
  });

  it("applies the same policy when called on two independent sessions", () => {
    const sessionA = makeSession();
    const sessionB = makeSession();
    applyMediaPermissionPolicy(sessionA as never);
    applyMediaPermissionPolicy(sessionB as never);

    for (const session of [sessionA, sessionB]) {
      expect(session.invokeCheckHandler("media")).toBe(true);
      expect(session.invokeCheckHandler("camera")).toBe(false);
      expect(session.invokeRequestHandler("media")).toBe(true);
      expect(session.invokeRequestHandler("camera")).toBe(false);
    }
  });
});
