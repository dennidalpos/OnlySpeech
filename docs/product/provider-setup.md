# Provider Setup

OnlySpeech supports two live speech providers: `azure` and `chatgpt`. This page documents only the repository-specific setup boundary and links to official provider documentation for account, billing, model, quota, and API details.

For deterministic validation without provider credentials, use `RUNTIME_MODE=demo`.

## Shared Rules

- Configure providers through the setup wizard or the runtime `.env` contract implemented in source.
- Keep provider credentials out of documentation, screenshots, tickets, and release notes.
- Validate provider changes on the target workstation before handover.
- Treat official provider documentation as the source of truth for current API behavior.
- Do not promise local text-to-speech fallback. Runtime playback is provider-owned.

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

## Verification State

Repository tests cover request shaping, provider policy, wizard gating, and runtime routing with local/test-double verification. Final live speech proof still requires real provider credentials, microphones, speakers, and a target-equivalent Windows workstation; that external work is tracked in `PROJECT_STATUS.json`.
