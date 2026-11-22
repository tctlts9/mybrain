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
