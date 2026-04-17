# Project Specification

## Objective

OnlySpeech is a Windows-first Electron desktop translation workstation for assisted two-person conversations on one PC with two display surfaces. The repository supports source startup, diagnostics, testing, Windows packaging, packaged lifecycle validation, release evidence generation, customer bundle assembly, and commissioning handover support.

## Documentation Hierarchy

This document is the long-form technical contract for the repository. It does not duplicate every script option or test assertion.

- `README.md` is a GitHub-facing storefront summary only.
- `docs/README.md` is the technical documentation map.
- `scripts/README.md` is the canonical script index and PowerShell side-effect map.
- `.github/workflows/*.yml` are the canonical CI and tagged-release workflow definitions.
- `PROJECT_STATUS.json` tracks current external blockers and residual verification work.

## Product Boundary

Supported:

- one Windows x64 workstation;
- two simultaneous presentation surfaces;
- one shared runtime configuration;
- live kiosk speech with either two dedicated microphones or one shared microphone;
- deterministic `demo` mode without live provider credentials or microphones;
- guided in-person conversation flow;
- integrated setup, repair, diagnostics, packaged activation, and verification paths;
- packaged Windows delivery through installer, portable executable, and unpacked archive.

Not supported by the repository contract:

- browser-only operation;
- multi-PC session distribution;
- generic meeting transcription;
- consumer chat or messaging workloads;
- default long-term transcript, audio, or recording retention;
- a plugin or extension system.

## Core Runtime Invariants

- Runtime mode is `kiosk` or `demo`.
- Live kiosk speech is blocked until the selected hardware profile, provider credentials, and language confirmations are ready.
- Setup-owned display and microphone issues must not remove the reachable setup-wizard path.
- `MICROPHONE_PTT_MODE=dual-dedicated` assigns one live microphone per side.
- `MICROPHONE_PTT_MODE=single-shared` mirrors one selected microphone to both sides and alternates push-to-talk ownership.
- The speaking side sees transcript text; the opposite side sees translated text.
- Text-to-speech is provider-owned only: Azure mode uses Azure TTS, ChatGPT mode uses OpenAI TTS, and no local TTS fallback is part of the product contract.
- Text-to-speech stops on reset, language change, shutdown, or live push-to-talk capture.
- Changing language after session start creates a new shared session and clears active conversation state for both sides.
- Conversation history stays disabled unless explicitly enabled.
- Runtime logs must not persist transcript, translation, audio payloads, provider secrets, or raw chat text.
- Packaged secrets must not remain persisted in the packaged `.env`.
- Generated repo-local output must stay outside versioned source paths.

## Repository Topology

- `src/main`: Electron bootstrap, runtime root selection, activation, secure secrets, IPC, kiosk orchestration, setup orchestration, and window management.
- `src/renderer`: React operator, visitor, and activation surfaces.
- `src/shared`: typed contracts, runtime config parsing, language registry, localization bundles, provider policy, and shared speech/session helpers.
- `src/services`: audio, session, privacy, logging, and speech provider services.
- `src/tools`: setup-wizard HTML/preload fragments and helper output definitions.
- `tests`: unit, integration, DOM, script-plan, and Electron end-to-end tests.
- `scripts/public`: stable PowerShell wrappers exposed through npm.
- `scripts/internal`: implementation scripts for runtime, workspace, packaging, release, docs, and commissioning flows.
- `tooling`: repo-owned helper utilities.
- `tools`: local or vendored tool payloads; not part of the packaged runtime contract unless a specific flow documents them.
- `build`: icons and packaging assets.
- `docs`: technical docs, buyer material, internal runbooks, product collateral, screenshots, and decisions.
- `media`: tracked source or marketplace media that must stay versioned.

## Toolchain Baseline

- Windows x64 is the supported development, CI, and packaged runtime baseline.
- Node.js 22+ and npm 10+ are declared in `package.json`.
- PowerShell is the repository script shell.
- TypeScript, Vite, React, Electron, Vitest, and electron-builder are the active application/build stack.
- CI runs on `windows-latest` and uses Node.js 22.

## Runtime Component Map

Main process responsibilities include bootstrap, runtime root selection, activation, display management, kiosk orchestration, provider calls, setup access, packaged secret handling, and IPC.

Renderer responsibilities include the operator and visitor conversation surfaces, activation UI, setup-wizard access prompts, language selection, push-to-talk controls, runtime issue banners, and localized user-facing copy.

Shared and service modules define config, language policy, provider language matrix, runtime diagnostics, logging, privacy/session behavior, media-device probing, Azure/OpenAI speech clients, and text-to-speech provider behavior.

The setup wizard persists workstation configuration, validates provider settings, manages packaged license state, manages current-user packaged autostart, and renders diagnostics. It is implemented across `src/main/setup-wizard-*` and `src/tools/setup-wizard/`.

## Runtime Modes

`demo` mode runs a deterministic scripted loop. It is suitable for setup validation and screenshots without live provider credentials.

`kiosk` mode runs live speech translation once displays, microphones, provider credentials, and language confirmations are ready.

`azure` provider mode uses Azure Speech for speech recognition/translation and Azure TTS for playback. Optional Azure Translator credentials are used only for diagnostics that require them.

`chatgpt` provider mode uses OpenAI transcription/translation and OpenAI TTS for playback.

Provider account setup boundaries and official documentation links live in `docs/product/provider-setup.md`.

## Runtime Root And Persistence

Source-mode runtime state is repo-local unless the launcher selects packaged preference. Packaged runtime state is workstation-local under `%LOCALAPPDATA%\OnlySpeech`.

Persistent state includes runtime `.env`, activation state, secure secret files, session data, runtime logs, and setup-wizard access state where applicable. Packaged workstation cleanup is exposed as `npm run clean:workstation`.

Secure provider keys are handled outside the packaged saved `.env` by the packaged secret policy. Runtime config parsing and secure-key metadata are implemented in `src/shared/config.ts`, `src/shared/runtime-env-contract.ts`, and `src/main/runtime-secrets.ts`.

## Runtime Configuration Contract

The supported runtime keys, key order, secure-key metadata, provider validation, and language normalization are implemented in source. Documentation may describe the boundary but must not become a second schema.

Important externalized choices include:

- `RUNTIME_MODE`: `kiosk` or `demo`;
- `TRANSLATION_PROVIDER`: `azure` or `chatgpt`;
- microphone profile and side assignments;
- operator and visitor default languages;
- provider credentials and model overrides;
- conversation history setting;
- setup access and packaged startup preferences.

Provider/model overrides must be validated on the target workstation before deployment.

## Session Contract

- Both stations must confirm language before live speech starts.
- Reset affects both sides.
- Close exits the whole application.
- Hard reset and idle clear preserve configured defaults but reopen explicit confirmation.
- Session state is shared across the operator and visitor surfaces.

## Script And Command Contract

The stable user-facing npm entrypoints are intentionally small: `bootstrap`, `dev`, `start`, `build`, `package`, `clean`, `clean:workstation`, `test`, `test:e2e`, `verify:repo`, `docs:screenshots`, and `license:keygen`.

`npm run bootstrap` is the dependency restore entrypoint. It validates the Node.js baseline, requires `package-lock.json`, and runs `npm ci --include=dev --omit=optional` only when the dependency tree is missing, inconsistent, or force-refreshed.

`clean:workstation` is the stable packaged workstation reset entrypoint for support and reinstall flows. `test:e2e` is the compiled Electron end-to-end validation entrypoint when the full repository gate is not needed.

`verify:repo` is the canonical local and CI verification entrypoint. `package` is the canonical public packaging entrypoint.

The deterministic local path is:

1. `npm run bootstrap`
2. `npm run dev` or `npm run start`
3. `npm run test:e2e` for targeted compiled Electron validation
4. `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation` for canonical repository verification
5. `npm run package` for public Windows packaging
6. `npm run release:customer-bundle` after packaged artifacts already exist

Detailed script ownership and side effects live in `scripts/README.md`.

## Diagnostics And Verification

The internal doctor validates Node.js, platform, lockfile, dependency installation, local tooling, template config, provider requirements, configured languages, launcher presence, display/microphone availability through Electron probing, and touch-input readiness reminders.

The test surface includes:

- unit and integration tests under `tests/*.test.ts` and `tests/*.test.tsx`;
- compiled Electron coverage in `tests/electron-e2e.test.ts`;
- setup-wizard DOM tests;
- PowerShell planning and repo-helper tests;
- packaged runtime automation tests.

`npm run verify:repo` covers cleanup, bootstrap, doctor, tests, source smoke, build, Electron e2e, packaging audit, packaging, packaged lifecycle validation, optional packaged automation, release evidence generation, release compliance generation, and final cleanup unless outputs are preserved.

Supported verification modifiers include `-SkipInstall`, `-SkipPack`, `-SkipPackagedLifecycle`, `-ValidateAutostartLive`, `-EnablePackagedAutomation`, `-SkipSmokeStart`, `-KeepOutputs`, and `-DryRun`.

## Packaging Contract

- Packaged outputs go to `artifacts/packages/`.
- `npm run package` keeps the public NSIS installer, portable executable, and versioned unpacked zip.
- Internal verification and tagged-release flows also validate `win-unpacked` before retaining the versioned unpacked zip.
- The app is packaged with `asar`.
- Artifact names are deterministic from product name, version, architecture, and target.
- Packaging compatibility helpers live under `tooling/packaging/`.
- Packaged autostart is wizard-managed through the current user's Windows Run entry and can be enabled or disabled from the setup wizard without admin rights.

## Release Contract

The tagged release workflow:

- runs only for `v*` tags;
- validates the tag against `package.json`;
- requires Windows signing inputs through `release:signing-check`;
- runs `npm run verify:repo -- -KeepOutputs -EnablePackagedAutomation`;
- uploads retained artifacts and diagnostics;
- publishes GitHub release assets from `artifacts/packages/` and retained release evidence.

Release-side scripts produce `artifacts/logs/release-evidence.json`, `artifacts/logs/third-party-notices.json`, and `artifacts/logs/sbom.cdx.json`. Customer bundle assembly copies buyer-facing docs and existing package outputs; it includes retained internal evidence only when those files already exist.

## Output Boundaries

- `dist/`: compile output.
- `artifacts/packages/`: packaged binaries.
- `artifacts/logs/`: release evidence, notices, SBOM, activation validation, commissioning evidence, and optional runtime-log exports.
- `artifacts/build/`: transient install lifecycle and script-audit working data.
- `%LOCALAPPDATA%\OnlySpeech\logs`: workstation runtime logs.

Repo-local generated outputs are ignored by `.gitignore`; tracked product screenshots and marketplace media are intentionally versioned.

## Supporting Documentation

- `docs/product/provider-setup.md`: provider setup and official provider link map.
- `docs/product/Marketplace_Sales_Package.md`: seller-facing marketplace copy.
- `docs/customer-bundle/*`: buyer-facing release bundle documents.
- `docs/internal/Privacy_and_Commercial_Distribution.md`: repository policy for privacy and commercial distribution boundaries.
- `docs/internal/testing/language-speech-matrix.md`: manual live provider speech proof matrix.
- `docs/internal/testing/packaged-activation-commissioning-runbook.md`: target-station packaged activation and commissioning runbook.
- `docs/decisions/*`: accepted durable decisions.

## External Completion Dependencies

The repository can be locally aligned and technically verified without claiming end-customer release readiness. Final rollout still depends on:

- Windows code-signing credentials;
- packaged activation validation on the real target workstation with customer activation inputs;
- a physical target workstation with actual displays, microphones, speakers, and touch hardware;
- previous signed installers for upgrade and rollback validation;
- deployment-specific legal and privacy review outside the repository.
