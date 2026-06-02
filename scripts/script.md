# Scripts

Use npm commands for normal operation. Direct PowerShell script paths are documented here so CI, release workflows, and support runbooks stay aligned with the real Windows command surface.

## Script Classification

| classification | paths | rule |
| --- | --- | --- |
| primary | `scripts/*.ps1`, stable npm aliases in `package.json` | Supported developer, operator, CI, release, and support entrypoints. |
| support | `scripts/support/**/*.ps1`, `scripts/support/**/*.mjs`, `scripts/support/**/*.cjs`, `scripts/support/**/*.html` | Internal implementation, shared helpers, packaging resources, and repo-owned utility tooling. |
| agents | none | No agent-owned script path is supported. Scratch files must stay out of tracked source. |
| legacy | none | No legacy script path is part of the maintained command surface. |
| removable | none currently tracked | Remove a script only after checking `package.json`, docs, tests, CI, and installer config in the same change. |

Ignored local outputs such as `.local/`, `dist/`, `artifacts/`, `node_modules/`, and package caches are not part of the tracked script surface.

## Primary Scripts

| command | path | purpose | prerequisites | main callers |
| --- | --- | --- | --- | --- |
| `npm run bootstrap` | `scripts/bootstrap.ps1` | Validate Node.js/npm and run deterministic dependency restore when needed. | Windows PowerShell, Node.js 22+, npm 10+, `package-lock.json`. | Developer setup, `verify:repo`. |
| `npm run dev` | `scripts/dev.ps1` | Start renderer, main compiler, and Electron watch workspace. | Installed npm dependencies. | Local development. |
| `npm run start` | `scripts/start.ps1` | Build stale source outputs and launch Electron locally. | Installed dependencies, runtime `.env` or setup wizard path. | Local source runtime. |
| `npm run build` | `scripts/build.ps1` | Compile renderer and main process output. | Installed npm dependencies. | Local build, package, gate. |
| `npm run gate` | `scripts/gate.ps1` | Public Windows verification wrapper around `verify-repo.ps1`. | Same prerequisites as `verify:repo`. | Local release-readiness checks. |
| `npm run package` | `scripts/package.ps1` | Build public Windows installer, portable executable, and unpacked archive. | Build outputs, electron-builder, packaging assets. | Packaging. |
| `npm run clean` | `scripts/clean.ps1` | Remove repo-local generated outputs while preserving dependencies, `.env`, workstation data, and autostart. | PowerShell filesystem access. | Local cleanup. |
| `npm run clean:workstation` | `scripts/clean-workstation.ps1` | Remove packaged workstation-local OnlySpeech state. | Windows user profile and optional registry access. | Support and reinstall flows. |
| `npm run license:keygen` | `scripts/license-keygen.ps1` | Launch the local activation key generator when present. | `.local/activation-generator/launch-generator.ps1`. | License issuance workstation. |

## Npm Command Surface

| command | purpose |
| --- | --- |
| `npm run bootstrap` | Dependency restore. |
| `npm run dev` | Watch-mode source development. |
| `npm run start` | Direct source launch. |
| `npm run start -- -SetupWizard` | Direct source setup wizard launch. |
| `npm run build` | Renderer and main compile. |
| `npm test` | Vitest without Electron e2e. |
| `npm run test:e2e` | Compile and run Electron e2e. |
| `npm run gate -- -KeepOutputs -EnablePackagedAutomation` | Public local production-readiness gate. |
| `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation` | Canonical local/CI/release verification. |
| `npm run package` | Public package build. |
| `npm run docs:screenshots` | Optional product screenshot regeneration. |
| `npm run activation:template` | Packaged activation validation template. |
| `npm run commission:template` | Target-station and commissioning templates. |
| `npm run commission:automation` | Target-station automation against the packaged profile. |
| `npm run commission:closeout-template` | Autostart, upgrade, and rollback validation template. |
| `npm run commission:handover` | Final commissioning evidence generation. |
| `npm run speech:matrix-template` | Live provider speech proof template. |
| `npm run release:evidence` | Release metadata for existing package outputs. |
| `npm run release:compliance` | Third-party notices and SBOM artifacts. |
| `npm run release:customer-bundle` | Customer-facing release bundle assembly. |
| `npm run release:tag-check` | Release tag validation. |
| `npm run release:signing-check` | Windows signing input validation. |

There is no checked-in lint or format command.

## Support Scripts

| path | purpose | main callers |
| --- | --- | --- |
| `scripts/support/workspace/verify-repo.ps1` | Canonical repository verification sequence. | `npm run verify:repo`, `scripts/gate.ps1`, GitHub workflows. |
| `scripts/support/workspace/doctor.ps1` | Repository and workstation readiness checks. | `verify:repo`. |
| `scripts/support/workspace/clean-repo.ps1` | Non-destructive repo cleanup implementation. | `scripts/clean.ps1`, `verify:repo`. |
| `scripts/support/workspace/reset-repo.ps1` | Stronger maintenance reset flow. | `npm run clean:reset`. |
| `scripts/support/runtime/start-local.ps1` | Source launcher with stale output detection and smoke mode. | `scripts/start.ps1`, `verify:repo`. |
| `scripts/support/runtime/run-workstation.ps1` | Workstation-aware launcher. | Runtime support flows. |
| `scripts/support/runtime/workstation-runtime-doctor.ps1` | Electron display and microphone diagnostics. | `doctor.ps1`. |
| `scripts/support/runtime/repair-microphones.ps1` | Open setup wizard on microphone repair path. | Doctor guidance. |
| `scripts/support/runtime/manage-runtime-logs.ps1` | Report, export, and clean runtime logs. | Support runbook. |
| `scripts/support/runtime/clear-local-workstation-data.ps1` | Delete packaged workstation-local state. | `scripts/clean-workstation.ps1`. |
| `scripts/support/runtime/clear-trial-tombstone.ps1` | Clear packaged trial tombstone registry value. | Narrow support reset. |
| `scripts/support/packaging/package-core.ps1` | Canonical electron-builder runner. | `scripts/package.ps1`, `package:internal`, `verify:repo`. |
| `scripts/support/packaging/package-audit.ps1` | Validate expected packaging audit state. | `npm run audit:packaging`, `verify:repo`. |
| `scripts/support/packaging/assert-installer-prerequisites.ps1` | Validate clean Windows client software prerequisites. | Installer packaging resources. |
| `scripts/support/packaging/configure-power-settings.ps1` | Configure Windows kiosk power settings. | Installer packaging resources. |
| `scripts/support/packaging/check-windows-signing.ps1` | Validate Windows signing inputs. | `npm run release:signing-check`. |
| `scripts/support/packaging/assert-release-tag.ps1` | Validate release tag against `package.json`. | `npm run release:tag-check`. |
| `scripts/support/packaging/write-release-evidence.ps1` | Write retained release metadata. | `npm run release:evidence`, `verify:repo`. |
| `scripts/support/packaging/write-release-compliance-artifacts.ps1` | Write notices and SBOM artifacts. | `npm run release:compliance`, `verify:repo`. |
| `scripts/support/packaging/package-release-artifacts.ps1` | Assemble the customer-facing release bundle. | `npm run release:customer-bundle`. |
| `scripts/support/commissioning/write-activation-validation-artifact.ps1` | Write packaged activation validation template/artifact. | `npm run activation:template`. |
| `scripts/support/commissioning/write-commissioning-artifact.ps1` | Write commissioning evidence and target-station templates. | `commission:template`, `commission:handover`. |
| `scripts/support/commissioning/run-target-station-automation.ps1` | Run target-station automation and update validation state. | `npm run commission:automation`. |
| `scripts/support/commissioning/write-live-provider-speech-proof-artifact.ps1` | Write live provider speech proof template. | `npm run speech:matrix-template`. |
| `scripts/support/commissioning/write-packaged-closeout-validation-artifact.ps1` | Write autostart, upgrade, and rollback validation template. | `npm run commission:closeout-template`. |
| `scripts/support/commissioning/test-packaged-install-lifecycle.ps1` | Validate packaged install/startup lifecycle. | `npm run test:packaged-lifecycle`, `verify:repo`. |
| `scripts/support/commissioning/test-packaged-runtime-automation.ps1` | Validate packaged runtime automation against `win-unpacked`. | `npm run test:packaged-automation`, `verify:repo -EnablePackagedAutomation`. |
| `scripts/support/docs/write-product-screenshots.ps1` | Compile and regenerate optional product screenshots. | `npm run docs:screenshots`. |
| `scripts/support/docs/write-brand-assets.ps1` | Regenerate tracked brand assets after deliberate visual changes. | Manual docs runbook. |
| `scripts/support/docs/write-product-demo-video.ps1` | Write optional marketplace demo video and poster. | Manual docs runbook. |
| `scripts/support/lib/repo.ps1` | Shared repo root, Node baseline, process-release, and step helpers. | Primary and support PowerShell scripts. |
| `scripts/support/lib/plans.ps1` | Shared planning helpers for runtime logs and Windows local-data paths. | Runtime support scripts. |

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

The gate fails at the first failing step through `Invoke-OnlySpeechStep` and prints the command label before execution.

## Verification Modifiers

| option | command surface | effect |
| --- | --- | --- |
| `-KeepOutputs` | `gate`, `verify:repo` | Retain generated package and evidence outputs. |
| `-EnablePackagedAutomation` | `gate`, `verify:repo` | Run packaged runtime automation after package lifecycle checks. |
| `-CleanWorkstationData` | `gate`, `verify:repo` | Remove packaged workstation-local state before verification. |
| `-RefreshDependencies` | `gate` | Forward to `verify:repo -ForceRefreshDependencies`. |
| `-ForceRefreshDependencies` | `verify:repo` | Re-run deterministic dependency installation. |
| `-SkipSmokeStart` | `gate`, `verify:repo` | Skip source smoke launch and packaged launch checks where applicable. |
| `-SkipPack` | `gate`, `verify:repo` | Skip packaging and downstream package evidence steps. |
| `-SkipPackagedLifecycle` | `gate`, `verify:repo` | Skip packaged installer lifecycle validation. |
| `-DryRun` | primary wrappers, `verify:repo` | Print planned commands without executing side effects. |
