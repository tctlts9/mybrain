import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Timer,
  Zap,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Clock,
  Target,
  ArrowUpDown,
  Mic,
  MicOff,
  AlertTriangle,
  Gauge,
  Grid3x3,
  Eye,
  Send,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playSpeakerChime } from '../../utils/speechUtils';
import { parseSchulteVoiceActions, SchulteColorAnswer } from '../../utils/schulteVoice';
import type { SchulteGridSize } from './SchulteTableChallengePage';

type OrderMode = 'asc' | 'desc';
type TimeLimit = 5 | 10 | 15 | 20 | 25 | 30;
type AnswerTimeLimit = 10 | 20 | 30 | 40 | 50 | 60;
type DifficultyLevel = 'hard' | 'pro' | 'pro-plus';
type ChallengeStatus = 'idle' | 'running' | 'round-ended' | 'completed';
type ProPlusPhase = 'idle' | 'observing' | 'answering' | 'result';

interface SchulteTableDifficultyChallengePageProps {
  onBack: () => void;
  initialGridSize?: SchulteGridSize;
}

interface RoundHistoryItem {
  roundIndex: number;
  gridSize: SchulteGridSize;
  difficulty: DifficultyLevel;
  passed: boolean;
  elapsedSec: number;
  mistakes: number;
  foundCount: number;
  totalCount: number;
}

interface ProPlusRingEval {
  actual: number[];
  entered: number[];
  correct: number[];
  wrong: number[];
  missed: number[];
}

interface ProPlusResult {
  rings: [ProPlusRingEval, ProPlusRingEval, ProPlusRingEval];
  totalCorrect: number;
  totalNumbers: number;
  totalWrong: number;
  answerElapsedSec: number;
  timedOut: boolean;
}

const TOTAL_ROUNDS = 3;
const GRID_SIZES: SchulteGridSize[] = [3, 4, 5, 6];
const TIME_LIMITS: TimeLimit[] = [5, 10, 15, 20, 25, 30];
const ANSWER_TIME_LIMITS: AnswerTimeLimit[] = [10, 20, 30, 40, 50, 60];
const DIFFICULTY_LEVELS: {
  id: DifficultyLevel;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
}[] = [
  {
    id: 'hard',
    labelVi: 'Khó',
    labelEn: 'Hard',
    descVi: '4 màu ngẫu nhiên • Tọa độ nhiễu • Bảng cố định',
    descEn: '4 random colors • Coordinate interference • Static grid',
  },
  {
    id: 'pro',
    labelVi: 'Siêu khó',
    labelEn: 'Pro',
    descVi: 'Có màu nền → Trả lời MÀU • Không nền → SỐ • Tọa độ nhiễu',
    descEn: 'Colored bg → Answer COLOR • No bg → NUMBER • Coordinate interference',
  },
  {
    id: 'pro-plus',
    labelVi: 'Pro+',
    labelEn: 'Pro+',
    descVi: '3 vòng tròn tự quay (2 xuôi • 1 ngược)',
    descEn: '3 rotating rings (2 CW • 1 CCW)',
  },
];
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COORD_CORNER_CLASSES = [
  'top-0.5 left-1 sm:top-1 sm:left-1.5',
  'top-0.5 right-1 sm:top-1 sm:right-1.5',
  'bottom-0.5 left-1 sm:bottom-1 sm:left-1.5',
  'bottom-0.5 right-1 sm:bottom-1 sm:right-1.5',
] as const;
const HARD_TEXT_COLORS = [
  'text-sky-400',
  'text-amber-400',
  'text-emerald-400',
  'text-rose-400',
] as const;
const PRO_TEXT_COLORS = [
  'text-rose-400',
  'text-amber-400',
  'text-sky-400',
  'text-violet-400',
] as const;

type ProBgColor = 'green' | 'yellow' | 'purple';
const PRO_BG_COLORS: ProBgColor[] = ['green', 'yellow', 'purple'];
const PRO_BG_STYLES: Record<
  ProBgColor,
  { tileClass: string; coordClass: string; labelVi: string; labelEn: string }
> = {
  green: {
    tileClass:
      'bg-emerald-600/85 hover:bg-emerald-500/90 border-emerald-400 text-white shadow-md shadow-emerald-500/20',
    coordClass: 'text-white/85',
    labelVi: 'Xanh',
    labelEn: 'Green',
  },
  yellow: {
    tileClass:
      'bg-amber-400/90 hover:bg-amber-300 border-amber-300 text-slate-950 shadow-md shadow-amber-400/20',
    coordClass: 'text-slate-900/80',
    labelVi: 'Vàng',
    labelEn: 'Yellow',
  },
  purple: {
    tileClass:
      'bg-violet-600/85 hover:bg-violet-500/90 border-violet-400 text-white shadow-md shadow-violet-500/20',
    coordClass: 'text-white/85',
    labelVi: 'Tím',
    labelEn: 'Purple',
  },
};

const pickRandomProBgColor = (exclude?: ProBgColor): ProBgColor => {
  const pool = exclude ? PRO_BG_COLORS.filter((c) => c !== exclude) : PRO_BG_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const PRO_PLUS_HEX_COLORS = [
  '#f43f5e',
  '#f97316',
  '#a855f7',
  '#38bdf8',
  '#22c55e',
  '#3b82f6',
] as const;

const PRO_PLUS_RING_COUNTS: Record<SchulteGridSize, [number, number, number]> = {
  3: [2, 3, 4],
  4: [3, 5, 8],
  5: [5, 9, 11],
  6: [6, 12, 18],
};

const PRO_PLUS_RINGS = [
  {
    id: 'inner',
    innerR: 0,
    outerR: 74,
    textR: 43,
    coordR: 62,
    spinClass: 'ring-spin-cw-fast',
    counterClass: 'ring-counter-cw-fast',
    angleOffset: -18,
  },
  {
    id: 'middle',
    innerR: 74,
    outerR: 134,
    textR: 101,
    coordR: 121,
    spinClass: 'ring-spin-ccw-med',
    counterClass: 'ring-counter-ccw-med',
    angleOffset: 10,
  },
  {
    id: 'outer',
    innerR: 134,
    outerR: 194,
    textR: 161,
    coordR: 181,
    spinClass: 'ring-spin-cw-slow',
    counterClass: 'ring-counter-cw-slow',
    angleOffset: -8,
  },
] as const;

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

const describeAnnularSector = (
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string => {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
};

const getProPlusRingTargets = (
  nums: number[],
  size: SchulteGridSize
): [number[], number[], number[]] => {
  const [c1, c2, c3] = PRO_PLUS_RING_COUNTS[size];
  return [
    nums.slice(0, c1),
    nums.slice(c1, c1 + c2),
    nums.slice(c1 + c2, c1 + c2 + c3),
  ];
};

const parseRingNumbersInput = (raw: string): number[] => {
  const matches = raw.match(/\d+/g);
  if (!matches) return [];
  const seen = new Set<number>();
  const parsed: number[] = [];
  for (const token of matches) {
    const val = parseInt(token, 10);
    if (!Number.isNaN(val) && val > 0 && !seen.has(val)) {
      seen.add(val);
      parsed.push(val);
    }
  }
  return parsed;
};

const generateShuffledNumbers = (
  size: SchulteGridSize,
  poolMin: number = 1,
  poolMax?: number
): number[] => {
  const total = size * size;
  const minVal = Math.max(1, Math.floor(poolMin));
  const maxVal =
    poolMax !== undefined && poolMax >= minVal + total - 1
      ? Math.floor(poolMax)
      : minVal + total - 1;
  const arr = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, total);
};

const generateRandomColorIndices = (total: number): number[] => {
  const colors = Array.from({ length: total }, (_, i) => i % HARD_TEXT_COLORS.length);
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  return colors;
};

const generateRandomBgMask = (total: number): boolean[] => {
  const bgCount = Math.max(2, Math.min(total - 2, Math.round(total * 0.45)));
  const mask = Array.from({ length: total }, (_, i) => i < bgCount);
  for (let i = mask.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mask[i], mask[j]] = [mask[j], mask[i]];
  }
  return mask;
};

export const SchulteTableDifficultyChallengePage: React.FC<
  SchulteTableDifficultyChallengePageProps
> = ({ onBack, initialGridSize = 5 }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Challenge Config
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('hard');
  const [gridSize, setGridSize] = useState<SchulteGridSize>(initialGridSize);
  const [orderMode, setOrderMode] = useState<OrderMode>('desc');
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(30);
  const [answerTimeLimit, setAnswerTimeLimit] = useState<AnswerTimeLimit>(30);
  const [showCenterDot, setShowCenterDot] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [highlightFound, setHighlightFound] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Session & Board State
  const [status, setStatus] = useState<ChallengeStatus>('idle');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [numbers, setNumbers] = useState<number[]>(() => generateShuffledNumbers(initialGridSize));
  const [tileColorIndices, setTileColorIndices] = useState<number[]>(() =>
    generateRandomColorIndices(initialGridSize * initialGridSize)
  );
  const [tileCoordCorners, setTileCoordCorners] = useState<number[]>(() =>
    generateRandomColorIndices(initialGridSize * initialGridSize)
  );
  const [tileBgMask, setTileBgMask] = useState<boolean[]>(() =>
    generateRandomBgMask(initialGridSize * initialGridSize)
  );
  const [activeProBgColor, setActiveProBgColor] = useState<ProBgColor>(() =>
    pickRandomProBgColor()
  );
  const [nextTarget, setNextTarget] = useState<number>(() => initialGridSize * initialGridSize);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [roundElapsedMs, setRoundElapsedMs] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<'idle' | 'passed' | 'timeout'>('idle');
  const [shuffleNotice, setShuffleNotice] = useState<boolean>(false);
  const [proRuleHint, setProRuleHint] = useState<string>('');

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');
  const [lastMarkedByVoice, setLastMarkedByVoice] = useState<number | null>(null);

  // Stats & Transition
  const [passedCount, setPassedCount] = useState<number>(0);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Pro+ Observation & 3-Ring Recall State
  const [proPlusPhase, setProPlusPhase] = useState<ProPlusPhase>('idle');
  const [proPlusInputs, setProPlusInputs] = useState<[string, string, string]>(['', '', '']);
  const [proPlusResult, setProPlusResult] = useState<ProPlusResult | null>(null);
  const [activeProPlusRingIdx, setActiveProPlusRingIdx] = useState<0 | 1 | 2>(0);
  const [proPlusRangeFrom, setProPlusRangeFrom] = useState<number>(1);
  const [proPlusRangeTo, setProPlusRangeTo] = useState<number>(
    () => initialGridSize * initialGridSize + 1
  );
  const [proPlusRangeFromText, setProPlusRangeFromText] = useState<string>('1');
  const [proPlusRangeToText, setProPlusRangeToText] = useState<string>(() =>
    String(initialGridSize * initialGridSize + 1)
  );

  const countdownRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(0);
  const wrongTimeoutRef = useRef<number | null>(null);
  const markedBannerTimeoutRef = useRef<number | null>(null);
  const shuffleNoticeTimeoutRef = useRef<number | null>(null);
  const proHintTimeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const consumedLengthByIndexRef = useRef<Map<number, number>>(new Map());
  const hitsSinceShuffleRef = useRef<number>(0);
  const ringInputRefs = useRef<[HTMLInputElement | null, HTMLInputElement | null, HTMLInputElement | null]>([
    null,
    null,
    null,
  ]);

  const nextTargetRef = useRef(nextTarget);
  nextTargetRef.current = nextTarget;
  const mistakesRef = useRef(mistakes);
  mistakesRef.current = mistakes;
  const currentRoundRef = useRef(currentRound);
  currentRoundRef.current = currentRound;
  const proPlusPhaseRef = useRef(proPlusPhase);
  proPlusPhaseRef.current = proPlusPhase;
  const proPlusInputsRef = useRef(proPlusInputs);
  proPlusInputsRef.current = proPlusInputs;
  const activeProPlusRingIdxRef = useRef(activeProPlusRingIdx);
  activeProPlusRingIdxRef.current = activeProPlusRingIdx;
  const proPlusRangeFromRef = useRef(proPlusRangeFrom);
  proPlusRangeFromRef.current = proPlusRangeFrom;
  const proPlusRangeToRef = useRef(proPlusRangeTo);
  proPlusRangeToRef.current = proPlusRangeTo;
  const timeLimitRef = useRef(timeLimit);
  timeLimitRef.current = timeLimit;
  const answerTimeLimitRef = useRef(answerTimeLimit);
  answerTimeLimitRef.current = answerTimeLimit;
  const isSoundOnRef = useRef(isSoundOn);
  isSoundOnRef.current = isSoundOn;

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    consumedLengthByIndexRef.current.clear();
    setIsListening(false);
  }, []);

  const clearTimers = useCallback(() => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (wrongTimeoutRef.current !== null) {
      window.clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = null;
    }
    if (markedBannerTimeoutRef.current !== null) {
      window.clearTimeout(markedBannerTimeoutRef.current);
      markedBannerTimeoutRef.current = null;
    }
    if (shuffleNoticeTimeoutRef.current !== null) {
      window.clearTimeout(shuffleNoticeTimeoutRef.current);
      shuffleNoticeTimeoutRef.current = null;
    }
    if (proHintTimeoutRef.current !== null) {
      window.clearTimeout(proHintTimeoutRef.current);
      proHintTimeoutRef.current = null;
    }
  }, []);

  const showProRuleHint = useCallback((msg: string) => {
    setProRuleHint(msg);
    if (proHintTimeoutRef.current !== null) {
      window.clearTimeout(proHintTimeoutRef.current);
    }
    proHintTimeoutRef.current = window.setTimeout(() => {
      setProRuleHint('');
    }, 1800);
  }, []);

  const triggerBoardReshuffle = useCallback((sizeToUse: SchulteGridSize) => {
    const total = sizeToUse * sizeToUse;
    setNumbers(generateShuffledNumbers(sizeToUse));
    setTileColorIndices(generateRandomColorIndices(total));
    setTileCoordCorners(generateRandomColorIndices(total));
    setTileBgMask(generateRandomBgMask(total));
    setShuffleNotice(true);
    if (shuffleNoticeTimeoutRef.current !== null) {
      window.clearTimeout(shuffleNoticeTimeoutRef.current);
    }
    shuffleNoticeTimeoutRef.current = window.setTimeout(() => {
      setShuffleNotice(false);
    }, 900);
  }, []);

  const handleRoundTimeout = useCallback(() => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (isSoundOn) playSpeakerChime('incorrect');

    const total = gridSize * gridSize;
    const found =
      orderMode === 'asc'
        ? nextTargetRef.current - 1
        : total - nextTargetRef.current;

    setTimeLeft(0);
    setRoundElapsedMs(timeLimit * 1000);
    setRoundOutcome('timeout');
    setStatus('round-ended');

    setRoundHistory((prev) => [
      ...prev,
      {
        roundIndex: currentRoundRef.current,
        gridSize,
        difficulty,
        passed: false,
        elapsedSec: timeLimit,
        mistakes: mistakesRef.current,
        foundCount: found,
        totalCount: total,
      },
    ]);
  }, [difficulty, gridSize, isSoundOn, orderMode, timeLimit]);

  const startCountdown = useCallback(
    (limitSeconds: number) => {
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current);
      }
      const start = Date.now();
      roundStartRef.current = start;
      setTimeLeft(limitSeconds);
      setRoundElapsedMs(0);

      countdownRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const remainingMs = limitSeconds * 1000 - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);
        setRoundElapsedMs(Math.min(elapsed, limitSeconds * 1000));

        if (remainingMs <= 0) {
          handleRoundTimeout();
        }
      }, 100);
    },
    [handleRoundTimeout]
  );

  const prepareBoard = useCallback(
    (
      sizeToUse: SchulteGridSize,
      modeToUse: OrderMode,
      diffToUse?: DifficultyLevel,
      rangeFromOverride?: number,
      rangeToOverride?: number
    ) => {
      const total = sizeToUse * sizeToUse;
      const activeDiff = diffToUse ?? difficultyRef.current;
      const poolFrom = activeDiff === 'pro-plus' ? rangeFromOverride ?? proPlusRangeFromRef.current : 1;
      const poolTo =
        activeDiff === 'pro-plus'
          ? Math.max(rangeToOverride ?? proPlusRangeToRef.current, poolFrom + total - 1)
          : total;
      setNumbers(generateShuffledNumbers(sizeToUse, poolFrom, poolTo));
      setTileColorIndices(generateRandomColorIndices(total));
      setTileCoordCorners(generateRandomColorIndices(total));
      setTileBgMask(generateRandomBgMask(total));
      setActiveProBgColor((prev) => pickRandomProBgColor(prev));
      setNextTarget(modeToUse === 'asc' ? 1 : total);
      setMistakes(0);
      setWrongTile(null);
      setRoundOutcome('idle');
      setLastMarkedByVoice(null);
      setShuffleNotice(false);
      setProRuleHint('');
      hitsSinceShuffleRef.current = 0;
    },
    []
  );

  const submitProPlusAnswers = useCallback((timedOut: boolean = false) => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    const activeSize = gridSizeRef.current;
    const activeNums = numbersRef.current;
    const limitSec = answerTimeLimitRef.current;
    const elapsedMs = Date.now() - roundStartRef.current;
    const answerElapsedSec = timedOut
      ? limitSec
      : Number(Math.min(limitSec, Math.max(0.1, elapsedMs / 1000)).toFixed(1));

    const targets = getProPlusRingTargets(activeNums, activeSize);
    const rawInputs = proPlusInputsRef.current;

    const ringEvals = ([0, 1, 2] as const).map((idx) => {
      const actual = targets[idx];
      const actualSet = new Set(actual);
      const entered = parseRingNumbersInput(rawInputs[idx]);
      const enteredSet = new Set(entered);
      const correct = entered.filter((n) => actualSet.has(n));
      const wrong = entered.filter((n) => !actualSet.has(n));
      const missed = actual.filter((n) => !enteredSet.has(n));
      return { actual, entered, correct, wrong, missed };
    }) as [ProPlusRingEval, ProPlusRingEval, ProPlusRingEval];

    const totalCorrect = ringEvals.reduce((sum, r) => sum + r.correct.length, 0);
    const totalWrong = ringEvals.reduce((sum, r) => sum + r.wrong.length, 0);
    const totalNumbersCount = activeSize * activeSize;

    if (isSoundOnRef.current) {
      playSpeakerChime(totalCorrect > 0 && totalWrong === 0 ? 'correct' : 'incorrect');
    }

    setTimeLeft(timedOut ? 0 : Math.max(0, Math.ceil((limitSec * 1000 - elapsedMs) / 1000)));
    setRoundElapsedMs(Math.min(elapsedMs, limitSec * 1000));
    setProPlusResult({
      rings: ringEvals,
      totalCorrect,
      totalNumbers: totalNumbersCount,
      totalWrong,
      answerElapsedSec,
      timedOut,
    });
    setProPlusPhase('result');
    setStatus('idle');
  }, []);

  const beginProPlusAnswering = useCallback(
    (explicitLimit?: AnswerTimeLimit) => {
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      const activeLimit = explicitLimit ?? answerTimeLimitRef.current;
      if (isSoundOnRef.current) playSpeakerChime('correct');

      setProPlusPhase('answering');
      setStatus('running');
      setActiveProPlusRingIdx(0);
      setTimeLeft(activeLimit);
      setRoundElapsedMs(0);

      const start = Date.now();
      roundStartRef.current = start;

      countdownRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const remainingMs = activeLimit * 1000 - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);
        setRoundElapsedMs(Math.min(elapsed, activeLimit * 1000));

        if (remainingMs <= 0) {
          submitProPlusAnswers(true);
        }
      }, 100);
    },
    [submitProPlusAnswers]
  );

  const startProPlusSession = useCallback(
    (explicitSize?: SchulteGridSize, explicitLimit?: TimeLimit) => {
      clearTimers();
      const activeSize = explicitSize ?? gridSizeRef.current;
      const activeLimit = explicitLimit ?? timeLimitRef.current;

      prepareBoard(activeSize, 'asc', 'pro-plus');
      setProPlusInputs(['', '', '']);
      setProPlusResult(null);
      setActiveProPlusRingIdx(0);
      setProPlusPhase('observing');
      setStatus('running');
      setTimeLeft(activeLimit);
      setRoundElapsedMs(0);

      const start = Date.now();
      roundStartRef.current = start;

      countdownRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const remainingMs = activeLimit * 1000 - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);
        setRoundElapsedMs(Math.min(elapsed, activeLimit * 1000));

        if (remainingMs <= 0) {
          beginProPlusAnswering(answerTimeLimitRef.current);
        }
      }, 100);
    },
    [beginProPlusAnswering, clearTimers, prepareBoard]
  );

  const startChallengeSession = useCallback(
    (explicitSize?: SchulteGridSize, explicitLimit?: TimeLimit, explicitMode?: OrderMode) => {
      if (difficultyRef.current === 'pro-plus') {
        startProPlusSession(explicitSize, explicitLimit);
        return;
      }

      clearTimers();
      const activeSize = explicitSize ?? gridSize;
      const activeLimit = explicitLimit ?? timeLimit;
      const activeMode = explicitMode ?? orderMode;

      setCurrentRound(1);
      setPassedCount(0);
      setRoundHistory([]);

      prepareBoard(activeSize, activeMode);
      setStatus('running');
      startCountdown(activeLimit);
    },
    [clearTimers, gridSize, orderMode, prepareBoard, startCountdown, startProPlusSession, timeLimit]
  );

  const goToNextRound = useCallback(() => {
    if (currentRoundRef.current >= TOTAL_ROUNDS) {
      setStatus('completed');
      return;
    }

    const nextIdx = currentRoundRef.current + 1;
    setCurrentRound(nextIdx);
    prepareBoard(gridSize, orderMode);
    setStatus('running');
    startCountdown(timeLimit);
  }, [gridSize, orderMode, prepareBoard, startCountdown, timeLimit]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopListening();
    };
  }, [clearTimers, stopListening]);

  const advanceCorrectTarget = useCallback(
    (answeredNum: number, fromVoice: boolean = false) => {
      const total = gridSize * gridSize;
      if (isSoundOn) playSpeakerChime('correct');
      setProRuleHint('');

      if (fromVoice) {
        setLastMarkedByVoice(answeredNum);
        if (markedBannerTimeoutRef.current !== null) {
          window.clearTimeout(markedBannerTimeoutRef.current);
        }
        markedBannerTimeoutRef.current = window.setTimeout(() => {
          setLastMarkedByVoice(null);
        }, 1400);
      }

      const isLast =
        (orderMode === 'asc' && answeredNum === total) ||
        (orderMode === 'desc' && answeredNum === 1);

      if (isLast) {
        if (countdownRef.current !== null) {
          window.clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        const elapsedMs = Date.now() - roundStartRef.current;
        const elapsedSec = Number((elapsedMs / 1000).toFixed(2));

        setRoundElapsedMs(elapsedMs);
        setRoundOutcome('passed');
        setStatus('round-ended');
        setPassedCount((prev) => prev + 1);

        setRoundHistory((prev) => [
          ...prev,
          {
            roundIndex: currentRound,
            gridSize,
            difficulty,
            passed: true,
            elapsedSec,
            mistakes,
            foundCount: total,
            totalCount: total,
          },
        ]);
      } else {
        setNextTarget((prev) => (orderMode === 'asc' ? prev + 1 : prev - 1));
      }
    },
    [
      currentRound,
      difficulty,
      gridSize,
      isSoundOn,
      mistakes,
      orderMode,
    ]
  );

  const handleTileClick = useCallback(
    (num: number, fromVoice: boolean = false) => {
      if (status !== 'running') return;

      const targetIdx = numbers.indexOf(nextTarget);
      const targetHasBg =
        difficulty === 'pro' && targetIdx !== -1 && Boolean(tileBgMask[targetIdx]);

      if (num === nextTarget) {
        if (targetHasBg) {
          // Pro rule: nếu số có màu nền thì phải trả lời màu, không trả lời số
          if (isSoundOn) playSpeakerChime('incorrect');
          setMistakes((prev) => prev + 1);
          setWrongTile(num);
          if (wrongTimeoutRef.current !== null) {
            window.clearTimeout(wrongTimeoutRef.current);
          }
          wrongTimeoutRef.current = window.setTimeout(() => {
            setWrongTile(null);
          }, 320);
          const bgStyle = PRO_BG_STYLES[activeProBgColor];
          showProRuleHint(
            isVi
              ? `Số ${nextTarget} có nền ${bgStyle.labelVi.toUpperCase()} → Hãy trả lời MÀU (${bgStyle.labelVi})!`
              : `Number ${nextTarget} has ${bgStyle.labelEn.toUpperCase()} background → Answer COLOR (${bgStyle.labelEn})!`
          );
          return;
        }

        advanceCorrectTarget(num, fromVoice);
      } else {
        if (isSoundOn) playSpeakerChime('incorrect');
        setMistakes((prev) => prev + 1);
        setWrongTile(num);
        if (wrongTimeoutRef.current !== null) {
          window.clearTimeout(wrongTimeoutRef.current);
        }
        wrongTimeoutRef.current = window.setTimeout(() => {
          setWrongTile(null);
        }, 320);
      }
    },
    [
      activeProBgColor,
      advanceCorrectTarget,
      difficulty,
      isSoundOn,
      isVi,
      nextTarget,
      numbers,
      showProRuleHint,
      status,
      tileBgMask,
    ]
  );

  const handleColorAnswer = useCallback(
    (color: SchulteColorAnswer, fromVoice: boolean = false) => {
      if (status !== 'running' || difficulty !== 'pro') return;

      const targetIdx = numbers.indexOf(nextTarget);
      const targetHasBg = targetIdx !== -1 && Boolean(tileBgMask[targetIdx]);

      if (targetHasBg && color === activeProBgColor) {
        advanceCorrectTarget(nextTarget, fromVoice);
      } else {
        if (isSoundOn) playSpeakerChime('incorrect');
        setMistakes((prev) => prev + 1);
        if (!targetHasBg) {
          showProRuleHint(
            isVi
              ? `Số ${nextTarget} KHÔNG có nền màu → Hãy bấm hoặc đọc SỐ!`
              : `Number ${nextTarget} has NO background → Tap or speak the NUMBER!`
          );
        } else {
          const bgStyle = PRO_BG_STYLES[activeProBgColor];
          showProRuleHint(
            isVi
              ? `Sai màu! Nền là màu ${bgStyle.labelVi.toUpperCase()}.`
              : `Wrong color! Background is ${bgStyle.labelEn.toUpperCase()}.`
          );
        }
      }
    },
    [
      activeProBgColor,
      advanceCorrectTarget,
      difficulty,
      isSoundOn,
      isVi,
      nextTarget,
      numbers,
      showProRuleHint,
      status,
      tileBgMask,
    ]
  );

  // Fresh refs for Voice callback
  const handleTileClickRef = useRef(handleTileClick);
  handleTileClickRef.current = handleTileClick;
  const handleColorAnswerRef = useRef(handleColorAnswer);
  handleColorAnswerRef.current = handleColorAnswer;
  const numbersRef = useRef(numbers);
  numbersRef.current = numbers;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const orderModeRef = useRef(orderMode);
  orderModeRef.current = orderMode;
  const statusRef = useRef(status);
  statusRef.current = status;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const tileBgMaskRef = useRef(tileBgMask);
  tileBgMaskRef.current = tileBgMask;
  const activeProBgColorRef = useRef(activeProBgColor);
  activeProBgColorRef.current = activeProBgColor;

  const startListening = useCallback(async () => {
    setVoiceError('');
    setVoiceTranscript('');
    consumedLengthByIndexRef.current.clear();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.'
          : 'Browser does not support Web Speech API. Please use Chrome or Edge.'
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
          ? 'Chưa cấp quyền Micro. Vui lòng cho phép truy cập Micro trên trình duyệt.'
          : 'Microphone permission denied. Please allow microphone access.'
      );
      return;
    }

    const createAndStartRecognition = () => {
      if (!isListeningRef.current) return;
      consumedLengthByIndexRef.current.clear();

      const recognition = new SpeechRecognition();
      recognition.lang = isVi ? 'vi-VN' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: any) => {
        for (let idx = event.resultIndex; idx < event.results.length; idx++) {
          const result = event.results[idx];
          const fullText = (result?.[0]?.transcript || '').trim();
          if (!fullText) continue;

          setVoiceTranscript(fullText);

          const prevConsumed = consumedLengthByIndexRef.current.get(idx) ?? 0;
          const deltaText = fullText.slice(prevConsumed).trim();
          if (!deltaText) continue;

          const currentSize = gridSizeRef.current;
          let activeTarget = nextTargetRef.current;
          const mode = orderModeRef.current;
          const maxVoiceNum =
            difficultyRef.current === 'pro-plus'
              ? proPlusRangeToRef.current
              : currentSize * currentSize;
          const actions = parseSchulteVoiceActions(deltaText, currentSize, activeTarget, maxVoiceNum);
          if (actions.length === 0) continue;

          let consumedAction = false;

          for (const action of actions) {
            if (action.type === 'markFound') {
              setHighlightFound(true);
              consumedAction = true;
              continue;
            }
            if (action.type === 'noMarkFound') {
              setHighlightFound(false);
              consumedAction = true;
              continue;
            }
            if (statusRef.current !== 'running') continue;

            if (difficultyRef.current === 'pro-plus') {
              if (proPlusPhaseRef.current === 'answering' && action.type === 'number') {
                const targetRing = activeProPlusRingIdxRef.current;
                const activeSize = gridSizeRef.current;
                const [c1, c2] = PRO_PLUS_RING_COUNTS[activeSize];
                const rangeFromVal = proPlusRangeFromRef.current;
                const rangeToVal = proPlusRangeToRef.current;
                if (action.value >= rangeFromVal && action.value <= rangeToVal) {
                  setProPlusInputs((prev) => {
                    const next = [...prev] as [string, string, string];
                    const existing = parseRingNumbersInput(next[targetRing]);
                    if (!existing.includes(action.value)) {
                      next[targetRing] = [...existing, action.value].join(' ');
                    }
                    if (targetRing === 0 || targetRing === 1) {
                      const r1 = parseRingNumbersInput(next[0]);
                      const r2 = parseRingNumbersInput(next[1]);
                      if (r1.length === c1 && r2.length === c2) {
                        const used = new Set([...r1, ...r2]);
                        const remaining = Array.from(
                          { length: rangeToVal - rangeFromVal + 1 },
                          (_, idxN) => rangeFromVal + idxN
                        ).filter((n) => !used.has(n));
                        next[2] = remaining.join(' ');
                        setActiveProPlusRingIdx(2);
                      } else if (targetRing === 0 && r1.length === c1 && r2.length < c2) {
                        next[2] = '';
                        setActiveProPlusRingIdx(1);
                      } else {
                        next[2] = '';
                      }
                    }
                    return next;
                  });
                  consumedAction = true;
                }
              }
              continue;
            }

            if (action.type === 'color') {
              if (difficultyRef.current === 'pro') {
                const targetIdx = numbersRef.current.indexOf(activeTarget);
                const targetHasBg =
                  targetIdx !== -1 && Boolean(tileBgMaskRef.current[targetIdx]);
                if (targetHasBg && action.color === activeProBgColorRef.current) {
                  handleColorAnswerRef.current(action.color, true);
                  activeTarget = mode === 'asc' ? activeTarget + 1 : activeTarget - 1;
                  consumedAction = true;
                } else if (result.isFinal) {
                  handleColorAnswerRef.current(action.color, true);
                  consumedAction = true;
                }
              }
              continue;
            }

            if (action.type === 'coord') {
              const tileIndex = action.row * currentSize + action.col;
              const tileNum = numbersRef.current[tileIndex];
              if (typeof tileNum === 'number') {
                if (tileNum === activeTarget || result.isFinal) {
                  handleTileClickRef.current(tileNum, true);
                  if (tileNum === activeTarget) {
                    activeTarget = mode === 'asc' ? activeTarget + 1 : activeTarget - 1;
                  }
                  consumedAction = true;
                }
              }
            } else if (action.type === 'number') {
              if (action.value === activeTarget) {
                handleTileClickRef.current(action.value, true);
                activeTarget = mode === 'asc' ? activeTarget + 1 : activeTarget - 1;
                consumedAction = true;
              } else if (result.isFinal) {
                handleTileClickRef.current(action.value, true);
                consumedAction = true;
              }
            }
          }

          if (consumedAction || result.isFinal) {
            consumedLengthByIndexRef.current.set(idx, fullText.length);
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setVoiceError(
            isVi
              ? 'Quyền Micro bị chặn. Vui lòng cấp quyền để trả lời bằng giọng nói.'
              : 'Microphone blocked. Please allow access.'
          );
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            createAndStartRecognition();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    isListeningRef.current = true;
    setIsListening(true);
    createAndStartRecognition();
  }, [isVi]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSelectDifficulty = (newDiff: DifficultyLevel) => {
    clearTimers();
    setDifficulty(newDiff);
    let nextMode: OrderMode = orderMode;
    let nextHighlight = highlightFound;

    if (newDiff === 'hard') {
      nextMode = 'desc';
      nextHighlight = false;
    } else if (newDiff === 'pro') {
      nextMode = 'desc';
      nextHighlight = false;
    } else if (newDiff === 'pro-plus') {
      nextMode = 'asc';
      nextHighlight = false;
    }

    setOrderMode(nextMode);
    setHighlightFound(nextHighlight);

    if (newDiff === 'pro-plus') {
      const total = gridSize * gridSize;
      const defaultTargets = new Set([10, 17, 26, 37]);
      const isPreviousDefault =
        proPlusRangeFrom === 1 && defaultTargets.has(proPlusRangeTo);
      const syncFrom = isPreviousDefault
        ? 1
        : Math.min(proPlusRangeFrom, 999 - total);
      const syncTo = isPreviousDefault
        ? total + 1
        : Math.min(999, Math.max(proPlusRangeTo, syncFrom + total - 1));

      setProPlusRangeFrom(syncFrom);
      setProPlusRangeTo(syncTo);
      setProPlusRangeFromText(String(syncFrom));
      setProPlusRangeToText(String(syncTo));
      proPlusRangeFromRef.current = syncFrom;
      proPlusRangeToRef.current = syncTo;

      setProPlusPhase('idle');
      setProPlusInputs(['', '', '']);
      setProPlusResult(null);
      setActiveProPlusRingIdx(0);
      setStatus('idle');
      setTimeLeft(timeLimit);
      setRoundElapsedMs(0);
      prepareBoard(gridSize, 'asc', 'pro-plus', syncFrom, syncTo);
      return;
    }

    setProPlusPhase('idle');
    setProPlusInputs(['', '', '']);
    setProPlusResult(null);

    const total = gridSize * gridSize;
    if (newDiff === 'hard' || newDiff === 'pro') {
      if (newDiff === 'pro') {
        setActiveProBgColor((prev) => pickRandomProBgColor(prev));
      }
      setNextTarget(nextMode === 'asc' ? 1 : total);
      setMistakes(0);
      setWrongTile(null);
      setShuffleNotice(false);
      setProRuleHint('');
      if (status === 'running' || status === 'round-ended') {
        clearTimers();
        setCurrentRound(1);
        setPassedCount(0);
        setRoundHistory([]);
        setRoundOutcome('idle');
        setStatus('running');
        startCountdown(timeLimit);
      }
      return;
    }

    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(gridSize, timeLimit, nextMode);
    } else {
      prepareBoard(gridSize, nextMode);
    }
  };

  const handleSelectGridSize = (newSize: SchulteGridSize) => {
    setGridSize(newSize);
    if (difficulty === 'pro-plus') {
      clearTimers();
      const oldDefaultTo = gridSize * gridSize + 1;
      const newTotal = newSize * newSize;
      const isUsingDefaultRange = proPlusRangeFrom === 1 && proPlusRangeTo === oldDefaultTo;
      const nextFrom = isUsingDefaultRange ? 1 : Math.min(proPlusRangeFrom, 999 - newTotal);
      const nextTo = isUsingDefaultRange
        ? newTotal + 1
        : Math.min(999, Math.max(proPlusRangeTo, nextFrom + newTotal));

      setProPlusRangeFrom(nextFrom);
      setProPlusRangeTo(nextTo);
      setProPlusRangeFromText(String(nextFrom));
      setProPlusRangeToText(String(nextTo));
      proPlusRangeFromRef.current = nextFrom;
      proPlusRangeToRef.current = nextTo;

      setProPlusPhase('idle');
      setProPlusInputs(['', '', '']);
      setProPlusResult(null);
      setStatus('idle');
      setTimeLeft(timeLimit);
      prepareBoard(newSize, 'asc', 'pro-plus', nextFrom, nextTo);
      return;
    }
    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(newSize, timeLimit, orderMode);
    } else {
      prepareBoard(newSize, orderMode);
    }
  };

  const applyProPlusRange = (
    rawFrom: number,
    rawTo: number,
    changedField: 'from' | 'to' | 'both' = 'both'
  ) => {
    const total = gridSize * gridSize;
    let safeFrom = Number.isFinite(rawFrom) ? Math.floor(rawFrom) : 1;
    safeFrom = Math.max(1, Math.min(999 - total, safeFrom));

    let safeTo = Number.isFinite(rawTo) ? Math.floor(rawTo) : safeFrom + total;
    if (changedField === 'from' && safeTo < safeFrom + total - 1) {
      safeTo = Math.min(999, safeFrom + total);
    } else if (safeTo < safeFrom + total - 1) {
      safeTo = Math.min(999, safeFrom + total);
    }
    safeTo = Math.min(999, safeTo);

    setProPlusRangeFrom(safeFrom);
    setProPlusRangeTo(safeTo);
    setProPlusRangeFromText(String(safeFrom));
    setProPlusRangeToText(String(safeTo));
    proPlusRangeFromRef.current = safeFrom;
    proPlusRangeToRef.current = safeTo;

    clearTimers();
    setProPlusPhase('idle');
    setProPlusInputs(['', '', '']);
    setProPlusResult(null);
    setActiveProPlusRingIdx(0);
    setStatus('idle');
    setTimeLeft(timeLimit);
    setRoundElapsedMs(0);
    prepareBoard(gridSize, 'asc', 'pro-plus', safeFrom, safeTo);
  };

  const handleProPlusRangeTextChange = (field: 'from' | 'to', rawVal: string) => {
    const cleanDigits = rawVal.replace(/[^\d]/g, '').slice(0, 3);
    const nextFromText = field === 'from' ? cleanDigits : proPlusRangeFromText;
    const nextToText = field === 'to' ? cleanDigits : proPlusRangeToText;

    if (field === 'from') setProPlusRangeFromText(cleanDigits);
    else setProPlusRangeToText(cleanDigits);

    const parsedFrom = parseInt(nextFromText, 10);
    const parsedTo = parseInt(nextToText, 10);
    const total = gridSize * gridSize;

    if (
      !Number.isNaN(parsedFrom) &&
      !Number.isNaN(parsedTo) &&
      parsedFrom >= 1 &&
      parsedTo <= 999 &&
      parsedTo - parsedFrom + 1 >= total
    ) {
      setProPlusRangeFrom(parsedFrom);
      setProPlusRangeTo(parsedTo);
      proPlusRangeFromRef.current = parsedFrom;
      proPlusRangeToRef.current = parsedTo;
      if (proPlusPhase === 'idle' || proPlusPhase === 'result') {
        setProPlusPhase('idle');
        setProPlusInputs(['', '', '']);
        setProPlusResult(null);
        setTimeLeft(timeLimit);
        prepareBoard(gridSize, 'asc', 'pro-plus', parsedFrom, parsedTo);
      }
    }
  };

  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    setTimeLimit(newLimit);
    if (difficulty === 'pro-plus') {
      if (proPlusPhase === 'observing') {
        startProPlusSession(gridSize, newLimit);
      } else if (proPlusPhase === 'idle') {
        setTimeLeft(newLimit);
      }
      return;
    }
    setTimeLeft(newLimit);
    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(gridSize, newLimit, orderMode);
    }
  };

  const handleSelectAnswerTimeLimit = (newLimit: AnswerTimeLimit) => {
    setAnswerTimeLimit(newLimit);
    if (difficulty === 'pro-plus' && proPlusPhase === 'answering') {
      beginProPlusAnswering(newLimit);
    }
  };

  const toggleProPlusQuickNumber = (ringIdx: 0 | 1 | 2, num: number) => {
    if (proPlusPhase !== 'answering') return;
    const [c1, c2] = PRO_PLUS_RING_COUNTS[gridSize];
    let nextActiveRing: 0 | 1 | 2 | null = null;

    setProPlusInputs((prev) => {
      const next = [...prev] as [string, string, string];
      const currentList = parseRingNumbersInput(next[ringIdx]);

      if (currentList.includes(num)) {
        next[ringIdx] = currentList.filter((n) => n !== num).join(' ');
      } else {
        ([0, 1, 2] as const).forEach((otherIdx) => {
          if (otherIdx !== ringIdx) {
            const otherList = parseRingNumbersInput(next[otherIdx]);
            if (otherList.includes(num)) {
              next[otherIdx] = otherList.filter((n) => n !== num).join(' ');
            }
          }
        });
        next[ringIdx] = [...currentList, num].join(' ');
      }

      if (ringIdx === 0 || ringIdx === 1) {
        const r1 = parseRingNumbersInput(next[0]);
        const r2 = parseRingNumbersInput(next[1]);
        if (r1.length === c1 && r2.length === c2) {
          const used = new Set([...r1, ...r2]);
          const remaining = Array.from(
            { length: proPlusRangeTo - proPlusRangeFrom + 1 },
            (_, i) => proPlusRangeFrom + i
          ).filter((n) => !used.has(n));
          next[2] = remaining.join(' ');
          nextActiveRing = 2;
        } else {
          next[2] = '';
          if (ringIdx === 0 && r1.length === c1 && r2.length < c2) {
            nextActiveRing = 1;
          }
        }
      }

      return next;
    });

    if (nextActiveRing !== null) {
      setActiveProPlusRingIdx(nextActiveRing);
    }
  };

  const handleSelectMode = (newMode: OrderMode) => {
    setOrderMode(newMode);
    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(gridSize, timeLimit, newMode);
    } else {
      prepareBoard(gridSize, newMode);
    }
  };

  const handleReset = () => {
    clearTimers();
    setStatus('idle');
    setProPlusPhase('idle');
    setProPlusInputs(['', '', '']);
    setProPlusResult(null);
    setActiveProPlusRingIdx(0);
    setCurrentRound(1);
    setPassedCount(0);
    setRoundHistory([]);
    setTimeLeft(timeLimit);
    setRoundElapsedMs(0);
    prepareBoard(gridSize, orderMode, difficulty);
  };

  const isAlreadyFound = (num: number): boolean => {
    if (status === 'idle') return false;
    if (roundOutcome === 'passed') return true;
    return orderMode === 'asc' ? num < nextTarget : num > nextTarget;
  };

  const activeDiffInfo =
    DIFFICULTY_LEVELS.find((d) => d.id === difficulty) || DIFFICULTY_LEVELS[0];

  const totalNumbers = gridSize * gridSize;
  const foundCount =
    roundOutcome === 'passed'
      ? totalNumbers
      : orderMode === 'asc'
      ? nextTarget - 1
      : totalNumbers - nextTarget;

  const activeTimerLimit =
    difficulty === 'pro-plus' && proPlusPhase === 'answering' ? answerTimeLimit : timeLimit;
  const timerColor =
    timeLeft <= 5
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : timeLeft <= Math.ceil(activeTimerLimit * 0.4)
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  const gridColsClass =
    gridSize === 3
      ? 'grid-cols-3'
      : gridSize === 4
      ? 'grid-cols-4'
      : gridSize === 5
      ? 'grid-cols-5'
      : 'grid-cols-6';

  const tileTextSize =
    gridSize === 3
      ? 'text-2xl sm:text-4xl'
      : gridSize === 4
      ? 'text-xl sm:text-3xl'
      : gridSize === 5
      ? 'text-lg sm:text-2xl'
      : 'text-base sm:text-xl';

  const centerTileIndex = gridSize % 2 === 1 ? Math.floor((gridSize * gridSize) / 2) : -1;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            clearTimers();
            stopListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-violet-400" />
          <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSoundOn((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${
              isSoundOn
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-xs ring-1 ring-violet-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
          >
            {isSoundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold">
              {isSoundOn ? (isVi ? 'Âm thanh: Bật' : 'Sound: ON') : isVi ? 'Âm thanh: Tắt' : 'Sound: OFF'}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Bảng Schulte' : 'Schulte Table'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-violet-400 font-semibold flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-violet-400" />
              <span>{isVi ? 'Thử Thách Cấp Độ Khó' : 'Difficulty Level Challenge'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Challenge Container */}
      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-violet-950/30 p-3 sm:p-4 shadow-2xl relative overflow-hidden space-y-2.5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Title + Time Limit Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <Gauge className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">
                {isVi ? 'Thử Thách Cấp Độ Khó — Bảng Schulte' : 'Schulte Table — Difficulty Level Challenge'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {difficulty === 'pro-plus'
                  ? isVi
                    ? `Quay quan sát ${timeLimit}s • Trả lời Vòng 1, Vòng 2, Vòng 3 trong ${answerTimeLimit}s`
                    : `Observe 3 rotating rings ${timeLimit}s • Answer Ring 1, 2, 3 within ${answerTimeLimit}s`
                  : isVi
                  ? `Lượt ${currentRound}/${TOTAL_ROUNDS} • ${activeDiffInfo.descVi}`
                  : `Round ${currentRound}/${TOTAL_ROUNDS} • ${activeDiffInfo.descEn}`}
              </p>
            </div>
          </div>

          {/* Time Limit & Answer Time Selectors */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 max-w-full">
            {/* Giới hạn (Quay / Thử thách) */}
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 max-w-full">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 sm:px-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-violet-400" />
                <span>{isVi ? 'Giới hạn:' : 'Limit:'}</span>
              </span>
              {TIME_LIMITS.map((limit) => (
                <button
                  key={limit}
                  type="button"
                  onClick={() => handleSelectTimeLimit(limit)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    timeLimit === limit
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {limit}s
                </button>
              ))}
            </div>

            {/* Trả lời (Thời gian trả lời 10s - 60s cho Pro+) */}
            {difficulty === 'pro-plus' && (
              <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 bg-slate-950/80 p-1 rounded-xl border border-cyan-500/30 max-w-full">
                <span className="text-[11px] font-semibold text-cyan-300 px-1.5 sm:px-2 flex items-center gap-1">
                  <Timer className="w-3 h-3 text-cyan-400" />
                  <span>{isVi ? 'Trả lời:' : 'Answer:'}</span>
                </span>
                {ANSWER_TIME_LIMITS.map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => handleSelectAnswerTimeLimit(limit)}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      answerTimeLimit === limit
                        ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {limit}s
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid Size & Options Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs relative z-10">
          {/* Grid Size */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {GRID_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelectGridSize(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    gridSize === s
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {s}×{s}
                </button>
              ))}
            </div>

            {/* Từ số / Đến số (Pro+ Custom Number Range) */}
            {difficulty === 'pro-plus' && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-cyan-500/30">
                <label
                  htmlFor="pro-plus-range-from"
                  className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                >
                  {isVi ? 'Từ số' : 'From'}
                </label>
                <input
                  id="pro-plus-range-from"
                  type="text"
                  inputMode="numeric"
                  value={proPlusRangeFromText}
                  onChange={(e) => handleProPlusRangeTextChange('from', e.target.value)}
                  onBlur={() => {
                    const parsedF = parseInt(proPlusRangeFromText, 10);
                    const parsedT = parseInt(proPlusRangeToText, 10);
                    applyProPlusRange(
                      Number.isNaN(parsedF) ? 1 : parsedF,
                      Number.isNaN(parsedT) ? proPlusRangeTo : parsedT,
                      'from'
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const parsedF = parseInt(proPlusRangeFromText, 10);
                      const parsedT = parseInt(proPlusRangeToText, 10);
                      applyProPlusRange(
                        Number.isNaN(parsedF) ? 1 : parsedF,
                        Number.isNaN(parsedT) ? proPlusRangeTo : parsedT,
                        'from'
                      );
                    }
                  }}
                  className="w-11 sm:w-12 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-center text-xs font-mono font-bold text-white outline-none transition-colors"
                />
                <label
                  htmlFor="pro-plus-range-to"
                  className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                >
                  {isVi ? 'Đến số' : 'To'}
                </label>
                <input
                  id="pro-plus-range-to"
                  type="text"
                  inputMode="numeric"
                  value={proPlusRangeToText}
                  onChange={(e) => handleProPlusRangeTextChange('to', e.target.value)}
                  onBlur={() => {
                    const parsedF = parseInt(proPlusRangeFromText, 10);
                    const parsedT = parseInt(proPlusRangeToText, 10);
                    applyProPlusRange(
                      Number.isNaN(parsedF) ? proPlusRangeFrom : parsedF,
                      Number.isNaN(parsedT) ? proPlusRangeFrom + totalNumbers : parsedT,
                      'to'
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const parsedF = parseInt(proPlusRangeFromText, 10);
                      const parsedT = parseInt(proPlusRangeToText, 10);
                      applyProPlusRange(
                        Number.isNaN(parsedF) ? proPlusRangeFrom : parsedF,
                        Number.isNaN(parsedT) ? proPlusRangeFrom + totalNumbers : parsedT,
                        'to'
                      );
                    }
                  }}
                  className="w-11 sm:w-12 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-center text-xs font-mono font-bold text-white outline-none transition-colors"
                />
              </div>
            )}

            {/* Order Mode (hidden in Pro+ recall mode) */}
            {difficulty !== 'pro-plus' && (
              <button
                type="button"
                onClick={() => handleSelectMode(orderMode === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 text-slate-300 font-semibold transition-all cursor-pointer active:scale-95"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-violet-400" />
                <span>
                  {orderMode === 'asc'
                    ? `1 → ${totalNumbers}`
                    : `${totalNumbers} → 1`}
                </span>
              </button>
            )}

            {/* Center Dot */}
            <button
              type="button"
              onClick={() => setShowCenterDot((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                showCenterDot
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>{isVi ? 'Tâm điểm' : 'Center Dot'}</span>
            </button>

            {/* Coordinates Toggle */}
            <button
              type="button"
              onClick={() => setShowCoordinates((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                showCoordinates
                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5 text-violet-400" />
              <span>{isVi ? 'Tọa độ' : 'Coordinates'}</span>
            </button>

            {/* Mark Found / No Mark Found Toggle (hidden in Pro+ recall mode) */}
            {difficulty !== 'pro-plus' && (
              <button
                type="button"
                onClick={() => setHighlightFound((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                  highlightFound
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${highlightFound ? 'text-emerald-400' : 'text-slate-500'}`}
                />
                <span>
                  {isVi
                    ? highlightFound
                      ? 'Đánh dấu đã tìm'
                      : 'Không đánh dấu'
                    : highlightFound
                    ? 'Mark Found'
                    : 'No Mark Found'}
                </span>
              </button>
            )}

            {/* Voice Answer Toggle */}
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                  : 'bg-slate-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-200'
              }`}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isListening ? (isVi ? 'Đang nghe' : 'Listening') : isVi ? 'Trả lời' : 'Voice'}</span>
            </button>
          <button
            type="button"
            onClick={handleReset}
            className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
          </button>
        </div>

        {/* Live Voice Feedback */}
        {isListening && (status === 'running' || status === 'idle') && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="truncate">
              {status === 'idle'
                ? isVi
                  ? `🎙️ Giọng nói sẵn sàng (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'}): Bấm Bắt đầu rồi đọc số hoặc tọa độ`
                  : `🎙️ Voice ready (${highlightFound ? 'Mark Found' : 'No Mark Found'}): Press Start then speak number or coordinate`
                : voiceTranscript
                ? `${isVi ? 'Đang nghe:' : 'Heard:'} "${voiceTranscript}"`
                : isVi
                ? `🎙️ Đang nghe (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'}): Đọc số tìm được hoặc tọa độ (VD: "A1", "B3")`
                : `🎙️ Listening (${highlightFound ? 'Mark Found' : 'No Mark Found'}): Speak found number or coordinate (e.g. "A1", "B3")`}
            </span>
          </div>
        )}

        {lastMarkedByVoice !== null && (
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 animate-in zoom-in-95 duration-150 relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {highlightFound
                ? isVi
                  ? `Đã ghi nhận (Đánh dấu đã tìm): Số ${lastMarkedByVoice}`
                  : `Recorded (Mark Found): Number ${lastMarkedByVoice}`
                : isVi
                ? `Đã ghi nhận (Không đánh dấu): Số ${lastMarkedByVoice}`
                : `Recorded (No Mark Found): Number ${lastMarkedByVoice}`}
            </span>
          </div>
        )}

        {shuffleNotice && (
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/40 flex items-center justify-center gap-2 text-xs font-bold text-violet-300 animate-in fade-in duration-150 relative z-10">
            <RotateCcw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            <span>
              {isVi ? 'Bảng vừa được xáo trộn lại!' : 'Board reshuffled!'}
            </span>
          </div>
        )}

        {voiceError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150 relative z-10">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="flex-1 font-semibold leading-relaxed">{voiceError}</p>
            <button
              type="button"
              onClick={startListening}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold shrink-0 cursor-pointer"
            >
              {isVi ? 'Thử lại' : 'Retry'}
            </button>
          </div>
        )}

        {/* Summary Screen or Side-by-Side Challenge Workspace */}
        {status === 'completed' ? (
          <div className="rounded-3xl bg-slate-950/90 border border-violet-500/40 p-6 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-200 relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex p-4 rounded-3xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {isVi ? 'Hoàn Thành Thử Thách Cấp Độ Khó!' : 'Difficulty Challenge Completed!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {isVi
                  ? `Hoàn thành ${passedCount}/${TOTAL_ROUNDS} bảng • Cấp độ: ${activeDiffInfo.labelVi}`
                  : `Passed ${passedCount}/${TOTAL_ROUNDS} boards • Difficulty: ${activeDiffInfo.labelEn}`}
              </p>
            </div>

            <div className="max-w-md mx-auto max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              {roundHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60"
                >
                  <span className="font-mono text-slate-400">
                    #{h.roundIndex} ({h.gridSize}×{h.gridSize})
                  </span>
                  <span className="font-mono font-bold text-white">
                    {h.passed
                      ? `${h.elapsedSec.toFixed(2)}s`
                      : `${h.foundCount}/${h.totalCount}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">
                      {isVi ? `Lỗi: ${h.mistakes}` : `Err: ${h.mistakes}`}
                    </span>
                    {h.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startChallengeSession()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isVi ? 'Thử Thách Lại' : 'Try Again'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  stopListening();
                  onBack();
                }}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isVi ? 'Về Luyện Tập' : 'Practice Page'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="landscape-workspace grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-start relative z-10">
            {/* Block A: Separated Compact Control & Status Cards + Desktop/Tablet Round Progress */}
            <div className="landscape-block-a md:col-span-5 md:col-start-1 md:row-start-1 md:self-start space-y-2.5">
              {/* Separated Row 1: Cấp độ + Hoàn thành (hidden in Pro+) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Cấp độ */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-950/85 p-1 rounded-xl border border-slate-800 max-w-full">
                  <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span>{isVi ? 'Cấp độ:' : 'Difficulty:'}</span>
                  </span>
                  {DIFFICULTY_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleSelectDifficulty(lvl.id)}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        difficulty === lvl.id
                          ? lvl.id === 'pro-plus'
                            ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                            : lvl.id === 'pro'
                            ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-sm'
                            : 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {isVi ? lvl.labelVi : lvl.labelEn}
                    </button>
                  ))}
                </div>

                {/* Hoàn thành (only for Hard / Pro) */}
                {difficulty !== 'pro-plus' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800/90 shrink-0">
                    <span className="text-xs text-slate-400 font-semibold">
                      {isVi ? 'Hoàn thành:' : 'Passed:'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                      {passedCount}/{TOTAL_ROUNDS}
                    </span>
                  </div>
                )}
              </div>

              {difficulty === 'pro-plus' ? (
                <>
                  {/* Pro+ Phase & Countdown Card */}
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/85 border border-cyan-500/35">
                    <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                      <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-bold text-cyan-300 truncate">
                        {proPlusPhase === 'idle'
                          ? isVi
                            ? `Quan sát ${timeLimit}s → Trả lời ${answerTimeLimit}s`
                            : `Observe ${timeLimit}s → Answer ${answerTimeLimit}s`
                          : proPlusPhase === 'observing'
                          ? isVi
                            ? 'Đang quay — Hãy ghi nhớ 3 vòng!'
                            : 'Spinning — Memorize all 3 rings!'
                          : proPlusPhase === 'answering'
                          ? isVi
                            ? 'Nhập các số vào Vòng 1, 2, 3!'
                            : 'Enter numbers for Rings 1, 2, 3!'
                          : isVi
                          ? `Kết quả: ${proPlusResult?.totalCorrect ?? 0}/${totalNumbers} số đúng`
                          : `Score: ${proPlusResult?.totalCorrect ?? 0}/${totalNumbers} correct`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {proPlusPhase === 'observing' && (
                        <button
                          type="button"
                          onClick={() => beginProPlusAnswering(answerTimeLimit)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                        >
                          {isVi ? 'Trả lời ngay' : 'Answer Now'}
                        </button>
                      )}
                      <div
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-black font-mono transition-all ${timerColor}`}
                      >
                        <Timer className={`w-3.5 h-3.5 ${proPlusPhase === 'observing' || proPlusPhase === 'answering' ? 'animate-spin' : ''}`} />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Pro+ Textboxes + Quick Number Grid for Vòng 1, Vòng 2, Vòng 3 */}
                  <div className="p-3 rounded-2xl bg-slate-950/85 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {isVi
                          ? 'Bấm vào Vòng 1, 2, 3 để chọn nhanh hoặc nhập số'
                          : 'Click Ring 1, 2, 3 to quick-pick or type numbers'}
                      </span>
                    </div>

                    {([0, 1, 2] as const).map((ringIdx) => {
                      const ringCount = PRO_PLUS_RING_COUNTS[gridSize][ringIdx];
                      const parsedNums0 = parseRingNumbersInput(proPlusInputs[0]);
                      const parsedNums1 = parseRingNumbersInput(proPlusInputs[1]);
                      const parsedNums2 = parseRingNumbersInput(proPlusInputs[2]);
                      const allParsedByRing = [parsedNums0, parsedNums1, parsedNums2] as const;
                      const currentRingNums = allParsedByRing[ringIdx];
                      const parsedCount = currentRingNums.length;
                      const ringEval = proPlusResult?.rings[ringIdx];
                      const ringNamesVi = ['Vòng 1 (Trong cùng)', 'Vòng 2 (Ở giữa)', 'Vòng 3 (Ngoài cùng)'];
                      const ringNamesEn = ['Ring 1 (Inner)', 'Ring 2 (Middle)', 'Ring 3 (Outer)'];
                      const isInputActive = proPlusPhase === 'answering';
                      const isRingSelected = isInputActive && activeProPlusRingIdx === ringIdx;
                      const pickerColsClass =
                        gridSize === 6
                          ? 'grid-cols-6'
                          : gridSize === 4
                          ? 'grid-cols-4'
                          : 'grid-cols-5';

                      return (
                        <div key={ringIdx} className="space-y-1.5">
                          <div
                            onClick={() => {
                              if (isInputActive) setActiveProPlusRingIdx(ringIdx);
                            }}
                            className={`flex items-center justify-between text-xs ${
                              isInputActive ? 'cursor-pointer' : ''
                            }`}
                          >
                            <label
                              htmlFor={`pro-plus-ring-${ringIdx}`}
                              onClick={() => {
                                if (isInputActive) setActiveProPlusRingIdx(ringIdx);
                              }}
                              className={`font-bold ${
                                isInputActive ? 'cursor-pointer' : ''
                              } ${
                                ringIdx === 0
                                  ? 'text-cyan-300'
                                  : ringIdx === 1
                                  ? 'text-violet-300'
                                  : 'text-sky-300'
                              }`}
                            >
                              {isVi ? ringNamesVi[ringIdx] : ringNamesEn[ringIdx]}
                            </label>
                            <span className="font-mono text-[11px] text-slate-400">
                              {ringEval
                                ? `${ringEval.correct.length}/${ringCount} ${isVi ? 'đúng' : 'correct'}`
                                : `${parsedCount}/${ringCount} ${isVi ? 'số' : 'nums'}`}
                            </span>
                          </div>

                          <input
                            id={`pro-plus-ring-${ringIdx}`}
                            ref={(el) => {
                              ringInputRefs.current[ringIdx] = el;
                            }}
                            type="text"
                            inputMode="none"
                            disabled={!isInputActive}
                            value={proPlusInputs[ringIdx]}
                            onClick={() => {
                              if (isInputActive) setActiveProPlusRingIdx(ringIdx);
                            }}
                            onFocus={() => setActiveProPlusRingIdx(ringIdx)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const [c1, c2] = PRO_PLUS_RING_COUNTS[gridSize];
                              setProPlusInputs((prev) => {
                                const next = [...prev] as [string, string, string];
                                next[ringIdx] = val;
                                if (ringIdx === 0 || ringIdx === 1) {
                                  const r1 = parseRingNumbersInput(next[0]);
                                  const r2 = parseRingNumbersInput(next[1]);
                                  if (r1.length === c1 && r2.length === c2) {
                                    const used = new Set([...r1, ...r2]);
                                    next[2] = Array.from(
                                      { length: proPlusRangeTo - proPlusRangeFrom + 1 },
                                      (_, i) => proPlusRangeFrom + i
                                    )
                                      .filter((n) => !used.has(n))
                                      .join(' ');
                                  } else {
                                    next[2] = '';
                                  }
                                }
                                return next;
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isInputActive) {
                                e.preventDefault();
                                if (ringIdx < 2) {
                                  const nextIdx = (ringIdx + 1) as 0 | 1 | 2;
                                  setActiveProPlusRingIdx(nextIdx);
                                  ringInputRefs.current[nextIdx]?.focus();
                                } else {
                                  submitProPlusAnswers(false);
                                }
                              }
                            }}
                            placeholder={
                              proPlusPhase === 'observing'
                                ? isVi
                                  ? `Đang quay quan sát (${ringCount} số)...`
                                  : `Observing (${ringCount} numbers)...`
                                : proPlusPhase === 'idle'
                                ? isVi
                                  ? ringIdx === 2
                                    ? `Tự động hiện số còn lại sau Vòng 1 & 2 (${ringCount} số)...`
                                    : `Chọn hoặc nhập ${ringCount} số sau khi quay...`
                                  : ringIdx === 2
                                  ? `Auto-fills after Rings 1 & 2 (${ringCount} nums)...`
                                  : `Pick or enter ${ringCount} numbers after spin...`
                                : ringIdx === 2
                                ? isVi
                                  ? `Chọn xong Vòng 1 & 2 sẽ tự hiện các số còn lại (${ringCount} số)`
                                  : `Auto-fills remaining numbers after Rings 1 & 2 (${ringCount} nums)`
                                : isVi
                                ? `Chọn nhanh bên dưới hoặc nhập (${ringCount} số)`
                                : `Quick-pick below or type (${ringCount} nums)`
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all outline-none ${
                              isInputActive
                                ? activeProPlusRingIdx === ringIdx
                                  ? 'bg-slate-900 border-cyan-400 text-white ring-2 ring-cyan-500/20'
                                  : 'bg-slate-900 border-slate-700 text-white hover:border-slate-500 cursor-pointer'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          />

                          {/* Quick-pick number buttons when this ring is clicked/selected */}
                          {isRingSelected && (() => {
                            const [c1, c2] = PRO_PLUS_RING_COUNTS[gridSize];
                            const ring1And2Complete = parsedNums0.length === c1 && parsedNums1.length === c2;
                            const isRing3AutoEliminateMode = ringIdx === 2 && ring1And2Complete;
                            const usedIn1And2 = new Set([...parsedNums0, ...parsedNums1]);
                            const fullRangePool = Array.from(
                              { length: Math.max(totalNumbers, proPlusRangeTo - proPlusRangeFrom + 1) },
                              (_, i) => proPlusRangeFrom + i
                            );
                            const quickCandidateNums = isRing3AutoEliminateMode
                              ? fullRangePool.filter((n) => !usedIn1And2.has(n))
                              : fullRangePool;
                            const extraToRemove = Math.max(0, parsedCount - ringCount);

                            return (
                              <div className="p-2 rounded-xl bg-slate-900/95 border border-cyan-500/35 space-y-1.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                  <span
                                    className={`font-semibold ${
                                      isRing3AutoEliminateMode
                                        ? extraToRemove === 0 && parsedCount === ringCount
                                          ? 'text-emerald-300'
                                          : 'text-amber-300'
                                        : 'text-cyan-300'
                                    }`}
                                  >
                                    {isRing3AutoEliminateMode
                                      ? extraToRemove > 0
                                        ? isVi
                                          ? `Chọn loại bỏ ${extraToRemove} số thừa (${parsedCount} → ${ringCount}):`
                                          : `Tap to eliminate ${extraToRemove} extra (${parsedCount} → ${ringCount}):`
                                        : parsedCount === ringCount
                                        ? isVi
                                          ? `✓ Đủ ${ringCount}/${ringCount} số (Bấm số để đổi):`
                                          : `✓ Ready ${ringCount}/${ringCount} (Tap to swap):`
                                        : isVi
                                        ? `Chọn đủ ${ringCount} số (${parsedCount}/${ringCount}):`
                                        : `Keep ${ringCount} numbers (${parsedCount}/${ringCount}):`
                                      : isVi
                                      ? `Chọn nhanh (${proPlusRangeFrom} → ${proPlusRangeTo}):`
                                      : `Quick pick (${proPlusRangeFrom} → ${proPlusRangeTo}):`}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isRing3AutoEliminateMode ? (
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          setProPlusInputs((prev) => {
                                            const next = [...prev] as [string, string, string];
                                            next[2] = quickCandidateNums.join(' ');
                                            return next;
                                          });
                                        }}
                                        className="text-sky-300 hover:text-sky-200 font-semibold cursor-pointer"
                                      >
                                        {isVi ? 'Chọn lại' : 'Reset'}
                                      </button>
                                    ) : (
                                      parsedCount > 0 && (
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            setProPlusInputs((prev) => {
                                              const next = [...prev] as [string, string, string];
                                              next[ringIdx] = '';
                                              if (ringIdx === 0 || ringIdx === 1) {
                                                next[2] = '';
                                              }
                                              return next;
                                            });
                                          }}
                                          className="text-rose-300 hover:text-rose-200 font-semibold cursor-pointer"
                                        >
                                          {isVi ? 'Xóa' : 'Clear'}
                                        </button>
                                      )
                                    )}
                                    {ringIdx < 2 && (
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => setActiveProPlusRingIdx((ringIdx + 1) as 0 | 1 | 2)}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                                      >
                                        {isVi ? `Vòng ${ringIdx + 2} →` : `Ring ${ringIdx + 2} →`}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className={`grid ${pickerColsClass} gap-1 max-h-48 overflow-y-auto pr-0.5`}>
                                  {quickCandidateNums.map((n) => {
                                    const isInThisRing = currentRingNums.includes(n);
                                    const assignedOtherIdx = ([0, 1, 2] as const).find(
                                      (idx) => idx !== ringIdx && allParsedByRing[idx].includes(n)
                                    );

                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggleProPlusQuickNumber(ringIdx, n)}
                                        className={`relative h-8 rounded-lg border font-mono font-extrabold text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                                          isInThisRing
                                            ? ringIdx === 0
                                              ? 'bg-cyan-400 border-cyan-300 text-slate-950 shadow-sm shadow-cyan-500/30'
                                              : ringIdx === 1
                                              ? 'bg-violet-500 border-violet-300 text-white shadow-sm shadow-violet-500/30'
                                              : 'bg-sky-400 border-sky-300 text-slate-950 shadow-sm shadow-sky-500/30'
                                            : isRing3AutoEliminateMode
                                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 line-through hover:bg-rose-500/25'
                                            : assignedOtherIdx !== undefined
                                            ? 'bg-slate-950/70 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                                            : 'bg-slate-950 hover:bg-slate-800 border-slate-700/80 hover:border-cyan-400/60 text-slate-100'
                                        }`}
                                      >
                                        <span>{n}</span>
                                        {!isRing3AutoEliminateMode &&
                                          assignedOtherIdx !== undefined &&
                                          !isInThisRing && (
                                            <span className="absolute top-0.5 right-0.5 text-[8px] leading-none font-bold text-slate-400">
                                              V{assignedOtherIdx + 1}
                                            </span>
                                          )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {proPlusPhase === 'result' && ringEval && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[11px] font-mono">
                              {ringEval.correct.map((n) => (
                                <span
                                  key={`c-${n}`}
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold"
                                >
                                  ✓ {n}
                                </span>
                              ))}
                              {ringEval.wrong.map((n) => (
                                <span
                                  key={`w-${n}`}
                                  className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 line-through font-bold"
                                >
                                  {n}
                                </span>
                              ))}
                              {ringEval.missed.map((n) => (
                                <span
                                  key={`m-${n}`}
                                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/35 text-amber-300/90 font-semibold"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Separated Card 2: Số cần tìm + Timer */}
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/85 border border-violet-500/30">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="text-slate-400 font-semibold">
                        {isVi ? 'Số cần tìm:' : 'Target:'}
                      </span>
                      <span className="text-base sm:text-lg font-black text-violet-400 font-mono">
                        {roundOutcome === 'passed' ? '✓' : nextTarget}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        ({foundCount}/{totalNumbers})
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-black font-mono transition-all ${timerColor}`}
                    >
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>

                  {/* Round Progress Card (Tablet & Desktop) */}
                  <div className="hidden md:block p-3 rounded-2xl bg-slate-950/75 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">
                        {isVi ? `Cấp độ ${activeDiffInfo.labelVi}` : `${activeDiffInfo.labelEn} Mode`}
                      </span>
                      <span className="font-mono font-bold text-violet-400">
                        {isVi ? `Lượt ${currentRound}/${TOTAL_ROUNDS}` : `Round ${currentRound}/${TOTAL_ROUNDS}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isVi ? activeDiffInfo.descVi : activeDiffInfo.descEn}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: TOTAL_ROUNDS }, (_, idx) => {
                        const roundNum = idx + 1;
                        const item = roundHistory.find((r) => r.roundIndex === roundNum);
                        const isActive = status === 'running' && currentRound === roundNum;

                        return (
                          <div
                            key={roundNum}
                            className={`p-1.5 rounded-xl border text-center text-xs transition-all ${
                              item
                                ? item.passed
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : isActive
                                ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                                : 'bg-slate-900/70 border-slate-800 text-slate-500'
                            }`}
                          >
                            <div className="font-bold">#{roundNum}</div>
                            <div className="font-mono text-[11px] mt-0.5">
                              {item
                                ? item.passed
                                  ? `${item.elapsedSec.toFixed(1)}s`
                                  : `${item.foundCount}/${item.totalCount}`
                                : isActive
                                ? `${timeLeft}s`
                                : `${timeLimit}s`}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                      <span>{isVi ? `Bảng ${gridSize}×${gridSize}` : `${gridSize}×${gridSize} Grid`}</span>
                      <span>{isVi ? `Lỗi lượt này: ${mistakes}` : `Mistakes: ${mistakes}`}</span>
                    </div>
                  </div>
                </>
              )}

              {difficulty === 'pro' && proRuleHint && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-center text-xs font-bold text-rose-300 animate-in fade-in duration-150">
                  {proRuleHint}
                </div>
              )}
            </div>

            {/* Block B: Schulte Grid Arena + Vertical Pro Color Bar */}
            <div
              className={`landscape-block-b md:col-span-7 md:col-start-6 md:row-start-1 md:row-span-2 md:self-start w-full mx-auto ${
                difficulty === 'pro' && status === 'running'
                  ? 'schulte-arena-pro max-w-[495px] xl:max-w-[530px]'
                  : 'schulte-arena max-w-[390px] xl:max-w-[420px]'
              }`}
            >
              <div className="flex items-stretch justify-center gap-2 sm:gap-3">
                <div
                  className={`relative flex-1 min-w-0 p-2 sm:p-3 rounded-3xl bg-slate-950/90 shadow-inner border ${
                    difficulty === 'pro-plus' ? 'border-cyan-500/40' : 'border-violet-500/30'
                  }`}
                >
                  {difficulty === 'pro-plus' ? (
                    <div className="relative aspect-square w-full flex items-center justify-center">
                      <svg
                        viewBox="0 0 400 400"
                        className="w-full h-full select-none drop-shadow-[0_0_20px_rgba(56,189,248,0.18)]"
                      >
                        {(() => {
                          const ringCounts = PRO_PLUS_RING_COUNTS[gridSize];
                          let offset = 0;
                          const slices = ringCounts.map((count, ringIdx) => {
                            const startIdx = offset;
                            offset += count;
                            return { ringIdx, count, startIdx };
                          });

                          // Render outer -> middle -> inner so inner ring borders sit cleanly on top
                          return [...slices].reverse().map(({ ringIdx, count, startIdx }) => {
                            const ring = PRO_PLUS_RINGS[ringIdx];
                            const stepAngle = 360 / count;
                            const numFontSize =
                              gridSize === 3
                                ? 24
                                : gridSize === 4
                                ? 21
                                : gridSize === 5
                                ? ringIdx === 0
                                  ? 19
                                  : 20
                                : ringIdx === 0
                                ? 16
                                : 17;

                            return (
                              <g
                                key={ring.id}
                                style={{ transformOrigin: '200px 200px' }}
                                className={`${ring.spinClass} ${
                                  proPlusPhase !== 'observing' ? 'ring-paused' : ''
                                }`}
                              >
                                {Array.from({ length: count }, (_, sIdx) => {
                                  const globalIdx = startIdx + sIdx;
                                  const num = numbers[globalIdx];
                                  if (typeof num !== 'number') return null;

                                  const startAngle = ring.angleOffset + sIdx * stepAngle;
                                  const endAngle = startAngle + stepAngle;
                                  const midAngle = startAngle + stepAngle / 2;
                                  const textPos = polarToCartesian(200, 200, ring.textR, midAngle);
                                  const coordPos = polarToCartesian(200, 200, ring.coordR, midAngle);

                                  const ringEval = proPlusResult?.rings[ringIdx];
                                  const isCorrectInResult =
                                    proPlusPhase === 'result' &&
                                    Boolean(ringEval?.correct.includes(num));
                                  const isHiddenAnswering = proPlusPhase === 'answering';

                                  const colorIdx =
                                    tileColorIndices[globalIdx] ?? globalIdx % PRO_PLUS_HEX_COLORS.length;
                                  const textColor = isHiddenAnswering
                                    ? 'rgba(56, 189, 248, 0.35)'
                                    : isCorrectInResult
                                    ? '#34d399'
                                    : PRO_PLUS_HEX_COLORS[
                                        (globalIdx + colorIdx) % PRO_PLUS_HEX_COLORS.length
                                      ];
                                  const fillColor = isCorrectInResult
                                    ? 'rgba(16, 185, 129, 0.22)'
                                    : isHiddenAnswering
                                    ? '#040914'
                                    : '#060e1f';
                                  const strokeColor = isCorrectInResult ? '#34d399' : '#38bdf8';
                                  const coordLabel = `${ROW_LETTERS[ringIdx]}${sIdx + 1}`;

                                  return (
                                    <g key={`${ring.id}-${sIdx}-${num}`}>
                                      <path
                                        d={describeAnnularSector(
                                          200,
                                          200,
                                          ring.innerR,
                                          ring.outerR,
                                          startAngle,
                                          endAngle
                                        )}
                                        fill={fillColor}
                                        stroke={strokeColor}
                                        strokeWidth={isCorrectInResult ? '2.2' : '1.6'}
                                        strokeLinejoin="round"
                                      />

                                      <g
                                        style={{
                                          transformOrigin: `${textPos.x.toFixed(2)}px ${textPos.y.toFixed(2)}px`,
                                        }}
                                        className={`${ring.counterClass} ${
                                          proPlusPhase !== 'observing' ? 'ring-paused' : ''
                                        }`}
                                      >
                                        <text
                                          x={textPos.x}
                                          y={textPos.y}
                                          textAnchor="middle"
                                          dominantBaseline="central"
                                          fill={textColor}
                                          fontSize={
                                            !isHiddenAnswering && num >= 100
                                              ? Math.round(numFontSize * 0.8)
                                              : numFontSize
                                          }
                                          fontWeight="900"
                                          className="font-mono pointer-events-none"
                                        >
                                          {isHiddenAnswering ? '?' : num}
                                        </text>
                                      </g>

                                      {(showCoordinates || isListening) && (
                                        <g
                                          style={{
                                            transformOrigin: `${coordPos.x.toFixed(2)}px ${coordPos.y.toFixed(2)}px`,
                                          }}
                                          className={`${ring.counterClass} ${
                                            proPlusPhase !== 'observing' ? 'ring-paused' : ''
                                          }`}
                                        >
                                          <text
                                            x={coordPos.x}
                                            y={coordPos.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="rgba(125, 211, 252, 0.78)"
                                            fontSize="8.5"
                                            fontWeight="700"
                                            className="font-mono pointer-events-none"
                                          >
                                            {coordLabel}
                                          </text>
                                        </g>
                                      )}
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          });
                        })()}

                        {showCenterDot && (
                          <g className="pointer-events-none">
                            <circle
                              cx="200"
                              cy="200"
                              r="11"
                              fill="rgba(34, 211, 238, 0.22)"
                              stroke="rgba(34, 211, 238, 0.85)"
                              strokeWidth="2"
                            />
                            <circle cx="200" cy="200" r="3" fill="#22d3ee" />
                          </g>
                        )}
                      </svg>
                    </div>
                  ) : (
                    <>
                      {/* Column Coordinate Headers (1..gridSize) */}
                      {(showCoordinates || isListening) && (
                        <div className="pl-[20px] sm:pl-[26px] mb-1">
                          <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2`}>
                            {Array.from({ length: gridSize }, (_, colIdx) => (
                              <div
                                key={colIdx}
                                className="text-center text-[10px] sm:text-xs font-mono font-bold text-violet-400/90 select-none leading-none"
                              >
                                {colIdx + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-stretch">
                        {/* Row Coordinate Headers (A..F) */}
                        {(showCoordinates || isListening) && (
                          <div
                            className="w-4 mr-1 sm:w-5 sm:mr-1.5 grid gap-1.5 sm:gap-2 shrink-0"
                            style={{ gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}
                          >
                            {Array.from({ length: gridSize }, (_, rowIdx) => (
                              <div
                                key={rowIdx}
                                className="flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-violet-400/90 select-none"
                              >
                                {ROW_LETTERS[rowIdx]}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={`flex-1 min-w-0 grid ${gridColsClass} gap-1.5 sm:gap-2 aspect-square relative`}>
                          {numbers.map((num, idx) => {
                            const found = isAlreadyFound(num);
                            const isWrong = wrongTile === num;
                            const isCenter = showCenterDot && idx === centerTileIndex;
                            const rowIdx = Math.floor(idx / gridSize);
                            const colIdx = idx % gridSize;
                            const coordLabel = `${ROW_LETTERS[rowIdx]}${colIdx + 1}`;
                            const colorIdx = tileColorIndices[idx] ?? idx % HARD_TEXT_COLORS.length;
                            const hardNumberColor =
                              difficulty === 'hard' && !isWrong && !(found && highlightFound)
                                ? HARD_TEXT_COLORS[colorIdx]
                                : '';
                            const isProBg = difficulty === 'pro' && Boolean(tileBgMask[idx]);
                            const activeBgStyle = PRO_BG_STYLES[activeProBgColor];
                            const proPlainNumberColor =
                              difficulty === 'pro' && !isProBg && !isWrong && !(found && highlightFound)
                                ? PRO_TEXT_COLORS[colorIdx % PRO_TEXT_COLORS.length]
                                : '';
                            const coordCornerClass =
                              difficulty === 'pro' && showCoordinates
                                ? COORD_CORNER_CLASSES[(tileCoordCorners[idx] ?? idx) % COORD_CORNER_CLASSES.length]
                                : COORD_CORNER_CLASSES[0];
                            const coordColorClass = isProBg
                              ? activeBgStyle.coordClass
                              : difficulty === 'hard'
                              ? HARD_TEXT_COLORS[(colorIdx + 1) % HARD_TEXT_COLORS.length]
                              : PRO_TEXT_COLORS[(colorIdx + 2) % PRO_TEXT_COLORS.length];

                            return (
                              <button
                                key={`${num}-${idx}`}
                                type="button"
                                disabled={status !== 'running'}
                                onClick={() => handleTileClick(num, false)}
                                className={`relative rounded-xl sm:rounded-2xl font-mono font-black flex items-center justify-center transition-all duration-150 select-none border ${tileTextSize} ${
                                  status !== 'running'
                                    ? 'cursor-default'
                                    : 'cursor-pointer active:scale-95'
                                } ${
                                  isWrong
                                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20 animate-pulse'
                                    : found && highlightFound
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400/50 shadow-inner'
                                    : isProBg
                                    ? activeBgStyle.tileClass
                                    : difficulty === 'pro'
                                    ? `bg-slate-900/95 hover:bg-violet-500/15 border-slate-800 hover:border-violet-400/60 ${proPlainNumberColor} shadow-md hover:shadow-violet-500/15`
                                    : difficulty === 'hard'
                                    ? `bg-slate-900/95 hover:bg-violet-500/15 border-slate-800 hover:border-violet-400/60 ${hardNumberColor} shadow-md hover:shadow-violet-500/15`
                                    : 'bg-slate-900/95 hover:bg-violet-500/15 border-slate-800 hover:border-violet-400/60 text-amber-100 hover:text-white shadow-md hover:shadow-violet-500/15'
                                }`}
                              >
                                {(showCoordinates || isListening) && (
                                  <span
                                    className={`absolute ${coordCornerClass} text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none leading-none opacity-85 ${coordColorClass}`}
                                  >
                                    {coordLabel}
                                  </span>
                                )}
                                <span className="relative z-10">{num}</span>
                                {isCenter && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute z-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-cyan-400/20 border-2 border-cyan-400/60 pointer-events-none"
                                  />
                                )}
                              </button>
                            );
                          })}

                          {showCenterDot && gridSize % 2 === 0 && (
                            <span
                              aria-hidden="true"
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400/80 ring-4 ring-cyan-400/20 pointer-events-none z-20"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}

              {/* Overlay when idle */}
              {(difficulty === 'pro-plus' ? proPlusPhase === 'idle' : status === 'idle') && (
                <div className="absolute inset-0 rounded-3xl bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-30">
                  <p className="text-sm sm:text-base font-bold text-white">
                    {difficulty === 'pro-plus'
                      ? isVi
                        ? `Pro+ • ${gridSize}×${gridSize} (${proPlusRangeFrom}–${proPlusRangeTo}) • Quay ${timeLimit}s → Trả lời ${answerTimeLimit}s`
                        : `Pro+ • ${gridSize}×${gridSize} (${proPlusRangeFrom}–${proPlusRangeTo}) • Spin ${timeLimit}s → Answer ${answerTimeLimit}s`
                      : isVi
                      ? `Cấp độ ${activeDiffInfo.labelVi} • ${gridSize}×${gridSize} • ${timeLimit}s`
                      : `${activeDiffInfo.labelEn} Level • ${gridSize}×${gridSize} Grid • ${timeLimit}s Limit`}
                  </p>
                  <button
                    type="button"
                    onClick={() => startChallengeSession()}
                    className={`px-6 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                      difficulty === 'pro-plus'
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-cyan-500/30'
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white shadow-violet-500/30'
                    }`}
                  >
                    <Play className={`w-4 h-4 ${difficulty === 'pro-plus' ? 'fill-slate-950' : 'fill-white'}`} />
                    <span>
                      {difficulty === 'pro-plus'
                        ? isVi
                          ? `Bắt đầu quan sát (${timeLimit}s)`
                          : `Start Observation (${timeLimit}s)`
                        : isVi
                        ? `Bắt đầu thử thách (${TOTAL_ROUNDS} lượt)`
                        : `Start Challenge (${TOTAL_ROUNDS} Rounds)`}
                    </span>
                  </button>
                </div>
              )}
                </div>

                {/* Pro Mode: 3 Color Buttons in 1 vertical column next to Schulte table */}
                {difficulty === 'pro' && status === 'running' && (
                  <div className="w-[68px] sm:w-[96px] shrink-0 p-1.5 sm:p-2 rounded-3xl bg-slate-950/90 border border-violet-500/30 flex flex-col gap-1.5 sm:gap-2.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('green', false)}
                      className="flex-1 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center"
                    >
                      {isVi ? 'Xanh' : 'Green'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('yellow', false)}
                      className="flex-1 min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 border border-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center"
                    >
                      {isVi ? 'Vàng' : 'Yellow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('purple', false)}
                      className="flex-1 min-h-[56px] rounded-2xl bg-violet-600 hover:bg-violet-500 border border-violet-400 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center"
                    >
                      {isVi ? 'Tím' : 'Purple'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Block C: Submit / Voice / Round Result */}
            <div className="landscape-block-c md:col-span-5 md:col-start-1 md:row-start-2 md:self-start space-y-2.5">
              {difficulty === 'pro-plus' ? (
                <>
                  {proPlusPhase === 'answering' && (
                    <button
                      type="button"
                      onClick={() => submitProPlusAnswers(false)}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isVi ? 'Nộp bài & Kiểm tra' : 'Submit & Check'}</span>
                    </button>
                  )}

                  {proPlusPhase === 'result' && proPlusResult && (
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-150">
                      <div
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border shadow-md ${
                          proPlusResult.totalCorrect === proPlusResult.totalNumbers &&
                          proPlusResult.totalWrong === 0
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {isVi
                            ? `Đúng ${proPlusResult.totalCorrect}/${proPlusResult.totalNumbers} số${
                                proPlusResult.totalWrong > 0 ? ` • Sai ${proPlusResult.totalWrong}` : ''
                              } (${proPlusResult.answerElapsedSec}s)`
                            : `Matched ${proPlusResult.totalCorrect}/${proPlusResult.totalNumbers}${
                                proPlusResult.totalWrong > 0 ? ` • Wrong ${proPlusResult.totalWrong}` : ''
                              } (${proPlusResult.answerElapsedSec}s)`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => startProPlusSession(gridSize, timeLimit)}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95 text-xs sm:text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isVi ? 'Chơi lại' : 'Try Again'}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {difficulty === 'pro' && status === 'running' && (
                    <div className="md:hidden px-3 py-2 rounded-xl bg-slate-950/85 border border-violet-500/30 text-[11px] font-semibold text-slate-300 text-center">
                      {isVi
                        ? 'Có màu nền → Chọn MÀU bên cạnh bảng • Không nền → Bấm hoặc nói SỐ'
                        : 'Colored bg → Tap COLOR beside grid • No bg → Tap or speak NUMBER'}
                    </div>
                  )}

                  {/* Bottom Voice Button */}
                  {status === 'running' && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`w-full h-12 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 px-3 ${
                        isListening
                          ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-400 shadow-lg shadow-rose-500/35 animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-md'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4 text-white shrink-0" />
                          <span className="truncate">
                            {isVi
                              ? 'Đang nghe giọng nói... (Bấm để dừng)'
                              : 'Listening Voice... (Click to stop)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {isVi
                              ? `Trả lời  (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'})`
                              : `Speak Number (${highlightFound ? 'Mark Found' : 'No Mark Found'})`}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Round Result Banner + Manual Next Round */}
                  {status === 'round-ended' && (
                    <div className="space-y-2.5 animate-in zoom-in-95 duration-150">
                      {roundOutcome === 'passed' ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {isVi
                              ? `Hoàn thành xuất sắc trong ${(roundElapsedMs / 1000).toFixed(2)}s! (Lỗi: ${mistakes})`
                              : `Completed in ${(roundElapsedMs / 1000).toFixed(2)}s! (Mistakes: ${mistakes})`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            {isVi
                              ? `Hết giờ! Đã tìm được ${foundCount}/${totalNumbers} số`
                              : `Time's up! Found ${foundCount}/${totalNumbers} numbers`}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={goToNextRound}
                        className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                      >
                        <span>
                          {currentRound >= TOTAL_ROUNDS
                            ? isVi
                              ? 'Xem Tổng Kết'
                              : 'View Results'
                            : isVi
                            ? `Vòng tiếp theo (${currentRound + 1}/${TOTAL_ROUNDS})`
                            : `Next Round (${currentRound + 1}/${TOTAL_ROUNDS})`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
