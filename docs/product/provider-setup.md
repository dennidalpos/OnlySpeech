# Provider Setup

OnlySpeech supports two live speech providers, `azure` and `chatgpt`, plus one translation-only provider, `ollama`. This page documents only the repository-specific setup boundary and links to official provider documentation for account, billing, model, quota, and API details.

For deterministic validation without provider credentials, use `RUNTIME_MODE=demo`.

## Shared Rules

- Configure providers through the setup wizard or the runtime `.env` contract implemented in source.
- Keep provider credentials out of documentation, screenshots, tickets, and release notes.
- Validate provider changes on the target workstation before handover.
- Treat official provider documentation as the source of truth for current API behavior.
- Do not promise local text-to-speech fallback. Runtime playback is provider-owned.
- `ollama` remains translation-only in the current product contract. It can be used for demo-side translation validation and diagnostics, but it does not satisfy live kiosk speech prerequisites because there is no Ollama STT or TTS path in OnlySpeech.

## Azure Provider

Set `TRANSLATION_PROVIDER=azure`.

Minimum live runtime values:

- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

Diagnostic-only Azure Translator values:

- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

OnlySpeech uses Azure Speech for live recognition, translation, and Azure TTS playback. The setup wizard validates selected languages against the Azure voice coverage available to the runtime. If the catalog does not expose a compatible voice for a selected initial language, wizard save is blocked for that configuration.

Azure setup path:

1. Create or use an Azure subscription.
2. Create an Azure AI Speech resource in the intended region.
3. Copy one Speech resource key and the region.
4. Enter the values in OnlySpeech.
5. Run the setup-wizard provider test and resolve failures before handover.

Official Azure links:

- Azure portal: <https://portal.azure.com/>
- Azure Speech overview: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-speech-to-text>
- Speech recognition: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-recognize-speech>
- Speech translation: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-translate-speech>
- Language and voice support: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=speaker-recognition>
- Text-to-speech: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech>

## ChatGPT Provider

Set `TRANSLATION_PROVIDER=chatgpt`.

Required values:

- `CHATGPT_API_KEY`
- `CHATGPT_MODEL`
- `CHATGPT_TRANSCRIBE_MODEL`

Repository defaults:

- `CHATGPT_MODEL=gpt-4.1-mini`
- `CHATGPT_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`

OnlySpeech uses OpenAI for transcription/translation and OpenAI TTS playback when the `chatgpt` provider is selected. Model overrides are deployment-specific and must be validated locally before handover.

OpenAI setup path:

1. Create or use an OpenAI Platform account.
2. Enable API billing for the account.
3. Create an API key.
4. Enter the API key and model values in OnlySpeech.
5. Run the setup-wizard provider test and resolve failures before handover.

Official OpenAI links:

- OpenAI Platform signup: <https://platform.openai.com/signup>
- OpenAI quickstart: <https://platform.openai.com/docs/quickstart>
- API keys: <https://platform.openai.com/api-keys>
- Speech-to-text guide: <https://developers.openai.com/api/docs/guides/speech-to-text>
- Transcriptions API reference: <https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create>
- Text-to-speech guide: <https://developers.openai.com/api/docs/guides/text-to-speech>
- Speech API reference: <https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create>
- Models overview: <https://developers.openai.com/api/docs/models>

## Ollama Provider

Set `TRANSLATION_PROVIDER=ollama`.

Required values:

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

Optional values:

- `OLLAMA_REQUEST_TIMEOUT_MS`
- `OLLAMA_STREAMING_ENABLED`
- `OLLAMA_API_KEY`

Repository defaults:

- `OLLAMA_BASE_URL=http://localhost:11434/api`
- `OLLAMA_MODEL=gemma3`
- `OLLAMA_REQUEST_TIMEOUT_MS=45000`
- `OLLAMA_STREAMING_ENABLED=false`

OnlySpeech uses Ollama only for translation requests and provider diagnostics. The setup wizard accepts Ollama for translation-only demo flows, but live kiosk speech remains blocked because the repository does not expose Ollama-backed STT or TTS.

Ollama setup path:

1. Install Ollama for Windows or provision a reachable Ollama host.
2. Pull or otherwise install the model referenced by `OLLAMA_MODEL`.
3. Set `OLLAMA_BASE_URL` to the host that serves the Ollama API.
4. Enter the Ollama values in OnlySpeech.
5. Run the setup-wizard provider test and confirm the version, model inventory, and translation checks before handover.

Official Ollama links:

- Ollama Windows install: <https://docs.ollama.com/windows>
- Ollama API introduction: <https://docs.ollama.com/api>
- Ollama quickstart: <https://docs.ollama.com/quickstart>

## Verification State

Repository tests cover request shaping, provider policy, wizard gating, and runtime routing with local/test-double verification. Final live speech proof still requires real provider credentials, microphones, speakers, and a target-equivalent Windows workstation for the `azure` and `chatgpt` paths. The `ollama` path separately still requires reachable-server validation against the configured host and model; if that follow-up is intentionally tracked, keep it in `PROJECT_STATUS.json`.
