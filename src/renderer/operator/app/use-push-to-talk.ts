import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { OnlySpeechRendererApi } from "../../../shared/onlyspeech-api.js";
import type { Side } from "../../../shared/types.js";

interface UsePushToTalkOptions {
  side: Side;
  canTalk: boolean;
  sendOperatorAction: OnlySpeechRendererApi["sendOperatorAction"];
}

export function usePushToTalk(options: UsePushToTalkOptions) {
  const { canTalk, sendOperatorAction, side } = options;
  const [isPttPressed, setIsPttPressed] = useState(false);
  const isPttPressedRef = useRef(false);

  useEffect(() => {
    isPttPressedRef.current = isPttPressed;
  }, [isPttPressed]);

  const endPtt = useCallback(() => {
    if (!isPttPressedRef.current) {
      return;
    }

    isPttPressedRef.current = false;
    setIsPttPressed(false);
    sendOperatorAction({ type: "request-ptt-up", side });
  }, [sendOperatorAction, side]);

  const startPtt = useCallback(() => {
    if (!canTalk || isPttPressedRef.current) {
      return;
    }

    isPttPressedRef.current = true;
    setIsPttPressed(true);
    sendOperatorAction({ type: "request-ptt-down", side });
  }, [canTalk, sendOperatorAction, side]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canTalk) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startPtt();
  };

  const onPointerUp = (event?: ReactPointerEvent<HTMLButtonElement>) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    endPtt();
  };

  useEffect(() => {
    if (!isPttPressed) {
      return;
    }

    const release = () => endPtt();

    window.addEventListener("pointerup", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("touchcancel", release);
    window.addEventListener("blur", release);

    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
      window.removeEventListener("touchcancel", release);
      window.removeEventListener("blur", release);
    };
  }, [endPtt, isPttPressed]);

  useEffect(() => {
    const isKeyboardPttKey = (event: KeyboardEvent) =>
      event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isKeyboardPttKey(event) || event.repeat) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        if (
          target.isContentEditable ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          tagName === "BUTTON"
        ) {
          return;
        }
      }

      event.preventDefault();
      startPtt();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isKeyboardPttKey(event)) {
        return;
      }

      event.preventDefault();
      endPtt();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [endPtt, startPtt]);

  return {
    isPttPressed,
    startPtt,
    endPtt,
    onPointerDown,
    onPointerUp
  };
}
