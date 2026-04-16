<p align="center"><img src="build/icon.png" alt="OnlySpeech logo" width="96" /></p>

<h1 align="center">OnlySpeech</h1>

<p align="center"><strong>Windows-first desktop workstation for assisted two-person speech translation.</strong></p>

OnlySpeech is an Electron desktop app for guided in-person conversations on a single Windows PC with two displays. It provides an operator-facing surface and a visitor-facing surface, routes live speech through a configured provider, and includes a deterministic demo mode for setup and validation.

## What You See

- Two coordinated conversation surfaces on one Windows workstation.
- Guided language confirmation before live speech starts.
- Push-to-talk conversation flow for two dedicated microphones or one shared microphone.
- Setup for displays, microphones, provider credentials, diagnostics, packaged license state, and startup preferences.
- Packaged Windows delivery through installer and portable outputs.

## Why It Matters

- Built for staffed, in-person desktop deployments rather than browser-only use.
- Keeps runtime state workstation-local by default.
- Supports Azure Speech or OpenAI-backed live translation when configured.
- Provides a demo mode for repeatable validation without live provider credentials.
- Keeps technical verification, packaging, release evidence, and customer bundle workflows versioned in the repository.

## First Setup

1. Run `npm run bootstrap`.
2. Run `npm run dev` for the source development workspace, or `npm run start` for a direct source launch.
3. If no repo-root `.env` exists, the integrated setup wizard opens for the first configuration.

Supported local baseline: Windows x64, Node.js 22+, and npm 10+. Runtime use expects two active displays and either two assignable microphones or one shared microphone profile.

## Project Status

The repository is private-package software at version `0.1.0` with active Windows packaging, CI, tests, and release scripts. Current tracked blockers are external to the source tree: Windows signing credentials, target-workstation commissioning, live provider speech proof, installer upgrade/rollback validation, and deployment-specific legal/privacy review.

## Technical Docs

- `docs/README.md`: technical documentation map.
- `docs/PROJECT_SPEC.md`: runtime, configuration, verification, packaging, output, and release boundaries.
- `scripts/README.md`: PowerShell and npm script surface.
- `docs/product/provider-setup.md`: Azure and ChatGPT provider setup boundaries.
- `PROJECT_STATUS.json`: current external blockers and open verification work.
