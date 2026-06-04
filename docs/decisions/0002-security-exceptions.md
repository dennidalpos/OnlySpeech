# 0002 Security Exceptions

## Status

Accepted with review required before release handoff.

## Dependency audit

`npm audit --audit-level=moderate` currently reports the `uuid` advisory through `microsoft-cognitiveservices-speech-sdk`. `npm audit fix` has been applied for the non-breaking remediations. The remaining npm-proposed fix is a semver-major downgrade of the Azure Speech SDK to `1.13.1`, which would move the product away from the current Azure Speech runtime surface.

The repository accepts only the current `microsoft-cognitiveservices-speech-sdk` and transitive `uuid` findings in `npm run audit:packaging`. Any new package name, severity count, or fix shape fails the packaging audit.

## Electron renderer sandbox

The Electron windows keep `sandbox: false` because the current ESM preload build exposes the required `contextBridge` IPC APIs for the kiosk runtime, activation flow, setup wizard, diagnostics, and screenshot automation. Enabling sandbox without changing the preload build prevents those automation surfaces from becoming ready in `npm run test:e2e`.

The accepted window posture remains:

- `contextIsolation: true` for application and setup wizard windows.
- `nodeIntegration: false` for all BrowserWindow renderers.
- IPC exposed only through typed preload bridges.
- Local setup wizard HTML served from `127.0.0.1`.

Revisit this exception when the preload build is converted to a sandbox-compatible bundle.
