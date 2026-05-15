# Scripts

`scripts/` contains the stable PowerShell entrypoints for repository operations. `scripts/support/` contains helper scripts, internal implementations, packaging support, documentation tooling, and collateral-generation utilities that are not the primary command surface.

The npm command surface in `package.json` is the compatibility layer for existing workflows. Use npm commands in docs and automation unless a support-only runbook explicitly names a support script.

## Script Classification

| classification | paths | rule |
| --- | --- | --- |
| primary | `scripts/*.ps1`, stable npm aliases in `package.json` | Supported operator, developer, CI, release, and support entrypoints. |
| support | `scripts/support/**/*.ps1`, `scripts/support/**/*.mjs`, `scripts/support/**/*.cjs`, `scripts/support/**/*.html` | Internal implementation, shared helpers, packaging resources, and repo-owned utility tooling. |
| agents | none | No agent-owned script path is supported. Agent scratch files must stay out of the tracked repository. |
| legacy | none | Historical startup shortcut, scheduled-task, per-machine autostart, and duplicate power-settings wrappers are not part of the maintained script surface. |
| removable | none currently tracked | Remove a script only after references in `package.json`, docs, tests, CI, and installer config are checked in the same change. |

Ignored local outputs and workstation-only material such as `.local/`, `dist/`, `artifacts/`, `node_modules/`, and package caches are not part of the tracked script surface.

## Primary Scripts

| name | path | function | when to use | invoked by | dependencies/prerequisites | compatibility or migration notes |
| --- | --- | --- | --- | --- | --- | --- |
| `bootstrap` | `scripts/bootstrap.ps1` | Validates Node/npm baseline and restores dependencies when needed. | Fresh checkout or inconsistent `node_modules`. | `npm run bootstrap`, `verify:repo`. | Windows PowerShell, Node.js 22+, npm 10+, `package-lock.json`. | Moved from `scripts/public/bootstrap.ps1`; npm alias preserved. |
| `build` | `scripts/build.ps1` | Runs renderer and main compilation. | Local compile without packaging. | `npm run build`, `package`, `verify:repo`. | Installed npm dependencies. | Moved from `scripts/public/build.ps1`; npm alias preserved. |
| `clean` | `scripts/clean.ps1` | Removes repo-local generated outputs while preserving dependencies, `.env`, workstation data, and autostart. | Before/after verification or manual cleanup. | `npm run clean`. | PowerShell filesystem access. | Moved from `scripts/public/clean.ps1`; npm alias preserved. |
| `clean-workstation` | `scripts/clean-workstation.ps1` | Removes packaged workstation-local OnlySpeech data. | Support or reinstall flows for packaged runtime state. | `npm run clean:workstation`, `verify:repo -CleanWorkstationData`. | Windows user profile, optional registry access. | Moved from `scripts/public/clean-workstation.ps1`; npm alias preserved. |
| `dev` | `scripts/dev.ps1` | Starts renderer, main compiler, and Electron watch workspace. | Source development. | `npm run dev`. | Installed npm dependencies. | Moved from `scripts/public/dev.ps1`; npm alias preserved. |
| `gate` | `scripts/gate.ps1` | Public verification gate wrapper around `verify-repo.ps1`. | Local release-readiness check. | `npm run gate`. | Same as `verify:repo`; optional package build prerequisites when packaging is enabled. | Moved from `scripts/public/gate.ps1`; npm alias preserved. |
| `license-keygen` | `scripts/license-keygen.ps1` | Launches the repo-local activation key generator. | License issuance on a workstation where the private local generator exists. | `npm run license:keygen`. | `.local/activation-generator/launch-generator.ps1`. | Moved from `scripts/public/license-keygen.ps1`; `.local` remains untracked. |
| `package` | `scripts/package.ps1` | Builds and packages public Windows deliverables. | Producing public installer, portable exe, and unpacked archive. | `npm run package`. | Installed dependencies, electron-builder, `build/installer.nsh`, icons. | Moved from `scripts/public/package.ps1`; npm alias preserved. |
| `start` | `scripts/start.ps1` | Rebuilds stale source outputs and launches Electron locally. | Source runtime launch. | `npm run start`. | Installed dependencies, runtime `.env` or setup wizard defaults. | Moved from `scripts/public/start.ps1`; npm alias preserved. |

## Support Scripts

| name | path | function | when to use | invoked by | dependencies/prerequisites | compatibility or migration notes |
| --- | --- | --- | --- | --- | --- | --- |
| `write-activation-validation-artifact` | `scripts/support/commissioning/write-activation-validation-artifact.ps1` | Writes packaged activation validation template/artifact. | Commissioning preparation. | `npm run activation:template`, tests. | Repo helper library, artifacts directory. | Moved from `scripts/internal/commissioning/`. |
| `run-target-station-automation` | `scripts/support/commissioning/run-target-station-automation.ps1` | Runs target-station automation and updates validation state. | Real packaged workstation commissioning. | `npm run commission:automation`, runbook. | Packaged profile or repo `.env`, Electron automation support. | Moved from `scripts/internal/commissioning/`. |
| `test-packaged-install-lifecycle` | `scripts/support/commissioning/test-packaged-install-lifecycle.ps1` | Validates packaged install/startup lifecycle. | Full verification and release readiness. | `npm run test:packaged-lifecycle`, `verify:repo`. | Built installer artifacts, Windows installer behavior. | Moved from `scripts/internal/commissioning/`. |
| `test-packaged-runtime-automation` | `scripts/support/commissioning/test-packaged-runtime-automation.ps1` | Validates packaged runtime automation against `win-unpacked`. | Optional full gate automation. | `npm run test:packaged-automation`, `verify:repo -EnablePackagedAutomation`. | Built `artifacts/packages/win-unpacked`. | Moved from `scripts/internal/commissioning/`. |
| `write-commissioning-artifact` | `scripts/support/commissioning/write-commissioning-artifact.ps1` | Writes commissioning evidence and target-station templates. | Commissioning template or handover generation. | `npm run commission:template`, `npm run commission:handover`. | Artifacts directory, optional target-station validation file. | Moved from `scripts/internal/commissioning/`. |
| `write-live-provider-speech-proof-artifact` | `scripts/support/commissioning/write-live-provider-speech-proof-artifact.ps1` | Writes live provider speech proof template. | Manual live-provider evidence collection. | `npm run speech:matrix-template`. | Packaged profile or repo `.env`. | Moved from `scripts/internal/commissioning/`. |
| `write-packaged-closeout-validation-artifact` | `scripts/support/commissioning/write-packaged-closeout-validation-artifact.ps1` | Writes packaged autostart and retained-installer upgrade/rollback validation template. | Manual packaged close-out evidence collection. | `npm run commission:closeout-template`, runbook, tests. | Package metadata, optional retained package outputs and comparison installers. | Complements activation, commissioning, and live-provider proof artifacts. |
| `capture-product-screenshots` | `scripts/support/docs/capture-product-screenshots.mjs` | Electron automation utility that captures product screenshots. | Indirectly through screenshot writer. | `write-product-screenshots.ps1`. | Compiled app, Electron, Node.js. | Moved from `tooling/docs/`. |
| `marketplace-demo-video` | `scripts/support/docs/marketplace-demo-video.html` | Browser page used by the marketplace video renderer. | Indirectly through demo video renderer. | `render-marketplace-demo-video-electron.mjs`. | Electron browser window. | Moved from `tooling/docs/`; support asset, not direct entrypoint. |
| `render-marketplace-demo-video` | `scripts/support/docs/render-marketplace-demo-video.mjs` | Spawns Electron renderer harness for marketplace demo video. | Indirectly through `write-product-demo-video.ps1`. | `write-product-demo-video.ps1`. | Electron, Node.js. | Moved from `tooling/docs/`. |
| `render-marketplace-demo-video-electron` | `scripts/support/docs/render-marketplace-demo-video-electron.mjs` | Electron harness that renders demo video and poster. | Indirectly through `render-marketplace-demo-video.mjs`. | `render-marketplace-demo-video.mjs`. | Electron. | Moved from `tooling/docs/`. |
| `write-brand-assets` | `scripts/support/docs/write-brand-assets.ps1` | Regenerates source SVGs, PNG exports, web favicon/social assets, and Windows ICO from the tracked OnlySpeech brand baseline. | Brand asset refresh after deliberate visual changes. | Manual docs runbook. | Windows PowerShell, `System.Drawing`. | Support collateral script, not a stable npm entrypoint. |
| `write-product-demo-video` | `scripts/support/docs/write-product-demo-video.ps1` | Writes optional marketplace demo video and poster. | Product collateral generation after review need. | Manual runbook reference. | Node.js, Electron, support renderer. | Moved from `scripts/internal/docs/`. |
| `write-product-screenshots` | `scripts/support/docs/write-product-screenshots.ps1` | Compiles and regenerates optional product screenshots. | Product collateral refresh. | `npm run docs:screenshots`. | Compiled app, Electron automation. | Moved from `scripts/internal/docs/`. |
| `plans` | `scripts/support/lib/plans.ps1` | Shared planning helpers for runtime logs and Windows local-data paths. | Dot-sourced only. | Runtime support scripts. | PowerShell. | Moved from `scripts/internal/lib/`. |
| `repo` | `scripts/support/lib/repo.ps1` | Shared repo root, Node baseline, process-release, and step helpers. | Dot-sourced only. | Primary and support PowerShell scripts. | PowerShell, Node/npm checks where called. | Moved from `scripts/internal/lib/`. |
| `assert-release-tag` | `scripts/support/packaging/assert-release-tag.ps1` | Validates release tag against `package.json` version. | Tagged release workflow. | `npm run release:tag-check`, release CI. | Node.js/package metadata. | Moved from `scripts/internal/packaging/`. |
| `assert-installer-prerequisites` | `scripts/support/packaging/assert-installer-prerequisites.ps1` | Validates clean Windows client software prerequisites before setup continues. | Installer preflight and packaging tests. | `package-core.ps1` copies it to `build/` for `build/installer.nsh`. | Windows PowerShell 5.1, Windows client APIs. | Blocks unsupported Windows/software baselines before app files are installed. |
| `check-windows-signing` | `scripts/support/packaging/check-windows-signing.ps1` | Validates Windows signing inputs. | Tagged release workflow or manual signing check. | `npm run release:signing-check`, release CI. | Signing env vars when required. | Moved from `scripts/internal/packaging/`. |
| `configure-power-settings` | `scripts/support/packaging/configure-power-settings.ps1` | Configures Windows power settings for kiosk install. | Installer post-install, or explicit operator support run. | `package-core.ps1` copies it to `build/` for `build/installer.nsh`. | Elevated Windows installer context for machine-scope settings. | Moved from `build/configure-power-settings.ps1`; generated `build/` copy is ignored. |
| `electron-builder-compat-preload` | `scripts/support/packaging/electron-builder-compat-preload.cjs` | Patches electron-builder Windows child-process behavior and warning level. | Indirect packaging support. | `package-core.ps1` through `NODE_OPTIONS`. | electron-builder internals. | Moved from `tooling/packaging/`. |
| `package-audit` | `scripts/support/packaging/package-audit.ps1` | Validates expected packaging audit state. | Gate and release verification. | `npm run audit:packaging`, `verify:repo`. | npm audit metadata. | Moved from `scripts/internal/packaging/`. |
| `package-core` | `scripts/support/packaging/package-core.ps1` | Canonical electron-builder runner and public artifact cleanup. | Packaging implementation. | `scripts/package.ps1`, `package:internal`, `verify:repo`. | Build outputs, electron-builder, packaging preload. | Moved from `scripts/internal/packaging/`. |
| `package-release-artifacts` | `scripts/support/packaging/package-release-artifacts.ps1` | Assembles customer-facing release bundle. | After package artifacts exist. | `npm run release:customer-bundle`. | Existing artifacts/packages and buyer docs. | Moved from `scripts/internal/packaging/`. |
| `write-release-compliance-artifacts` | `scripts/support/packaging/write-release-compliance-artifacts.ps1` | Writes notices and SBOM artifacts. | Release evidence generation. | `npm run release:compliance`, `verify:repo`. | `package-lock.json`, package artifacts for hashes. | Moved from `scripts/internal/packaging/`. |
| `write-release-evidence` | `scripts/support/packaging/write-release-evidence.ps1` | Writes retained release evidence metadata. | Release evidence generation. | `npm run release:evidence`, `verify:repo`. | Existing package artifacts. | Moved from `scripts/internal/packaging/`. |
| `clear-local-workstation-data` | `scripts/support/runtime/clear-local-workstation-data.ps1` | Deletes packaged workstation-local state. | Indirectly through stable wrapper or support-only direct call. | `scripts/clean-workstation.ps1`. | Windows profile, optional registry cleanup. | Moved from `scripts/internal/runtime/`. |
| `clear-trial-tombstone` | `scripts/support/runtime/clear-trial-tombstone.ps1` | Clears packaged trial tombstone registry value. | Narrow support reset. | Manual support runbook. | Windows registry access. | Moved from `scripts/internal/runtime/`. |
| `manage-runtime-logs` | `scripts/support/runtime/manage-runtime-logs.ps1` | Reports, exports, and cleans runtime logs. | Support diagnostics. | Manual support runbook. | Runtime log paths. | Moved from `scripts/internal/runtime/`. |
| `repair-microphones` | `scripts/support/runtime/repair-microphones.ps1` | Opens setup wizard on microphone repair path. | Support diagnostics. | Doctor guidance. | Electron launcher. | Moved from `scripts/internal/runtime/`. |
| `run-workstation` | `scripts/support/runtime/run-workstation.ps1` | Workstation-aware launcher with optional packaged preference. | Internal launch support. | `repair-microphones.ps1` and runtime flows. | Built or packaged app depending mode. | Moved from `scripts/internal/runtime/`. |
| `start-local` | `scripts/support/runtime/start-local.ps1` | Source launcher with stale output detection and smoke mode. | Indirectly through `npm run start` and gate smoke. | `scripts/start.ps1`, `verify:repo`. | Source build outputs or installed dependencies. | Moved from `scripts/internal/runtime/`. |
| `workstation-runtime-doctor` | `scripts/support/runtime/workstation-runtime-doctor.ps1` | Electron-based display and microphone diagnostics. | Doctor/runtime diagnostics. | `doctor.ps1`. | Electron diagnostic path. | Moved from `scripts/internal/runtime/`. |
| `clean-repo` | `scripts/support/workspace/clean-repo.ps1` | Canonical non-destructive repo cleanup implementation. | Indirectly through clean and verify. | `scripts/clean.ps1`, `clean:repo`, `verify:repo`. | PowerShell filesystem access. | Moved from `scripts/internal/workspace/`. |
| `doctor` | `scripts/support/workspace/doctor.ps1` | Repository and workstation readiness checks. | Verification and manual diagnostics. | `verify:repo`. | Node/npm, package metadata, optional Electron diagnostics. | Moved from `scripts/internal/workspace/`. |
| `reset-repo` | `scripts/support/workspace/reset-repo.ps1` | Stronger repository reset flow. | Maintenance only. | `npm run clean:reset`. | PowerShell filesystem access. | Moved from `scripts/internal/workspace/`. |
| `verify-repo` | `scripts/support/workspace/verify-repo.ps1` | Canonical repository verification sequence. | CI, release, and local full gate. | `npm run verify:repo`, `scripts/gate.ps1`, GitHub workflows. | Bootstrap, doctor, tests, build, packaging scripts, optional packaged automation. | Moved from `scripts/internal/workspace/`. |

## Gate Sequence

`scripts/gate.ps1` delegates to `scripts/support/workspace/verify-repo.ps1`. The supported sequence is:

1. Clean repo outputs.
2. Optionally clean packaged workstation data.
3. Bootstrap dependencies unless skipped.
4. Run doctor.
5. Run `npm test`.
6. Run source smoke start unless skipped.
7. Run source build.
8. Run Electron e2e.
9. Run packaging audit.
10. Build internal package unless skipped.
11. Run packaged lifecycle validation unless skipped.
12. Optionally run packaged runtime automation.
13. Retain unpacked archive, release evidence, and compliance artifacts.
14. Clean generated outputs unless `-KeepOutputs` is set.

The gate fails at the first failing step through `Invoke-OnlySpeechStep` and prints the exact command label before execution.

## Migration Notes

- Primary wrappers moved from `scripts/public/*.ps1` to `scripts/*.ps1`.
- Internal scripts moved from `scripts/internal/*` to `scripts/support/*`.
- Repo-owned Node tooling moved from `tooling/*` to `scripts/support/*`.
- The installer power-settings and prerequisite scripts live under `scripts/support/packaging/`; `package-core.ps1` copies them into `build/` during packaging because `build/installer.nsh` consumes them from electron-builder's build resources directory.
