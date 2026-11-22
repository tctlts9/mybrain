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
  Mic,
  MicOff,
  ArrowRight,
  AlertTriangle,
  Gauge,
  Delete,
  EyeOff,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DifficultyTimerInputs } from './DifficultyTimerInputs';
import {
  useMentalMathAutoNextConfig,
  formatAutoNextDelay,
} from '../../config/mentalMathAutoNext';
import { AutoNextSettingButton } from './AutoNextSettingButton';
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

type Multiply11DifficultyTopic = Multiply11Topic | 'custom';
type CustomMultiplierMode = 'exact' | 'digits';

export interface TopicOption {
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

export const MULTIPLY_11_TOPICS: TopicOption[] = [
  {
    id: 'general',
    digits: 0,
    labelVi: 'Tổng quát',
    labelEn: 'General',
    fullNameVi: 'Nhân với 11 tổng quát (ngẫu nhiên 2 - 10 chữ số)',
    fullNameEn: 'General Multiply by 11 (2 - 10 Digits)',
    icon: '⚡',
    badgeVi: 'Tổng quát: 2 - 10 chữ số × 11',
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
    badgeVi: '3 chữ số × 11',
    badgeEn: '3-Digit × 11',
  },
  {
    id: 'digit4',
    digits: 4,
    labelVi: '4 Chữ số',
    labelEn: '4-Digit',
    fullNameVi: 'Nhân 4 chữ số với 11',
    fullNameEn: 'Multiply 4-Digit by 11',
    icon: '🚀',
    badgeVi: '4 chữ số × 11',
    badgeEn: '4-Digit × 11',
  },
  {
    id: 'digit5',
    digits: 5,
    labelVi: '5 Chữ số',
    labelEn: '5-Digit',
    fullNameVi: 'Nhân 5 chữ số với 11',
    fullNameEn: 'Multiply 5-Digit by 11',
    icon: '⭐',
    badgeVi: '5 chữ số × 11',
    badgeEn: '5-Digit × 11',
  },
  {
    id: 'digit6',
    digits: 6,
    labelVi: '6 Chữ số',
    labelEn: '6-Digit',
    fullNameVi: 'Nhân 6 chữ số với 11',
    fullNameEn: 'Multiply 6-Digit by 11',
    icon: '🎯',
    badgeVi: '6 chữ số × 11',
    badgeEn: '6-Digit × 11',
  },
  {
    id: 'digit7',
    digits: 7,
    labelVi: '7 Chữ số',
    labelEn: '7-Digit',
    fullNameVi: 'Nhân 7 chữ số với 11',
    fullNameEn: 'Multiply 7-Digit by 11',
    icon: '🔥',
    badgeVi: '7 chữ số × 11',
    badgeEn: '7-Digit × 11',
  },
  {
    id: 'digit8',
    digits: 8,
    labelVi: '8 Chữ số',
    labelEn: '8-Digit',
    fullNameVi: 'Nhân 8 chữ số với 11',
    fullNameEn: 'Multiply 8-Digit by 11',
    icon: '💎',
    badgeVi: '8 chữ số × 11',
    badgeEn: '8-Digit × 11',
  },
  {
    id: 'digit9',
    digits: 9,
    labelVi: '9 Chữ số',
    labelEn: '9-Digit',
    fullNameVi: 'Nhân 9 chữ số với 11',
    fullNameEn: 'Multiply 9-Digit by 11',
    icon: '🏆',
    badgeVi: '9 chữ số × 11',
    badgeEn: '9-Digit × 11',
  },
  {
    id: 'digit10',
    digits: 10,
    labelVi: '10 Chữ số',
    labelEn: '10-Digit',
    fullNameVi: 'Nhân 10 chữ số với 11',
    fullNameEn: 'Multiply 10-Digit by 11',
    icon: '👑',
    badgeVi: '10 chữ số × 11',
    badgeEn: '10-Digit × 11',
  },
];

interface MultiplyBy11DifficultyChallengePageProps {
  onBack: () => void;
  initialTopic?: Multiply11Topic;
}

interface Question {
  a: string;
  b: string;
  answer: string;
}

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'paused' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';

const TOTAL_QUESTIONS = 10;
const MIN_CUSTOM_DIGITS = 1;
const MAX_CUSTOM_DIGITS = 100;
const MIN_CUSTOM_MULTIPLIER = 1;
const MAX_CUSTOM_MULTIPLIER = 999999999;

const formatBigIntStr = (val: string | number): string =>
  String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const normalizeAnswerInput = (val: string): string =>
  val
    .trim()
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '');

const computeExactProduct = (a: string | number, b: string | number): string =>
  (BigInt(a) * BigInt(b)).toString();

const buildRandomDigitString = (digits: number, activeHard: boolean): string => {
  if (activeHard) {
    let s = String(Math.floor(Math.random() * 5) + 5); // 5..9
    for (let i = 1; i < digits; i++) {
      s += String(Math.floor(Math.random() * 6) + 4); // 4..9 -> carry-heavy adjacent pairs
    }
    return s;
  }
  if (digits === 1) {
    return String(Math.floor(Math.random() * 8) + 2);
  }
  if (digits === 2) {
    return String(Math.floor(Math.random() * 88) + 12);
  }
  let s = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < digits; i++) {
    s += String(Math.floor(Math.random() * 10));
  }
  return s;
};

const splitFormattedIntoBalancedLines = (numStr: string, maxGroupsPerLine = 5): string[] => {
  const formatted = formatBigIntStr(numStr);
  const groups = formatted.split(',');
  if (groups.length <= maxGroupsPerLine) return [formatted];
  const lineCount = Math.ceil(groups.length / maxGroupsPerLine);
  const perLine = Math.ceil(groups.length / lineCount);
  const lines: string[] = [];
  for (let i = 0; i < groups.length; i += perLine) {
    const chunk = groups.slice(i, i + perLine).join(',');
    const isLast = i + perLine >= groups.length;
    lines.push(isLast ? chunk : `${chunk},`);
  }
  return lines;
};

interface RoundHistoryItem {
  qIndex: number;
  a: string;
  b: string;
  userAnswer: string;
  isCorrect: boolean;
}

const getSpelledOutDigits = (num: string | number, isVietnamese: boolean): string => {
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

export const MultiplyBy11DifficultyChallengePage: React.FC<MultiplyBy11DifficultyChallengePageProps> = ({
  onBack,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('MultiplyBy11DifficultyChallengePage');

  const hardMode = true;

  // Topic selection: Tổng quát (General), 3 đến 10 chữ số, hoặc Tùy chọn
  const [selectedTopic, setSelectedTopic] = useState<Multiply11DifficultyTopic>(initialTopic ?? 'general');
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [customMultiplierMode, setCustomMultiplierMode] = useState<CustomMultiplierMode>('exact');
  const [customMultiplier, setCustomMultiplier] = useState<number>(11);
  const [customMultiplierDigits, setCustomMultiplierDigits] = useState<number>(2);
  const [customDigitsDraft, setCustomDigitsDraft] = useState<string>('3');
  const [customMultiplierDraft, setCustomMultiplierDraft] = useState<string>('11');
  const [customMultiplierDigitsDraft, setCustomMultiplierDigitsDraft] = useState<string>('2');

  // Config: Quan sát (Limit) & Trả lời (Answer) - mặc định 10s, 10s
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(10);
  const [answerTimeLimit, setAnswerTimeLimit] = useState<AnswerTimeLimit>(10);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');

  // 10 Phép nhân trong 1 lượt thử thách
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Math Problem
  const [question, setQuestion] = useState<Question>({ a: '68', b: '11', answer: '748' });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');

  // Thống kê: Chuỗi đúng, Chuỗi sai, Điểm số
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
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  answerTimeLimitRef.current = answerTimeLimit;
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  challengePhaseRef.current = challengePhase;

  const customDigitsRef = useRef<number>(customDigits);
  customDigitsRef.current = customDigits;
  const customMultiplierModeRef = useRef<CustomMultiplierMode>(customMultiplierMode);
  customMultiplierModeRef.current = customMultiplierMode;
  const customMultiplierRef = useRef<number>(customMultiplier);
  customMultiplierRef.current = customMultiplier;
  const customMultiplierDigitsRef = useRef<number>(customMultiplierDigits);
  customMultiplierDigitsRef.current = customMultiplierDigits;

  // Generate random problem based on Selected Topic for Multiply by 11 / Custom
  const generateProblemForTopic = useCallback(
    (
      topicToUse?: Multiply11DifficultyTopic,
      hardOverride?: boolean,
      customDigitsOverride?: number,
      customMultiplierOverride?: number,
      customMultiplierModeOverride?: CustomMultiplierMode,
      customMultiplierDigitsOverride?: number
    ): Question => {
      const active = topicToUse ?? selectedTopic;
      const activeHard = hardOverride ?? hardMode;

      if (active === 'custom') {
        const digits = Math.min(
          MAX_CUSTOM_DIGITS,
          Math.max(MIN_CUSTOM_DIGITS, customDigitsOverride ?? customDigitsRef.current)
        );
        const multiDigitStr = buildRandomDigitString(digits, activeHard);
        const modeToUse = customMultiplierModeOverride ?? customMultiplierModeRef.current;
        const multStr =
          modeToUse === 'digits'
            ? buildRandomDigitString(
                Math.min(
                  MAX_CUSTOM_DIGITS,
                  Math.max(
                    MIN_CUSTOM_DIGITS,
                    customMultiplierDigitsOverride ?? customMultiplierDigitsRef.current
                  )
                ),
                activeHard
              )
            : String(
                Math.min(
                  MAX_CUSTOM_MULTIPLIER,
                  Math.max(
                    MIN_CUSTOM_MULTIPLIER,
                    customMultiplierOverride ?? customMultiplierRef.current
                  )
                )
              );
        return {
          a: multiDigitStr,
          b: multStr,
          answer: computeExactProduct(multiDigitStr, multStr),
        };
      }

      const isGeneral =
        active === 'general' ||
        active === 'general11' ||
        active === 'digit2' ||
        active === 'twoDigit11' ||
        active === 'mixed11';

      let digits = 2;
      if (isGeneral) {
        // Hard: 6-10 digits; Normal: 2-10 digits
        digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;
      } else if (active === 'digit3' || active === 'threeDigit11') digits = 3;
      else if (active === 'digit4') digits = 4;
      else if (active === 'digit5') digits = 5;
      else if (active === 'digit6') digits = 6;
      else if (active === 'digit7') digits = 7;
      else if (active === 'digit8') digits = 8;
      else if (active === 'digit9') digits = 9;
      else if (active === 'digit10') digits = 10;
      else if (active === 'multiDigit11') digits = Math.random() > 0.5 ? 5 : 4;
      else digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;

      const multiDigitStr = buildRandomDigitString(digits, activeHard);

      // Số 11 có thể đứng trước hoặc đứng sau
      let a = multiDigitStr;
      let b = '11';
      if (isGeneral) {
        const isElevenFirst = Math.random() < 0.5;
        if (isElevenFirst) {
          a = '11';
          b = multiDigitStr;
        } else {
          a = multiDigitStr;
          b = '11';
        }
      }

      return { a, b, answer: computeExactProduct(a, b) };
    },
    [selectedTopic, hardMode]
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
    (isCorrect: boolean, targetAnswer: string | number) => {
      if (!isSpeakerEnabled) return;

      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');

      setTimeout(() => {
        announceResultFemaleVoice(
          isCorrect,
          Number(targetAnswer),
          isVi ? 'vi' : 'en',
          () => setIsSpeaking(false),
          questionSpeed
        );
      }, 200);
    },
    [isSpeakerEnabled, isVi, questionSpeed]
  );

  // Pronounce Question (VD: "Sáu Tám nhân Một Một")
  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      setIsSpeakingQuestion(true);
      const speedToUse = overrideSpeed ?? questionSpeed;
      pronounceQuestionFemaleVoice(
        Number(question.a),
        Number(question.b),
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        speedToUse
      );
    },
    [question.a, question.b, isVi, questionSpeed]
  );

  // Submit Answer
  const submitAnswer = useCallback(
    (rawAns: string | number) => {
      clearCountdown();
      setGameStatus('answered');

      // Stop listening if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);

      const normalizedInput = normalizeAnswerInput(String(rawAns));
      const isCorrect = normalizedInput !== '' && normalizedInput === questionRef.current.answer;
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          userAnswer: normalizedInput || String(rawAns),
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
        const pointsAwarded = Math.max(10, (14 - timeLimit) * 5);
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

  // Start Answering Phase Countdown
  const beginAnsweringPhase = useCallback(
    (explicitAnswerLimit?: AnswerTimeLimit) => {
      clearCountdown();
      const activeAnswerLimit = explicitAnswerLimit ?? answerTimeLimitRef.current;
      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(activeAnswerLimit);

      const startTime = Date.now();
      const endTime = startTime + activeAnswerLimit * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          clearCountdown();
          handleTimeout();
        }
      }, 100);

      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [clearCountdown, handleTimeout]
  );

  // Start Observation Countdown Timer -> then transition to Answering Phase
  const startCountdown = useCallback(
    (observeDuration: number, explicitAnswerLimit?: AnswerTimeLimit) => {
      clearCountdown();
      setChallengePhase('observing');
      challengePhaseRef.current = 'observing';
      setTimeLeft(observeDuration);

      const startTime = Date.now();
      const endTime = startTime + observeDuration * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          beginAnsweringPhase(explicitAnswerLimit);
        }
      }, 100);
    },
    [clearCountdown, beginAnsweringPhase]
  );

  // Bắt đầu đợt thử thách 10 phép nhân
  const startChallengeSession = useCallback(
    (
      explicitTimeLimit?: TimeLimit,
      explicitTopic?: Multiply11DifficultyTopic,
      explicitAnswerLimit?: AnswerTimeLimit,
      customDigitsOverride?: number,
      customMultiplierOverride?: number,
      customMultiplierModeOverride?: CustomMultiplierMode,
      customMultiplierDigitsOverride?: number
    ) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      stopCurrentSpeech();
      clearCountdown();

      const activeLimit = explicitTimeLimit ?? timeLimit;
      const activeTopic = explicitTopic ?? selectedTopic;
      const newQ = generateProblemForTopic(
        activeTopic,
        undefined,
        customDigitsOverride,
        customMultiplierOverride,
        customMultiplierModeOverride,
        customMultiplierDigitsOverride
      );

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

      startCountdown(activeLimit, explicitAnswerLimit);
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
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
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
  }, [currentQuestionIndex, generateProblemForTopic, selectedTopic, clearCountdown, startCountdown, timeLimit]);

  // Tự động chuyển câu hỏi theo thời gian cấu hình khi có kết quả (chính xác / chưa chính xác / hết giờ)
  useEffect(() => {
    if (gameStatus === 'answered' && autoNextConfig.delaySec > 0) {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = setTimeout(() => {
        goToNextQuestion();
      }, Math.round(autoNextConfig.delaySec * 1000));
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
  }, [gameStatus, goToNextQuestion, autoNextConfig.delaySec]);

  // Switch Time Limit (2s - 12s)
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

  // Switch Answer Time Limit (10s - 60s)
  const handleSelectAnswerTimeLimit = (newLimit: AnswerTimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAnswerTimeLimit(newLimit);
    answerTimeLimitRef.current = newLimit;
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(undefined, undefined, newLimit);
    }
  };

  // Switch Topic: 2 đến 10 chữ số | Tùy chọn
  const handleSelectTopic = (newTopic: Multiply11DifficultyTopic) => {
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

  // Custom Digits Textbox handlers
  const handleCustomDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setCustomDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
        setCustomDigits(clamped);
        customDigitsRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startChallengeSession(
            undefined,
            'custom',
            undefined,
            clamped,
            customMultiplierRef.current,
            customMultiplierModeRef.current,
            customMultiplierDigitsRef.current
          );
        } else {
          const newQ = generateProblemForTopic(
            'custom',
            undefined,
            clamped,
            customMultiplierRef.current,
            customMultiplierModeRef.current,
            customMultiplierDigitsRef.current
          );
          setQuestion(newQ);
          questionRef.current = newQ;
        }
      }
    }
  };

  const commitCustomDigits = () => {
    const parsed = parseInt(customDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      const fallback = customDigitsRef.current >= MIN_CUSTOM_DIGITS ? customDigitsRef.current : 3;
      setCustomDigitsDraft(String(fallback));
      setCustomDigits(fallback);
      customDigitsRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setCustomDigitsDraft(String(clamped));
    if (clamped !== customDigitsRef.current) {
      setCustomDigits(clamped);
      customDigitsRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startChallengeSession(
          undefined,
          'custom',
          undefined,
          clamped,
          customMultiplierRef.current,
          customMultiplierModeRef.current,
          customMultiplierDigitsRef.current
        );
      } else {
        const newQ = generateProblemForTopic(
          'custom',
          undefined,
          clamped,
          customMultiplierRef.current,
          customMultiplierModeRef.current,
          customMultiplierDigitsRef.current
        );
        setQuestion(newQ);
        questionRef.current = newQ;
      }
    }
  };

  // Switch Custom Multiplier Mode (Exact number vs Digit length)
  const handleCustomMultiplierModeChange = (mode: CustomMultiplierMode) => {
    setCustomMultiplierMode(mode);
    customMultiplierModeRef.current = mode;
    if (selectedTopic !== 'custom') {
      setSelectedTopic('custom');
    }
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(
        undefined,
        'custom',
        undefined,
        customDigitsRef.current,
        customMultiplierRef.current,
        mode,
        customMultiplierDigitsRef.current
      );
    } else {
      const newQ = generateProblemForTopic(
        'custom',
        undefined,
        customDigitsRef.current,
        customMultiplierRef.current,
        mode,
        customMultiplierDigitsRef.current
      );
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Custom Multiplier Exact Number Textbox handlers
  const handleCustomMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 9);
    setCustomMultiplierDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_MULTIPLIER) {
        const clamped = Math.min(MAX_CUSTOM_MULTIPLIER, Math.max(MIN_CUSTOM_MULTIPLIER, parsed));
        setCustomMultiplier(clamped);
        customMultiplierRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startChallengeSession(
            undefined,
            'custom',
            undefined,
            customDigitsRef.current,
            clamped,
            'exact',
            customMultiplierDigitsRef.current
          );
        } else {
          const newQ = generateProblemForTopic(
            'custom',
            undefined,
            customDigitsRef.current,
            clamped,
            'exact',
            customMultiplierDigitsRef.current
          );
          setQuestion(newQ);
          questionRef.current = newQ;
        }
      }
    }
  };

  const commitCustomMultiplier = () => {
    const parsed = parseInt(customMultiplierDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_MULTIPLIER) {
      const fallback = customMultiplierRef.current >= MIN_CUSTOM_MULTIPLIER ? customMultiplierRef.current : 11;
      setCustomMultiplierDraft(String(fallback));
      setCustomMultiplier(fallback);
      customMultiplierRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_MULTIPLIER, Math.max(MIN_CUSTOM_MULTIPLIER, parsed));
    setCustomMultiplierDraft(String(clamped));
    if (clamped !== customMultiplierRef.current) {
      setCustomMultiplier(clamped);
      customMultiplierRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startChallengeSession(
          undefined,
          'custom',
          undefined,
          customDigitsRef.current,
          clamped,
          'exact',
          customMultiplierDigitsRef.current
        );
      } else {
        const newQ = generateProblemForTopic(
          'custom',
          undefined,
          customDigitsRef.current,
          clamped,
          'exact',
          customMultiplierDigitsRef.current
        );
        setQuestion(newQ);
        questionRef.current = newQ;
      }
    }
  };

  // Custom Multiplier Digit Length Textbox handlers
  const handleCustomMultiplierDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setCustomMultiplierDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
        setCustomMultiplierDigits(clamped);
        customMultiplierDigitsRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startChallengeSession(
            undefined,
            'custom',
            undefined,
            customDigitsRef.current,
            customMultiplierRef.current,
            'digits',
            clamped
          );
        } else {
          const newQ = generateProblemForTopic(
            'custom',
            undefined,
            customDigitsRef.current,
            customMultiplierRef.current,
            'digits',
            clamped
          );
          setQuestion(newQ);
          questionRef.current = newQ;
        }
      }
    }
  };

  const commitCustomMultiplierDigits = () => {
    const parsed = parseInt(customMultiplierDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      const fallback = customMultiplierDigitsRef.current >= MIN_CUSTOM_DIGITS ? customMultiplierDigitsRef.current : 2;
      setCustomMultiplierDigitsDraft(String(fallback));
      setCustomMultiplierDigits(fallback);
      customMultiplierDigitsRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setCustomMultiplierDigitsDraft(String(clamped));
    if (clamped !== customMultiplierDigitsRef.current) {
      setCustomMultiplierDigits(clamped);
      customMultiplierDigitsRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startChallengeSession(
          undefined,
          'custom',
          undefined,
          customDigitsRef.current,
          customMultiplierRef.current,
          'digits',
          clamped
        );
      } else {
        const newQ = generateProblemForTopic(
          'custom',
          undefined,
          customDigitsRef.current,
          customMultiplierRef.current,
          'digits',
          clamped
        );
        setQuestion(newQ);
        questionRef.current = newQ;
      }
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
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
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
  const canAnswer = gameStatus === 'running' && challengePhase === 'answering';

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (!canAnswer) return;
      setUserAnswer((prev) => {
        if (prev.length >= 250) return prev;
        return prev + digit;
      });
    },
    [canAnswer]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (!canAnswer) return;
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [canAnswer]);

  const handleKeypadClear = useCallback(() => {
    if (!canAnswer) return;
    setUserAnswer('');
    inputRef.current?.focus();
  }, [canAnswer]);

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAnswer) return;
    const normalized = normalizeAnswerInput(userAnswer);
    if (!normalized) return;
    submitAnswer(normalized);
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

  // Initialize initial question on mount / prop change
  useEffect(() => {
    const topicToUse = initialTopic ?? 'general';
    setSelectedTopic(topicToUse);
    const q = generateProblemForTopic(topicToUse);
    setQuestion(q);
    questionRef.current = q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  // Timer Progress Calculation
  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / activePhaseDuration) * 100));
  const isUrgent = timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5);

  const currentTopicMeta =
    MULTIPLY_11_TOPICS.find((t) => t.id === selectedTopic) ||
    MULTIPLY_11_TOPICS.find((t) => t.id === 'general' && (selectedTopic === 'digit2' || selectedTopic === 'twoDigit11' || selectedTopic === 'general11')) ||
    MULTIPLY_11_TOPICS[0];

  const dynamicTopicLabel =
    selectedTopic === 'custom'
      ? customMultiplierMode === 'digits'
        ? isVi
          ? `Tùy chọn (${customDigits} chữ số × ${customMultiplierDigits} chữ số)`
          : `Custom (${customDigits}-Digit × ${customMultiplierDigits}-Digit)`
        : isVi
        ? `Tùy chọn (${customDigits} chữ số × ${formatBigIntStr(customMultiplier)})`
        : `Custom (${customDigits}-Digit × ${formatBigIntStr(customMultiplier)})`
      : isVi
      ? currentTopicMeta.labelVi
      : currentTopicMeta.labelEn;

  const dynamicTopicBadge =
    selectedTopic === 'custom'
      ? customMultiplierMode === 'digits'
        ? isVi
          ? `${customDigits} chữ số × ${customMultiplierDigits} chữ số`
          : `${customDigits}-Digit × ${customMultiplierDigits}-Digit`
        : isVi
        ? `${customDigits} chữ số × ${formatBigIntStr(customMultiplier)}`
        : `${customDigits}-Digit × ${formatBigIntStr(customMultiplier)}`
      : isVi
      ? currentTopicMeta.badgeVi
      : currentTopicMeta.badgeEn;

  const isCustomLayout = selectedTopic === 'custom';
  const formattedA = formatBigIntStr(question.a);
  const formattedB = formatBigIntStr(question.b);
  const maxDigits = Math.max(question.a.length, question.b.length);
  const totalFormattedLen = formattedA.length + formattedB.length + 3;
  const useStackedFormula = isCustomLayout ? totalFormattedLen > 64 : false;
  const multiplicandLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.a, 10)
    : [formattedA];
  const multiplierLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.b, 10)
    : [formattedB];
  const formulaFontSize = isCustomLayout
    ? totalFormattedLen > 64
      ? 'text-xs sm:text-base md:text-lg lg:text-xl'
      : totalFormattedLen > 48
      ? 'text-xs sm:text-sm md:text-base lg:text-xl'
      : totalFormattedLen > 35
      ? 'text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl'
      : totalFormattedLen > 22
      ? 'text-base sm:text-xl md:text-2xl lg:text-3xl'
      : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl'
    : maxDigits >= 9
    ? 'text-base xs:text-lg sm:text-2xl md:text-3xl'
    : maxDigits >= 6
    ? 'text-lg xs:text-xl sm:text-3xl md:text-4xl'
    : maxDigits >= 4
    ? 'text-xl xs:text-2xl sm:text-4xl md:text-5xl'
    : 'text-2xl xs:text-3xl sm:text-5xl md:text-6xl';

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
          title={isVi ? 'Quay về trang Luyện tập Nhân với 11' : 'Back to Multiply by 11 Practice'}
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
            title={isVi ? 'Về trang Luyện tập Nhân với 11' : 'Go to Multiply by 11 Practice'}
          >
            {isVi ? 'Nhân với số 11' : 'Multiply by 11'}
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficult Level Challenge'}</span>
          </span>
        </div>
      </div>

      {/* Main Challenge Arena Container */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode ? 'border-rose-500/45 to-rose-950/35' : 'border-amber-500/35 to-amber-950/30'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-amber-500/10'
          }`}
        />

        {/* Top Header Row: Title, Mode Toggles & Sound */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                hardMode
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25'
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
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {dynamicTopicBadge}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? isVi
                    ? 'Cấp độ khó: nhiều chữ số hơn, nhớ liên tục, phản xạ tốc độ cao'
                    : 'Hard mode: more digits, frequent carries, faster pace'
                  : isVi
                  ? 'Thử thách phản xạ tính nhẩm siêu tốc nhân với 11 từ 2s đến 12s'
                  : 'Speed mental calculation challenge multiplying by 11 within 2s to 12s'}
              </p>
            </div>
          </div>

          {/* Right Controls: Limit & Answer Textboxes & Speaker Toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <DifficultyTimerInputs
              timeLimit={timeLimit}
              answerTimeLimit={answerTimeLimit}
              disabled={gameStatus === 'running'}
              isVi={isVi}
              clockIconClassName="text-amber-400"
              limitFocusClassName="focus:border-amber-400"
              onChangeTimeLimit={(sec) => {
                handleSelectTimeLimit(sec);
                if (gameStatus === 'idle') setTimeLeft(sec);
              }}
              onChangeAnswerTimeLimit={(sec) => handleSelectAnswerTimeLimit(sec)}
            />

            <AutoNextSettingButton pageKey="MultiplyBy11DifficultyChallengePage" />

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

        {/* 9 Topic Selector Buttons + Custom Option */}
        <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
            {MULTIPLY_11_TOPICS.map((topic) => {
              const isSelected =
                selectedTopic === topic.id ||
                (topic.id === 'general' &&
                  (selectedTopic === 'general11' ||
                    selectedTopic === 'digit2' ||
                    selectedTopic === 'twoDigit11'));
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopic(topic.id)}
                  title={isVi ? topic.fullNameVi : topic.fullNameEn}
                  className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                      : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                  }`}
                >
                  <span className="text-sm shrink-0">{topic.icon}</span>
                  <span className="truncate whitespace-nowrap">{isVi ? topic.labelVi : topic.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Custom Topic Selection + 2 Textboxes (Độ dài Chữ số & Nhân với số tùy chọn) */}
          <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectTopic('custom')}
              title={
                isVi
                  ? 'Tùy chọn độ dài chữ số và nhân với số tùy ý'
                  : 'Custom digit length and multiplier'
              }
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                selectedTopic === 'custom'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${
                  selectedTopic === 'custom' ? 'text-slate-950' : 'text-amber-400'
                }`}
              />
              <span className="whitespace-nowrap">
                {isVi ? 'Tùy chọn (Chữ số & Số nhân)' : 'Custom (Digits & Multiplier)'}
              </span>
            </button>

            {selectedTopic === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                {/* Textbox 1: Độ dài Chữ số */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/35">
                  <label
                    htmlFor="mul11-custom-digit-length"
                    className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                  >
                    {isVi ? 'Độ dài Chữ số:' : 'Digit length:'}
                  </label>
                  <input
                    id="mul11-custom-digit-length"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={customDigitsDraft}
                    onFocus={(e) => e.target.select()}
                    onChange={handleCustomDigitsChange}
                    onBlur={commitCustomDigits}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    aria-label={isVi ? 'Độ dài chữ số (1 - 100)' : 'Digit length (1 - 100)'}
                    title={isVi ? 'Nhập độ dài chữ số (từ 1 đến 100)' : 'Enter digit length (1 to 100)'}
                    className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors"
                  />
                </div>

                {/* Textbox 2: Nhân với số tùy chọn (2 options: Số đích danh | Độ dài chữ số) */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                  <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none">
                    {isVi ? 'Nhân với số tùy chọn:' : 'Custom multiplier:'}
                  </span>

                  <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleCustomMultiplierModeChange('exact')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                        customMultiplierMode === 'exact'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {isVi ? 'Số đích danh' : 'Exact Number'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCustomMultiplierModeChange('digits')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                        customMultiplierMode === 'digits'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {isVi ? 'Độ dài chữ số' : 'Digit Length'}
                    </button>
                  </div>

                  {customMultiplierMode === 'exact' ? (
                    <input
                      id="mul11-custom-multiplier-value"
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={customMultiplierDraft}
                      onFocus={(e) => e.target.select()}
                      onChange={handleCustomMultiplierChange}
                      onBlur={commitCustomMultiplier}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      aria-label={isVi ? 'Nhân với số đích danh' : 'Exact custom multiplier'}
                      title={
                        isVi
                          ? 'Nhập số nhân đích danh tùy chọn (VD: 7, 11, 99, 125...)'
                          : 'Enter exact custom multiplier (e.g. 7, 11, 99, 125...)'
                      }
                      className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors"
                    />
                  ) : (
                    <input
                      id="mul11-custom-multiplier-digits"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={customMultiplierDigitsDraft}
                      onFocus={(e) => e.target.select()}
                      onChange={handleCustomMultiplierDigitsChange}
                      onBlur={commitCustomMultiplierDigits}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      aria-label={
                        isVi
                          ? 'Độ dài chữ số của số nhân (1 - 100)'
                          : 'Multiplier digit length (1 - 100)'
                      }
                      title={
                        isVi
                          ? 'Nhập độ dài chữ số của số nhân (từ 1 đến 100)'
                          : 'Enter multiplier digit length (1 to 100)'
                      }
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
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

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>{isVi ? 'Hoàn thành thử thách 10 phép nhân với 11!' : '10-Problem Multiply by 11 Challenge Completed!'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {isVi
                  ? `Chuyên đề: ${dynamicTopicLabel}${hardMode ? ' (Cấp độ Khó)' : ''} • Quan sát: ${timeLimit}s • Trả lời: ${answerTimeLimit}s`
                  : `Topic: ${dynamicTopicLabel}${hardMode ? ' (Hard Level)' : ''} • Observe: ${timeLimit}s • Answer: ${answerTimeLimit}s`}
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
                <div className="max-w-xl mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{isVi ? 'Chi tiết 10 phép nhân' : 'Problem Breakdown'}</span>
                    <span>{isVi ? 'Kết quả' : 'Result'}</span>
                  </div>
                  <div className={isCustomLayout ? 'max-h-56 overflow-y-auto space-y-1.5 text-xs' : 'grid grid-cols-2 gap-2 text-xs'}>
                    {roundHistory.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium break-all">
                          #{item.qIndex}: {formatBigIntStr(item.a)} × {formatBigIntStr(item.b)}
                        </span>
                        <span className="font-bold font-mono break-all shrink-0">
                          {item.isCorrect ? '✓' : `✗ (${formatBigIntStr(computeExactProduct(item.a, item.b))})`}
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
                } rounded-3xl bg-slate-950 border border-slate-800 p-5 sm:p-7 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center`}
              >
                {/* Top Timer Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : challengePhase === 'answering'
                        ? 'bg-cyan-400'
                        : timeLimit <= 4
                        ? 'bg-purple-400'
                        : timeLimit <= 8
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${gameStatus === 'idle' ? 100 : timerPercentage}%` }}
                  />
                </div>

                {/* Badges: Topic, Question Progress 10/10, and Countdown */}
                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    {dynamicTopicBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25">
                    <span>{isVi ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS}` : `Problem ${currentQuestionIndex}/${TOTAL_QUESTIONS}`}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                      isUrgent && gameStatus === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : challengePhase === 'answering' && gameStatus === 'running'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer className={`w-3 h-3 ${isUrgent && gameStatus === 'running' ? 'text-rose-400' : challengePhase === 'answering' && gameStatus === 'running' ? 'text-cyan-400' : 'text-amber-400'}`} />
                    <span className="font-mono">
                      {gameStatus === 'idle'
                        ? `${timeLimit}s`
                        : gameStatus === 'running'
                        ? challengePhase === 'answering'
                          ? `${isVi ? 'Trả lời' : 'Answer'}: ${timeLeft}s`
                          : `${isVi ? 'Quan sát' : 'Observe'}: ${timeLeft}s`
                        : `${timeLeft}s`}
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

                {/* Math Formula Display (Nhân với 11) with Speaker Button & Speed Selector */}
                <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-3 w-full">
                  {gameStatus === 'idle' ? (
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
                  ) : gameStatus === 'running' && challengePhase === 'answering' ? (
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
                            {multiplicandLines.map((line, idx) => (
                              <span key={idx} className="whitespace-nowrap">
                                {line}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-3 pt-1 max-w-full">
                            <div
                              className={`font-black text-white font-mono tabular-nums flex items-start justify-center gap-2 tracking-tight ${
                                question.b.length >= 30
                                  ? 'text-xs sm:text-base md:text-lg lg:text-xl'
                                  : question.b.length >= 12
                                  ? 'text-sm sm:text-lg md:text-xl lg:text-2xl'
                                  : question.b.length >= 7
                                  ? 'text-base sm:text-xl md:text-2xl'
                                  : 'text-xl sm:text-2xl md:text-3xl'
                              }`}
                            >
                              <span className="text-amber-400 font-sans shrink-0">×</span>
                              <div className="flex flex-col items-center justify-center gap-1 leading-snug">
                                {multiplierLines.map((line, idx) => (
                                  <span key={idx} className="whitespace-nowrap">
                                    {line}
                                  </span>
                                ))}
                              </div>
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
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-full overflow-x-auto no-scrollbar py-1">
                          <div className={`font-black text-white font-mono tabular-nums flex items-center justify-center whitespace-nowrap gap-1.5 sm:gap-2.5 tracking-tight select-none shrink-0 ${formulaFontSize}`}>
                            <span>{formatBigIntStr(question.a)}</span>
                            <span className="text-amber-400 font-sans">×</span>
                            <span>{formatBigIntStr(question.b)}</span>
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
                      )}

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
                    </>
                  )}
                </div>

                {/* Immediate Result Feedback Badge */}
                {feedback === 'correct' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {question.answer.length > 15
                        ? isVi
                          ? `Chính xác: ${formatBigIntStr(question.answer)}`
                          : `Correct: ${formatBigIntStr(question.answer)}`
                        : isVi
                        ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Correct: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {question.answer.length > 15
                        ? isVi
                          ? `Chưa chính xác: ${formatBigIntStr(question.answer)}`
                          : `Incorrect: ${formatBigIntStr(question.answer)}`
                        : isVi
                        ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="break-all font-mono sm:font-sans">
                      {question.answer.length > 15
                        ? isVi
                          ? `Hết giờ!: ${formatBigIntStr(question.answer)}`
                          : `Time's up!: ${formatBigIntStr(question.answer)}`
                        : isVi
                        ? `Hết giờ!: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Time's up!: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Input Form */}
              <form
                onSubmit={handleSubmit}
                className={`${
                  isCustomLayout
                    ? 'w-full max-w-2xl mx-auto'
                    : 'landscape-math-col md:col-span-6'
                } flex flex-col justify-center space-y-3`}
              >
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
                    } font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
                      canAnswer
                        ? isListening
                          ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                          : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                        : 'border-slate-850 opacity-60 cursor-not-allowed'
                    }`}
                  />
                  {userAnswer && canAnswer && (
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

                {/* Bàn phím số từ 0 đến 9: 2 hàng 6 cột nhỏ gọn */}
                <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
                  <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                    {/* Hàng 1: 1, 2, 3, 4, 5, 6 */}
                    {[1, 2, 3, 4, 5, 6].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadDigit(String(digit))}
                        disabled={!canAnswer}
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
                        disabled={!canAnswer}
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
                      disabled={!canAnswer || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                    >
                      {isVi ? 'Xóa' : 'Clear'}
                    </button>

                    {/* Xóa 1 số lùi */}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      disabled={!canAnswer || !userAnswer}
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
                        ? '🎙️ Hãy đọc to đáp án (VD: "bảy bốn tám", "748",...)'
                        : '🎙️ Speak answer aloud (e.g. "seven four eight", "748",...)'}
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
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {gameStatus === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => startChallengeSession()}
                      className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{isVi ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} phép nhân)` : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}</span>
                    </button>
                  ) : gameStatus === 'answered' ? (
                    currentQuestionIndex < TOTAL_QUESTIONS ? (
                      <button
                        type="button"
                        onClick={goToNextQuestion}
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                      >
                        <span>
                          {autoNextConfig.delaySec > 0
                            ? isVi
                              ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                              : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                            : isVi
                            ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`
                            : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`}
                        </span>
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
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
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
                      className="flex-1 min-w-[130px] h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 text-xs sm:text-sm"
                    >
                      <span>{isVi ? 'Kết quả' : 'Submit Answer'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Trả lời bằng Voice button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!canAnswer}
                    title={isVi ? 'Trả lời bằng giọng nói' : 'Answer by voice'}
                    className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
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
                        <span>{isVi ? 'Trả lời' : 'Voice'}</span>
                      </>
                    )}
                  </button>

                  {/* Start Challenge Question button */}
                  <button
                    type="button"
                    onClick={() => startChallengeSession()}
                    title={isVi ? 'Bắt đầu câu hỏi thử thách' : 'Start challenge question'}
                    className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
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
