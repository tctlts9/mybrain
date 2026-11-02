import { useState, useEffect, useRef, useCallback } from 'react';
import { parseVoiceNumber } from '../utils/speechUtils';

// SpeechRecognition type declarations
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface UseVoiceAnswerOptions {
  lang: 'vi' | 'en';
  onNumberDetected: (num: number, rawTranscript: string) => void;
}

export function useVoiceAnswer({ lang, onNumberDetected }: UseVoiceAnswerOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        setTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        setTranscript(currentTranscript);

        // Try parsing number from speech
        const detected = parseVoiceNumber(currentTranscript, lang);
        if (detected !== null) {
          onNumberDetected(detected, currentTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError(
            lang === 'vi'
              ? 'Vui lòng cấp quyền Microphone để trả lời bằng giọng nói'
              : 'Please allow Microphone access to answer by voice'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            lang === 'vi'
              ? 'Chưa nghe thấy giọng nói, vui lòng thử lại'
              : 'No speech detected, please try again'
          );
        } else {
          setVoiceError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, onNumberDetected]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setVoiceError(null);
      setTranscript('');
      recognitionRef.current.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
      recognitionRef.current.start();
    } catch {
      // If already started, restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 100);
      } catch {
        // ignore
      }
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    voiceError,
    startListening,
    stopListening,
    toggleListening,
  };
}
