# Project Specification

## Objective

OnlySpeech is a Windows-first Electron desktop translation workstation for assisted two-person conversations on one PC with two display surfaces. The repository supports source startup, diagnostics, testing, Windows packaging, packaged lifecycle validation, release evidence generation, customer bundle assembly, and commissioning handover support. Passing repository checks does not by itself certify a customer production deployment.

## Documentation Hierarchy

This document is the long-form technical contract for the repository. It does not duplicate every script option or test assertion.

- `README.md` is the repository overview and quick-start command map.
- `docs/PROJECT_SPEC.md` is the primary technical contract; the rest of `docs/` contains the supporting runbooks, product notes, and buyer-facing collateral referenced from that contract.
- `scripts/script.md` is the canonical script index, invocation map, and PowerShell side-effect map.
- `.github/workflows/*.yml` are the canonical CI and tagged-release workflow definitions.
- `PROJECT_STATUS.json` tracks only current incomplete todo tasks; it is not a changelog, report, risk register, or check log.

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
- Each selected runtime language resolves through the provider language contract: STT source locale, translation target code, canonical BCP-47 locale, TTS locale, display label, and provider capability metadata.
- Text-to-speech is provider-owned only: Azure mode uses Azure TTS, ChatGPT mode uses OpenAI TTS, Ollama exposes no TTS path, and no local TTS fallback is part of the product contract.
- Language detection returned by translation providers is diagnostic by default and must not override the configured source/target languages unless `adaptive` mode is explicitly enabled.
- Text-to-speech stops on reset, language change, shutdown, or live push-to-talk capture.
- Changing language after session start creates a new shared session and clears active conversation state for both sides.
- Conversation history stays disabled unless explicitly enabled.
- Runtime logs must not persist transcript, translation, audio payloads, provider secrets, or raw chat text.
- Packaged secrets must not remain persisted in the packaged `.env`.
- Generated repo-local output must stay outside versioned source paths.

## Repository Topology

- `src/main`: Electron bootstrap, runtime root selection, activation, secure secrets, IPC, kiosk orchestration, setup orchestration, and window management.
- `src/renderer`: React operator runtime surface and activation UI.
- `src/shared`: typed contracts, runtime config parsing, language registry, localization bundles, provider policy, and shared speech/session helpers.
- `src/services`: audio, session, privacy, logging, and speech provider services.
- `src/tools`: setup-wizard HTML/preload fragments and helper output definitions.
- `tests`: unit, integration, DOM, script-plan, and Electron end-to-end tests.
- `scripts/*.ps1`: stable PowerShell wrappers exposed through npm.
- `scripts/support`: implementation scripts and helper utilities for runtime, workspace, packaging, release, docs, and commissioning flows.
- `tools`: local or vendored tool payloads; not part of the packaged runtime contract unless a specific flow documents them.
- `build`: icons, brand source SVGs, exported logo PNGs, and packaging assets.
- `public`: Vite-copied static assets consumed by runtime HTML, including favicon and social metadata images.
- `docs`: technical docs, buyer material, internal runbooks, product collateral, optional generated screenshot collateral when explicitly produced, and decisions.
- `media`: tracked source or marketplace media that must stay versioned.

## Toolchain Baseline

- Windows x64 is the supported development, CI, and packaged runtime baseline.
- Node.js 22+ and npm 10+ are declared in `package.json`.
- PowerShell is the repository script shell.
- TypeScript, Vite, React, Electron, Vitest, and electron-builder are the active application/build stack.
- CI runs on `windows-latest` and uses Node.js 22.
- The supported operational surface is Windows PowerShell through the documented npm aliases and PowerShell scripts.

## Runtime Component Map

Main process responsibilities include bootstrap, runtime root selection, activation, display management, kiosk orchestration, provider calls, setup access, packaged secret handling, and IPC.

Renderer responsibilities include the operator runtime surface, the visitor-facing session content owned by that runtime, activation UI, setup-wizard access prompts, language selection, push-to-talk controls, runtime issue banners, and localized user-facing copy.

Shared and service modules define config, language policy, provider language matrix, runtime diagnostics, logging, privacy/session behavior, media-device probing, Azure/OpenAI/Ollama provider adapters, and text-to-speech provider behavior.

The setup wizard persists workstation configuration, validates provider settings, manages packaged license state, manages current-user packaged autostart, and renders diagnostics. It is implemented across `src/main/setup-wizard-*` and `src/tools/setup-wizard/`.

## Runtime Modes

`demo` mode runs a deterministic scripted loop. It is suitable for setup validation and optional collateral capture without live provider credentials.

`kiosk` mode runs live speech translation once displays, microphones, provider credentials, and language confirmations are ready.

`azure` provider mode uses Azure Speech for speech recognition/translation and Azure TTS for playback. Optional Azure Translator credentials are used only for diagnostics that require them.

`chatgpt` provider mode uses OpenAI transcription/translation and OpenAI TTS for playback.

`ollama` provider mode uses an Ollama server for translation-only chat validation and demo-side diagnostics. It does not provide live speech capture or playback, so full live kiosk speech remains blocked when `TRANSLATION_PROVIDER=ollama`.

Provider language behavior is governed by the shared language registry and the provider capability matrix. Runtime code must use the existing `sourceLocale`, provider `targetCode`, canonical BCP-47 locale, and capability metadata instead of inventing fallback languages. Unsupported STT, translation, or TTS capability must be blocked or degraded according to the configured policy.

The runtime interaction catalog exposes one selectable entry for regional English, French, and Portuguese families. Legacy regional aliases such as `en-us`, `en-gb`, `fr-ca`, and `pt-pt` are accepted only as input aliases and normalize into canonical runtime choices; English uses `en-GB` as its canonical runtime locale. The expected catalog counts are: baseline interaction 53, Azure interaction 79, and ChatGPT interaction 66.

Language and audio quality controls are configured globally through the setup wizard or `.env`:

- `PROVIDER_LANGUAGE_CONTRACT_MODE`: `strict` keeps provider mappings fixed to the selected operator/visitor languages; `compatible` allows only provider-compatible normalization.
- `CHATGPT_STT_LANGUAGE_PROMPT_ENABLED`: sends a source-language prompt for ChatGPT transcription while still using the official `language` hint when available.
- `CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE`: `off`, `diagnostic`, or `adaptive`; the default is diagnostic metadata only.
- `OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED`: sends OpenAI TTS instructions for the selected language and accent.
- `AZURE_TTS_LANG_ELEMENT_ENABLED`: wraps Azure TTS SSML text with a matching `<lang xml:lang>` element.
- `AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED`: logs non-sensitive `getSettings()` capture diagnostics when enabled.
- `AUDIO_ECHO_CANCELLATION` and `AUDIO_NOISE_SUPPRESSION`: request browser capture processing for every provider path that uses `getUserMedia`; actual effectiveness remains browser/device/provider dependent.

Provider account setup boundaries and official documentation links live in `docs/product/provider-setup.md`.

## Runtime Root And Persistence

Source-mode runtime state is repo-local unless the launcher selects packaged preference. Packaged runtime state is workstation-local under `%LOCALAPPDATA%\OnlySpeech`.

Persistent state includes runtime `.env`, activation state, secure secret files, session data, runtime logs, and setup-wizard access state where applicable. Packaged workstation cleanup is exposed as `npm run clean:workstation`.

Secure provider keys are handled outside the packaged saved `.env` by the packaged secret policy. Runtime config parsing and secure-key metadata are implemented in `src/shared/config.ts`, `src/shared/runtime-env-contract.ts`, and `src/main/runtime-secrets.ts`.

## Runtime Configuration Contract

The supported runtime keys, key order, secure-key metadata, provider validation, and language normalization are implemented in source. Documentation may describe the boundary but must not become a second schema.

Important externalized choices include:

- `APP_MODE`: `kiosk` or `demo`;
- `TRANSLATION_PROVIDER`: `azure`, `chatgpt`, or `ollama`;
- microphone profile and side assignments;
- operator and visitor default languages;
- language and audio quality controls for STT, translation detection, TTS language enforcement, and capture diagnostics;
- provider credentials, server endpoints, and model overrides;
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

The stable user-facing npm entrypoints are `bootstrap`, `dev`, `start`, `build`, `gate`, `package`, `clean`, `clean:workstation`, `test`, `test:e2e`, `verify:repo`, `docs:screenshots`, and `license:keygen`. Release, commissioning, activation, and speech-proof aliases are supported operational commands and are documented in `scripts/script.md`.

`npm run bootstrap` is the dependency restore entrypoint. It validates the Node.js baseline, requires `package-lock.json`, and runs `npm ci --include=dev --omit=optional` only when the dependency tree is missing, inconsistent, or force-refreshed.

`clean:workstation` is the stable packaged workstation reset entrypoint for support and reinstall flows. `test:e2e` is the compiled Electron end-to-end validation entrypoint when the full repository gate is not needed.

`gate` is the public Windows verification wrapper for local release readiness. It delegates to `verify:repo` and exposes opt-in cleanup and retention switches without duplicating the verification sequence. `verify:repo` is the canonical local and CI verification implementation. `package` is the canonical public packaging entrypoint.

The deterministic local path is:

1. `npm run bootstrap`
2. `npm run dev` or `npm run start`
3. `npm run test:e2e` for targeted compiled Electron validation
4. `npm run gate -- -KeepOutputs -EnablePackagedAutomation` for public local repository verification
5. `npm run package` for public Windows packaging
6. `npm run release:customer-bundle` after packaged artifacts already exist

Detailed script ownership and side effects live in `scripts/script.md`.

There is no checked-in lint or format command. Static-quality coverage is currently TypeScript build, Vitest, Electron e2e, packaging audit, PowerShell script tests, and the Windows gate.

## Diagnostics And Verification

The internal doctor validates Node.js, platform, lockfile, dependency installation, local tooling, template config, provider requirements, configured languages, launcher presence, display/microphone availability through Electron probing, and touch-input readiness reminders.

The test surface includes:

- unit and integration tests under `tests/*.test.ts` and `tests/*.test.tsx`;
- compiled Electron coverage in `tests/electron-e2e.test.ts`;
- setup-wizard DOM tests;
- PowerShell planning and repo-helper tests;
- packaged runtime automation tests.

`npm run gate` and `npm run verify:repo` cover cleanup, bootstrap, doctor, tests, source smoke, build, Electron e2e, packaging audit, packaging, packaged lifecycle validation, optional packaged automation, release evidence generation, release compliance generation, and final cleanup unless outputs are preserved. The gate default preserves `.env`, `.local/activation-generator`, dependencies, local vendored `tools/`, workstation data, and autostart state. `-CleanWorkstationData` explicitly removes packaged workstation data through `clean:workstation`. The public `gate` wrapper uses `-RefreshDependencies`; the canonical `verify:repo` implementation uses `-ForceRefreshDependencies`.

Supported verification modifiers include `-SkipInstall`, `-SkipPack`, `-SkipPackagedLifecycle`, `-EnablePackagedAutomation`, `-SkipSmokeStart`, `-KeepOutputs`, `-CleanWorkstationData`, `-ForceRefreshDependencies`, and `-DryRun`. The public `gate` wrapper exposes dependency refresh as `-RefreshDependencies`.

## Packaging Contract

- Packaged outputs go to `artifacts/packages/`.
- `npm run package` keeps the public NSIS installer, portable executable, and versioned unpacked zip.
- Internal verification and tagged-release flows also validate `win-unpacked` before retaining the versioned unpacked zip.
- The app is packaged with `asar`.
- Artifact names are deterministic from product name, version, architecture, and target.
- Packaging compatibility helpers live under `scripts/support/packaging/`.
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

## Production Readiness Contract

Production readiness requires both repository gates and target-workstation evidence:

- `npm run gate -- -KeepOutputs -EnablePackagedAutomation` must pass on Windows.
- `npm audit --audit-level=moderate` and `npm run audit:packaging` must pass, or remaining findings must be explicitly accepted for the release.
- Security hardening tasks in `PROJECT_STATUS.json` must be closed or explicitly accepted by the product owner.
- The package used for deployment must be generated from the verified source and signed or otherwise approved for the deployment.
- Target hardware validation must cover packaged activation, setup commissioning, display assignment, microphone assignment, live provider speech, TTS playback, autostart at logon, upgrade, and rollback.
- Retained evidence must exist under `artifacts/logs/` for release metadata, notices, SBOM, activation validation, commissioning evidence, live provider speech proof, and packaged close-out validation.

Until those conditions are met, the repository may be technically verifiable but the customer deployment remains blocked.

## Output Boundaries

- `dist/`: compile output.
- `artifacts/packages/`: packaged binaries.
- `artifacts/logs/`: release evidence, notices, SBOM, activation validation, commissioning evidence, and optional runtime-log exports.
- `artifacts/build/`: transient install lifecycle and script-audit working data.
- `%LOCALAPPDATA%\OnlySpeech\logs`: workstation runtime logs.

Repo-local generated outputs are ignored by `.gitignore`. Optional screenshot and marketplace-demo collateral can be regenerated through the documented scripts when that collateral is intentionally being prepared and reviewed.

## Supporting Documentation

- `docs/product/brand-assets.md`: brand asset paths, naming, sizes, regeneration command, and app/installer/social consumers.
- `docs/product/provider-setup.md`: provider setup and official provider link map.
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
- for `TRANSLATION_PROVIDER=ollama`, a reachable Ollama host and installed model matching `OLLAMA_BASE_URL` and `OLLAMA_MODEL`;
- deployment-specific legal and privacy review outside the repository.
