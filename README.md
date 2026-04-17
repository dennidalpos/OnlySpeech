<p align="center"><img src="build/icon.png" alt="OnlySpeech logo" width="96" /></p>

<h1 align="center">OnlySpeech</h1>

<p align="center"><strong>Windows-first desktop workstation for assisted two-person speech translation.</strong></p>

OnlySpeech is an Electron desktop application for guided in-person conversations on a single Windows PC with two display surfaces. The repository combines operator and visitor views, workstation setup, live-provider speech routing, packaged activation support, and deterministic demo validation in a Windows-first delivery model.

## Verified Feature Set

- Two coordinated conversation surfaces on one Windows workstation.
- Guided language confirmation before live speech starts.
- Push-to-talk conversation flow for two dedicated microphones or one shared microphone.
- Setup for displays, microphones, provider credentials, diagnostics, packaged license state, and startup preferences.
- Provides a demo mode for repeatable validation without live provider credentials.
- Supports Azure Speech or OpenAI-backed live translation when configured.
- Packaged Windows delivery through installer, portable executable, and retained unpacked archive outputs.

## Windows-First Local Setup

1. Use Windows x64 with Node.js 22+ and npm 10+.
2. Run `npm run bootstrap`.
3. Run `npm run dev` for the source development workspace, or `npm run start` for a direct source launch.
4. If no repo-root `.env` exists, the integrated setup wizard opens for the first configuration.

Runtime use expects two active displays and either two assignable microphones or one shared microphone profile.

## Project Status

The repository is private-package software at version `0.1.0` with Windows CI, automated tests, source-mode launch scripts, and Windows packaging scripts checked into the repository.

Current tracked blockers remain external or workstation-specific:

- Windows signing credentials for tagged releases.
- Retained previous installers for upgrade and rollback validation.
- Packaged activation validation on the real target workstation.
- Target-workstation commissioning and live provider speech proof on real hardware.
- Deployment-specific legal and privacy review.

## Technical Docs

- [docs/README.md](docs/README.md): technical documentation map.
- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md): runtime, configuration, verification, packaging, output, and release boundaries.
- [scripts/README.md](scripts/README.md): PowerShell and npm script surface.
- [docs/product/provider-setup.md](docs/product/provider-setup.md): Azure and ChatGPT provider setup boundaries.
- [docs/product/screenshots/](docs/product/screenshots): tracked product screenshots generated from the repository tooling.
- [PROJECT_STATUS.json](PROJECT_STATUS.json): current external and workstation-specific blockers.
