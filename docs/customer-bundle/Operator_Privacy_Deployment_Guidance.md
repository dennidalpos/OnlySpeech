# Operator Privacy Deployment Guidance

## Purpose

This guide is for operators or deployment owners who want to keep OnlySpeech aligned with the privacy-first desktop/B2B baseline.

## Before Go-Live

- keep `VISITOR_CONVERSATION_HISTORY_ENABLED=false` unless a justified local policy requires otherwise;
- confirm who owns the Azure Speech or OpenAI account used by the selected workstation provider;
- verify that provider regions and contracts match the customer privacy posture;
- decide who may reopen the setup wizard and rotate the workstation-local setup password immediately after first authenticated access;
- position both displays so bystanders cannot read translated output unintentionally.

## During Operation

- explain that the workstation is AI-assisted and may produce errors;
- use the product only as a communication aid, not as the sole basis for critical, medical, legal, or safety decisions;
- avoid speaking unnecessary personal data when it is not required for the conversation;
- keep the workstation physically supervised during live conversations.

## Logs And Diagnostics

- treat runtime logs as technical artifacts only;
- review exported logs before sharing them outside the customer support boundary;
- do not attach provider secrets, raw transcript archives, or saved recordings to support tickets.

## Provider Credentials

- prefer customer-provided credentials for the selected Azure Speech or OpenAI provider in production-like deployments;
- rotate credentials outside the repository workflow according to customer policy;
- confirm that packaged secrets are stored outside the saved runtime `.env`.

## Runtime Playback Boundary

OnlySpeech currently ships with provider-owned runtime playback only: Azure mode stays on Azure TTS and ChatGPT mode uses OpenAI TTS.
Do not promise workstation-managed local fallback speech as part of the commercial deployment baseline.
