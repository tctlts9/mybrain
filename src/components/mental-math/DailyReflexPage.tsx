import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Gauge,
  Delete,
  Sparkles,
  Sliders,
  Flame,
  Target,
  Timer,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  DAILY_REFLEX_MODES,
  DailyReflexDifficulty,
  DailyReflexMode,
  DailyReflexQuestion,
  DailyReflexStats,
  REFLEX_OPERATIONS,
  ReflexOperation,
  generateDailyReflexQuestion,
  getDailyReflexStats,
  recordDailyReflexAttempt,
  subscribeDailyReflexStats,
  updateDailyReflexGoal,
} from '../../utils/dailyReflexOperations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';
import {
  isChallengeButtonVisible,
  isDifficultLevelChallengeButtonVisible,
} from '../../config/buttonVisibility';
import {
  useMentalMathAutoNextConfig,
  formatAutoNextDelay,
} from '../../config/mentalMathAutoNext';
import { AutoNextSettingButton } from './AutoNextSettingButton';
import { DailyReflexQuestionDisplay } from './DailyReflexQuestionDisplay';
import { QuickReflexPanel } from './QuickReflexPanel';

interface DailyReflexPageProps {
  onBack: () => void;
  onOpenChallenge?: (mode?: DailyReflexMode) => void;
  onOpenHardChallenge?: (mode?: DailyReflexMode) => void;
  initialMode?: DailyReflexMode;
}

const DEFAULT_CUSTOM_OPS: ReflexOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const DAILY_GOAL_OPTIONS = [15, 20, 30, 50];
const PACE_OPTIONS = [0, 5, 8, 12]; // 0 = Free stopwatch, >0 = Target reflex countdown

export const DailyReflexPage: React.FC<DailyReflexPageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenHardChallenge,
  initialMode,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('DailyReflexPage');
  const autoNextTimerRef = useRef<number | null>(null);

  const [selectedMode, setSelectedMode] = useState<DailyReflexMode>(
    initialMode || 'dailyMix'
  );
  const [difficulty, setDifficulty] = useState<DailyReflexDifficulty>('normal');
  const [isQuickReflexActive, setIsQuickReflexActive] = useState<boolean>(true);
  const [customOps, setCustomOps] = useState<ReflexOperation[]>(DEFAULT_CUSTOM_OPS);
  const [targetPaceSec, setTargetPaceSec] = useState<number>(0);

  const [question, setQuestion] = useState<DailyReflexQuestion>(() =>
    generateDailyReflexQuestion(
      initialMode || 'dailyMix',
      'normal',
      DEFAULT_CUSTOM_OPS
    )
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [sessionStreak, setSessionStreak] = useState<number>(0);

  // Reaction timer state (ms)
  const questionStartRef = useRef<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [paceExpired, setPaceExpired] = useState<boolean>(false);

  // Persistent daily stats
  const [dailyStats, setDailyStats] = useState<DailyReflexStats>(() =>
    getDailyReflexStats()
  );

  // Audio & voice state
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved && [1.25, 1.5, 1.75].includes(parseFloat(saved))) {
        return parseFloat(saved);
      }
    }
    return 1.25;
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const questionRef = useRef<DailyReflexQuestion>(question);
  const recordedCurrentRef = useRef<boolean>(false);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    const sync = () => setDailyStats(getDailyReflexStats());
    sync();
    return subscribeDailyReflexStats(sync);
  }, []);

  // Live reaction stopwatch while question is unanswered
  useEffect(() => {
    if (feedback === 'correct' || isQuickReflexActive) return;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - questionStartRef.current;
      setElapsedMs(elapsed);
      if (targetPaceSec > 0 && elapsed >= targetPaceSec * 1000) {
        setPaceExpired(true);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [feedback, targetPaceSec, question, isQuickReflexActive]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
      stopListening();
    };
  }, [stopListening]);

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = isVi
        ? questionRef.current.spokenVi
        : questionRef.current.spokenEn;
      setIsSpeakingQuestion(true);
      speakText(
        text,
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        Math.min(1.5, activeSpeed * 0.85)
      );
    },
    [isVi, questionSpeed]
  );

  const handleSetSpeed = (newSpeed: number) => {
    setQuestionSpeed(newSpeed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mental_math_question_speed', String(newSpeed));
    }
    if (isSpeakingQuestion) pronounceQuestion(newSpeed);
  };

  const generateNewQuestion = useCallback(
    (
      modeOverride?: DailyReflexMode,
      diffOverride?: DailyReflexDifficulty,
      opsOverride?: ReflexOperation[]
    ) => {
      const activeMode = modeOverride ?? selectedMode;
      const activeDiff = diffOverride ?? difficulty;
      const activeOps = opsOverride ?? customOps;
      setQuestion(generateDailyReflexQuestion(activeMode, activeDiff, activeOps));
      setUserAnswer('');
      setFeedback('idle');
      setLastReactionMs(null);
      setElapsedMs(0);
      setPaceExpired(false);
      recordedCurrentRef.current = false;
      questionStartRef.current = Date.now();
      setVoiceTranscript('');
      setVoiceError('');
      stopCurrentSpeech();
      setIsSpeakingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [selectedMode, difficulty, customOps]
  );

  useEffect(() => {
    if (feedback === 'correct' && autoNextConfig.delaySec > 0) {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = window.setTimeout(() => {
        autoNextTimerRef.current = null;
        generateNewQuestion();
      }, Math.round(autoNextConfig.delaySec * 1000));
    } else if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [feedback, autoNextConfig.delaySec, generateNewQuestion]);

  const triggerAnnouncement = useCallback(
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  const verifyAnswer = useCallback(
    (rawVal: string) => {
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      const reactionMs = Date.now() - questionStartRef.current;

      if (parsed === questionRef.current.answer) {
        setFeedback('correct');
        setLastReactionMs(reactionMs);
        setSessionStreak((s) => s + 1);
        if (!recordedCurrentRef.current) {
          recordedCurrentRef.current = true;
          const nextStats = recordDailyReflexAttempt(true, reactionMs);
          setDailyStats(nextStats);
        }
        stopListening();
        if (isSpeakerEnabled) {
          triggerAnnouncement(true, questionRef.current.answer);
        }
      } else {
        setFeedback('incorrect');
        setSessionStreak(0);
        if (!recordedCurrentRef.current) {
          recordedCurrentRef.current = true;
          const nextStats = recordDailyReflexAttempt(false, reactionMs);
          setDailyStats(nextStats);
        }
        if (isSpeakerEnabled) {
          triggerAnnouncement(false, questionRef.current.answer);
        }
      }
    },
    [isSpeakerEnabled, stopListening, triggerAnnouncement]
  );

  const replayAnnouncement = () => {
    if (feedback === 'idle') return;
    triggerAnnouncement(feedback === 'correct', question.answer);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.'
          : 'Voice recognition is not supported in this browser.'
      );
      return;
    }
    stopCurrentSpeech();
    setVoiceError('');
    setVoiceTranscript('');
    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript || '';
        setVoiceTranscript(transcript);
        const parsed = parseVoiceNumber(transcript, isVi ? 'vi' : 'en');
        if (parsed !== null) {
          setUserAnswer(String(parsed));
          if (parsed === questionRef.current.answer || res.isFinal) {
            verifyAnswer(String(parsed));
            return;
          }
        }
      }
    };
    recognition.onerror = () => stopListening();
    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          stopListening();
        }
      }
    };
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      stopListening();
    }
  };

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') setFeedback('idle');
      setUserAnswer((prev) => (prev.length >= 14 ? prev : prev + digit));
    },
    [feedback]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (feedback === 'incorrect') setFeedback('idle');
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleKeypadClear = useCallback(() => {
    if (feedback === 'correct') return;
    setUserAnswer('');
    setFeedback('idle');
    inputRef.current?.focus();
  }, [feedback]);

  const toggleCustomOperation = (op: ReflexOperation) => {
    const exists = customOps.includes(op);
    if (exists && customOps.length <= 1) return; // keep at least 1 op active
    const nextOps = exists
      ? customOps.filter((o) => o !== op)
      : [...customOps, op];
    setCustomOps(nextOps);
    if (selectedMode === 'custom') {
      generateNewQuestion('custom', difficulty, nextOps);
    }
  };

  const activeModeObj =
    DAILY_REFLEX_MODES.find((m) => m.id === selectedMode) || DAILY_REFLEX_MODES[0];

  const goalProgressPct = Math.min(
    100,
    Math.round((dailyStats.todayCompleted / Math.max(1, dailyStats.dailyGoal)) * 100)
  );
  const todayAccuracy =
    dailyStats.todayCompleted > 0
      ? Math.round((dailyStats.todayCorrect / dailyStats.todayCompleted) * 100)
      : 0;
  const avgSecStr =
    dailyStats.todayCompleted > 0
      ? (dailyStats.todayTotalMs / dailyStats.todayCompleted / 1000).toFixed(1)
      : '0.0';

  const displayTimeSec =
    targetPaceSec > 0
      ? Math.max(0, targetPaceSec - elapsedMs / 1000).toFixed(1)
      : ((lastReactionMs ?? elapsedMs) / 1000).toFixed(1);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopCurrentSpeech();
            stopListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {isChallengeButtonVisible('DailyReflexPage') && onOpenChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenChallenge(selectedMode);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20 whitespace-nowrap"
              title={isVi ? 'Thử thách phản xạ tốc độ cao' : 'Daily Reflex Challenge'}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
            </button>
          )}

          {isDifficultLevelChallengeButtonVisible('DailyReflexPage') &&
            onOpenHardChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenHardChallenge(selectedMode);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25 whitespace-nowrap"
                title={isVi ? 'Thử thách cấp độ khó' : 'Difficult Level Challenge'}
              >
                <Gauge className="w-3.5 h-3.5 text-white" />
                <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
              </button>
            )}

          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold">
              {isVi ? 'Phản xạ hàng ngày' : 'Daily Reflex'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Training Container */}
      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-yellow-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi
                ? 'Rèn luyện phản xạ tính nhẩm hàng ngày'
                : 'Daily Mental Math Reflex'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isChallengeButtonVisible('DailyReflexPage') && onOpenChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenChallenge(selectedMode);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-xs whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
              </button>
            )}

            {isDifficultLevelChallengeButtonVisible('DailyReflexPage') &&
              onOpenHardChallenge && (
                <button
                  type="button"
                  onClick={() => {
                    stopCurrentSpeech();
                    stopListening();
                    onOpenHardChallenge(selectedMode);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition-all cursor-pointer active:scale-95 text-xs whitespace-nowrap"
                  title={isVi ? 'Thử thách cấp độ khó' : 'Difficult Level Challenge'}
                >
                  <Gauge className="w-3.5 h-3.5 text-white" />
                  <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
                </button>
              )}

            <AutoNextSettingButton pageKey="DailyReflexPage" />

            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                isSpeakerEnabled
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-xs ring-1 ring-yellow-400/20'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800'
              }`}
            >
              {isSpeakerEnabled ? (
                <Volume2
                  className={`w-3.5 h-3.5 text-yellow-400 ${
                    isSpeaking ? 'animate-bounce' : ''
                  }`}
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

        {/* Daily Goal & Reflex Progress Strip */}
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800/90 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Target className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isVi ? 'Mục tiêu hôm nay:' : "Today's Goal:"}</span>
                <span className="font-mono font-bold text-yellow-300 tabular-nums">
                  {dailyStats.todayCompleted}/{dailyStats.dailyGoal}
                </span>
                {dailyStats.todayCompleted >= dailyStats.dailyGoal && (
                  <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" />
                    {isVi ? 'Hoàn thành' : 'Done'}
                  </span>
                )}
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">
                  {isVi ? 'Chuỗi ngày:' : 'Daily streak:'}
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {dailyStats.streakDays} {isVi ? 'ngày' : 'days'}
                </span>
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400">
                  {isVi ? 'Chính xác:' : 'Accuracy:'}
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {todayAccuracy}%
                </span>
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400">
                  {isVi ? 'Tốc độ TB:' : 'Avg pace:'}
                </span>
                <span className="font-mono font-bold text-sky-300 tabular-nums">
                  {avgSecStr}s/{isVi ? 'câu' : 'q'}
                </span>
              </span>
            </div>

            {/* Goal target selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-1.5 whitespace-nowrap">
                {isVi ? 'Chỉ tiêu:' : 'Goal:'}
              </span>
              {DAILY_GOAL_OPTIONS.map((goalVal) => (
                <button
                  key={goalVal}
                  type="button"
                  onClick={() => setDailyStats(updateDailyReflexGoal(goalVal))}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer tabular-nums ${
                    dailyStats.dailyGoal === goalVal
                      ? 'bg-yellow-400 text-slate-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {goalVal}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-300 ${
                goalProgressPct >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-500'
              }`}
              style={{ width: `${goalProgressPct}%` }}
            />
          </div>
        </div>

        {/* Mode Selector & Reflex Controls */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                {isVi
                  ? 'Chọn chế độ phản xạ hàng ngày:'
                  : 'Select daily reflex mode:'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty & Quick Reflex toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickReflexActive(false);
                    if (difficulty !== 'normal') {
                      setDifficulty('normal');
                      generateNewQuestion(selectedMode, 'normal', customOps);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    !isQuickReflexActive && difficulty === 'normal'
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isVi ? 'Tiêu chuẩn' : 'Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickReflexActive(false);
                    if (difficulty !== 'hard') {
                      setDifficulty('hard');
                      generateNewQuestion(selectedMode, 'hard', customOps);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    !isQuickReflexActive && difficulty === 'hard'
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isVi ? 'Nâng cao' : 'Hard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickReflexActive(true);
                    stopCurrentSpeech();
                    stopListening();
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isQuickReflexActive
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isVi ? 'Phản xạ nhanh' : 'Quick Reflex'}
                </button>
              </div>

              {/* Target Pace Selector */}
              {!isQuickReflexActive && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1 whitespace-nowrap">
                    <Timer className="w-3 h-3 text-yellow-400" />
                    <span className="hidden sm:inline">
                      {isVi ? 'Nhịp:' : 'Pace:'}
                    </span>
                  </span>
                  {PACE_OPTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setTargetPaceSec(sec);
                        setPaceExpired(false);
                      }}
                      className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                        targetPaceSec === sec
                          ? 'bg-yellow-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? (isVi ? 'Tự do' : 'Free') : `${sec}s`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isQuickReflexActive && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                {DAILY_REFLEX_MODES.map((modeItem) => (
                  <button
                    key={modeItem.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(modeItem.id);
                      generateNewQuestion(modeItem.id, difficulty, customOps);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                      selectedMode === modeItem.id
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{modeItem.icon}</span>
                    <span className="truncate">
                      {isVi ? modeItem.labelVi : modeItem.labelEn}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom operation toggles when Custom mode is active */}
              {selectedMode === 'custom' && (
                <div className="p-2 bg-slate-950/75 rounded-2xl border border-yellow-500/25 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 px-1.5">
                    {isVi ? 'Phép tính bật:' : 'Active ops:'}
                  </span>
                  {REFLEX_OPERATIONS.map((op) => {
                    const active = customOps.includes(op.id);
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => toggleCustomOperation(op.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          active
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/60'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <span className="font-mono font-bold">{op.symbol}</span>
                        <span>{isVi ? op.labelVi : op.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {isQuickReflexActive ? (
          <QuickReflexPanel isVi={isVi} isSpeakerEnabled={isSpeakerEnabled} />
        ) : (
        /* Side-by-Side Arena */
        <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
          {/* Left: Question Display */}
          <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs mb-2">
              <span className="text-yellow-400 font-semibold">
                {isVi ? question.opLabelVi : question.opLabelEn}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-400">
                {isVi ? activeModeObj.labelVi : activeModeObj.labelEn}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span
                className={`font-mono font-bold tabular-nums inline-flex items-center gap-1 ${
                  paceExpired && feedback !== 'correct'
                    ? 'text-rose-400'
                    : feedback === 'correct'
                    ? 'text-emerald-400'
                    : 'text-sky-300'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{displayTimeSec}s</span>
              </span>
              {sessionStreak >= 2 && (
                <>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-amber-300 font-semibold tabular-nums">
                    {isVi ? `Chuỗi ${sessionStreak}` : `Streak ${sessionStreak}`}
                  </span>
                </>
              )}
            </div>

            <DailyReflexQuestionDisplay
              question={question}
              isVi={isVi}
              isSpeakingQuestion={isSpeakingQuestion}
              questionSpeed={questionSpeed}
              onPronounce={() => pronounceQuestion()}
              onSetSpeed={handleSetSpeed}
            />

            {feedback !== 'idle' && (
              <div className="mt-3 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                <span className="font-bold text-yellow-400 mr-1.5">
                  {isVi ? 'Mẹo tính nhẩm:' : 'Method:'}
                </span>
                {isVi ? question.hintVi : question.hintEn}
              </div>
            )}

            {feedback === 'correct' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                    : `Correct: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                  {lastReactionMs !== null &&
                    ` (${(lastReactionMs / 1000).toFixed(1)}s)`}
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
                    ? `Chưa chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                    : `Incorrect: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
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

          {/* Right: Input & Keypad */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (feedback === 'correct') generateNewQuestion();
              else verifyAnswer(userAnswer);
            }}
            className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={
                  isListening
                    ? isVi
                      ? 'Đang nghe... Hãy đọc to đáp án của bạn'
                      : 'Listening... Speak your answer aloud'
                    : isVi
                    ? 'Nhập kết quả hoặc bấm phím số bên dưới...'
                    : 'Type answer or tap numeric keys below...'
                }
                disabled={feedback === 'correct'}
                className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                    : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                }`}
              />
              {question.answerSuffix && (
                <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 pointer-events-none select-none">
                  {question.answerSuffix}
                </span>
              )}
              {userAnswer && feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isVi ? 'Xóa ô nhập' : 'Clear'}
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {[7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleKeypadClear}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa 1 số' : 'Backspace'}
                  aria-label="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                <span className="truncate">
                  {voiceTranscript
                    ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                    : isVi
                    ? 'Đang lắng nghe: Hãy đọc to đáp án của bạn'
                    : 'Listening: Speak your answer aloud'}
                </span>
              </div>
            )}

            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="flex-1 font-semibold leading-relaxed">{voiceError}</p>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              {feedback === 'correct' ? (
                <button
                  type="button"
                  onClick={() => generateNewQuestion()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                >
                  <span>
                    {autoNextConfig.delaySec > 0
                      ? isVi
                        ? `Câu tiếp theo - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                        : `Next Problem - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                      : isVi
                      ? 'Câu tiếp theo'
                      : 'Next Problem'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Kết quả' : 'Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

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
                    ? 'Bấm để trả lời bằng giọng nói'
                    : 'Answer by voice'
                }
                className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>{isVi ? 'Đang nghe...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-yellow-400" />
                    <span>{isVi ? 'Trả lời' : 'Voice'}</span>
                  </>
                )}
              </button>

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
        )}
      </div>
    </div>
  );
};
