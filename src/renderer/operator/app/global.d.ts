import type { OnlySpeechRendererApi } from "../../../shared/onlyspeech-api.js";

declare global {
  interface Window {
    onlySpeech?: OnlySpeechRendererApi;
  }
}

export {};
