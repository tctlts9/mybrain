/**
 * ============================================================================
 * FILE: PercentageChallengePage.tsx — TRANG THỬ THÁCH PHẦN TRĂM (10 CÂU TÍNH GIỜ)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình Timer & Modal chỉnh thời gian trả lời từng câu (PHẦN A & B).
 * 2. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN C & D).
 * 3. Hỗ trợ 3 chế độ Phần trăm: Cơ bản (basic), Tăng/Giảm (change), Phần trăm ngược (reverse).
 * 4. Đếm ngược từng giây, ghi nhận lịch sử 10 câu, chuỗi đúng/sai, đọc đề TTS và trả lời bằng Giọng nói/Bàn phím ảo.
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
  Clock,
  Gauge,
  AlertTriangle,
  SlidersHorizontal,
  TimerReset,
  Globe,
  X,
  Check,
  Hand,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useLanguage, biLabel, translateText } from '../../context/Translations';
import { EditTimerPageKey, isEditTimerButtonVisible,
  isAutoNextButtonVisible,
  isDifficultLevelChallengeButtonVisible,
} from '../../config/buttonVisibility';

// ============================================================================
// BỘ DỮ LIỆU & HÀM SINH ĐỀ TỶ LỆ PHẦN TRĂM % (CODE TRỰC TIẾP TRONG PAGE)
// ============================================================================
type PercentageMode = 'basic' | 'change' | 'reverse';

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
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';

// ============================================================================
// PHẦN A: CẤU HÌNH & HOOK TIMER (THỜI GIAN TRẢ LỜI TỪNG CÂU THỬ THÁCH)
// ============================================================================
// --- Inline MentalMathTimers config & hook (coded directly in Page) ---
// ============================================================================
// 1. CẤU HÌNH TỔNG TOÀN TAB MENTAL MATH (Code Config)
// Đặt USE_GLOBAL_... = true nếu muốn áp dụng 1 cấu hình chung cho toàn bộ trang.
// Đặt = false để dùng cấu hình riêng từng page ở mục (2) bên dưới.
// ============================================================================

const USE_GLOBAL_CHALLENGE_LIMIT: boolean = false;

const GLOBAL_CHALLENGE_LIMIT: {
  limitOptions: number[];
  defaultLimit: number;
} = {
  limitOptions: [2, 4, 6, 8, 10, 12],
  defaultLimit: 10,
};

const USE_GLOBAL_DIFFICULTY_TIMERS: boolean = false;

const GLOBAL_DIFFICULTY_TIMERS: {
  limitOptions: number[];
  defaultLimit: number;
  answerOptions: number[];
  defaultAnswer: number;
} = {
  limitOptions: [2, 4, 6, 8, 10, 12],
  defaultLimit: 6,
  answerOptions: [10, 20, 30, 40, 50, 60],
  defaultAnswer: 30,
};

// ============================================================================
// 2. CẤU HÌNH RIÊNG ÁP DỤNG CHO TỪNG PAGE CỦA TAB MENTAL MATH
// - limitOptions: danh sách các mốc giây (Timer / Limit) hiển thị trên thanh chọn
// - defaultLimit: giá trị giây được chọn mặc định khi mở trang
// - answerOptions: danh sách các mốc giây Trả lời (áp dụng cho trang Difficulty Challenge)
// - defaultAnswer: giá trị giây Trả lời mặc định khi mở trang
// ============================================================================

interface ChallengeTimerConfig {
  limitOptions: number[];
  defaultLimit: number;
}

interface DifficultyTimerConfig {
  limitOptions: number[];
  defaultLimit: number;
  answerOptions: number[];
  defaultAnswer: number;
}

const MENTAL_MATH_PAGE_TIMERS = {
  // --- Trang Challenge (Thử thách thường) ---
  TwoDigitMentalMathChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  MultiplyBy11ChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  MultiplyBy99ChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  MultiplyWith1DigitChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  DivisionChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  AdditionChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  SubtractionChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  ExponentChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  SquareRootChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  PercentageChallengePage_basic: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  PercentageChallengePage_change: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  PercentageChallengePage_reverse: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,
  DailyReflexChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  } as ChallengeTimerConfig,

  // --- Trang Difficult Level Challenge (Thử thách cấp độ khó - có Limit & Answer) ---
  TwoDigitMentalMathDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  MultiplyBy11DifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  MultiplyBy99DifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  MultiplyWith1DigitDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  DivisionDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  AdditionDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  SubtractionDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  ExponentDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  SquareRootDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  PercentageDifficultyChallengePage_basic: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  PercentageDifficultyChallengePage_change: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  PercentageDifficultyChallengePage_reverse: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
  DailyReflexDifficultyChallengePage: {
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 6,
    answerOptions: [10, 20, 30, 40, 50, 60],
    defaultAnswer: 30,
  } as DifficultyTimerConfig,
};

type MentalMathTimerPageKey = keyof typeof MENTAL_MATH_PAGE_TIMERS;

interface MentalMathTimerPageMeta {
  key: MentalMathTimerPageKey;
  group: 'challenge' | 'difficulty';
  hasAnswer: boolean;
  labelVi: string;
  labelEn: string;
}

const MENTAL_MATH_TIMER_PAGE_META: MentalMathTimerPageMeta[] = [
  // Challenge pages
  {
    key: 'TwoDigitMentalMathChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Nhân 2 chữ số — Challenge"),
  },
  {
    key: 'MultiplyBy11ChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Nhân với 11 — Challenge"),
  },
  {
    key: 'MultiplyBy99ChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Nhân với 99 — Challenge"),
  },
  {
    key: 'MultiplyWith1DigitChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Nhân với 1 chữ số — Challenge"),
  },
  {
    key: 'DivisionChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Phép chia — Challenge"),
  },
  {
    key: 'AdditionChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Phép cộng — Challenge"),
  },
  {
    key: 'SubtractionChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Phép trừ — Challenge"),
  },
  {
    key: 'ExponentChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Lũy thừa — Challenge"),
  },
  {
    key: 'SquareRootChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Căn bậc 2 — Challenge"),
  },
  {
    key: 'PercentageChallengePage_basic',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Tỷ lệ % (Tính % của một số) — Challenge"),
  },
  {
    key: 'PercentageChallengePage_change',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Tỷ lệ % (Tăng / Giảm %) — Challenge"),
  },
  {
    key: 'PercentageChallengePage_reverse',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Challenge"),
  },
  {
    key: 'DailyReflexChallengePage',
    group: 'challenge',
    hasAnswer: false,
    ...biLabel("Phản xạ hàng ngày — Challenge"),
  },

  // Difficulty Level Challenge pages
  {
    key: 'TwoDigitMentalMathDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Nhân 2 chữ số — Difficult Level Challenge"),
  },
  {
    key: 'MultiplyBy11DifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Nhân với 11 — Difficult Level Challenge"),
  },
  {
    key: 'MultiplyBy99DifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Nhân với 99 — Difficult Level Challenge"),
  },
  {
    key: 'MultiplyWith1DigitDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Nhân với 1 chữ số — Difficult Level Challenge"),
  },
  {
    key: 'DivisionDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Phép chia — Difficult Level Challenge"),
  },
  {
    key: 'AdditionDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Phép cộng — Difficult Level Challenge"),
  },
  {
    key: 'SubtractionDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Phép trừ — Difficult Level Challenge"),
  },
  {
    key: 'ExponentDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Lũy thừa — Difficult Level Challenge"),
  },
  {
    key: 'SquareRootDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Căn bậc 2 — Difficult Level Challenge"),
  },
  {
    key: 'PercentageDifficultyChallengePage_basic',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Tỷ lệ % (Tính % của một số) — Difficult Level Challenge"),
  },
  {
    key: 'PercentageDifficultyChallengePage_change',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Tỷ lệ % (Tăng / Giảm %) — Difficult Level Challenge"),
  },
  {
    key: 'PercentageDifficultyChallengePage_reverse',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Difficult Level Challenge"),
  },
  {
    key: 'DailyReflexDifficultyChallengePage',
    group: 'difficulty',
    hasAnswer: true,
    ...biLabel("Phản xạ hàng ngày — Difficult Level Challenge"),
  },
];

const getPercentageChallengePageKey = (mode: PercentageMode): MentalMathTimerPageKey =>
  mode === 'basic'
    ? 'PercentageChallengePage_basic'
    : mode === 'change'
    ? 'PercentageChallengePage_change'
    : 'PercentageChallengePage_reverse';

// ============================================================================
// 3. LƯU TRỮ TÙY CHỈNH TRONG TRÌNH DUYỆT (localStorage) & RESOLVER
// ============================================================================

const TIMER_STORAGE_KEY = 'mental_math_timer_overrides_v1';
const TIMER_UPDATE_EVENT = 'mental-math-timers-updated';

interface TimerOverrideEntry {
  limitOptions?: number[];
  defaultLimit?: number;
  answerOptions?: number[];
  defaultAnswer?: number;
}

interface StoredMentalMathTimerOverrides {
  globalChallenge?: {
    limitOptions: number[];
    defaultLimit: number;
  };
  globalDifficulty?: {
    limitOptions: number[];
    defaultLimit: number;
    answerOptions: number[];
    defaultAnswer: number;
  };
  pages: Partial<Record<MentalMathTimerPageKey, TimerOverrideEntry>>;
}

const sanitizeSecondsList = (list: number[], fallback: number[]): number[] => {
  const cleaned = Array.from(
    new Set(
      list
        .map((n) => Math.round(Number(n)))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 999)
    )
  ).sort((a, b) => a - b);
  return cleaned.length > 0 ? cleaned : [...fallback];
};

const pickValidDefault = (candidate: number | undefined, options: number[]): number => {
  if (candidate !== undefined && options.includes(candidate)) {
    return candidate;
  }
  return options[0];
};

const isDifficultyTimerPage = (pageKey: MentalMathTimerPageKey): boolean => {
  const meta = MENTAL_MATH_TIMER_PAGE_META.find((m) => m.key === pageKey);
  return meta ? meta.hasAnswer : false;
};

const getStoredTimerOverrides = (): StoredMentalMathTimerOverrides => {
  if (typeof window === 'undefined') {
    return { pages: {} };
  }
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return { pages: {} };
    const parsed = JSON.parse(raw) as StoredMentalMathTimerOverrides;
    return {
      globalChallenge: parsed.globalChallenge,
      globalDifficulty: parsed.globalDifficulty,
      pages: parsed.pages || {},
    };
  } catch {
    return { pages: {} };
  }
};

const writeStoredTimerOverrides = (next: StoredMentalMathTimerOverrides): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(TIMER_UPDATE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
};

interface EffectiveMentalMathTimerConfig {
  limitOptions: number[];
  defaultLimit: number;
  answerOptions: number[];
  defaultAnswer: number;
  source: 'page' | 'global' | 'code';
}

const getEffectiveMentalMathTimerConfig = (
  pageKey: MentalMathTimerPageKey
): EffectiveMentalMathTimerConfig => {
  const isDiff = isDifficultyTimerPage(pageKey);
  const pageCodeRaw = MENTAL_MATH_PAGE_TIMERS[pageKey];
  const stored = getStoredTimerOverrides();

  const defaultCodeAnswerOptions = [10, 20, 30, 40, 50, 60];
  const defaultCodeAnswer = 30;

  // Base from code config (section 1 global override or section 2 per-page)
  let baseLimitOptions = isDiff
    ? USE_GLOBAL_DIFFICULTY_TIMERS
      ? GLOBAL_DIFFICULTY_TIMERS.limitOptions
      : pageCodeRaw.limitOptions
    : USE_GLOBAL_CHALLENGE_LIMIT
    ? GLOBAL_CHALLENGE_LIMIT.limitOptions
    : pageCodeRaw.limitOptions;

  let baseDefaultLimit = isDiff
    ? USE_GLOBAL_DIFFICULTY_TIMERS
      ? GLOBAL_DIFFICULTY_TIMERS.defaultLimit
      : pageCodeRaw.defaultLimit
    : USE_GLOBAL_CHALLENGE_LIMIT
    ? GLOBAL_CHALLENGE_LIMIT.defaultLimit
    : pageCodeRaw.defaultLimit;

  let baseAnswerOptions = isDiff
    ? USE_GLOBAL_DIFFICULTY_TIMERS
      ? GLOBAL_DIFFICULTY_TIMERS.answerOptions
      : (pageCodeRaw as DifficultyTimerConfig).answerOptions ?? defaultCodeAnswerOptions
    : defaultCodeAnswerOptions;

  let baseDefaultAnswer = isDiff
    ? USE_GLOBAL_DIFFICULTY_TIMERS
      ? GLOBAL_DIFFICULTY_TIMERS.defaultAnswer
      : (pageCodeRaw as DifficultyTimerConfig).defaultAnswer ?? defaultCodeAnswer
    : defaultCodeAnswer;

  let source: 'page' | 'global' | 'code' = 'code';

  // Apply global UI override if present
  if (!isDiff && stored.globalChallenge) {
    baseLimitOptions = stored.globalChallenge.limitOptions;
    baseDefaultLimit = stored.globalChallenge.defaultLimit;
    source = 'global';
  } else if (isDiff && stored.globalDifficulty) {
    baseLimitOptions = stored.globalDifficulty.limitOptions;
    baseDefaultLimit = stored.globalDifficulty.defaultLimit;
    baseAnswerOptions = stored.globalDifficulty.answerOptions;
    baseDefaultAnswer = stored.globalDifficulty.defaultAnswer;
    source = 'global';
  }

  // Apply per-page UI override if present (highest priority)
  const pageOverride = stored.pages?.[pageKey];
  if (pageOverride) {
    if (pageOverride.limitOptions && pageOverride.limitOptions.length > 0) {
      baseLimitOptions = pageOverride.limitOptions;
    }
    if (pageOverride.defaultLimit !== undefined) {
      baseDefaultLimit = pageOverride.defaultLimit;
    }
    if (isDiff) {
      if (pageOverride.answerOptions && pageOverride.answerOptions.length > 0) {
        baseAnswerOptions = pageOverride.answerOptions;
      }
      if (pageOverride.defaultAnswer !== undefined) {
        baseDefaultAnswer = pageOverride.defaultAnswer;
      }
    }
    source = 'page';
  }

  const limitOptions = sanitizeSecondsList(baseLimitOptions, [2, 4, 6, 8, 10, 12]);
  const defaultLimit = pickValidDefault(baseDefaultLimit, limitOptions);
  const answerOptions = sanitizeSecondsList(baseAnswerOptions, [10, 20, 30, 40, 50, 60]);
  const defaultAnswer = pickValidDefault(baseDefaultAnswer, answerOptions);

  return {
    limitOptions,
    defaultLimit,
    answerOptions,
    defaultAnswer,
    source,
  };
};

const savePageTimerOverride = (
  pageKey: MentalMathTimerPageKey,
  value: TimerOverrideEntry
): void => {
  const current = getStoredTimerOverrides();
  const isDiff = isDifficultyTimerPage(pageKey);
  const limitOptions = sanitizeSecondsList(
    value.limitOptions ?? [2, 4, 6, 8, 10, 12],
    [2, 4, 6, 8, 10, 12]
  );
  const defaultLimit = pickValidDefault(value.defaultLimit, limitOptions);

  const entry: TimerOverrideEntry = {
    limitOptions,
    defaultLimit,
  };

  if (isDiff) {
    const answerOptions = sanitizeSecondsList(
      value.answerOptions ?? [10, 20, 30, 40, 50, 60],
      [10, 20, 30, 40, 50, 60]
    );
    entry.answerOptions = answerOptions;
    entry.defaultAnswer = pickValidDefault(value.defaultAnswer, answerOptions);
  }

  writeStoredTimerOverrides({
    ...current,
    pages: {
      ...current.pages,
      [pageKey]: entry,
    },
  });
};

const saveGlobalTimerOverride = (
  target: 'challenge' | 'difficulty' | 'both',
  value: {
    limitOptions: number[];
    defaultLimit: number;
    answerOptions?: number[];
    defaultAnswer?: number;
  },
  clearPerPageOverrides: boolean = false
): void => {
  const current = getStoredTimerOverrides();
  const limitOptions = sanitizeSecondsList(value.limitOptions, [2, 4, 6, 8, 10, 12]);
  const defaultLimit = pickValidDefault(value.defaultLimit, limitOptions);
  const answerOptions = sanitizeSecondsList(
    value.answerOptions ?? [10, 20, 30, 40, 50, 60],
    [10, 20, 30, 40, 50, 60]
  );
  const defaultAnswer = pickValidDefault(value.defaultAnswer, answerOptions);

  const nextPages = { ...current.pages };
  if (clearPerPageOverrides) {
    for (const meta of MENTAL_MATH_TIMER_PAGE_META) {
      if (target === 'both' || meta.group === target) {
        delete nextPages[meta.key];
      }
    }
  }

  writeStoredTimerOverrides({
    globalChallenge:
      target === 'challenge' || target === 'both'
        ? { limitOptions, defaultLimit }
        : current.globalChallenge,
    globalDifficulty:
      target === 'difficulty' || target === 'both'
        ? { limitOptions, defaultLimit, answerOptions, defaultAnswer }
        : current.globalDifficulty,
    pages: nextPages,
  });
};

const resetPageTimerOverride = (pageKey: MentalMathTimerPageKey): void => {
  const current = getStoredTimerOverrides();
  const nextPages = { ...current.pages };
  delete nextPages[pageKey];
  writeStoredTimerOverrides({
    ...current,
    pages: nextPages,
  });
};

const resetGlobalChallengeTimerOverride = (): void => {
  const current = getStoredTimerOverrides();
  writeStoredTimerOverrides({
    ...current,
    globalChallenge: undefined,
  });
};

const resetAllTimerOverrides = (): void => {
  writeStoredTimerOverrides({ pages: {} });
};

const useMentalMathTimerConfig = (
  pageKey: MentalMathTimerPageKey
): EffectiveMentalMathTimerConfig => {
  const [config, setConfig] = useState<EffectiveMentalMathTimerConfig>(() =>
    getEffectiveMentalMathTimerConfig(pageKey)
  );

  const refresh = useCallback(() => {
    setConfig(getEffectiveMentalMathTimerConfig(pageKey));
  }, [pageKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onUpdate = () => refresh();
    window.addEventListener(TIMER_UPDATE_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(TIMER_UPDATE_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refresh]);

  return config;
};

// ============================================================================
// PHẦN B: MODAL CÀI ĐẶT THỜI GIAN ĐẾM NGƯỢC TIMER (TRANG NÀY / TOÀN TAB)
// ============================================================================
// --- Inline MentalMathChallengeTimerModal (coded directly in Page) ---
interface MentalMathChallengeTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: 'global' | 'page';
  initialPageKey?: MentalMathTimerPageKey;
}

const CHALLENGE_PAGES = MENTAL_MATH_TIMER_PAGE_META.filter((m) => m.group === 'challenge');

const TIMER_PRESETS: Array<{
  id: string;
  labelVi: string;
  labelEn: string;
  limitOptions: number[];
  defaultLimit: number;
}> = [
  {
    id: 'default',
    labelVi: 'Mặc định (2s–12s)',
    labelEn: 'Default (2s–12s)',
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  },
  {
    id: 'blitz',
    labelVi: 'Siêu tốc (1s–6s)',
    labelEn: 'Blitz (1s–6s)',
    limitOptions: [1, 2, 3, 4, 5, 6],
    defaultLimit: 4,
  },
  {
    id: 'standard',
    labelVi: 'Tiêu chuẩn (5s–30s)',
    labelEn: 'Standard (5s–30s)',
    limitOptions: [5, 10, 15, 20, 25, 30],
    defaultLimit: 10,
  },
  {
    id: 'relaxed',
    labelVi: 'Thoải mái (10s–60s)',
    labelEn: 'Relaxed (10s–60s)',
    limitOptions: [10, 15, 20, 30, 45, 60],
    defaultLimit: 20,
  },
];

const MentalMathChallengeTimerModal: React.FC<MentalMathChallengeTimerModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'global',
  initialPageKey = 'TwoDigitMentalMathChallengePage',
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  const validInitialPageKey = useMemo<MentalMathTimerPageKey>(() => {
    const found = CHALLENGE_PAGES.find((p) => p.key === initialPageKey);
    return found ? found.key : CHALLENGE_PAGES[0].key;
  }, [initialPageKey]);

  const [scope, setScope] = useState<'global' | 'page'>(initialScope);
  const [selectedPageKey, setSelectedPageKey] =
    useState<MentalMathTimerPageKey>(validInitialPageKey);
  const [limitOptions, setLimitOptions] = useState<number[]>([2, 4, 6, 8, 10, 12]);
  const [defaultLimit, setDefaultLimit] = useState<number>(10);
  const [newSecondInput, setNewSecondInput] = useState<string>('');
  const [overrideExistingPages, setOverrideExistingPages] = useState<boolean>(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sync draft state whenever modal opens or scope/page changes
  useEffect(() => {
    if (!isOpen) return;
    setScope(initialScope);
    setSelectedPageKey(validInitialPageKey);
    setNewSecondInput('');
    setSavedNotice(null);
  }, [isOpen, initialScope, validInitialPageKey]);

  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'global') {
      const stored = getStoredTimerOverrides();
      const baseOptions = stored.globalChallenge?.limitOptions ?? GLOBAL_CHALLENGE_LIMIT.limitOptions;
      const cleanOptions = sanitizeSecondsList(baseOptions, [2, 4, 6, 8, 10, 12]);
      const baseDefault = stored.globalChallenge?.defaultLimit ?? GLOBAL_CHALLENGE_LIMIT.defaultLimit;
      setLimitOptions(cleanOptions);
      setDefaultLimit(pickValidDefault(baseDefault, cleanOptions));
    } else {
      const effective = getEffectiveMentalMathTimerConfig(selectedPageKey);
      setLimitOptions(effective.limitOptions);
      setDefaultLimit(effective.defaultLimit);
    }
    setNewSecondInput('');
  }, [isOpen, scope, selectedPageKey]);

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

  const stored = getStoredTimerOverrides();
  const perPageOverrideKeys = CHALLENGE_PAGES.filter((p) => Boolean(stored.pages?.[p.key]));
  const currentPageEffective = getEffectiveMentalMathTimerConfig(selectedPageKey);

  const handleAddSeconds = () => {
    const tokens = newSecondInput
      .split(/[,\s;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const parsed = tokens
      .map((t) => Math.round(Number(t)))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 999);

    if (parsed.length === 0) {
      setNewSecondInput('');
      return;
    }

    const merged = sanitizeSecondsList([...limitOptions, ...parsed], limitOptions);
    setLimitOptions(merged);
    if (!merged.includes(defaultLimit)) {
      setDefaultLimit(pickValidDefault(defaultLimit, merged));
    }
    setNewSecondInput('');
  };

  const handleRemoveSecond = (sec: number) => {
    if (limitOptions.length <= 1) return;
    const next = limitOptions.filter((n) => n !== sec);
    setLimitOptions(next);
    if (defaultLimit === sec) {
      setDefaultLimit(next[0]);
    }
  };

  const handleApplyPreset = (presetOptions: number[], presetDefault: number) => {
    const clean = sanitizeSecondsList(presetOptions, [2, 4, 6, 8, 10, 12]);
    setLimitOptions(clean);
    setDefaultLimit(pickValidDefault(presetDefault, clean));
  };

  const handleSave = () => {
    if (scope === 'global') {
      saveGlobalTimerOverride(
        'challenge',
        { limitOptions, defaultLimit },
        overrideExistingPages
      );
      setSavedNotice(
        tr("Đã áp dụng cấu hình Timer cho toàn Tab Mental Math!")
      );
    } else {
      savePageTimerOverride(selectedPageKey, { limitOptions, defaultLimit });
      const meta = CHALLENGE_PAGES.find((p) => p.key === selectedPageKey);
      const label = meta ? (isVi ? meta.labelVi : meta.labelEn) : '';
      setSavedNotice(
        isVi
          ? `Đã lưu cấu hình Timer riêng cho "${label}"!`
          : `Saved Timer settings for "${label}"!`
      );
    }
    window.setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleReset = () => {
    if (scope === 'global') {
      resetGlobalChallengeTimerOverride();
      if (overrideExistingPages) {
        CHALLENGE_PAGES.forEach((p) => resetPageTimerOverride(p.key));
      }
      const clean = [...GLOBAL_CHALLENGE_LIMIT.limitOptions];
      setLimitOptions(clean);
      setDefaultLimit(GLOBAL_CHALLENGE_LIMIT.defaultLimit);
      setSavedNotice(
        tr("Đã khôi phục Timer mặc định toàn Tab!")
      );
    } else {
      resetPageTimerOverride(selectedPageKey);
      const effective = getEffectiveMentalMathTimerConfig(selectedPageKey);
      setLimitOptions(effective.limitOptions);
      setDefaultLimit(effective.defaultLimit);
      setSavedNotice(
        tr("Đã khôi phục cấu hình trang này! [Timer]")
      );
    }
  };

  const sourceLabel =
    currentPageEffective.source === 'page'
      ? tr("Cấu hình riêng trang này")
      : currentPageEffective.source === 'global'
      ? tr("Theo cấu hình toàn Tab")
      : tr("Mặc định hệ thống");

  const sourceBadgeClass =
    currentPageEffective.source === 'page'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : currentPageEffective.source === 'global'
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
      : 'bg-slate-800 text-slate-300 border-slate-700';

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
        aria-labelledby="mental-math-timer-modal-title"
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3
                id="mental-math-timer-modal-title"
                className="text-sm sm:text-base font-extrabold text-white"
              >
                {tr("Chỉnh sửa Timer — Mental Math")}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tr("Tùy chỉnh các mốc giây & thời gian mặc định cho toàn Tab hoặc từng page")}
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
              onClick={() => setScope('global')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                scope === 'global'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{tr("Toàn Tab Mental Math")}</span>
            </button>

            <button
              type="button"
              onClick={() => setScope('page')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                scope === 'page'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{tr("Riêng lẻ từng Page")}</span>
            </button>
          </div>

          {/* Page Selector (only in Page scope) */}
          {scope === 'page' && (
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="timer-page-selector"
                  className="text-xs font-bold text-slate-300"
                >
                  {tr("Chọn trang áp dụng:")}
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sourceBadgeClass}`}
                >
                  {sourceLabel}
                </span>
              </div>
              <select
                id="timer-page-selector"
                value={selectedPageKey}
                onChange={(e) => setSelectedPageKey(e.target.value as MentalMathTimerPageKey)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {CHALLENGE_PAGES.map((page) => {
                  const hasCustom = Boolean(stored.pages?.[page.key]);
                  const label = isVi ? page.labelVi : page.labelEn;
                  return (
                    <option key={page.key} value={page.key}>
                      {hasCustom ? `★ ${label}` : label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{tr("Mẫu chọn nhanh:")}</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TIMER_PRESETS.map((preset) => {
                const isActive =
                  preset.limitOptions.length === limitOptions.length &&
                  preset.limitOptions.every((v, idx) => v === limitOptions[idx]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.limitOptions, preset.defaultLimit)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {isVi ? preset.labelVi : preset.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer Options Chips + Add New Second */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {tr("Các mốc giây trên thanh Timer:")}
              </span>
              <span className="text-[11px] text-slate-400">
                {isVi ? `${limitOptions.length} mốc` : `${limitOptions.length} options`}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {limitOptions.map((sec) => {
                const isDef = defaultLimit === sec;
                return (
                  <div
                    key={sec}
                    className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                      isDef
                        ? 'bg-amber-500/20 border-amber-400/70 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{sec}s</span>
                    <button
                      type="button"
                      disabled={limitOptions.length <= 1}
                      onClick={() => handleRemoveSecond(sec)}
                      title={
                        limitOptions.length <= 1
                          ? tr("Cần ít nhất 1 mốc thời gian")
                          : isVi
                          ? `Xóa ${sec}s`
                          : `Remove ${sec}s`
                      }
                      className="p-0.5 rounded hover:bg-rose-500/30 hover:text-rose-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                inputMode="numeric"
                value={newSecondInput}
                onChange={(e) => setNewSecondInput(e.target.value.replace(/[^\d,\s;]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSeconds();
                  }
                }}
                placeholder={
                  tr("Nhập số giây để thêm (vd: 15 hoặc 3, 5, 9)...")
                }
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddSeconds}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>{tr("Thêm")}</span>
              </button>
            </div>
          </div>

          {/* Default Limit Selector + Live Preview */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {tr("Thời gian mặc định khi mở trang (Xem trước thanh Timer):")}
              </span>
              <span className="text-xs font-extrabold text-amber-400">{defaultLimit}s</span>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{tr("Thời gian:")}</span>
              </span>
              {limitOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDefaultLimit(sec)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    defaultLimit === sec
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Global scope override option */}
          {scope === 'global' && perPageOverrideKeys.length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={overrideExistingPages}
                onChange={(e) => setOverrideExistingPages(e.target.checked)}
                className="mt-0.5 accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-amber-100 leading-relaxed">
                {isVi
                  ? `Áp dụng đồng bộ cho cả ${perPageOverrideKeys.length} trang đang có cấu hình Timer riêng.`
                  : `Also overwrite ${perPageOverrideKeys.length} page(s) that currently have custom per-page overrides.`}
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{tr("Đặt lại mặc định")}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {tr("Đóng [Hủy]")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>
                {scope === 'global'
                  ? tr("Áp dụng toàn Tab")
                  : tr("Lưu trang này")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHẦN C: CẤU HÌNH & HOOK AUTO-NEXT (TỰ ĐỘNG CHUYỂN CÂU KHI XONG CÂU HỎI)
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

const getPercentageChallengeAutoNextPageKey = (
  mode: PercentageMode
): MentalMathAutoNextPageKey =>
  mode === 'basic'
    ? 'PercentageChallengePage_basic'
    : mode === 'change'
    ? 'PercentageChallengePage_change'
    : 'PercentageChallengePage_reverse';

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
// PHẦN D: MODAL CÀI ĐẶT THỜI GIAN TỰ ĐỘNG CHUYỂN CÂU (AUTO-NEXT MODAL)
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

interface PercentageChallengePageProps {
  mode: PercentageMode;
  initialTopic?: string;
  onBack: () => void;
  onOpenHardChallenge?: (topic?: string) => void;
  isHard?: boolean;
}

type TimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';

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
// PHẦN E: COMPONENT CHÍNH TRANG THỬ THÁCH PHẦN TRĂM (PercentageChallengePage)
// ============================================================================
export const PercentageChallengePage: React.FC<PercentageChallengePageProps> = ({
  mode,
  initialTopic = 'general',
  onBack,
  onOpenHardChallenge,
  isHard = false,
}) => {
  // --- Khởi tạo ngôn ngữ, metadata chế độ Phần trăm, cấu hình Timer & Auto-Next ---
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const meta = PERCENTAGE_META[mode];
  const hardMode = isHard;
  const difficulty = hardMode ? 'hard' : 'normal';
  const pageTimerKey = getPercentageChallengePageKey(mode);
  const timerConfig = useMentalMathTimerConfig(pageTimerKey);
  const autoNextPageKey = getPercentageChallengeAutoNextPageKey(mode);
  const autoNextConfig = useMentalMathAutoNextConfig(autoNextPageKey);
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible(autoNextPageKey);

  // --- State quản lý chủ đề, trạng thái thử thách, điểm số & lịch sử 10 câu ---
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(timerConfig.defaultLimit);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const editTimerPageKey: EditTimerPageKey =
    mode === 'basic'
      ? 'PercentageChallengePage_basic'
      : mode === 'change'
      ? 'PercentageChallengePage_change'
      : 'PercentageChallengePage_reverse';
  const showEditTimerButton = isEditTimerButtonVisible(editTimerPageKey);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<PercentageQuestion>(() =>
    generatePercentageQuestion(mode, initialTopic, difficulty)
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerConfig.defaultLimit);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');
  const [score, setScore] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- State & Ref cho âm thanh TTS, tốc độ đọc và nhận diện giọng nói ---

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
  const questionRef = useRef<PercentageQuestion>(question);
  const statusRef = useRef<GameStatus>(status);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (statusRef.current !== 'running') {
      setTimeLimit(timerConfig.defaultLimit);
      setTimeLeft(timerConfig.defaultLimit);
    }
  }, [timerConfig.defaultLimit, timerConfig.limitOptions]);

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

  const formatAnswerText = (q: PercentageQuestion) =>
    `${q.answer.toLocaleString()}${q.answerSuffix || ''}`;

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
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  // --- Chuyển sang câu tiếp theo (hoặc kết thúc 10 câu) và bật đếm ngược ---
  const advanceQuestion = useCallback(
    (nextIdx: number, topicId: string, limit: TimeLimit) => {
      clearTimers();
      if (nextIdx > TOTAL_QUESTIONS) {
        setStatus('completed');
        stopListening();
        return;
      }
      const nextQ = generatePercentageQuestion(mode, topicId, difficulty);
      setQuestionIndex(nextIdx);
      setQuestion(nextQ);
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setTimeLeft(limit);
      setStatus('running');
      setTimeout(() => inputRef.current?.focus(), 50);

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setStatus('answered');
            setFeedback('timeout');
            setStreak(0);
            setWrongStreak((w) => w + 1);
            setIncorrectCount((inc) => inc + 1);
            setHistory((h) => [
              ...h,
              {
                qIndex: nextIdx,
                label: isVi ? nextQ.labelVi : nextQ.labelEn,
                userAnswer: tr("Hết giờ"),
                correctAnswerText: `${nextQ.answer.toLocaleString()}${nextQ.answerSuffix || ''}`,
                isCorrect: false,
              },
            ]);
            if (isSpeakerEnabled) {
              triggerAnnouncement(false, nextQ.answer);
            }
            if (autoNextDelayRef.current > 0) {
              autoNextRef.current = window.setTimeout(() => {
                advanceQuestion(nextIdx + 1, topicId, limit);
              }, Math.round(autoNextDelayRef.current * 1000));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimers, difficulty, isSpeakerEnabled, isVi, mode, stopListening, triggerAnnouncement]
  );

  const startChallenge = (topicOverride?: string, limitOverride?: TimeLimit) => {
    const activeTopic = topicOverride || selectedTopic;
    const activeLimit = limitOverride || timeLimit;
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, activeTopic, activeLimit);
  };

  const handleReset = () => {
    clearTimers();
    stopCurrentSpeech();
    stopListening();
    setStatus('idle');
    setQuestionIndex(1);
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setTimeLeft(timeLimit);
    setQuestion(generatePercentageQuestion(mode, selectedTopic, difficulty));
  };


  // --- Chấm điểm đáp án người chơi gửi lên và lên lịch tự động chuyển câu ---
  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running') return;
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      clearTimers();
      const q = questionRef.current;
      const correct = parsed === q.answer;
      setStatus('answered');
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
          label: isVi ? q.labelVi : q.labelEn,
          userAnswer: String(parsed),
          correctAnswerText: formatAnswerText(q),
          isCorrect: correct,
        },
      ]);

      if (autoNextDelayRef.current > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(questionIndex + 1, selectedTopic, timeLimit);
        }, Math.round(autoNextDelayRef.current * 1000));
      }
    },
    [advanceQuestion, clearTimers, isSpeakerEnabled, isVi, questionIndex, selectedTopic, timeLimit, triggerAnnouncement]
  );

  // --- Bật/tắt nhận diện giọng nói (Web Speech API) để trả lời bằng micro ---
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
        if (parsed !== null && statusRef.current === 'running') {
          setUserAnswer(String(parsed));
          if (parsed === questionRef.current.answer || res.isFinal) {
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
  const isUrgent = timeLeft <= (timeLimit <= 4 ? 1 : timeLimit <= 8 ? 2 : 3);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const tokens = isVi ? question.displayVi : question.displayEn;
  const formattedAnswer = formatAnswerText(question);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: nút Quay lại và Breadcrumb */}
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isDifficultLevelChallengeButtonVisible(editTimerPageKey) && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                clearTimers();
                stopCurrentSpeech();
                stopListening();
                onOpenHardChallenge(selectedTopic);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25"
              title={tr("Thử thách cấp độ khó")}
            >
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span>{tr("Thử thách")}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
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
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{isVi ? `Thử Thách ${meta.titleVi}` : `${meta.titleEn} Challenge`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Khung chứa toàn bộ giao diện Thử thách Phần trăm */}
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

        {/* Thanh tiêu đề, chọn mốc giây Timer, nút Auto-Next và bật/tắt Loa */}
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
                <span>{tr("Thử Thách Tính Nhẩm")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                  {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
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

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="hidden sm:inline">{tr("Thời gian:")}</span>
              </span>
              {timerConfig.limitOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={status === 'running'}
                  onClick={() => {
                    setTimeLimit(sec);
                    if (status === 'idle') setTimeLeft(sec);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                    timeLimit === sec
                      ? 'bg-yellow-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              {showEditTimerButton && (
                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(true)}
                  title={tr("Chỉnh sửa Timer (Trang này / Toàn Tab)")}
                  aria-label={tr("Chỉnh sửa Timer")}
                  className="ml-0.5 p-1.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-slate-800/90 border border-transparent hover:border-yellow-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
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

        {/* Bộ chọn chủ đề theo chế độ Phần trăm */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          {meta.topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedTopic(topic.id);
                if (status === 'idle') setQuestion(generatePercentageQuestion(mode, topic.id, difficulty));
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

        {/* Thanh thống kê Chuỗi đúng / Chuỗi sai theo thời gian thực */}
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

        {/* Khu vực thi đấu chính hoặc Bảng tổng kết 10 câu khi hoàn thành */}
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
                  ? `Chuyên đề: ${currentTopicMeta.labelVi} • Thời gian: ${timeLimit}s / câu${hardMode ? ' (Cấp độ Khó)' : ''}`
                  : `Topic: ${currentTopicMeta.labelEn} • Time limit: ${timeLimit}s / problem${hardMode ? ' (Hard Level)' : ''}`}
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
                <div className="max-w-lg mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{tr("Chi tiết 10 phép tính")}</span>
                    <span>{tr("Kết quả")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium truncate">
                          #{item.qIndex}: {item.label}
                        </span>
                        <span className="font-bold font-mono shrink-0">
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
            <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch">
              {/* Cột trái: Thanh tiến trình đếm ngược, 10 chấm câu hỏi & biểu thức Phần trăm */}
              <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent && status === 'running' ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-yellow-400'
                    }`}
                    style={{ width: `${status === 'idle' ? 100 : timerPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                    {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-yellow-300 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                    <span>{isVi ? `Câu ${questionIndex}/${TOTAL_QUESTIONS}` : `Problem ${questionIndex}/${TOTAL_QUESTIONS}`}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer className={`w-3 h-3 ${isUrgent && status === 'running' ? 'text-rose-400' : 'text-yellow-400'}`} />
                    <span className="font-mono">{status === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}</span>
                  </span>
                </div>

                {/* 10 chấm theo dõi tiến độ đúng/sai từng câu */}
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
                  ) : (
                    <>
                      {(() => {
                        const formulaLen = (isVi ? question.labelVi : question.labelEn).length;
                        const formulaFontSize =
                          formulaLen > 24
                            ? 'text-base sm:text-2xl md:text-3xl'
                            : formulaLen > 15
                            ? 'text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem]'
                            : formulaLen > 10
                            ? 'text-2xl sm:text-4xl lg:text-5xl'
                            : 'text-3xl sm:text-5xl';
                        return (
                          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 w-full max-w-full py-2 px-1">
                            <div className={`${formulaFontSize} font-black text-white tracking-wide font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight`}>
                              {tokens.map((tok, idx) => (
                                <span
                                  key={idx}
                                  className={
                                    tok.accent
                                      ? 'text-yellow-400 font-sans whitespace-nowrap'
                                      : tok.text === 'của' || tok.text === 'of' || tok.text === '='
                                      ? 'text-slate-400 text-[0.72em] font-sans font-bold whitespace-nowrap'
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
                        );
                      })()}

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
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isVi ? `Chính xác: ${formattedAnswer}` : `Correct: ${formattedAnswer}`}</span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{isVi ? `Chưa chính xác: ${formattedAnswer}` : `Incorrect: ${formattedAnswer}`}</span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{isVi ? `Hết giờ!: ${formattedAnswer}` : `Time's up!: ${formattedAnswer}`}</span>
                  </div>
                )}
              </div>

              {/* Cột phải: Form nhập đáp án, bàn phím số ảo 2x6 và các nút hành động */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(userAnswer);
                }}
                className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3"
              >
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder={
                      status === 'idle'
                        ? tr("Bấm \"Bắt đầu thử thách\" để đếm ngược...")
                        : isListening
                        ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn")
                        : tr("Nhập kết quả hoặc bấm phím số...")
                    }
                    disabled={status !== 'running'}
                    className={`w-full h-13 sm:h-14 px-4 sm:px-5 ${
                      question.answerSuffix && (status === 'running' || userAnswer.length > 0) ? 'pr-12' : 'pr-11'
                    } text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && status === 'running'
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {question.answerSuffix && (status === 'running' || userAnswer.length > 0) && (
                    <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 font-mono pointer-events-none">
                      {question.answerSuffix}
                    </span>
                  )}
                  {userAnswer && status === 'running' && (
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
                        onClick={() => setUserAnswer((p) => (p.length >= 14 ? p : p + digit))}
                        disabled={status !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    {[7, 8, 9, 0].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => setUserAnswer((p) => (p.length >= 14 ? p : p + digit))}
                        disabled={status !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
                      disabled={status !== 'running' || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      {tr("Xóa")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserAnswer((p) => p.slice(0, -1))}
                      disabled={status !== 'running' || !userAnswer}
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
                        onClick={() => advanceQuestion(questionIndex + 1, selectedTopic, timeLimit)}
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
                    disabled={status !== 'running'}
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

      {/* Modal cấu hình thời gian Timer cho thử thách */}
      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="page"
          initialPageKey={pageTimerKey}
        />
      )}
    </div>
  );
};
