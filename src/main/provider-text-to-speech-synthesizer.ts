import { Buffer } from "node:buffer";
import { AzureTextToSpeechProvider } from "../services/speech/azure-text-to-speech-provider.js";
import { OpenAiTextToSpeechProvider } from "../services/speech/openai-text-to-speech-provider.js";
import { TextToSpeechProviderError } from "../services/speech/text-to-speech-provider.js";
import { pickBestMatchingTextToSpeechVoice } from "../shared/text-to-speech-policy.js";
import type {
  StartTextToSpeechCommand,
  TextToSpeechEngine,
  TextToSpeechSynthesisResponse
} from "../shared/types.js";

function resolveRequestedEngine(command: StartTextToSpeechCommand): TextToSpeechEngine {
  if (command.translationProvider === "azure") {
    return "azure";
  }

  if (command.translationProvider === "chatgpt") {
    return "openai";
  }

  return command.engine;
}

function encodeAudioBase64(audioBuffer: ArrayBuffer): string {
  return Buffer.from(audioBuffer).toString("base64");
}

export async function synthesizeTextToSpeech(
  command: StartTextToSpeechCommand
): Promise<TextToSpeechSynthesisResponse> {
  const engine = resolveRequestedEngine(command);
  const text = command.text.trim();
  if (!text) {
    return {
      ok: false,
      engine,
      eventType: "unavailable",
      message: "No text is available for playback."
    };
  }

  if (command.translationProvider === "ollama") {
    return {
      ok: false,
      engine,
      eventType: "unavailable",
      message: "Ollama does not expose runtime text-to-speech playback in OnlySpeech."
    };
  }

  try {
    if (engine === "azure") {
      const provider = new AzureTextToSpeechProvider({
        getConfig: async () =>
          command.azureSpeechKey?.trim() && command.azureSpeechRegion?.trim()
            ? {
                key: command.azureSpeechKey.trim(),
                region: command.azureSpeechRegion.trim()
              }
            : null
      });
      const voices = await provider.listVoices();
      const voice = pickBestMatchingTextToSpeechVoice(voices, command.language);
      if (!voice) {
        return {
          ok: false,
          engine,
          eventType: "unavailable",
          message: "Azure text-to-speech does not expose a compatible voice for the selected language."
        };
      }

      const synthesis = await provider.synthesize(command, voice);
      return {
        ok: true,
        synthesis: {
          audioBase64: encodeAudioBase64(synthesis.audioBuffer),
          audioMimeType: synthesis.audioMimeType,
          engine: synthesis.engine,
          language: synthesis.language,
          voiceName: synthesis.voiceName
        }
      };
    }

    const provider = new OpenAiTextToSpeechProvider({
      getConfig: async () =>
        command.chatGptApiKey?.trim()
          ? {
              apiKey: command.chatGptApiKey.trim(),
              model: command.chatGptTextToSpeechModel?.trim() || "gpt-4o-mini-tts",
              voice: command.chatGptTextToSpeechVoice?.trim() || "alloy"
            }
          : null
    });
    const voices = await provider.listVoices();
    const voice = pickBestMatchingTextToSpeechVoice(voices, command.language);
    if (!voice) {
      return {
        ok: false,
        engine,
        eventType: "unavailable",
        message: "OpenAI text-to-speech does not expose the shared kiosk catalog for the selected language."
      };
    }

    const synthesis = await provider.synthesize(command, voice);
    return {
      ok: true,
      synthesis: {
        audioBase64: encodeAudioBase64(synthesis.audioBuffer),
        audioMimeType: synthesis.audioMimeType,
        engine: synthesis.engine,
        language: synthesis.language,
        voiceName: synthesis.voiceName
      }
    };
  } catch (error) {
    if (error instanceof TextToSpeechProviderError) {
      return {
        ok: false,
        engine: error.engine,
        eventType: error.eventType,
        message: error.message,
        errorCode: error.errorCode
      };
    }

    throw error;
  }
}
