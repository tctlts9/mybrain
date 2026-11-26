/**
 * ============================================================================
 * FILE: PercentageDifficultyChallengePage.tsx — TRANG THỬ THÁCH CẤP ĐỘ KHÓ PHẦN TRĂM (%)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN A & B).
 * 2. Quản lý thử thách 10 câu Phần trăm (%) Cấp độ Khó cho các chế độ (%) (cơ bản, ứng dụng, tìm tỷ lệ...).
 * 3. Vận hành cơ chế 2 giai đoạn: Quan sát đề (timeLimit) -> Ẩn đề & Trả lời (answerTimeLimit).
 * 4. Hỗ trợ chế độ Tùy chọn (Số gốc & Tỷ lệ % đích danh/chữ số), TTS và trả lời bằng Giọng nói hoặc Bàn phím số ảo.
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

// ============================================================================
// BỘ DỮ LIỆU TỶ LỆ % & HÀM SINH ĐỀ SỐ LỚN BIGINT TÙY CHỌN (CODE TRỰC TIẾP TRONG PAGE)
// ============================================================================
type PercentageMode = 'basic' | 'change' | 'reverse';
type CustomOperandMode = 'exact' | 'digits';

const MIN_CUSTOM_DIGITS = 1;
const MAX_CUSTOM_DIGITS = 100;
const MIN_CUSTOM_OPERAND = 1;

const formatBigIntStr = (val: string | number): string =>
  String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const normalizeAnswerInput = (val: string): string =>
  val
    .trim()
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '');

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

const getCustomFormulaFontSize = (totalFormattedLen: number): string => {
  if (totalFormattedLen > 64) return 'text-xs sm:text-base md:text-lg lg:text-xl';
  if (totalFormattedLen > 48) return 'text-xs sm:text-sm md:text-base lg:text-xl';
  if (totalFormattedLen > 35) return 'text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl';
  if (totalFormattedLen > 22) return 'text-base sm:text-xl md:text-2xl lg:text-3xl';
  return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl';
};

interface PercentageTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

interface PercentageModeMeta {
  id: PercentageMode;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  topics: PercentageTopic[];
}

interface DisplayToken {
  text: string;
  accent?: boolean;
}

interface PercentageQuestion {
  mode: PercentageMode;
  displayVi: DisplayToken[];
  displayEn: DisplayToken[];
  labelVi: string;
  labelEn: string;
  spokenVi: string;
  spokenEn: string;
  answer: number;
  answerSuffix?: string;
  hintVi: string;
  hintEn: string;
}

interface CustomPercentageQuestion {
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
  seqItems?: { value: string; op?: '+' | '−'; isPercent: boolean }[];
}

type SequenceDigitProfile = '2D' | '3D' | '2D3D' | '4D' | '3D4D';
type SequenceDisplayMode = 'flash' | 'all';

const MIN_SEQUENCE_COUNT = 2;
const MAX_SEQUENCE_COUNT = 100;

const randPctSeqInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const PERCENTAGE_META: Record<PercentageMode, PercentageModeMeta> = {
  basic: {
    id: 'basic',
    titleVi: 'Tính % Của Một Số',
    titleEn: 'Basic Percentages',
    subtitleVi: 'Mốc chuẩn 10%·25%·50%, kỹ thuật tách % và mẹo đảo ngược x% của y',
    subtitleEn: 'Benchmark 10%·25%·50%, split percentages, and the x% of y flip trick',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tính % siêu tốc', badgeEn: 'General: Fast Percentage Math' },
      { id: 'benchmarks', labelVi: 'Mốc chuẩn', labelEn: 'Benchmarks', badgeVi: 'Chuyên đề: Mốc 10% · 20% · 25% · 50% · 75%', badgeEn: 'Topic: 10% · 20% · 25% · 50% · 75%' },
      { id: 'split', labelVi: 'Tách % lẻ', labelEn: 'Split %', badgeVi: 'Chuyên đề: Tách 15% · 35% · 12% · 18% · 65%', badgeEn: 'Topic: Split 15% · 35% · 12% · 18% · 65%' },
      { id: 'flip', labelVi: 'Đảo x% ↔ y%', labelEn: 'Flip x% of y', badgeVi: 'Chuyên đề: Đảo x% của y = y% của x', badgeEn: 'Topic: Reversible x% of y = y% of x' },
    ],
  },
  change: {
    id: 'change',
    titleVi: 'Tăng / Giảm Tỷ Lệ %',
    titleEn: 'Percentage Increase & Decrease',
    subtitleVi: 'Nhẩm nhanh tăng %, giảm % và tính giá sau chiết khấu tức thì',
    subtitleEn: 'Instant mental % increase, % decrease, and real-world discount pricing',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tăng & Giảm %', badgeEn: 'General: % Increase & Decrease' },
      { id: 'increase', labelVi: 'Tăng (+%)', labelEn: 'Increase (+%)', badgeVi: 'Chuyên đề: Cộng tăng thêm % (+10% đến +50%)', badgeEn: 'Topic: Percentage Increase (+10% to +50%)' },
      { id: 'decrease', labelVi: 'Giảm (−%)', labelEn: 'Decrease (−%)', badgeVi: 'Chuyên đề: Trừ giảm bớt % (−10% đến −50%)', badgeEn: 'Topic: Percentage Decrease (−10% to −50%)' },
      { id: 'discount', labelVi: 'Chiết khấu', labelEn: 'Discounts', badgeVi: 'Chuyên đề: Tính giá sau giảm % qua phần bù', badgeEn: 'Topic: Complement Method for Discounts' },
    ],
  },
  reverse: {
    id: 'reverse',
    titleVi: 'Tìm Tỷ Lệ & Số Gốc',
    titleEn: 'Ratio & Reverse %',
    subtitleVi: 'Tìm A chiếm bao nhiêu % của B, tìm số gốc 100% và tỷ lệ tăng trưởng',
    subtitleEn: 'Find what % A is of B, recover 100% base value, and compute % growth',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tỷ lệ & Tìm số gốc', badgeEn: 'General: Ratios & Reverse %' },
      { id: 'findRate', labelVi: 'Tìm tỷ lệ ?%', labelEn: 'Find ?%', badgeVi: 'Chuyên đề: A bằng bao nhiêu % của B', badgeEn: 'Topic: A is ?% of B' },
      { id: 'findWhole', labelVi: 'Tìm số gốc', labelEn: 'Find Whole', badgeVi: 'Chuyên đề: Biết P% của ? ⇒ Tìm 100%', badgeEn: 'Topic: Recover 100% from P%' },
      { id: 'growthRate', labelVi: 'Tăng trưởng', labelEn: 'Growth %', badgeVi: 'Chuyên đề: Tính % tăng từ A lên B', badgeEn: 'Topic: Percentage Growth A → B' },
    ],
  },
};

const pctRandInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pctGcd = (a: number, b: number): number => (b === 0 ? a : pctGcd(b, a % b));

function generatePercentageQuestion(
  mode: PercentageMode,
  topicId: string,
  difficulty: 'normal' | 'hard' = 'normal'
): PercentageQuestion {
  const isHard = difficulty === 'hard';
  if (mode === 'basic') {
    let sub = topicId;
    if (sub === 'general') {
      const pool = isHard ? ['split', 'flip', 'benchmarks'] : ['benchmarks', 'split', 'flip'];
      sub = pool[pctRandInt(0, pool.length - 1)];
    }
    if (sub === 'benchmarks') {
      const choices = isHard ? [25, 75, 20, 50] : [10, 20, 25, 50, 75];
      const pct = choices[pctRandInt(0, choices.length - 1)];
      let base = 100;
      if (pct === 10) base = pctRandInt(12, 98) * 10;
      else if (pct === 20) base = (isHard ? pctRandInt(42, 248) : pctRandInt(8, 95)) * 10;
      else if (pct === 25) base = (isHard ? pctRandInt(45, 245) : pctRandInt(10, 95)) * 4;
      else if (pct === 50) base = (isHard ? pctRandInt(125, 985) : pctRandInt(25, 450)) * 2;
      else base = (isHard ? pctRandInt(32, 185) : pctRandInt(8, 75)) * 4;
      const ans = (pct * base) / 100;
      const hintMapVi: Record<number, string> = {
        10: `10% = ${base.toLocaleString()} ÷ 10 = ${ans.toLocaleString()}`,
        20: `20% = ${base.toLocaleString()} ÷ 5 (hoặc 10% × 2) = ${ans.toLocaleString()}`,
        25: `25% = ${base.toLocaleString()} ÷ 4 = ${ans.toLocaleString()}`,
        50: `50% = ${base.toLocaleString()} ÷ 2 = ${ans.toLocaleString()}`,
        75: `75% = 3 × (${base.toLocaleString()} ÷ 4) = 3 × ${(base / 4).toLocaleString()} = ${ans.toLocaleString()}`,
      };
      const hintMapEn: Record<number, string> = {
        10: `10% = ${base.toLocaleString()} ÷ 10 = ${ans.toLocaleString()}`,
        20: `20% = ${base.toLocaleString()} ÷ 5 (or 10% × 2) = ${ans.toLocaleString()}`,
        25: `25% = ${base.toLocaleString()} ÷ 4 = ${ans.toLocaleString()}`,
        50: `50% = ${base.toLocaleString()} ÷ 2 = ${ans.toLocaleString()}`,
        75: `75% = 3 × (${base.toLocaleString()} ÷ 4) = 3 × ${(base / 4).toLocaleString()} = ${ans.toLocaleString()}`,
      };
      return {
        mode,
        displayVi: [{ text: `${pct}%`, accent: true }, { text: 'của' }, { text: base.toLocaleString() }],
        displayEn: [{ text: `${pct}%`, accent: true }, { text: 'of' }, { text: base.toLocaleString() }],
        labelVi: `${pct}% của ${base.toLocaleString()}`,
        labelEn: `${pct}% of ${base.toLocaleString()}`,
        spokenVi: `${pct} phần trăm của ${base}`,
        spokenEn: `${pct} percent of ${base}`,
        answer: ans,
        hintVi: hintMapVi[pct],
        hintEn: hintMapEn[pct],
      };
    }
    if (sub === 'flip') {
      const anchors = isHard ? [25, 75, 20] : [50, 25, 20, 75];
      const y = anchors[pctRandInt(0, anchors.length - 1)];
      let x = 24;
      if (y === 50) x = pctRandInt(7, 49) * 2;
      else if (y === 25) x = (isHard ? pctRandInt(24, 96) : pctRandInt(6, 36)) * 4;
      else if (y === 20) x = (isHard ? pctRandInt(22, 95) : pctRandInt(5, 39)) * 5;
      else x = (isHard ? pctRandInt(16, 68) : pctRandInt(4, 24)) * 4;
      const ans = (x * y) / 100;
      const divLabel = y === 50 ? '÷ 2' : y === 25 ? '÷ 4' : y === 20 ? '÷ 5' : '× 3 ÷ 4';
      return {
        mode,
        displayVi: [{ text: `${x}%`, accent: true }, { text: 'của' }, { text: String(y) }],
        displayEn: [{ text: `${x}%`, accent: true }, { text: 'of' }, { text: String(y) }],
        labelVi: `${x}% của ${y}`,
        labelEn: `${x}% of ${y}`,
        spokenVi: `${x} phần trăm của ${y}`,
        spokenEn: `${x} percent of ${y}`,
        answer: ans,
        hintVi: `Đảo ngược: ${x}% của ${y} = ${y}% của ${x} = ${x} ${divLabel} = ${ans}`,
        hintEn: `Flip trick: ${x}% of ${y} = ${y}% of ${x} = ${x} ${divLabel} = ${ans}`,
      };
    }
    const splitChoices = isHard ? [35, 45, 65, 85, 12, 18, 24, 36] : [15, 35, 45, 65, 12, 18];
    const pct = splitChoices[pctRandInt(0, splitChoices.length - 1)];
    const isFiveStep = pct % 5 === 0;
    const base = isFiveStep ? (isHard ? pctRandInt(16, 78) : pctRandInt(4, 42)) * 20 : (isHard ? pctRandInt(9, 44) : pctRandInt(3, 24)) * 50;
    const ans = (pct * base) / 100;
    const p10 = base / 10;
    let hintVi = '';
    let hintEn = '';
    if (pct === 15) {
      hintVi = `Tách 15% = 10% (${p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
      hintEn = `Split 15% = 10% (${p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
    } else if (pct === 35) {
      hintVi = `Tách 35% = 3×10% (${3 * p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
      hintEn = `Split 35% = 3×10% (${3 * p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
    } else if (pct === 45) {
      hintVi = `Mẹo 45% = 50% (${base / 2}) − 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
      hintEn = `45% trick = 50% (${base / 2}) − 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
    } else if (pct === 65) {
      hintVi = `Tách 65% = 50% (${base / 2}) + 10% (${p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
      hintEn = `Split 65% = 50% (${base / 2}) + 10% (${p10}) + 5% (${p10 / 2}) = ${ans.toLocaleString()}`;
    } else if (pct === 85) {
      hintVi = `Mẹo 85% = 100% (${base.toLocaleString()}) − 15% (${(15 * base) / 100}) = ${ans.toLocaleString()}`;
      hintEn = `85% trick = 100% (${base.toLocaleString()}) − 15% (${(15 * base) / 100}) = ${ans.toLocaleString()}`;
    } else if (pct === 24) {
      hintVi = `Mẹo 24% = 25% (${base / 4}) − 1% (${base / 100}) = ${ans.toLocaleString()}`;
      hintEn = `24% trick = 25% (${base / 4}) − 1% (${base / 100}) = ${ans.toLocaleString()}`;
    } else if (pct === 36) {
      hintVi = `Tách 36% = 25% (${base / 4}) + 10% (${p10}) + 1% (${base / 100}) = ${ans.toLocaleString()}`;
      hintEn = `Split 36% = 25% (${base / 4}) + 10% (${p10}) + 1% (${base / 100}) = ${ans.toLocaleString()}`;
    } else if (pct === 12) {
      const p1 = base / 100;
      hintVi = `Tách 12% = 10% (${p10}) + 2% (${2 * p1}) = ${ans.toLocaleString()}`;
      hintEn = `Split 12% = 10% (${p10}) + 2% (${2 * p1}) = ${ans.toLocaleString()}`;
    } else {
      const p1 = base / 100;
      hintVi = `Mẹo 18% = 20% (${2 * p10}) − 2% (${2 * p1}) = ${ans.toLocaleString()}`;
      hintEn = `18% trick = 20% (${2 * p10}) − 2% (${2 * p1}) = ${ans.toLocaleString()}`;
    }
    return {
      mode,
      displayVi: [{ text: `${pct}%`, accent: true }, { text: 'của' }, { text: base.toLocaleString() }],
      displayEn: [{ text: `${pct}%`, accent: true }, { text: 'of' }, { text: base.toLocaleString() }],
      labelVi: `${pct}% của ${base.toLocaleString()}`,
      labelEn: `${pct}% of ${base.toLocaleString()}`,
      spokenVi: `${pct} phần trăm của ${base}`,
      spokenEn: `${pct} percent of ${base}`,
      answer: ans,
      hintVi,
      hintEn,
    };
  }
  if (mode === 'change') {
    let sub = topicId;
    if (sub === 'general') {
      const pool = ['increase', 'decrease', 'discount'];
      sub = pool[pctRandInt(0, pool.length - 1)];
    }
    if (sub === 'discount') {
      const prices = isHard
        ? [480, 640, 720, 840, 960, 1200, 1500, 1800, 2400, 3200, 3600, 4800]
        : [200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000];
      const pcts = isHard ? [15, 35, 45, 65] : [15, 20, 25, 30, 40];
      let price = prices[pctRandInt(0, prices.length - 1)];
      const pct = pcts[pctRandInt(0, pcts.length - 1)];
      if (pct === 15 && price === 250) price = 400;
      const delta = (price * pct) / 100;
      const ans = price - delta;
      return {
        mode,
        displayVi: [{ text: price.toLocaleString() }, { text: '−', accent: true }, { text: `${pct}%`, accent: true }],
        displayEn: [{ text: price.toLocaleString() }, { text: '−', accent: true }, { text: `${pct}%`, accent: true }],
        labelVi: `${price.toLocaleString()} − ${pct}%`,
        labelEn: `${price.toLocaleString()} − ${pct}%`,
        spokenVi: `${price} giảm ${pct} phần trăm`,
        spokenEn: `${price} decreased by ${pct} percent`,
        answer: ans,
        hintVi: `Giảm ${pct}% tức còn ${100 - pct}%: ${price.toLocaleString()} − ${delta.toLocaleString()} = ${ans.toLocaleString()}`,
        hintEn: `${pct}% off leaves ${100 - pct}%: ${price.toLocaleString()} − ${delta.toLocaleString()} = ${ans.toLocaleString()}`,
      };
    }
    const isInc = sub === 'increase';
    const pctChoices = isHard ? [15, 25, 35, 45, 65, 75] : [10, 15, 20, 25, 30, 50];
    const pct = pctChoices[pctRandInt(0, pctChoices.length - 1)];
    const step = 100 / pctGcd(pct, 100);
    const base = isHard
      ? step * pctRandInt(16, Math.min(90, Math.floor(2400 / step)))
      : step * pctRandInt(4, Math.min(45, Math.floor(900 / step)));
    const delta = (base * pct) / 100;
    const ans = isInc ? base + delta : base - delta;
    const sign = isInc ? '+' : '−';
    return {
      mode,
      displayVi: [{ text: base.toLocaleString() }, { text: sign, accent: true }, { text: `${pct}%`, accent: true }],
      displayEn: [{ text: base.toLocaleString() }, { text: sign, accent: true }, { text: `${pct}%`, accent: true }],
      labelVi: `${base.toLocaleString()} ${sign} ${pct}%`,
      labelEn: `${base.toLocaleString()} ${sign} ${pct}%`,
      spokenVi: `${base} ${isInc ? 'tăng' : 'giảm'} ${pct} phần trăm`,
      spokenEn: `${base} ${isInc ? 'increased by' : 'decreased by'} ${pct} percent`,
      answer: ans,
      hintVi: `${pct}% của ${base.toLocaleString()} = ${delta.toLocaleString()} ⇒ ${base.toLocaleString()} ${sign} ${delta.toLocaleString()} = ${ans.toLocaleString()}`,
      hintEn: `${pct}% of ${base.toLocaleString()} = ${delta.toLocaleString()} ⇒ ${base.toLocaleString()} ${sign} ${delta.toLocaleString()} = ${ans.toLocaleString()}`,
    };
  }
  let sub = topicId;
  if (sub === 'general') {
    const pool = ['findRate', 'findWhole', 'growthRate'];
    sub = pool[pctRandInt(0, pool.length - 1)];
  }
  if (sub === 'findRate') {
    const pcts = isHard ? [12, 15, 18, 24, 35, 45, 65, 75, 85] : [5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80];
    const pct = pcts[pctRandInt(0, pcts.length - 1)];
    const step = 100 / pctGcd(pct, 100);
    const whole = isHard
      ? step * pctRandInt(6, Math.min(45, Math.floor(2000 / step)))
      : step * pctRandInt(2, Math.min(25, Math.floor(800 / step)));
    const part = (pct * whole) / 100;
    return {
      mode,
      displayVi: [{ text: part.toLocaleString() }, { text: '=' }, { text: '?%', accent: true }, { text: 'của' }, { text: whole.toLocaleString() }],
      displayEn: [{ text: part.toLocaleString() }, { text: '=' }, { text: '?%', accent: true }, { text: 'of' }, { text: whole.toLocaleString() }],
      labelVi: `${part.toLocaleString()} = ?% của ${whole.toLocaleString()}`,
      labelEn: `${part.toLocaleString()} = ?% of ${whole.toLocaleString()}`,
      spokenVi: `${part} là bao nhiêu phần trăm của ${whole}`,
      spokenEn: `${part} is what percent of ${whole}`,
      answer: pct,
      answerSuffix: '%',
      hintVi: `Rút gọn phân số (${part}/${whole}) × 100% = ${pct}%`,
      hintEn: `Simplify (${part}/${whole}) × 100% = ${pct}%`,
    };
  }
  if (sub === 'growthRate') {
    const pcts = isHard ? [15, 25, 35, 45, 65, 75, 80, 125] : [10, 20, 25, 40, 50, 75, 100];
    const pct = pcts[pctRandInt(0, pcts.length - 1)];
    const step = 100 / pctGcd(pct, 100);
    const base = isHard
      ? step * pctRandInt(8, Math.min(60, Math.floor(1800 / step)))
      : step * pctRandInt(3, Math.min(30, Math.floor(600 / step)));
    const delta = (base * pct) / 100;
    const next = base + delta;
    return {
      mode,
      displayVi: [{ text: base.toLocaleString() }, { text: '→', accent: true }, { text: next.toLocaleString() }, { text: '(+?%)', accent: true }],
      displayEn: [{ text: base.toLocaleString() }, { text: '→', accent: true }, { text: next.toLocaleString() }, { text: '(+?%)', accent: true }],
      labelVi: `${base.toLocaleString()} → ${next.toLocaleString()} (+?%)`,
      labelEn: `${base.toLocaleString()} → ${next.toLocaleString()} (+?%)`,
      spokenVi: `Từ ${base} tăng lên ${next} là tăng bao nhiêu phần trăm`,
      spokenEn: `From ${base} to ${next} is what percent increase`,
      answer: pct,
      answerSuffix: '%',
      hintVi: `Mức tăng = ${next} − ${base} = ${delta}. Tỷ lệ = (${delta} ÷ ${base}) × 100% = ${pct}%`,
      hintEn: `Change = ${next} − ${base} = ${delta}. Rate = (${delta} ÷ ${base}) × 100% = ${pct}%`,
    };
  }
  const pcts = isHard ? [15, 25, 35, 45, 65, 75, 85] : [10, 20, 25, 30, 40, 50, 60, 75, 80];
  const pct = pcts[pctRandInt(0, pcts.length - 1)];
  const step = 100 / pctGcd(pct, 100);
  const whole = isHard
    ? step * pctRandInt(10, Math.min(55, Math.floor(2400 / step)))
    : step * pctRandInt(3, Math.min(28, Math.floor(900 / step)));
  const part = (pct * whole) / 100;
  return {
    mode,
    displayVi: [{ text: `${pct}%`, accent: true }, { text: 'của' }, { text: '?', accent: true }, { text: '=' }, { text: part.toLocaleString() }],
    displayEn: [{ text: `${pct}%`, accent: true }, { text: 'of' }, { text: '?', accent: true }, { text: '=' }, { text: part.toLocaleString() }],
    labelVi: `${pct}% của ? = ${part.toLocaleString()}`,
    labelEn: `${pct}% of ? = ${part.toLocaleString()}`,
    spokenVi: `${pct} phần trăm của bao nhiêu bằng ${part}`,
    spokenEn: `${pct} percent of what number equals ${part}`,
    answer: whole,
    hintVi: `Số gốc 100% = (${part} ÷ ${pct}) × 100 = ${whole.toLocaleString()}`,
    hintEn: `Base 100% = (${part} ÷ ${pct}) × 100 = ${whole.toLocaleString()}`,
  };
}

function generateCustomPercentageQuestion(
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

  const step = BigInt(100 / pctGcd(pctNum, 100));
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
    return {
      mode,
      displayVi: [{ text: `${pctNum}%`, accent: true }, { text: 'của' }, { text: baseFmt }],
      displayEn: [{ text: `${pctNum}%`, accent: true }, { text: 'of' }, { text: baseFmt }],
      labelVi: `${pctNum}% của ${baseFmt}`,
      labelEn: `${pctNum}% of ${baseFmt}`,
      spokenVi: `${pctNum} phần trăm của ${baseBig.toString()}`,
      spokenEn: `${pctNum} percent of ${baseBig.toString()}`,
      answerStr: deltaBig.toString(),
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

  const useFindWhole = Math.random() < 0.65;
  if (useFindWhole) {
    return {
      mode,
      displayVi: [{ text: `${pctNum}%`, accent: true }, { text: 'của' }, { text: '?', accent: true }, { text: '=' }, { text: deltaFmt }],
      displayEn: [{ text: `${pctNum}%`, accent: true }, { text: 'of' }, { text: '?', accent: true }, { text: '=' }, { text: deltaFmt }],
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
    displayVi: [{ text: deltaFmt }, { text: '=' }, { text: '?%', accent: true }, { text: 'của' }, { text: baseFmt }],
    displayEn: [{ text: deltaFmt }, { text: '=' }, { text: '?%', accent: true }, { text: 'of' }, { text: baseFmt }],
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

function generatePercentageSequenceQuestion(
  mode: PercentageMode,
  rawCount: number,
  profile: SequenceDigitProfile,
  includeDecrease: boolean = false
): CustomPercentageQuestion {
  const count = Math.min(MAX_SEQUENCE_COUNT, Math.max(MIN_SEQUENCE_COUNT, rawCount));
  const initialDigits: 2 | 3 | 4 =
    profile === '2D'
      ? 2
      : profile === '3D'
      ? 3
      : profile === '4D'
      ? 4
      : profile === '2D3D'
      ? Math.random() < 0.5
        ? 2
        : 3
      : Math.random() < 0.5
      ? 3
      : 4;

  const startMin = initialDigits === 2 ? 20 : initialDigits === 3 ? 100 : 1000;
  const startMax = initialDigits === 2 ? 99 : initialDigits === 3 ? 999 : 9999;
  const startStep = initialDigits === 2 ? 20 : 100;
  const minMult = Math.ceil(startMin / startStep);
  const maxMult = Math.floor(startMax / startStep);
  const startVal = randPctSeqInt(minMult, Math.max(minMult, maxMult)) * startStep;

  const seqItems: { value: string; op?: '+' | '−'; isPercent: boolean }[] = [
    { value: String(startVal), isPercent: false },
  ];

  let runningBig = BigInt(startVal);
  let decCount = 0;
  let incAfterFirst = 0;
  let prevKey = '';

  const primaryPcts = [10, 20, 25, 50, 5, 15, 30, 40, 60, 75, 80];
  const fallbackPcts = [100, 200, 300, 400];

  for (let i = 1; i < count; i++) {
    const candidates: { op: '+' | '−'; pct: number; nextVal: bigint; cleanMod20: boolean }[] = [];

    const collect = (pctList: number[], allowOp: '+' | '−') => {
      for (const pct of pctList) {
        if (allowOp === '−' && pct >= 100) continue;
        if ((runningBig * BigInt(pct)) % 100n !== 0n) continue;
        const delta = (runningBig * BigInt(pct)) / 100n;
        const nextVal = allowOp === '−' ? runningBig - delta : runningBig + delta;
        if (nextVal < 20n) continue;
        candidates.push({
          op: allowOp,
          pct,
          nextVal,
          cleanMod20: nextVal % 20n === 0n,
        });
      }
    };

    const wantDec =
      includeDecrease &&
      ((decCount === 0 && i >= count - 2) ||
        !(count >= 3 && i === count - 1 && incAfterFirst === 0 && decCount > 0) &&
          Math.random() < 0.42);

    if (wantDec) {
      collect(primaryPcts, '−');
      if (candidates.length === 0) collect(primaryPcts, '+');
    } else {
      collect(primaryPcts, '+');
      if (candidates.length === 0 && includeDecrease) collect(primaryPcts, '−');
    }

    let pool = candidates.filter((c) => c.cleanMod20);
    if (pool.length === 0) pool = candidates;
    if (pool.length === 0) {
      collect(fallbackPcts, '+');
      pool = candidates.filter((c) => c.cleanMod20);
      if (pool.length === 0) pool = candidates;
    }

    const nonRepeat = pool.filter((c) => `${c.op}${c.pct}` !== prevKey);
    const finalPool = nonRepeat.length > 0 ? nonRepeat : pool;
    const picked = finalPool[randPctSeqInt(0, finalPool.length - 1)] ?? {
      op: '+' as const,
      pct: 100,
      nextVal: runningBig * 2n,
      cleanMod20: true,
    };

    seqItems.push({
      value: String(picked.pct),
      op: picked.op,
      isPercent: true,
    });
    runningBig = picked.nextVal;
    prevKey = `${picked.op}${picked.pct}`;
    if (picked.op === '−') decCount++;
    else incAfterFirst++;
  }

  const exprParts = seqItems.map((it, idx) =>
    idx === 0
      ? formatBigIntStr(it.value)
      : `${it.op ?? '+'} ${it.value}%`
  );
  const fullExpr = exprParts.join(' ');
  const shortExpr =
    seqItems.length > 5
      ? `${formatBigIntStr(seqItems[0].value)} ${seqItems[1].op ?? '+'} ${seqItems[1].value}% … (${seqItems.length} bước)`
      : fullExpr;
  const shortExprEn =
    seqItems.length > 5
      ? `${formatBigIntStr(seqItems[0].value)} ${seqItems[1].op ?? '+'} ${seqItems[1].value}% … (${seqItems.length} steps)`
      : fullExpr;

  const spokenVi = seqItems
    .map((it, idx) =>
      idx === 0
        ? it.value
        : `${it.op === '−' ? 'giảm' : 'tăng'} ${it.value} phần trăm`
    )
    .join(' ');
  const spokenEn = seqItems
    .map((it, idx) =>
      idx === 0
        ? it.value
        : `${it.op === '−' ? 'decrease by' : 'increase by'} ${it.value} percent`
    )
    .join(' ');

  const profileDescVi: Record<SequenceDigitProfile, string> = {
    '2D': '2 chữ số',
    '3D': '3 chữ số',
    '2D3D': '2 & 3 chữ số',
    '4D': '4 chữ số',
    '3D4D': '3 & 4 chữ số',
  };

  return {
    mode,
    displayVi: seqItems.map((it, idx) => ({
      text: idx === 0 ? formatBigIntStr(it.value) : `${it.op ?? '+'} ${it.value}%`,
      accent: it.isPercent,
    })),
    displayEn: seqItems.map((it, idx) => ({
      text: idx === 0 ? formatBigIntStr(it.value) : `${it.op ?? '+'} ${it.value}%`,
      accent: it.isPercent,
    })),
    labelVi: shortExpr,
    labelEn: shortExprEn,
    spokenVi,
    spokenEn,
    answerStr: runningBig.toString(),
    hintVi: includeDecrease
      ? `Tính tăng/giảm phần trăm lần lượt ${count} bước (khởi đầu ${profileDescVi[profile]}) ⇒ ${formatBigIntStr(runningBig.toString())}`
      : `Tính tăng phần trăm liên tiếp ${count} bước (khởi đầu ${profileDescVi[profile]}) ⇒ ${formatBigIntStr(runningBig.toString())}`,
    hintEn: includeDecrease
      ? `Apply sequential (+ / − %) changes across ${count} steps (${profile}) ⇒ ${formatBigIntStr(runningBig.toString())}`
      : `Apply sequential (+%) increases across ${count} steps (${profile}) ⇒ ${formatBigIntStr(runningBig.toString())}`,
    seqItems,
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

const getPercentageDifficultyChallengeAutoNextPageKey = (
  mode: PercentageMode
): MentalMathAutoNextPageKey =>
  mode === 'basic'
    ? 'PercentageDifficultyChallengePage_basic'
    : mode === 'change'
    ? 'PercentageDifficultyChallengePage_change'
    : 'PercentageDifficultyChallengePage_reverse';

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

type BigPercentageQuestion = Omit<PercentageQuestion, 'answer'> & {
  answerStr: string;
  seqItems?: { value: string; op?: '+' | '−'; isPercent: boolean }[];
};

const toBigPctQuestion = (q: PercentageQuestion): BigPercentageQuestion => ({
  ...q,
  answerStr: String(q.answer),
});

const fromCustomPctQuestion = (q: CustomPercentageQuestion): BigPercentageQuestion => ({
  mode: q.mode,
  displayVi: q.displayVi,
  displayEn: q.displayEn,
  labelVi: q.labelVi,
  labelEn: q.labelEn,
  spokenVi: q.spokenVi,
  spokenEn: q.spokenEn,
  answerStr: q.answerStr,
  answerSuffix: q.answerSuffix,
  hintVi: q.hintVi,
  hintEn: q.hintEn,
  seqItems: q.seqItems,
});

interface PercentageDifficultyChallengePageProps {
  mode: PercentageMode;
  initialTopic?: string;
  onBack: () => void;
}

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';

const TOTAL_QUESTIONS = 10;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  benchmarks: '📐',
  split: '⚡',
  flip: '🔄',
  increase: '📈',
  decrease: '📉',
  discount: '🏷️',
  findRate: '🔍',
  findWhole: '🧩',
  growthRate: '🚀',
};

interface HistoryItem {
  qIndex: number;
  label: string;
  userAnswer: string;
  correctAnswerText: string;
  isCorrect: boolean;
}

// ============================================================================
// PHẦN C: COMPONENT CHÍNH TRANG THỬ THÁCH CẤP ĐỘ KHÓ PHẦN TRĂM (10 CÂU)
// ============================================================================
export const PercentageDifficultyChallengePage: React.FC<PercentageDifficultyChallengePageProps> = ({
  mode,
  initialTopic = 'general',
  onBack,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const autoNextPageKey = getPercentageDifficultyChallengeAutoNextPageKey(mode);
  const autoNextConfig = useMentalMathAutoNextConfig(autoNextPageKey);
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible(autoNextPageKey);
  const meta = PERCENTAGE_META[mode];
  const hardMode = true;
  const difficulty = hardMode ? 'hard' : 'normal';
  // Trạng thái chuyên đề & cấu hình Tùy chọn BigInt (độ dài số gốc & tỷ lệ % đích danh hoặc số chữ số %)
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [operandMode, setOperandMode] = useState<CustomOperandMode>('exact');
  const [exactOperand, setExactOperand] = useState<number>(25);
  const [operandDigits, setOperandDigits] = useState<number>(2);
  const [digitsDraft, setDigitsDraft] = useState<string>(String(customDigits));
  const [exactDraft, setExactDraft] = useState<string>(String(exactOperand));
  const [opDigitsDraft, setOpDigitsDraft] = useState<string>(String(operandDigits));

  // State cấu hình chế độ Dãy số % Siêu trí tuệ (Tính % liên tiếp + / - %)
  const [sequenceCount, setSequenceCount] = useState<number>(5);
  const [sequenceDigitProfile, setSequenceDigitProfile] = useState<SequenceDigitProfile>('3D');
  const [sequenceDisplayMode, setSequenceDisplayMode] = useState<SequenceDisplayMode>('flash');
  const [sequenceIncludeDecrease, setSequenceIncludeDecrease] = useState<boolean>(false);
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
    const clamped = Math.min(9999, Math.max(MIN_CUSTOM_OPERAND, val));
              setExactOperand(clamped);
              exactOperandRef.current = clamped;
              if (status === 'idle' || status === 'completed') {
                const nextQ = generateProblem('custom', undefined, 'exact', clamped);
                setQuestion(nextQ);
                questionRef.current = nextQ;
              }
  };

  const handleExactInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, String(9999).length);
    setExactDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_OPERAND) {
        applyExactOperandChange(Math.min(9999, Math.max(MIN_CUSTOM_OPERAND, parsed)));
      }
    }
  };

  const commitExact = () => {
    const parsed = parseInt(exactDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_OPERAND) {
      setExactDraft(String(exactOperand));
      return;
    }
    const clamped = Math.min(9999, Math.max(MIN_CUSTOM_OPERAND, parsed));
    setExactDraft(String(clamped));
    if (clamped !== exactOperand) {
      applyExactOperandChange(clamped);
    }
  };

  const applyOperandDigitsChange = (val: number) => {
    const clamped = Math.min(3, Math.max(MIN_CUSTOM_DIGITS, val));
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
        applyOperandDigitsChange(Math.min(3, Math.max(MIN_CUSTOM_DIGITS, parsed)));
      }
    }
  };

  const commitOpDigits = () => {
    const parsed = parseInt(opDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setOpDigitsDraft(String(operandDigits));
      return;
    }
    const clamped = Math.min(3, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setOpDigitsDraft(String(clamped));
    if (clamped !== operandDigits) {
      applyOperandDigitsChange(clamped);
    }
  };

  // Cấu hình thời gian 2 giai đoạn: Quan sát (timeLimit) & Trả lời (answerTimeLimit)
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

  // Trạng thái ván thử thách 10 câu, pha (idle / observing / answering) & điểm số
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<BigPercentageQuestion>(() =>
    toBigPctQuestion(generatePercentageQuestion(mode, initialTopic, difficulty))
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
  const questionRef = useRef<BigPercentageQuestion>(question);
  const statusRef = useRef<GameStatus>(status);
  const questionIndexRef = useRef<number>(questionIndex);
  const selectedTopicRef = useRef<string>(selectedTopic);
  const customDigitsRef = useRef<number>(customDigits);
  const operandModeRef = useRef<CustomOperandMode>(operandMode);
  const exactOperandRef = useRef<number>(exactOperand);
  const operandDigitsRef = useRef<number>(operandDigits);
  const sequenceCountRef = useRef<number>(sequenceCount);
  const sequenceDigitProfileRef = useRef<SequenceDigitProfile>(sequenceDigitProfile);
  const sequenceDisplayModeRef = useRef<SequenceDisplayMode>(sequenceDisplayMode);
  const sequenceIncludeDecreaseRef = useRef<boolean>(sequenceIncludeDecrease);
  const timeLimitRef = useRef<TimeLimit>(timeLimit);
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  const advanceQuestionRef = useRef<
    (nextIdx: number, topicId: string, limit: TimeLimit, answerLimitOverride?: AnswerTimeLimit) => void
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
    sequenceIncludeDecreaseRef.current = sequenceIncludeDecrease;
  }, [sequenceIncludeDecrease]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  useEffect(() => {
    answerTimeLimitRef.current = answerTimeLimit;
  }, [answerTimeLimit]);

  useEffect(() => {
    challengePhaseRef.current = challengePhase;
  }, [challengePhase]);

  // Hàm sinh câu hỏi Phần trăm mới theo chuyên đề chuẩn, Tùy chọn BigInt hoặc Dãy số % Siêu trí tuệ
  const generateProblem = useCallback(
    (
      topicOverride?: string,
      digitsOverride?: number,
      modeOverride?: CustomOperandMode,
      exactOverride?: number,
      opDigitsOverride?: number,
      seqCountOverride?: number,
      seqProfileOverride?: SequenceDigitProfile,
      seqIncludeDecOverride?: boolean
    ): BigPercentageQuestion => {
      const activeTopic = topicOverride ?? selectedTopicRef.current;
      if (activeTopic === 'custom') {
        return fromCustomPctQuestion(
          generateCustomPercentageQuestion(
            mode,
            digitsOverride ?? customDigitsRef.current,
            modeOverride ?? operandModeRef.current,
            exactOverride ?? exactOperandRef.current,
            opDigitsOverride ?? operandDigitsRef.current
          )
        );
      }
      if (activeTopic === 'sequence') {
        return fromCustomPctQuestion(
          generatePercentageSequenceQuestion(
            mode,
            seqCountOverride ?? sequenceCountRef.current,
            seqProfileOverride ?? sequenceDigitProfileRef.current,
            seqIncludeDecOverride ?? sequenceIncludeDecreaseRef.current
          )
        );
      }
      return toBigPctQuestion(generatePercentageQuestion(mode, activeTopic, difficulty));
    },
    [difficulty, mode]
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

  const formatAnswerText = (q: BigPercentageQuestion) =>
    `${formatBigIntStr(q.answerStr)}${q.answerSuffix || ''}`;

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = isVi ? questionRef.current.spokenVi : questionRef.current.spokenEn;
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

  // Chuyển sang giai đoạn 2 (ẩn đề & đếm ngược thời gian trả lời), tự chấm hết giờ nếu về 0
  const beginAnsweringPhase = useCallback(
    (
      idxOverride?: number,
      qOverride?: BigPercentageQuestion,
      topicOverride?: string,
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
              label: isVi ? activeQ.labelVi : activeQ.labelEn,
              userAnswer: tr("Hết giờ"),
              correctAnswerText: formatAnswerText(activeQ),
              isCorrect: false,
            },
          ]);
          if (isSpeakerEnabled) {
            triggerAnnouncement(false, activeQ.answerStr);
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

  // Chuyển sang câu hỏi tiếp theo trong chuỗi 10 câu và bắt đầu đếm ngược giai đoạn Quan sát
  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      topicId: string,
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
      const seqItems = nextQ.seqItems;
      const shouldFlashSeq =
        topicId === 'sequence' &&
        Boolean(seqItems && seqItems.length > 0) &&
        sequenceDisplayModeRef.current === 'flash';

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const remainingMs = endTime - now;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (shouldFlashSeq && seqItems && seqItems.length > 0) {
          const stepMs = totalDurationMs / seqItems.length;
          const nextFlashIdx = Math.min(
            seqItems.length - 1,
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

  // Bắt đầu phiên thử thách 10 câu mới từ câu #1
  const startChallenge = (
    topicOverride?: string,
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

  // Đặt lại toàn bộ phiên thử thách về trạng thái chờ ban đầu
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


  // Chấm đáp án người dùng trong giai đoạn trả lời, cập nhật lịch sử 10 câu và hẹn giờ Auto-Next
  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running' || challengePhaseRef.current !== 'answering') return;
      const normalized = normalizeAnswerInput(rawVal);
      if (!normalized) return;

      clearTimers();
      const q = questionRef.current;
      const correct = normalized === q.answerStr;
      setStatus('answered');
      statusRef.current = 'answered';
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
      setFeedback(correct ? 'correct' : 'incorrect');

      if (correct) {
        setScore((s) => s + 1);
        setStreak((prev) => prev + 1);
        setWrongStreak(0);
        if (isSpeakerEnabled) triggerAnnouncement(true, q.answerStr);
      } else {
        setIncorrectCount((inc) => inc + 1);
        setStreak(0);
        setWrongStreak((w) => w + 1);
        if (isSpeakerEnabled) triggerAnnouncement(false, q.answerStr);
      }

      setHistory((prev) => [
        ...prev,
        {
          qIndex: questionIndex,
          label: isVi ? q.labelVi : q.labelEn,
          userAnswer: normalized,
          correctAnswerText: formatAnswerText(q),
          isCorrect: correct,
        },
      ]);

      if (autoNextDelayRef.current > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(questionIndex + 1, selectedTopic, timeLimit, answerTimeLimitRef.current);
        }, Math.round(autoNextDelayRef.current * 1000));
      }
    },
    [advanceQuestion, clearTimers, isSpeakerEnabled, isVi, questionIndex, selectedTopic, timeLimit, triggerAnnouncement]
  );

  // Bật/tắt nhận diện giọng nói Web Speech API để đọc đáp án trực tiếp
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
          if (String(parsed) === questionRef.current.answerStr || res.isFinal) {
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
    meta.topics.find((tItem) => tItem.id === selectedTopic) || meta.topics[0];
  const dynamicBadge =
    selectedTopic === 'custom'
      ? operandMode === 'digits'
        ? isVi
          ? `${operandDigits} chữ số % • Số gốc ${customDigits} chữ số`
          : `${operandDigits}-Digit % • ${customDigits}-Digit Base`
        : isVi
        ? `${exactOperand}% • Số gốc ${customDigits} chữ số`
        : `${exactOperand}% • ${customDigits}-Digit Base`
      : selectedTopic === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} bước % · ${sequenceDigitProfile}${sequenceIncludeDecrease ? ' · +/- %' : ' · +%'}`
        : `${sequenceCount}-Step % Seq · ${sequenceDigitProfile}${sequenceIncludeDecrease ? ' · +/- %' : ' · +%'}`
      : isVi
      ? currentTopicMeta.badgeVi
      : currentTopicMeta.badgeEn;
  const completedTopicLabel =
    selectedTopic === 'custom'
      ? dynamicBadge
      : selectedTopic === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} bước % (${sequenceDigitProfile}${sequenceIncludeDecrease ? ', +/- %' : ', +%'})`
        : `Percentage sequence ${sequenceCount} steps (${sequenceDigitProfile}${sequenceIncludeDecrease ? ', +/- %' : ', +%'})`
      : isVi
      ? currentTopicMeta.labelVi
      : currentTopicMeta.labelEn;

  const isCustomLayout = selectedTopic === 'custom' || selectedTopic === 'sequence';
  const canAnswer = status === 'running' && challengePhase === 'answering';
  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const isUrgent = timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / activePhaseDuration) * 100));
  const tokens = isVi ? question.displayVi : question.displayEn;
  const formulaLabelStr = isVi ? question.labelVi : question.labelEn;
  const formulaFontSize = isCustomLayout
    ? getCustomFormulaFontSize(formulaLabelStr.length)
    : formulaLabelStr.length > 24
    ? 'text-base sm:text-2xl md:text-3xl'
    : formulaLabelStr.length > 15
    ? 'text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem]'
    : formulaLabelStr.length > 10
    ? 'text-2xl sm:text-4xl lg:text-5xl'
    : 'text-3xl sm:text-5xl';
  const formattedAnswer = formatAnswerText(question);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: Quay lại & Breadcrumb */}
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

      {/* Khung chứa chính khu vực Thử thách Cấp độ Khó */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode
            ? 'border-rose-500/45 to-rose-950/35'
            : 'border-yellow-500/35 to-yellow-950/25'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-yellow-500/10'
          }`}
        />

        {/* Hàng tiêu đề & bộ điều khiển thời gian Quan sát / Trả lời / Đổi câu / Âm thanh */}
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
                  ? tr("Cấp độ khó: tỷ lệ % lẻ, số lớn hơn, tính nhẩm tốc độ cao")
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
                  initialPageKey={autoNextPageKey}
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

        {/* Lưới chọn chuyên đề Phần trăm & hàng cấu hình Tùy chọn (Số gốc & Tỷ lệ %) */}
        <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {meta.topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                disabled={status === 'running'}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  selectedTopicRef.current = topic.id;
                  if (status === 'idle' || status === 'completed') {
                    const nextQ = generateProblem(topic.id);
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
                <span className="text-base">{TOPIC_ICONS[topic.id] || '📊'}</span>
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
              title={tr("Tùy chọn độ dài chữ số của số gốc và tỷ lệ %")}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedTopic === 'custom'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${selectedTopic === 'custom' ? 'text-slate-950' : 'text-yellow-400'}`}
              />
              <span className="whitespace-nowrap">{tr("Tùy chọn (Số gốc & Tỷ lệ %)")}</span>
            </button>

            {selectedTopic === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                {/* Textbox 1: Độ dài Chữ số */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="pct-custom-digit-length"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài Số gốc:")}
                  </label>
                  <input
                    id="pct-custom-digit-length"
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
                    {tr("Tỷ lệ % tùy chọn:")}
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
                      {tr("Số % đích danh")}
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
                      {tr("Chữ số %")}
                    </button>
                  </div>

                  {operandMode === 'exact' ? (
                    <input
                      id="pct-custom-operand-exact"
                      type="text"
                      inputMode="numeric"
                      maxLength={String(9999).length}
                      disabled={status === 'running'}
                      value={exactDraft}
                      onFocus={(e) => e.target.select()}
                      onChange={handleExactInput}
                      onBlur={commitExact}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      aria-label={tr("Nhập tỷ lệ phần trăm đích danh tùy chọn (VD: 15, 25, 125...)")}
                      title={tr("Nhập tỷ lệ phần trăm đích danh tùy chọn (VD: 15, 25, 125...)")}
                      className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  ) : (
                    <input
                      id="pct-custom-operand-digits"
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
                      aria-label={tr("Nhập độ dài chữ số của tỷ lệ % (từ 1 đến 3)")}
                      title={tr("Nhập độ dài chữ số của tỷ lệ % (từ 1 đến 3)")}
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hàng tùy chọn Dãy số % Siêu trí tuệ: Tùy chọn (Dãy số), Phép tính +/- % và bộ điều khiển chi tiết */}
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
                  ? 'Tùy chọn dãy tính phần trăm liên tiếp (+% / -%) giống Siêu trí tuệ'
                  : 'Super-Brain sequential percentage challenge'
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
                const nextIncludeDec =
                  selectedTopic === 'sequence' ? !sequenceIncludeDecrease : true;
                setSelectedTopic('sequence');
                selectedTopicRef.current = 'sequence';
                setSequenceIncludeDecrease(nextIncludeDec);
                sequenceIncludeDecreaseRef.current = nextIncludeDec;
                if (status === 'idle' || status === 'completed') {
                  const nextQ = generateProblem(
                    'sequence',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    sequenceCount,
                    sequenceDigitProfile,
                    nextIncludeDec
                  );
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              aria-pressed={selectedTopic === 'sequence' && sequenceIncludeDecrease}
              title={tr("Bật/tắt dãy tính kết hợp cả tăng (+%) và giảm (−%) luôn cho số nguyên đẹp")}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedTopic === 'sequence' && sequenceIncludeDecrease
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="whitespace-nowrap">{tr("Phép tính +/- %")}</span>
            </button>

            {selectedTopic === 'sequence' && (
              <div className="w-full flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="pct-sequence-count"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Dãy số:")}
                  </label>
                  <input
                    id="pct-sequence-count"
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
                            sequenceIncludeDecrease
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
                            sequenceIncludeDecrease
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
                    htmlFor="pct-sequence-digits-select"
                    className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài chữ số:")}
                  </label>
                  <select
                    id="pct-sequence-digits-select"
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
                          sequenceIncludeDecrease
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
                    htmlFor="pct-sequence-display-select"
                    className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                  >
                    {tr("Hiển thị câu hỏi:")}
                  </label>
                  <select
                    id="pct-sequence-display-select"
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

        {/* Bảng điểm thời gian thực: Chuỗi đúng & Chuỗi sai */}
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

        {/* Khu vực hiển thị Tổng kết 10 câu hoặc Sân thi đấu 2 cột */}
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
                          {item.isCorrect ? '✓' : `✗ (${item.correctAnswerText})`}
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
              {/* Cột trái: Thanh đếm ngược 2 giai đoạn & hiển thị câu hỏi */}
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

                {/* Thanh 10 chấm theo dõi tiến trình từng câu (Đúng / Sai / Đang làm) */}
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
                      {selectedTopic === 'sequence' && question.seqItems && question.seqItems.length > 0 ? (
                        sequenceDisplayMode === 'flash' && status === 'running' ? (
                          <div className="w-full max-w-lg mx-auto py-2 space-y-3 select-none">
                            <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400 px-2">
                              <span className="text-yellow-300 font-bold">
                                {isVi
                                  ? `Bước #${flashIndex + 1} / ${question.seqItems.length}`
                                  : `Step #${flashIndex + 1} / ${question.seqItems.length}`}
                              </span>
                              <span className="tabular-nums">
                                {(timeLimit / Math.max(1, question.seqItems.length)).toFixed(2)}s / {tr("số")}
                              </span>
                            </div>

                            <div className="py-6 sm:py-8 px-4 rounded-2xl bg-slate-900/80 border border-yellow-500/35 flex items-center justify-center gap-3 shadow-inner">
                              {(() => {
                                const item = question.seqItems[flashIndex] ?? { value: '0', isPercent: false };
                                const opsTail = question.seqItems.slice(1).map((x) => x.op ?? '+');
                                const hasMixedOps = opsTail.includes('−') && opsTail.includes('+');
                                const activeOp = item.op ?? '+';
                                const showSign = flashIndex > 0;
                                return (
                                  <span
                                    key={`flash-${questionIndex}-${flashIndex}`}
                                    className="text-5xl sm:text-6xl font-black font-mono text-white tabular-nums tracking-tight animate-in zoom-in-95 fade-in duration-100 flex items-center gap-2.5"
                                  >
                                    {showSign && (
                                      <span
                                        className={`font-sans ${
                                          activeOp === '−'
                                            ? 'text-rose-400'
                                            : hasMixedOps
                                            ? 'text-emerald-400'
                                            : 'text-yellow-400'
                                        }`}
                                      >
                                        {activeOp}
                                      </span>
                                    )}
                                    <span className={item.isPercent ? 'text-yellow-300' : 'text-white'}>
                                      {item.isPercent ? `${item.value}%` : formatBigIntStr(item.value)}
                                    </span>
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-100"
                                style={{
                                  width: `${Math.round(
                                    ((flashIndex + 1) / Math.max(1, question.seqItems.length)) * 100
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
                                  const opsTail = question.seqItems.slice(1).map((x) => x.op ?? '+');
                                  const hasDec = opsTail.includes('−');
                                  const hasInc = opsTail.includes('+');
                                  if (hasDec && hasInc) {
                                    return isVi
                                      ? `Dãy phần trăm (+/- %) gồm ${question.seqItems.length} bước:`
                                      : `Mixed (+/- %) sequence of ${question.seqItems.length} steps:`;
                                  }
                                  return isVi
                                    ? `Dãy tăng phần trăm (+%) gồm ${question.seqItems.length} bước:`
                                    : `Percentage sequence of ${question.seqItems.length} steps:`;
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
                              const opsTail = question.seqItems.slice(1).map((x) => x.op ?? '+');
                              const hasMixedOps = opsTail.includes('−') && opsTail.includes('+');
                              const totalExprLen = question.seqItems.reduce(
                                (sum, it, idx) => sum + it.value.length + (idx > 0 ? 4 : 0),
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
                                    className={`${exprSizeClass} font-mono text-white tabular-nums tracking-tight leading-relaxed text-center`}
                                  >
                                    {question.seqItems.map((item, idx) => {
                                      const op = item.op ?? '+';
                                      const isDec = idx > 0 && op === '−';
                                      return (
                                        <React.Fragment key={idx}>
                                          {idx > 0 && (
                                            <>
                                              {' '}
                                              <span
                                                className={`font-sans font-black ${
                                                  isDec
                                                    ? 'text-rose-400'
                                                    : hasMixedOps
                                                    ? 'text-emerald-400'
                                                    : 'text-yellow-400'
                                                }`}
                                              >
                                                {isDec ? '−' : '+'}
                                              </span>
                                              {' '}
                                            </>
                                          )}
                                          <span className={`whitespace-nowrap ${item.isPercent ? 'text-yellow-300' : 'text-white'}`}>
                                            {item.isPercent ? `${item.value}%` : formatBigIntStr(item.value)}
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
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 w-full max-w-full py-2 px-1">
                          <div
                            className={`${formulaFontSize} font-black text-white tracking-wide font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight`}
                          >
                            {tokens.map((tok, idx) => (
                              <span
                                key={idx}
                                className={
                                  tok.accent
                                    ? 'text-yellow-400 font-sans whitespace-nowrap'
                                    : tok.text === 'của' || tok.text === 'of' || tok.text === '='
                                    ? 'text-slate-400 text-[0.72em] font-sans font-bold whitespace-nowrap'
                                    : isCustomLayout
                                    ? 'break-all'
                                    : 'whitespace-nowrap'
                                }
                              >
                                {tok.text}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => pronounceQuestion()}
                            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                              isSpeakingQuestion
                                ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 animate-pulse'
                                : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400'
                            }`}
                            title={tr("Phát âm câu hỏi")}
                          >
                            <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
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
                      {isVi ? `Chính xác: ${formattedAnswer}` : `Correct: ${formattedAnswer}`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi ? `Chưa chính xác: ${formattedAnswer}` : `Incorrect: ${formattedAnswer}`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi ? `Hết giờ!: ${formattedAnswer}` : `Time's up!: ${formattedAnswer}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Cột phải: Ô nhập đáp án, bàn phím số ảo 0-9 & các nút điều khiển */}
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
                    className={`w-full h-13 sm:h-14 px-4 sm:px-5 ${
                      question.answerSuffix && (canAnswer || userAnswer.length > 0) ? 'pr-12' : 'pr-11'
                    } text-center ${
                      userAnswer.length > 22 ? 'text-base sm:text-xl' : 'text-2xl sm:text-3xl'
                    } font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && canAnswer
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {question.answerSuffix && (canAnswer || userAnswer.length > 0) && (
                    <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 font-mono pointer-events-none">
                      {question.answerSuffix}
                    </span>
                  )}
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
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
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
                      className="flex-1 min-w-[130px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
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
                    className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40'
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
                    title={tr("Làm lại từ đầu")}
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
    </div>
  );
};
