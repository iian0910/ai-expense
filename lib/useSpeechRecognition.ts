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

      recognition.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript;
          } else {
            interimChunk += result[0].transcript;
          }
        }
        if (finalChunk) onResult(finalChunk, true);
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
