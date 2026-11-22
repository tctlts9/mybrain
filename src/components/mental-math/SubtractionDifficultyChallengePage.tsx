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
  OPERATION_META,
  OperationQuestion,
  generateOperationQuestion,
} from '../../utils/arithmeticOperations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';
import { SubtractionTopic, SUBTRACTION_TOPICS } from './SubtractionPage';
import { CustomTopicControlsRow } from './CustomTopicControlsRow';
import {
  CustomOperandMode,
  DifficultyBigQuestion,
  MIN_CUSTOM_DIGITS,
  MAX_CUSTOM_DIGITS,
  MIN_CUSTOM_OPERAND,
  MAX_CUSTOM_OPERAND,
  formatBigIntStr,
  normalizeAnswerInput,
  splitFormattedIntoBalancedLines,
  getCustomFormulaFontSize,
  generateCustomArithmeticQuestion,
} from '../../utils/customDifficultyHelpers';

type SubtractionDifficultyTopic = SubtractionTopic | 'custom';

interface SubtractionDifficultyChallengePageProps {
  initialTopic?: SubtractionTopic;
  onBack: () => void;
}

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';

const TOTAL_QUESTIONS = 10;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  sub2Digit: '➖',
  sub3Digit: '✨',
  sub4Digit: '🚀',
  subPower10: '⚡',
};

const toBigQuestion = (q: OperationQuestion): DifficultyBigQuestion => ({
  a: String(q.a),
  b: q.b !== undefined ? String(q.b) : undefined,
  answer: String(q.answer),
  hintVi: q.hintVi,
  hintEn: q.hintEn,
});

interface HistoryItem {
  qIndex: number;
  label: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export const SubtractionDifficultyChallengePage: React.FC<SubtractionDifficultyChallengePageProps> = ({
  initialTopic = 'general',
  onBack,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('SubtractionDifficultyChallengePage');
  const meta = OPERATION_META.subtraction;
  const hardMode = true;
  const difficulty = hardMode ? 'hard' : 'normal';
  const [selectedTopic, setSelectedTopic] = useState<SubtractionDifficultyTopic>(initialTopic);
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [operandMode, setOperandMode] = useState<CustomOperandMode>('exact');
  const [exactOperand, setExactOperand] = useState<number>(99);
  const [operandDigits, setOperandDigits] = useState<number>(2);

  const [timeLimit, setTimeLimit] = useState<TimeLimit>(10);
  const [answerTimeLimit, setAnswerTimeLimit] = useState<AnswerTimeLimit>(10);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<DifficultyBigQuestion>(() =>
    toBigQuestion(generateOperationQuestion('subtraction', initialTopic, difficulty))
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(10);
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
  const questionRef = useRef<DifficultyBigQuestion>(question);
  const statusRef = useRef<GameStatus>(status);
  const questionIndexRef = useRef<number>(questionIndex);
  const selectedTopicRef = useRef<SubtractionDifficultyTopic>(selectedTopic);
  const customDigitsRef = useRef<number>(customDigits);
  const operandModeRef = useRef<CustomOperandMode>(operandMode);
  const exactOperandRef = useRef<number>(exactOperand);
  const operandDigitsRef = useRef<number>(operandDigits);
  const timeLimitRef = useRef<TimeLimit>(timeLimit);
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  const advanceQuestionRef = useRef<
    (nextIdx: number, topicId: SubtractionDifficultyTopic, limit: TimeLimit, answerLimitOverride?: AnswerTimeLimit) => void
  >(() => {});

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    selectedTopicRef.current = selectedTopic;
  }, [selectedTopic]);

  useEffect(() => {
    customDigitsRef.current = customDigits;
  }, [customDigits]);

  useEffect(() => {
    operandModeRef.current = operandMode;
  }, [operandMode]);

  useEffect(() => {
    exactOperandRef.current = exactOperand;
  }, [exactOperand]);

  useEffect(() => {
    operandDigitsRef.current = operandDigits;
  }, [operandDigits]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  useEffect(() => {
    answerTimeLimitRef.current = answerTimeLimit;
  }, [answerTimeLimit]);

  useEffect(() => {
    challengePhaseRef.current = challengePhase;
  }, [challengePhase]);

  const generateProblem = useCallback(
    (
      topicOverride?: SubtractionDifficultyTopic,
      digitsOverride?: number,
      modeOverride?: CustomOperandMode,
      exactOverride?: number,
      opDigitsOverride?: number
    ): DifficultyBigQuestion => {
      const activeTopic = topicOverride ?? selectedTopicRef.current;
      if (activeTopic === 'custom') {
        return generateCustomArithmeticQuestion(
          'subtraction',
          digitsOverride ?? customDigitsRef.current,
          modeOverride ?? operandModeRef.current,
          exactOverride ?? exactOperandRef.current,
          opDigitsOverride ?? operandDigitsRef.current
        );
      }
      return toBigQuestion(generateOperationQuestion('subtraction', activeTopic, difficulty));
    },
    [difficulty]
  );

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

  const formatLabel = (q: DifficultyBigQuestion) =>
    `${formatBigIntStr(q.a)} − ${formatBigIntStr(q.b ?? '0')}`;

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const q = questionRef.current;
      const text = isVi ? `${q.a} trừ ${q.b}` : `${q.a} minus ${q.b}`;
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
    (isCorrect: boolean, answerVal: string) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, Number(answerVal), isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  const beginAnsweringPhase = useCallback(
    (
      idxOverride?: number,
      qOverride?: DifficultyBigQuestion,
      topicOverride?: SubtractionDifficultyTopic,
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit
    ) => {
      clearTimers();
      const activeIdx = idxOverride ?? questionIndexRef.current;
      const activeQ = qOverride ?? questionRef.current;
      const activeTopic = topicOverride ?? selectedTopicRef.current;
      const activeLimit = limitOverride ?? timeLimitRef.current;
      const activeAnsLimit = answerLimitOverride ?? answerTimeLimitRef.current;

      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(activeAnsLimit);
      setTimeout(() => inputRef.current?.focus(), 50);

      const endTime = Date.now() + activeAnsLimit * 1000;
      timerRef.current = window.setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setStatus('answered');
          statusRef.current = 'answered';
          setChallengePhase('idle');
          challengePhaseRef.current = 'idle';
          setFeedback('timeout');
          setStreak(0);
          setWrongStreak((w) => w + 1);
          setIncorrectCount((inc) => inc + 1);
          setHistory((h) => [
            ...h,
            {
              qIndex: activeIdx,
              label: formatLabel(activeQ),
              userAnswer: isVi ? 'Hết giờ' : 'Timeout',
              correctAnswer: activeQ.answer,
              isCorrect: false,
            },
          ]);
          if (isSpeakerEnabled) {
            triggerAnnouncement(false, activeQ.answer);
          }
          if (autoNextDelayRef.current > 0) {
            autoNextRef.current = window.setTimeout(() => {
              advanceQuestionRef.current(activeIdx + 1, activeTopic, activeLimit, activeAnsLimit);
            }, Math.round(autoNextDelayRef.current * 1000));
          }
        }
      }, 100);
    },
    [clearTimers, isSpeakerEnabled, isVi, triggerAnnouncement]
  );

  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      topicId: SubtractionDifficultyTopic,
      limit: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit
    ) => {
      clearTimers();
      if (nextIdx > TOTAL_QUESTIONS) {
        setStatus('completed');
        statusRef.current = 'completed';
        setChallengePhase('idle');
        challengePhaseRef.current = 'idle';
        stopListening();
        return;
      }
      const nextQ = generateProblem(topicId);
      setQuestionIndex(nextIdx);
      questionIndexRef.current = nextIdx;
      setQuestion(nextQ);
      questionRef.current = nextQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setChallengePhase('observing');
      challengePhaseRef.current = 'observing';
      setTimeLeft(limit);
      setStatus('running');
      statusRef.current = 'running';

      const activeAnsLimit = answerLimitOverride ?? answerTimeLimitRef.current;
      const endTime = Date.now() + limit * 1000;
      timerRef.current = window.setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          beginAnsweringPhase(nextIdx, nextQ, topicId, limit, activeAnsLimit);
        }
      }, 100);
    },
    [beginAnsweringPhase, clearTimers, generateProblem, stopListening]
  );

  useEffect(() => {
    advanceQuestionRef.current = advanceQuestion;
  }, [advanceQuestion]);

  const startChallenge = (
    topicOverride?: SubtractionDifficultyTopic,
    limitOverride?: TimeLimit,
    answerLimitOverride?: AnswerTimeLimit
  ) => {
    const activeTopic = topicOverride || selectedTopic;
    const activeLimit = limitOverride || timeLimit;
    const activeAnswerLimit = answerLimitOverride || answerTimeLimit;
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, activeTopic, activeLimit, activeAnswerLimit);
  };

  const handleReset = () => {
    clearTimers();
    stopCurrentSpeech();
    stopListening();
    setStatus('idle');
    statusRef.current = 'idle';
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
    setQuestionIndex(1);
    questionIndexRef.current = 1;
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
    const nextQ = generateProblem(selectedTopic);
    setQuestion(nextQ);
    questionRef.current = nextQ;
  };

  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running' || challengePhaseRef.current !== 'answering') return;
      const normalized = normalizeAnswerInput(rawVal);
      if (!normalized) return;

      clearTimers();
      const q = questionRef.current;
      const correct = normalized === q.answer;
      setStatus('answered');
      statusRef.current = 'answered';
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
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
          userAnswer: normalized,
          correctAnswer: q.answer,
          isCorrect: correct,
        },
      ]);

      if (autoNextDelayRef.current > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(questionIndex + 1, selectedTopic, timeLimit, answerTimeLimitRef.current);
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
        if (parsed !== null && statusRef.current === 'running' && challengePhaseRef.current === 'answering') {
          setUserAnswer(String(parsed));
          if (String(parsed) === questionRef.current.answer || res.isFinal) {
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
    SUBTRACTION_TOPICS.find((tItem) => tItem.id === selectedTopic) || SUBTRACTION_TOPICS[0];
  const dynamicBadge =
    selectedTopic === 'custom'
      ? operandMode === 'digits'
        ? isVi
          ? `${customDigits} chữ số − ${operandDigits} chữ số`
          : `${customDigits}-Digit − ${operandDigits}-Digit`
        : isVi
        ? `${customDigits} chữ số − ${formatBigIntStr(exactOperand)}`
        : `${customDigits}-Digit − ${formatBigIntStr(exactOperand)}`
      : isVi
      ? currentTopicMeta.badgeVi
      : currentTopicMeta.badgeEn;
  const completedTopicLabel =
    selectedTopic === 'custom'
      ? dynamicBadge
      : isVi
      ? currentTopicMeta.labelVi
      : currentTopicMeta.labelEn;

  const isCustomLayout = selectedTopic === 'custom';
  const formattedA = formatBigIntStr(question.a);
  const formattedB = formatBigIntStr(question.b ?? '0');
  const totalFormattedLen = formattedA.length + formattedB.length + 3;
  const useStackedFormula = isCustomLayout ? totalFormattedLen > 56 : false;
  const linesA = useStackedFormula ? splitFormattedIntoBalancedLines(question.a, 10) : [formattedA];
  const linesB = useStackedFormula ? splitFormattedIntoBalancedLines(question.b ?? '0', 10) : [formattedB];
  const formulaFontSize = getCustomFormulaFontSize(totalFormattedLen);

  const canAnswer = status === 'running' && challengePhase === 'answering';
  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const isUrgent = timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / activePhaseDuration) * 100));

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
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficult Level Challenge'}</span>
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
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                hardMode
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/25'
              }`}
            >
              {hardMode ? <Flame className="w-5 h-5 fill-yellow-200 text-yellow-200" /> : <Zap className="w-5 h-5 fill-slate-950" />}
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficult Level Challenge'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {dynamicBadge}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? isVi
                    ? 'Cấp độ khó: số lớn hơn, mượn nhiều hàng, phản xạ nhanh'
                    : 'Hard level: larger numbers, heavier borrowing, faster timer'
                  : isVi
                  ? meta.subtitleVi
                  : meta.subtitleEn}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <DifficultyTimerInputs
              timeLimit={timeLimit}
              answerTimeLimit={answerTimeLimit}
              disabled={status === 'running'}
              isVi={isVi}
              clockIconClassName="text-yellow-400"
              limitFocusClassName="focus:border-yellow-400"
              onChangeTimeLimit={(sec) => {
                setTimeLimit(sec);
                if (status === 'idle') setTimeLeft(sec);
              }}
              onChangeAnswerTimeLimit={(sec) => {
                setAnswerTimeLimit(sec);
                answerTimeLimitRef.current = sec;
              }}
            />

            <AutoNextSettingButton pageKey="SubtractionDifficultyChallengePage" />

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

        {/* Topic Selector Grid + Custom Row */}
        <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SUBTRACTION_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                disabled={status === 'running'}
                onClick={() => {
                  const nextId = topic.id as SubtractionTopic;
                  setSelectedTopic(nextId);
                  selectedTopicRef.current = nextId;
                  if (status === 'idle' || status === 'completed') {
                    const nextQ = generateProblem(nextId);
                    setQuestion(nextQ);
                    questionRef.current = nextQ;
                  }
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                  selectedTopic === topic.id
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-base">{TOPIC_ICONS[topic.id] || '➖'}</span>
                <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
              </button>
            ))}
          </div>

          <CustomTopicControlsRow
            idPrefix="sub"
            isSelected={selectedTopic === 'custom'}
            disabled={status === 'running'}
            isVi={isVi}
            buttonLabelVi="Tùy chọn (Chữ số & Số trừ)"
            buttonLabelEn="Custom (Digits & Subtrahend)"
            buttonTitleVi="Tùy chọn độ dài chữ số và số trừ tùy ý"
            buttonTitleEn="Custom digit length and subtrahend"
            operandSectionLabelVi="Trừ cho số tùy chọn:"
            operandSectionLabelEn="Custom subtrahend:"
            exactTitleVi="Nhập số trừ đích danh tùy chọn (VD: 19, 99, 125...)"
            exactTitleEn="Enter exact custom subtrahend (e.g. 19, 99, 125...)"
            digitsTitleVi="Nhập độ dài chữ số của số trừ (từ 1 đến 100)"
            digitsTitleEn="Enter subtrahend digit length (1 to 100)"
            customDigits={customDigits}
            operandMode={operandMode}
            exactOperand={exactOperand}
            operandDigits={operandDigits}
            onSelectCustom={() => {
              setSelectedTopic('custom');
              selectedTopicRef.current = 'custom';
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom');
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
            }}
            onChangeCustomDigits={(val) => {
              const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, val));
              setCustomDigits(clamped);
              customDigitsRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
            }}
            onChangeOperandMode={(modeVal) => {
              setOperandMode(modeVal);
              operandModeRef.current = modeVal;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, modeVal);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
            }}
            onChangeExactOperand={(val) => {
              const clamped = Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, val));
              setExactOperand(clamped);
              exactOperandRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, 'exact', clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
            }}
            onChangeOperandDigits={(val) => {
              const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, val));
              setOperandDigits(clamped);
              operandDigitsRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, 'digits', undefined, clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
            }}
          />
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
                  ? `Chuyên đề: ${completedTopicLabel}${hardMode ? ' (Cấp độ Khó)' : ''} • Quan sát: ${timeLimit}s • Trả lời: ${answerTimeLimit}s`
                  : `Topic: ${completedTopicLabel}${hardMode ? ' (Hard Level)' : ''} • Observe: ${timeLimit}s • Answer: ${answerTimeLimit}s`}
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
                <div className="max-w-xl mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{isVi ? 'Chi tiết 10 phép tính' : 'Problem Breakdown'}</span>
                    <span>{isVi ? 'Kết quả' : 'Result'}</span>
                  </div>
                  <div className={isCustomLayout ? 'max-h-56 overflow-y-auto space-y-1.5 text-xs' : 'grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs'}>
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium break-all">
                          #{item.qIndex}: {item.label}
                        </span>
                        <span className="font-bold font-mono break-all shrink-0">
                          {item.isCorrect ? '✓' : `✗ (${formatBigIntStr(item.correctAnswer)})`}
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
            <div
              className={
                isCustomLayout
                  ? 'flex flex-col gap-4 md:gap-5'
                  : 'landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch'
              }
            >
              <div
                className={`${
                  isCustomLayout ? 'w-full' : 'landscape-math-col md:col-span-6'
                } rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center`}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : challengePhase === 'answering' && status === 'running'
                        ? 'bg-cyan-400'
                        : 'bg-yellow-400'
                    }`}
                    style={{ width: `${status === 'idle' ? 100 : timerPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    {dynamicBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                    <span>{isVi ? `Câu ${questionIndex}/${TOTAL_QUESTIONS}` : `Problem ${questionIndex}/${TOTAL_QUESTIONS}`}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : challengePhase === 'answering' && status === 'running'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer className={`w-3 h-3 ${isUrgent && status === 'running' ? 'text-rose-400' : challengePhase === 'answering' && status === 'running' ? 'text-cyan-400' : 'text-yellow-400'}`} />
                    <span className="font-mono">
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
                  ) : status === 'running' && challengePhase === 'answering' ? (
                    <div className="py-5 px-6 rounded-2xl bg-slate-900/90 border border-cyan-500/35 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                        <EyeOff className="w-5 h-5 text-cyan-400" />
                        <span>{isVi ? 'Đã hết thời gian quan sát' : 'Observation time ended'}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {isVi
                          ? `Hãy nhớ lại phép tính và nhập đáp án trong ${timeLeft}s`
                          : `Recall the problem and enter your answer within ${timeLeft}s`}
                      </p>
                    </div>
                  ) : (
                    <>
                      {useStackedFormula ? (
                        <div className="w-full flex flex-col items-center justify-center gap-2.5 py-1 select-none">
                          <div
                            className={`font-black text-white font-mono tabular-nums flex flex-col items-center justify-center gap-1 tracking-wide leading-snug max-w-full ${formulaFontSize}`}
                          >
                            {linesA.map((line, idx) => (
                              <span key={idx} className="whitespace-nowrap">
                                {line}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-3 pt-1 max-w-full">
                            <div
                              className={`font-black text-white font-mono tabular-nums flex items-start justify-center gap-2 tracking-tight ${formulaFontSize}`}
                            >
                              <span className="text-yellow-400 font-sans shrink-0">−</span>
                              <div className="flex flex-col items-center justify-center gap-1 leading-snug">
                                {linesB.map((line, idx) => (
                                  <span key={idx} className="whitespace-nowrap">
                                    {line}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => pronounceQuestion()}
                              className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                                isSpeakingQuestion
                                  ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 animate-pulse'
                                  : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400'
                              }`}
                              title={isVi ? 'Phát âm câu hỏi' : 'Pronounce question'}
                            >
                              <Volume2 className={`w-5 h-5 sm:w-5 sm:h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const totalChars = formattedA.length + formattedB.length;
                          const sizeClass = isCustomLayout
                            ? formulaFontSize
                            : totalChars >= 12
                            ? 'text-xl sm:text-2xl lg:text-3xl'
                            : totalChars >= 9
                            ? 'text-2xl sm:text-3xl lg:text-4xl'
                            : totalChars >= 7
                            ? 'text-3xl sm:text-4xl lg:text-[2.75rem]'
                            : 'text-3xl sm:text-5xl';
                          return (
                            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-full py-2 px-1">
                              <div className={`${sizeClass} font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight`}>
                                <span className="whitespace-nowrap">{formattedA}</span>
                                <span className="text-yellow-400 font-sans">−</span>
                                <span className="whitespace-nowrap">{formattedB}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => pronounceQuestion()}
                                className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                                  isSpeakingQuestion
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 animate-pulse'
                                    : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400'
                                }`}
                                title={isVi ? 'Phát âm câu hỏi' : 'Pronounce question'}
                              >
                                <Volume2 className={`w-5 h-5 sm:w-5 sm:h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                              </button>
                            </div>
                          );
                        })()
                      )}

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
                                  ? 'bg-yellow-400 text-slate-950 shadow-xs ring-1 ring-yellow-300 font-extrabold'
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
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi ? `Chính xác: ${formatBigIntStr(question.answer)}` : `Correct: ${formatBigIntStr(question.answer)}`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi ? `Chưa chính xác: ${formatBigIntStr(question.answer)}` : `Incorrect: ${formatBigIntStr(question.answer)}`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi ? `Hết giờ!: ${formatBigIntStr(question.answer)}` : `Time's up!: ${formatBigIntStr(question.answer)}`}
                    </span>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(userAnswer);
                }}
                className={`${
                  isCustomLayout ? 'w-full max-w-2xl mx-auto' : 'landscape-math-col md:col-span-6'
                } flex flex-col justify-center space-y-3`}
              >
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value.replace(/[^\d]/g, '').slice(0, 250))}
                    placeholder={
                      status === 'idle'
                        ? isVi
                          ? 'Bấm "Bắt đầu thử thách" để đếm ngược...'
                          : 'Click "Start Challenge" to begin...'
                        : challengePhase === 'observing'
                        ? isVi
                          ? `Đang quan sát đề (${timeLeft}s)... Bấm "Trả lời ngay"`
                          : `Observing (${timeLeft}s)... Click "Answer Now"`
                        : isListening
                        ? isVi
                          ? '🎙️ Đang nghe... Hãy đọc to đáp án của bạn'
                          : '🎙️ Listening... Speak your answer'
                        : isVi
                        ? 'Nhập kết quả hoặc bấm phím số...'
                        : 'Type answer or tap numeric keys...'
                    }
                    disabled={!canAnswer}
                    className={`w-full h-13 sm:h-14 px-5 pr-11 text-center ${
                      userAnswer.length > 22 ? 'text-base sm:text-xl' : 'text-2xl sm:text-3xl'
                    } font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && canAnswer
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {userAnswer && canAnswer && (
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
                        onClick={() => setUserAnswer((p) => (p.length >= 250 ? p : p + digit))}
                        disabled={!canAnswer}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    {[7, 8, 9, 0].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => setUserAnswer((p) => (p.length >= 250 ? p : p + digit))}
                        disabled={!canAnswer}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
                      disabled={!canAnswer || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      {isVi ? 'Xóa' : 'Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserAnswer((p) => p.slice(0, -1))}
                      disabled={!canAnswer || !userAnswer}
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
                        onClick={() => advanceQuestion(questionIndex + 1, selectedTopic, timeLimit, answerTimeLimit)}
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
                          setChallengePhase('idle');
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
                  ) : challengePhase === 'observing' ? (
                    <button
                      type="button"
                      onClick={() => beginAnsweringPhase()}
                      className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:via-sky-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-cyan-300/30 shadow-[0_8px_24px_-4px_rgba(14,165,233,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(56,189,248,0.55)] active:scale-95 text-xs sm:text-sm"
                    >
                      <Timer className="w-4 h-4" />
                      <span>{isVi ? `Trả lời ngay (${timeLeft}s)` : `Answer Now (${timeLeft}s)`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
                    disabled={!canAnswer}
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
    </div>
  );
};
