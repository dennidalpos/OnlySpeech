import type { Session } from "electron";

export function applyMediaPermissionPolicy(electronSession: Session): void {
  electronSession.setPermissionCheckHandler((_webContents, permission) => permission === "media");
  electronSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media");
  });
}
