<p align="center"><img src="build/icon.png" alt="OnlySpeech logo" width="96" /></p>

<h1 align="center">OnlySpeech</h1>

<p align="center"><strong>Windows-first desktop workstation for guided two-person speech translation.</strong></p>

OnlySpeech is an Electron application for a single Windows workstation with two coordinated display surfaces. The repository includes the runtime UI, setup wizard, diagnostics, source launch scripts, Windows packaging, and retained verification artifacts for workstation handover.

## What You See

- One operator-facing and one visitor-facing conversation surface on the same Windows PC.
- Guided language confirmation before live speech starts.
- Push-to-talk speech flow for either two dedicated microphones or one shared microphone profile.
- Integrated setup for displays, microphones, providers, diagnostics, activation state, and startup preferences.
- `demo` mode for deterministic validation without live provider credentials.
- Windows packaging outputs for installer, portable, and unpacked delivery.

## Why It Matters

The repository is structured for Windows-first delivery rather than a browser SaaS flow. It keeps runtime, packaging, commissioning, and release evidence in one codebase, with PowerShell wrappers and GitHub Actions workflows aligned to the same Windows verification path.

## Windows-First Setup

1. Use Windows x64 with Node.js 22+ and npm 10+.
2. Run `npm run bootstrap`.
3. Run `npm run dev` for the watch workspace, or `npm run start` for a direct source launch.
4. Configure the runtime through the setup wizard or the runtime `.env` contract documented in the technical docs.

Live kiosk use still depends on the target workstation having two active displays and either two assignable microphones or one shared microphone profile.

## Current Status

The repository currently provides source startup, automated tests, Windows CI, and packaged Windows outputs. Remaining release blockers are external or workstation-specific: release signing inputs, retained comparison installers for upgrade and rollback, packaged activation closure on the target machine, real-hardware commissioning and live speech proof, and deployment-specific legal/privacy review.

## Technical Docs

- [docs/README.md](docs/README.md) for the technical documentation map.
- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) for runtime, verification, packaging, and release boundaries.
- [scripts/README.md](scripts/README.md) for the PowerShell and npm command surface.
- [docs/product/provider-setup.md](docs/product/provider-setup.md) for provider setup boundaries and official references.
- [PROJECT_STATUS.json](PROJECT_STATUS.json) for the current residual backlog only.
