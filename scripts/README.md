# Scripts

`scripts/` contains the canonical PowerShell entrypoints for the repository.

Public PowerShell access is intentionally limited to eight stable wrappers under `scripts/public/`. Everything else under `scripts/internal/` is internal implementation detail and may change as long as `package.json` npm aliases, `docs/PROJECT_SPEC.md`, and CI stay aligned.

This file is the canonical script index. The repo-root `README.md` is a storefront overview only; the technical command contract lives in `docs/PROJECT_SPEC.md`, and this document explains which PowerShell scripts implement that surface and what side effects they have.

The stable npm surface is broader than `scripts/public/`: `test`, `test:e2e`, `verify:repo`, and `docs:screenshots` are stable npm entrypoints, but they are implemented through internal scripts or direct tool invocations rather than public wrappers.

## Public Scripts

| npm name | path | purpose | side effects |
| --- | --- | --- | --- |
| `bootstrap` | `scripts/public/bootstrap.ps1` | Verifies the supported local Node/npm baseline plus the dependency tree, then restores dependencies only when `node_modules` is missing or inconsistent. | Fails early when Node.js is older than the documented 22+ baseline, and runs `npm ci --include=dev --omit=optional` only when the integrity check fails, `node_modules` is absent, or `-ForceRefresh` is requested. |
| `dev` | `scripts/public/dev.ps1` | Starts the source development watch workspace. | Starts long-running renderer, main, and Electron watch processes. |
| `start` | `scripts/public/start.ps1` | Starts the source runtime only. | Recompiles when source outputs are missing or stale, then launches Electron locally. |
| `build` | `scripts/public/build.ps1` | Compiles renderer and main without cleaning the repo. | Rewrites `dist/` outputs only. |
| `package` | `scripts/public/package.ps1` | Builds and packages the public Windows deliverables. | Produces the `nsis` installer, portable executable, and versioned unpacked archive under `artifacts/packages/`. |
| `clean` | `scripts/public/clean.ps1` | Removes repo-local generated outputs without destroying workstation state. | Deletes repo outputs such as `dist/`, `artifacts/`, caches, and tsbuildinfo while preserving dependencies, `.env`, workstation data, and autostart state. |
| `clean:workstation` | `scripts/public/clean-workstation.ps1` | Removes packaged OnlySpeech workstation-local data for support or reinstall flows. | Deletes `%LOCALAPPDATA%\OnlySpeech`, including the packaged runtime `.env`, activation state, secure secrets, logs, session data, and clears `HKCU\Software\OnlySpeech\Activation\TrialUsedAt`. It does not delete the repo-root `.env`. |
| `license:keygen` | `scripts/public/license-keygen.ps1` | Launches the repo-local activation key generator. | Executes `.local/activation-generator/launch-generator.ps1` when present. |

`license:keygen` depends on `.local/activation-generator/launch-generator.ps1`. The public wrapper fails with a clear error when that local path is missing.

`clean:workstation` is the preferred stable entrypoint for packaged workstation resets. `scripts/internal/runtime/clear-local-workstation-data.ps1` remains the implementation detail behind that public wrapper, and internal setup-wizard/runtime refactors do not change this support boundary.

## Internal Scripts

### `scripts/internal/lib/`

- `repo.ps1`: shared repository helpers for path resolution, supported Node.js baseline checks, process release checks, and deterministic step execution.
- `plans.ps1`: shared planning helpers for runtime logs and Windows startup/autostart setup.

### `scripts/internal/runtime/`

- `start-local.ps1`: canonical source launcher with missing/stale output detection.
- `run-workstation.ps1`: internal workstation-aware launcher with optional packaged preference.
- `clear-local-workstation-data.ps1`: support-only reset for packaged workstation-local data, including `%LOCALAPPDATA%\OnlySpeech` and the trial tombstone registry value.
- `clear-trial-tombstone.ps1`: support-only reset for the packaged trial tombstone stored in `HKCU\Software\OnlySpeech\Activation`.
- `manage-runtime-logs.ps1`: runtime log report, export, and cleanup operations.
- `repair-microphones.ps1`: reopens the setup wizard on the microphone repair path.
- `workstation-runtime-doctor.ps1`: Electron-based workstation diagnostics for displays and microphones.

### `scripts/internal/runtime/startup/`

- `startup-launcher.ps1`: startup launcher with optional git sync detection.
- `install-startup-shortcut.ps1`: installs the Windows Startup shortcut.
- `remove-startup-shortcut.ps1`: removes the Windows Startup shortcut.
- `install-autostart-task.ps1`: installs the scheduled task autostart entry.
- `uninstall-autostart-task.ps1`: removes the scheduled task autostart entry.
- `configure-power-settings.ps1`: wrapper around the canonical power-settings script in `build/`.

Packaged autostart is managed by the setup wizard through the current user's Windows Run entry. The installer removes the old per-machine Run entry during install/uninstall so the wizard toggle can enable or disable startup without admin rights. The Startup shortcut and scheduled-task scripts remain repository-side automation and support utilities for source-mode or explicit maintenance workflows, not the packaged app's normal autostart path.

### `scripts/internal/packaging/`

- `package-core.ps1`: canonical electron-builder entrypoint with distinct `Public` and `Internal` target profiles, keeping only public deliverables plus the versioned unpacked archive for the public profile.
- `package-audit.ps1`: validates that the current packaging dependency tree remains in the expected clean `npm audit` state with zero recorded findings.
- `assert-release-tag.ps1`: validates release tags against `package.json`.
- `check-windows-signing.ps1`: validates Windows signing inputs.
- `write-release-evidence.ps1`: writes retained release evidence metadata.
- `write-release-compliance-artifacts.ps1`: writes notices and SBOM artifacts.
- `package-release-artifacts.ps1`: assembles the customer-facing release bundle from existing `artifacts/packages/` outputs and includes each retained internal evidence file already present under `artifacts/logs/`.

### `scripts/internal/workspace/`

- `clean-repo.ps1`: canonical non-destructive repository clean.
- `reset-repo.ps1`: stronger repo reset flow used for maintenance.
- `doctor.ps1`: repository and workstation readiness checks.
- `verify-repo.ps1`: canonical repository verification flow for local and CI use.

### `scripts/internal/commissioning/`

- `write-activation-validation-artifact.ps1`: writes the packaged activation validation artifact.
- `write-commissioning-artifact.ps1`: writes commissioning evidence and target-station validation state.
- `run-target-station-automation.ps1`: runs target-station commissioning automation, reading the packaged `%LOCALAPPDATA%\OnlySpeech\.env` profile when present and otherwise falling back to the repo-root `.env` or an explicit `-RuntimeEnvPath`.
- `write-live-provider-speech-proof-artifact.ps1`: writes live provider speech proof templates using the packaged runtime profile when present and otherwise falling back to the repo-root `.env` or an explicit `-RuntimeEnvPath`.
- `test-packaged-install-lifecycle.ps1`: verifies packaged installation and startup lifecycle behavior, resetting the repo-local install root deterministically and emitting diagnostics before a single installer retry if setup leaves stale state.
- `test-packaged-runtime-automation.ps1`: verifies packaged runtime automation against `win-unpacked`.

### `scripts/internal/docs/`

- `write-product-demo-video.ps1`: writes the marketplace demo video and poster under `media/marketplace-demo/` using repo-owned tooling.
- `write-product-screenshots.ps1`: regenerates versioned product screenshots using repo-owned tooling.

## Maintenance Rule

Every script addition, removal, or rename must update this file in the same change. `scripts/README.md` is the only canonical script index for the repository.
