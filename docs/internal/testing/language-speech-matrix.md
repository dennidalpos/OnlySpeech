# Language And Speech Validation Matrix

Manual operator matrix for the end-to-end speech path:

`Microphone input -> STT -> translation -> TTS playback`

Use this page for manual validation on a real workstation after setup or packaging changes.

This matrix applies only to the live speech-ready providers, `azure` and `chatgpt`. `ollama` is intentionally excluded because the current repository treats it as translation-only with no STT or TTS path.

## Preconditions

- the setup wizard has already saved monitor, microphone, provider, and initial language selections;
- `TEXT_TO_SPEECH_ENABLED=true` when validating playback;
- the active provider credentials are valid for the selected mode;
- when Azure playback-text normalization diagnostics are part of the session, `AZURE_TRANSLATOR_KEY` and `AZURE_TRANSLATOR_REGION` are configured too;
- the setup wizard has saved languages that remain inside the shared kiosk interaction catalog for the active provider.
- on a packaged workstation, readiness is derived from `%LOCALAPPDATA%\OnlySpeech\.env`; source-workspace dry runs fall back to the repo-root `.env`.
- refresh the retained proof template before the real workstation pass:

```powershell
npm run speech:matrix-template
```

Record the operator proof directly in `artifacts/logs/live-provider-speech-proof.json` by updating:

- `station_id`, `validated_by`, and top-level `notes` when known;
- each scenario `status` from `pending` to `passed`, `failed`, or `not_applicable`;
- `checked_at`, `evidence`, and per-scenario `notes` for any observed result.

## Manual Matrix

| Scenario | Provider | Action | Expected result |
| --- | --- | --- | --- |
| Initial save with supported languages | `azure` or `chatgpt` | Select A/B languages that remain in the shared kiosk catalog and save | Save succeeds; wizard keeps provider-owned playback enabled for both sides |
| Initial save with uncovered language | `azure` or `chatgpt` | Select one A/B language without compatible provider-owned playback | Save is blocked; wizard explains that the selected provider cannot prove playback for that language |
| Provider translation validation | `chatgpt` or `azure` | Run the provider translation test from the Diagnostics step | The test completes with transcript/translation output or a specific provider error |
| Live microphone validation | `azure` | Run the Azure speech test from the Diagnostics step | Transcript and translation are produced from live microphone input |
| Final-turn validation | `chatgpt` | Run the ChatGPT provider speech test from the Diagnostics step | Local recording completes; transcript and translation are produced after turn finalization |
| Translation playback | `azure` | Trigger TTS for a language covered by the Azure catalog | Playback starts with `Engine: azure` and the selected Azure voice |
| Translation playback | `chatgpt` | Trigger TTS for a language covered by the shared kiosk catalog | Playback starts with `Engine: openai` and the configured OpenAI voice |
| Unsupported playback | `azure` or `chatgpt` | Trigger TTS for an uncovered language | UI stays explicit: playback is unavailable and does not silently fall back across families or providers |
| TTS disabled runtime | `azure` or `chatgpt` | Set `TEXT_TO_SPEECH_ENABLED=false` and repeat playback | No playback starts; UI remains coherent and non-crashing |

## Notes

- Azure mode is Azure-TTS-only for supported languages and does not use local system-voice fallback.
- ChatGPT mode is OpenAI-TTS-only for the shared kiosk catalog and does not use workstation-managed fallback speech.
- Ollama remains outside this matrix because OnlySpeech does not expose Ollama-backed live speech capture or playback.
- Windows speech packs and other workstation-global voices remain outside the product playback surface.

## Tracking Notes

If this manual pass is being tracked in `PROJECT_STATUS.json`, close or update the relevant open task only after `artifacts/logs/live-provider-speech-proof.json` contains retained real-workstation proof for the end-to-end `Microphone -> STT -> translation -> TTS` path.

Do not claim completion when credentials are still missing or when the retained artifact is still just a pending template.
