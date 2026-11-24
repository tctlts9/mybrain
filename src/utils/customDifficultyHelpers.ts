import { PercentageMode } from './percentageOperations';

export type CustomOperandMode = 'exact' | 'digits';

export const MIN_CUSTOM_DIGITS = 1;
export const MAX_CUSTOM_DIGITS = 100;
export const MIN_CUSTOM_OPERAND = 1;
export const MAX_CUSTOM_OPERAND = 999999999;

export const formatBigIntStr = (val: string | number): string =>
  String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const normalizeAnswerInput = (val: string): string =>
  val
    .trim()
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '');

export const buildRandomDigitString = (digits: number, activeHard = true): string => {
  const safeDigits = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, digits));
  if (safeDigits === 1) {
    return String(Math.floor(Math.random() * 8) + 2); // 2..9
  }
  if (activeHard) {
    let s = String(Math.floor(Math.random() * 7) + 3); // 3..9
    for (let i = 1; i < safeDigits; i++) {
      s += String(Math.floor(Math.random() * 8) + 2); // 2..9
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

export const buildRandomBigIntInRange = (minVal: bigint, maxVal: bigint): bigint => {
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

export const bigIntFloorSqrt = (n: bigint): bigint => {
  if (n < 0n) return 0n;
  if (n < 2n) return n;
  let x = 1n << BigInt((n.toString(2).length + 1) >> 1);
  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
};

export const bigIntCeilSqrt = (n: bigint): bigint => {
  const s = bigIntFloorSqrt(n);
  return s * s < n ? s + 1n : s;
};

export const splitFormattedIntoBalancedLines = (
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

export const getCustomFormulaFontSize = (totalFormattedLen: number): string => {
  if (totalFormattedLen > 64) return 'text-xs sm:text-base md:text-lg lg:text-xl';
  if (totalFormattedLen > 48) return 'text-xs sm:text-sm md:text-base lg:text-xl';
  if (totalFormattedLen > 35) return 'text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
  if (totalFormattedLen > 22) return 'text-base sm:text-xl md:text-2xl lg:text-3xl';
  return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl';
};

export interface DifficultyBigQuestion {
  a: string;
  b?: string;
  answer: string;
  hintVi: string;
  hintEn: string;
  numbers?: number[];
  operations?: ('+' | '−')[];
}

export type SequenceDigitProfile = '2D' | '3D' | '2D3D' | '4D' | '3D4D';
export type SequenceDisplayMode = 'flash' | 'all';

export const MIN_SEQUENCE_COUNT = 2;
export const MAX_SEQUENCE_COUNT = 100;

const randSeqInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getSequenceDigitBounds = (digits: 2 | 3 | 4): [number, number] => {
  if (digits === 2) return [10, 99];
  if (digits === 3) return [100, 999];
  return [1000, 9999];
};

export function generateNumberSequenceQuestion(
  rawCount: number,
  profile: SequenceDigitProfile,
  includeSubtraction: boolean = false
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

  // Shuffle digit lengths first for mixed profiles so +/- validity checks never break on later reordering
  if (profile === '2D3D' || profile === '3D4D') {
    for (let i = digitLengths.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digitLengths[i], digitLengths[j]] = [digitLengths[j], digitLengths[i]];
    }
    // Ensure a 2-number mixed +/- sequence starts with the larger digit count so subtraction is always possible
    if (includeSubtraction && count === 2 && digitLengths[0] < digitLengths[1]) {
      [digitLengths[0], digitLengths[1]] = [digitLengths[1], digitLengths[0]];
    }
  }

  const numbers: number[] = [];
  const operations: ('+' | '−')[] = [];
  let runningSum = 0;
  let subCount = 0;
  let addAfterFirstCount = 0;

  for (let i = 0; i < count; i++) {
    const [minVal, maxVal] = getSequenceDigitBounds(digitLengths[i]);

    if (i === 0) {
      let firstMin = minVal;
      if (includeSubtraction) {
        const nextMin = getSequenceDigitBounds(digitLengths[1])[0];
        // Leave enough room to allow an early valid subtraction when possible
        firstMin = Math.max(minVal, Math.min(maxVal, nextMin + 1));
      }
      const firstVal = randSeqInt(firstMin, maxVal);
      numbers.push(firstVal);
      operations.push('+');
      runningSum = firstVal;
      continue;
    }

    // Keep runningSum >= 1 at every step so intermediate totals & final answer are always positive and valid
    const maxSubtractAllowed = Math.min(maxVal, runningSum - 1);
    const canSubtract = includeSubtraction && maxSubtractAllowed >= minVal;

    let op: '+' | '−' = '+';
    if (canSubtract) {
      const mustHaveSub = subCount === 0 && i >= count - 2;
      const shouldAddFirst =
        count >= 3 && i === count - 1 && addAfterFirstCount === 0 && subCount > 0;
      if (mustHaveSub) {
        op = '−';
      } else if (shouldAddFirst) {
        op = '+';
      } else {
        op = Math.random() < 0.42 ? '−' : '+';
      }
    }

    const upperBound = op === '−' ? maxSubtractAllowed : maxVal;
    let val = randSeqInt(minVal, upperBound);
    // Avoid immediate duplicate value (which would cancel +X followed by -X) when range allows
    if (upperBound > minVal) {
      for (let attempt = 0; attempt < 5 && val === numbers[i - 1]; attempt++) {
        val = randSeqInt(minVal, upperBound);
      }
    }

    numbers.push(val);
    operations.push(op);
    if (op === '−') {
      runningSum -= val;
      subCount++;
    } else {
      runningSum += val;
      addAfterFirstCount++;
    }
  }

  const profileDescVi: Record<SequenceDigitProfile, string> = {
    '2D': '2 chữ số',
    '3D': '3 chữ số',
    '2D3D': '2 & 3 chữ số',
    '4D': '4 chữ số',
    '3D4D': '3 & 4 chữ số',
  };

  return {
    a: String(numbers[0] ?? 0),
    b: String(numbers[1] ?? 0),
    numbers,
    operations,
    answer: String(runningSum),
    hintVi: includeSubtraction
      ? `Tính cộng trừ lần lượt ${count} số (${profileDescVi[profile]}) từ trái sang phải.`
      : `Cộng dồn lần lượt ${count} số (${profileDescVi[profile]}) từ trái sang phải.`,
    hintEn: includeSubtraction
      ? `Calculate sequentially (+ / −) across all ${count} numbers (${profile}).`
      : `Accumulate the sum across all ${count} numbers (${profile}) sequentially.`,
  };
}

export function generateCustomArithmeticQuestion(
  operation: 'addition' | 'subtraction' | 'division' | 'exponent' | 'square-root',
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

  if (operation === 'addition') {
    const aStr = buildRandomDigitString(safeDigits, true);
    const bStr =
      operandMode === 'digits'
        ? buildRandomDigitString(safeOperandDigits, true)
        : String(safeOperand);
    const ansStr = (BigInt(aStr) + BigInt(bStr)).toString();
    return {
      a: aStr,
      b: bStr,
      answer: ansStr,
      hintVi: `${formatBigIntStr(aStr)} + ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
      hintEn: `${formatBigIntStr(aStr)} + ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
    };
  }

  if (operation === 'subtraction') {
    let aStr = buildRandomDigitString(safeDigits, true);
    let bStr =
      operandMode === 'digits'
        ? buildRandomDigitString(safeOperandDigits, true)
        : String(safeOperand);

    if (BigInt(aStr) < BigInt(bStr)) {
      if (operandMode === 'exact' && safeDigits === bStr.length) {
        const maxVal = 10n ** BigInt(safeDigits) - 1n;
        aStr = buildRandomBigIntInRange(BigInt(bStr), maxVal).toString();
      } else {
        [aStr, bStr] = [bStr, aStr];
      }
    }

    const ansStr = (BigInt(aStr) - BigInt(bStr)).toString();
    return {
      a: aStr,
      b: bStr,
      answer: ansStr,
      hintVi: `${formatBigIntStr(aStr)} − ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
      hintEn: `${formatBigIntStr(aStr)} − ${formatBigIntStr(bStr)} = ${formatBigIntStr(ansStr)}`,
    };
  }

  if (operation === 'division') {
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

  if (operation === 'exponent') {
    const aStr = buildRandomDigitString(safeDigits, true);
    let expVal =
      operandMode === 'digits'
        ? Number(buildRandomDigitString(Math.min(2, safeOperandDigits), false))
        : safeOperand;
    const maxSafeExp = Math.max(1, Math.floor(240 / Math.max(1, aStr.length)));
    if (expVal > maxSafeExp) expVal = maxSafeExp;
    if (expVal < 1) expVal = 1;
    const ansStr = (BigInt(aStr) ** BigInt(expVal)).toString();
    return {
      a: aStr,
      b: String(expVal),
      answer: ansStr,
      hintVi: `${formatBigIntStr(aStr)}^${expVal} = ${formatBigIntStr(ansStr)}`,
      hintEn: `${formatBigIntStr(aStr)}^${expVal} = ${formatBigIntStr(ansStr)}`,
    };
  }

  // square-root
  if (operandMode === 'digits') {
    const safeRootDigits = Math.min(50, safeOperandDigits);
    const rStr = buildRandomDigitString(safeRootDigits, true);
    const rBig = BigInt(rStr);
    const aStr = (rBig * rBig).toString();
    return {
      a: aStr,
      answer: rStr,
      hintVi: `√${formatBigIntStr(aStr)} = ${formatBigIntStr(rStr)}`,
      hintEn: `√${formatBigIntStr(aStr)} = ${formatBigIntStr(rStr)}`,
    };
  }

  const mult = BigInt(Math.max(1, safeOperand));
  const minA = safeDigits === 1 ? 1n : 10n ** BigInt(safeDigits - 1);
  const maxA = 10n ** BigInt(safeDigits) - 1n;
  const minR = bigIntCeilSqrt(minA);
  const maxR = bigIntFloorSqrt(maxA);
  const minK = (minR + mult - 1n) / mult;
  const maxK = maxR / mult;

  let rBig: bigint;
  if (minK <= maxK) {
    rBig = buildRandomBigIntInRange(minK, maxK) * mult;
  } else {
    rBig = mult * BigInt(Math.floor(Math.random() * 9) + 1);
  }
  const aStr = (rBig * rBig).toString();
  const ansStr = rBig.toString();
  return {
    a: aStr,
    answer: ansStr,
    hintVi: `√${formatBigIntStr(aStr)} = ${formatBigIntStr(ansStr)}`,
    hintEn: `√${formatBigIntStr(aStr)} = ${formatBigIntStr(ansStr)}`,
  };
}

export interface CustomPercentageQuestion {
  mode: PercentageMode;
  displayVi: { text: string; accent?: boolean }[];
  displayEn: { text: string; accent?: boolean }[];
  labelVi: string;
  labelEn: string;
  spokenVi: string;
  spokenEn: string;
  answerStr: string;
  answerSuffix?: string;
  hintVi: string;
  hintEn: string;
}

const gcdNum = (a: number, b: number): number => (b === 0 ? a : gcdNum(b, a % b));

export function generateCustomPercentageQuestion(
  mode: PercentageMode,
  digits: number,
  operandMode: CustomOperandMode,
  exactPct: number,
  pctDigits: number
): CustomPercentageQuestion {
  const safeDigits = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, digits));
  const safePctDigits = Math.min(3, Math.max(1, pctDigits));
  const pctNum =
    operandMode === 'digits'
      ? safePctDigits === 1
        ? Math.floor(Math.random() * 9) + 1
        : safePctDigits === 2
        ? Math.floor(Math.random() * 89) + 11
        : Math.floor(Math.random() * 899) + 101
      : Math.min(9999, Math.max(1, exactPct));

  const step = BigInt(100 / gcdNum(pctNum, 100));
  const minBase = safeDigits === 1 ? 1n : 10n ** BigInt(safeDigits - 1);
  const maxBase = 10n ** BigInt(safeDigits) - 1n;
  const minK = (minBase + step - 1n) / step;
  const maxK = maxBase / step;

  const baseBig =
    minK <= maxK
      ? buildRandomBigIntInRange(minK, maxK) * step
      : step * BigInt(Math.floor(Math.random() * 9) + 1);
  const deltaBig = (BigInt(pctNum) * baseBig) / 100n;
  const baseFmt = formatBigIntStr(baseBig.toString());
  const deltaFmt = formatBigIntStr(deltaBig.toString());

  if (mode === 'basic') {
    const ansStr = deltaBig.toString();
    return {
      mode,
      displayVi: [{ text: `${pctNum}%`, accent: true }, { text: 'của' }, { text: baseFmt }],
      displayEn: [{ text: `${pctNum}%`, accent: true }, { text: 'of' }, { text: baseFmt }],
      labelVi: `${pctNum}% của ${baseFmt}`,
      labelEn: `${pctNum}% of ${baseFmt}`,
      spokenVi: `${pctNum} phần trăm của ${baseBig.toString()}`,
      spokenEn: `${pctNum} percent of ${baseBig.toString()}`,
      answerStr: ansStr,
      hintVi: `${pctNum}% của ${baseFmt} = ${deltaFmt}`,
      hintEn: `${pctNum}% of ${baseFmt} = ${deltaFmt}`,
    };
  }

  if (mode === 'change') {
    const isInc = pctNum > 100 ? true : Math.random() < 0.5;
    const ansBig = isInc ? baseBig + deltaBig : baseBig - deltaBig;
    const sign = isInc ? '+' : '−';
    const ansFmt = formatBigIntStr(ansBig.toString());
    return {
      mode,
      displayVi: [{ text: baseFmt }, { text: sign, accent: true }, { text: `${pctNum}%`, accent: true }],
      displayEn: [{ text: baseFmt }, { text: sign, accent: true }, { text: `${pctNum}%`, accent: true }],
      labelVi: `${baseFmt} ${sign} ${pctNum}%`,
      labelEn: `${baseFmt} ${sign} ${pctNum}%`,
      spokenVi: `${baseBig.toString()} ${isInc ? 'tăng' : 'giảm'} ${pctNum} phần trăm`,
      spokenEn: `${baseBig.toString()} ${isInc ? 'increased by' : 'decreased by'} ${pctNum} percent`,
      answerStr: ansBig.toString(),
      hintVi: `${baseFmt} ${sign} ${deltaFmt} = ${ansFmt}`,
      hintEn: `${baseFmt} ${sign} ${deltaFmt} = ${ansFmt}`,
    };
  }

  // reverse mode
  const useFindWhole = Math.random() < 0.65;
  if (useFindWhole) {
    return {
      mode,
      displayVi: [
        { text: `${pctNum}%`, accent: true },
        { text: 'của' },
        { text: '?', accent: true },
        { text: '=' },
        { text: deltaFmt },
      ],
      displayEn: [
        { text: `${pctNum}%`, accent: true },
        { text: 'of' },
        { text: '?', accent: true },
        { text: '=' },
        { text: deltaFmt },
      ],
      labelVi: `${pctNum}% của ? = ${deltaFmt}`,
      labelEn: `${pctNum}% of ? = ${deltaFmt}`,
      spokenVi: `${pctNum} phần trăm của bao nhiêu bằng ${deltaBig.toString()}`,
      spokenEn: `${pctNum} percent of what number equals ${deltaBig.toString()}`,
      answerStr: baseBig.toString(),
      hintVi: `Số gốc 100% = ${baseFmt}`,
      hintEn: `Base 100% = ${baseFmt}`,
    };
  }

  return {
    mode,
    displayVi: [
      { text: deltaFmt },
      { text: '=' },
      { text: '?%', accent: true },
      { text: 'của' },
      { text: baseFmt },
    ],
    displayEn: [
      { text: deltaFmt },
      { text: '=' },
      { text: '?%', accent: true },
      { text: 'of' },
      { text: baseFmt },
    ],
    labelVi: `${deltaFmt} = ?% của ${baseFmt}`,
    labelEn: `${deltaFmt} = ?% of ${baseFmt}`,
    spokenVi: `${deltaBig.toString()} là bao nhiêu phần trăm của ${baseBig.toString()}`,
    spokenEn: `${deltaBig.toString()} is what percent of ${baseBig.toString()}`,
    answerStr: String(pctNum),
    answerSuffix: '%',
    hintVi: `(${deltaFmt} ÷ ${baseFmt}) × 100% = ${pctNum}%`,
    hintEn: `(${deltaFmt} ÷ ${baseFmt}) × 100% = ${pctNum}%`,
  };
}
