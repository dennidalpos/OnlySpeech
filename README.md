<p align="center"><img src="build/brand/onlyspeech-logo-dark-920x240.png" alt="OnlySpeech logo" width="460" /></p>

<h1 align="center">OnlySpeech</h1>

<p align="center"><strong>Windows-first desktop workstation for guided two-person speech translation.</strong></p>
<p align="center"><sub>Installer icon source: <code>build/icon.png</code></sub></p>

## Overview

OnlySpeech is an Electron desktop application for one Windows workstation with two coordinated display surfaces: one operator-facing surface and one visitor-facing surface. The repository contains the runtime UI, activation flow, integrated setup wizard, provider integrations, automated verification, Windows packaging, and release/commissioning evidence helpers for the supported delivery path.

The product boundary is intentionally narrow: one Windows PC, guided in-person conversations, customer-owned provider credentials for live speech, and no browser/SaaS or multi-workstation orchestration mode.

## Verified Features

- Operator and visitor runtime surfaces on the same Windows workstation.
- Guided language confirmation before live speech starts.
- Push-to-talk speech flow with either `dual-dedicated` microphones or one `single-shared` microphone.
- Integrated setup for displays, microphones, providers, languages, language/audio quality controls, diagnostics, activation, and packaged autostart preference.
- Live speech paths for `azure` and `chatgpt`.
- Translation-only `ollama` diagnostics and demo validation, without live STT or TTS support.
- Deterministic `demo` mode for validation without provider credentials.
- Windows NSIS installer, portable executable, and versioned unpacked archive outputs.
- Repository verification for source startup, automated tests, packaging audit, packaged lifecycle checks, release evidence, notices, and SBOM generation.

## Windows Production Readiness

OnlySpeech is production-oriented for Windows + PowerShell, but a customer deployment is not cleared by source build/test results alone. Treat a build as deployable only after all of these are true:

- `npm run gate -- -KeepOutputs -EnablePackagedAutomation` passes on Windows.
- `npm audit --audit-level=moderate` and `npm run audit:packaging` are clean or any remaining findings are explicitly accepted for the release.
- A signed installer or approved portable package is produced from the same verified source.
- Packaged activation, commissioning, autostart, upgrade, rollback, live provider speech, and audio/language validation are completed on the target workstation.
- Open blockers in [PROJECT_STATUS.json](PROJECT_STATUS.json) are closed or explicitly accepted by the product owner.
- Retained evidence exists under `artifacts/logs/` for release, compliance, commissioning, activation, live speech, and packaged close-out checks.

## Requirements

- Windows x64 for supported development, CI parity, packaging, and runtime validation.
- PowerShell on Windows for repository scripts.
- Node.js 22+ and npm 10+.
- Packaged workstation: Windows 10/11 x64, built-in Windows PowerShell 5.1, built-in `powercfg.exe`, and Windows Media Foundation components. The NSIS installer blocks before installation when these software prerequisites are missing; portable launch repeats the runtime-safe Windows/Media Foundation check.
- Two active displays for live workstation deployment.
- Either two assignable microphones or one shared assignable microphone.
- Internet access and customer-owned Azure Speech or OpenAI credentials for live `kiosk` speech.
- Optional reachable Ollama host only for translation-only diagnostics or demo-side validation.

## Setup

1. Install Node.js 22+ on Windows.
2. Run `npm run bootstrap`.
3. Run `npm run start -- -SetupWizard` and save the workstation configuration.
4. Use `npm run dev` for the watch workspace, or `npm run start` for a direct source launch.
5. Run `npm test` and `npm run test:e2e` before packaging work.
6. Run `npm run gate -- -KeepOutputs -EnablePackagedAutomation` for the Windows verification gate.
7. Run `npm run package` only after the gate is clean or the remaining blockers are formally accepted.

Use `npm run clean:workstation` only for packaged workstation support or reinstall flows.

## Environment

Runtime configuration is owned by the setup wizard and the source `.env` contract. Do not commit real provider credentials.

Required live-provider values depend on the selected provider:

- `APP_MODE=kiosk` or `demo`.
- `TRANSLATION_PROVIDER=azure`, `chatgpt`, or `ollama`.
- Azure live speech: `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.
- ChatGPT live speech: `CHATGPT_API_KEY`, `CHATGPT_MODEL`, and `CHATGPT_TRANSCRIBE_MODEL`.
- Ollama diagnostics/demo: `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.
- Hardware profile: display IDs, microphone IDs, `MICROPHONE_PTT_MODE`, `REQUIRED_MONITORS`, and `REQUIRED_MICROPHONES`.

## Packaged Workstation Preflight

The installer verifies required software before copying the app:

- Windows 10/11 x64: required because OnlySpeech is packaged and validated as a Windows x64 Electron workstation app. Verify with `winver` and `[Environment]::Is64BitOperatingSystem`.
- Windows PowerShell 5.1: required for the packaged kiosk power-settings step. Verify with `$PSVersionTable.PSVersion`.
- Windows `powercfg.exe`: required to apply kiosk power and display timeout settings. Verify with `powercfg /?`.
- Windows Media Foundation: required for Electron microphone capture and live speech validation. On Windows N editions, install the official Microsoft Media Feature Pack and reboot. Verify with `Test-Path "$env:SystemRoot\System32\mfplat.dll"` and `Test-Path "$env:SystemRoot\System32\mfreadwrite.dll"`.

## Commands

| command | purpose |
| --- | --- |
| `npm run bootstrap` | Validate the Node/npm baseline and restore dependencies with the deterministic install path when needed. |
| `npm run bootstrap -- -ForceRefresh` | Force a deterministic dependency reinstall with `npm ci --include=dev --omit=optional`. |
| `npm run dev` | Start renderer, main-process compiler, and Electron in watch mode. |
| `npm run start` | Build stale/missing source outputs and launch Electron locally. |
| `npm run start -- -SetupWizard` | Launch the source app directly into the integrated setup wizard. |
| `npm run start -- -SetupWizard -WizardSection provider` | Launch the setup wizard at a supported section: `stations`, `provider`, `languages`, `diagnostics`, or `license`. |
| `npm run build` | Compile renderer and main outputs. |
| `npm run lint` | Run ESLint across source, tests, and JavaScript tooling. |
| `npm run compile` | Run `build:renderer` and `build:main` directly. |
| `npm test` | Run Vitest excluding the compiled Electron e2e test. |
| `npm run test:coverage` | Run the security/runtime coverage suite and enforce minimum thresholds. |
| `npm run test:e2e` | Compile, then run `tests/electron-e2e.test.ts`. |
| `npm run gate -- -KeepOutputs -EnablePackagedAutomation` | Run the full Windows verification gate through the canonical repository verifier, retaining installer outputs when requested. |
| `npm run gate -- -RefreshDependencies -KeepOutputs -EnablePackagedAutomation` | Same gate with forced dependency refresh through the public wrapper. |
| `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation` | Canonical local/CI verification path with packaged automation enabled and outputs retained. |
| `npm run package` | Produce public Windows installer, portable executable, and versioned unpacked archive under `artifacts/packages/`. |
| `npm run clean` | Remove repo-local generated outputs while preserving dependencies, `.env`, workstation data, and autostart state. |
| `npm run clean:workstation` | Remove packaged workstation-local OnlySpeech data for support/reinstall flows. |
| `npm run docs:screenshots` | Regenerate optional product screenshots after compile. |
| `npm run activation:template` | Write the packaged activation validation artifact template. |
| `npm run commission:template` | Write the target-station validation template and commissioning template artifact. |
| `npm run commission:automation` | Run target-station automation against the packaged profile when available. |
| `npm run commission:closeout-template` | Write the packaged close-out validation template for autostart and retained-installer upgrade/rollback evidence. |
| `npm run commission:handover` | Write final commissioning evidence from retained target-station validation. |
| `npm run speech:matrix-template` | Write the live provider speech proof template. |
| `npm run release:evidence` | Write release evidence metadata for existing packaged outputs. |
| `npm run release:compliance` | Write third-party notices and SBOM artifacts. |
| `npm run release:customer-bundle` | Assemble the customer-facing release bundle from existing package outputs and docs. |

Use ESLint, TypeScript build, Vitest, Electron e2e, packaging audit, and the Windows gate as the checked quality surface.

The complete PowerShell script classification and side-effect map lives in [scripts/script.md](scripts/script.md).

## Project Status

The repository has a Windows-first command surface and a canonical verification gate. It is not production-ready until the open blockers in [PROJECT_STATUS.json](PROJECT_STATUS.json) are closed or accepted.

CI and tagged release workflows run `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation`.

## Troubleshooting

- Dependency tree inconsistent: run `npm run bootstrap -- -ForceRefresh`.
- Source launch opens setup instead of kiosk: complete the setup wizard or verify the source `.env` runtime root.
- Demo mode remains on language selection: rebuild source outputs with `npm run build`, then launch with `npm run start`; verify `APP_MODE=demo` and both display windows are receiving runtime state.
- Packaged workstation state is stale: run `npm run clean:workstation`, then provision again.
- Missing microphone or display blockers: reopen setup with `npm run start -- -SetupWizard -WizardSection stations`.
- Provider checks fail: verify the selected `TRANSLATION_PROVIDER`, required provider credentials, network access, region/model values, and language support.
- Gate fails at `test`: run `npm test` directly, fix the failing Vitest file, then rerun the gate.
- Gate fails at `audit-packaging`: run `npm audit --audit-level=moderate` and `npm run audit:packaging`, then remediate or formally accept the findings.
- Windows N live speech failure: install Microsoft Media Feature Pack and reboot before rerunning validation.

## Technical Documentation

- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md): primary technical contract for runtime, configuration, verification, packaging, release, and output boundaries.
- [docs/product/brand-assets.md](docs/product/brand-assets.md): brand asset locations, naming, sizes, regeneration, and consumers.
- [scripts/README.md](scripts/README.md): concise operational script guide.
- [scripts/script.md](scripts/script.md): canonical npm/PowerShell script index, classification, and side-effect map.
- [docs/product/provider-setup.md](docs/product/provider-setup.md): provider setup boundaries and official documentation links.
- [docs/internal/testing/language-speech-matrix.md](docs/internal/testing/language-speech-matrix.md): manual live provider speech proof matrix.
- [docs/internal/testing/packaged-activation-commissioning-runbook.md](docs/internal/testing/packaged-activation-commissioning-runbook.md): real-workstation activation, commissioning, autostart, upgrade, and rollback close-out.
- [docs/customer-bundle/Customer_Quick_Start.md](docs/customer-bundle/Customer_Quick_Start.md): buyer-facing packaged first-use guide.
- [docs/internal/Privacy_and_Commercial_Distribution.md](docs/internal/Privacy_and_Commercial_Distribution.md): repository privacy and commercial-distribution boundary.
- [docs/product/Marketplace_Sales_Package.md](docs/product/Marketplace_Sales_Package.md): seller-facing marketplace copy baseline, not buyer-bundle documentation.
