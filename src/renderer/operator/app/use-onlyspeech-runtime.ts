import { useCallback, useEffect, useRef, useState } from "react";
import type { OnlySpeechRendererApi } from "../../../shared/onlyspeech-api.js";
import type { AppState, RendererCommand, Side, TextToSpeechContent } from "../../../shared/types.js";
import { probeAudioInputDevices } from "../../../services/audio/media-device-probe.js";
import { LiveSpeechClient } from "../../../services/speech/live-speech-client.js";
import { TextToSpeechClient } from "../../../services/speech/text-to-speech-client.js";

function formatRuntimeError(error: unknown): string {
  const errorName =
    typeof error === "object" && error && "name" in error && typeof error.name === "string"
      ? error.name
      : "";
  const message = error instanceof Error ? error.message : String(error);

  return errorName && !message.toLowerCase().includes(errorName.toLowerCase())
    ? `${errorName}: ${message}`
    : message;
}

export function useOnlySpeechRuntime(side: Side, onlySpeechApi: OnlySpeechRendererApi | null) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const speechClientRef = useRef<LiveSpeechClient | null>(null);
  const textToSpeechClientRef = useRef<TextToSpeechClient | null>(null);
  const lastActivitySignalAtRef = useRef(0);
  const deviceChangeDebounceTimerRef = useRef<number | null>(null);
  const activeTextToSpeechRef = useRef<{
    requestId: string;
    content: TextToSpeechContent;
    text: string;
    language: string | null;
  } | null>(null);

  const getSpeechClient = useCallback(async (): Promise<LiveSpeechClient> => {
    if (!speechClientRef.current) {
      speechClientRef.current = new LiveSpeechClient();
    }

    return speechClientRef.current;
  }, []);

  const getTextToSpeechClient = useCallback(async (): Promise<TextToSpeechClient> => {
    if (!textToSpeechClientRef.current) {
      textToSpeechClientRef.current = new TextToSpeechClient({
        synthesizeTextToSpeech: onlySpeechApi
          ? onlySpeechApi.synthesizeTextToSpeech.bind(onlySpeechApi)
          : undefined
      });
    }

    return textToSpeechClientRef.current;
  }, [onlySpeechApi]);

  useEffect(() => {
    if (!onlySpeechApi) {
      return;
    }

    const reportActivity = () => {
      const now = Date.now();
      if (now - lastActivitySignalAtRef.current < 750) {
        return;
      }

      lastActivitySignalAtRef.current = now;
      onlySpeechApi.sendOperatorAction({ type: "activity", side });
    };

    const handleCommand = (command: RendererCommand) => {
      if (command.type !== "probe-devices" && command.side !== side) {
        return;
      }

      void (async () => {
        switch (command.type) {
          case "probe-devices": {
            const payload = await probeAudioInputDevices(side);
            onlySpeechApi.sendDeviceProbe(payload);
            break;
          }
          case "start-speech": {
            try {
              const textToSpeechClient = await getTextToSpeechClient();
              textToSpeechClient.shutdown();
              activeTextToSpeechRef.current = null;
              const speechClient = await getSpeechClient();
              await speechClient.start(command, {
                onEvent: (event) => {
                  onlySpeechApi.sendSpeechEvent(event);
                }
              });
            } catch (error) {
              onlySpeechApi.sendSpeechEvent({
                type: "error",
                sessionId: command.sessionId,
                side,
                error: formatRuntimeError(error)
              });
            }
            break;
          }
          case "stop-speech": {
            const speechClient = await getSpeechClient();
            await speechClient.finish({
              onEvent: (event) => {
                onlySpeechApi.sendSpeechEvent(event);
              }
            });
            break;
          }
          case "start-tts": {
            activeTextToSpeechRef.current = {
              requestId: command.requestId,
              content: command.content,
              text: command.text,
              language: command.language
            };

            try {
              const textToSpeechClient = await getTextToSpeechClient();
              await textToSpeechClient.start(command, {
                onEvent: (event) => {
                  onlySpeechApi.sendTextToSpeechEvent(event);
                }
              });
            } catch (error) {
              onlySpeechApi.sendTextToSpeechEvent({
                type: "error",
                side,
                content: command.content,
                requestId: command.requestId,
                engine: command.engine,
                language: command.language,
                error: formatRuntimeError(error)
              });
            }
            break;
          }
          case "stop-tts": {
            const textToSpeechClient = await getTextToSpeechClient();
            await textToSpeechClient.stop(command, {
              onEvent: (event) => {
                onlySpeechApi.sendTextToSpeechEvent(event);
              }
            });
            activeTextToSpeechRef.current = null;
            break;
          }
          default:
            break;
        }
      })();
    };

    const unsubscribeState = onlySpeechApi.onState((state) => {
      setAppState(state);
    });
    const unsubscribeCommand = onlySpeechApi.onCommand(handleCommand);

    onlySpeechApi.sendOperatorAction({ type: "renderer-ready", side });

    const mediaDevices = navigator.mediaDevices;
    const triggerDeviceProbe = () => {
      void probeAudioInputDevices(side).then((payload) => {
        onlySpeechApi.sendDeviceProbe(payload);
      });
    };

    const onDeviceChange = () => {
      if (deviceChangeDebounceTimerRef.current !== null) {
        window.clearTimeout(deviceChangeDebounceTimerRef.current);
      }

      deviceChangeDebounceTimerRef.current = window.setTimeout(() => {
        deviceChangeDebounceTimerRef.current = null;
        triggerDeviceProbe();
      }, 350);
    };

    mediaDevices?.addEventListener?.("devicechange", onDeviceChange);

    window.addEventListener("pointermove", reportActivity, { passive: true });
    window.addEventListener("touchstart", reportActivity, { passive: true });
    window.addEventListener("touchmove", reportActivity, { passive: true });
    window.addEventListener("mousedown", reportActivity, { passive: true });

    return () => {
      unsubscribeState();
      unsubscribeCommand();
      if (deviceChangeDebounceTimerRef.current !== null) {
        window.clearTimeout(deviceChangeDebounceTimerRef.current);
        deviceChangeDebounceTimerRef.current = null;
      }
      mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
      window.removeEventListener("pointermove", reportActivity);
      window.removeEventListener("touchstart", reportActivity);
      window.removeEventListener("touchmove", reportActivity);
      window.removeEventListener("mousedown", reportActivity);
      void speechClientRef.current?.stop();
      textToSpeechClientRef.current?.shutdown();
      activeTextToSpeechRef.current = null;
    };
  }, [getSpeechClient, getTextToSpeechClient, onlySpeechApi, side]);

  useEffect(() => {
    if (!onlySpeechApi || !appState || !activeTextToSpeechRef.current) {
      return;
    }

    const activePlayback = activeTextToSpeechRef.current;
    if (
      appState.textToSpeech.requestId !== activePlayback.requestId ||
      appState.textToSpeech.side !== side ||
      appState.textToSpeech.content !== activePlayback.content
    ) {
      activeTextToSpeechRef.current = null;
      return;
    }

    const sideState = appState.sides[side];
    const currentText =
      activePlayback.content === "transcript" ? sideState.localTranscript : sideState.remoteTranslation;
    const currentLanguage =
      activePlayback.content === "transcript"
        ? sideState.detectedSourceLanguage ?? sideState.sourceLanguage ?? null
        : sideState.selectedTargetLanguage ?? null;

    if (currentText === activePlayback.text && currentLanguage === activePlayback.language) {
      return;
    }

    onlySpeechApi.stopTextToSpeech({
      side,
      content: activePlayback.content
    });
  }, [appState, onlySpeechApi, side]);

  return appState;
}
