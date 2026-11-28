# Privacy And Commercial Distribution

## Purpose

This document defines the repository-controlled privacy posture for OnlySpeech and the commercial-distribution boundary that can be defended from the repository itself.
It is an engineering policy document, not legal advice.

## Product And Deployment Boundary

The current repository supports:

- one Windows-first Electron desktop app;
- one desktop/B2B workstation product for guided in-person conversations;
- one workstation-local runtime profile under `%LOCALAPPDATA%\OnlySpeech` for packaged runs;
- packaged app contents driven by `electron-builder` from `dist/**/*` plus `package.json`;
- external service use only for `azure`, `chatgpt`, and `ollama` provider modes;
- provider-owned playback only: Azure mode stays on Azure TTS, ChatGPT mode stays on OpenAI TTS, Ollama remains translation-only with no playback path, and no workstation-managed local fallback is part of the contract.

The repository does not define a browser SaaS product, multi-workstation orchestration layer, or internal plugin system.

## Privacy Baseline

OnlySpeech is intended to operate as a privacy-first assisted-conversation workstation:

- no audio archive is stored by the application after turn processing completes;
- runtime logs are technical metadata only and must not retain transcript, translation, raw chat text, audio payloads, or secrets;
- packaged Windows builds store provider secrets outside the saved `.env`;
- workstation runtime state remains local to the workstation profile instead of being exported into repository artifacts by default;
- conversation history is disabled by default and should stay disabled unless a deployment explicitly requires it.

When language changes or a session reset occurs, active transcript, translation, and conversation-history state are cleared for both sides.

## Commercial Baseline

The current prudent commercial baseline is:

- direct demo-led desktop/B2B distribution for staffed or guided in-person deployments;
- customer-provided Azure Speech or OpenAI credentials, depending on the selected provider mode;
- customer-managed Ollama host configuration only for translation-only demo or diagnostic flows when that provider is intentionally selected;
- Microsoft Store copy only as secondary trust and discovery collateral;
- Product Hunt copy only as non-core awareness collateral;
- provider-owned Azure/OpenAI playback treated as the active product baseline.

The repository should not market workstation-managed local TTS fallback, hosted SaaS access, or bundled provider consumption as part of the current offer.

## Compliance Artifact Scope

The release and compliance script surface can generate:

- packaged artifact hashes through `npm run release:evidence`;
- third-party notices from npm dependency metadata in `package-lock.json`;
- a CycloneDX SBOM through `npm run release:compliance`, combining the same dependency metadata with packaged artifact hashes.

Windows signing is optional for ordinary local packaging runs.
The tagged release workflow is the canonical place where signing inputs are validated before publication.

These outputs improve auditability, but they do not replace customer-specific legal review, controller identification, DPA or SCC work, provider-region choices, or deployment-specific retention commitments.

Ignored local tool payloads under `/tools` are outside the automatically generated compliance bundle unless a future packaging contract adds them explicitly. Repository-owned helper utilities live under `scripts/support/` and remain part of the repository-controlled implementation surface.

## External Services Boundary

### OpenAI API

- OpenAI is used only in `TRANSLATION_PROVIDER=chatgpt` mode.
- The repository assumes a valid OpenAI agreement and a policy-compliant use case.
- Customer-specific privacy, DPA, moderation, jurisdiction, and retention review remain external.

### Azure Speech

- Azure is used only in `TRANSLATION_PROVIDER=azure` mode.
- The safest commercial posture documented here is customer-owned Azure credentials.
- If a future rollout bundles or resells Azure consumption under the vendor agreement, that requires explicit external commercial and legal review.

### Ollama

- Ollama is used only in `TRANSLATION_PROVIDER=ollama` mode.
- The current repository contract treats Ollama as translation-only and does not market it as a live speech-ready provider.
- Host operations, model licensing, retention, and any network exposure for the Ollama server remain deployment-specific decisions outside the repository.

## Distribution Position

OnlySpeech can support commercial distribution to the extent that:

- the rollout stays within the documented Windows desktop/B2B boundary;
- packaged application behavior matches the documented privacy boundary;
- the tagged release flow validates Windows signing inputs when release signing is required, and the shipped version retains release evidence and dependency notices;
- customer-specific contractual and legal inputs are completed outside the repository;
- Azure/OpenAI contracting and any Ollama host operations stay aligned with the chosen customer deployment model.

This repository supports technical commercial readiness, but it must not claim that all legal obligations are satisfied without deployment-specific review.
