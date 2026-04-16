# Privacy Policy Baseline

## Scope

This is the repository-controlled privacy baseline for Windows-first desktop/B2B deployments of OnlySpeech.
It is designed to be shared with buyers as the product baseline, while customer-specific notices, retention values, and controller details may still need deployment-level supplements.

## 1. Who This Policy Covers

OnlySpeech is distributed by Danny Perondi as a packaged AI-assisted communication workstation for in-person conversations.
For repository-controlled pilot or direct-sale distribution, the baseline product contact channel is <https://github.com/dennidalpos/OnlySpeech/issues>.
This policy explains how the workstation and its connected providers process data during setup, operation, support, and release handling.

## 2. Product Description

OnlySpeech is a local Windows application that helps two people communicate on one workstation with two display surfaces.
It is not a generic chat SaaS and it is not intended to replace human judgment.

## 3. Data Categories

Depending on the deployment, OnlySpeech may process:

- live microphone audio for the active turn;
- transcript and translation text for the active turn;
- selected interaction languages and device assignments;
- technical runtime logs and diagnostic metadata;
- operator-entered provider configuration data;
- packaged release and compliance artifacts generated during support or release workflows.

## 4. How Data Is Used

OnlySpeech uses data to:

- capture the active turn and generate transcript/translation output;
- render the translated text on the paired workstation display;
- play supported text-to-speech output when enabled;
- diagnose workstation configuration, provider setup, and release integrity;
- protect setup access and local workstation configuration.

## 5. Provider Processing

The prudent commercial baseline assumes customer-provided credentials for the selected Azure Speech or OpenAI provider.
When enabled by the deployment:

- Azure Speech processes live recognition and translation requests for the active turn;
- OpenAI processes finalized turn audio and translation requests when the `chatgpt` provider is selected.

Provider terms, retention controls, DPA commitments, and transfer mechanisms remain subject to the customer's own provider agreement and deployment choices.

## 6. Retention And Storage

OnlySpeech is designed for privacy-first operation:

- audio is processed for the active turn and is not kept as a local recording archive by default;
- on-screen conversation history is disabled by default and must be explicitly enabled;
- packaged builds store provider secrets outside the saved runtime `.env`;
- runtime logs are intended to contain technical metadata only and must not contain transcript, translation, audio payloads, or secrets.

Repository-controlled support exports should be retained only for the active support case or release record that required them.
Customer-specific retention periods, log rotation, backup rules, and deletion workflows remain deployment decisions.

## 7. AI-Assisted Output Notice

OnlySpeech is an AI-assisted communication tool.
It processes voice and transcript data for the active turn, output may contain errors, and it must not be used as the sole basis for critical, medical, legal, or safety decisions.

## 8. Security Measures

The repository baseline includes:

- workstation-local runtime state for packaged builds;
- separated packaged secret storage;
- workstation-local setup-wizard password protection;
- release evidence, notice, and SBOM generation for shipped builds.

Customer-specific account controls, device hardening, endpoint protection, and incident-response commitments remain deployment responsibilities unless a separate written services agreement expands the baseline offer.

## 9. Data Subject And Customer Rights

The deployment owner or customer remains responsible for handling applicable requests about access, deletion, correction, objection, or regulatory complaints.
OnlySpeech repository controls do not replace customer-specific compliance workflows.

## 10. Contact

- Product and support baseline: Danny Perondi
- Repository support channel: <https://github.com/dennidalpos/OnlySpeech/issues>
- Marketplace-account billing identity or postal address, when required, is supplied by the seller account outside this repository baseline
