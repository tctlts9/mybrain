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
  Zap,
  Clock,
  Gauge,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isEditTimerButtonVisible } from '../../config/buttonVisibility';
import { useMentalMathTimerConfig } from '../../config/mentalMathTimers';
import {
  useMentalMathAutoNextConfig,
  formatAutoNextDelay,
} from '../../config/mentalMathAutoNext';
import { MentalMathChallengeTimerModal } from './MentalMathChallengeTimerModal';
import { AutoNextSettingButton } from './AutoNextSettingButton';
import {
  OPERATION_META,
  OperationQuestion,
  generateOperationQuestion,
  getOperationSpokenText,
} from '../../utils/arithmeticOperations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';
import { SquareRootTopic, SQUARE_ROOT_TOPICS } from './SquareRootPage';

interface SquareRootChallengePageProps {
  initialTopic?: SquareRootTopic;
  onBack: () => void;
  isHard?: boolean;
}

type TimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';

const TOTAL_QUESTIONS = 10;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  sqrtSmall: '⚡',
  sqrt4Digit: '✨',
  sqrt5Digit: '🚀',
};

interface HistoryItem {
  qIndex: number;
  label: string;
  userAnswer: string;
  correctAnswer: number;
  isCorrect: boolean;
}

export const SquareRootChallengePage: React.FC<SquareRootChallengePageProps> = ({
  initialTopic = 'general',
  onBack,
  isHard = false,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const meta = OPERATION_META['square-root'];
  const hardMode = isHard;
  const difficulty = hardMode ? 'hard' : 'normal';
  const timerConfig = useMentalMathTimerConfig('SquareRootChallengePage');
  const autoNextConfig = useMentalMathAutoNextConfig('SquareRootChallengePage');
  const [selectedTopic, setSelectedTopic] = useState<SquareRootTopic>(initialTopic);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(timerConfig.defaultLimit);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const showEditTimerButton = isEditTimerButtonVisible('SquareRootChallengePage');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<OperationQuestion>(() =>
    generateOperationQuestion('square-root', initialTopic, difficulty)
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerConfig.defaultLimit);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');
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
      if (saved && [1.25, 1.5, 1.75].includes(parseFloat(saved))) return parseFloat(saved);
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
  const questionRef = useRef<OperationQuestion>(question);
  const statusRef = useRef<GameStatus>(status);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (statusRef.current !== 'running') {
      setTimeLimit(timerConfig.defaultLimit);
      setTimeLeft(timerConfig.defaultLimit);
    }
  }, [timerConfig.defaultLimit, timerConfig.limitOptions]);

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

  const formatLabel = (q: OperationQuestion) => `√${q.a.toLocaleString()}`;

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = getOperationSpokenText('square-root', questionRef.current, isVi);
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

  const advanceQuestion = useCallback(
    (nextIdx: number, topicId: SquareRootTopic, limit: TimeLimit) => {
      clearTimers();
      if (nextIdx > TOTAL_QUESTIONS) {
        setStatus('completed');
        stopListening();
        return;
      }
      const nextQ = generateOperationQuestion('square-root', topicId, difficulty);
      setQuestionIndex(nextIdx);
      setQuestion(nextQ);
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setTimeLeft(limit);
      setStatus('running');
      setTimeout(() => inputRef.current?.focus(), 50);

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setStatus('answered');
            setFeedback('timeout');
            setStreak(0);
            setWrongStreak((w) => w + 1);
            setIncorrectCount((inc) => inc + 1);
            setHistory((h) => [
              ...h,
              {
                qIndex: nextIdx,
                label: formatLabel(nextQ),
                userAnswer: isVi ? 'Hết giờ' : 'Timeout',
                correctAnswer: nextQ.answer,
                isCorrect: false,
              },
            ]);
            if (isSpeakerEnabled) {
              triggerAnnouncement(false, nextQ.answer);
            }
            if (autoNextDelayRef.current > 0) {
              autoNextRef.current = window.setTimeout(() => {
                advanceQuestion(nextIdx + 1, topicId, limit);
              }, Math.round(autoNextDelayRef.current * 1000));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimers, difficulty, isSpeakerEnabled, isVi, stopListening, triggerAnnouncement]
  );

  const startChallenge = (topicOverride?: SquareRootTopic, limitOverride?: TimeLimit) => {
    const activeTopic = topicOverride || selectedTopic;
    const activeLimit = limitOverride || timeLimit;
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, activeTopic, activeLimit);
  };

  const handleReset = () => {
    clearTimers();
    stopCurrentSpeech();
    stopListening();
    setStatus('idle');
    setQuestionIndex(1);
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setTimeLeft(timeLimit);
    setQuestion(generateOperationQuestion('square-root', selectedTopic, difficulty));
  };


  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running') return;
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      clearTimers();
      const q = questionRef.current;
      const correct = parsed === q.answer;
      setStatus('answered');
      setFeedback(correct ? 'correct' : 'incorrect');

      if (correct) {
        setScore((s) => s + 1);
        setStreak((prev) => prev + 1);
        setWrongStreak(0);
        if (isSpeakerEnabled) triggerAnnouncement(true, q.answer);
      } else {
        setIncorrectCount((inc) => inc + 1);
        setStreak(0);
        setWrongStreak((w) => w + 1);
        if (isSpeakerEnabled) triggerAnnouncement(false, q.answer);
      }

      setHistory((prev) => [
        ...prev,
        {
          qIndex: questionIndex,
          label: formatLabel(q),
          userAnswer: String(parsed),
          correctAnswer: q.answer,
          isCorrect: correct,
        },
      ]);

      if (autoNextDelayRef.current > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(questionIndex + 1, selectedTopic, timeLimit);
        }, Math.round(autoNextDelayRef.current * 1000));
      }
    },
    [advanceQuestion, clearTimers, isSpeakerEnabled, questionIndex, selectedTopic, timeLimit, triggerAnnouncement]
  );

  const toggleVoice = () => {
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
        if (parsed !== null && statusRef.current === 'running') {
          setUserAnswer(String(parsed));
          if (parsed === questionRef.current.answer || res.isFinal) {
            submitAnswer(String(parsed));
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

  const currentTopicMeta =
    SQUARE_ROOT_TOPICS.find((tItem) => tItem.id === selectedTopic) || SQUARE_ROOT_TOPICS[0];
  const isUrgent = timeLeft <= (timeLimit <= 4 ? 1 : timeLimit <= 8 ? 2 : 3);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
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

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => {
              clearTimers();
              stopCurrentSpeech();
              stopListening();
              onBack();
            }}
            className="hover:text-yellow-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
          >
            {isVi ? 'Luyện tập' : 'Training'}
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-yellow-400 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>{isVi ? `Thử Thách ${meta.titleVi}` : `${meta.titleEn} Challenge`}</span>
          </span>
        </div>
      </div>

      {/* Main Challenge Container */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode
            ? 'border-rose-500/45 to-rose-950/35'
            : 'border-yellow-500/35 to-yellow-950/30'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-yellow-500/10'
          }`}
        />

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${
                hardMode
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/25'
                  : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/25'
              }`}
            >
              {hardMode ? <Flame className="w-5 h-5 fill-yellow-200 text-yellow-200" /> : <Zap className="w-5 h-5 fill-slate-950" />}
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? isVi
                    ? 'Cấp độ khó: số chính phương lớn hơn, ước lượng & chốt đuôi nhanh'
                    : 'Hard level: larger perfect squares, faster estimation'
                  : isVi
                  ? meta.subtitleVi
                  : meta.subtitleEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="hidden sm:inline">{isVi ? 'Thời gian:' : 'Timer:'}</span>
              </span>
              {timerConfig.limitOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={status === 'running'}
                  onClick={() => {
                    setTimeLimit(sec);
                    if (status === 'idle') setTimeLeft(sec);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                    timeLimit === sec
                      ? 'bg-yellow-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              {showEditTimerButton && (
                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(true)}
                  title={isVi ? 'Chỉnh sửa Timer (Trang này / Toàn Tab)' : 'Edit Timer (This Page / All Tab)'}
                  aria-label={isVi ? 'Chỉnh sửa Timer' : 'Edit Timer'}
                  className="ml-0.5 p-1.5 rounded-lg text-slate-400 hover:text-yellow-300 hover:bg-slate-800/90 border border-transparent hover:border-yellow-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <AutoNextSettingButton pageKey="SquareRootChallengePage" />

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
              title={isSpeakerEnabled ? (isVi ? 'Âm thanh: BẬT' : 'Sound: ON') : isVi ? 'Âm thanh: TẮT' : 'Sound: OFF'}
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-4 h-4 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Topic Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          {SQUARE_ROOT_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                const nextId = topic.id as SquareRootTopic;
                setSelectedTopic(nextId);
                if (status === 'idle') setQuestion(generateOperationQuestion('square-root', nextId, difficulty));
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                selectedTopic === topic.id
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="text-base">{TOPIC_ICONS[topic.id] || '⚡'}</span>
              <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Real-time Scoreboard Row */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
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
                ({isVi ? `Đúng: ${score}` : `Correct: ${score}`})
              </span>
            </div>
          </div>

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

        {/* Arena or Completed Summary */}
        <div className="w-full space-y-3">
          {status === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>{isVi ? 'Hoàn thành thử thách 10 câu!' : '10-Problem Challenge Completed!'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {isVi
                  ? `Chuyên đề: ${currentTopicMeta.labelVi} • Thời gian: ${timeLimit}s / câu${hardMode ? ' (Cấp độ Khó)' : ''}`
                  : `Topic: ${currentTopicMeta.labelEn} • Time limit: ${timeLimit}s / problem${hardMode ? ' (Hard Level)' : ''}`}
              </p>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {isVi ? 'Đúng' : 'Correct'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{score}</span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5">/ {TOTAL_QUESTIONS}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    {isVi ? 'Sai' : 'Incorrect'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{incorrectCount}</span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5">/ {TOTAL_QUESTIONS}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    {isVi ? '% Độ chính xác' : 'Accuracy'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">
                    {Math.round((score / TOTAL_QUESTIONS) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-500/80 block mt-0.5">
                    {score >= 8 ? (isVi ? 'Xuất sắc! 🌟' : 'Great! 🌟') : isVi ? 'Cần luyện thêm' : 'Keep practicing'}
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="max-w-lg mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{isVi ? 'Chi tiết 10 phép tính' : 'Problem Breakdown'}</span>
                    <span>{isVi ? 'Kết quả' : 'Result'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium">
                          #{item.qIndex}: {item.label}
                        </span>
                        <span className="font-bold font-mono">
                          {item.isCorrect ? '✓' : `✗ (${item.correctAnswer.toLocaleString()})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => startChallenge()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isVi ? `Bắt đầu thử thách mới (${TOTAL_QUESTIONS} câu)` : `Start New Challenge (${TOTAL_QUESTIONS} Problems)`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearTimers();
                    stopCurrentSpeech();
                    stopListening();
                    onBack();
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                >
                  <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch">
              <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent && status === 'running' ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-yellow-400'
                    }`}
                    style={{ width: `${status === 'idle' ? 100 : timerPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                    <span>{isVi ? `Câu ${questionIndex}/${TOTAL_QUESTIONS}` : `Problem ${questionIndex}/${TOTAL_QUESTIONS}`}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer className={`w-3 h-3 ${isUrgent && status === 'running' ? 'text-rose-400' : 'text-yellow-400'}`} />
                    <span className="font-mono">{status === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}</span>
                  </span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-xs mx-auto mb-3 px-2 w-full">
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                    const qNum = idx + 1;
                    const record = history[idx];
                    let bg = 'bg-slate-800 border-slate-700/60';
                    if (record) {
                      bg = record.isCorrect
                        ? 'bg-emerald-500 border-emerald-400 shadow-xs shadow-emerald-500/40'
                        : 'bg-rose-500 border-rose-400 shadow-xs shadow-rose-500/40';
                    } else if (qNum === questionIndex && (status === 'running' || status === 'answered')) {
                      bg = 'bg-yellow-400 border-yellow-300 animate-pulse';
                    }
                    return <div key={idx} className={`h-1.5 rounded-full border transition-all duration-300 ${bg}`} />;
                  })}
                </div>

                <div className="flex flex-col items-center justify-center gap-3 py-3 w-full">
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
                          ? 'Bấm nút "Bắt đầu" để hiện câu hỏi và bắt đầu tính giờ.'
                          : 'Click "Start" to reveal the problem and start the timer.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-full py-2 px-1">
                        <div className={`${question.a.toLocaleString().length >= 6 ? 'text-2xl sm:text-4xl lg:text-5xl' : 'text-3xl sm:text-5xl lg:text-6xl'} font-black text-white tracking-tight font-mono flex items-center justify-center whitespace-nowrap`}>
                          <span className="text-yellow-400 mr-1.5 font-sans">√</span>
                          <span className="border-t-4 border-yellow-300/80 pt-1 px-1.5">
                            {question.a.toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => pronounceQuestion()}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                            isSpeakingQuestion
                              ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 animate-pulse'
                              : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400'
                          }`}
                          title={isVi ? 'Phát âm câu hỏi' : 'Pronounce question'}
                        >
                          <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                        </button>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                        <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-yellow-400" />
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
                                  ? 'bg-yellow-400 text-slate-950 shadow-xs ring-1 ring-yellow-400 font-extrabold'
                                  : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
                              }`}
                            >
                              {`${s}x`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {feedback === 'correct' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isVi ? `Chính xác: ${question.answer.toLocaleString()}` : `Correct: ${question.answer.toLocaleString()}`}</span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{isVi ? `Chưa chính xác: ${question.answer.toLocaleString()}` : `Incorrect: ${question.answer.toLocaleString()}`}</span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{isVi ? `Hết giờ!: ${question.answer.toLocaleString()}` : `Time's up!: ${question.answer.toLocaleString()}`}</span>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(userAnswer);
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
                      status === 'idle'
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
                    disabled={status !== 'running'}
                    className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && status === 'running'
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {userAnswer && status === 'running' && (
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
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
                        onClick={() => setUserAnswer((p) => (p.length >= 14 ? p : p + digit))}
                        disabled={status !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    {[7, 8, 9, 0].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => setUserAnswer((p) => (p.length >= 14 ? p : p + digit))}
                        disabled={status !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
                      disabled={status !== 'running' || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      {isVi ? 'Xóa' : 'Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserAnswer((p) => p.slice(0, -1))}
                      disabled={status !== 'running' || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isListening && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="truncate">
                      {voiceTranscript
                        ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                        : isVi
                        ? '🎙️ Hãy đọc to đáp án của bạn...'
                        : '🎙️ Speak answer aloud...'}
                    </span>
                  </div>
                )}

                {voiceError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="flex-1 font-semibold">{voiceError}</p>
                  </div>
                )}

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {status === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => startChallenge()}
                      className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{isVi ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} câu)` : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}</span>
                    </button>
                  ) : status === 'answered' ? (
                    questionIndex < TOTAL_QUESTIONS ? (
                      <button
                        type="button"
                        onClick={() => advanceQuestion(questionIndex + 1, selectedTopic, timeLimit)}
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                      >
                        <span>
                          {autoNextConfig.delaySec > 0
                            ? isVi
                              ? `Câu tiếp theo (${questionIndex + 1}/${TOTAL_QUESTIONS}) - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                              : `Next Problem (${questionIndex + 1}/${TOTAL_QUESTIONS}) - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                            : isVi
                            ? `Câu tiếp theo (${questionIndex + 1}/${TOTAL_QUESTIONS})`
                            : `Next Problem (${questionIndex + 1}/${TOTAL_QUESTIONS})`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          clearTimers();
                          setStatus('completed');
                        }}
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-emerald-500 hover:from-yellow-300 hover:to-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>
                          {autoNextConfig.delaySec > 0
                            ? isVi
                              ? `Xem kết quả thử thách (tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)})`
                              : `View Results (auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)})`
                            : isVi
                            ? 'Xem kết quả thử thách'
                            : 'View Results'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 min-w-[130px] h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                    >
                      <span>{isVi ? 'Kết quả' : 'Submit Answer'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={status !== 'running'}
                    title={isVi ? 'Trả lời bằng giọng nói' : 'Answer by voice'}
                    className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
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
                    onClick={() => startChallenge()}
                    title={isVi ? 'Bắt đầu câu hỏi thử thách' : 'Start challenge question'}
                    className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
                  </button>

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

      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="page"
          initialPageKey="SquareRootChallengePage"
        />
      )}
    </div>
  );
};
