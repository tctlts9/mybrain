import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Timer,
  Flame,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Delete,
  Mic,
  MicOff,
  Gauge,
  AlertTriangle,
  EyeOff,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DifficultyTimerInputs } from './DifficultyTimerInputs';
import {
  useMentalMathAutoNextConfig,
  formatAutoNextDelay,
} from '../../config/mentalMathAutoNext';
import { AutoNextSettingButton } from './AutoNextSettingButton';
import {
  DAILY_REFLEX_MODES,
  DailyReflexMode,
  DailyReflexQuestion,
  generateDailyReflexQuestion,
  recordDailyReflexAttempt,
} from '../../utils/dailyReflexOperations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';
import { DailyReflexQuestionDisplay } from './DailyReflexQuestionDisplay';

interface DailyReflexDifficultyChallengePageProps {
  initialMode?: DailyReflexMode;
  onBack: () => void;
}

type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';
const TOTAL_QUESTIONS = 10;

interface HistoryItem {
  qIndex: number;
  label: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export const DailyReflexDifficultyChallengePage: React.FC<
  DailyReflexDifficultyChallengePageProps
> = ({ initialMode = 'dailyMix', onBack }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig(
    'DailyReflexDifficultyChallengePage'
  );

  const [selectedMode, setSelectedMode] = useState<DailyReflexMode>(
    initialMode === 'custom' ? 'dailyMix' : initialMode
  );
  const [timeLimit, setTimeLimit] = useState<number>(6);
  const [answerTimeLimit, setAnswerTimeLimit] = useState<number>(20);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<DailyReflexQuestion>(() =>
    generateDailyReflexQuestion(
      initialMode === 'custom' ? 'dailyMix' : initialMode,
      'hard'
    )
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(6);
  const [feedback, setFeedback] = useState<
    'idle' | 'correct' | 'incorrect' | 'timeout'
  >('idle');
  const [score, setScore] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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
  const timerRef = useRef<number | null>(null);
  const autoNextRef = useRef<number | null>(null);
  const autoNextDelayRef = useRef<number>(autoNextConfig.delaySec);
  autoNextDelayRef.current = autoNextConfig.delaySec;
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const questionRef = useRef<DailyReflexQuestion>(question);
  const statusRef = useRef<GameStatus>(status);
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  const answerTimeLimitRef = useRef<number>(answerTimeLimit);
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    challengePhaseRef.current = challengePhase;
  }, [challengePhase]);

  useEffect(() => {
    answerTimeLimitRef.current = answerTimeLimit;
  }, [answerTimeLimit]);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoNextRef.current !== null) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
  }, []);

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
      clearTimers();
      stopCurrentSpeech();
      stopListening();
    };
  }, [clearTimers, stopListening]);

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

  const triggerAnnouncement = useCallback(
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  const enterAnswerPhase = useCallback(
    (
      qIdx: number,
      modeOverride: DailyReflexMode,
      observeSec: number,
      ansSec: number,
      advanceFn: (n: number, m: DailyReflexMode, o: number, a: number) => void
    ) => {
      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(ansSec);
      setTimeout(() => inputRef.current?.focus(), 50);

      clearTimers();
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimers();
            stopListening();
            const qCur = questionRef.current;
            recordDailyReflexAttempt(false, (observeSec + ansSec) * 1000);
            setStatus('answered');
            statusRef.current = 'answered';
            setFeedback('timeout');
            setIncorrectCount((c) => c + 1);
            setStreak(0);
            setWrongStreak((w) => w + 1);
            setHistory((h) => [
              ...h,
              {
                qIndex: qIdx,
                label: isVi ? qCur.labelVi : qCur.labelEn,
                userAnswer: '—',
                correctAnswer: `${qCur.answer.toLocaleString()}${qCur.answerSuffix || ''}`,
                isCorrect: false,
              },
            ]);
            if (isSpeakerEnabled) {
              triggerAnnouncement(false, qCur.answer);
            }
            const delayMs = Math.round(autoNextDelayRef.current * 1000);
            if (delayMs > 0) {
              autoNextRef.current = window.setTimeout(() => {
                advanceFn(qIdx + 1, modeOverride, observeSec, ansSec);
              }, delayMs);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimers, isSpeakerEnabled, isVi, stopListening, triggerAnnouncement]
  );

  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      modeOverride: DailyReflexMode,
      observeSec: number,
      ansSec: number
    ) => {
      if (nextIdx > TOTAL_QUESTIONS) {
        clearTimers();
        stopListening();
        setChallengePhase('idle');
        challengePhaseRef.current = 'idle';
        setStatus('completed');
        statusRef.current = 'completed';
        return;
      }

      const nextQ = generateDailyReflexQuestion(modeOverride, 'hard');
      setQuestionIndex(nextIdx);
      setQuestion(nextQ);
      questionRef.current = nextQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setChallengePhase('observing');
      challengePhaseRef.current = 'observing';
      setTimeLeft(observeSec);
      questionStartRef.current = Date.now();
      setStatus('running');
      statusRef.current = 'running';

      clearTimers();
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            enterAnswerPhase(
              nextIdx,
              modeOverride,
              observeSec,
              ansSec,
              advanceQuestion
            );
            return ansSec;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimers, enterAnswerPhase, stopListening]
  );

  const startChallenge = () => {
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, selectedMode, timeLimit, answerTimeLimit);
  };

  const verifyAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running') return;
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      clearTimers();
      stopListening();

      const qCur = questionRef.current;
      const isCorrect = parsed === qCur.answer;
      const reactionMs = Date.now() - questionStartRef.current;

      recordDailyReflexAttempt(isCorrect, reactionMs);
      setStatus('answered');
      statusRef.current = 'answered';
      setFeedback(isCorrect ? 'correct' : 'incorrect');

      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((st) => st + 1);
        setWrongStreak(0);
      } else {
        setIncorrectCount((c) => c + 1);
        setStreak(0);
        setWrongStreak((w) => w + 1);
      }

      setHistory((h) => [
        ...h,
        {
          qIndex: questionIndex,
          label: isVi ? qCur.labelVi : qCur.labelEn,
          userAnswer: `${parsed.toLocaleString()}${qCur.answerSuffix || ''}`,
          correctAnswer: `${qCur.answer.toLocaleString()}${qCur.answerSuffix || ''}`,
          isCorrect,
        },
      ]);

      if (isSpeakerEnabled) {
        triggerAnnouncement(isCorrect, qCur.answer);
      }

      const delayMs = Math.round(autoNextDelayRef.current * 1000);
      if (delayMs > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(
            questionIndex + 1,
            selectedMode,
            timeLimit,
            answerTimeLimitRef.current
          );
        }, delayMs);
      }
    },
    [
      advanceQuestion,
      clearTimers,
      isSpeakerEnabled,
      isVi,
      questionIndex,
      selectedMode,
      stopListening,
      timeLimit,
      triggerAnnouncement,
    ]
  );

  const toggleListening = () => {
    if (status !== 'running' || challengePhase !== 'answering') return;
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

  const challengeModes = DAILY_REFLEX_MODES.filter((m) => m.id !== 'custom');
  const currentModeMeta =
    challengeModes.find((m) => m.id === selectedMode) || challengeModes[0];
  const activeMaxTime =
    challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const timerPercentage = Math.max(
    0,
    Math.min(100, (timeLeft / Math.max(1, activeMaxTime)) * 100)
  );
  const isUrgent = timeLeft <= Math.max(2, Math.floor(activeMaxTime * 0.3));
  const canInput = status === 'running' && challengePhase === 'answering';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            clearTimers();
            stopCurrentSpeech();
            stopListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{isVi ? 'Phản xạ hàng ngày' : 'Daily Reflex'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-yellow-400 font-semibold">
            {isVi ? 'Thử thách cấp độ khó' : 'Difficult Level Challenge'}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-yellow-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi
                ? 'Thử Thách Phản Xạ Cấp Độ Khó'
                : 'Daily Reflex Difficult Challenge'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <DifficultyTimerInputs
              timeLimit={timeLimit}
              answerTimeLimit={answerTimeLimit}
              disabled={status === 'running'}
              isVi={isVi}
              limitLabelVi="Quan sát:"
              limitLabelEn="Observe:"
              onChangeTimeLimit={(sec) => {
                setTimeLimit(sec);
                if (status === 'idle') setTimeLeft(sec);
              }}
              onChangeAnswerTimeLimit={(sec) => {
                setAnswerTimeLimit(sec);
                answerTimeLimitRef.current = sec;
              }}
            />

            <AutoNextSettingButton pageKey="DailyReflexDifficultyChallengePage" />

            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-xs'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {isSpeakerEnabled ? (
                <Volume2
                  className={`w-4 h-4 text-yellow-400 ${
                    isSpeaking ? 'animate-bounce' : ''
                  }`}
                />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          {challengeModes.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedMode(m.id);
                if (status === 'idle') {
                  setQuestion(generateDailyReflexQuestion(m.id, 'hard'));
                }
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                selectedMode === m.id
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="text-base">{m.icon}</span>
              <span className="truncate">{isVi ? m.labelVi : m.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Chuỗi đúng:' : 'Streak:'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums">
                {streak}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tabular-nums">
                ({isVi ? `Đúng: ${score}` : `Correct: ${score}`})
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Chuỗi sai:' : 'Wrong Streak:'}
              </span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono tabular-nums">
                {wrongStreak}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tabular-nums">
                ({isVi ? `Sai: ${incorrectCount}` : `Wrong: ${incorrectCount}`})
              </span>
            </div>
          </div>
        </div>

        {/* Arena or Summary */}
        <div className="w-full space-y-3">
          {status === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                  {isVi
                    ? 'Hoàn thành thử thách cấp độ khó!'
                    : 'Difficult Challenge Completed!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {isVi
                    ? `Chế độ: ${currentModeMeta.labelVi} · Quan sát: ${timeLimit}s · Trả lời: ${answerTimeLimit}s`
                    : `Mode: ${currentModeMeta.labelEn} · Observe: ${timeLimit}s · Answer: ${answerTimeLimit}s`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase block mb-1">
                    {isVi ? 'Đúng' : 'Correct'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tabular-nums">
                    {score}
                  </span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5 tabular-nums">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase block mb-1">
                    {isVi ? 'Sai' : 'Incorrect'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono tabular-nums">
                    {incorrectCount}
                  </span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5 tabular-nums">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase block mb-1">
                    {isVi ? 'Độ chính xác' : 'Accuracy'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono tabular-nums">
                    {Math.round((score / TOTAL_QUESTIONS) * 100)}%
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="max-w-lg mx-auto bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium truncate">
                          #{item.qIndex}: {item.label}
                        </span>
                        <span className="font-bold font-mono shrink-0">
                          {item.isCorrect ? '✓' : `✗ (${item.correctAnswer})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={startChallenge}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isVi
                      ? `Bắt đầu thử thách mới (${TOTAL_QUESTIONS} câu)`
                      : `Start New Challenge (${TOTAL_QUESTIONS} Problems)`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearTimers();
                    stopCurrentSpeech();
                    stopListening();
                    onBack();
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                >
                  <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch">
              {/* Left: Question */}
              <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500'
                        : challengePhase === 'answering' && status === 'running'
                        ? 'bg-cyan-400'
                        : 'bg-yellow-400'
                    }`}
                    style={{
                      width: `${status === 'idle' ? 100 : timerPercentage}%`,
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs mb-2 mt-1">
                  <span className="text-yellow-400 font-semibold">
                    {isVi ? question.opLabelVi : question.opLabelEn}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {isVi
                      ? `Câu ${questionIndex}/${TOTAL_QUESTIONS}`
                      : `Problem ${questionIndex}/${TOTAL_QUESTIONS}`}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${
                      isUrgent && status === 'running'
                        ? 'text-rose-400'
                        : challengePhase === 'answering' && status === 'running'
                        ? 'text-cyan-300'
                        : 'text-slate-300'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      {status === 'idle'
                        ? `${timeLimit}s`
                        : status === 'running'
                        ? challengePhase === 'answering'
                          ? `${isVi ? 'Trả lời' : 'Answer'}: ${timeLeft}s`
                          : `${isVi ? 'Quan sát' : 'Observe'}: ${timeLeft}s`
                        : `${timeLeft}s`}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-xs mx-auto mb-3 px-2 w-full">
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                    const qNum = idx + 1;
                    const record = history[idx];
                    let bg = 'bg-slate-800 border-slate-700/60';
                    if (record) {
                      bg = record.isCorrect
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-rose-500 border-rose-400';
                    } else if (
                      qNum === questionIndex &&
                      (status === 'running' || status === 'answered')
                    ) {
                      bg = 'bg-yellow-400 border-yellow-300 animate-pulse';
                    }
                    return (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full border transition-all duration-300 ${bg}`}
                      />
                    );
                  })}
                </div>

                {status === 'idle' ? (
                  <div className="py-5 px-5 rounded-2xl bg-slate-900/75 border border-slate-800/90 flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto my-2">
                    <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Play className="w-5 h-5 fill-sky-400" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {isVi ? 'Chưa bắt đầu thử thách' : 'Challenge Not Started'}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isVi
                        ? 'Bấm nút "Bắt đầu" để quan sát câu hỏi, ghi nhớ rồi trả lời.'
                        : 'Click "Start" to observe, memorize, then answer.'}
                    </p>
                  </div>
                ) : status === 'running' && challengePhase === 'answering' ? (
                  <div className="py-5 px-6 rounded-2xl bg-slate-900/90 border border-cyan-500/35 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                      <EyeOff className="w-5 h-5 text-cyan-400" />
                      <span>
                        {isVi
                          ? 'Đã hết thời gian quan sát'
                          : 'Observation time ended'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isVi
                        ? `Hãy nhớ lại phép tính và nhập đáp án trong ${timeLeft}s`
                        : `Recall the problem and enter your answer within ${timeLeft}s`}
                    </p>
                  </div>
                ) : (
                  <DailyReflexQuestionDisplay
                    question={question}
                    isVi={isVi}
                    isSpeakingQuestion={isSpeakingQuestion}
                    questionSpeed={questionSpeed}
                    onPronounce={() => pronounceQuestion()}
                    onSetSpeed={handleSetSpeed}
                  />
                )}

                {status === 'answered' && (
                  <>
                    <div className="mt-3 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                      <span className="font-bold text-yellow-400 mr-1.5">
                        {isVi ? 'Mẹo tính nhẩm:' : 'Method:'}
                      </span>
                      {isVi ? question.hintVi : question.hintEn}
                    </div>
                    <div
                      className={`mt-3 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold border ${
                        feedback === 'correct'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {feedback === 'correct' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {feedback === 'correct'
                          ? isVi
                            ? `Chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                            : `Correct: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                          : feedback === 'timeout'
                          ? isVi
                            ? `Hết giờ! Đáp án: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                            : `Time's up! Answer: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                          : isVi
                          ? `Chưa chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                          : `Incorrect: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Controls */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canInput) verifyAnswer(userAnswer);
                  else if (status === 'answered')
                    advanceQuestion(
                      questionIndex + 1,
                      selectedMode,
                      timeLimit,
                      answerTimeLimit
                    );
                }}
                className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3"
              >
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    value={userAnswer}
                    onChange={(e) =>
                      setUserAnswer(e.target.value.replace(/[^\d]/g, ''))
                    }
                    placeholder={
                      status === 'idle'
                        ? isVi
                          ? 'Bấm "Bắt đầu" để quan sát đề...'
                          : 'Click "Start" to observe...'
                        : challengePhase === 'observing'
                        ? isVi
                          ? 'Đang quan sát đề...'
                          : 'Observing problem...'
                        : isVi
                        ? 'Nhập đáp án bạn vừa ghi nhớ...'
                        : 'Enter recalled answer...'
                    }
                    disabled={!canInput}
                    className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans focus:outline-none transition-all shadow-inner ${
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
                </div>

                <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
                  <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() =>
                          canInput &&
                          setUserAnswer((prev) =>
                            prev.length >= 14 ? prev : prev + digit
                          )
                        }
                        disabled={!canInput}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    {[7, 8, 9, 0].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() =>
                          canInput &&
                          setUserAnswer((prev) =>
                            prev.length >= 14 ? prev : prev + digit
                          )
                        }
                        disabled={!canInput}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => canInput && setUserAnswer('')}
                      disabled={!canInput || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      {isVi ? 'Xóa' : 'Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        canInput && setUserAnswer((prev) => prev.slice(0, -1))
                      }
                      disabled={!canInput || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-300 border border-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isListening && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300">
                    <span className="truncate">
                      {voiceTranscript || (isVi ? 'Đang lắng nghe...' : 'Listening...')}
                    </span>
                  </div>
                )}

                {voiceError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="flex-1 font-semibold">{voiceError}</p>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  {status === 'idle' ? (
                    <button
                      type="button"
                      onClick={startChallenge}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
                    </button>
                  ) : status === 'running' && challengePhase === 'observing' ? (
                    <button
                      type="button"
                      onClick={() =>
                        enterAnswerPhase(
                          questionIndex,
                          selectedMode,
                          timeLimit,
                          answerTimeLimit,
                          advanceQuestion
                        )
                      }
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <span>
                        {isVi
                          ? `Trả lời ngay (${timeLeft}s)`
                          : `Answer Now (${timeLeft}s)`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : status === 'answered' ? (
                    <button
                      type="button"
                      onClick={() =>
                        advanceQuestion(
                          questionIndex + 1,
                          selectedMode,
                          timeLimit,
                          answerTimeLimit
                        )
                      }
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 text-xs sm:text-sm"
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
                    disabled={!canInput}
                    className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-40 ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700'
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

                  {status !== 'idle' && (
                    <button
                      type="button"
                      onClick={() => {
                        clearTimers();
                        stopListening();
                        setChallengePhase('idle');
                        setStatus('idle');
                        setTimeLeft(timeLimit);
                        setFeedback('idle');
                        setUserAnswer('');
                      }}
                      title={isVi ? 'Đặt lại thử thách' : 'Reset challenge'}
                      className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
