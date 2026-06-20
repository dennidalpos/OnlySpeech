# 0002 Security Hardening Decisions

## Status

Resolved. No active exception remains in this decision.

## Dependency audit

The Azure Speech SDK transitive `uuid` dependency is overridden to the compatible patched `11.1.1` release. `npm run audit:packaging` requires a clean audit and fails on every finding.

## Electron renderer sandbox

The application preloads are bundled as sandbox-compatible CommonJS entrypoints. Every BrowserWindow uses the Electron sandbox, denies popup creation, and blocks renderer-initiated top-level navigation.

The window posture is:

- `contextIsolation: true` for application and setup wizard windows.
- `nodeIntegration: false` for all BrowserWindow renderers.
- IPC exposed only through typed preload bridges.
- Local setup wizard HTML served from `127.0.0.1`.
- Setup-wizard IPC authorized against the owning control/overlay WebContents, with runtime payload validation and an overlay-specific bridge.
