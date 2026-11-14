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

type TimeLimit = 3 | 5 | 10;
type GameStatus = 'idle' | 'running' | 'paused' | 'answered' | 'completed';

const TOTAL_QUESTIONS = 10;

interface RoundHistoryItem {
  qIndex: number;
  a: number;
  b: number;
  userAnswer: string;
  isCorrect: boolean;
}

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

  // 10 Phép nhân trong 1 lượt thử thách
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

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

  // Thống kê: Chuỗi đúng, Chuỗi sai, Độ chính xác
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);

  // Sound & Voice
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

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const questionRef = useRef<Question>(question);
  questionRef.current = question;
  const autoNextTimerRef = useRef<any>(null);

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

      const isCorrect = parsedAns === questionRef.current.answer;
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          userAnswer: String(parsedAns),
          isCorrect,
        },
      ]);

      if (isCorrect) {
        setFeedback('correct');
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setWrongStreak(0);
        const pointsAwarded = timeLimit === 3 ? 30 : timeLimit === 5 ? 20 : 10;
        setScore((prev) => prev + pointsAwarded);
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        setIncorrectCount((prev) => prev + 1);
        setStreak(0);
        setWrongStreak((prev) => prev + 1);
        announceResult(false, questionRef.current.answer);
      }
    },
    [clearCountdown, timeLimit, announceResult, currentQuestionIndex]
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
    setIncorrectCount((prev) => prev + 1);
    setFeedback('timeout');
    setStreak(0);
    setWrongStreak((prev) => prev + 1);

    setRoundHistory((prev) => [
      ...prev,
      {
        qIndex: currentQuestionIndex,
        a: questionRef.current.a,
        b: questionRef.current.b,
        userAnswer: isVi ? 'Hết giờ' : 'Timeout',
        isCorrect: false,
      },
    ]);

    announceResult(false, questionRef.current.answer);
  }, [clearCountdown, announceResult, currentQuestionIndex, isVi]);

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

  // Bắt đầu đợt thử thách 10 phép nhân
  const startChallengeSession = useCallback(
    (explicitTimeLimit?: TimeLimit, explicitTopic?: ChallengeTopic) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      stopCurrentSpeech();
      clearCountdown();

      const activeLimit = explicitTimeLimit ?? timeLimit;
      const activeTopic = explicitTopic ?? selectedTopic;
      const newQ = generateProblemForTopic(activeTopic);

      setCurrentQuestionIndex(1);
      setRoundHistory([]);
      setStreak(0);
      setWrongStreak(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setScore(0);

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

  // Chuyển sang câu tiếp theo trong 10 câu
  const goToNextQuestion = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    clearCountdown();

    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
      setGameStatus('completed');
      return;
    }

    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);

    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setGameStatus('running');

    startCountdown(timeLimit);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [currentQuestionIndex, generateProblemForTopic, selectedTopic, clearCountdown, startCountdown, timeLimit]);

  // Tự động chuyển câu hỏi sau 3 giây khi có kết quả (chính xác / chưa chính xác / hết giờ)
  useEffect(() => {
    if (gameStatus === 'answered') {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = setTimeout(() => {
        goToNextQuestion();
      }, 3000);
    } else {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    }

    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [gameStatus, goToNextQuestion]);

  // Switch Time Limit (3s / 5s / 10s)
  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setTimeLimit(newLimit);
    setTimeLeft(newLimit);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(newLimit);
    }
  };

  // Switch Topic: Multiply by 11 | Same Tens & Units sum = 10 | General 2D × 2D
  const handleSelectTopic = (newTopic: ChallengeTopic) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setSelectedTopic(newTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(undefined, newTopic);
    } else {
      const newQ = generateProblemForTopic(newTopic);
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Reset Session
  const handleReset = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    clearCountdown();
    setGameStatus('idle');
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
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
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
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
  const isUrgent = timeLeft <= (timeLimit === 3 ? 1 : timeLimit === 5 ? 2 : 3);

  const currentTopicMeta =
    CHALLENGE_TOPICS.find((t) => t.id === selectedTopic) || CHALLENGE_TOPICS[2];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back & Title */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
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
      <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-amber-950/30 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Title, Mode Toggles & Sound */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
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

          {/* Right Controls: 3s/5s/10s selector & Speaker Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {/* Mode Selector (3s, 5s, 10s) */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{isVi ? 'Thời gian:' : 'Timer:'}</span>
              </span>
              {[3, 5, 10].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTimeLimit(t as TimeLimit)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    timeLimit === t
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isVi ? `Thử thách ${t} giây` : `${t}-second mode`}
                >
                  {t}s
                </button>
              ))}
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

        {/* Real-time Stats Scoreboard Row: Chuỗi đúng & Chuỗi sai */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* 1. Chuỗi đúng */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider truncate">
                {isVi ? 'Chuỗi đúng:' : 'Streak:'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {streak} {streak >= 3 && '🔥'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                ({isVi ? `Đúng: ${correctCount}` : `Correct: ${correctCount}`})
              </span>
            </div>
          </div>

          {/* 2. Chuỗi sai */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider truncate">
                {isVi ? 'Chuỗi sai:' : 'Wrong Streak:'}
              </span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
                {wrongStreak}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                ({isVi ? `Sai: ${incorrectCount}` : `Wrong: ${incorrectCount}`})
              </span>
            </div>
          </div>
        </div>


        {/* Central Problem & Dynamic Countdown Timer Card OR Completed View */}
        <div className="w-full space-y-3">
          {gameStatus === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                {isVi ? 'Hoàn thành thử thách 10 phép nhân!' : '10-Problem Challenge Completed!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {isVi
                  ? `Chuyên đề: ${currentTopicMeta.labelVi} • Thời gian: ${timeLimit}s / phép tính`
                  : `Topic: ${currentTopicMeta.labelEn} • Time limit: ${timeLimit}s / problem`}
              </p>

              {/* Thống kê 3 chỉ số Đúng, Sai, % Độ chính xác */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {isVi ? 'Đúng' : 'Correct'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    {correctCount}
                  </span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    {isVi ? 'Sai' : 'Incorrect'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
                    {incorrectCount}
                  </span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    {isVi ? '% Độ chính xác' : 'Accuracy'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">
                    {Math.round((correctCount / TOTAL_QUESTIONS) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-500/80 block mt-0.5">
                    {correctCount >= 8 ? (isVi ? 'Xuất sắc! 🌟' : 'Great! 🌟') : (isVi ? 'Cần luyện thêm' : 'Keep practicing')}
                  </span>
                </div>
              </div>

              {/* Chi tiết từng câu trong 10 câu */}
              {roundHistory.length > 0 && (
                <div className="max-w-lg mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{isVi ? 'Chi tiết 10 phép nhân' : 'Problem Breakdown'}</span>
                    <span>{isVi ? 'Kết quả' : 'Result'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {roundHistory.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium">
                          #{item.qIndex}: {item.a} × {item.b}
                        </span>
                        <span className="font-bold font-mono">
                          {item.isCorrect ? '✓' : `✗ (${item.a * item.b})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => startChallengeSession()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isVi ? 'Bắt đầu thử thách mới (10 câu)' : 'Start New Challenge (10 Problems)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCurrentSpeech();
                    clearCountdown();
                    onBack();
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                >
                  <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
              <div className="lg:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-5 sm:p-7 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
            {/* Top Timer Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
              <div
                className={`h-full transition-all duration-200 ease-linear ${
                  isUrgent
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : timeLimit === 3
                    ? 'bg-purple-400'
                    : timeLimit === 5
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${gameStatus === 'idle' ? 100 : timerPercentage}%` }}
              />
            </div>

            {/* Badges: Topic, Question Progress 10/10, and Countdown */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25">
                <span>{isVi ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS}` : `Problem ${currentQuestionIndex}/${TOTAL_QUESTIONS}`}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                  isUrgent && gameStatus === 'running'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                <Timer className={`w-3 h-3 ${isUrgent && gameStatus === 'running' ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="font-mono">
                  {gameStatus === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}
                </span>
              </span>
            </div>

            {/* 10 Phép nhân mini-tracker dots */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-xs mx-auto mb-3 px-2">
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                const qNum = idx + 1;
                const record = roundHistory[idx];
                let bg = 'bg-slate-800 border-slate-700/60';
                if (record) {
                  bg = record.isCorrect
                    ? 'bg-emerald-500 border-emerald-400 shadow-xs shadow-emerald-500/40'
                    : 'bg-rose-500 border-rose-400 shadow-xs shadow-rose-500/40';
                } else if (qNum === currentQuestionIndex && (gameStatus === 'running' || gameStatus === 'answered')) {
                  bg = 'bg-amber-400 border-amber-300 animate-pulse';
                }
                return (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full border transition-all duration-300 ${bg}`}
                    title={isVi ? `Câu ${qNum}` : `Problem ${qNum}`}
                  />
                );
              })}
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
          <form onSubmit={handleSubmit} className="lg:col-span-6 flex flex-col justify-center space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
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
                className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
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

            {/* Bàn phím số từ 0 đến 9 nhập kết quả nhanh trong Thử thách - 2 hàng 6 cột nhỏ gọn */}
            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md lg:max-w-none mx-auto w-full">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {/* Hàng 1: 1, 2, 3, 4, 5, 6 */}
                {[1, 2, 3, 4, 5, 6].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={gameStatus !== 'running'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                    disabled={gameStatus !== 'running'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                {/* Xóa 1 số lùi */}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={gameStatus !== 'running' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                  onClick={() => startChallengeSession()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 text-xs sm:text-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isVi ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} phép nhân)` : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}</span>
                </button>
              ) : gameStatus === 'answered' ? (
                currentQuestionIndex < TOTAL_QUESTIONS ? (
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>{isVi ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - tự chuyển sau 3s` : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - auto in 3s`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (autoNextTimerRef.current) {
                        clearTimeout(autoNextTimerRef.current);
                        autoNextTimerRef.current = null;
                      }
                      setGameStatus('completed');
                    }}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{isVi ? 'Xem kết quả thử thách (tự chuyển sau 3s)' : 'View Results (auto in 3s)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
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
      )}
    </div>
  </div>
</div>
  );
};

export const MentalMathChallengePage = TwoDigitMentalMathChallengePage;
