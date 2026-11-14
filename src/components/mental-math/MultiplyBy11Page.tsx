import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ArrowRight,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Gauge,
  BookOpen,
  Delete,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  pronounceQuestionFemaleVoice,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';

export type Multiply11Topic =
  | 'general'
  | 'general11'
  | 'digit2'
  | 'digit3'
  | 'digit4'
  | 'digit5'
  | 'digit6'
  | 'digit7'
  | 'digit8'
  | 'digit9'
  | 'digit10'
  | 'twoDigit11'
  | 'threeDigit11'
  | 'multiDigit11'
  | 'mixed11';

interface MultiplyBy11PageProps {
  onBack: () => void;
  onOpenChallenge?: (topic?: Multiply11Topic) => void;
  onOpenVisualGuide?: () => void;
  initialTopic?: Multiply11Topic;
}

interface Question {
  a: number;
  b: number;
  answer: number;
}

interface TopicOption {
  id: Multiply11Topic;
  digits: number;
  labelVi: string;
  labelEn: string;
  fullNameVi: string;
  fullNameEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

export const TRAINING_MODES: TopicOption[] = [
  {
    id: 'general',
    digits: 0,
    labelVi: 'Tổng quát',
    labelEn: 'General',
    fullNameVi: 'Nhân với 11 tổng quát (ngẫu nhiên 2 - 10 chữ số)',
    fullNameEn: 'General: 2 - 10 Digits × 11',
    icon: '⚡',
    badgeVi: 'Tổng quát: 2 - 10 Chữ Số × 11',
    badgeEn: 'General: 2 - 10 Digits × 11',
  },
  {
    id: 'digit3',
    digits: 3,
    labelVi: '3 Chữ số',
    labelEn: '3-Digit',
    fullNameVi: 'Nhân 3 chữ số với 11',
    fullNameEn: 'Multiply 3-Digit by 11',
    icon: '✨',
    badgeVi: 'Chuyên đề: Nhân 3 chữ số với 11',
    badgeEn: 'Topic: 3-Digit × 11',
  },
  {
    id: 'digit4',
    digits: 4,
    labelVi: '4 Chữ số',
    labelEn: '4-Digit',
    fullNameVi: 'Nhân 4 chữ số với 11',
    fullNameEn: 'Multiply 4-Digit by 11',
    icon: '🚀',
    badgeVi: 'Chuyên đề: Nhân 4 chữ số với 11',
    badgeEn: 'Topic: 4-Digit × 11',
  },
  {
    id: 'digit5',
    digits: 5,
    labelVi: '5 Chữ số',
    labelEn: '5-Digit',
    fullNameVi: 'Nhân 5 chữ số với 11',
    fullNameEn: 'Multiply 5-Digit by 11',
    icon: '⭐',
    badgeVi: 'Chuyên đề: Nhân 5 chữ số với 11',
    badgeEn: 'Topic: 5-Digit × 11',
  },
  {
    id: 'digit6',
    digits: 6,
    labelVi: '6 Chữ số',
    labelEn: '6-Digit',
    fullNameVi: 'Nhân 6 chữ số với 11',
    fullNameEn: 'Multiply 6-Digit by 11',
    icon: '🎯',
    badgeVi: 'Chuyên đề: Nhân 6 chữ số với 11',
    badgeEn: 'Topic: 6-Digit × 11',
  },
  {
    id: 'digit7',
    digits: 7,
    labelVi: '7 Chữ số',
    labelEn: '7-Digit',
    fullNameVi: 'Nhân 7 chữ số với 11',
    fullNameEn: 'Multiply 7-Digit by 11',
    icon: '🔥',
    badgeVi: 'Chuyên đề: Nhân 7 chữ số với 11',
    badgeEn: 'Topic: 7-Digit × 11',
  },
  {
    id: 'digit8',
    digits: 8,
    labelVi: '8 Chữ số',
    labelEn: '8-Digit',
    fullNameVi: 'Nhân 8 chữ số với 11',
    fullNameEn: 'Multiply 8-Digit by 11',
    icon: '💎',
    badgeVi: 'Chuyên đề: Nhân 8 chữ số với 11',
    badgeEn: 'Topic: 8-Digit × 11',
  },
  {
    id: 'digit9',
    digits: 9,
    labelVi: '9 Chữ số',
    labelEn: '9-Digit',
    fullNameVi: 'Nhân 9 chữ số với 11',
    fullNameEn: 'Multiply 9-Digit by 11',
    icon: '🏆',
    badgeVi: 'Chuyên đề: Nhân 9 chữ số với 11',
    badgeEn: 'Topic: 9-Digit × 11',
  },
  {
    id: 'digit10',
    digits: 10,
    labelVi: '10 Chữ số',
    labelEn: '10-Digit',
    fullNameVi: 'Nhân 10 chữ số với 11',
    fullNameEn: 'Multiply 10-Digit by 11',
    icon: '👑',
    badgeVi: 'Chuyên đề: Nhân 10 chữ số với 11',
    badgeEn: 'Topic: 10-Digit × 11',
  },
];

const getSpelledOutDigits = (num: number, isVietnamese: boolean): string => {
  const digits = String(num).split('');
  const enWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };
  const viWords: Record<string, string> = {
    '0': 'Không',
    '1': 'Một',
    '2': 'Hai',
    '3': 'Ba',
    '4': 'Bốn',
    '5': 'Năm',
    '6': 'Sáu',
    '7': 'Bảy',
    '8': 'Tám',
    '9': 'Chín',
  };
  const words = isVietnamese ? viWords : enWords;
  return digits.map((d) => words[d] || d).join(' ');
};

export const MultiplyBy11Page: React.FC<MultiplyBy11PageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenVisualGuide,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Training Mode State
  const [selectedTopic, setSelectedTopic] = useState<Multiply11Topic>(initialTopic || 'general');
  const [question, setQuestion] = useState<Question>({ a: 68, b: 11, answer: 748 });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Thông báo kết quả qua loa & Giọng nói
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  // Tốc độ phát loa câu hỏi (1.25x, 1.5x, 1.75x)
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved) {
        const parsed = parseFloat(saved);
        if ([1.25, 1.5, 1.75].includes(parsed)) return parsed;
      }
    }
    return 1.25;
  });

  const handleSetSpeed = (newSpeed: number) => {
    setQuestionSpeed(newSpeed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mental_math_question_speed', String(newSpeed));
    }
    if (isSpeakingQuestion) {
      pronounceQuestion(newSpeed);
    }
  };

  // Chức năng Trả lời bằng Voice
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<Question>(question);
  questionRef.current = question;

  const recognitionRef = useRef<any>(null);
  const submitTimerRef = useRef<any>(null);
  const lastParsedRef = useRef<number | null>(null);
  const hasSubmittedRef = useRef<boolean>(false);

  // Thông báo kết quả qua loa khi trả lời đúng hoặc sai
  const announceResult = useCallback(
    (isCorrect: boolean, targetAnswer: number) => {
      if (!isSpeakerEnabled) return;

      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');

      setTimeout(() => {
        announceResultFemaleVoice(
          isCorrect,
          targetAnswer,
          isVi ? 'vi' : 'en',
          () => setIsSpeaking(false),
          questionSpeed
        );
      }, 200);
    },
    [isSpeakerEnabled, isVi, questionSpeed]
  );

  // Phát âm thông tin câu hỏi bằng giọng nữ (VD: "Sáu Tám nhân Một Một")
  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      setIsSpeakingQuestion(true);
      const speedToUse = overrideSpeed ?? questionSpeed;
      pronounceQuestionFemaleVoice(
        question.a,
        question.b,
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        speedToUse
      );
    },
    [question.a, question.b, isVi, questionSpeed]
  );

  // Replay result announcement manually when clicking the audio icon
  const replayAnnouncement = useCallback(() => {
    if (feedback === 'correct') {
      announceResult(true, question.answer);
    } else if (feedback === 'incorrect') {
      announceResult(false, question.answer);
    }
  }, [feedback, question.answer, announceResult]);

  // Check answer and trigger speaker chime + voice notification
  const verifyAnswer = useCallback(
    (inputNum: number) => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
      hasSubmittedRef.current = true;

      // Stop recognition while announcing result
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);

      if (inputNum === questionRef.current.answer) {
        setFeedback('correct');
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        announceResult(false, questionRef.current.answer);
      }
    },
    [announceResult]
  );

  // Stop Voice Recognition
  const stopListening = useCallback(() => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  // Start Voice Recognition for answering with explicit permission checking
  const startListening = useCallback(async () => {
    setVoiceError('');
    setVoiceTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge.'
          : 'Browser does not support Web Speech API. Please use Chrome/Edge.'
      );
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setVoiceError(
        isVi
          ? 'Chưa cấp quyền Micro. Vui lòng click icon ổ khóa trên thanh địa chỉ để Cho phép Micro.'
          : 'Microphone permission denied. Please allow microphone access.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setVoiceTranscript(finalTranscript);

      const parsedNum = parseVoiceNumber(finalTranscript, isVi ? 'vi' : 'en');

      if (parsedNum !== null && parsedNum > 0) {
        setUserAnswer(String(parsedNum));
        lastParsedRef.current = parsedNum;

        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
        submitTimerRef.current = setTimeout(() => {
          if (!hasSubmittedRef.current && lastParsedRef.current !== null) {
            hasSubmittedRef.current = true;
            verifyAnswer(lastParsedRef.current);
          }
        }, 850);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isVi, verifyAnswer]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Generate question according to selected digit count for Multiply by 11
  const generateNewQuestion = useCallback(
    (topicOverride?: Multiply11Topic) => {
      stopCurrentSpeech();
      stopListening();

      const activeTopic = topicOverride || selectedTopic;
      const isGeneral =
        activeTopic === 'general' ||
        activeTopic === 'general11' ||
        activeTopic === 'digit2' ||
        activeTopic === 'twoDigit11' ||
        activeTopic === 'mixed11';

      let digits = 2;
      if (isGeneral) {
        // Ngẫu nhiên từ 2 số đến 10 số
        digits = Math.floor(Math.random() * 9) + 2;
      } else if (activeTopic === 'digit3' || activeTopic === 'threeDigit11') digits = 3;
      else if (activeTopic === 'digit4') digits = 4;
      else if (activeTopic === 'digit5') digits = 5;
      else if (activeTopic === 'digit6') digits = 6;
      else if (activeTopic === 'digit7') digits = 7;
      else if (activeTopic === 'digit8') digits = 8;
      else if (activeTopic === 'digit9') digits = 9;
      else if (activeTopic === 'digit10') digits = 10;
      else if (activeTopic === 'multiDigit11') digits = Math.random() > 0.5 ? 5 : 4;
      else digits = Math.floor(Math.random() * 9) + 2;

      let num: number;
      if (digits === 2) {
        // 2-digit: 12..99
        num = Math.floor(Math.random() * 88) + 12;
      } else {
        // Exact N-digit number from 10^(N-1) to 10^N - 1
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      // Số 11 có thể đứng trước hoặc đứng sau
      let a = num;
      let b = 11;
      if (isGeneral) {
        const isElevenFirst = Math.random() < 0.5;
        if (isElevenFirst) {
          a = 11;
          b = num;
        } else {
          a = num;
          b = 11;
        }
      }

      const newQ = {
        a,
        b,
        answer: a * b,
      };
      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      lastParsedRef.current = null;
      hasSubmittedRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [selectedTopic, stopListening]
  );

  const handleSelectTopic = (newTopic: Multiply11Topic) => {
    setSelectedTopic(newTopic);
    generateNewQuestion(newTopic);
  };

  useEffect(() => {
    if (initialTopic) {
      setSelectedTopic(initialTopic);
      generateNewQuestion(initialTopic);
    } else {
      generateNewQuestion();
    }
    return () => {
      stopCurrentSpeech();
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [initialTopic]);

  // Phím số ảo 0-9 nhập kết quả nhanh (hỗ trợ tối đa 14 chữ số cho phép tính 10 chữ số)
  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') {
        setFeedback('idle');
      }
      setUserAnswer((prev) => {
        if (prev.length >= 14) return prev;
        return prev + digit;
      });
    },
    [feedback]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (feedback === 'incorrect') {
      setFeedback('idle');
    }
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleKeypadClear = useCallback(() => {
    if (feedback === 'correct') return;
    setUserAnswer('');
    setFeedback('idle');
    inputRef.current?.focus();
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;
    verifyAnswer(parsed);
  };

  const currentTopicMeta =
    TRAINING_MODES.find((m) => m.id === selectedTopic) ||
    TRAINING_MODES.find((m) => m.id === 'general' && (selectedTopic === 'digit2' || selectedTopic === 'twoDigit11' || selectedTopic === 'general11')) ||
    TRAINING_MODES[0];

  const maxDigits = Math.max(String(question.a).length, String(question.b).length);
  const formulaFontSize =
    maxDigits >= 9
      ? 'text-base xs:text-lg sm:text-2xl md:text-3xl'
      : maxDigits >= 6
      ? 'text-lg xs:text-xl sm:text-3xl md:text-4xl'
      : maxDigits >= 4
      ? 'text-xl xs:text-2xl sm:text-4xl md:text-5xl'
      : 'text-2xl xs:text-3xl sm:text-5xl md:text-6xl';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back button, Challenge Button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenVisualGuide && (
            <button
              type="button"
              onClick={onOpenVisualGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Xem hướng dẫn trực quan (Visual Guide)' : 'Visual Guide'}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </button>
          )}

          {onOpenChallenge && (
            <button
              onClick={() => onOpenChallenge(selectedTopic)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Thử thách Nhân với 11 (5s / 10s)' : 'Multiply by 11 Challenge (5s / 10s)'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Nhân 11' : 'Multiply 11 Challenge'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">
              {isVi ? 'Nhân với số 11' : 'Multiply by 11'}
            </span>
          </div>
        </div>
      </div>

      {/* Training Section */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        {/* Subtle backdrop glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Title, Action Buttons & Result Audio Announcement Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi ? 'Luyện tập: Nhân với số 11' : 'Training: Multiply by 11'}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Button: Visual Guide / Hướng Dẫn Trực Quan */}
            {onOpenVisualGuide && (
              <button
                type="button"
                onClick={onOpenVisualGuide}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
                title={isVi ? 'Xem hướng dẫn trực quan (Visual Guide)' : 'Visual Guide'}
              >
                <BookOpen className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Hướng Dẫn' : 'Guide'}</span>
              </button>
            )}

            {/* Button: Mental Math Challenge */}
            {onOpenChallenge && (
              <button
                type="button"
                onClick={() => onOpenChallenge(selectedTopic)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-xs"
                title={isVi ? 'Thử thách nhân 11 trong 5s hoặc 10s' : 'Multiply 11 Challenge in 5s or 10s'}
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Thử Thách' : 'Challenge'}</span>
              </button>
            )}

            {/* Toggle Thông báo kết quả bằng giọng nói / âm thanh */}
            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs ring-1 ring-amber-400/20'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800'
              }`}
              title={
                isSpeakerEnabled
                  ? isVi
                    ? 'Đang bật thông báo kết quả bằng giọng nói (Bấm để tắt)'
                    : 'Voice result announcement ON (Click to mute)'
                  : isVi
                  ? 'Đang tắt thông báo giọng nói (Bấm để bật)'
                  : 'Voice result announcement OFF (Click to enable)'
              }
            >
              {isSpeakerEnabled ? (
                <Volume2
                  className={`w-3.5 h-3.5 text-amber-400 ${isSpeaking ? 'animate-bounce' : ''}`}
                />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="font-semibold">
                {isSpeakerEnabled
                  ? isVi
                    ? 'Kết quả: Bật'
                    : 'Result:ON'
                  : isVi
                  ? 'Kết quả: Tắt'
                  : 'Result:OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Group Buttons: Lựa chọn bài training theo yêu cầu (3 Cột, text ngắn gọn: 2 đến 10 chữ số) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVi ? 'Chọn bài luyện tập theo yêu cầu:' : 'Select training topic:'}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            {TRAINING_MODES.map((mode) => {
              const isSelected =
                selectedTopic === mode.id ||
                (mode.id === 'general' &&
                  (selectedTopic === 'general11' ||
                    selectedTopic === 'digit2' ||
                    selectedTopic === 'twoDigit11'));
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSelectTopic(mode.id)}
                  title={isVi ? mode.fullNameVi : mode.fullNameEn}
                  className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                      : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                  }`}
                >
                  <span className="text-sm shrink-0">{mode.icon}</span>
                  <span className="truncate whitespace-nowrap">{isVi ? mode.labelVi : mode.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Math Question Arena — Side-by-Side on Desktop */}
        <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
          <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-5 sm:p-7 text-center shadow-inner relative group flex flex-col items-center justify-center">
            {/* Header: Topic Badge */}
            <div className="flex items-center justify-center mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
              </span>
            </div>

            {/* Large Mathematical Problem Display with Speaker Button & Speed Adjustment */}
            <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-2 w-full">
              <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-full overflow-x-auto no-scrollbar py-1">
                <div className={`font-black text-white font-mono flex items-center justify-center whitespace-nowrap gap-1.5 sm:gap-2.5 tracking-tight select-none shrink-0 ${formulaFontSize}`}>
                  <span>{question.a.toLocaleString()}</span>
                  <span className="text-amber-400 font-sans">×</span>
                  <span>{question.b.toLocaleString()}</span>
                </div>

                {/* Button Loa để phát thông tin câu hỏi */}
                <button
                  type="button"
                  onClick={() => pronounceQuestion()}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                    isSpeakingQuestion
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/30 animate-pulse'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
                  }`}
                  title={
                    isVi
                      ? `Phát âm câu hỏi (${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}) - Tốc độ: ${questionSpeed}x`
                      : `Pronounce question (${question.a} times ${question.b}) - Speed: ${questionSpeed}x`
                  }
                  aria-label={
                    isVi
                      ? `Phát âm câu hỏi: ${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}`
                      : 'Pronounce question'
                  }
                >
                  <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Tùy chỉnh tốc độ loa phát câu hỏi (1.25x, 1.5x, 1.75x) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isVi ? 'Tốc độ:' : 'Speed:'}</span>
                </span>
                <div className="flex items-center gap-1 ml-0.5">
                  {[1.25, 1.5, 1.75].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSetSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                        questionSpeed === s
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400 font-extrabold'
                          : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
                      }`}
                      title={isVi ? `Chỉnh tốc độ đọc ${s}x` : `Playback speed ${s}x`}
                    >
                      {`${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback message with Replay Audio Button */}
            {feedback === 'correct' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer.toLocaleString()})`
                    : `Correct: ${getSpelledOutDigits(question.answer, false)} (${question.answer.toLocaleString()})`}
                </span>
                <button
                  type="button"
                  onClick={replayAnnouncement}
                  className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60"
                  title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {feedback === 'incorrect' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer.toLocaleString()})`
                    : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${question.answer.toLocaleString()})`}
                </span>
                <button
                  type="button"
                  onClick={replayAnnouncement}
                  className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60"
                  title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Input Form */}
          <form onSubmit={handleSubmit} className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  isListening
                    ? isVi
                      ? '🎙️ Đang nghe... Hãy đọc to đáp án của bạn'
                      : '🎙️ Listening... Speak your answer aloud'
                    : isVi
                    ? 'Nhập kết quả hoặc bấm phím số bên dưới...'
                    : 'Type answer or tap numeric keys below...'
                }
                disabled={feedback === 'correct'}
                className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                    : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
              />
              {userAnswer && feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors"
                  title={isVi ? 'Xóa ô nhập' : 'Clear'}
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bàn phím số từ 0 đến 9 để Nhập kết quả trả lời nhanh - 2 hàng 6 cột nhỏ gọn */}
            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {/* Hàng 1: 1, 2, 3, 4, 5, 6 */}
                {[1, 2, 3, 4, 5, 6].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Hàng 2: 7, 8, 9, 0, Xóa, Backspace */}
                {[7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Xóa toàn bộ */}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                {/* Xóa 1 số lùi */}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa 1 số' : 'Backspace'}
                  aria-label="Backspace"
                >
                  <Delete className="w-4 h-4 text-slate-400 hover:text-amber-300" />
                </button>
              </div>
            </div>

            {/* Live voice feedback indicator when listening */}
            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="truncate">
                  {voiceTranscript
                    ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}" ➔ ${isVi ? 'Tự nộp bài...' : 'Submitting...'}`
                    : isVi
                    ? '🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: "bảy bốn tám", "748",...)'
                    : '🎙️ Listening: Speak your answer (e.g. "seven four eight", "748",...)'}
                </span>
              </div>
            )}

            {/* Error banner if microphone access is blocked or speech not heard */}
            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold leading-relaxed">{voiceError}</p>
                </div>
                <button
                  type="button"
                  onClick={startListening}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold shrink-0 transition-colors"
                >
                  {isVi ? 'Thử lại' : 'Retry'}
                </button>
              </div>
            )}

            {/* Action Buttons: Submit/Next, Answer by Voice, and Refresh */}
            <div className="flex items-center gap-2.5">
              {/* Submit or Next Problem Button */}
              {feedback === 'correct' ? (
                <button
                  type="button"
                  onClick={() => generateNewQuestion()}
                  className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Câu tiếp theo' : 'Next Problem'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Kiểm tra KQ' : 'Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Chức năng Trả lời bằng Voice */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={feedback === 'correct'}
                title={
                  isListening
                    ? isVi
                      ? 'Đang nghe... Bấm để dừng'
                      : 'Listening... Click to stop'
                    : isVi
                    ? 'Bấm để trả lời bằng giọng nói (Voice)'
                    : 'Answer by voice'
                }
                className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>{isVi ? 'Đang nghe...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>{isVi ? 'Trả lời Voice' : 'Voice'}</span>
                  </>
                )}
              </button>

              {/* Skip / Refresh Problem Button */}
              <button
                type="button"
                onClick={() => generateNewQuestion()}
                title={isVi ? 'Đổi đề bài khác' : 'Skip problem'}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
