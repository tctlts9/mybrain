import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Timer,
  Trophy,
  Eye,
  Volume2,
  VolumeX,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Target,
  Zap,
  Mic,
  MicOff,
  AlertTriangle,
  Gauge,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  playSpeakerChime,
  speakSchulteNumber,
  stopCurrentSpeech,
} from '../../utils/speechUtils';
import { parseSchulteVoiceActions } from '../../utils/schulteVoice';

type GridSize = 3 | 4 | 5 | 6;
type OrderMode = 'asc' | 'desc';

interface SchulteTablePageProps {
  onBack: () => void;
  onOpenChallenge?: (gridSize: GridSize) => void;
  onOpenDifficultyChallenge?: (gridSize: GridSize) => void;
}

const GRID_SIZES: GridSize[] = [3, 4, 5, 6];
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const generateShuffledNumbers = (size: GridSize): number[] => {
  const total = size * size;
  const arr = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const formatTime = (ms: number): string => {
  const totalSeconds = ms / 1000;
  return `${totalSeconds.toFixed(2)}s`;
};

const getRecordKey = (size: GridSize, mode: OrderMode) =>
  `schulte_best_${size}x${size}_${mode}`;

export const SchulteTablePage: React.FC<SchulteTablePageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenDifficultyChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [gridSize, setGridSize] = useState<GridSize>(5);
  const [orderMode, setOrderMode] = useState<OrderMode>('asc');
  const [numbers, setNumbers] = useState<number[]>(() => generateShuffledNumbers(5));
  const [nextTarget, setNextTarget] = useState<number>(1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [mistakes, setMistakes] = useState<number>(0);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [showCenterDot, setShowCenterDot] = useState<boolean>(true);
  const [highlightFound, setHighlightFound] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Target Speaker & Mic Voice Input State
  const [isSpeakingTarget, setIsSpeakingTarget] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');
  const [lastMarkedByVoice, setLastMarkedByVoice] = useState<number | null>(null);

  const [bestTimeMs, setBestTimeMs] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getRecordKey(5, 'asc'));
      return saved ? parseFloat(saved) : null;
    }
    return null;
  });

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const wrongTimeoutRef = useRef<number | null>(null);
  const markedBannerTimeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const consumedLengthByIndexRef = useRef<Map<number, number>>(new Map());

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

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

  const speakTargetAloud = useCallback(
    (numToSpeak: number) => {
      setIsSpeakingTarget(true);
      speakSchulteNumber(numToSpeak, isVi ? 'vi' : 'en', () => {
        setIsSpeakingTarget(false);
      });
    },
    [isVi]
  );

  const resetBoard = useCallback(
    (targetSize: GridSize = gridSize, targetMode: OrderMode = orderMode) => {
      stopTimer();
      stopCurrentSpeech();
      if (wrongTimeoutRef.current !== null) {
        window.clearTimeout(wrongTimeoutRef.current);
        wrongTimeoutRef.current = null;
      }
      if (markedBannerTimeoutRef.current !== null) {
        window.clearTimeout(markedBannerTimeoutRef.current);
        markedBannerTimeoutRef.current = null;
      }
      const total = targetSize * targetSize;
      const initialTarget = targetMode === 'asc' ? 1 : total;
      setNumbers(generateShuffledNumbers(targetSize));
      setNextTarget(initialTarget);
      setElapsedMs(0);
      setStatus('idle');
      setMistakes(0);
      setWrongTile(null);
      setIsNewRecord(false);
      setVoiceTranscript('');
      setLastMarkedByVoice(null);
      consumedLengthByIndexRef.current.clear();
      startTimeRef.current = null;

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(getRecordKey(targetSize, targetMode));
        setBestTimeMs(saved ? parseFloat(saved) : null);
      }
    },
    [gridSize, orderMode, stopTimer]
  );

  useEffect(() => {
    return () => {
      stopTimer();
      stopListening();
      stopCurrentSpeech();
      if (wrongTimeoutRef.current !== null) {
        window.clearTimeout(wrongTimeoutRef.current);
      }
      if (markedBannerTimeoutRef.current !== null) {
        window.clearTimeout(markedBannerTimeoutRef.current);
      }
    };
  }, [stopTimer, stopListening]);

  const startTimer = useCallback(() => {
    stopTimer();
    const now = performance.now();
    startTimeRef.current = now;
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(performance.now() - startTimeRef.current);
      }
    }, 30);
  }, [stopTimer]);

  const handleTileClick = useCallback(
    (num: number, fromVoice: boolean = false) => {
      if (status === 'completed') return;

      if (status === 'idle') {
        setStatus('running');
        startTimer();
      }

      const total = gridSize * gridSize;

      if (num === nextTarget) {
        if (isSoundOn) playSpeakerChime('correct');
        if (fromVoice) {
          setLastMarkedByVoice(num);
          if (markedBannerTimeoutRef.current !== null) {
            window.clearTimeout(markedBannerTimeoutRef.current);
          }
          markedBannerTimeoutRef.current = window.setTimeout(() => {
            setLastMarkedByVoice(null);
          }, 1500);
        }

        const isLast =
          (orderMode === 'asc' && num === total) ||
          (orderMode === 'desc' && num === 1);

        if (isLast) {
          stopTimer();
          const finalMs =
            startTimeRef.current !== null
              ? performance.now() - startTimeRef.current
              : elapsedMs;
          setElapsedMs(finalMs);
          setStatus('completed');

          if (typeof window !== 'undefined') {
            const key = getRecordKey(gridSize, orderMode);
            const prevBestStr = localStorage.getItem(key);
            const prevBest = prevBestStr ? parseFloat(prevBestStr) : null;
            if (prevBest === null || finalMs < prevBest) {
              localStorage.setItem(key, String(finalMs));
              setBestTimeMs(finalMs);
              setIsNewRecord(true);
            }
          }
        } else {
          const updatedTarget = orderMode === 'asc' ? nextTarget + 1 : nextTarget - 1;
          setNextTarget(updatedTarget);
        }
      } else {
        if (isSoundOn) playSpeakerChime('incorrect');
        setMistakes((prev) => prev + 1);
        setWrongTile(num);
        if (wrongTimeoutRef.current !== null) {
          window.clearTimeout(wrongTimeoutRef.current);
        }
        wrongTimeoutRef.current = window.setTimeout(() => {
          setWrongTile(null);
        }, 350);
      }
    },
    [
      elapsedMs,
      gridSize,
      isSoundOn,
      nextTarget,
      orderMode,
      startTimer,
      status,
      stopTimer,
    ]
  );

  // Fresh refs for SpeechRecognition callbacks
  const handleTileClickRef = useRef(handleTileClick);
  handleTileClickRef.current = handleTileClick;
  const resetBoardRef = useRef(resetBoard);
  resetBoardRef.current = resetBoard;
  const numbersRef = useRef(numbers);
  numbersRef.current = numbers;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const nextTargetRef = useRef(nextTarget);
  nextTargetRef.current = nextTarget;
  const orderModeRef = useRef(orderMode);
  orderModeRef.current = orderMode;

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
            if (action.type === 'reset') {
              consumedLengthByIndexRef.current.set(idx, fullText.length);
              resetBoardRef.current();
              return;
            }
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
                // Only record mismatch when phrase is finalized so multi-digit numbers (e.g. 25) aren't penalized mid-word
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

  const handleSizeChange = (size: GridSize) => {
    setGridSize(size);
    resetBoard(size, orderMode);
  };

  const handleModeChange = (mode: OrderMode) => {
    setOrderMode(mode);
    resetBoard(gridSize, mode);
  };

  const isAlreadyFound = (num: number): boolean => {
    if (status === 'completed') return true;
    if (status === 'idle') return false;
    return orderMode === 'asc' ? num < nextTarget : num > nextTarget;
  };

  const totalNumbers = gridSize * gridSize;
  const completedCount =
    status === 'completed'
      ? totalNumbers
      : orderMode === 'asc'
      ? nextTarget - 1
      : totalNumbers - nextTarget;

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
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-7 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopListening();
            stopCurrentSpeech();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>{isVi ? 'Quay lại Brain Training' : 'Back to Brain Training'}</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onOpenChallenge && (
            <button
              type="button"
              onClick={() => {
                stopListening();
                stopCurrentSpeech();
                onOpenChallenge(gridSize);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
              title={isVi ? 'Thử thách tốc độ Bảng Schulte' : 'Schulte Table Speed Challenge'}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950 text-slate-950" />
              <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
            </button>
          )}

          {onOpenDifficultyChallenge && (
            <button
              type="button"
              onClick={() => {
                stopListening();
                stopCurrentSpeech();
                onOpenDifficultyChallenge(gridSize);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25"
              title={
                isVi
                  ? 'Thử thách cấp độ khó Bảng Schulte'
                  : 'Schulte Table Difficulty Level Challenge'
              }
            >
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span>{isVi ? 'Thử thách cấp độ khó' : 'Difficulty level challenge'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSoundOn((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${
              isSoundOn
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-xs ring-1 ring-sky-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
          >
            {isSoundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold">
              {isSoundOn ? (isVi ? 'Âm thanh: Bật' : 'Sound: ON') : isVi ? 'Âm thanh: Tắt' : 'Sound: OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Schulte Table Container */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-sky-950/30 p-4 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Config Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
              <Eye className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-xl flex items-center gap-2">
                <span>{isVi ? 'Bảng Schulte — Luyện Tập Trung & Thị Giác (Siêu trí tuệ)' : 'Schulte Table-Focus&Peripheral Vision(Super Intelligence)'}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isVi
                  ? 'Nhìn vào tâm bảng và bấm hoặc dùng giọng nói đọc số tìm được'
                  : 'Fixate on the center and tap or use Voice to answer found numbers'}
              </p>
            </div>
          </div>

          {/* Grid Size Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {GRID_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSizeChange(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  gridSize === s
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* Mode & Options Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs relative z-10">
          {/* Asc / Desc Toggle */}
            <button
              type="button"
              onClick={() => handleModeChange(orderMode === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 font-semibold transition-all cursor-pointer active:scale-95"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {orderMode === 'asc'
                  ? isVi
                    ? `Tăng dần (1 → ${totalNumbers})`
                    : `Ascending (1 → ${totalNumbers})`
                  : isVi
                  ? `Giảm dần (${totalNumbers} → 1)`
                  : `Descending (${totalNumbers} → 1)`}
              </span>
            </button>

            {/* Center Dot Toggle */}
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
              <span>{isVi ? 'Tâm điểm' : 'Center Dot'}</span>
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

            {/* Mic Voice Toggle */}
            <button
              type="button"
              onClick={toggleListening}
              title={
                isVi
                  ? 'Trả lời kết quả số tìm được bằng giọng nói'
                  : 'Answer the found number by voice'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-white" />
                  <span>{isVi ? 'Đang nghe...' : 'Listening...'}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isVi ? 'Trả lời bằng Giọng nói' : 'Voice'}</span>
                </>
              )}
            </button>
          <button
            type="button"
            onClick={() => resetBoard()}
            className="sm:ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
          </button>
        </div>

        {/* Live Voice Status & Mark Found / No Mark Found Confirmation */}
        {isListening && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="truncate">
              {voiceTranscript
                ? `${isVi ? 'Đang nghe:' : 'Heard:'} "${voiceTranscript}"`
                : isVi
                ? `🎙️ Đang nghe (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'}): Đọc số tìm được hoặc tọa độ ("A1", "B3")`
                : `🎙️ Listening (${highlightFound ? 'Mark Found' : 'No Mark Found'}): Speak found number or coordinate ("A1", "B3")`}
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

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
          <div className="p-2 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Timer className="w-3 h-3 text-sky-400" />
              <span>{isVi ? 'Thời gian' : 'Time'}</span>
            </span>
            <span className="text-base sm:text-2xl font-black text-sky-400 font-mono">
              {formatTime(elapsedMs)}
            </span>
          </div>

          <div className="p-2 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center relative">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {isVi ? 'Số cần tìm' : 'Target'}
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-base sm:text-2xl font-black text-amber-400 font-mono">
                {status === 'completed' ? '✓' : nextTarget}
              </span>
              {status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => speakTargetAloud(nextTarget)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 transition-all cursor-pointer active:scale-90"
                  title={isVi ? 'Đọc số cần tìm' : 'Speak target number'}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeakingTarget ? 'animate-bounce' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="p-2 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {isVi ? 'Tiến độ / Lỗi' : 'Progress / Err'}
            </span>
            <span className="text-base sm:text-2xl font-black font-mono">
              <span className="text-emerald-400">{completedCount}</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400">{mistakes}</span>
            </span>
          </div>

          <div className="p-2 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span>{isVi ? 'Kỷ lục' : 'Best'}</span>
            </span>
            <span className="text-base sm:text-2xl font-black text-yellow-400 font-mono">
              {bestTimeMs !== null ? formatTime(bestTimeMs) : '--'}
            </span>
          </div>
        </div>

        {/* Completion Banner or Schulte Grid */}
        {status === 'completed' ? (
          <div className="rounded-3xl bg-slate-950/90 border border-sky-500/40 p-6 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-200 relative z-10">
            <div className="inline-flex p-4 rounded-3xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Trophy className="w-12 h-12" />
            </div>

            {isNewRecord && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isVi ? 'Kỷ lục cá nhân mới!' : 'New Personal Best!'}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {isVi ? 'Hoàn Thành Bảng Schulte!' : 'Schulte Table Completed!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {isVi
                  ? `Bảng ${gridSize}×${gridSize} • Thời gian: ${formatTime(elapsedMs)} • Số lần bấm nhầm: ${mistakes}`
                  : `${gridSize}×${gridSize} Grid • Time: ${formatTime(elapsedMs)} • Mistakes: ${mistakes}`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => resetBoard()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isVi ? 'Chơi Lại' : 'Play Again'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopCurrentSpeech();
                  onBack();
                }}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isVi ? 'Về Brain Training' : 'Brain Training'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto w-full space-y-4 relative z-10">
            <div className="relative p-2.5 sm:p-4 rounded-3xl bg-slate-950/90 border border-sky-500/30 shadow-inner">
              <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2.5 aspect-square relative`}>
                {numbers.map((num, idx) => {
                  const found = isAlreadyFound(num);
                  const isWrong = wrongTile === num;
                  const isCenter = showCenterDot && idx === centerTileIndex;
                  const rowIdx = Math.floor(idx / gridSize);
                  const colIdx = idx % gridSize;
                  const coordLabel = `${ROW_LETTERS[rowIdx]}${colIdx + 1}`;

                  return (
                    <button
                      key={`${num}-${idx}`}
                      type="button"
                      onClick={() => handleTileClick(num, false)}
                      className={`relative rounded-xl sm:rounded-2xl font-mono font-black flex items-center justify-center transition-all duration-150 select-none cursor-pointer active:scale-95 border ${tileTextSize} ${
                        isWrong
                          ? 'bg-rose-500/25 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20 animate-pulse'
                          : found && highlightFound
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400/50 shadow-inner'
                          : 'bg-slate-900/95 hover:bg-sky-500/15 border-slate-800 hover:border-sky-400/60 text-amber-100 hover:text-white shadow-md hover:shadow-sky-500/15'
                      }`}
                    >
                      {isListening && (
                        <span className="absolute top-1 left-1.5 text-[9px] sm:text-[10px] font-bold text-amber-400/75 font-mono pointer-events-none">
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

                {/* Center Dot for even-sized grids (4x4, 6x6) */}
                {showCenterDot && gridSize % 2 === 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400/80 ring-4 ring-cyan-400/20 pointer-events-none z-20"
                  />
                )}
              </div>
            </div>

            {/* Dedicated Bottom Action Bar: Voice Answer & Reset */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-400 shadow-lg shadow-rose-500/35 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-md'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>
                      {isVi
                        ? 'Đang nghe giọng nói... (Bấm để dừng)'
                        : 'Listening Voice... (Click to stop)'}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>
                      {isVi
                        ? `Giọng nói — Trả lời số tìm được (${highlightFound ? 'Đánh dấu đã tìm' : 'Không đánh dấu'})`
                        : `Voice — Speak Found Number (${highlightFound ? 'Mark Found' : 'No Mark Found'})`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => resetBoard()}
                title={isVi ? 'Đặt lại' : 'Reset'}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
