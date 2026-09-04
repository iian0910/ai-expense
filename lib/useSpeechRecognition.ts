"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type ResultHandler = (transcriptChunk: string, isFinal: boolean) => void;

function subscribeNoop() {
  return () => {};
}

function getSupportSnapshot() {
  return !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

function getSupportServerSnapshot() {
  return false;
}

export function useSpeechRecognition(lang = "zh-TW") {
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getSupportSnapshot,
    getSupportServerSnapshot
  );
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(
    (onResult: ResultHandler) => {
      const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) {
        setError("此瀏覽器不支援語音輸入");
        return;
      }

      recognitionRef.current?.stop();

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;

      // Don't trust event.resultIndex — on some platforms (e.g. Chrome on
      // Windows) it unreliably resets to 0, causing already-final results to
      // be re-emitted and double-counted. Track how many results have been
      // finalized ourselves instead.
      let finalizedCount = 0;

      recognition.onresult = (event) => {
        let newFinalChunk = "";
        let interimChunk = "";
        let currentFinalizedCount = 0;

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinalizedCount++;
            if (currentFinalizedCount > finalizedCount) {
              newFinalChunk += result[0].transcript;
            }
          } else {
            interimChunk += result[0].transcript;
          }
        }

        finalizedCount = currentFinalizedCount;

        if (newFinalChunk) onResult(newFinalChunk, true);
        if (interimChunk) onResult(interimChunk, false);
      };

      recognition.onerror = (event) => {
        setError(event.error === "not-allowed" ? "請允許使用麥克風權限" : "語音辨識發生錯誤");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setError(null);
      setIsListening(true);
      recognition.start();
    },
    [lang]
  );

  useEffect(() => stop, [stop]);

  return { isSupported, isListening, error, start, stop };
}
