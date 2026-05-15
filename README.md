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
3. Use `npm run dev` for the watch workspace, or `npm run start` for a direct source launch.
4. Complete configuration through the integrated setup wizard, or use the `.env` contract implemented in source and described in [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md).
5. For packaged workstation reset support, use `npm run clean:workstation`.

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
| `npm run dev` | Start renderer, main-process compiler, and Electron in watch mode. |
| `npm run start` | Build stale/missing source outputs and launch Electron locally. |
| `npm run build` | Compile renderer and main outputs. |
| `npm run compile` | Run `build:renderer` and `build:main` directly. |
| `npm test` | Run Vitest excluding the compiled Electron e2e test. |
| `npm run test:e2e` | Compile, then run `tests/electron-e2e.test.ts`. |
| `npm run gate -- -KeepOutputs -EnablePackagedAutomation` | Run the full Windows verification gate through the canonical repository verifier, retaining installer outputs when requested. |
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

The complete PowerShell script classification and side-effect map lives in [scripts/script.md](scripts/script.md).

## Project Status

The repository can be built, tested, packaged, and verified from the tracked source on Windows. CI and tagged release workflows both run the canonical repository verification command with packaged automation enabled.

Open residual work is limited to items that require real hardware, retained comparison installers, live provider credentials, dependency remediation that depends on a compatible upstream path, or currently unfinished UI accessibility follow-up. Those items are tracked in [PROJECT_STATUS.json](PROJECT_STATUS.json).

## Technical Documentation

- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md): primary technical contract for runtime, configuration, verification, packaging, release, and output boundaries.
- [docs/product/brand-assets.md](docs/product/brand-assets.md): brand asset locations, naming, sizes, regeneration, and consumers.
- [scripts/script.md](scripts/script.md): canonical npm/PowerShell script index, classification, and side-effect map.
- [docs/product/provider-setup.md](docs/product/provider-setup.md): provider setup boundaries and official documentation links.
- [docs/internal/testing/language-speech-matrix.md](docs/internal/testing/language-speech-matrix.md): manual live provider speech proof matrix.
- [docs/internal/testing/packaged-activation-commissioning-runbook.md](docs/internal/testing/packaged-activation-commissioning-runbook.md): real-workstation activation, commissioning, autostart, upgrade, and rollback close-out.
- [docs/customer-bundle/Customer_Quick_Start.md](docs/customer-bundle/Customer_Quick_Start.md): buyer-facing packaged first-use guide.
- [docs/internal/Privacy_and_Commercial_Distribution.md](docs/internal/Privacy_and_Commercial_Distribution.md): repository privacy and commercial-distribution boundary.
- [docs/product/Marketplace_Sales_Package.md](docs/product/Marketplace_Sales_Package.md): seller-facing marketplace copy baseline, not buyer-bundle documentation.
