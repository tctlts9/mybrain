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

export type Multiply1DigitTopic =
  | 'general'
  | 'digit2'
  | 'digit3'
  | 'digit4'
  | 'digit5'
  | 'digit6'
  | 'digit7'
  | 'digit8'
  | 'digit9'
  | 'digit10'
  | 'mul2'
  | 'mul3'
  | 'mul4'
  | 'mul5'
  | 'mul6'
  | 'mul7'
  | 'mul8'
  | 'mul9'
  | 'custom';

export interface TopicOption {
  id: Multiply1DigitTopic;
  digits: number;
  multiplier?: number;
  labelVi: string;
  labelEn: string;
  fullNameVi: string;
  fullNameEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

export const MULTIPLY_1_DIGIT_TOPICS: TopicOption[] = [
  {
    id: 'general',
    digits: 0,
    labelVi: 'Tổng quát',
    labelEn: 'General',
    fullNameVi: 'Nhân 1 chữ số tổng quát (ngẫu nhiên 2 - 10 chữ số × [2..9])',
    fullNameEn: 'General: 2 - 10 Digits × 1-Digit',
    icon: '⚡',
    badgeVi: 'Tổng quát: 2 - 10 chữ số × [2..9]',
    badgeEn: 'General: 2 - 10 Digits × [2..9]',
  },
  {
    id: 'digit2',
    digits: 2,
    labelVi: '2 Chữ số',
    labelEn: '2-Digit',
    fullNameVi: 'Nhân 2 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 2-Digit by 1-Digit',
    icon: '🔢',
    badgeVi: '2 chữ số × [2..9]',
    badgeEn: '2-Digit × [2..9]',
  },
  {
    id: 'digit3',
    digits: 3,
    labelVi: '3 Chữ số',
    labelEn: '3-Digit',
    fullNameVi: 'Nhân 3 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 3-Digit by 1-Digit',
    icon: '✨',
    badgeVi: '3 chữ số × [2..9]',
    badgeEn: '3-Digit × [2..9]',
  },
  {
    id: 'digit4',
    digits: 4,
    labelVi: '4 Chữ số',
    labelEn: '4-Digit',
    fullNameVi: 'Nhân 4 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 4-Digit by 1-Digit',
    icon: '🚀',
    badgeVi: '4 chữ số × [2..9]',
    badgeEn: '4-Digit × [2..9]',
  },
  {
    id: 'digit5',
    digits: 5,
    labelVi: '5 Chữ số',
    labelEn: '5-Digit',
    fullNameVi: 'Nhân 5 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 5-Digit by 1-Digit',
    icon: '⭐',
    badgeVi: '5 chữ số × [2..9]',
    badgeEn: '5-Digit × [2..9]',
  },
  {
    id: 'digit6',
    digits: 6,
    labelVi: '6 Chữ số',
    labelEn: '6-Digit',
    fullNameVi: 'Nhân 6 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 6-Digit by 1-Digit',
    icon: '🎯',
    badgeVi: '6 chữ số × [2..9]',
    badgeEn: '6-Digit × [2..9]',
  },
  {
    id: 'digit7',
    digits: 7,
    labelVi: '7 Chữ số',
    labelEn: '7-Digit',
    fullNameVi: 'Nhân 7 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 7-Digit by 1-Digit',
    icon: '🔥',
    badgeVi: '7 chữ số × [2..9]',
    badgeEn: '7-Digit × [2..9]',
  },
  {
    id: 'digit8',
    digits: 8,
    labelVi: '8 Chữ số',
    labelEn: '8-Digit',
    fullNameVi: 'Nhân 8 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 8-Digit by 1-Digit',
    icon: '💎',
    badgeVi: '8 chữ số × [2..9]',
    badgeEn: '8-Digit × [2..9]',
  },
  {
    id: 'digit9',
    digits: 9,
    labelVi: '9 Chữ số',
    labelEn: '9-Digit',
    fullNameVi: 'Nhân 9 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 9-Digit by 1-Digit',
    icon: '🏆',
    badgeVi: '9 chữ số × [2..9]',
    badgeEn: '9-Digit × [2..9]',
  },
  {
    id: 'digit10',
    digits: 10,
    labelVi: '10 Chữ số',
    labelEn: '10-Digit',
    fullNameVi: 'Nhân 10 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 10-Digit by 1-Digit',
    icon: '👑',
    badgeVi: '10 chữ số × [2..9]',
    badgeEn: '10-Digit × [2..9]',
  },
  ...([2, 3, 4, 5, 6, 7, 8, 9] as const).map((m) => ({
    id: `mul${m}` as Multiply1DigitTopic,
    digits: 0,
    multiplier: m,
    labelVi: `Nhân với  ${m}`,
    labelEn: `Multiply by ${m}`,
    fullNameVi: `Nhân với  ${m} (2 - 10 chữ số × ${m})`,
    fullNameEn: `Multiply 2 - 10 Digits by ${m}`,
    icon: '✖️',
    badgeVi: `Nhân với số ${m}`,
    badgeEn: `Multiply by ${m}`,
  })),
  {
    id: 'custom',
    digits: 0,
    labelVi: 'Tùy chọn',
    labelEn: 'Custom',
    fullNameVi: 'Tùy chọn độ dài chữ số & số nhân',
    fullNameEn: 'Custom digit length & multiplier',
    icon: '🎛️',
    badgeVi: 'Tùy chọn',
    badgeEn: 'Custom',
  },
];

interface MultiplyWith1DigitDifficultyChallengePageProps {
  onBack: () => void;
  initialTopic?: Multiply1DigitTopic;
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
type CustomMultiplierMode = 'exact' | 'digits';

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
    let s = String(Math.floor(Math.random() * 7) + 3); // 3..9
    for (let i = 1; i < digits; i++) {
      s += String(Math.floor(Math.random() * 8) + 2); // 2..9 (avoid trivial 0/1)
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

export const MultiplyWith1DigitDifficultyChallengePage: React.FC<MultiplyWith1DigitDifficultyChallengePageProps> = ({
  onBack,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('MultiplyWith1DigitDifficultyChallengePage');

  const hardMode = true;

  // Topic selection: Tổng quát (General), 2-10 chữ số, Nhân 2..9, hoặc Tùy chọn
  const [selectedTopic, setSelectedTopic] = useState<Multiply1DigitTopic>(initialTopic ?? 'general');
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [customMultiplierMode, setCustomMultiplierMode] = useState<CustomMultiplierMode>('exact');
  const [customMultiplier, setCustomMultiplier] = useState<number>(7);
  const [customMultiplierDigits, setCustomMultiplierDigits] = useState<number>(2);
  const [customDigitsDraft, setCustomDigitsDraft] = useState<string>('3');
  const [customMultiplierDraft, setCustomMultiplierDraft] = useState<string>('7');
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
  const [question, setQuestion] = useState<Question>({ a: '74', b: '6', answer: '444' });
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
  const isEditingCustomDigitsRef = useRef<boolean>(false);
  const isEditingCustomMultiplierRef = useRef<boolean>(false);
  const isEditingCustomMultiplierDigitsRef = useRef<boolean>(false);

  // Generate random problem based on Selected Topic for Multiply by 1-Digit / Custom
  const generateProblemForTopic = useCallback(
    (
      topicToUse?: Multiply1DigitTopic,
      hardOverride?: boolean,
      customDigitsOverride?: number,
      customMultiplierOverride?: number,
      customMultiplierModeOverride?: CustomMultiplierMode,
      customMultiplierDigitsOverride?: number
    ): Question => {
      const active = topicToUse ?? selectedTopic;
      const activeHard = hardOverride ?? hardMode;
      const isCustom = active === 'custom';
      const isGeneral = active === 'general';
      const multiplierMatch = active.match(/^mul([2-9])$/);
      const fixedMultiplier = multiplierMatch ? Number(multiplierMatch[1]) : null;

      let digits = 2;
      if (isCustom) {
        digits = Math.min(
          MAX_CUSTOM_DIGITS,
          Math.max(MIN_CUSTOM_DIGITS, customDigitsOverride ?? customDigitsRef.current)
        );
      } else if (isGeneral || fixedMultiplier !== null) {
        // Hard: 6-10 digits; Normal: 2-10 digits
        digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;
      } else if (active === 'digit2') digits = 2;
      else if (active === 'digit3') digits = 3;
      else if (active === 'digit4') digits = 4;
      else if (active === 'digit5') digits = 5;
      else if (active === 'digit6') digits = 6;
      else if (active === 'digit7') digits = 7;
      else if (active === 'digit8') digits = 8;
      else if (active === 'digit9') digits = 9;
      else if (active === 'digit10') digits = 10;
      else digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;

      const multiDigitStr = buildRandomDigitString(digits, activeHard);

      if (isCustom) {
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
                  Math.max(MIN_CUSTOM_MULTIPLIER, customMultiplierOverride ?? customMultiplierRef.current)
                )
              );
        return {
          a: multiDigitStr,
          b: multStr,
          answer: computeExactProduct(multiDigitStr, multStr),
        };
      }

      // Fixed multiplier if mul2..mul9 selected, else Hard: 6..9 / Normal: 2..9
      const singleDigit =
        fixedMultiplier ??
        (activeHard ? Math.floor(Math.random() * 4) + 6 : Math.floor(Math.random() * 8) + 2);

      let a = multiDigitStr;
      let b = String(singleDigit);
      if (isGeneral || Math.random() < 0.35) {
        const isSingleDigitFirst = Math.random() < 0.5;
        if (isSingleDigitFirst) {
          a = String(singleDigit);
          b = multiDigitStr;
        } else {
          a = multiDigitStr;
          b = String(singleDigit);
        }
      }

      return {
        a,
        b,
        answer: computeExactProduct(a, b),
      };
    },
    [selectedTopic, hardMode]
  );

  // Announce result
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

  // Pronounce Question
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

  // Replay announcement
  const replayAnnouncement = useCallback(() => {
    if (feedback === 'correct') {
      announceResult(true, question.answer);
    } else if (feedback === 'incorrect' || feedback === 'timeout') {
      announceResult(false, question.answer);
    }
  }, [feedback, question.answer, announceResult]);

  // Voice Recognition Control
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const handleTimeout = useCallback(() => {
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setFeedback('timeout');
    setGameStatus('answered');
    setIncorrectCount((prev) => prev + 1);
    setWrongStreak((prev) => prev + 1);
    setStreak(0);
    setTotalAttempts((prev) => prev + 1);

    setRoundHistory((prev) => [
      ...prev,
      {
        qIndex: currentQuestionIndex,
        a: questionRef.current.a,
        b: questionRef.current.b,
        userAnswer: isVi ? 'Hết giờ' : 'Time out',
        isCorrect: false,
      },
    ]);

    announceResult(false, questionRef.current.answer);
  }, [announceResult, currentQuestionIndex, isVi, stopListening]);

  // Verify answer
  const verifyAnswer = useCallback(
    (rawInput: string | number) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopListening();

      const normalizedInput = normalizeAnswerInput(String(rawInput));
      const isCorrect = normalizedInput !== '' && normalizedInput === questionRef.current.answer;
      setGameStatus('answered');
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          userAnswer: normalizedInput || String(rawInput),
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
        const earnedPoints = Math.max(10, (14 - timeLimit) * 5);
        setScore((prev) => prev + earnedPoints);
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        setIncorrectCount((prev) => prev + 1);
        setWrongStreak((prev) => prev + 1);
        setStreak(0);
        announceResult(false, questionRef.current.answer);
      }
    },
    [announceResult, currentQuestionIndex, stopListening, timeLimit]
  );

  // Start voice recognition
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
        verifyAnswer(String(parsedNum));
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

  // Transition to Answering Phase
  const beginAnsweringPhase = useCallback(
    (explicitAnswerLimit?: AnswerTimeLimit) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const activeAnswerLimit = explicitAnswerLimit ?? answerTimeLimitRef.current;
      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(activeAnswerLimit);

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [handleTimeout]
  );

  // Start Countdown Timer for problem (Observation -> Answering)
  const startTimer = useCallback(
    (limitOverride?: TimeLimit, answerLimitOverride?: AnswerTimeLimit) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const activeLimit = limitOverride ?? timeLimit;
      setChallengePhase('observing');
      challengePhaseRef.current = 'observing';
      setTimeLeft(activeLimit);

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            beginAnsweringPhase(answerLimitOverride);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [beginAnsweringPhase, timeLimit]
  );

  // Load next question or finish round
  const goToNextQuestion = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();

    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
      setGameStatus('completed');
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setGameStatus('running');
    startTimer();
  }, [
    currentQuestionIndex,
    generateProblemForTopic,
    selectedTopic,
    startTimer,
    stopListening,
  ]);

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

  // Start a new Challenge Round (10 Questions)
  const startNewChallenge = useCallback(
    (
      topicOverride?: Multiply1DigitTopic,
      hardOverride?: boolean,
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit,
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
      stopListening();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const topicToUse = topicOverride ?? selectedTopic;
      setSelectedTopic(topicToUse);
      setCurrentQuestionIndex(1);
      setRoundHistory([]);
      setScore(0);
      setStreak(0);
      setWrongStreak(0);
      setBestStreak(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setIncorrectCount(0);

      const newQ = generateProblemForTopic(
        topicToUse,
        hardOverride,
        customDigitsOverride,
        customMultiplierOverride,
        customMultiplierModeOverride,
        customMultiplierDigitsOverride
      );
      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setGameStatus('running');
      startTimer(limitOverride, answerLimitOverride);
    },
    [generateProblemForTopic, selectedTopic, startTimer, stopListening]
  );

  // Reset Challenge back to idle state (hide question until Start is clicked)
  const handleReset = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    const newQ = generateProblemForTopic(
      selectedTopic,
      undefined,
      customDigitsRef.current,
      customMultiplierRef.current,
      customMultiplierModeRef.current,
      customMultiplierDigitsRef.current
    );
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
    setTimeLeft(timeLimit);
    setGameStatus('idle');
  }, [generateProblemForTopic, selectedTopic, stopListening, timeLimit]);

  // Switch topic
  const handleSelectTopic = (newTopic: Multiply1DigitTopic) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setSelectedTopic(newTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNewChallenge(newTopic);
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
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            clamped,
            customMultiplierRef.current,
            customMultiplierModeRef.current,
            customMultiplierDigitsRef.current
          );
        }
      }
    }
  };

  const commitCustomDigits = () => {
    isEditingCustomDigitsRef.current = false;
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
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          clamped,
          customMultiplierRef.current,
          customMultiplierModeRef.current,
          customMultiplierDigitsRef.current
        );
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
      startNewChallenge(
        'custom',
        undefined,
        undefined,
        undefined,
        customDigitsRef.current,
        customMultiplierRef.current,
        mode,
        customMultiplierDigitsRef.current
      );
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
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            customDigitsRef.current,
            clamped,
            'exact',
            customMultiplierDigitsRef.current
          );
        }
      }
    }
  };

  const commitCustomMultiplier = () => {
    isEditingCustomMultiplierRef.current = false;
    const parsed = parseInt(customMultiplierDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_MULTIPLIER) {
      const fallback = customMultiplierRef.current >= MIN_CUSTOM_MULTIPLIER ? customMultiplierRef.current : 7;
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
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          customDigitsRef.current,
          clamped,
          'exact',
          customMultiplierDigitsRef.current
        );
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
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            customDigitsRef.current,
            customMultiplierRef.current,
            'digits',
            clamped
          );
        }
      }
    }
  };

  const commitCustomMultiplierDigits = () => {
    isEditingCustomMultiplierDigitsRef.current = false;
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
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          customDigitsRef.current,
          customMultiplierRef.current,
          'digits',
          clamped
        );
      }
    }
  };

  // Switch Time Limit (2s - 12s)
  const handleSelectTimeLimit = (limit: TimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setTimeLimit(limit);
    if (gameStatus === 'running') {
      startTimer(limit);
    }
  };

  // Switch Answer Time Limit
  const handleSelectAnswerTimeLimit = (limit: AnswerTimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAnswerTimeLimit(limit);
    answerTimeLimitRef.current = limit;
    if (gameStatus === 'running' && challengePhaseRef.current === 'answering') {
      beginAnsweringPhase(limit);
    }
  };

  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const topicToUse = initialTopic ?? 'general';
    setSelectedTopic(topicToUse);
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    const newQ = generateProblemForTopic(
      topicToUse,
      undefined,
      customDigitsRef.current,
      customMultiplierRef.current
    );
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
    setTimeLeft(timeLimit);
    setGameStatus('idle');
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      stopCurrentSpeech();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  // Virtual Keypad handlers (up to 24 digits for large custom products)
  const canAnswer = gameStatus === 'running' && challengePhase === 'answering';

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (!canAnswer) return;
      if (feedback === 'incorrect') {
        setFeedback('idle');
      }
      setUserAnswer((prev) => {
        if (prev.length >= 250) return prev;
        return prev + digit;
      });
    },
    [feedback, canAnswer]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAnswer) return;
    const normalized = normalizeAnswerInput(userAnswer);
    if (!normalized) return;
    verifyAnswer(normalized);
  };

  const currentTopicMeta =
    MULTIPLY_1_DIGIT_TOPICS.find((m) => m.id === selectedTopic) || MULTIPLY_1_DIGIT_TOPICS[0];

  const dynamicTopicFullName =
    selectedTopic === 'custom'
      ? customMultiplierMode === 'digits'
        ? isVi
          ? `Tùy chọn: ${customDigits} chữ số × ${customMultiplierDigits} chữ số`
          : `Custom: ${customDigits}-Digit × ${customMultiplierDigits}-Digit`
        : isVi
        ? `Tùy chọn: ${customDigits} chữ số × ${formatBigIntStr(customMultiplier)}`
        : `Custom: ${customDigits}-Digit × ${formatBigIntStr(customMultiplier)}`
      : isVi
      ? currentTopicMeta.fullNameVi
      : currentTopicMeta.fullNameEn;

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
  const totalFormulaDigits = question.a.length + question.b.length;
  const maxDigits = Math.max(question.a.length, question.b.length);
  const totalFormattedLen = formattedA.length + formattedB.length + 3;
  const useStackedFormula = isCustomLayout ? totalFormattedLen > 64 : totalFormulaDigits >= 14;
  const multiplicandLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.a, isCustomLayout ? 10 : 5)
    : [formattedA];
  const multiplierLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.b, isCustomLayout ? 10 : 5)
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
    : question.a.length >= 61
    ? 'text-sm sm:text-base md:text-lg'
    : question.a.length >= 31
    ? 'text-sm sm:text-lg md:text-xl'
    : totalFormulaDigits >= 14 || maxDigits >= 11
    ? 'text-base sm:text-xl md:text-2xl'
    : maxDigits >= 9
    ? 'text-lg sm:text-2xl md:text-3xl'
    : maxDigits >= 6
    ? 'text-xl sm:text-3xl md:text-4xl'
    : maxDigits >= 4
    ? 'text-2xl sm:text-4xl md:text-5xl'
    : 'text-3xl sm:text-5xl md:text-6xl';

  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const timerColor =
    timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5)
      ? 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : challengePhase === 'answering'
      ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
      : timeLeft <= (timeLimit <= 4 ? 2 : timeLimit <= 8 ? 4 : 5)
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Audio Speaker toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isSpeakerEnabled;
              setIsSpeakerEnabled(next);
              if (next) playSpeakerChime('correct');
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${
              isSpeakerEnabled
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs ring-1 ring-amber-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
            title={
              isSpeakerEnabled
                ? isVi
                  ? 'Đang bật loa đọc đáp án'
                  : 'Speaker ON'
                : isVi
                ? 'Đang tắt loa'
                : 'Speaker OFF'
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
              {isSpeakerEnabled ? (isVi ? 'Loa: Bật' : 'Voice: ON') : isVi ? 'Loa: Tắt' : 'Voice: OFF'}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Nhân với 1 chữ số' : 'Multiply by 1-Digit'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficult Level Challenge'}</span>
          </span>
          </div>
        </div>
      </div>

      {/* Main Challenge Container */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode ? 'border-rose-500/45 to-rose-950/35' : 'border-amber-500/30 to-amber-950/30'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-amber-500/10'
          }`}
        />

        {/* Header: Title + Mode Settings (2s - 12s) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                hardMode ? 'bg-rose-500/20 border-rose-500/40' : 'bg-amber-500/20 border-amber-500/30'
              }`}
            >
              {hardMode ? (
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
              ) : (
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficult Level Challenge'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {hardMode
                  ? isVi
                    ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Cấp độ khó (×6 đến ×9, số lớn)`
                    : `Question ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Hard mode (×6 to ×9, larger numbers)`
                  : isVi
                  ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Thử thách tính nhanh`
                  : `Question ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Blitz math trial`}
              </p>
            </div>
          </div>

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
            <AutoNextSettingButton pageKey="MultiplyWith1DigitDifficultyChallengePage" />
          </div>
        </div>

        {/* Group Buttons: Lựa chọn bài training theo yêu cầu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 gap-2 flex-wrap">
            <span>{isVi ? 'Chọn chuyên đề thử thách:' : 'Select challenge topic:'}</span>
            <span className="text-amber-400/90 text-[11px]">{dynamicTopicFullName}</span>
          </div>

          <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
              {MULTIPLY_1_DIGIT_TOPICS.filter((m) => !m.multiplier && m.id !== 'custom').map((mode) => {
                const isSelected = selectedTopic === mode.id;
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

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 pt-1.5 border-t border-slate-800/70">
              {MULTIPLY_1_DIGIT_TOPICS.filter((m) => Boolean(m.multiplier)).map((mode) => {
                const isSelected = selectedTopic === mode.id;
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
                    <span className="text-xs shrink-0">{mode.icon}</span>
                    <span className="truncate whitespace-nowrap">{isVi ? mode.labelVi : mode.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 3: Custom Topic Selection + 2 Textboxes (Độ dài Chữ số & Nhân với số tùy chọn) */}
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
                      htmlFor="custom-digit-length"
                      className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                    >
                      {isVi ? 'Độ dài Chữ số:' : 'Digit length:'}
                    </label>
                    <input
                      id="custom-digit-length"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={customDigitsDraft}
                      onFocus={(e) => {
                        isEditingCustomDigitsRef.current = true;
                        e.target.select();
                      }}
                      onChange={handleCustomDigitsChange}
                      onBlur={commitCustomDigits}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
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
                        id="custom-multiplier-value"
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        value={customMultiplierDraft}
                        onFocus={(e) => {
                          isEditingCustomMultiplierRef.current = true;
                          e.target.select();
                        }}
                        onChange={handleCustomMultiplierChange}
                        onBlur={commitCustomMultiplier}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        aria-label={isVi ? 'Nhân với số đích danh' : 'Exact custom multiplier'}
                        title={
                          isVi
                            ? 'Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 125...)'
                            : 'Enter exact custom multiplier (e.g. 7, 12, 99, 125...)'
                        }
                        className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors"
                      />
                    ) : (
                      <input
                        id="custom-multiplier-digits"
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={customMultiplierDigitsDraft}
                        onFocus={(e) => {
                          isEditingCustomMultiplierDigitsRef.current = true;
                          e.target.select();
                        }}
                        onChange={handleCustomMultiplierDigitsChange}
                        onBlur={commitCustomMultiplierDigits}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
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
        </div>

        {/* Live Score & Streak Bar */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {isVi ? 'Điểm số' : 'Score'}
            </span>
            <span className="text-base sm:text-xl font-black text-amber-400 font-mono">
              {score}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{isVi ? 'Chuỗi đúng' : 'Streak'}</span>
            </span>
            <span className="text-base sm:text-xl font-black text-orange-400 font-mono">
              {streak}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span>{isVi ? 'Kỷ lục chuỗi' : 'Best'}</span>
            </span>
            <span className="text-base sm:text-xl font-black text-yellow-400 font-mono">
              {bestStreak}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {isVi ? 'Đúng / Tổng' : 'Accuracy'}
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">
              {correctCount}/{totalAttempts}
            </span>
          </div>
        </div>

        {/* If Challenge Completed: Show Summary Screen */}
        {gameStatus === 'completed' ? (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950/90 border border-amber-500/40 p-6 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2 flex-wrap">
                <span>{isVi ? 'Hoàn Thành Lượt Thử Thách!' : 'Challenge Completed!'}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{isVi ? 'Cấp độ Khó' : 'Hard Level'}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {isVi
                  ? `Bạn đã hoàn thành 10 câu${hardMode ? ' (Cấp độ Khó)' : ''} với số điểm ${score} • Chuỗi đúng cao nhất: ${bestStreak}`
                  : `You finished 10 questions${hardMode ? ' (Hard Level)' : ''} with ${score} pts • Best streak: ${bestStreak}`}
              </p>
            </div>

            {/* History Table */}
            <div className="max-w-xl mx-auto max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              {roundHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 rounded-lg bg-slate-950/60 text-left"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="font-mono text-slate-400 shrink-0">#{h.qIndex}</span>
                    <span className="font-mono font-bold text-white break-all">
                      {formatBigIntStr(h.a)} × {formatBigIntStr(h.b)} = {formatBigIntStr(computeExactProduct(h.a, h.b))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 max-w-full">
                    <span className="font-mono text-slate-300 break-all">
                      {h.userAnswer ? formatBigIntStr(h.userAnswer) : '—'}
                    </span>
                    {h.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startNewChallenge()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isVi ? 'Thử Thách Lại' : 'Try Again'}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isVi ? 'Về Luyện Tập' : 'Practice Page'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Math Problem Arena — 1-Column Stacked for Custom, Side-by-Side on Desktop for Presets */
          <div
            className={
              isCustomLayout
                ? 'flex flex-col gap-4 md:gap-5 pt-0.5'
                : 'landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5'
            }
          >
            <div
              className={`${
                isCustomLayout ? 'w-full' : 'landscape-math-col md:col-span-6'
              } rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center`}
            >
              {/* Header: Progress & Timer Countdown */}
              <div className="flex items-center justify-between gap-2.5 mb-3 px-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {dynamicTopicBadge}
                </span>

                {/* Countdown Timer Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs sm:text-sm font-black font-mono transition-all ${timerColor}`}
                >
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>
                    {gameStatus === 'running'
                      ? challengePhase === 'answering'
                        ? `${isVi ? 'Trả lời' : 'Answer'}: ${timeLeft}s`
                        : `${isVi ? 'Quan sát' : 'Observe'}: ${timeLeft}s`
                      : `${timeLeft}s`}
                  </span>
                </div>
              </div>

              {/* Large Mathematical Problem Display */}
              <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-2 w-full">
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
                          >
                            <Volume2
                              className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full py-1 px-1">
                        <div
                          className={`font-black text-white font-mono tabular-nums flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 tracking-tight select-none leading-tight ${formulaFontSize}`}
                        >
                          <span className="whitespace-nowrap">{formatBigIntStr(question.a)}</span>
                          <span className="text-amber-400 font-sans">×</span>
                          <span className="whitespace-nowrap">{formatBigIntStr(question.b)}</span>
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
                        >
                          <Volume2
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`}
                          />
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

              {/* Feedback messages */}
              {feedback === 'correct' && (
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
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
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 shrink-0"
                    title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {feedback === 'incorrect' && (
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
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
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60 shrink-0"
                    title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {feedback === 'timeout' && (
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-all font-mono sm:font-sans">
                    {question.answer.length > 15
                      ? isVi
                        ? `Hết giờ! Đáp án: ${formatBigIntStr(question.answer)}`
                        : `Time's up! Answer: ${formatBigIntStr(question.answer)}`
                      : isVi
                      ? `Hết giờ! Đáp án: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                      : `Time's up! Answer: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60 shrink-0"
                    title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Input Form */}
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
                        ? 'Bấm "Bắt đầu" để bắt đầu thử thách...'
                        : 'Click "Start" to begin challenge...'
                      : challengePhase === 'observing'
                      ? isVi
                        ? `Đang quan sát đề (${timeLeft}s)... Bấm "Trả lời ngay"`
                        : `Observing (${timeLeft}s)... Click "Answer Now"`
                      : isListening
                      ? isVi
                        ? '🎙️ Đang nghe... Hãy đọc to đáp án của bạn'
                        : '🎙️ Listening... Speak your answer aloud'
                      : isVi
                      ? 'Nhập kết quả hoặc bấm phím số bên dưới...'
                      : 'Type answer or tap numeric keys below...'
                  }
                  disabled={!canAnswer}
                  className={`w-full h-13 sm:h-14 px-5 pr-11 text-center ${
                    userAnswer.length > 22 ? 'text-base sm:text-xl' : 'text-2xl sm:text-3xl'
                  } font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                    isListening
                      ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                      : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
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

              {/* Bàn phím số ảo từ 0 đến 9 */}
              <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
                <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(String(digit))}
                      disabled={!canAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                      disabled={!canAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label={`Digit ${digit}`}
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    disabled={!canAnswer || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                  >
                    {isVi ? 'Xóa' : 'Clear'}
                  </button>

                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    disabled={!canAnswer || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={isVi ? 'Xóa 1 số' : 'Backspace'}
                    aria-label="Backspace"
                  >
                    <Delete className="w-4 h-4 text-slate-400 hover:text-amber-300" />
                  </button>
                </div>
              </div>

              {/* Voice indicator */}
              {isListening && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="truncate">
                    {voiceTranscript
                      ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}" ➔ ${isVi ? 'Tự nộp bài...' : 'Submitting...'}`
                      : isVi
                      ? '🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: "bốn bốn bốn", "444",...)'
                      : '🎙️ Listening: Speak your answer (e.g. "four four four", "444",...)'}
                  </span>
                </div>
              )}

              {/* Voice Error banner */}
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

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {gameStatus === 'idle' ? (
                  <button
                    type="button"
                    onClick={() => startNewChallenge()}
                    className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>
                      {isVi
                        ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} câu)`
                        : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}
                    </span>
                  </button>
                ) : gameStatus === 'answered' ? (
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                  >
                    <span>
                      {currentQuestionIndex >= TOTAL_QUESTIONS
                        ? autoNextConfig.delaySec > 0
                          ? isVi
                            ? `Xem Tổng Kết (tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)})`
                            : `View Results (auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)})`
                          : isVi
                          ? 'Xem Tổng Kết'
                          : 'View Results'
                        : autoNextConfig.delaySec > 0
                        ? isVi
                          ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                          : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                        : isVi
                        ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`
                        : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
                    <span>{isVi ? 'Kết quả' : 'Answer'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Voice button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!canAnswer}
                  title={
                    isListening
                      ? isVi
                        ? 'Đang nghe... Bấm để dừng'
                        : 'Listening... Click to stop'
                      : isVi
                      ? 'Trả lời bằng giọng nói'
                      : 'Answer by voice'
                  }
                  className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
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
                  onClick={() => startNewChallenge()}
                  title={isVi ? 'Bắt đầu câu hỏi thử thách' : 'Start challenge question'}
                  className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
                </button>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={handleReset}
                  title={isVi ? 'Thiết lập lại thử thách' : 'Reset challenge'}
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
