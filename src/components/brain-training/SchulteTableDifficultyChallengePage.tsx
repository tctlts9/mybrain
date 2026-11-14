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
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playSpeakerChime } from '../../utils/speechUtils';
import { parseSchulteVoiceActions, SchulteColorAnswer } from '../../utils/schulteVoice';
import type { SchulteGridSize } from './SchulteTableChallengePage';

type OrderMode = 'asc' | 'desc';
type TimeLimit = 10 | 20 | 30 | 40 | 50 | 60;
type DifficultyLevel = 'hard' | 'pro';
type ChallengeStatus = 'idle' | 'running' | 'round-ended' | 'completed';

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

const TOTAL_ROUNDS = 3;
const AUTO_NEXT_DELAY_SEC = 5;
const GRID_SIZES: SchulteGridSize[] = [3, 4, 5, 6];
const TIME_LIMITS: TimeLimit[] = [10, 20, 30, 40, 50, 60];
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
    descVi: '4 màu ngẫu nhiên • Bảng cố định',
    descEn: '4 random colors • Static grid',
  },
  {
    id: 'pro',
    labelVi: 'Siêu khó',
    labelEn: 'Pro',
    descVi: 'Có màu nền → Trả lời MÀU • Không có nền → Trả lời SỐ',
    descEn: 'Colored bg → Answer COLOR • No bg → Answer NUMBER',
  },
];
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
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

const generateShuffledNumbers = (size: SchulteGridSize): number[] => {
  const total = size * size;
  const arr = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  const [showCenterDot, setShowCenterDot] = useState<boolean>(true);
  const [highlightFound, setHighlightFound] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Session & Board State
  const [status, setStatus] = useState<ChallengeStatus>('idle');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [numbers, setNumbers] = useState<number[]>(() => generateShuffledNumbers(initialGridSize));
  const [tileColorIndices, setTileColorIndices] = useState<number[]>(() =>
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
  const [autoNextSeconds, setAutoNextSeconds] = useState<number>(AUTO_NEXT_DELAY_SEC);

  const countdownRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(0);
  const wrongTimeoutRef = useRef<number | null>(null);
  const autoNextTimerRef = useRef<number | null>(null);
  const autoNextIntervalRef = useRef<number | null>(null);
  const markedBannerTimeoutRef = useRef<number | null>(null);
  const shuffleNoticeTimeoutRef = useRef<number | null>(null);
  const proHintTimeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const consumedLengthByIndexRef = useRef<Map<number, number>>(new Map());
  const hitsSinceShuffleRef = useRef<number>(0);

  const nextTargetRef = useRef(nextTarget);
  nextTargetRef.current = nextTarget;
  const mistakesRef = useRef(mistakes);
  mistakesRef.current = mistakes;
  const currentRoundRef = useRef(currentRound);
  currentRoundRef.current = currentRound;

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
    if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (autoNextIntervalRef.current !== null) {
      window.clearInterval(autoNextIntervalRef.current);
      autoNextIntervalRef.current = null;
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
    setNumbers(generateShuffledNumbers(sizeToUse));
    setTileColorIndices(generateRandomColorIndices(sizeToUse * sizeToUse));
    setTileBgMask(generateRandomBgMask(sizeToUse * sizeToUse));
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
    (sizeToUse: SchulteGridSize, modeToUse: OrderMode) => {
      const total = sizeToUse * sizeToUse;
      setNumbers(generateShuffledNumbers(sizeToUse));
      setTileColorIndices(generateRandomColorIndices(total));
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

  const startChallengeSession = useCallback(
    (explicitSize?: SchulteGridSize, explicitLimit?: TimeLimit, explicitMode?: OrderMode) => {
      clearTimers();
      const activeSize = explicitSize ?? gridSize;
      const activeLimit = explicitLimit ?? timeLimit;
      const activeMode = explicitMode ?? orderMode;

      setCurrentRound(1);
      setPassedCount(0);
      setRoundHistory([]);
      setAutoNextSeconds(AUTO_NEXT_DELAY_SEC);

      prepareBoard(activeSize, activeMode);
      setStatus('running');
      startCountdown(activeLimit);
    },
    [clearTimers, gridSize, orderMode, prepareBoard, startCountdown, timeLimit]
  );

  const goToNextRound = useCallback(() => {
    if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (autoNextIntervalRef.current !== null) {
      window.clearInterval(autoNextIntervalRef.current);
      autoNextIntervalRef.current = null;
    }

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

  // Tự động chuyển sang vòng tiếp theo sau 5 giây khi kết thúc 1 vòng
  useEffect(() => {
    if (status === 'round-ended') {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
      if (autoNextIntervalRef.current !== null) {
        window.clearInterval(autoNextIntervalRef.current);
      }

      setAutoNextSeconds(AUTO_NEXT_DELAY_SEC);
      autoNextIntervalRef.current = window.setInterval(() => {
        setAutoNextSeconds((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      autoNextTimerRef.current = window.setTimeout(() => {
        goToNextRound();
      }, AUTO_NEXT_DELAY_SEC * 1000);
    } else {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      if (autoNextIntervalRef.current !== null) {
        window.clearInterval(autoNextIntervalRef.current);
        autoNextIntervalRef.current = null;
      }
    }

    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      if (autoNextIntervalRef.current !== null) {
        window.clearInterval(autoNextIntervalRef.current);
        autoNextIntervalRef.current = null;
      }
    };
  }, [status, goToNextRound]);

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
          const actions = parseSchulteVoiceActions(deltaText, currentSize, activeTarget);
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
    setDifficulty(newDiff);
    let nextMode: OrderMode = orderMode;
    let nextHighlight = highlightFound;

    if (newDiff === 'hard') {
      nextMode = 'desc';
      nextHighlight = false;
    } else if (newDiff === 'pro') {
      nextMode = 'desc';
      nextHighlight = false;
    }

    setOrderMode(nextMode);
    setHighlightFound(nextHighlight);

    const total = gridSize * gridSize;
    if (newDiff === 'hard' || newDiff === 'pro') {
      // Giữ nguyên vị trí các số hiện tại trên bảng Schulte khi chọn Hard hoặc Pro
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
        setAutoNextSeconds(AUTO_NEXT_DELAY_SEC);
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
    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(newSize, timeLimit, orderMode);
    } else {
      prepareBoard(newSize, orderMode);
    }
  };

  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    setTimeLimit(newLimit);
    setTimeLeft(newLimit);
    if (status === 'running' || status === 'round-ended') {
      startChallengeSession(gridSize, newLimit, orderMode);
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
    setCurrentRound(1);
    setPassedCount(0);
    setRoundHistory([]);
    setAutoNextSeconds(AUTO_NEXT_DELAY_SEC);
    setTimeLeft(timeLimit);
    setRoundElapsedMs(0);
    prepareBoard(gridSize, orderMode);
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

  const timerColor =
    timeLeft <= 5
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : timeLeft <= Math.ceil(timeLimit * 0.4)
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
      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-violet-950/30 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Title + Time Limit Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <Gauge className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">
                {isVi ? 'Thử Thách Cấp Độ Khó — Bảng Schulte' : 'Schulte Table — Difficulty Level Challenge'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isVi
                  ? `Lượt ${currentRound}/${TOTAL_ROUNDS} • ${activeDiffInfo.descVi}`
                  : `Round ${currentRound}/${TOTAL_ROUNDS} • ${activeDiffInfo.descEn}`}
              </p>
            </div>
          </div>

          {/* Time Limit Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-violet-400" />
              <span>{isVi ? 'Giới hạn:' : 'Limit:'}</span>
            </span>
            {TIME_LIMITS.map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => handleSelectTimeLimit(limit)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  timeLimit === limit
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {limit}s
              </button>
            ))}
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

            {/* Order Mode */}
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

            {/* Center Dot */}
            <button
              type="button"
              onClick={() => setShowCenterDot((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                showCenterDot
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>{isVi ? ' Tâm điểm' : 'Center Dot'}</span>
            </button>

            {/* Mark Found / No Mark Found Toggle */}
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
              <span>{isListening ? (isVi ? 'Đang nghe' : 'Listening') : isVi ? 'Trả lời bằng Giọng nói' : 'Voice'}</span>
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

        {/* Compact Horizontal Row: Cấp độ - Hoàn thành - Số cần tìm */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs relative z-10">
          {/* Cấp độ */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-violet-400" />
              <span>{isVi ? 'Cấp độ:' : 'Difficulty:'}</span>
            </span>
            {DIFFICULTY_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectDifficulty(lvl.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  difficulty === lvl.id
                    ? lvl.id === 'pro'
                      ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-sm'
                      : 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isVi ? lvl.labelVi : lvl.labelEn}
              </button>
            ))}
          </div>

          {/* Hoàn thành */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/70 border border-slate-800/80 shrink-0">
            <span className="text-xs text-slate-400 font-semibold">
              {isVi ? 'Hoàn thành:' : 'Passed:'}
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
              {passedCount}/{TOTAL_ROUNDS}
            </span>
          </div>

          {/* Số cần tìm + Timer */}
          {status !== 'completed' && (
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900/70 border border-slate-800/80 shrink-0">
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
          )}
        </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-center relative z-10">
            {/* Block A: Desktop Level Rules & Round Progress + Pro Hint */}
            <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:self-end space-y-2.5">
              <div className="hidden lg:block p-3.5 rounded-2xl bg-slate-950/75 border border-slate-800/80 space-y-2.5">
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
                        className={`p-2 rounded-xl border text-center text-xs transition-all ${
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

              {difficulty === 'pro' && proRuleHint && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-center text-xs font-bold text-rose-300 animate-in fade-in duration-150">
                  {proRuleHint}
                </div>
              )}
            </div>

            {/* Block B: Schulte Grid Arena */}
            <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2 lg:self-center w-full max-w-[430px] xl:max-w-[460px] mx-auto">
              <div className="relative p-2.5 sm:p-3.5 rounded-3xl bg-slate-950/90 border border-violet-500/30 shadow-inner">
                <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2 aspect-square relative`}>
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
                      {isListening && (
                        <span
                          className={`absolute top-1 left-1.5 text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none ${
                            isProBg ? activeBgStyle.coordClass : 'text-violet-400/75'
                          }`}
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

              {/* Overlay when idle */}
              {status === 'idle' && (
                <div className="absolute inset-0 rounded-3xl bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-30">
                  <p className="text-sm sm:text-base font-bold text-white">
                    {isVi
                      ? `Cấp độ ${activeDiffInfo.labelVi} • ${gridSize}×${gridSize} • ${timeLimit}s`
                      : `${activeDiffInfo.labelEn} Level • ${gridSize}×${gridSize} Grid • ${timeLimit}s Limit`}
                  </p>
                  <button
                    type="button"
                    onClick={() => startChallengeSession()}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {isVi
                        ? `Bắt đầu thử thách (${TOTAL_ROUNDS} lượt)`
                        : `Start Challenge (${TOTAL_ROUNDS} Rounds)`}
                    </span>
                  </button>
                </div>
              )}
              </div>
            </div>

            {/* Block C: Pro Color Answer Bar, Voice Action & Round Result */}
            <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:self-start space-y-2.5">
              {/* Pro Mode Color Answer Bar */}
              {difficulty === 'pro' && status === 'running' && (
                <div className="p-3 rounded-2xl bg-slate-950/85 border border-violet-500/30 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-300 text-center">
                    {isVi
                      ? 'Nếu số mục tiêu CÓ MÀU NỀN → Chọn hoặc nói MÀU • Không nền → Bấm hoặc nói SỐ'
                      : 'If target has COLORED BG → Tap or speak COLOR • No bg → Tap or speak NUMBER'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('green', false)}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      {isVi ? 'Xanh' : 'Green'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('yellow', false)}
                      className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 border border-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      {isVi ? 'Vàng' : 'Yellow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleColorAnswer('purple', false)}
                      className="h-10 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-400 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      {isVi ? 'Tím' : 'Purple'}
                    </button>
                  </div>
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
                          ? `Giọng nói — Trả lời số (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'})`
                          : `Voice — Speak Number (${highlightFound ? 'Mark Found' : 'No Mark Found'})`}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Round Result Banner + Auto-advance */}
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
                          ? `Xem Tổng Kết (tự chuyển sau ${autoNextSeconds}s)`
                          : `View Results (auto in ${autoNextSeconds}s)`
                        : isVi
                        ? `Vòng tiếp theo (${currentRound + 1}/${TOTAL_ROUNDS}) - tự chuyển sau ${autoNextSeconds}s`
                        : `Next Round (${currentRound + 1}/${TOTAL_ROUNDS}) - auto in ${autoNextSeconds}s`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
