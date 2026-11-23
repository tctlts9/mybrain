import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Zap,
  Hash,
  Timer,
  Mic,
  MicOff,
  Delete,
  ArrowRight,
  AlertTriangle,
  Trophy,
  Clock,
  Play,
} from 'lucide-react';
import { ReflexOperation } from '../../utils/dailyReflexOperations';
import {
  parseVoiceNumber,
  playSpeakerChime,
  announceResultFemaleVoice,
  stopCurrentSpeech,
} from '../../utils/speechUtils';

export type QuickReflexDigitMode = 1 | 2 | 3;

interface QuickReflexPanelProps {
  isVi: boolean;
  isSpeakerEnabled?: boolean;
}

interface QuickReflexOpItem {
  id: ReflexOperation;
  symbol: string;
  labelVi: string;
  labelEn: string;
}

const QUICK_REFLEX_OPS: QuickReflexOpItem[] = [
  { id: 'addition', symbol: '+', labelVi: 'Phép Cộng', labelEn: 'Addition' },
  { id: 'subtraction', symbol: '−', labelVi: 'Phép Trừ', labelEn: 'Subtraction' },
  { id: 'multiplication', symbol: '×', labelVi: 'Phép Nhân', labelEn: 'Multiplication' },
  { id: 'division', symbol: '÷', labelVi: 'Phép Chia', labelEn: 'Division' },
  { id: 'exponent', symbol: 'xⁿ', labelVi: 'Lũy Thừa', labelEn: 'Exponents' },
  { id: 'square-root', symbol: '√', labelVi: 'Căn bậc 2', labelEn: 'Square Root' },
  { id: 'percentage', symbol: '%', labelVi: 'Tỷ lệ %', labelEn: 'Percentage' },
];

const DIGIT_OPTIONS: QuickReflexDigitMode[] = [1, 2, 3];
const TIME_LIMIT_OPTIONS = [30, 45, 60, 90, 120];

const SQUARES_1D = [1, 4, 9];
const SQUARES_2D = [16, 25, 36, 49, 64, 81];
const SQUARES_3D = [
  100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625,
  676, 729, 784, 841, 900, 961,
];

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const formatCleanNumber = (val: number): string => {
  if (!Number.isFinite(val)) return '0';
  const rounded = Math.round(val * 10000) / 10000;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

const parseNumericString = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

/**
 * Parses spoken numbers including 0, decimals ("phẩy"/"chấm"/"point"), and negatives ("âm"/"trừ"/"minus").
 */
function parseQuickReflexVoice(transcript: string, lang: 'vi' | 'en'): number | null {
  if (!transcript) return null;
  const lower = transcript.trim().toLowerCase();

  const isNegative =
    /(^|\s)(âm|trừ|minus|negative)(\s|$)/i.test(lower) || /^-\s*\d/.test(lower);

  const normalizedDec = lower
    .replace(/(\d)\s*(phẩy|chấm|point|dot)\s*(\d)/gi, '$1.$3')
    .replace(/\b(không|khong|zero)\b/gi, '0');

  const decMatch = normalizedDec.match(/-?\d+\.\d+/);
  if (decMatch) {
    const val = parseFloat(decMatch[0]);
    if (Number.isFinite(val)) return isNegative && val > 0 ? -val : val;
  }

  if (/^(0|không|khong|zero)$/i.test(lower.replace(/[.?!,]/g, '').trim())) {
    return 0;
  }

  const intVal = parseVoiceNumber(transcript, lang);
  if (intVal !== null) {
    return isNegative && intVal > 0 ? -intVal : intVal;
  }

  const fallbackDigits = normalizedDec.match(/\d+/g);
  if (fallbackDigits && fallbackDigits.length > 0) {
    const num = parseInt(fallbackDigits[fallbackDigits.length - 1], 10);
    if (!Number.isNaN(num)) return isNegative && num > 0 ? -num : num;
  }

  return null;
}

function generateInitialState(op: ReflexOperation, digits: QuickReflexDigitMode) {
  if (op === 'addition') {
    const start =
      digits === 1 ? randInt(2, 9) : digits === 2 ? randInt(12, 98) : randInt(115, 985);
    const step =
      digits === 1 ? randInt(2, 9) : digits === 2 ? randInt(11, 49) : randInt(25, 195);
    return { start, step };
  }
  if (op === 'subtraction') {
    if (digits === 1) {
      return { start: 9, step: 1 };
    }
    const step = digits === 2 ? randInt(3, 9) : randInt(12, 45);
    const minStart =
      digits === 2 ? Math.max(55, step * 9 + 1) : Math.max(450, step * 9 + 20);
    const maxStart = digits === 2 ? 99 : 999;
    const start = randInt(Math.min(minStart, maxStart), maxStart);
    return { start, step };
  }
  if (op === 'multiplication') {
    const start =
      digits === 1 ? randInt(2, 9) : digits === 2 ? randInt(11, 95) : randInt(105, 985);
    return { start, step: 2 };
  }
  if (op === 'division') {
    const step = 2;
    const start =
      digits === 1
        ? randInt(2, 4) * 2
        : digits === 2
        ? randInt(12, 49) * 2
        : randInt(50, 499) * 2;
    return { start, step };
  }
  if (op === 'exponent') {
    const start =
      digits === 1 ? randInt(2, 9) : digits === 2 ? randInt(11, 89) : randInt(101, 499);
    return { start, step: 2 };
  }
  if (op === 'square-root') {
    const pool =
      digits === 1 ? SQUARES_1D : digits === 2 ? SQUARES_2D : SQUARES_3D;
    const start = pool[randInt(0, pool.length - 1)];
    return { start, step: 1 };
  }
  // percentage
  const start =
    digits === 1
      ? randInt(2, 9)
      : digits === 2
      ? randInt(1, 9) * 10
      : randInt(10, 99) * 10;
  return { start, step: 10 };
}

interface ComputedBox {
  index: number; // 1..9
  formulaLabel: string;
  maskedFormulaLabel?: string;
  value: number;
  formatted: string;
}

type BoxStatus = 'pending' | 'correct' | 'incorrect';

export const QuickReflexPanel: React.FC<QuickReflexPanelProps> = ({
  isVi,
  isSpeakerEnabled = true,
}) => {
  const [selectedOp, setSelectedOp] = useState<ReflexOperation | null>(null);
  const [digitMode, setDigitMode] = useState<QuickReflexDigitMode>(2);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(60);

  const [startDraft, setStartDraft] = useState<string>('20');
  const [stepValue, setStepValue] = useState<number>(2);
  const [percentageStyle, setPercentageStyle] = useState<'ofBase' | 'chain'>('ofBase');

  // 9 answer boxes (1..9)
  const [activeBoxIndex, setActiveBoxIndex] = useState<number>(1);
  const [userEntries, setUserEntries] = useState<Record<number, string>>({});
  const [boxStatuses, setBoxStatuses] = useState<Record<number, BoxStatus>>({});
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);

  // Countdown timer state
  const [remainingMs, setRemainingMs] = useState<number>(60 * 1000);
  const [roundState, setRoundState] = useState<'idle' | 'running' | 'completed' | 'timeout'>(
    'idle'
  );
  const [completedInMs, setCompletedInMs] = useState<number | null>(null);
  const roundStartAtRef = useRef<number>(Date.now());

  // Voice state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const lastSolvedSpeechRef = useRef<{ value: number; time: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const startNum = useMemo(() => {
    const parsed = parseNumericString(startDraft);
    return parsed ?? 0;
  }, [startDraft]);

  const resultBoxes = useMemo<ComputedBox[]>(() => {
    if (!selectedOp) return [];
    const boxes: ComputedBox[] = [];
    const safeStep = Number.isFinite(stepValue) ? stepValue : 1;

    if (selectedOp === 'addition') {
      let cur = startNum;
      for (let i = 1; i <= 9; i++) {
        const prev = cur;
        cur = prev + safeStep;
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(prev)} + ${formatCleanNumber(safeStep)}`,
          maskedFormulaLabel:
            i === 1
              ? `${formatCleanNumber(prev)} + ${formatCleanNumber(safeStep)}`
              : `(Ô ${i - 1}) + ${formatCleanNumber(safeStep)}`,
          value: cur,
          formatted: formatCleanNumber(cur),
        });
      }
      return boxes;
    }

    if (selectedOp === 'subtraction') {
      let cur = startNum;
      for (let i = 1; i <= 9; i++) {
        const prev = cur;
        cur = prev - safeStep;
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(prev)} − ${formatCleanNumber(safeStep)}`,
          maskedFormulaLabel:
            i === 1
              ? `${formatCleanNumber(prev)} − ${formatCleanNumber(safeStep)}`
              : `(Ô ${i - 1}) − ${formatCleanNumber(safeStep)}`,
          value: cur,
          formatted: formatCleanNumber(cur),
        });
      }
      return boxes;
    }

    if (selectedOp === 'multiplication') {
      let cur = startNum;
      for (let i = 1; i <= 9; i++) {
        const prev = cur;
        cur = prev * safeStep;
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(prev)} × ${formatCleanNumber(safeStep)}`,
          maskedFormulaLabel:
            i === 1
              ? `${formatCleanNumber(prev)} × ${formatCleanNumber(safeStep)}`
              : `(Ô ${i - 1}) × ${formatCleanNumber(safeStep)}`,
          value: cur,
          formatted: formatCleanNumber(cur),
        });
      }
      return boxes;
    }

    if (selectedOp === 'division') {
      const div = safeStep === 0 ? 2 : safeStep;
      let cur = startNum;
      for (let i = 1; i <= 9; i++) {
        const prev = cur;
        cur = Math.round((prev / div) * 10000) / 10000;
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(prev)} ÷ ${formatCleanNumber(div)}`,
          maskedFormulaLabel:
            i === 1
              ? `${formatCleanNumber(prev)} ÷ ${formatCleanNumber(div)}`
              : `(Ô ${i - 1}) ÷ ${formatCleanNumber(div)}`,
          value: cur,
          formatted: formatCleanNumber(cur),
        });
      }
      return boxes;
    }

    if (selectedOp === 'exponent') {
      const exp = safeStep === 3 ? 3 : 2;
      for (let i = 1; i <= 9; i++) {
        const base = startNum + (i - 1);
        const val = Math.pow(base, exp);
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(base)}${exp === 3 ? '³' : '²'}`,
          value: val,
          formatted: formatCleanNumber(val),
        });
      }
      return boxes;
    }

    if (selectedOp === 'square-root') {
      const root0 = Math.sqrt(Math.max(0, startNum));
      const isExactSquare = Number.isInteger(root0);
      for (let i = 1; i <= 9; i++) {
        if (isExactSquare) {
          const r = root0 + (i - 1);
          const sq = r * r;
          boxes.push({
            index: i,
            formulaLabel: `√${formatCleanNumber(sq)}`,
            value: r,
            formatted: formatCleanNumber(r),
          });
        } else {
          const rad = Math.max(0, startNum + (i - 1));
          const val = Math.round(Math.sqrt(rad) * 100) / 100;
          boxes.push({
            index: i,
            formulaLabel: `√${formatCleanNumber(rad)}`,
            value: val,
            formatted: formatCleanNumber(val),
          });
        }
      }
      return boxes;
    }

    // percentage
    if (percentageStyle === 'chain') {
      let cur = startNum;
      for (let i = 1; i <= 9; i++) {
        const prev = cur;
        cur = Math.round(prev * (1 + safeStep / 100) * 10000) / 10000;
        boxes.push({
          index: i,
          formulaLabel: `${formatCleanNumber(prev)} + ${safeStep}%`,
          maskedFormulaLabel:
            i === 1
              ? `${formatCleanNumber(prev)} + ${safeStep}%`
              : `(Ô ${i - 1}) + ${safeStep}%`,
          value: cur,
          formatted: formatCleanNumber(cur),
        });
      }
      return boxes;
    }

    for (let i = 1; i <= 9; i++) {
      const pct = i * safeStep;
      const val = Math.round(((startNum * pct) / 100) * 10000) / 10000;
      boxes.push({
        index: i,
        formulaLabel: `${pct}% × ${formatCleanNumber(startNum)}`,
        value: val,
        formatted: formatCleanNumber(val),
      });
    }
    return boxes;
  }, [selectedOp, startNum, stepValue, percentageStyle]);

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
      stopListening();
      stopCurrentSpeech();
    };
  }, [stopListening]);

  // Refs for stable access inside timer / voice callbacks
  const resultBoxesRef = useRef<ComputedBox[]>(resultBoxes);
  const activeBoxIndexRef = useRef<number>(activeBoxIndex);
  const boxStatusesRef = useRef<Record<number, BoxStatus>>(boxStatuses);
  const roundStateRef = useRef(roundState);

  useEffect(() => {
    resultBoxesRef.current = resultBoxes;
  }, [resultBoxes]);

  useEffect(() => {
    activeBoxIndexRef.current = activeBoxIndex;
  }, [activeBoxIndex]);

  useEffect(() => {
    boxStatusesRef.current = boxStatuses;
  }, [boxStatuses]);

  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);

  const resetProgressForCurrentGrid = useCallback(
    (newLimitSec?: number) => {
      const limit = newLimitSec ?? timeLimitSec;
      setUserEntries({});
      setBoxStatuses({});
      setActiveBoxIndex(1);
      setShowAllAnswers(false);
      setRemainingMs(limit * 1000);
      setCompletedInMs(null);
      setRoundState('idle');
      setVoiceTranscript('');
      setVoiceError('');
    },
    [timeLimitSec]
  );

  const startRound = useCallback(() => {
    if (!selectedOp) return;
    if (roundStateRef.current === 'completed' || roundStateRef.current === 'timeout') {
      setUserEntries({});
      setBoxStatuses({});
      setActiveBoxIndex(1);
      setShowAllAnswers(false);
      setCompletedInMs(null);
    }
    roundStartAtRef.current = Date.now();
    setRemainingMs(timeLimitSec * 1000);
    setRoundState('running');
    setVoiceError('');
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [selectedOp, timeLimitSec]);

  const applyNewGeneration = useCallback(
    (op: ReflexOperation, digits: QuickReflexDigitMode, limitSecOverride?: number) => {
      const { start, step } = generateInitialState(op, digits);
      setSelectedOp(op);
      setStartDraft(String(start));
      setStepValue(step);
      resetProgressForCurrentGrid(limitSecOverride);
    },
    [resetProgressForCurrentGrid]
  );

  // Countdown Timer Effect
  useEffect(() => {
    if (roundState !== 'running' || !selectedOp) return;
    const totalLimitMs = timeLimitSec * 1000;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - roundStartAtRef.current;
      const left = Math.max(0, totalLimitMs - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        setRoundState('timeout');
        stopListening();
        if (isSpeakerEnabled) {
          playSpeakerChime('incorrect');
        }
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [roundState, selectedOp, timeLimitSec, stopListening, isSpeakerEnabled]);

  const findNextPendingBox = (statuses: Record<number, BoxStatus>, afterIndex: number): number | null => {
    for (let i = afterIndex + 1; i <= 9; i++) {
      if (statuses[i] !== 'correct') return i;
    }
    for (let i = 1; i <= 9; i++) {
      if (statuses[i] !== 'correct') return i;
    }
    return null;
  };

  const markBoxCorrect = useCallback(
    (boxIndex: number, formattedDisplay: string) => {
      const nextStatuses: Record<number, BoxStatus> = {
        ...boxStatusesRef.current,
        [boxIndex]: 'correct',
      };
      boxStatusesRef.current = nextStatuses;
      setBoxStatuses(nextStatuses);
      setUserEntries((prev) => ({
        ...prev,
        [boxIndex]: formattedDisplay,
      }));

      const nextPending = findNextPendingBox(nextStatuses, boxIndex);
      if (nextPending === null) {
        // All 9 boxes completed!
        const elapsed = Date.now() - roundStartAtRef.current;
        setCompletedInMs(elapsed);
        setRoundState('completed');
        stopListening();
        if (isSpeakerEnabled) {
          playSpeakerChime('correct');
          announceResultFemaleVoice(
            true,
            resultBoxesRef.current[boxIndex - 1]?.value ?? 0,
            isVi ? 'vi' : 'en'
          );
        }
      } else {
        setActiveBoxIndex(nextPending);
        if (isSpeakerEnabled) {
          playSpeakerChime('correct');
        }
      }
    },
    [isSpeakerEnabled, isVi, stopListening]
  );

  const evaluateEntry = useCallback(
    (boxIndex: number, rawStr: string, allowAutoOnly: boolean) => {
      if (roundStateRef.current !== 'running') return;
      const box = resultBoxesRef.current.find((b) => b.index === boxIndex);
      if (!box) return;

      const parsed = parseNumericString(rawStr);
      if (parsed === null) {
        if (!allowAutoOnly) {
          setBoxStatuses((prev) => ({ ...prev, [boxIndex]: 'incorrect' }));
          if (isSpeakerEnabled) playSpeakerChime('incorrect');
        }
        return;
      }

      const isMatch = Math.abs(parsed - box.value) < 0.001;
      if (isMatch) {
        // Guard against auto-completing prematurely when typing negative sign or trailing decimal? No, parsed===box.value means exact match!
        markBoxCorrect(boxIndex, box.formatted);
      } else if (!allowAutoOnly) {
        setBoxStatuses((prev) => ({ ...prev, [boxIndex]: 'incorrect' }));
        if (isSpeakerEnabled) playSpeakerChime('incorrect');
      }
    },
    [isSpeakerEnabled, markBoxCorrect]
  );

  const updateActiveDraft = useCallback(
    (nextVal: string) => {
      if (roundStateRef.current !== 'running') return;
      const idx = activeBoxIndexRef.current;
      setUserEntries((prev) => ({ ...prev, [idx]: nextVal }));
      if (boxStatusesRef.current[idx] === 'incorrect') {
        setBoxStatuses((prev) => ({ ...prev, [idx]: 'pending' }));
      }
      evaluateEntry(idx, nextVal, true);
    },
    [evaluateEntry]
  );

  const handleKeypadChar = (ch: string) => {
    if (roundState !== 'running') return;
    const current = userEntries[activeBoxIndex] ?? '';
    if (ch === '−' || ch === '-') {
      if (current.startsWith('-')) {
        updateActiveDraft(current.slice(1));
      } else {
        updateActiveDraft('-' + current);
      }
      return;
    }
    if (ch === '.') {
      if (current.includes('.')) return;
      updateActiveDraft(current ? current + '.' : '0.');
      return;
    }
    if (current.length >= 14) return;
    updateActiveDraft(current + ch);
  };

  const handleKeypadClear = () => {
    if (roundState !== 'running') return;
    setUserEntries((prev) => ({ ...prev, [activeBoxIndex]: '' }));
    setBoxStatuses((prev) => ({ ...prev, [activeBoxIndex]: 'pending' }));
    inputRef.current?.focus();
  };

  const handleKeypadBackspace = () => {
    if (roundState !== 'running') return;
    const current = userEntries[activeBoxIndex] ?? '';
    const next = current.slice(0, -1);
    setUserEntries((prev) => ({ ...prev, [activeBoxIndex]: next }));
    setBoxStatuses((prev) => ({ ...prev, [activeBoxIndex]: 'pending' }));
  };

  const toggleListening = () => {
    if (roundState !== 'running') return;
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
      if (roundStateRef.current !== 'running') return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript || '';
        setVoiceTranscript(transcript);

        const parsed = parseQuickReflexVoice(transcript, isVi ? 'vi' : 'en');
        if (parsed === null) continue;

        // Prevent immediately re-applying the exact same spoken number to the next box
        const now = Date.now();
        if (
          lastSolvedSpeechRef.current &&
          Math.abs(lastSolvedSpeechRef.current.value - parsed) < 0.001 &&
          now - lastSolvedSpeechRef.current.time < 1200
        ) {
          continue;
        }

        const idx = activeBoxIndexRef.current;
        const activeBox = resultBoxesRef.current.find((b) => b.index === idx);
        if (!activeBox) continue;

        setUserEntries((prev) => ({ ...prev, [idx]: String(parsed) }));

        if (Math.abs(parsed - activeBox.value) < 0.001) {
          lastSolvedSpeechRef.current = { value: parsed, time: now };
          markBoxCorrect(idx, activeBox.formatted);
          return;
        } else if (res.isFinal) {
          setBoxStatuses((prev) => ({ ...prev, [idx]: 'incorrect' }));
        }
      }
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => {
      if (isListeningRef.current && roundStateRef.current === 'running') {
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

  const handleSelectOp = (op: ReflexOperation) => {
    stopListening();
    applyNewGeneration(op, digitMode);
  };

  const handleChangeDigits = (digits: QuickReflexDigitMode) => {
    setDigitMode(digits);
    if (selectedOp) {
      stopListening();
      applyNewGeneration(selectedOp, digits);
    }
  };

  const handleChangeTimeLimit = (sec: number) => {
    setTimeLimitSec(sec);
    if (selectedOp) {
      stopListening();
      resetProgressForCurrentGrid(sec);
    } else {
      setRemainingMs(sec * 1000);
    }
  };

  const handleReroll = () => {
    if (!selectedOp) return;
    stopListening();
    applyNewGeneration(selectedOp, digitMode);
  };

  const activeOpMeta = QUICK_REFLEX_OPS.find((o) => o.id === selectedOp);
  const activeBox = resultBoxes.find((b) => b.index === activeBoxIndex);
  const solvedCount = useMemo(
    () => Object.values(boxStatuses).filter((s) => s === 'correct').length,
    [boxStatuses]
  );

  const remainingSec = remainingMs / 1000;
  const remainingPct = Math.max(
    0,
    Math.min(100, (remainingMs / Math.max(1000, timeLimitSec * 1000)) * 100)
  );

  const renderStepPresets = () => {
    if (!selectedOp) return null;

    if (selectedOp === 'multiplication' || selectedOp === 'division') {
      const presets =
        selectedOp === 'multiplication' ? [2, 3, 4, 5, 9] : [2, 4, 5, 10];
      const sym = selectedOp === 'multiplication' ? '×' : '÷';
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {selectedOp === 'multiplication'
              ? isVi
                ? 'Nhân với:'
                : 'Multiply by:'
              : isVi
              ? 'Chia cho:'
              : 'Divide by:'}
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setStepValue(p);
                resetProgressForCurrentGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer tabular-nums ${
                stepValue === p
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {sym}
              {p}
            </button>
          ))}
          <input
            type="text"
            inputMode="numeric"
            value={String(stepValue)}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed) && parsed > 0) {
                setStepValue(parsed);
                resetProgressForCurrentGrid();
              }
            }}
            aria-label={isVi ? 'Hệ số tùy chỉnh' : 'Custom factor'}
            className="w-12 h-7 px-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums"
          />
        </div>
      );
    }

    if (selectedOp === 'addition' || selectedOp === 'subtraction') {
      const sym = selectedOp === 'addition' ? '+' : '−';
      const presets =
        digitMode === 1
          ? selectedOp === 'addition'
            ? [2, 3, 5, 9]
            : [1, 2, 3, 5]
          : digitMode === 2
          ? selectedOp === 'addition'
            ? [11, 15, 25, 37]
            : [3, 5, 7, 9]
          : selectedOp === 'addition'
          ? [25, 50, 125, 250]
          : [15, 25, 37, 45];
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {isVi ? 'Bước nhảy:' : 'Step:'}
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setStepValue(p);
                resetProgressForCurrentGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer tabular-nums ${
                stepValue === p
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {sym}
              {p}
            </button>
          ))}
          <input
            type="text"
            inputMode="numeric"
            value={String(stepValue)}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed) && parsed > 0) {
                setStepValue(parsed);
                resetProgressForCurrentGrid();
              }
            }}
            aria-label={isVi ? 'Bước nhảy tùy chỉnh' : 'Custom step'}
            className="w-14 h-7 px-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums"
          />
        </div>
      );
    }

    if (selectedOp === 'exponent') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {isVi ? 'Số mũ:' : 'Power:'}
          </span>
          {[2, 3].map((exp) => (
            <button
              key={exp}
              type="button"
              onClick={() => {
                setStepValue(exp);
                resetProgressForCurrentGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                stepValue === exp
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {exp === 2 ? 'x²' : 'x³'}
            </button>
          ))}
        </div>
      );
    }

    if (selectedOp === 'percentage') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setPercentageStyle('ofBase');
                setStepValue(10);
                resetProgressForCurrentGrid();
              }}
              className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                percentageStyle === 'ofBase'
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isVi ? '10% → 90% của số' : '10% → 90% of Base'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPercentageStyle('chain');
                setStepValue(10);
                resetProgressForCurrentGrid();
              }}
              className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                percentageStyle === 'chain'
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isVi ? 'Tăng +% nối tiếp' : 'Compound +%'}
            </button>
          </div>
          {percentageStyle === 'chain' && (
            <div className="flex items-center gap-1">
              {[10, 20, 25, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setStepValue(p);
                    resetProgressForCurrentGrid();
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    stepValue === p
                      ? 'bg-yellow-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  +{p}%
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <span className="text-xs text-slate-400">
        {isVi
          ? '9 số chính phương liên tiếp để nhẩm căn bậc 2'
          : '9 consecutive square roots from the starting square'}
      </span>
    );
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Top Controls: Digit Length (1/2/3), Time Limit, & 7 Operations */}
      <div className="rounded-2xl bg-slate-950/75 border border-slate-800 p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>
              {isVi
                ? 'Chọn phép toán và số chữ số để tạo 9 ô phản xạ nhanh:'
                : 'Select operation & digits to generate 9 quick-reflex boxes:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1-digit / 2-digit / 3-digit toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              {DIGIT_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleChangeDigits(d)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    digitMode === d
                      ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? `${d} chữ số` : `${d}-Digit`}
                </button>
              ))}
            </div>

            {/* 9-Box Time Limit Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1 whitespace-nowrap">
                <Timer className="w-3 h-3 text-yellow-400" />
                <span className="hidden sm:inline">
                  {isVi ? 'Giới hạn:' : 'Limit:'}
                </span>
              </span>
              {TIME_LIMIT_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleChangeTimeLimit(sec)}
                  className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                    timeLimitSec === sec
                      ? 'bg-yellow-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {selectedOp && (
              <>
                <button
                  type="button"
                  onClick={startRound}
                  disabled={roundState === 'running'}
                  title={isVi ? 'Bắt đầu tính giờ trả lời 9 ô' : 'Start 9-box countdown'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25 whitespace-nowrap ${
                    roundState === 'running' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReroll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/40 text-yellow-300 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Số mới' : 'New Number'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllAnswers((s) => !s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    showAllAnswers
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {showAllAnswers ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Ẩn đáp án' : 'Hide Answers'}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Hiện đáp án' : 'Show Answers'}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 7 Operation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {QUICK_REFLEX_OPS.map((op) => {
            const isSelected = selectedOp === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => handleSelectOp(op.id)}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/70 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-yellow-500/40'
                }`}
              >
                <span
                  className={`font-mono font-extrabold ${
                    isSelected ? 'text-slate-950' : 'text-yellow-400'
                  }`}
                >
                  {op.symbol}
                </span>
                <span>{isVi ? op.labelVi : op.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 9-Box Reflex Arena */}
      {!selectedOp ? (
        <div className="rounded-3xl bg-slate-950/75 border border-slate-800/90 p-8 text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
            <Hash className="w-5 h-5" />
          </div>
          <p className="text-sm sm:text-base font-bold text-white">
            {isVi
              ? 'Chọn một trong 7 phép toán ở trên để bắt đầu'
              : 'Select one of the 7 operations above to start'}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isVi
              ? 'Hệ thống sẽ tạo 1 số gốc ngẫu nhiên (1, 2 hoặc 3 chữ số) cùng 9 ô trả lời (3×3) và bộ đếm thời gian giới hạn để bạn phản xạ bằng bàn phím hoặc giọng nói.'
              : 'Generates a random starting number (1, 2, or 3 digits), 9 answer boxes (3×3), and a countdown timer with keypad and voice input.'}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-950/80 border border-yellow-500/30 p-3.5 sm:p-5 space-y-3.5">
          {/* Sub-header: Active op, step presets, and live countdown */}
          <div className="space-y-2.5 pb-3 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-bold text-yellow-400">
                  {isVi ? activeOpMeta?.labelVi : activeOpMeta?.labelEn}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  {isVi ? `${digitMode} chữ số` : `${digitMode}-Digit`}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-semibold tabular-nums">
                  {isVi ? `Đã đúng ${solvedCount}/9 ô` : `${solvedCount}/9 solved`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {renderStepPresets()}

                {/* Live Countdown Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-mono font-bold tabular-nums ${
                    roundState === 'completed'
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                      : roundState === 'timeout'
                      ? 'bg-rose-500/15 border-rose-400/50 text-rose-300'
                      : remainingSec <= 5
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                      : remainingSec <= 12
                      ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                      : 'bg-slate-900 border-yellow-500/35 text-yellow-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {roundState === 'completed' && completedInMs !== null
                      ? `${(completedInMs / 1000).toFixed(1)}s`
                      : `${remainingSec.toFixed(1)}s / ${timeLimitSec}s`}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
              <div
                className={`h-full transition-all duration-100 ${
                  roundState === 'completed'
                    ? 'bg-emerald-400'
                    : roundState === 'timeout' || remainingSec <= 5
                    ? 'bg-rose-500'
                    : remainingSec <= 12
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                }`}
                style={{ width: `${roundState === 'completed' ? 100 : remainingPct}%` }}
              />
            </div>
          </div>

          {/* Side-by-Side Workspace: Left = Start Box + 3x3 Grid, Right = Input, Keypad & Voice */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
            {/* LEFT: Starting Number + 9 Answer Boxes (3 columns × 3 rows) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Starting Number Box */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/75 border border-yellow-400/40 px-3.5 py-2.5">
                <label
                  htmlFor="quick-reflex-start-input"
                  className="text-xs font-bold text-yellow-300 uppercase tracking-wider"
                >
                  {isVi
                    ? `Số gốc ngẫu nhiên (${digitMode} chữ số)`
                    : `Random Start (${digitMode}-Digit)`}
                </label>
                <input
                  id="quick-reflex-start-input"
                  type="text"
                  inputMode="decimal"
                  value={startDraft}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d.-]/g, '').slice(0, 8);
                    setStartDraft(cleaned);
                    resetProgressForCurrentGrid();
                  }}
                  className="w-32 sm:w-40 h-10 px-3 rounded-xl bg-slate-950 border border-yellow-400/60 focus:border-yellow-300 focus:outline-none text-center text-xl sm:text-2xl font-black font-mono text-yellow-300 tabular-nums"
                />
              </div>

              {/* 3 Columns × 3 Rows Answer Grid (9 Boxes) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {resultBoxes.map((box) => {
                  const status = boxStatuses[box.index] ?? 'pending';
                  const isActive =
                    roundState === 'running' && activeBoxIndex === box.index;
                  const entryStr = userEntries[box.index] ?? '';
                  const revealCorrect =
                    status === 'correct' ||
                    showAllAnswers ||
                    roundState === 'timeout';

                  return (
                    <button
                      key={box.index}
                      type="button"
                      onClick={() => {
                        if (roundState === 'running') {
                          setActiveBoxIndex(box.index);
                          setTimeout(() => inputRef.current?.focus(), 40);
                        }
                      }}
                      className={`rounded-2xl p-2 sm:p-2.5 text-left transition-all border cursor-pointer flex flex-col justify-between gap-1.5 min-h-[76px] sm:min-h-[84px] ${
                        status === 'correct'
                          ? 'bg-emerald-950/30 border-emerald-400/80 shadow-sm shadow-emerald-500/10'
                          : isActive
                          ? 'bg-yellow-500/10 border-yellow-400 ring-2 ring-yellow-400/35 shadow-md shadow-yellow-500/10'
                          : status === 'incorrect'
                          ? 'bg-rose-950/30 border-rose-400/80'
                          : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                        <span
                          className={`font-bold ${
                            status === 'correct'
                              ? 'text-emerald-300'
                              : isActive
                              ? 'text-yellow-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {isVi ? `Ô ${box.index}` : `Box ${box.index}`}
                        </span>
                        <span className="font-mono text-yellow-400/90 truncate tabular-nums">
                          {roundState === 'idle' && !showAllAnswers
                            ? isVi
                              ? 'Sẵn sàng'
                              : 'Ready'
                            : box.maskedFormulaLabel &&
                              box.index > 1 &&
                              !showAllAnswers &&
                              roundState === 'running' &&
                              boxStatuses[box.index - 1] !== 'correct'
                            ? isVi
                              ? box.maskedFormulaLabel
                              : box.maskedFormulaLabel.replace('Ô ', 'Box ')
                            : box.formulaLabel}
                        </span>
                      </div>

                      <div className="h-9 sm:h-10 rounded-xl bg-slate-950/90 border border-slate-800/80 px-2 flex items-center justify-center relative">
                        {status === 'correct' ? (
                          <span className="font-mono font-black text-sm sm:text-base text-emerald-300 tabular-nums flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{box.formatted}</span>
                          </span>
                        ) : revealCorrect ? (
                          <span
                            className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                              roundState === 'timeout'
                                ? 'text-rose-300'
                                : 'text-cyan-300'
                            }`}
                          >
                            {box.formatted}
                          </span>
                        ) : entryStr ? (
                          <span
                            className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                              status === 'incorrect' ? 'text-rose-300' : 'text-white'
                            }`}
                          >
                            {entryStr}
                          </span>
                        ) : (
                          <span
                            className={`font-mono text-sm sm:text-base font-bold ${
                              isActive ? 'text-yellow-400 animate-pulse' : 'text-slate-600'
                            }`}
                          >
                            ?
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Active Input, Status Banner, Numeric Keypad & Voice */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (roundState === 'running') {
                  evaluateEntry(
                    activeBoxIndex,
                    userEntries[activeBoxIndex] ?? '',
                    false
                  );
                } else {
                  handleReroll();
                }
              }}
              className="lg:col-span-5 flex flex-col justify-between space-y-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 p-3 sm:p-4"
            >
              <div className="space-y-2.5">
                {/* Active Box Indicator */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-300">
                    {roundState === 'idle'
                      ? isVi
                        ? 'Sẵn sàng tính giờ 9 ô'
                        : 'Ready for 9-box timer'
                      : roundState === 'completed'
                      ? isVi
                        ? 'Hoàn thành cả 9 ô!'
                        : 'All 9 boxes solved!'
                      : roundState === 'timeout'
                      ? isVi
                        ? 'Hết thời gian!'
                        : 'Time expired!'
                      : isVi
                      ? `Đang trả lời: Ô ${activeBoxIndex}/9`
                      : `Answering: Box ${activeBoxIndex}/9`}
                  </span>
                  {activeBox && roundState === 'running' && (
                    <span className="font-mono font-bold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-lg tabular-nums">
                      {activeBox.maskedFormulaLabel &&
                      activeBox.index > 1 &&
                      !showAllAnswers &&
                      boxStatuses[activeBox.index - 1] !== 'correct'
                        ? isVi
                          ? activeBox.maskedFormulaLabel
                          : activeBox.maskedFormulaLabel.replace('Ô ', 'Box ')
                        : activeBox.formulaLabel}{' '}
                      = ?
                    </span>
                  )}
                </div>

                {/* Completion / Timeout Banner */}
                {roundState === 'completed' && (
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm font-bold animate-in zoom-in-95 duration-150">
                    <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      {isVi
                        ? `Tuyệt vời! Bạn hoàn thành 9/9 ô trong ${((completedInMs ?? 0) / 1000).toFixed(1)}s.`
                        : `Awesome! You solved 9/9 boxes in ${((completedInMs ?? 0) / 1000).toFixed(1)}s.`}
                    </span>
                  </div>
                )}

                {roundState === 'timeout' && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center gap-2.5 text-rose-300 text-xs sm:text-sm font-bold animate-in zoom-in-95 duration-150">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>
                      {isVi
                        ? `Hết giờ (${timeLimitSec}s)! Đạt ${solvedCount}/9 ô. Đáp án đúng đã hiển thị ở lưới.`
                        : `Time's up (${timeLimitSec}s)! Score: ${solvedCount}/9. Correct answers shown.`}
                    </span>
                  </div>
                )}

                {/* Main Answer Textbox */}
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    disabled={roundState !== 'running'}
                    value={userEntries[activeBoxIndex] ?? ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d.-]/g, '').slice(0, 14);
                      updateActiveDraft(cleaned);
                    }}
                    placeholder={
                      roundState === 'idle'
                        ? isVi
                          ? 'Bấm "Bắt đầu" để tính giờ trả lời 9 ô...'
                          : 'Click "Start" to start the 9-box timer...'
                        : isListening
                        ? isVi
                          ? 'Đang nghe... Hãy đọc đáp án'
                          : 'Listening... Speak answer'
                        : isVi
                        ? 'Nhập bằng phím số hoặc giọng nói...'
                        : 'Tap keypad or speak answer...'
                    }
                    className={`w-full h-12 sm:h-13 px-4 text-center text-2xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs placeholder:font-sans focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : boxStatuses[activeBoxIndex] === 'incorrect'
                        ? 'border-rose-400 focus:border-rose-400'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {userEntries[activeBoxIndex] && roundState === 'running' && (
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="absolute right-3 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isVi ? 'Xóa ô nhập' : 'Clear'}
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Numeric Keypad (14 keys: 1-6, - / 7-9, 0, ., Xóa, Backspace) */}
                <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 border border-slate-800 shadow-inner">
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '−'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadChar(key)}
                        disabled={roundState !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base font-bold border border-slate-800 hover:border-yellow-500/50 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {key}
                      </button>
                    ))}

                    {['7', '8', '9', '0', '.'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadChar(key)}
                        disabled={roundState !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base font-bold border border-slate-800 hover:border-yellow-500/50 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {key}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      disabled={roundState !== 'running' || !userEntries[activeBoxIndex]}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs border border-slate-800 hover:border-rose-500/40 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                    >
                      {isVi ? 'Xóa' : 'Clr'}
                    </button>

                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      disabled={roundState !== 'running' || !userEntries[activeBoxIndex]}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      title={isVi ? 'Xóa 1 ký tự' : 'Backspace'}
                      aria-label="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Voice Feedback */}
                {isListening && (
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                    <span className="truncate">
                      {voiceTranscript
                        ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                        : isVi
                        ? 'Đang lắng nghe: Hãy đọc to đáp án cho từng ô'
                        : 'Listening: Speak the answer for each box'}
                    </span>
                  </div>
                )}

                {voiceError && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="flex-1 font-semibold">{voiceError}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Start / Check / Play Again + Voice + New Number */}
              <div className="flex items-center gap-2 pt-1">
                {roundState === 'idle' ? (
                  <button
                    type="button"
                    onClick={startRound}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
                  </button>
                ) : roundState === 'running' ? (
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>{isVi ? 'Kiểm tra' : 'Check'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReroll}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isVi ? 'Chơi lượt mới' : 'Play Again'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={roundState !== 'running'}
                  title={
                    isListening
                      ? isVi
                        ? 'Đang nghe... Bấm để dừng'
                        : 'Listening... Click to stop'
                      : isVi
                      ? 'Trả lời liên tiếp bằng giọng nói'
                      : 'Answer sequentially by voice'
                  }
                  className={`h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 text-white" />
                      <span>{isVi ? 'Dừng' : 'Stop'}</span>
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
                  onClick={handleReroll}
                  title={isVi ? 'Đổi số mới & chạy lại đồng hồ' : 'New number & reset timer'}
                  className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
