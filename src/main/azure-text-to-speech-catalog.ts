import {
  AzureTextToSpeechProvider,
  resolveAzureTextToSpeechConfigFromEnvironment
} from "../services/speech/azure-text-to-speech-provider.js";
import type { AzureTextToSpeechCatalogSnapshot } from "../shared/types.js";

function createUnavailableCatalogSnapshot(
  region: string | null,
  error: string
): AzureTextToSpeechCatalogSnapshot {
  return {
    region,
    status: "unavailable",
    fetchedAt: null,
    freshUntil: null,
    voiceCount: 0,
    error,
    voices: []
  };
}

export async function getAzureTextToSpeechCatalogSnapshotFromEnvironment(
  env: Record<string, string | undefined | null>
): Promise<AzureTextToSpeechCatalogSnapshot> {
  const azureConfig = resolveAzureTextToSpeechConfigFromEnvironment(env);
  if (!azureConfig) {
    return createUnavailableCatalogSnapshot(
      env.AZURE_SPEECH_REGION?.trim() || null,
      "Azure text-to-speech credentials are not configured."
    );
  }

  const azureProvider = new AzureTextToSpeechProvider({
    getConfig: async () => azureConfig
  });

  return await azureProvider.getCatalogSnapshot();
}
