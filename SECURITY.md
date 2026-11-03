# Security Policy

## Supported versions

Only the latest commit on the `main` branch is supported.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Use GitHub's private vulnerability reporting: open the **Security** tab of this repository and choose **Report a vulnerability**. Include the affected component (Electron main process, renderer, activation, provider integration or packaging), reproduction steps and the impact you observed. Remove provider credentials and recorded audio from any evidence you attach.

You can expect an acknowledgement within a few days. Confirmed issues are fixed on `main` and disclosed after a fix is available.

## Scope notes

- Provider credentials (Azure Speech, OpenAI) are customer-owned and supplied through the setup wizard or the source `.env`; never commit them.
- Live speech sends audio and text to the selected provider; Ollama is used for translation-only diagnostics.
- Dependencies are monitored with Dependabot and secret scanning with push protection.
