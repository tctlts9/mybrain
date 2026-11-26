/**
 * ============================================================================
 * FILE: DivisionDifficultyChallengePage.tsx — TRANG THỬ THÁCH CẤP ĐỘ KHÓ PHÉP CHIA
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN A & B).
 * 2. Quản lý thử thách 10 câu Phép chia Cấp độ Khó theo 5 chuyên đề chuẩn và chế độ Tùy chọn BigInt.
 * 3. Vận hành cơ chế 2 giai đoạn: Quan sát phép chia -> Ẩn đề & Trả lời nhanh.
 * 4. Ghi nhận lịch sử 10 câu, chuỗi đúng/sai, đọc đề TTS và trả lời bằng Giọng nói hoặc Bàn phím số ảo.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Clock,
  TimerReset,
  SlidersHorizontal,
  Globe,
  X,
  Check,
  Hand,
} from 'lucide-react';
import { useLanguage, biLabel, translateText } from '../../context/Translations';
import { isAutoNextButtonVisible } from '../../config/buttonVisibility';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';
import { DivisionTopic, DIVISION_TOPICS } from './DivisionPage';

// ============================================================================
// PHẦN 0: LOGIC PHÉP CHIA & TÙY CHỌN BIGINT CẤP ĐỘ KHÓ (CODE TRỰC TIẾP TRONG PAGE)
// ============================================================================
type ArithmeticOperation =
  | 'division'
  | 'addition'
  | 'subtraction'
  | 'square-root'
  | 'exponent';

interface OperationQuestion {
  a: number;
  b?: number;
  answer: number;
  hintVi: string;
  hintEn: string;
}

interface OperationTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

interface OperationMeta {
  id: ArithmeticOperation;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  symbol: string;
  topics: OperationTopic[];
}

type OperationDifficulty = 'normal' | 'hard';

const OPERATION_META: { division: OperationMeta } = {
  division: {
    id: 'division',
    titleVi: 'Phép Chia Nhẩm Siêu Tốc',
    titleEn: 'Fast Mental Division',
    subtitleVi: 'Luyện chia hết từ trái sang phải, chia nhanh cho 5, 25 và 2 chữ số',
    subtitleEn: 'Left-to-right exact division, ÷5 / ÷25 shortcuts, and 2-digit divisors',
    symbol: '÷',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Chia 1–2 chữ số',
        badgeEn: 'General: 1–2 Digit Division',
      },
      {
        id: 'div1Digit',
        labelVi: 'Chia 1 chữ số',
        labelEn: '÷ 1-Digit',
        badgeVi: 'Chuyên đề: Chia số 2–4 chữ số cho [2..9]',
        badgeEn: 'Topic: 2–4 Digit ÷ [2..9]',
      },
      {
        id: 'div5or25',
        labelVi: 'Chia nhanh 5 & 25',
        labelEn: '÷ 5 & 25',
        badgeVi: 'Chuyên đề: Chia nhanh cho 5 & 25',
        badgeEn: 'Topic: Division by 5 & 25',
      },
      {
        id: 'div2Digit',
        labelVi: 'Chia 2 chữ số',
        labelEn: '÷ 2-Digit',
        badgeVi: 'Chuyên đề: Chia cho số 2 chữ số',
        badgeEn: 'Topic: 2-Digit Divisor Division',
      },
      {
        id: 'div3Digit',
        labelVi: 'Chia 3 chữ số',
        labelEn: '÷ 3-Digit',
        badgeVi: 'Chuyên đề: Chia cho số 3 chữ số',
        badgeEn: 'Topic: 3-Digit Divisor Division',
      },
    ],
  },
};

const opRandInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function generateOperationQuestion(
  _operation: ArithmeticOperation,
  topicId: string,
  difficulty: OperationDifficulty = 'normal'
): OperationQuestion {
  const isHard = difficulty === 'hard';
  let mode = topicId;
  if (mode === 'general') {
    const pool = ['div1Digit', 'div5or25', 'div2Digit', 'div3Digit'];
    mode = pool[opRandInt(0, pool.length - 1)];
  }

  if (mode === 'div5or25') {
    const isDiv5 = Math.random() < (isHard ? 0.5 : 0.6);
    if (isDiv5) {
      let quotient = isHard ? opRandInt(125, 989) : opRandInt(14, 480);
      if (isHard && quotient % 10 === 0) quotient += opRandInt(1, 9);
      const dividend = quotient * 5;
      return {
        a: dividend,
        b: 5,
        answer: quotient,
        hintVi: `Mẹo chia 5: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
        hintEn: `÷ 5 Trick: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
      };
    }
    let quotient = isHard ? opRandInt(64, 398) : opRandInt(11, 160);
    if (isHard && quotient % 10 === 0) quotient += opRandInt(1, 9);
    const dividend = quotient * 25;
    return {
      a: dividend,
      b: 25,
      answer: quotient,
      hintVi: `Mẹo chia 25: (${dividend.toLocaleString()} × 4) ÷ 100 = ${(dividend * 4).toLocaleString()} ÷ 100 = ${quotient.toLocaleString()}`,
      hintEn: `÷ 25 Trick: (${dividend.toLocaleString()} × 4) ÷ 100 = ${(dividend * 4).toLocaleString()} ÷ 100 = ${quotient.toLocaleString()}`,
    };
  }

  if (mode === 'div2Digit') {
    let divisor = isHard ? opRandInt(19, 69) : opRandInt(12, 38);
    if (isHard && divisor % 10 === 0) divisor += opRandInt(2, 8);
    let quotient = isHard ? opRandInt(28, 125) : opRandInt(12, 85);
    if (isHard && quotient % 10 === 0) quotient += opRandInt(1, 9);
    const dividend = divisor * quotient;
    const tensPart = Math.floor(quotient / 10) * 10;
    const rem = dividend - tensPart * divisor;
    return {
      a: dividend,
      b: divisor,
      answer: quotient,
      hintVi: `Tách từng phần: ${dividend.toLocaleString()} = (${tensPart * divisor} + ${rem}) ÷ ${divisor} = ${tensPart} + ${quotient - tensPart} = ${quotient}`,
      hintEn: `Split partial quotient: ${dividend.toLocaleString()} = (${tensPart * divisor} + ${rem}) ÷ ${divisor} = ${tensPart} + ${quotient - tensPart} = ${quotient}`,
    };
  }

  if (mode === 'div3Digit') {
    let divisor = isHard ? opRandInt(125, 495) : opRandInt(105, 295);
    if (divisor % 10 === 0) divisor += opRandInt(2, 8);
    let quotient = isHard ? opRandInt(12, 58) : opRandInt(6, 32);
    if (isHard && quotient % 10 === 0) quotient += opRandInt(1, 9);
    const dividend = divisor * quotient;
    const tensPart = Math.floor(quotient / 10) * 10;
    const onesPart = quotient - tensPart;
    const hintVi =
      tensPart > 0
        ? `Tách thương từng phần: ${dividend.toLocaleString()} = (${(tensPart * divisor).toLocaleString()} + ${(onesPart * divisor).toLocaleString()}) ÷ ${divisor} = ${tensPart} + ${onesPart} = ${quotient}`
        : `Ước lượng hàng trăm & tận cùng: ${divisor} × ${quotient} = ${dividend.toLocaleString()} ⇒ ${quotient}`;
    const hintEn =
      tensPart > 0
        ? `Split partial quotient: ${dividend.toLocaleString()} = (${(tensPart * divisor).toLocaleString()} + ${(onesPart * divisor).toLocaleString()}) ÷ ${divisor} = ${tensPart} + ${onesPart} = ${quotient}`
        : `Estimate hundreds & unit digit: ${divisor} × ${quotient} = ${dividend.toLocaleString()} ⇒ ${quotient}`;
    return {
      a: dividend,
      b: divisor,
      answer: quotient,
      hintVi,
      hintEn,
    };
  }

  // div1Digit
  const divisor = isHard ? opRandInt(4, 9) : opRandInt(2, 9);
  let quotient = isHard ? opRandInt(125, 989) : opRandInt(18, 399);
  if (isHard && quotient % 10 === 0) quotient += opRandInt(1, 9);
  const dividend = divisor * quotient;
  return {
    a: dividend,
    b: divisor,
    answer: quotient,
    hintVi: `Chia nhẩm từ trái sang phải: ${dividend.toLocaleString()} ÷ ${divisor} = ${quotient.toLocaleString()}`,
    hintEn: `Left-to-right division: ${dividend.toLocaleString()} ÷ ${divisor} = ${quotient.toLocaleString()}`,
  };
}

type CustomOperandMode = 'exact' | 'digits';

const MIN_CUSTOM_DIGITS = 1;
const MAX_CUSTOM_DIGITS = 100;
const MIN_CUSTOM_OPERAND = 1;
const MAX_CUSTOM_OPERAND = 999999999;

const formatBigIntStr = (val: string | number): string =>
  String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const normalizeAnswerInput = (val: string): string =>
  val
    .trim()
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '');

const buildRandomDigitString = (digits: number, activeHard = true): string => {
  const safeDigits = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, digits));
  if (safeDigits === 1) {
    return String(Math.floor(Math.random() * 8) + 2);
  }
  if (activeHard) {
    let s = String(Math.floor(Math.random() * 7) + 3);
    for (let i = 1; i < safeDigits; i++) {
      s += String(Math.floor(Math.random() * 8) + 2);
    }
    return s;
  }
  if (safeDigits === 2) {
    return String(Math.floor(Math.random() * 88) + 12);
  }
  let s = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < safeDigits; i++) {
    s += String(Math.floor(Math.random() * 10));
  }
  return s;
};

const buildRandomBigIntInRange = (minVal: bigint, maxVal: bigint): bigint => {
  if (maxVal <= minVal) return minVal;
  const range = maxVal - minVal + 1n;
  const rangeLen = range.toString().length;
  const extraLen = rangeLen + 8;
  let randDigits = '';
  for (let i = 0; i < extraLen; i++) {
    randDigits += String(Math.floor(Math.random() * 10));
  }
  return minVal + (BigInt(randDigits) % range);
};

const splitFormattedIntoBalancedLines = (
  numStr: string,
  maxGroupsPerLine = 5
): string[] => {
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

const getCustomFormulaFontSize = (totalFormattedLen: number): string => {
  if (totalFormattedLen > 64) return 'text-xs sm:text-base md:text-lg lg:text-xl';
  if (totalFormattedLen > 48) return 'text-xs sm:text-sm md:text-base lg:text-xl';
  if (totalFormattedLen > 35) return 'text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
  if (totalFormattedLen > 22) return 'text-base sm:text-xl md:text-2xl lg:text-3xl';
  return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl';
};

interface DifficultyBigQuestion {
  a: string;
  b?: string;
  answer: string;
  hintVi: string;
  hintEn: string;
  numbers?: string[];
  operations?: ('÷' | '×')[];
}

type SequenceDigitProfile = '2D' | '3D' | '2D3D' | '4D' | '3D4D';
type SequenceDisplayMode = 'flash' | 'all';

const MIN_SEQUENCE_COUNT = 2;
const MAX_SEQUENCE_COUNT = 100;

const randSeqInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getSequenceDigitBounds = (digits: 2 | 3 | 4): [number, number] => {
  if (digits === 2) return [10, 99];
  if (digits === 3) return [100, 999];
  return [1000, 9999];
};

const findExactDivisorsInRange = (val: bigint, minD: number, maxD: number): number[] => {
  if (val <= 1n || maxD < 2) return [];
  const res: number[] = [];
  const cap = Number(val < BigInt(maxD) ? val : BigInt(maxD));
  for (let d = Math.max(2, minD); d <= cap; d++) {
    if (val % BigInt(d) === 0n) {
      res.push(d);
      if (res.length >= 64) break;
    }
  }
  return res;
};

function generateDivisionSequenceQuestion(
  rawCount: number,
  profile: SequenceDigitProfile,
  includeMultiply: boolean = false
): DifficultyBigQuestion {
  const count = Math.min(MAX_SEQUENCE_COUNT, Math.max(MIN_SEQUENCE_COUNT, rawCount));
  const digitLengths: (2 | 3 | 4)[] = [];

  for (let i = 0; i < count; i++) {
    let digitLen: 2 | 3 | 4 = 2;
    if (profile === '2D') digitLen = 2;
    else if (profile === '3D') digitLen = 3;
    else if (profile === '4D') digitLen = 4;
    else if (profile === '2D3D') digitLen = i % 2 === 0 ? 2 : 3;
    else if (profile === '3D4D') digitLen = i % 2 === 0 ? 3 : 4;
    digitLengths.push(digitLen);
  }

  if (profile === '2D3D' || profile === '3D4D') {
    for (let i = digitLengths.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digitLengths[i], digitLengths[j]] = [digitLengths[j], digitLengths[i]];
    }
  }

  const profileDescVi: Record<SequenceDigitProfile, string> = {
    '2D': '2 chữ số',
    '3D': '3 chữ số',
    '2D3D': '2 & 3 chữ số',
    '4D': '4 chữ số',
    '3D4D': '3 & 4 chữ số',
  };

  if (!includeMultiply) {
    const divisors: number[] = [];
    let prod = 1n;
    for (let i = 1; i < count; i++) {
      const [minVal, maxVal] = getSequenceDigitBounds(digitLengths[i]);
      let d = randSeqInt(minVal, maxVal);
      if (maxVal > minVal && divisors.length > 0) {
        for (let attempt = 0; attempt < 5 && d === divisors[divisors.length - 1]; attempt++) {
          d = randSeqInt(minVal, maxVal);
        }
      }
      divisors.push(d);
      prod *= BigInt(d);
    }

    const [qMin, qMax] = getSequenceDigitBounds(digitLengths[0]);
    const finalAns = randSeqInt(qMin, qMax);
    const firstVal = BigInt(finalAns) * prod;
    const numbers = [firstVal.toString(), ...divisors.map(String)];
    const operations: ('÷' | '×')[] = ['÷', ...divisors.map(() => '÷' as const)];

    return {
      a: numbers[0] ?? '0',
      b: numbers[1] ?? '1',
      numbers,
      operations,
      answer: String(finalAns),
      hintVi: `Chia liên tiếp ${count} số (${profileDescVi[profile]}) từ trái sang phải.`,
      hintEn: `Divide all ${count} numbers (${profile}) sequentially from left to right.`,
    };
  }

  const numbers: string[] = [];
  const operations: ('÷' | '×')[] = [];
  const [firstMin, firstMax] = getSequenceDigitBounds(digitLengths[0]);
  let firstVal = randSeqInt(firstMin, firstMax);
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = randSeqInt(firstMin, firstMax);
    if (findExactDivisorsInRange(BigInt(candidate), 2, Math.min(firstMax, candidate - 1)).length > 0) {
      firstVal = candidate;
      break;
    }
  }

  numbers.push(String(firstVal));
  operations.push('÷');
  let runningVal = BigInt(firstVal);
  let divCount = 0;
  let mulCount = 0;

  for (let i = 1; i < count; i++) {
    const [minVal, maxVal] = getSequenceDigitBounds(digitLengths[i]);
    const inRangeDivs = findExactDivisorsInRange(runningVal, minVal, maxVal);
    const fallbackDivs = inRangeDivs.length > 0 ? inRangeDivs : findExactDivisorsInRange(runningVal, 2, maxVal);

    let op: '÷' | '×' = '×';
    if (fallbackDivs.length > 0) {
      const mustDiv = divCount === 0 && i >= count - 2;
      const shouldMulFirst = count >= 3 && i === count - 1 && mulCount === 0 && divCount > 0;
      const tooBig = runningVal > BigInt(maxVal) * 500n;
      if (mustDiv || (tooBig && inRangeDivs.length > 0)) {
        op = '÷';
      } else if (shouldMulFirst) {
        op = '×';
      } else if (inRangeDivs.length > 0) {
        op = Math.random() < 0.55 ? '÷' : '×';
      } else {
        op = runningVal > 1000000n || Math.random() < 0.35 ? '÷' : '×';
      }
    }

    if (op === '÷' && fallbackDivs.length > 0) {
      const pool = inRangeDivs.length > 0 ? inRangeDivs : fallbackDivs;
      const chosen =
        inRangeDivs.length > 0
          ? pool[randSeqInt(0, pool.length - 1)]
          : pool[randSeqInt(Math.floor(pool.length / 2), pool.length - 1)];
      numbers.push(String(chosen));
      operations.push('÷');
      runningVal = runningVal / BigInt(chosen);
      divCount++;
    } else {
      let val = randSeqInt(minVal, maxVal);
      if (maxVal > minVal) {
        for (let attempt = 0; attempt < 5 && String(val) === numbers[i - 1]; attempt++) {
          val = randSeqInt(minVal, maxVal);
        }
      }
      numbers.push(String(val));
      operations.push('×');
      runningVal = runningVal * BigInt(val);
      mulCount++;
    }
  }

  return {
    a: numbers[0] ?? '0',
    b: numbers[1] ?? '1',
    numbers,
    operations,
    answer: runningVal.toString(),
    hintVi: `Tính chia nhân lần lượt ${count} số (${profileDescVi[profile]}) từ trái sang phải.`,
    hintEn: `Calculate sequentially (÷ / ×) across all ${count} numbers (${profile}).`,
  };
}

function generateCustomArithmeticQuestion(
  _operation: 'addition' | 'subtraction' | 'division' | 'exponent' | 'square-root',
  digits: number,
  operandMode: CustomOperandMode,
  exactOperand: number,
  operandDigits: number
): DifficultyBigQuestion {
  const safeDigits = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, digits));
  const safeOperand = Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, exactOperand));
  const safeOperandDigits = Math.min(
    MAX_CUSTOM_DIGITS,
    Math.max(MIN_CUSTOM_DIGITS, operandDigits)
  );

  const bStr =
    operandMode === 'digits'
      ? buildRandomDigitString(safeOperandDigits, true)
      : String(Math.max(1, safeOperand));
  const bBig = BigInt(bStr);
  const minDiv = safeDigits === 1 ? 1n : 10n ** BigInt(safeDigits - 1);
  const maxDiv = 10n ** BigInt(safeDigits) - 1n;
  const minQ = (minDiv + bBig - 1n) / bBig;
  const maxQ = maxDiv / bBig;

  let qBig: bigint;
  if (maxQ >= 1n && minQ <= maxQ) {
    const lowQ = maxQ >= 2n && minQ < 2n ? 2n : minQ;
    qBig = buildRandomBigIntInRange(lowQ, maxQ);
  } else {
    qBig = BigInt(Math.floor(Math.random() * 18) + 2);
  }

  const aStr = (qBig * bBig).toString();
  const ansStr = qBig.toString();
  return {
    a: aStr,
    b: bStr,
    answer: ansStr,
    hintVi: `${formatBigIntStr(aStr)} ÷ ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
    hintEn: `${formatBigIntStr(aStr)} ÷ ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
  };
}

// ============================================================================
// PHẦN A: CẤU HÌNH & HOOK AUTO-NEXT (TỰ ĐỘNG CHUYỂN CÂU KHI XONG CÂU HỎI)
// ============================================================================
// --- Inline MentalMathAutoNext config & hook (coded directly in Page) ---
type MentalMathAutoNextGroup = 'practice' | 'challenge' | 'difficulty';

interface MentalMathAutoNextPageMeta {
  key: MentalMathAutoNextPageKey;
  group: MentalMathAutoNextGroup;
  defaultDelaySec: number;
  labelVi: string;
  labelEn: string;
}

const MENTAL_MATH_AUTO_NEXT_PAGE_META = [
  // --- Challenge pages (12) ---
  {
    key: 'TwoDigitMentalMathChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    ...biLabel("Nhân 2 chữ số — Thử thách"),
  },
  {
    key: 'MultiplyBy11ChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 11 — Thử thách"),
  },
  {
    key: 'MultiplyBy99ChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 99 — Thử thách"),
  },
  {
    key: 'MultiplyWith1DigitChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 1 chữ số — Thử thách"),
  },
  {
    key: 'DivisionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Phép chia — Thử thách"),
  },
  {
    key: 'AdditionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Phép cộng — Thử thách"),
  },
  {
    key: 'SubtractionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Phép trừ — Thử thách"),
  },
  {
    key: 'ExponentChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Lũy thừa — Thử thách"),
  },
  {
    key: 'SquareRootChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Căn bậc 2 — Thử thách"),
  },
  {
    key: 'PercentageChallengePage_basic',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tính % của số) — Thử thách"),
  },
  {
    key: 'PercentageChallengePage_change',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tăng / Giảm %) — Thử thách"),
  },
  {
    key: 'PercentageChallengePage_reverse',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách"),
  },
  {
    key: 'DailyReflexChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    ...biLabel("Phản xạ hàng ngày — Thử thách"),
  },

  // --- Difficult Level Challenge pages (12) ---
  {
    key: 'TwoDigitMentalMathDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    ...biLabel("Nhân 2 chữ số — Thử thách khó"),
  },
  {
    key: 'MultiplyBy11DifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 11 — Thử thách khó"),
  },
  {
    key: 'MultiplyBy99DifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 99 — Thử thách khó"),
  },
  {
    key: 'MultiplyWith1DigitDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    ...biLabel("Nhân với 1 chữ số — Thử thách khó"),
  },
  {
    key: 'DivisionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Phép chia — Thử thách khó"),
  },
  {
    key: 'AdditionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Phép cộng — Thử thách khó"),
  },
  {
    key: 'SubtractionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Phép trừ — Thử thách khó"),
  },
  {
    key: 'ExponentDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Lũy thừa — Thử thách khó"),
  },
  {
    key: 'SquareRootDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Căn bậc 2 — Thử thách khó"),
  },
  {
    key: 'PercentageDifficultyChallengePage_basic',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tính % của số) — Thử thách khó"),
  },
  {
    key: 'PercentageDifficultyChallengePage_change',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tăng / Giảm %) — Thử thách khó"),
  },
  {
    key: 'PercentageDifficultyChallengePage_reverse',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách khó"),
  },
  {
    key: 'DailyReflexDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    ...biLabel("Phản xạ hàng ngày — Thử thách khó"),
  },

  // --- Practice pages (12) ---
  {
    key: 'TwoDigitMultiplicationPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Nhân 2 chữ số — Luyện tập"),
  },
  {
    key: 'MultiplyBy11Page',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Nhân với 11 — Luyện tập"),
  },
  {
    key: 'MultiplyBy99Page',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Nhân với 99 — Luyện tập"),
  },
  {
    key: 'MultiplyWith1DigitPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Nhân với 1 chữ số — Luyện tập"),
  },
  {
    key: 'DivisionPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Phép chia — Luyện tập"),
  },
  {
    key: 'AdditionPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Phép cộng — Luyện tập"),
  },
  {
    key: 'SubtractionPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Phép trừ — Luyện tập"),
  },
  {
    key: 'ExponentPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Lũy thừa — Luyện tập"),
  },
  {
    key: 'SquareRootPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Căn bậc 2 — Luyện tập"),
  },
  {
    key: 'PercentagePage_basic',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Tỷ lệ % (Tính % của số) — Luyện tập"),
  },
  {
    key: 'PercentagePage_change',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Tỷ lệ % (Tăng / Giảm %) — Luyện tập"),
  },
  {
    key: 'PercentagePage_reverse',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Luyện tập"),
  },
  {
    key: 'DailyReflexPage',
    group: 'practice',
    defaultDelaySec: 0,
    ...biLabel("Phản xạ hàng ngày — Luyện tập"),
  },
] as const;

type MentalMathAutoNextPageKey =
  (typeof MENTAL_MATH_AUTO_NEXT_PAGE_META)[number]['key'];

const AUTO_NEXT_STORAGE_KEY = 'mental_math_auto_next_v1';
const AUTO_NEXT_UPDATE_EVENT = 'mental-math-auto-next-updated';

type AutoNextGlobalTarget = 'all' | 'challenges' | 'practice';

interface StoredMentalMathAutoNext {
  globalChallenge?: number;
  globalPractice?: number;
  pages: Partial<Record<MentalMathAutoNextPageKey, number>>;
}

interface EffectiveAutoNextConfig {
  delaySec: number;
  defaultDelaySec: number;
  source: 'page' | 'global' | 'default';
  group: MentalMathAutoNextGroup;
}

const sanitizeAutoNextDelay = (val: unknown, fallback = 3): number => {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  if (num <= 0) return 0;
  const clamped = Math.min(60, Math.max(0.5, num));
  return Math.round(clamped * 10) / 10;
};

const formatAutoNextDelay = (delaySec: number, isVi: boolean): string => {
  if (delaySec <= 0) {
    return translateText(isVi ? 'vi' : 'en', "Thủ công");
  }
  const clean = Number.isInteger(delaySec) ? String(delaySec) : String(Math.round(delaySec * 10) / 10);
  return `${clean}s`;
};

const getAutoNextPageMeta = (pageKey: MentalMathAutoNextPageKey) => {
  return (
    MENTAL_MATH_AUTO_NEXT_PAGE_META.find((m) => m.key === pageKey) ||
    MENTAL_MATH_AUTO_NEXT_PAGE_META[0]
  );
};

const getStoredAutoNextOverrides = (): StoredMentalMathAutoNext => {
  if (typeof window === 'undefined') {
    return { pages: {} };
  }
  try {
    const raw = localStorage.getItem(AUTO_NEXT_STORAGE_KEY);
    if (!raw) return { pages: {} };
    const parsed = JSON.parse(raw) as StoredMentalMathAutoNext;
    return {
      globalChallenge:
        typeof parsed.globalChallenge === 'number'
          ? sanitizeAutoNextDelay(parsed.globalChallenge, 3)
          : undefined,
      globalPractice:
        typeof parsed.globalPractice === 'number'
          ? sanitizeAutoNextDelay(parsed.globalPractice, 0)
          : undefined,
      pages: parsed.pages || {},
    };
  } catch {
    return { pages: {} };
  }
};

const writeStoredAutoNextOverrides = (next: StoredMentalMathAutoNext): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_NEXT_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(AUTO_NEXT_UPDATE_EVENT));
  } catch {
    // Ignore storage errors
  }
};

const getEffectiveAutoNextConfig = (
  pageKey: MentalMathAutoNextPageKey
): EffectiveAutoNextConfig => {
  const meta = getAutoNextPageMeta(pageKey);
  const stored = getStoredAutoNextOverrides();

  const pageOverride = stored.pages?.[pageKey];
  if (typeof pageOverride === 'number' && Number.isFinite(pageOverride)) {
    return {
      delaySec: sanitizeAutoNextDelay(pageOverride, meta.defaultDelaySec),
      defaultDelaySec: meta.defaultDelaySec,
      source: 'page',
      group: meta.group,
    };
  }

  if (meta.group === 'practice' && typeof stored.globalPractice === 'number') {
    return {
      delaySec: sanitizeAutoNextDelay(stored.globalPractice, meta.defaultDelaySec),
      defaultDelaySec: meta.defaultDelaySec,
      source: 'global',
      group: meta.group,
    };
  }

  if (meta.group !== 'practice' && typeof stored.globalChallenge === 'number') {
    return {
      delaySec: sanitizeAutoNextDelay(stored.globalChallenge, meta.defaultDelaySec),
      defaultDelaySec: meta.defaultDelaySec,
      source: 'global',
      group: meta.group,
    };
  }

  return {
    delaySec: meta.defaultDelaySec,
    defaultDelaySec: meta.defaultDelaySec,
    source: 'default',
    group: meta.group,
  };
};

const savePageAutoNextOverride = (
  pageKey: MentalMathAutoNextPageKey,
  delaySec: number
): void => {
  const meta = getAutoNextPageMeta(pageKey);
  const current = getStoredAutoNextOverrides();
  const clean = sanitizeAutoNextDelay(delaySec, meta.defaultDelaySec);
  writeStoredAutoNextOverrides({
    ...current,
    pages: {
      ...current.pages,
      [pageKey]: clean,
    },
  });
};

const saveGlobalAutoNextOverride = (
  target: AutoNextGlobalTarget,
  delaySec: number,
  clearPerPageOverrides = true
): void => {
  const current = getStoredAutoNextOverrides();
  const clean = sanitizeAutoNextDelay(delaySec, 3);
  const nextPages = { ...current.pages };

  if (clearPerPageOverrides) {
    for (const meta of MENTAL_MATH_AUTO_NEXT_PAGE_META) {
      const matches =
        target === 'all' ||
        (target === 'challenges' && meta.group !== 'practice') ||
        (target === 'practice' && meta.group === 'practice');
      if (matches) {
        delete nextPages[meta.key];
      }
    }
  }

  writeStoredAutoNextOverrides({
    globalChallenge:
      target === 'all' || target === 'challenges' ? clean : current.globalChallenge,
    globalPractice:
      target === 'all' || target === 'practice' ? clean : current.globalPractice,
    pages: nextPages,
  });
};

const resetPageAutoNextOverride = (pageKey: MentalMathAutoNextPageKey): void => {
  const current = getStoredAutoNextOverrides();
  const nextPages = { ...current.pages };
  delete nextPages[pageKey];
  writeStoredAutoNextOverrides({
    ...current,
    pages: nextPages,
  });
};

const resetGlobalAutoNextOverride = (
  target: AutoNextGlobalTarget,
  clearPerPageOverrides = true
): void => {
  const current = getStoredAutoNextOverrides();
  const nextPages = { ...current.pages };
  if (clearPerPageOverrides) {
    for (const meta of MENTAL_MATH_AUTO_NEXT_PAGE_META) {
      const matches =
        target === 'all' ||
        (target === 'challenges' && meta.group !== 'practice') ||
        (target === 'practice' && meta.group === 'practice');
      if (matches) {
        delete nextPages[meta.key];
      }
    }
  }

  writeStoredAutoNextOverrides({
    globalChallenge:
      target === 'all' || target === 'challenges' ? undefined : current.globalChallenge,
    globalPractice:
      target === 'all' || target === 'practice' ? undefined : current.globalPractice,
    pages: nextPages,
  });
};

const useMentalMathAutoNextConfig = (
  pageKey: MentalMathAutoNextPageKey
): EffectiveAutoNextConfig => {
  const [config, setConfig] = useState<EffectiveAutoNextConfig>(() =>
    getEffectiveAutoNextConfig(pageKey)
  );

  const refresh = useCallback(() => {
    setConfig(getEffectiveAutoNextConfig(pageKey));
  }, [pageKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onUpdate = () => refresh();
    window.addEventListener(AUTO_NEXT_UPDATE_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(AUTO_NEXT_UPDATE_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refresh]);

  return config;
};

// ============================================================================
// PHẦN B: MODAL CÀI ĐẶT THỜI GIAN TỰ ĐỘNG CHUYỂN CÂU (AUTO-NEXT MODAL)
// ============================================================================
// --- Inline MentalMathAutoNextModal (coded directly in Page) ---
interface MentalMathAutoNextModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: 'global' | 'page';
  initialPageKey?: MentalMathAutoNextPageKey;
}

const DELAY_PRESETS: number[] = [0.5, 1, 1.5, 2, 3, 4, 5, 8, 10];

const CHALLENGE_GROUP = MENTAL_MATH_AUTO_NEXT_PAGE_META.filter((m) => m.group === 'challenge');
const DIFFICULTY_GROUP = MENTAL_MATH_AUTO_NEXT_PAGE_META.filter((m) => m.group === 'difficulty');
const PRACTICE_GROUP = MENTAL_MATH_AUTO_NEXT_PAGE_META.filter((m) => m.group === 'practice');

const MentalMathAutoNextModal: React.FC<MentalMathAutoNextModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'global',
  initialPageKey = 'TwoDigitMentalMathChallengePage',
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  const validInitialPageKey = useMemo<MentalMathAutoNextPageKey>(() => {
    const found = MENTAL_MATH_AUTO_NEXT_PAGE_META.find((p) => p.key === initialPageKey);
    return found ? found.key : MENTAL_MATH_AUTO_NEXT_PAGE_META[0].key;
  }, [initialPageKey]);

  const [scope, setScope] = useState<'global' | 'page'>(initialScope);
  const [globalTarget, setGlobalTarget] = useState<AutoNextGlobalTarget>('all');
  const [selectedPageKey, setSelectedPageKey] =
    useState<MentalMathAutoNextPageKey>(validInitialPageKey);
  const [delaySec, setDelaySec] = useState<number>(3);
  const [customDraft, setCustomDraft] = useState<string>('3');
  const [overrideExistingPages, setOverrideExistingPages] = useState<boolean>(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setScope(initialScope);
    setSelectedPageKey(validInitialPageKey);
    setSavedNotice(null);
  }, [isOpen, initialScope, validInitialPageKey]);

  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'global') {
      const stored = getStoredAutoNextOverrides();
      const base =
        globalTarget === 'practice'
          ? stored.globalPractice ?? 3
          : stored.globalChallenge ?? stored.globalPractice ?? 3;
      const clean = sanitizeAutoNextDelay(base, 3);
      setDelaySec(clean);
      setCustomDraft(clean > 0 ? String(clean) : '');
    } else {
      const effective = getEffectiveAutoNextConfig(selectedPageKey);
      setDelaySec(effective.delaySec);
      setCustomDraft(effective.delaySec > 0 ? String(effective.delaySec) : '');
    }
  }, [isOpen, scope, globalTarget, selectedPageKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stored = getStoredAutoNextOverrides();
  const matchingPerPageOverrides = MENTAL_MATH_AUTO_NEXT_PAGE_META.filter((p) => {
    if (stored.pages?.[p.key] === undefined) return false;
    if (globalTarget === 'all') return true;
    if (globalTarget === 'challenges') return p.group !== 'practice';
    return p.group === 'practice';
  });

  const currentPageEffective = getEffectiveAutoNextConfig(selectedPageKey);
  const selectedPageMeta = getAutoNextPageMeta(selectedPageKey);

  const handleSelectPreset = (sec: number) => {
    setDelaySec(sec);
    setCustomDraft(sec > 0 ? String(sec) : '');
    setSavedNotice(null);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw;
    setCustomDraft(formatted);
    setSavedNotice(null);
    if (formatted !== '' && formatted !== '.') {
      const num = parseFloat(formatted);
      if (Number.isFinite(num)) {
        if (num <= 0) {
          setDelaySec(0);
        } else {
          setDelaySec(sanitizeAutoNextDelay(num, 3));
        }
      }
    }
  };

  const commitCustomInput = () => {
    if (customDraft === '' || customDraft === '.') {
      if (delaySec > 0) {
        setCustomDraft(String(delaySec));
      }
      return;
    }
    const num = parseFloat(customDraft);
    if (!Number.isFinite(num) || num <= 0) {
      setDelaySec(0);
      setCustomDraft('');
      return;
    }
    const clean = sanitizeAutoNextDelay(num, 3);
    setDelaySec(clean);
    setCustomDraft(String(clean));
  };

  const handleSave = () => {
    const finalDelay =
      customDraft !== '' && customDraft !== '.'
        ? sanitizeAutoNextDelay(parseFloat(customDraft), delaySec)
        : delaySec;

    if (scope === 'global') {
      saveGlobalAutoNextOverride(globalTarget, finalDelay, overrideExistingPages);
      const labelDelay = formatAutoNextDelay(finalDelay, isVi);
      setSavedNotice(
        isVi
          ? `Đã áp dụng thời gian đổi câu (${labelDelay}) cho toàn bộ mục đã chọn!`
          : `Saved auto-switch delay (${labelDelay}) globally!`
      );
    } else {
      savePageAutoNextOverride(selectedPageKey, finalDelay);
      const label = isVi ? selectedPageMeta.labelVi : selectedPageMeta.labelEn;
      const labelDelay = formatAutoNextDelay(finalDelay, isVi);
      setSavedNotice(
        isVi
          ? `Đã lưu thời gian đổi câu (${labelDelay}) cho "${label}"!`
          : `Saved auto-switch delay (${labelDelay}) for "${label}"!`
      );
    }
    window.setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleReset = () => {
    if (scope === 'global') {
      resetGlobalAutoNextOverride(globalTarget, overrideExistingPages);
      const fallback = globalTarget === 'practice' ? 0 : 2;
      setDelaySec(fallback);
      setCustomDraft(fallback > 0 ? String(fallback) : '');
      setSavedNotice(
        tr("Đã khôi phục mặc định hệ thống!")
      );
    } else {
      resetPageAutoNextOverride(selectedPageKey);
      const effective = getEffectiveAutoNextConfig(selectedPageKey);
      setDelaySec(effective.delaySec);
      setCustomDraft(effective.delaySec > 0 ? String(effective.delaySec) : '');
      setSavedNotice(
        tr("Đã khôi phục cấu hình trang này!")
      );
    }
  };

  const sourceLabel =
    currentPageEffective.source === 'page'
      ? tr("Cấu hình riêng trang này")
      : currentPageEffective.source === 'global'
      ? tr("Theo cấu hình toàn bộ")
      : tr("Mặc định hệ thống");

  const sourceClass =
    currentPageEffective.source === 'page'
      ? 'text-amber-300'
      : currentPageEffective.source === 'global'
      ? 'text-cyan-300'
      : 'text-slate-400';

  const effectiveTargetGroup =
    scope === 'page'
      ? selectedPageMeta.group
      : globalTarget === 'practice'
      ? 'practice'
      : 'challenge';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mental-math-autonext-modal-title"
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center shrink-0">
              <TimerReset className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3
                id="mental-math-autonext-modal-title"
                className="text-sm sm:text-base font-extrabold text-white"
              >
                {tr("Tùy chỉnh đổi câu hỏi — Mental Math")}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tr("Chọn sau bao nhiêu giây sẽ chuyển qua câu hỏi khác (Toàn bộ hoặc từng Page)")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr("Đóng")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Scope Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setScope('global');
                setSavedNotice(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                scope === 'global'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>{tr("Chỉnh toàn bộ")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScope('page');
                setSavedNotice(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                scope === 'page'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span>{tr("Chỉnh theo Page")}</span>
            </button>
          </div>

          {/* Global Scope Target Selector */}
          {scope === 'global' && (
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block">
                {tr("Phạm vi áp dụng toàn bộ:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    {
                      id: 'all',
                      vi: 'Tất cả Mental Math (36)',
                      en: 'All Mental Math (36)',
                    },
                    {
                      id: 'challenges',
                      vi: 'Thử thách & Khó (24)',
                      en: 'Challenge & Hard (24)',
                    },
                    {
                      id: 'practice',
                      vi: 'Chỉ Luyện tập (12)',
                      en: 'Practice Only (12)',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setGlobalTarget(item.id);
                      setSavedNotice(null);
                    }}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      globalTarget === item.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {isVi ? item.vi : item.en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Page Selector */}
          {scope === 'page' && (
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="autonext-page-selector"
                  className="text-xs font-bold text-slate-300"
                >
                  {tr("Chọn Page cần tùy chỉnh:")}
                </label>
                <span className={`text-[11px] font-semibold ${sourceClass}`}>
                  {sourceLabel}
                  {' · '}
                  {isVi
                    ? `Mặc định: ${formatAutoNextDelay(selectedPageMeta.defaultDelaySec, true)}`
                    : `Default: ${formatAutoNextDelay(selectedPageMeta.defaultDelaySec, false)}`}
                </span>
              </div>
              <select
                id="autonext-page-selector"
                value={selectedPageKey}
                onChange={(e) => {
                  setSelectedPageKey(e.target.value as MentalMathAutoNextPageKey);
                  setSavedNotice(null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <optgroup label={tr("Thử thách (Challenge)")}>
                  {CHALLENGE_GROUP.map((page) => {
                    const hasCustom = stored.pages?.[page.key] !== undefined;
                    const label = isVi ? page.labelVi : page.labelEn;
                    return (
                      <option key={page.key} value={page.key}>
                        {hasCustom ? `★ ${label}` : label}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup
                  label={tr("Thử thách cấp độ khó (Difficult Challenge)")}
                >
                  {DIFFICULTY_GROUP.map((page) => {
                    const hasCustom = stored.pages?.[page.key] !== undefined;
                    const label = isVi ? page.labelVi : page.labelEn;
                    return (
                      <option key={page.key} value={page.key}>
                        {hasCustom ? `★ ${label}` : label}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label={tr("Luyện tập (Practice)")}>
                  {PRACTICE_GROUP.map((page) => {
                    const hasCustom = stored.pages?.[page.key] !== undefined;
                    const label = isVi ? page.labelVi : page.labelEn;
                    return (
                      <option key={page.key} value={page.key}>
                        {hasCustom ? `★ ${label}` : label}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>
          )}

          {/* Seconds Picker */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200">
                {tr("Sau bao nhiêu giây đổi qua câu hỏi khác:")}
              </span>
              <span className="text-sm font-extrabold font-mono tabular-nums text-cyan-300">
                {formatAutoNextDelay(delaySec, isVi)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {DELAY_PRESETS.map((sec) => {
                const isActive = delaySec === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleSelectPreset(sec)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono tabular-nums border transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleSelectPreset(0)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                  delaySec === 0
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{tr("Thủ công (Không tự chuyển)")}</span>
              </button>
            </div>

            {/* Custom numeric input */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
              <label
                htmlFor="autonext-custom-seconds"
                className="text-xs font-semibold text-slate-300 whitespace-nowrap"
              >
                {tr("Nhập số giây tùy ý (0.5 – 60):")}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="autonext-custom-seconds"
                  type="text"
                  inputMode="decimal"
                  value={customDraft}
                  onChange={handleCustomInputChange}
                  onBlur={commitCustomInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitCustomInput();
                    }
                  }}
                  placeholder="3"
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none text-center text-xs sm:text-sm font-bold font-mono tabular-nums text-white"
                />
                <span className="text-xs font-semibold text-slate-400">
                  {tr("giây")}
                </span>
              </div>
            </div>

            {/* Contextual description */}
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-relaxed">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                {delaySec === 0
                  ? tr("Chế độ thủ công: Sau khi có kết quả, giữ nguyên màn hình để bạn bấm \"Câu tiếp theo\" khi sẵn sàng.")
                  : effectiveTargetGroup === 'practice'
                  ? isVi
                    ? `Trong Luyện tập: Khi trả lời đúng sẽ tự động đổi câu hỏi mới sau ${formatAutoNextDelay(delaySec, true)}.`
                    : `In Practice: Advances automatically ${formatAutoNextDelay(delaySec, false)} after a correct answer.`
                  : isVi
                  ? `Sau khi trả lời (hoặc hết giờ), tự động chuyển qua câu hỏi mới sau ${formatAutoNextDelay(delaySec, true)}.`
                  : `Automatically moves to the next question ${formatAutoNextDelay(delaySec, false)} after answering or timeout.`}
              </span>
            </p>
          </div>

          {/* Global scope override option */}
          {scope === 'global' && matchingPerPageOverrides.length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={overrideExistingPages}
                onChange={(e) => setOverrideExistingPages(e.target.checked)}
                className="mt-0.5 accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-amber-100 leading-relaxed">
                {isVi
                  ? `Ghi đè đồng bộ cả ${matchingPerPageOverrides.length} trang đang có cấu hình riêng lẻ.`
                  : `Also overwrite ${matchingPerPageOverrides.length} page(s) currently using per-page overrides.`}
              </span>
            </label>
          )}

          {savedNotice && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{tr("Đặt lại mặc định")}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {tr("Đóng [Hủy]")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>
                {scope === 'global'
                  ? tr("Áp dụng toàn bộ")
                  : tr("Lưu trang này")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

type DivisionDifficultyTopic = DivisionTopic | 'custom' | 'sequence';

interface DivisionDifficultyChallengePageProps {
  initialTopic?: DivisionTopic;
  onBack: () => void;
}

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';

const TOTAL_QUESTIONS = 10;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  div1Digit: '➗',
  div5or25: '⚡',
  div2Digit: '🚀',
  div3Digit: '💎',
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

// ============================================================================
// PHẦN C: COMPONENT CHÍNH TRANG THỬ THÁCH CẤP ĐỘ KHÓ PHÉP CHIA (10 CÂU)
// ============================================================================
export const DivisionDifficultyChallengePage: React.FC<DivisionDifficultyChallengePageProps> = ({
  initialTopic = 'general',
  onBack,
}) => {
  // Ngôn ngữ giao diện, cấu hình Auto-Next và cờ hiển thị nút Đổi câu
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('DivisionDifficultyChallengePage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('DivisionDifficultyChallengePage');
  const meta = OPERATION_META.division;
  const hardMode = true;
  const difficulty = hardMode ? 'hard' : 'normal';

  // State chuyên đề Phép chia đang chọn và cấu hình chế độ Tùy chọn (Chữ số & Số chia)
  const [selectedTopic, setSelectedTopic] = useState<DivisionDifficultyTopic>(initialTopic);
  const [customDigits, setCustomDigits] = useState<number>(4);
  const [operandMode, setOperandMode] = useState<CustomOperandMode>('exact');
  const [exactOperand, setExactOperand] = useState<number>(12);
  const [operandDigits, setOperandDigits] = useState<number>(2);
  const [digitsDraft, setDigitsDraft] = useState<string>(String(customDigits));
  const [exactDraft, setExactDraft] = useState<string>(String(exactOperand));
  const [opDigitsDraft, setOpDigitsDraft] = useState<string>(String(operandDigits));

  // State cấu hình chế độ Dãy số Siêu trí tuệ (Phép chia & Chia/Nhân)
  const [sequenceCount, setSequenceCount] = useState<number>(5);
  const [sequenceDigitProfile, setSequenceDigitProfile] = useState<SequenceDigitProfile>('2D3D');
  const [sequenceDisplayMode, setSequenceDisplayMode] = useState<SequenceDisplayMode>('flash');
  const [sequenceIncludeMultiply, setSequenceIncludeMultiply] = useState<boolean>(false);
  const [flashIndex, setFlashIndex] = useState<number>(0);
  const [sequenceCountDraft, setSequenceCountDraft] = useState<string>('5');

  useEffect(() => {
    setSequenceCountDraft(String(sequenceCount));
  }, [sequenceCount]);

  useEffect(() => {
    setDigitsDraft(String(customDigits));
  }, [customDigits]);

  useEffect(() => {
    setExactDraft(String(exactOperand));
  }, [exactOperand]);

  useEffect(() => {
    setOpDigitsDraft(String(operandDigits));
  }, [operandDigits]);

  const applyCustomDigitsChange = (val: number) => {
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, val));
              setCustomDigits(clamped);
              customDigitsRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
  };

  const handleDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        applyCustomDigitsChange(Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed)));
      }
    }
  };

  const commitDigits = () => {
    const parsed = parseInt(digitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setDigitsDraft(String(customDigits));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setDigitsDraft(String(clamped));
    if (clamped !== customDigits) {
      applyCustomDigitsChange(clamped);
    }
  };

  const applyExactOperandChange = (val: number) => {
    const clamped = Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, val));
              setExactOperand(clamped);
              exactOperandRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, 'exact', clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
  };

  const handleExactInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, String(MAX_CUSTOM_OPERAND).length);
    setExactDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_OPERAND) {
        applyExactOperandChange(Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, parsed)));
      }
    }
  };

  const commitExact = () => {
    const parsed = parseInt(exactDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_OPERAND) {
      setExactDraft(String(exactOperand));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, parsed));
    setExactDraft(String(clamped));
    if (clamped !== exactOperand) {
      applyExactOperandChange(clamped);
    }
  };

  const applyOperandDigitsChange = (val: number) => {
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, val));
              setOperandDigits(clamped);
              operandDigitsRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, 'digits', undefined, clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
  };

  const handleOpDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setOpDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        applyOperandDigitsChange(Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed)));
      }
    }
  };

  const commitOpDigits = () => {
    const parsed = parseInt(opDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setOpDigitsDraft(String(operandDigits));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setOpDigitsDraft(String(clamped));
    if (clamped !== operandDigits) {
      applyOperandDigitsChange(clamped);
    }
  };

  // State cấu hình Timer 2 giai đoạn (Quan sát & Trả lời) và trạng thái phiên thử thách 10 câu
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(10);
  const [answerTimeLimit, setAnswerTimeLimit] = useState<AnswerTimeLimit>(10);
  const [limitDraft, setLimitDraft] = useState<string>('10');
  const [answerDraft, setAnswerDraft] = useState<string>('10');
  const isEditingLimitRef = useRef<boolean>(false);
  const isEditingAnswerRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isEditingLimitRef.current) {
      setLimitDraft(String(timeLimit));
    }
  }, [timeLimit]);

  useEffect(() => {
    if (!isEditingAnswerRef.current) {
      setAnswerDraft(String(answerTimeLimit));
    }
  }, [answerTimeLimit]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<DifficultyBigQuestion>(() =>
    toBigQuestion(generateOperationQuestion('division', initialTopic, difficulty))
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
  const selectedTopicRef = useRef<DivisionDifficultyTopic>(selectedTopic);
  const customDigitsRef = useRef<number>(customDigits);
  const operandModeRef = useRef<CustomOperandMode>(operandMode);
  const exactOperandRef = useRef<number>(exactOperand);
  const operandDigitsRef = useRef<number>(operandDigits);
  const sequenceCountRef = useRef<number>(sequenceCount);
  const sequenceDigitProfileRef = useRef<SequenceDigitProfile>(sequenceDigitProfile);
  const sequenceDisplayModeRef = useRef<SequenceDisplayMode>(sequenceDisplayMode);
  const sequenceIncludeMultiplyRef = useRef<boolean>(sequenceIncludeMultiply);
  const timeLimitRef = useRef<TimeLimit>(timeLimit);
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  const advanceQuestionRef = useRef<
    (nextIdx: number, topicId: DivisionDifficultyTopic, limit: TimeLimit, answerLimitOverride?: AnswerTimeLimit) => void
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
    sequenceCountRef.current = sequenceCount;
  }, [sequenceCount]);

  useEffect(() => {
    sequenceDigitProfileRef.current = sequenceDigitProfile;
  }, [sequenceDigitProfile]);

  useEffect(() => {
    sequenceDisplayModeRef.current = sequenceDisplayMode;
  }, [sequenceDisplayMode]);

  useEffect(() => {
    sequenceIncludeMultiplyRef.current = sequenceIncludeMultiply;
  }, [sequenceIncludeMultiply]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  useEffect(() => {
    answerTimeLimitRef.current = answerTimeLimit;
  }, [answerTimeLimit]);

  useEffect(() => {
    challengePhaseRef.current = challengePhase;
  }, [challengePhase]);

  // Hàm sinh câu hỏi Phép chia mới (theo chủ đề chuẩn, Tùy chọn BigInt hoặc Dãy số Siêu trí tuệ)
  const generateProblem = useCallback(
    (
      topicOverride?: DivisionDifficultyTopic,
      digitsOverride?: number,
      modeOverride?: CustomOperandMode,
      exactOverride?: number,
      opDigitsOverride?: number,
      seqCountOverride?: number,
      seqProfileOverride?: SequenceDigitProfile,
      seqIncludeMulOverride?: boolean
    ): DifficultyBigQuestion => {
      const activeTopic = topicOverride ?? selectedTopicRef.current;
      if (activeTopic === 'custom') {
        return generateCustomArithmeticQuestion(
          'division',
          digitsOverride ?? customDigitsRef.current,
          modeOverride ?? operandModeRef.current,
          exactOverride ?? exactOperandRef.current,
          opDigitsOverride ?? operandDigitsRef.current
        );
      }
      if (activeTopic === 'sequence') {
        return generateDivisionSequenceQuestion(
          seqCountOverride ?? sequenceCountRef.current,
          seqProfileOverride ?? sequenceDigitProfileRef.current,
          seqIncludeMulOverride ?? sequenceIncludeMultiplyRef.current
        );
      }
      return toBigQuestion(generateOperationQuestion('division', activeTopic, difficulty));
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

  const formatLabel = (q: DifficultyBigQuestion) => {
    if (q.numbers && q.numbers.length > 0) {
      const formatTerms = (limit?: number) => {
        const list = limit !== undefined ? q.numbers!.slice(0, limit) : q.numbers!;
        return list
          .map((n, idx) => (idx === 0 ? formatBigIntStr(n) : `${q.operations?.[idx] ?? '÷'} ${formatBigIntStr(n)}`))
          .join(' ');
      };
      return q.numbers.length > 4
        ? `${formatTerms(4)} ... (${q.numbers.length} số)`
        : formatTerms();
    }
    return `${formatBigIntStr(q.a)} ÷ ${formatBigIntStr(q.b ?? '1')}`;
  };

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const q = questionRef.current;
      const text =
        q.numbers && q.numbers.length > 0
          ? q.numbers
              .map((n, idx) => {
                if (idx === 0) return String(n);
                const op = q.operations?.[idx] ?? '÷';
                const opWord = op === '×' ? (isVi ? 'nhân' : 'times') : isVi ? 'chia' : 'divided by';
                return `${opWord} ${n}`;
              })
              .join(' ')
          : isVi
          ? `${q.a} chia ${q.b}`
          : `${q.a} divided by ${q.b}`;
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

  // Chuyển sang giai đoạn 2: ẩn đề bài và đếm ngược thời gian nhập đáp án
  const beginAnsweringPhase = useCallback(
    (
      idxOverride?: number,
      qOverride?: DifficultyBigQuestion,
      topicOverride?: DivisionDifficultyTopic,
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
              userAnswer: tr("Hết giờ"),
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

  // Chuyển sang câu hỏi tiếp theo và khởi chạy giai đoạn Quan sát đề bài
  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      topicId: DivisionDifficultyTopic,
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
      setFlashIndex(0);
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
      const startTime = Date.now();
      const totalDurationMs = limit * 1000;
      const endTime = startTime + totalDurationMs;
      const seqNumbers = nextQ.numbers;
      const shouldFlashSeq =
        topicId === 'sequence' &&
        Boolean(seqNumbers && seqNumbers.length > 0) &&
        sequenceDisplayModeRef.current === 'flash';

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const remainingMs = endTime - now;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (shouldFlashSeq && seqNumbers && seqNumbers.length > 0) {
          const stepMs = totalDurationMs / seqNumbers.length;
          const nextFlashIdx = Math.min(
            seqNumbers.length - 1,
            Math.max(0, Math.floor(elapsedMs / stepMs))
          );
          setFlashIndex(nextFlashIdx);
        }

        if (remainingMs <= 0) {
          beginAnsweringPhase(nextIdx, nextQ, topicId, limit, activeAnsLimit);
        }
      }, 50);
    },
    [beginAnsweringPhase, clearTimers, generateProblem, stopListening]
  );

  useEffect(() => {
    advanceQuestionRef.current = advanceQuestion;
  }, [advanceQuestion]);

  // Bắt đầu phiên thử thách 10 câu mới và reset điểm/chuỗi
  const startChallenge = (
    topicOverride?: DivisionDifficultyTopic,
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

  // Đặt lại phiên thử thách về trạng thái ban đầu (idle)
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
    setFlashIndex(0);
    setTimeLeft(timeLimit);
    const nextQ = generateProblem(selectedTopic);
    setQuestion(nextQ);
    questionRef.current = nextQ;
  };


  // Chấm điểm đáp án người dùng gửi lên, phát âm thanh thông báo & tự chuyển câu (nếu bật)
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

  // Bật/tắt nhận diện giọng nói (Web Speech API) trong giai đoạn Trả lời
  const toggleVoice = () => {
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        tr("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.")
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
    DIVISION_TOPICS.find((tItem) => tItem.id === selectedTopic) || DIVISION_TOPICS[0];
  const dynamicBadge =
    selectedTopic === 'custom'
      ? operandMode === 'digits'
        ? isVi
          ? `${customDigits} chữ số ÷ ${operandDigits} chữ số`
          : `${customDigits}-Digit ÷ ${operandDigits}-Digit`
        : isVi
        ? `${customDigits} chữ số ÷ ${formatBigIntStr(exactOperand)}`
        : `${customDigits}-Digit ÷ ${formatBigIntStr(exactOperand)}`
      : selectedTopic === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} số · ${sequenceDigitProfile}${sequenceIncludeMultiply ? ' · ÷/×' : ' · ÷'}`
        : `${sequenceCount}-Num Seq · ${sequenceDigitProfile}${sequenceIncludeMultiply ? ' · ÷/×' : ' · ÷'}`
      : isVi
      ? currentTopicMeta.badgeVi
      : currentTopicMeta.badgeEn;
  const completedTopicLabel =
    selectedTopic === 'custom'
      ? dynamicBadge
      : selectedTopic === 'sequence'
      ? isVi
        ? `Siêu trí tuệ Dãy ${sequenceCount} số (${sequenceDigitProfile}${sequenceIncludeMultiply ? ', ÷/×' : ', ÷'})`
        : `Sequence ${sequenceCount} numbers (${sequenceDigitProfile}${sequenceIncludeMultiply ? ', ÷/×' : ', ÷'})`
      : isVi
      ? currentTopicMeta.labelVi
      : currentTopicMeta.labelEn;

  const isCustomLayout = selectedTopic === 'custom' || selectedTopic === 'sequence';
  const formattedA = formatBigIntStr(question.a);
  const formattedB = formatBigIntStr(question.b ?? '1');
  const totalFormattedLen = formattedA.length + formattedB.length + 3;
  const useStackedFormula = selectedTopic === 'custom' ? totalFormattedLen > 56 : false;
  const linesA = useStackedFormula ? splitFormattedIntoBalancedLines(question.a, 10) : [formattedA];
  const linesB = useStackedFormula ? splitFormattedIntoBalancedLines(question.b ?? '1', 10) : [formattedB];
  const formulaFontSize = getCustomFormulaFontSize(totalFormattedLen);

  const canAnswer = status === 'running' && challengePhase === 'answering';
  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const isUrgent = timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / activePhaseDuration) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: nút Quay lại và breadcrumb Luyện tập / Thử Thách Cấp Độ Khó */}
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
          <span>{tr("Quay lại")}</span>
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
            {tr("Luyện tập")}
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{tr("Thử Thách Cấp Độ Khó")}</span>
          </span>
        </div>
      </div>

      {/* Khung chính trang Thử thách Cấp độ Khó Phép chia */}
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

        {/* Phần đầu: tiêu đề Cấp độ Khó, ô chỉnh Thời gian Quan sát / Trả lời, nút Đổi câu & Loa */}
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
                <span>{tr("Thử Thách Cấp Độ Khó")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                  {dynamicBadge}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? tr("Cấp độ khó: số bị chia và số chia lớn hơn, phản xạ tốc độ cao")
                  : isVi
                  ? meta.subtitleVi
                  : meta.subtitleEn}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex flex-col items-start sm:items-end gap-1.5 max-w-full">
              {/* Limit / Thời gian quan sát */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 max-w-full">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{tr("Thời gian: [Giới hạn]")}</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    disabled={status === 'running'}
                    value={limitDraft}
                    onFocus={(e) => {
                      isEditingLimitRef.current = true;
                      e.currentTarget.select();
                    }}
                    onMouseUp={(e) => e.preventDefault()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                      setLimitDraft(cleaned);
                      if (cleaned.length > 0) {
                        const parsed = parseInt(cleaned, 10);
                        if (!Number.isNaN(parsed) && parsed >= 1) {
                          const clamped = Math.min(999, Math.max(1, Math.round(parsed)));
                          setTimeLimit(clamped);
                          if (status === 'idle') setTimeLeft(clamped);
                        }
                      }
                    }}
                    onBlur={() => {
                      isEditingLimitRef.current = false;
                      const parsed = parseInt(limitDraft, 10);
                      const resolved =
                        Number.isNaN(parsed) || parsed < 1
                          ? Math.min(999, Math.max(1, timeLimit >= 1 ? Math.round(timeLimit) : 10))
                          : Math.min(999, Math.max(1, Math.round(parsed)));
                      setLimitDraft(String(resolved));
                      setTimeLimit(resolved);
                      if (status === 'idle') setTimeLeft(resolved);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    aria-label={tr("Thời gian giới hạn (giây)")}
                    title={tr("Nhập số giây giới hạn (giây)")}
                    className="w-14 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 focus:border-yellow-400 focus:outline-none text-center text-xs font-bold text-white tabular-nums selection:bg-yellow-400 selection:text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-[11px] font-bold text-slate-400">s</span>
                </div>
              </div>

              {/* Answer / Thời gian trả lời */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/30 max-w-full">
                <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 whitespace-nowrap">
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tr("Trả lời:")}</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    disabled={status === 'running'}
                    value={answerDraft}
                    onFocus={(e) => {
                      isEditingAnswerRef.current = true;
                      e.currentTarget.select();
                    }}
                    onMouseUp={(e) => e.preventDefault()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                      setAnswerDraft(cleaned);
                      if (cleaned.length > 0) {
                        const parsed = parseInt(cleaned, 10);
                        if (!Number.isNaN(parsed) && parsed >= 1) {
                          const clamped = Math.min(999, Math.max(1, Math.round(parsed)));
                          setAnswerTimeLimit(clamped);
                          answerTimeLimitRef.current = clamped;
                        }
                      }
                    }}
                    onBlur={() => {
                      isEditingAnswerRef.current = false;
                      const parsed = parseInt(answerDraft, 10);
                      const resolved =
                        Number.isNaN(parsed) || parsed < 1
                          ? Math.min(999, Math.max(1, answerTimeLimit >= 1 ? Math.round(answerTimeLimit) : 10))
                          : Math.min(999, Math.max(1, Math.round(parsed)));
                      setAnswerDraft(String(resolved));
                      setAnswerTimeLimit(resolved);
                      answerTimeLimitRef.current = resolved;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    aria-label={tr("Thời gian trả lời (giây)")}
                    title={tr("Nhập số giây trả lời (mặc định 10s)")}
                    className="w-14 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-bold text-cyan-200 tabular-nums selection:bg-cyan-400 selection:text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-[11px] font-bold text-cyan-300/80">s</span>
                </div>
              </div>
            </div>

            {showAutoNextButton && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAutoNextModalOpen(true)}
                  title={
                    isVi
                      ? `Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Hiện tại: ${formatAutoNextDelay(autoNextConfig.delaySec, isVi)})`
                      : `Customize auto-switch delay to next question (Current: ${formatAutoNextDelay(autoNextConfig.delaySec, isVi)})`
                  }
                  aria-label={
                    isVi
                      ? `Tùy chỉnh đổi câu (${formatAutoNextDelay(autoNextConfig.delaySec, isVi)})`
                      : `Auto-switch delay (${formatAutoNextDelay(autoNextConfig.delaySec, isVi)})`
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
                    autoNextConfig.source !== 'default'
                      ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-200 hover:bg-cyan-500/25'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-slate-900'
                  }`}
                >
                  <TimerReset className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">{tr("Đổi câu:")}</span>
                  <span className="font-mono tabular-nums text-cyan-300">
                    {formatAutoNextDelay(autoNextConfig.delaySec, isVi)}
                  </span>
                </button>

                <MentalMathAutoNextModal
                  isOpen={isAutoNextModalOpen}
                  onClose={() => setIsAutoNextModalOpen(false)}
                  initialScope="page"
                  initialPageKey={"DivisionDifficultyChallengePage"}
                />
              </>
            )}

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
              title={isSpeakerEnabled ? (tr("Âm thanh: BẬT")) : tr("Âm thanh: TẮT")}
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-4 h-4 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Lưới chọn chuyên đề Phép chia và hàng cấu hình Tùy chọn (Chữ số & Số chia) */}
        <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DIVISION_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                disabled={status === 'running'}
                onClick={() => {
                  const nextId = topic.id as DivisionTopic;
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
                <span className="text-base">{TOPIC_ICONS[topic.id] || '➗'}</span>
                <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
              </button>
            ))}
          </div>

          <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedTopic('custom');
              selectedTopicRef.current = 'custom';
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom');
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
              }}
              title={tr("Tùy chọn độ dài chữ số và số chia tùy ý")}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedTopic === 'custom'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${selectedTopic === 'custom' ? 'text-slate-950' : 'text-yellow-400'}`}
              />
              <span className="whitespace-nowrap">{tr("Tùy chọn (Chữ số & Số chia)")}</span>
            </button>

            {selectedTopic === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                {/* Textbox 1: Độ dài Chữ số */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="div-custom-digit-length"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài Chữ số:")}
                  </label>
                  <input
                    id="div-custom-digit-length"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    disabled={status === 'running'}
                    value={digitsDraft}
                    onFocus={(e) => e.target.select()}
                    onChange={handleDigitsInput}
                    onBlur={commitDigits}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    aria-label={isVi ? `Độ dài chữ số (1 - ${MAX_CUSTOM_DIGITS})` : `Digit length (1 - ${MAX_CUSTOM_DIGITS})`}
                    title={isVi ? `Nhập độ dài chữ số (từ 1 đến ${MAX_CUSTOM_DIGITS})` : `Enter digit length (1 to ${MAX_CUSTOM_DIGITS})`}
                    className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60"
                  />
                </div>

                {/* Textbox 2: Toán hạng thứ 2 tùy chọn (Số đích danh | Độ dài chữ số) */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                  <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none">
                    {tr("Chia với số tùy chọn:")}
                  </span>

                  <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 gap-0.5">
                    <button
                      type="button"
                      disabled={status === 'running'}
                      onClick={() => {
                        const modeVal: CustomOperandMode = 'exact';
                        setOperandMode(modeVal);
              operandModeRef.current = modeVal;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, modeVal);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
                        operandMode === 'exact'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {tr("Số đích danh")}
                    </button>
                    <button
                      type="button"
                      disabled={status === 'running'}
                      onClick={() => {
                        const modeVal: CustomOperandMode = 'digits';
                        setOperandMode(modeVal);
              operandModeRef.current = modeVal;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, modeVal);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
                        operandMode === 'digits'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {tr("Độ dài chữ số")}
                    </button>
                  </div>

                  {operandMode === 'exact' ? (
                    <input
                      id="div-custom-operand-exact"
                      type="text"
                      inputMode="numeric"
                      maxLength={String(MAX_CUSTOM_OPERAND).length}
                      disabled={status === 'running'}
                      value={exactDraft}
                      onFocus={(e) => e.target.select()}
                      onChange={handleExactInput}
                      onBlur={commitExact}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      aria-label={tr("Nhập số chia đích danh tùy chọn (VD: 5, 12, 25, 99...)")}
                      title={tr("Nhập số chia đích danh tùy chọn (VD: 5, 12, 25, 99...)")}
                      className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  ) : (
                    <input
                      id="div-custom-operand-digits"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      disabled={status === 'running'}
                      value={opDigitsDraft}
                      onFocus={(e) => e.target.select()}
                      onChange={handleOpDigitsInput}
                      onBlur={commitOpDigits}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      aria-label={tr("Nhập độ dài chữ số của số chia (từ 1 đến 100)")}
                      title={tr("Nhập độ dài chữ số của số chia (từ 1 đến 100)")}
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hàng tùy chọn Dãy số Siêu trí tuệ: Tùy chọn (Dãy số), Phép tính ÷/× và bộ điều khiển chi tiết */}
          <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedTopic('sequence');
                selectedTopicRef.current = 'sequence';
                if (status === 'idle' || status === 'completed') {
                  const nextQ = generateProblem('sequence');
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              title={
                isVi
                  ? 'Tùy chọn dãy số chia liên tiếp hoặc kết hợp chia nhân'
                  : 'Super-Brain division sequence challenge'
              }
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedTopic === 'sequence'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${selectedTopic === 'sequence' ? 'text-slate-950' : 'text-yellow-400'}`}
              />
              <span className="whitespace-nowrap">{tr("Tùy chọn (Dãy số)")}</span>
            </button>

            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                const nextIncludeMul =
                  selectedTopic === 'sequence' ? !sequenceIncludeMultiply : true;
                setSelectedTopic('sequence');
                selectedTopicRef.current = 'sequence';
                setSequenceIncludeMultiply(nextIncludeMul);
                sequenceIncludeMultiplyRef.current = nextIncludeMul;
                if (status === 'idle' || status === 'completed') {
                  const nextQ = generateProblem(
                    'sequence',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    sequenceCount,
                    sequenceDigitProfile,
                    nextIncludeMul
                  );
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              aria-pressed={selectedTopic === 'sequence' && sequenceIncludeMultiply}
              title={tr("Bật/tắt dãy số kết hợp cả phép chia (÷) và phép nhân (×) luôn chia hết")}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedTopic === 'sequence' && sequenceIncludeMultiply
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="whitespace-nowrap">{tr("Phép tính ÷/×")}</span>
            </button>

            {selectedTopic === 'sequence' && (
              <div className="w-full flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="div-sequence-count"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Dãy số:")}
                  </label>
                  <input
                    id="div-sequence-count"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    disabled={status === 'running'}
                    value={sequenceCountDraft}
                    onFocus={(e) => e.currentTarget.select()}
                    onMouseUp={(e) => e.preventDefault()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                      setSequenceCountDraft(cleaned);
                      const parsed = parseInt(cleaned, 10);
                      if (!Number.isNaN(parsed) && parsed >= MIN_SEQUENCE_COUNT) {
                        const clamped = Math.min(MAX_SEQUENCE_COUNT, parsed);
                        setSequenceCount(clamped);
                        sequenceCountRef.current = clamped;
                        if (status === 'idle' || status === 'completed') {
                          const nextQ = generateProblem(
                            'sequence',
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            clamped,
                            sequenceDigitProfile,
                            sequenceIncludeMultiply
                          );
                          setQuestion(nextQ);
                          questionRef.current = nextQ;
                        }
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(sequenceCountDraft, 10);
                      if (Number.isNaN(parsed) || parsed < MIN_SEQUENCE_COUNT) {
                        setSequenceCountDraft(String(sequenceCount));
                        return;
                      }
                      const clamped = Math.min(MAX_SEQUENCE_COUNT, parsed);
                      setSequenceCountDraft(String(clamped));
                      if (clamped !== sequenceCount) {
                        setSequenceCount(clamped);
                        sequenceCountRef.current = clamped;
                        if (status === 'idle' || status === 'completed') {
                          const nextQ = generateProblem(
                            'sequence',
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            clamped,
                            sequenceDigitProfile,
                            sequenceIncludeMultiply
                          );
                          setQuestion(nextQ);
                          questionRef.current = nextQ;
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    title={tr("Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)")}
                    className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60 selection:bg-yellow-400 selection:text-slate-950"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                  <label
                    htmlFor="div-sequence-digits-select"
                    className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài chữ số:")}
                  </label>
                  <select
                    id="div-sequence-digits-select"
                    disabled={status === 'running'}
                    value={sequenceDigitProfile}
                    onChange={(e) => {
                      const nextProfile = e.target.value as SequenceDigitProfile;
                      setSequenceDigitProfile(nextProfile);
                      sequenceDigitProfileRef.current = nextProfile;
                      if (status === 'idle' || status === 'completed') {
                        const nextQ = generateProblem(
                          'sequence',
                          undefined,
                          undefined,
                          undefined,
                          undefined,
                          sequenceCount,
                          nextProfile,
                          sequenceIncludeMultiply
                        );
                        setQuestion(nextQ);
                        questionRef.current = nextQ;
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-xs font-semibold text-cyan-200 cursor-pointer disabled:opacity-60"
                  >
                    <option value="2D">{tr("2D · 2 chữ số")}</option>
                    <option value="3D">{tr("3D · 3 chữ số")}</option>
                    <option value="2D3D">{tr("2D3D · 2 chữ số và 3 chữ số")}</option>
                    <option value="4D">{tr("4D · 4 chữ số")}</option>
                    <option value="3D4D">{tr("3D4D · 3 chữ số và 4 chữ số")}</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/35">
                  <label
                    htmlFor="div-sequence-display-select"
                    className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                  >
                    {tr("Hiển thị câu hỏi:")}
                  </label>
                  <select
                    id="div-sequence-display-select"
                    disabled={status === 'running'}
                    value={sequenceDisplayMode}
                    onChange={(e) => {
                      const nextDisplay = e.target.value as SequenceDisplayMode;
                      setSequenceDisplayMode(nextDisplay);
                      sequenceDisplayModeRef.current = nextDisplay;
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/40 focus:border-amber-300 focus:outline-none text-xs font-semibold text-amber-200 cursor-pointer disabled:opacity-60 max-w-[260px] sm:max-w-none"
                  >
                    <option value="flash">{tr("Chạy từng dãy số của phép tính")}</option>
                    <option value="all">{tr("Câu hỏi trên màn hình")}</option>
                  </select>
                </div>

                {sequenceDisplayMode === 'flash' && (
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-lg bg-slate-900/60 border border-slate-800 tabular-nums">
                    {(timeLimit / Math.max(1, sequenceCount)).toFixed(2)}s/{tr("số")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bảng điểm trực tiếp: hiển thị Chuỗi đúng và Chuỗi sai theo thời gian thực */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider truncate">
                {tr("Chuỗi đúng:")}
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
                {tr("Chuỗi sai:")}
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

        {/* Khu vực thi đấu 2 giai đoạn (Quan sát -> Ẩn đề Trả lời) hoặc Bảng tổng kết 10 câu */}
        <div className="w-full space-y-3">
          {status === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>{tr("Hoàn thành thử thách 10 câu!")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
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
                    {tr("Đúng")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{score}</span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5">/ {TOTAL_QUESTIONS}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    {tr("Sai")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{incorrectCount}</span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5">/ {TOTAL_QUESTIONS}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    {tr("% Độ chính xác")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">
                    {Math.round((score / TOTAL_QUESTIONS) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-500/80 block mt-0.5">
                    {score >= 8 ? (tr("Xuất sắc! 🌟")) : tr("Cần luyện thêm")}
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="max-w-xl mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{tr("Chi tiết 10 phép tính")}</span>
                    <span>{tr("Kết quả")}</span>
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
                  <span>{tr("Quay lại Luyện tập")}</span>
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
              {/* Cột trái: Thanh đếm ngược thời gian, tiến trình 10 câu & đề bài Phép chia */}
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
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                    {dynamicBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-yellow-300 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
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
                          ? `${tr("Trả lời")}: ${timeLeft}s`
                          : `${tr("Quan sát")}: ${timeLeft}s`
                        : `${timeLeft}s`}
                    </span>
                  </span>
                </div>

                {/* Thanh 10 chấm theo dõi trạng thái từng câu trong phiên thử thách */}
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
                        {tr("Chưa bắt đầu thử thách")}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tr("Bấm nút \"Bắt đầu\" để hiện câu hỏi và bắt đầu tính giờ.")}
                      </p>
                    </div>
                  ) : status === 'running' && challengePhase === 'answering' ? (
                    <div className="py-5 px-6 rounded-2xl bg-slate-900/90 border border-cyan-500/35 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                        <EyeOff className="w-5 h-5 text-cyan-400" />
                        <span>{tr("Đã hết thời gian quan sát")}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {isVi
                          ? `Hãy nhớ lại phép tính và nhập đáp án trong ${timeLeft}s`
                          : `Recall the problem and enter your answer within ${timeLeft}s`}
                      </p>
                    </div>
                  ) : (
                    <>
                      {selectedTopic === 'sequence' && question.numbers && question.numbers.length > 0 ? (
                        sequenceDisplayMode === 'flash' && status === 'running' ? (
                          <div className="w-full max-w-lg mx-auto py-2 space-y-3 select-none">
                            <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400 px-2">
                              <span className="text-yellow-300 font-bold">
                                {isVi
                                  ? `Số #${flashIndex + 1} / ${question.numbers.length}`
                                  : `Number #${flashIndex + 1} / ${question.numbers.length}`}
                              </span>
                              <span className="tabular-nums">
                                {(timeLimit / Math.max(1, question.numbers.length)).toFixed(2)}s / {tr("số")}
                              </span>
                            </div>

                            <div className="py-6 sm:py-8 px-4 rounded-2xl bg-slate-900/80 border border-yellow-500/35 flex items-center justify-center gap-3 shadow-inner overflow-x-auto">
                              {(() => {
                                const opsTail = question.operations?.slice(1) ?? [];
                                const hasMixedOps = opsTail.includes('×') && opsTail.includes('÷');
                                const activeOp = question.operations?.[flashIndex] ?? '÷';
                                const showSign = flashIndex > 0;
                                const curFormatted = formatBigIntStr(question.numbers[flashIndex] ?? '0');
                                const flashSizeClass =
                                  curFormatted.length > 26
                                    ? 'text-xl sm:text-3xl'
                                    : curFormatted.length > 14
                                    ? 'text-3xl sm:text-4xl'
                                    : 'text-5xl sm:text-6xl';
                                return (
                                  <span
                                    key={`flash-${questionIndex}-${flashIndex}`}
                                    className={`${flashSizeClass} font-black font-mono text-white tabular-nums tracking-tight animate-in zoom-in-95 fade-in duration-100 flex items-center gap-2.5 flex-wrap justify-center break-all`}
                                  >
                                    {showSign && (
                                      <span
                                        className={`font-sans ${
                                          activeOp === '×'
                                            ? 'text-emerald-400'
                                            : hasMixedOps
                                            ? 'text-cyan-400'
                                            : 'text-yellow-400'
                                        }`}
                                      >
                                        {activeOp}
                                      </span>
                                    )}
                                    <span>{curFormatted}</span>
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-100"
                                style={{
                                  width: `${Math.round(
                                    ((flashIndex + 1) / Math.max(1, question.numbers.length)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full space-y-2.5 py-1 select-none">
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                              <span className="font-semibold text-yellow-300">
                                {(() => {
                                  const opsTail = question.operations?.slice(1) ?? [];
                                  const hasMul = opsTail.includes('×');
                                  const hasDiv = opsTail.includes('÷');
                                  if (hasMul && hasDiv) {
                                    return isVi
                                      ? `Dãy phép tính (÷/×) gồm ${question.numbers.length} số:`
                                      : `Mixed (÷/×) sequence of ${question.numbers.length} numbers:`;
                                  }
                                  return isVi
                                    ? `Dãy phép chia gồm ${question.numbers.length} số:`
                                    : `Division sequence of ${question.numbers.length} numbers:`;
                                })()}
                              </span>
                              <button
                                type="button"
                                onClick={() => pronounceQuestion()}
                                className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                                  isSpeakingQuestion
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 animate-pulse'
                                    : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 border-yellow-500/40'
                                }`}
                                title={tr("Phát âm câu hỏi")}
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            {(() => {
                              const opsTail = question.operations?.slice(1) ?? [];
                              const hasMixedOps = opsTail.includes('×') && opsTail.includes('÷');
                              const totalExprLen = question.numbers.reduce(
                                (sum, n, idx) => sum + formatBigIntStr(n).length + (idx > 0 ? 3 : 0),
                                0
                              );
                              const exprSizeClass =
                                totalExprLen <= 35
                                  ? 'text-3xl sm:text-5xl font-black'
                                  : totalExprLen <= 70
                                  ? 'text-xl sm:text-2xl font-black'
                                  : totalExprLen <= 115
                                  ? 'text-sm sm:text-base font-extrabold'
                                  : 'text-xs sm:text-sm font-bold';
                              return (
                                <div className="w-full px-3 sm:px-4 py-4 sm:py-5 rounded-2xl bg-slate-900/75 border border-slate-800/90 flex items-center justify-center">
                                  <div
                                    className={`${exprSizeClass} font-mono text-white tabular-nums tracking-tight leading-relaxed text-center break-all`}
                                  >
                                    {question.numbers.map((numVal, idx) => {
                                      const op = question.operations?.[idx] ?? '÷';
                                      const isMul = idx > 0 && op === '×';
                                      return (
                                        <React.Fragment key={idx}>
                                          {idx > 0 && (
                                            <>
                                              {' '}
                                              <span
                                                className={`font-sans font-black ${
                                                  isMul
                                                    ? 'text-emerald-400'
                                                    : hasMixedOps
                                                    ? 'text-cyan-400'
                                                    : 'text-yellow-400'
                                                }`}
                                              >
                                                {isMul ? '×' : '÷'}
                                              </span>
                                              {' '}
                                            </>
                                          )}
                                          <span className="break-all">
                                            {formatBigIntStr(numVal)}
                                          </span>
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )
                      ) : useStackedFormula ? (
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
                              <span className="text-yellow-400 font-sans shrink-0">÷</span>
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
                              title={tr("Phát âm câu hỏi")}
                            >
                              <Volume2 className={`w-5 h-5 sm:w-5 sm:h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-full py-2 px-1">
                          <div
                            className={`${
                              isCustomLayout
                                ? formulaFontSize
                                : totalFormattedLen >= 11
                                ? 'text-2xl sm:text-3xl lg:text-4xl'
                                : totalFormattedLen >= 8
                                ? 'text-3xl sm:text-4xl lg:text-[2.75rem]'
                                : 'text-3xl sm:text-5xl'
                            } font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight`}
                          >
                            <span className="whitespace-nowrap">{formattedA}</span>
                            <span className="text-yellow-400 font-sans">÷</span>
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
                            title={tr("Phát âm câu hỏi")}
                          >
                            <Volume2 className={`w-5 h-5 sm:w-5 sm:h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                          </button>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                        <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{tr("Tốc độ:")}</span>
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

              {/* Cột phải: Ô nhập đáp án, bàn phím số ảo và các nút điều khiển 2 giai đoạn */}
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
                        ? tr("Bấm \"Bắt đầu thử thách\" để đếm ngược...")
                        : challengePhase === 'observing'
                        ? isVi
                          ? `Đang quan sát đề (${timeLeft}s)... Bấm "Trả lời ngay"`
                          : `Observing (${timeLeft}s)... Click "Answer Now"`
                        : isListening
                        ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn")
                        : tr("Nhập kết quả hoặc bấm phím số...")
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
                      title={tr("Xóa ô nhập")}
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
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                      {tr("Xóa")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserAnswer((p) => p.slice(0, -1))}
                      disabled={!canAnswer || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                        ? `${tr("Đang nhận diện:")} "${voiceTranscript}"`
                        : tr("🎙️ Hãy đọc to đáp án của bạn...")}
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
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
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
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>
                          {autoNextConfig.delaySec > 0
                            ? isVi
                              ? `Xem kết quả thử thách (tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)})`
                              : `View Results (auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)})`
                            : tr("Xem kết quả thử thách")}
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
                      <span>{tr("Kết quả [Gửi]")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={!canAnswer}
                    title={tr("Trả lời bằng giọng nói")}
                    className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 text-white" />
                        <span>{tr("Đang nghe...")}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-yellow-400" />
                        <span>{tr("Trả lời [Giọng nói]")}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startChallenge()}
                    title={tr("Bắt đầu câu hỏi thử thách")}
                    className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{tr("Bắt đầu")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    title={tr("Thiết lập lại thử thách")}
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
