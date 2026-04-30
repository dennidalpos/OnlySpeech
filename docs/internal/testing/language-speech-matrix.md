# Language And Speech Validation Matrix

Manual operator matrix for the end-to-end speech path:

`Microphone input -> STT -> translation -> TTS playback`

Use this page for manual validation on a real workstation after setup or packaging changes.

This matrix applies only to the live speech-ready providers, `azure` and `chatgpt`. `ollama` is intentionally excluded because the current repository treats it as translation-only with no STT or TTS path.

## Preconditions

- the setup wizard has already saved monitor, microphone, provider, and initial language selections;
- `TEXT_TO_SPEECH_ENABLED=true` when validating playback;
- the setup wizard "Language quality" section has the intended values for the pass;
- the active provider credentials are valid for the selected mode;
- when Azure playback-text normalization diagnostics are part of the session, `AZURE_TRANSLATOR_KEY` and `AZURE_TRANSLATOR_REGION` are configured too;
- the setup wizard has saved languages that remain inside the shared kiosk interaction catalog for the active provider.
- the release language catalog counts match the runtime contract: baseline interaction 53, Azure interaction 79, and ChatGPT interaction 66.
- legacy regional inputs such as `en-us`, `en-gb`, `fr-ca`, and `pt-pt` are treated as accepted aliases only; the runtime selector exposes the canonical language entry, with English resolved to `en-GB`.
- on a packaged workstation, readiness is derived from `%LOCALAPPDATA%\OnlySpeech\.env`; source-workspace dry runs fall back to the repo-root `.env`.
- refresh the retained proof template before the real workstation pass:

```powershell
npm run speech:matrix-template
```

Record the operator proof directly in `artifacts/logs/live-provider-speech-proof.json` by updating:

- `station_id`, `validated_by`, and top-level `notes` when known;
- each scenario `status` from `pending` to `passed`, `failed`, or `not_applicable`;
- `checked_at`, `evidence`, and per-scenario `notes` for any observed result.
- language quality options active during the pass, especially `PROVIDER_LANGUAGE_CONTRACT_MODE`, `CHATGPT_STT_LANGUAGE_PROMPT_ENABLED`, `CHATGPT_TRANSLATION_DETECTED_LANGUAGE_MODE`, `OPENAI_TTS_LANGUAGE_INSTRUCTIONS_ENABLED`, `AZURE_TTS_LANG_ELEMENT_ENABLED`, `AUDIO_ECHO_CANCELLATION`, `AUDIO_NOISE_SUPPRESSION`, and `AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED`.

## Language Pairs

The live pass must cover at least:

| Pair | Purpose |
| --- | --- |
| `it/en` | Baseline operator Italian and visitor English flow |
| `fr/de` | Western European pair with separate STT/TTS locales |
| `es/pt` | Related-language pair where source enforcement is important |
| `zh-Hans/ja` | Non-Latin pair and locale/script coverage |
| one ChatGPT prompt-fallback language | Confirms STT prompt fallback when no official language hint is sent |

## Manual Matrix

| Scenario | Provider | Action | Expected result |
| --- | --- | --- | --- |
| Initial save with supported languages | `azure` or `chatgpt` | Select A/B languages that remain in the shared kiosk catalog and save | Save succeeds; wizard keeps provider-owned playback enabled for both sides |
| Initial save with uncovered language | `azure` or `chatgpt` | Select one A/B language without compatible provider-owned playback | Save is blocked; wizard explains that the selected provider cannot prove playback for that language |
| Language contract mapping | `azure` or `chatgpt` | For every selected pair, record source locale, provider target code, TTS locale, voice, and capability note | Values match the selected operator/visitor languages and do not silently fall back to another language |
| Provider translation validation | `chatgpt` or `azure` | Run the provider translation test from the Diagnostics step | The test completes with transcript/translation output or a specific provider error |
| Live microphone validation | `azure` | Run the Azure speech test from the Diagnostics step | Transcript and translation are produced from live microphone input |
| Final-turn validation | `chatgpt` | Run the ChatGPT provider speech test from the Diagnostics step | Local recording completes; transcript and translation are produced after turn finalization |
| ChatGPT STT prompt enforcement | `chatgpt` | Speak the selected source language with background noise or overlapping off-language speech | Transcript follows the configured source language where provider behavior allows; off-language background speech does not dominate the turn |
| ChatGPT detected-language mode | `chatgpt` | Repeat one pair with `diagnostic`; optionally repeat with `adaptive` in a controlled test | `diagnostic` keeps configured source/target; `adaptive` behavior is recorded explicitly if enabled |
| Translation playback | `azure` | Trigger TTS for a language covered by the Azure catalog | Playback starts with `Engine: azure` and the selected Azure voice |
| Translation playback | `chatgpt` | Trigger TTS for a language covered by the shared kiosk catalog | Playback starts with `Engine: openai` and the configured OpenAI voice |
| TTS language quality | `azure` or `chatgpt` | Listen to translated text for every selected pair | Pronunciation matches the selected target language; any accent or language drift is recorded |
| Capture processing diagnostics | `azure` or `chatgpt` | Enable `AUDIO_CAPTURE_SETTINGS_DIAGNOSTICS_ENABLED=true` and repeat one clean/noisy turn | Logs show requested/effective echo cancellation and noise suppression settings without audio payloads |
| Unsupported playback | `azure` or `chatgpt` | Trigger TTS for an uncovered language | UI stays explicit: playback is unavailable and does not silently fall back across families or providers |
| TTS disabled runtime | `azure` or `chatgpt` | Set `TEXT_TO_SPEECH_ENABLED=false` and repeat playback | No playback starts; UI remains coherent and non-crashing |

## Notes

- Azure mode is Azure-TTS-only for supported languages and does not use local system-voice fallback.
- Azure TTS uses the selected voice locale and, by default, a matching SSML `<lang xml:lang>` wrapper.
- ChatGPT mode is OpenAI-TTS-only for the shared kiosk catalog and does not use workstation-managed fallback speech.
- ChatGPT STT sends a provider language hint when officially supported and a configured-language prompt when enabled.
- Translation provider language detection is diagnostic by default; it should not change configured source/target languages unless `adaptive` is intentionally enabled.
- Browser echo cancellation and noise suppression are best-effort `getUserMedia` constraints. Their real effect depends on device, driver, browser runtime, room, distance, and speaker/microphone layout.
- Ollama remains outside this matrix because OnlySpeech does not expose Ollama-backed live speech capture or playback.
- Windows speech packs and other workstation-global voices remain outside the product playback surface.

## Tracking Notes

If this manual pass is being tracked in `PROJECT_STATUS.json`, close or update the relevant open task only after `artifacts/logs/live-provider-speech-proof.json` contains retained real-workstation proof for the end-to-end `Microphone -> STT -> translation -> TTS` path and the language/audio quality matrix.

Do not claim completion when credentials are still missing or when the retained artifact is still just a pending template.
