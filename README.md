<p align="center"><img src="build/icon.png" alt="OnlySpeech logo" width="96" /></p>

<h1 align="center">OnlySpeech</h1>

<p align="center"><strong>Windows-first desktop workstation for guided two-person speech translation.</strong></p>

## Overview

OnlySpeech is a Windows-first Electron desktop application for one workstation with two coordinated display surfaces. The repository currently supports the runtime UI, the integrated setup wizard, automated verification, Windows packaging, and the technical evidence used to validate the supported delivery path.

## Verified Features

- One operator-facing and one visitor-facing conversation surface on the same Windows PC.
- Guided language confirmation before live speech starts.
- Push-to-talk speech flow with either two dedicated microphones or one shared microphone profile.
- Integrated setup for displays, microphones, providers, diagnostics, activation, and packaged startup preferences.
- Live speech provider paths for `azure` and `chatgpt`, plus translation-only `ollama` diagnostics and demo validation.
- Deterministic `demo` mode for validation without live provider credentials.
- Windows packaging outputs for installer, portable, and unpacked delivery.

## Verified Windows-First Setup

1. Use Windows x64 with Node.js 22+ and npm 10+.
2. Run `npm run bootstrap`.
3. Run `npm run dev` for the watch workspace, or `npm run start` for a direct source launch.
4. Complete workstation configuration through the integrated setup wizard or the runtime `.env` contract described in the technical documentation.

Live kiosk use still depends on the target workstation having two active displays and either two assignable microphones or one shared microphone profile.

## Current Status

The repository verifies source startup, automated tests, Windows CI, packaged outputs, and packaged install lifecycle from the repository itself. Release completion still depends on external or workstation-specific inputs such as Windows signing credentials, retained comparison installers for upgrade and rollback, target-workstation activation and commissioning evidence, live provider proof on real hardware, optional reachable-server Ollama validation, and deployment-specific legal/privacy review.

## Technical Documentation

- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) for runtime, verification, packaging, and release boundaries.
- [scripts/README.md](scripts/README.md) for the PowerShell and npm command surface.
- [docs/product/provider-setup.md](docs/product/provider-setup.md) for provider setup boundaries and official references.
- [PROJECT_STATUS.json](PROJECT_STATUS.json) for residual follow-up only.
