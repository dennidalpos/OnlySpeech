import { getLanguagesForProvider } from "../../shared/unified-language-registry.js";
import type { ProviderAdapter, TranslationProvider } from "../../shared/types.js";

const PROVIDER_ADAPTERS = Object.freeze({
  azure: {
    provider: "azure",
    label: "Azure Speech",
    supportsStt: true,
    supportsTranslation: true,
    supportsTts: true,
    supportsStreaming: true,
    requiresCredentials: true,
    requiresNetworkServer: false,
    supportedLanguages: getLanguagesForProvider("azure").map((language) => language.id),
    supportedVoices: ["runtime-catalog"],
    diagnosticChecks: [
      { id: "azure-speech-token", label: "Azure Speech token" },
      { id: "azure-voice-catalog", label: "Azure voice catalog" }
    ]
  },
  chatgpt: {
    provider: "chatgpt",
    label: "ChatGPT",
    supportsStt: true,
    supportsTranslation: true,
    supportsTts: true,
    supportsStreaming: false,
    requiresCredentials: true,
    requiresNetworkServer: false,
    supportedLanguages: getLanguagesForProvider("chatgpt").map((language) => language.id),
    supportedVoices: ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"],
    diagnosticChecks: [
      { id: "openai-translation", label: "OpenAI translation request" },
      { id: "openai-stt", label: "OpenAI speech-to-text request" },
      { id: "openai-tts", label: "OpenAI text-to-speech request" }
    ]
  },
  ollama: {
    provider: "ollama",
    label: "Ollama",
    supportsStt: false,
    supportsTranslation: true,
    supportsTts: false,
    supportsStreaming: true,
    requiresCredentials: false,
    requiresNetworkServer: true,
    supportedLanguages: getLanguagesForProvider("ollama").map((language) => language.id),
    supportedVoices: [],
    diagnosticChecks: [
      { id: "ollama-version", label: "Ollama version endpoint" },
      { id: "ollama-tags", label: "Ollama model inventory" },
      { id: "ollama-chat", label: "Ollama translation chat request" }
    ]
  }
}) as Readonly<Record<TranslationProvider, ProviderAdapter>>;

export function getProviderAdapter(provider: TranslationProvider): ProviderAdapter {
  return PROVIDER_ADAPTERS[provider];
}

export function getProviderAdapters(): ProviderAdapter[] {
  return Object.values(PROVIDER_ADAPTERS);
}

