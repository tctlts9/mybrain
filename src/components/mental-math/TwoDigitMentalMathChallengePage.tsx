import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Timer,
  Flame,
  Zap,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  AlertTriangle,
  Gauge,
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

export type ChallengeTopic = 'multiply11' | 'sameTensSum10' | 'twoDigit';

interface TopicOption {
  id: ChallengeTopic;
  labelVi: string;
  labelEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

export const CHALLENGE_TOPICS: TopicOption[] = [
  {
    id: 'multiply11',
    labelVi: 'Nhân với 11',
    labelEn: 'Multiply by 11',
    icon: '⚡',
    badgeVi: 'Nhân với 11',
    badgeEn: 'Multiply by 11',
  },
  {
    id: 'sameTensSum10',
    labelVi: 'Hàng chục giống nhau & Tổng ĐV = 10',
    labelEn: 'Same Tens & Units sum = 10',
    icon: '✨',
    badgeVi: 'Hàng chục giống nhau & Tổng ĐV = 10',
    badgeEn: 'Same Tens & Units sum = 10',
  },
  {
    id: 'twoDigit',
    labelVi: 'Nhân 2 chữ số tổng quát',
    labelEn: 'General 2D × 2D',
    icon: '🎯',
    badgeVi: '2 Chữ Số Tổng Quát',
    badgeEn: 'General 2D × 2D',
  },
];

interface MentalMathChallengePageProps {
  onBack: () => void;
  initialTopic?: ChallengeTopic;
}

interface Question {
  a: number;
  b: number;
  answer: number;
}

type TimeLimit = 5 | 10;
type GameStatus = 'idle' | 'running' | 'paused' | 'answered';

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

export const TwoDigitMentalMathChallengePage: React.FC<MentalMathChallengePageProps> = ({
  onBack,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Topic selection: Multiply by 11 | Same Tens & Units sum = 10 | General 2D × 2D
  const [selectedTopic, setSelectedTopic] = useState<ChallengeTopic>(initialTopic ?? 'twoDigit');

  // Config: 5s hoặc 10s
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(10);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');

  // Math Problem
  const [question, setQuestion] = useState<Question>(() => {
    const topic = initialTopic ?? 'twoDigit';
    if (topic === 'multiply11') {
      const num = Math.floor(Math.random() * 89) + 11;
      const isElevenFirst = Math.random() < 0.5;
      const a = isElevenFirst ? 11 : num;
      const b = isElevenFirst ? num : 11;
      return { a, b, answer: a * b };
    } else if (topic === 'sameTensSum10') {
      const tens = Math.floor(Math.random() * 8) + 2;
      const u1 = Math.floor(Math.random() * 9) + 1;
      const u2 = 10 - u1;
      const a = tens * 10 + u1;
      const b = tens * 10 + u2;
      return { a, b, answer: a * b };
    }
    return { a: 24, b: 35, answer: 840 };
  });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');

  // Score & Performance Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Sound & Voice
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  // Tốc độ phát loa câu hỏi (1x, 1.25x, 1.5x, 1.75x)
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved) {
        const parsed = parseFloat(saved);
        if ([1.0, 1.25, 1.5, 1.75].includes(parsed)) return parsed;
      }
    }
    return 1.0;
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

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const questionRef = useRef<Question>(question);
  questionRef.current = question;

  // Generate random problem based on Selected Topic:
  // 1. multiply11: 11-99 × 11
  // 2. sameTensSum10: same tens, units sum = 10
  // 3. twoDigit: 12-99 × 12-99 (General 2D × 2D)
  const generateProblemForTopic = useCallback(
    (topicToUse?: ChallengeTopic): Question => {
      const active = topicToUse ?? selectedTopic;
      let a = 24;
      let b = 35;

      if (active === 'multiply11') {
        const num = Math.floor(Math.random() * 89) + 11;
        const isElevenFirst = Math.random() < 0.5;
        if (isElevenFirst) {
          a = 11;
          b = num;
        } else {
          a = num;
          b = 11;
        }
      } else if (active === 'sameTensSum10') {
        const tens = Math.floor(Math.random() * 8) + 2;
        const u1 = Math.floor(Math.random() * 9) + 1;
        const u2 = 10 - u1;
        a = tens * 10 + u1;
        b = tens * 10 + u2;
      } else {
        a = Math.floor(Math.random() * 88) + 12;
        b = Math.floor(Math.random() * 88) + 12;
      }

      return { a, b, answer: a * b };
    },
    [selectedTopic]
  );

  // Stop Timer
  const clearCountdown = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Voice Result Announcement: Phát loa khi trả lời đúng hoặc sai
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

  // Pronounce Question (e.g. 52 x 11 -> "Năm Hai nhân Một Một") with speed
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

  // Submit Answer
  const submitAnswer = useCallback(
    (parsedAns: number) => {
      clearCountdown();
      setGameStatus('answered');

      // Stop listening if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);

      setTotalAttempts((prev) => prev + 1);

      if (parsedAns === questionRef.current.answer) {
        setFeedback('correct');
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        const pointsAwarded = timeLimit === 5 ? 20 : 10;
        setScore((prev) => prev + pointsAwarded);
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        setStreak(0);
        announceResult(false, questionRef.current.answer);
      }
    },
    [clearCountdown, timeLimit, announceResult]
  );

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    clearCountdown();
    setGameStatus('answered');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);

    setTotalAttempts((prev) => prev + 1);
    setFeedback('timeout');
    setStreak(0);
    announceResult(false, questionRef.current.answer);
  }, [clearCountdown, announceResult]);

  // Start Countdown Timer
  const startCountdown = useCallback(
    (duration: number) => {
      clearCountdown();
      setTimeLeft(duration);

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          clearCountdown();
          handleTimeout();
        }
      }, 100);
    },
    [clearCountdown, handleTimeout]
  );

  // Start Next Round / Start Challenge
  const startNextRound = useCallback(
    (explicitTimeLimit?: TimeLimit, explicitTopic?: ChallengeTopic) => {
      stopCurrentSpeech();
      clearCountdown();

      const activeLimit = explicitTimeLimit ?? timeLimit;
      const activeTopic = explicitTopic ?? selectedTopic;
      const newQ = generateProblemForTopic(activeTopic);
      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setGameStatus('running');

      startCountdown(activeLimit);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [timeLimit, selectedTopic, generateProblemForTopic, clearCountdown, startCountdown]
  );

  // Switch Time Limit (5s / 10s)
  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    setTimeLimit(newLimit);
    setTimeLeft(newLimit);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNextRound(newLimit);
    }
  };

  // Switch Topic: Multiply by 11 | Same Tens & Units sum = 10 | General 2D × 2D
  const handleSelectTopic = (newTopic: ChallengeTopic) => {
    setSelectedTopic(newTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNextRound(undefined, newTopic);
    } else {
      const newQ = generateProblemForTopic(newTopic);
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Reset Session
  const handleReset = () => {
    stopCurrentSpeech();
    clearCountdown();
    setGameStatus('idle');
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setUserAnswer('');
    setFeedback('idle');
    setTimeLeft(timeLimit);
    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
  };

  // Phím số ảo 0-9 nhập kết quả nhanh trong Thử thách
  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (gameStatus !== 'running') return;
      setUserAnswer((prev) => {
        if (prev.length >= 6) return prev;
        return prev + digit;
      });
    },
    [gameStatus]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (gameStatus !== 'running') return;
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  const handleKeypadClear = useCallback(() => {
    if (gameStatus !== 'running') return;
    setUserAnswer('');
    inputRef.current?.focus();
  }, [gameStatus]);

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameStatus !== 'running') return;
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;
    submitAnswer(parsed);
  };

  // Voice Recognition Handler
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    setVoiceError('');
    setVoiceTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.'
          : 'Web Speech Recognition not supported in this browser.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isVi ? 'vi-VN' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);

        const parsedNumber = parseVoiceNumber(transcript, isVi ? 'vi' : 'en');
        if (parsedNumber !== null && parsedNumber > 0) {
          setUserAnswer(String(parsedNumber));
          submitAnswer(parsedNumber);
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
    } catch {
      setIsListening(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdown();
      stopCurrentSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [clearCountdown]);

  // Timer Progress Calculation
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const isUrgent = timeLeft <= (timeLimit === 5 ? 2 : 3);

  const currentTopicMeta =
    CHALLENGE_TOPICS.find((t) => t.id === selectedTopic) || CHALLENGE_TOPICS[2];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-7 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back & Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
        <button
          onClick={() => {
            stopCurrentSpeech();
            clearCountdown();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title={isVi ? 'Quay về trang Luyện tập (Training)' : 'Back to Training page'}
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => {
              stopCurrentSpeech();
              clearCountdown();
              onBack();
            }}
            className="hover:text-amber-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
            title={isVi ? 'Về trang Luyện tập' : 'Go to Training page'}
          >
            {isVi ? 'Luyện tập' : 'Training'}
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
          </span>
        </div>
      </div>

      {/* Main Challenge Arena Container */}
      <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-amber-950/30 p-4 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Title, Mode Toggles & Sound */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isVi
                  ? 'Thử thách phản xạ tính nhẩm siêu tốc trong 5s hoặc 10s'
                  : 'Speed mental calculation challenge within 5s or 10s'}
              </p>
            </div>
          </div>

          {/* Right Controls: 5s/10s selector & Speaker Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {/* Mode Selector (5s vs 10s) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => handleSelectTimeLimit(5)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  timeLimit === 5
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40 ring-1 ring-rose-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isVi ? 'Thử thách siêu tốc 5 giây' : '5-second extreme mode'}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>5s</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTimeLimit(10)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  timeLimit === 10
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isVi ? 'Thử thách tiêu chuẩn 10 giây' : '10-second standard mode'}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>10s</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title={
                isSpeakerEnabled
                  ? isVi
                    ? 'Âm thanh & Giọng đọc: BẬT'
                    : 'Sound: ON'
                  : isVi
                  ? 'Âm thanh & Giọng đọc: TẮT'
                  : 'Sound: OFF'
              }
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-4 h-4 text-amber-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* 3 Topic Selector Buttons: Multiply by 11, Same Tens & Units sum = 10, General 2D × 2D */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          {CHALLENGE_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleSelectTopic(topic.id)}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                selectedTopic === topic.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="text-base">{topic.icon}</span>
              <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Real-time Stats Scoreboard Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Score */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                {isVi ? 'Điểm số' : 'Score'}
              </span>
              <span className="text-lg font-black text-white font-mono">{score}</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                {isVi ? 'Chuỗi đúng' : 'Streak'}
              </span>
              <span className="text-lg font-black text-rose-400 font-mono">
                {streak} {streak >= 3 && '🔥'}
              </span>
            </div>
          </div>

          {/* Best Streak */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                {isVi ? 'Kỷ lục chuỗi' : 'Best Streak'}
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">{bestStreak}</span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                {isVi ? 'Độ chính xác' : 'Accuracy'}
              </span>
              <span className="text-lg font-black text-sky-400 font-mono">
                {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Central Problem & Dynamic Countdown Timer Card */}
        <div className="max-w-xl mx-auto space-y-4">
          <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-inner relative overflow-hidden">
            {/* Top Timer Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
              <div
                className={`h-full transition-all duration-200 ease-linear ${
                  isUrgent
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : timeLimit === 5
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${gameStatus === 'idle' ? 100 : timerPercentage}%` }}
              />
            </div>

            {/* Topic Badge */}
            <div className="flex items-center justify-center mb-1.5 mt-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isUrgent && gameStatus === 'running'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                <Timer className={`w-3.5 h-3.5 ${isUrgent && gameStatus === 'running' ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="font-mono text-sm">
                  {gameStatus === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}
                </span>
                <span className="text-slate-500 font-normal">
                  ({timeLimit === 5 ? (isVi ? 'Siêu tốc' : 'Extreme') : (isVi ? 'Tốc độ' : 'Speed')})
                </span>
              </span>
            </div>

            {/* Math Formula Display (Nhân 2 chữ số tổng quát) with Speaker Button & Speed Selector */}
            <div className="flex flex-col items-center justify-center gap-3 py-3">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className="text-5xl sm:text-7xl font-black text-white tracking-wide font-mono flex items-center gap-3">
                  <span>{question.a}</span>
                  <span className="text-amber-400 font-sans">×</span>
                  <span>{question.b}</span>
                </div>

                {/* Button Loa để phát thông tin câu hỏi */}
                <button
                  type="button"
                  onClick={() => pronounceQuestion()}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                    isSpeakingQuestion
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/30 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
                  }`}
                  title={
                    isVi
                      ? `Phát âm câu hỏi (${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}) - Tốc độ ${questionSpeed}x`
                      : `Pronounce question (${question.a} times ${question.b}) - Speed ${questionSpeed}x`
                  }
                  aria-label="Phát âm câu hỏi"
                >
                  <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Tùy chỉnh tốc độ loa phát câu hỏi (1x, 1.25x, 1.5x, 1.75x) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isVi ? 'Tốc độ loa:' : 'Voice Speed:'}</span>
                </span>
                <div className="flex items-center gap-1 ml-0.5">
                  {[1.0, 1.25, 1.5, 1.75].map((s) => (
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
                      {s === 1.0 ? '1x' : `${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Immediate Result Feedback Badge */}
            {feedback === 'correct' && (
              <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer})`
                    : `Correct: ${getSpelledOutDigits(question.answer, false)} (${question.answer})`}
                </span>
              </div>
            )}

            {feedback === 'incorrect' && (
              <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer})`
                    : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${question.answer})`}
                </span>
              </div>
            )}

            {feedback === 'timeout' && (
              <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {isVi
                    ? `Hết giờ!: ${getSpelledOutDigits(question.answer, true)} (${question.answer})`
                    : `Time's up!: ${getSpelledOutDigits(question.answer, false)} (${question.answer})`}
                </span>
              </div>
            )}
          </div>

          {/* Answer Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  gameStatus === 'idle'
                    ? isVi
                      ? 'Bấm "Bắt đầu thử thách" để đếm ngược...'
                      : 'Click "Start Challenge" to begin...'
                    : isListening
                    ? isVi
                      ? '🎙️ Đang nghe... Hãy đọc to đáp án của bạn'
                      : '🎙️ Listening... Speak your answer'
                    : isVi
                    ? 'Nhập kết quả hoặc bấm phím số...'
                    : 'Type answer or tap numeric keys...'
                }
                disabled={gameStatus !== 'running'}
                className={`w-full h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                    : isUrgent && gameStatus === 'running'
                    ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                    : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
              />
              {userAnswer && gameStatus === 'running' && (
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

            {/* Bàn phím số từ 0 đến 9 nhập kết quả nhanh trong Thử thách */}
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-sm mx-auto w-full">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={gameStatus !== 'running'}
                    className="h-11 sm:h-12 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-xl sm:text-2xl font-black border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Xóa toàn bộ */}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  disabled={gameStatus !== 'running' || !userAnswer}
                  className="h-11 sm:h-12 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                {/* Phím 0 */}
                <button
                  type="button"
                  onClick={() => handleKeypadDigit('0')}
                  disabled={gameStatus !== 'running'}
                  className="h-11 sm:h-12 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-xl sm:text-2xl font-black border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  aria-label="Digit 0"
                >
                  0
                </button>

                {/* Xóa 1 số lùi */}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={gameStatus !== 'running' || !userAnswer}
                  className="h-11 sm:h-12 rounded-xl bg-slate-900/60 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa 1 số' : 'Backspace'}
                  aria-label="Backspace"
                >
                  <Delete className="w-5 h-5 text-slate-400 hover:text-amber-300" />
                </button>
              </div>
            </div>

            {/* Live voice feedback indicator when listening */}
            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="truncate">
                  {voiceTranscript
                    ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                    : isVi
                    ? '🎙️ Hãy đọc to đáp án (VD: "tám năm tám", "792",...)'
                    : '🎙️ Speak answer aloud (e.g. "eight five eight", "792",...)'}
                </span>
              </div>
            )}

            {/* Error banner if microphone access is blocked */}
            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="flex-1 font-semibold">{voiceError}</p>
              </div>
            )}

            {/* Action Buttons: Start / Submit / Next / Voice */}
            <div className="flex items-center gap-2.5">
              {gameStatus === 'idle' ? (
                <button
                  type="button"
                  onClick={() => startNextRound()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 text-xs sm:text-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isVi ? `Bắt đầu thử thách (${timeLimit}s)` : `Start Challenge (${timeLimit}s)`}</span>
                </button>
              ) : gameStatus === 'answered' ? (
                <button
                  type="button"
                  onClick={() => startNextRound()}
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
                  <span>{isVi ? 'Xác nhận kết quả' : 'Submit Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Trả lời bằng Voice button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={gameStatus !== 'running'}
                title={isVi ? 'Trả lời bằng giọng nói' : 'Answer by voice'}
                className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
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
                    <span>Voice</span>
                  </>
                )}
              </button>

              {/* Reset Session button */}
              <button
                type="button"
                onClick={handleReset}
                title={isVi ? 'Thiết lập lại thử thách' : 'Reset challenge'}
                className="h-12 w-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
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

export const MentalMathChallengePage = TwoDigitMentalMathChallengePage;
