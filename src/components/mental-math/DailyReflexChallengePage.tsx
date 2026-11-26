/**
 * ============================================================================
 * FILE: DailyReflexChallengePage.tsx — TRANG THỬ THÁCH PHẢN XẠ HÀNG NGÀY (10 CÂU)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình Timer & Modal chỉnh thời gian trả lời từng câu (PHẦN A & B).
 * 2. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN C & D).
 * 3. Quản lý thử thách 10 câu phản xạ trộn nhiều phép tính hoặc tự chọn phép tính (Custom Ops).
 * 4. Đo thời gian phản xạ (ms), ghi nhận thống kê luyện tập hàng ngày, đọc đề TTS và trả lời bằng Giọng nói/Bàn phím ảo.
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
  Clock,
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
import {
  isEditTimerButtonVisible,
  isAutoNextButtonVisible,
  isDifficultLevelChallengeButtonVisible,
} from '../../config/buttonVisibility';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';

// ============================================================================
// PHẦN 0: LOGIC PHẢN XẠ HÀNG NGÀY & LƯU THỐNG KÊ (CODE TRỰC TIẾP TRONG PAGE)
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

type OperationDifficulty = 'normal' | 'hard';
type PercentageMode = 'basic' | 'change' | 'reverse';
type PercentageDifficulty = 'normal' | 'hard';

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

const reflexRandInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const reflexGcd = (a: number, b: number): number => (b === 0 ? a : reflexGcd(b, a % b));

const buildSquareRootHint = (root: number, square: number) => {
  const s = String(square);
  const lastDigit = square % 10;
  const leading = Math.floor(square / 100);
  const tens = Math.floor(root / 10);
  const unit = root % 10;

  if (root <= 30) {
    return {
      hintVi: `${square.toLocaleString()} = ${root} × ${root}. Nhẩm nhanh mốc ${tens * 10}² = ${(tens * 10) ** 2} → hàng chục là ${tens}, tận cùng ${lastDigit} khớp ${unit}².`,
      hintEn: `${square.toLocaleString()} = ${root} × ${root}. Anchor ${tens * 10}² = ${(tens * 10) ** 2} → tens digit ${tens}, ending ${lastDigit} matches ${unit}².`,
    };
  }

  const pairCandidates: Record<number, string> = {
    0: '0',
    1: '1 hoặc 9',
    4: '2 hoặc 8',
    5: '5',
    6: '4 hoặc 6',
    9: '3 hoặc 7',
  };
  const pairCandidatesEn: Record<number, string> = {
    0: '0',
    1: '1 or 9',
    4: '2 or 8',
    5: '5',
    6: '4 or 6',
    9: '3 or 7',
  };

  const threshold = tens * (tens + 1);
  const cmp = leading < threshold ? '<' : '≥';
  return {
    hintVi: `Tách ${s.slice(0, -2)} | ${s.slice(-2)}: Phần đầu ${leading} nằm từ ${tens}² (${tens * tens}) → chọn ${tens}. Đuôi ${lastDigit} → chọn ${pairCandidates[lastDigit] || unit}. So sánh ${leading} ${cmp} ${tens}×${tens + 1}=${threshold} → chọn ${unit} ⇒ ${root}.`,
    hintEn: `Split ${s.slice(0, -2)} | ${s.slice(-2)}: Leading ${leading} fits ${tens}² (${tens * tens}) → ${tens}. Last digit ${lastDigit} → ${pairCandidatesEn[lastDigit] || unit}. Compare ${leading} ${cmp} ${tens}×${tens + 1}=${threshold} → pick ${unit} ⇒ ${root}.`,
  };
};

function generateOperationQuestion(
  operation: ArithmeticOperation,
  topicId: string,
  difficulty: OperationDifficulty = 'normal'
): OperationQuestion {
  const isHard = difficulty === 'hard';

  if (operation === 'division') {
    let mode = topicId;
    if (mode === 'general') {
      const pool = ['div1Digit', 'div5or25', 'div2Digit', 'div3Digit'];
      mode = pool[reflexRandInt(0, pool.length - 1)];
    }

    if (mode === 'div5or25') {
      const isDiv5 = Math.random() < (isHard ? 0.5 : 0.6);
      if (isDiv5) {
        let quotient = isHard ? reflexRandInt(125, 989) : reflexRandInt(14, 480);
        if (isHard && quotient % 10 === 0) quotient += reflexRandInt(1, 9);
        const dividend = quotient * 5;
        return {
          a: dividend,
          b: 5,
          answer: quotient,
          hintVi: `Mẹo chia 5: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
          hintEn: `÷ 5 Trick: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
        };
      }
      let quotient = isHard ? reflexRandInt(64, 398) : reflexRandInt(11, 160);
      if (isHard && quotient % 10 === 0) quotient += reflexRandInt(1, 9);
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
      let divisor = isHard ? reflexRandInt(19, 69) : reflexRandInt(12, 38);
      if (isHard && divisor % 10 === 0) divisor += reflexRandInt(2, 8);
      let quotient = isHard ? reflexRandInt(28, 125) : reflexRandInt(12, 85);
      if (isHard && quotient % 10 === 0) quotient += reflexRandInt(1, 9);
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
      let divisor = isHard ? reflexRandInt(125, 495) : reflexRandInt(105, 295);
      if (divisor % 10 === 0) divisor += reflexRandInt(2, 8);
      let quotient = isHard ? reflexRandInt(12, 58) : reflexRandInt(6, 32);
      if (isHard && quotient % 10 === 0) quotient += reflexRandInt(1, 9);
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

    const divisor = isHard ? reflexRandInt(4, 9) : reflexRandInt(2, 9);
    let quotient = isHard ? reflexRandInt(125, 989) : reflexRandInt(18, 399);
    if (isHard && quotient % 10 === 0) quotient += reflexRandInt(1, 9);
    const dividend = divisor * quotient;
    return {
      a: dividend,
      b: divisor,
      answer: quotient,
      hintVi: `Chia nhẩm từ trái sang phải: ${dividend.toLocaleString()} ÷ ${divisor} = ${quotient.toLocaleString()}`,
      hintEn: `Left-to-right division: ${dividend.toLocaleString()} ÷ ${divisor} = ${quotient.toLocaleString()}`,
    };
  }

  if (operation === 'addition') {
    let mode = topicId;
    if (mode === 'general') {
      const pool = isHard
        ? ['add3Digit', 'add4Digit', 'addComplement']
        : ['add2Digit', 'add3Digit', 'addComplement'];
      mode = pool[reflexRandInt(0, pool.length - 1)];
    }

    if (mode === 'add2Digit') {
      const a = isHard ? reflexRandInt(56, 99) : reflexRandInt(15, 99);
      const b = isHard ? reflexRandInt(56, 99) : reflexRandInt(15, 99);
      const ans = a + b;
      const aTens = Math.floor(a / 10) * 10;
      const aOnes = a % 10;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Từ trái sang: (${aTens} + ${b}) + ${aOnes} = ${aTens + b} + ${aOnes} = ${ans}`,
        hintEn: `Left-to-right: (${aTens} + ${b}) + ${aOnes} = ${aTens + b} + ${aOnes} = ${ans}`,
      };
    }

    if (mode === 'add3Digit') {
      const a = isHard ? reflexRandInt(385, 998) : reflexRandInt(120, 989);
      const b = isHard ? reflexRandInt(385, 998) : reflexRandInt(110, 989);
      const ans = a + b;
      const bHund = Math.floor(b / 100) * 100;
      const bRest = b % 100;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Cộng từ trái: (${a} + ${bHund}) + ${bRest} = ${a + bHund} + ${bRest} = ${ans.toLocaleString()}`,
        hintEn: `Left-to-right: (${a} + ${bHund}) + ${bRest} = ${a + bHund} + ${bRest} = ${ans.toLocaleString()}`,
      };
    }

    if (mode === 'add4Digit') {
      const a = isHard ? reflexRandInt(2450, 9989) : reflexRandInt(1100, 8999);
      const b = isHard ? reflexRandInt(2450, 9989) : reflexRandInt(1100, 8999);
      const ans = a + b;
      const bThou = Math.floor(b / 1000) * 1000;
      const bRest = b % 1000;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Cộng cuốn chiếu: (${a.toLocaleString()} + ${bThou.toLocaleString()}) + ${bRest} = ${ans.toLocaleString()}`,
        hintEn: `Rolling left-to-right: (${a.toLocaleString()} + ${bThou.toLocaleString()}) + ${bRest} = ${ans.toLocaleString()}`,
      };
    }

    const baseRound = isHard ? reflexRandInt(2, 9) * 1000 : reflexRandInt(2, 9) * 100;
    const offset = isHard ? reflexRandInt(1, 9) : reflexRandInt(1, 5);
    const a = baseRound - offset;
    const b = isHard ? reflexRandInt(1235, 6895) : reflexRandInt(115, 685);
    const ans = a + b;
    return {
      a,
      b,
      answer: ans,
      hintVi: `Cộng bù tròn: (${a.toLocaleString()} + ${offset}) + (${b.toLocaleString()} − ${offset}) = ${baseRound.toLocaleString()} + ${(b - offset).toLocaleString()} = ${ans.toLocaleString()}`,
      hintEn: `Round & compensate: (${a.toLocaleString()} + ${offset}) + (${b.toLocaleString()} − ${offset}) = ${baseRound.toLocaleString()} + ${(b - offset).toLocaleString()} = ${ans.toLocaleString()}`,
    };
  }

  if (operation === 'subtraction') {
    let mode = topicId;
    if (mode === 'general') {
      const pool = isHard
        ? ['sub3Digit', 'sub4Digit', 'subPower10']
        : ['sub2Digit', 'sub3Digit', 'subPower10'];
      mode = pool[reflexRandInt(0, pool.length - 1)];
    }

    if (mode === 'sub2Digit') {
      let a = isHard ? reflexRandInt(62, 98) : reflexRandInt(42, 99);
      let b = isHard ? reflexRandInt(27, a - 14) : reflexRandInt(13, a - 5);
      if (isHard && a % 10 >= b % 10) {
        const aUnit = reflexRandInt(1, 5);
        const bUnit = reflexRandInt(aUnit + 2, 9);
        a = reflexRandInt(7, 9) * 10 + aUnit;
        b = reflexRandInt(2, Math.floor((a - 15) / 10)) * 10 + bUnit;
      }
      const ans = a - b;
      const bTens = Math.floor(b / 10) * 10;
      const bOnes = b % 10;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Trừ từ trái sang: (${a} − ${bTens}) − ${bOnes} = ${a - bTens} − ${bOnes} = ${ans}`,
        hintEn: `Left-to-right: (${a} − ${bTens}) − ${bOnes} = ${a - bTens} − ${bOnes} = ${ans}`,
      };
    }

    if (mode === 'sub3Digit') {
      const a = isHard ? reflexRandInt(512, 994) : reflexRandInt(320, 999);
      const b = isHard ? reflexRandInt(248, a - 45) : reflexRandInt(115, a - 25);
      const ans = a - b;
      const roundB = Math.ceil(b / 100) * 100;
      const diff = roundB - b;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Mẹo bù tròn: (${a} − ${roundB}) + ${diff} = ${a - roundB} + ${diff} = ${ans}`,
        hintEn: `Round & add back: (${a} − ${roundB}) + ${diff} = ${a - roundB} + ${diff} = ${ans}`,
      };
    }

    if (mode === 'sub4Digit') {
      const a = isHard ? reflexRandInt(4120, 9989) : reflexRandInt(2500, 9999);
      const b = isHard ? reflexRandInt(1650, a - 320) : reflexRandInt(1100, a - 150);
      const ans = a - b;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Trừ từng hàng từ trái sang phải: ${a.toLocaleString()} − ${b.toLocaleString()} = ${ans.toLocaleString()}`,
        hintEn: `Left-to-right subtraction: ${a.toLocaleString()} − ${b.toLocaleString()} = ${ans.toLocaleString()}`,
      };
    }

    const is100000 = isHard && Math.random() < 0.65;
    const is10000 = !is100000 && (isHard || Math.random() < 0.35);
    const base = is100000 ? 100000 : is10000 ? 10000 : 1000;
    let b = is100000
      ? reflexRandInt(12345, 98765)
      : is10000
      ? reflexRandInt(1234, 9876)
      : reflexRandInt(124, 986);
    if (b % 10 === 0) b += reflexRandInt(1, 9);
    const ans = base - b;
    const digits = String(b).split('').map(Number);
    const compSteps = digits
      .map((d, idx) => (idx === digits.length - 1 ? `10−${d}=${10 - d}` : `9−${d}=${9 - d}`))
      .join(' | ');
    return {
      a: base,
      b,
      answer: ans,
      hintVi: `Quy tắc bù 9 & 10: ${compSteps} ⇒ ${ans.toLocaleString()}`,
      hintEn: `All from 9, last from 10: ${compSteps} ⇒ ${ans.toLocaleString()}`,
    };
  }

  if (operation === 'square-root') {
    let mode = topicId;
    if (mode === 'general') {
      const pool = isHard
        ? ['sqrt4Digit', 'sqrt5Digit']
        : ['sqrtSmall', 'sqrt4Digit', 'sqrt5Digit'];
      mode = pool[reflexRandInt(0, pool.length - 1)];
    }

    let root = 25;
    if (mode === 'sqrtSmall') {
      root = isHard ? reflexRandInt(18, 30) : reflexRandInt(10, 30);
    } else if (mode === 'sqrt4Digit') {
      root = isHard ? reflexRandInt(46, 99) : reflexRandInt(32, 99);
    } else {
      root = isHard ? reflexRandInt(135, 495) : reflexRandInt(100, 295);
    }
    if (isHard && root % 10 === 0) root += reflexRandInt(1, 9);
    const square = root * root;
    const hint = buildSquareRootHint(root, square);
    return {
      a: square,
      answer: root,
      ...hint,
    };
  }

  let mode = topicId;
  if (mode === 'general') {
    const pool = ['powEnd5', 'powSquare2D', 'powCubesAnd2'];
    mode = pool[reflexRandInt(0, pool.length - 1)];
  }

  if (mode === 'powEnd5') {
    const tens = isHard ? reflexRandInt(6, 15) : reflexRandInt(1, 11);
    const base = tens * 10 + 5;
    const ans = base * base;
    return {
      a: base,
      b: 2,
      answer: ans,
      hintVi: `Mẹo số tận cùng 5: ${tens} × (${tens} + 1) = ${tens * (tens + 1)}, ghép thêm 25 ⇒ ${ans.toLocaleString()}`,
      hintEn: `Ending-in-5 trick: ${tens} × (${tens} + 1) = ${tens * (tens + 1)}, append 25 ⇒ ${ans.toLocaleString()}`,
    };
  }

  if (mode === 'powSquare2D') {
    let base = isHard ? reflexRandInt(51, 99) : reflexRandInt(11, 99);
    if (isHard && base % 10 === 0) base += reflexRandInt(1, 9);
    const ans = base * base;
    if (base >= 40 && base <= 60) {
      const d = base - 50;
      return {
        a: base,
        b: 2,
        answer: ans,
        hintVi: `Mốc 50: (25 ${d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`}) = ${25 + d}, ghép ${String(d * d).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
        hintEn: `Near-50 trick: (25 ${d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`}) = ${25 + d}, append ${String(d * d).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
      };
    }
    if (base >= 85 && base <= 99) {
      const d = 100 - base;
      return {
        a: base,
        b: 2,
        answer: ans,
        hintVi: `Mốc 100: (${base} − ${d}) = ${base - d}, ghép ${String(d * d).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
        hintEn: `Near-100 trick: (${base} − ${d}) = ${base - d}, append ${String(d * d).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
      };
    }
    const aTen = Math.floor(base / 10) * 10;
    const aUnit = base % 10;
    return {
      a: base,
      b: 2,
      answer: ans,
      hintVi: `Hằng đẳng thức: ${aTen}² + 2×${aTen}×${aUnit} + ${aUnit}² = ${aTen * aTen} + ${2 * aTen * aUnit} + ${aUnit * aUnit} = ${ans.toLocaleString()}`,
      hintEn: `Identity: ${aTen}² + 2×${aTen}×${aUnit} + ${aUnit}² = ${aTen * aTen} + ${2 * aTen * aUnit} + ${aUnit * aUnit} = ${ans.toLocaleString()}`,
    };
  }

  const choices: Array<[number, number]> = isHard
    ? [
        [2, 10], [2, 11], [2, 12], [2, 13], [2, 14],
        [3, 5], [3, 6], [3, 7],
        [4, 5], [4, 6],
        [5, 4], [5, 5],
        [7, 3], [8, 3], [9, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [18, 3],
      ]
    : [
        [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11], [2, 12],
        [3, 3], [3, 4], [3, 5], [3, 6],
        [4, 3], [4, 4], [4, 5],
        [5, 3], [5, 4],
        [6, 3], [7, 3], [8, 3], [9, 3], [11, 3], [12, 3], [15, 3],
      ];
  const [base, exp] = choices[reflexRandInt(0, choices.length - 1)];
  const ans = Math.pow(base, exp);
  return {
    a: base,
    b: exp,
    answer: ans,
    hintVi: `${base}^${exp} = ${Array(exp).fill(base).join(' × ')} = ${ans.toLocaleString()}`,
    hintEn: `${base}^${exp} = ${Array(exp).fill(base).join(' × ')} = ${ans.toLocaleString()}`,
  };
}

function getOperationSpokenText(
  operation: ArithmeticOperation,
  question: OperationQuestion,
  isVi: boolean
): string {
  if (operation === 'division') {
    return isVi
      ? `${question.a} chia ${question.b}`
      : `${question.a} divided by ${question.b}`;
  }
  if (operation === 'addition') {
    return isVi
      ? `${question.a} cộng ${question.b}`
      : `${question.a} plus ${question.b}`;
  }
  if (operation === 'subtraction') {
    return isVi
      ? `${question.a} trừ ${question.b}`
      : `${question.a} minus ${question.b}`;
  }
  if (operation === 'square-root') {
    return isVi
      ? `căn bậc hai của ${question.a}`
      : `square root of ${question.a}`;
  }
  if (question.b === 2) {
    return isVi ? `${question.a} bình phương` : `${question.a} squared`;
  }
  if (question.b === 3) {
    return isVi ? `${question.a} lập phương` : `${question.a} cubed`;
  }
  return isVi
    ? `${question.a} mũ ${question.b}`
    : `${question.a} to the power of ${question.b}`;
}

function generatePercentageQuestion(
  mode: PercentageMode,
  topicId: string,
  difficulty: PercentageDifficulty = 'normal'
): PercentageQuestion {
  const isHard = difficulty === 'hard';

  if (mode === 'basic') {
    let sub = topicId;
    if (sub === 'general') {
      const pool = isHard ? ['split', 'flip', 'benchmarks'] : ['benchmarks', 'split', 'flip'];
      sub = pool[reflexRandInt(0, pool.length - 1)];
    }

    if (sub === 'benchmarks') {
      const choices = isHard ? [25, 75, 20, 50] : [10, 20, 25, 50, 75];
      const pct = choices[reflexRandInt(0, choices.length - 1)];
      let base = 100;
      if (pct === 10) base = reflexRandInt(12, 98) * 10;
      else if (pct === 20) base = (isHard ? reflexRandInt(42, 248) : reflexRandInt(8, 95)) * 10;
      else if (pct === 25) base = (isHard ? reflexRandInt(45, 245) : reflexRandInt(10, 95)) * 4;
      else if (pct === 50) base = (isHard ? reflexRandInt(125, 985) : reflexRandInt(25, 450)) * 2;
      else base = (isHard ? reflexRandInt(32, 185) : reflexRandInt(8, 75)) * 4;

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
      const y = anchors[reflexRandInt(0, anchors.length - 1)];
      let x = 24;
      if (y === 50) x = reflexRandInt(7, 49) * 2;
      else if (y === 25) x = (isHard ? reflexRandInt(24, 96) : reflexRandInt(6, 36)) * 4;
      else if (y === 20) x = (isHard ? reflexRandInt(22, 95) : reflexRandInt(5, 39)) * 5;
      else x = (isHard ? reflexRandInt(16, 68) : reflexRandInt(4, 24)) * 4;

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
    const pct = splitChoices[reflexRandInt(0, splitChoices.length - 1)];
    const isFiveStep = pct % 5 === 0;
    const base = isFiveStep
      ? (isHard ? reflexRandInt(16, 78) : reflexRandInt(4, 42)) * 20
      : (isHard ? reflexRandInt(9, 44) : reflexRandInt(3, 24)) * 50;
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
      sub = pool[reflexRandInt(0, pool.length - 1)];
    }

    if (sub === 'discount') {
      const prices = isHard
        ? [480, 640, 720, 840, 960, 1200, 1500, 1800, 2400, 3200, 3600, 4800]
        : [200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000];
      const pcts = isHard ? [15, 35, 45, 65] : [15, 20, 25, 30, 40];
      let price = prices[reflexRandInt(0, prices.length - 1)];
      const pct = pcts[reflexRandInt(0, pcts.length - 1)];
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
    const pct = pctChoices[reflexRandInt(0, pctChoices.length - 1)];
    const step = 100 / reflexGcd(pct, 100);
    const base = isHard
      ? step * reflexRandInt(16, Math.min(90, Math.floor(2400 / step)))
      : step * reflexRandInt(4, Math.min(45, Math.floor(900 / step)));
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
    sub = pool[reflexRandInt(0, pool.length - 1)];
  }

  if (sub === 'findRate') {
    const pcts = isHard
      ? [12, 15, 18, 24, 35, 45, 65, 75, 85]
      : [5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80];
    const pct = pcts[reflexRandInt(0, pcts.length - 1)];
    const step = 100 / reflexGcd(pct, 100);
    const whole = isHard
      ? step * reflexRandInt(6, Math.min(45, Math.floor(2000 / step)))
      : step * reflexRandInt(2, Math.min(25, Math.floor(800 / step)));
    const part = (pct * whole) / 100;

    return {
      mode,
      displayVi: [
        { text: part.toLocaleString() },
        { text: '=' },
        { text: '?%', accent: true },
        { text: 'của' },
        { text: whole.toLocaleString() },
      ],
      displayEn: [
        { text: part.toLocaleString() },
        { text: '=' },
        { text: '?%', accent: true },
        { text: 'of' },
        { text: whole.toLocaleString() },
      ],
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
    const pct = pcts[reflexRandInt(0, pcts.length - 1)];
    const step = 100 / reflexGcd(pct, 100);
    const base = isHard
      ? step * reflexRandInt(8, Math.min(60, Math.floor(1800 / step)))
      : step * reflexRandInt(3, Math.min(30, Math.floor(600 / step)));
    const delta = (base * pct) / 100;
    const next = base + delta;

    return {
      mode,
      displayVi: [
        { text: base.toLocaleString() },
        { text: '→', accent: true },
        { text: next.toLocaleString() },
        { text: '(+?%)', accent: true },
      ],
      displayEn: [
        { text: base.toLocaleString() },
        { text: '→', accent: true },
        { text: next.toLocaleString() },
        { text: '(+?%)', accent: true },
      ],
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

  const pcts = isHard
    ? [15, 25, 35, 45, 65, 75, 85]
    : [10, 20, 25, 30, 40, 50, 60, 75, 80];
  const pct = pcts[reflexRandInt(0, pcts.length - 1)];
  const step = 100 / reflexGcd(pct, 100);
  const whole = isHard
    ? step * reflexRandInt(10, Math.min(55, Math.floor(2400 / step)))
    : step * reflexRandInt(3, Math.min(28, Math.floor(900 / step)));
  const part = (pct * whole) / 100;

  return {
    mode,
    displayVi: [
      { text: `${pct}%`, accent: true },
      { text: 'của' },
      { text: '?', accent: true },
      { text: '=' },
      { text: part.toLocaleString() },
    ],
    displayEn: [
      { text: `${pct}%`, accent: true },
      { text: 'of' },
      { text: '?', accent: true },
      { text: '=' },
      { text: part.toLocaleString() },
    ],
    labelVi: `${pct}% của ? = ${part.toLocaleString()}`,
    labelEn: `${pct}% of ? = ${part.toLocaleString()}`,
    spokenVi: `${pct} phần trăm của bao nhiêu bằng ${part}`,
    spokenEn: `${pct} percent of what number equals ${part}`,
    answer: whole,
    hintVi: `Số gốc 100% = (${part} ÷ ${pct}) × 100 = ${whole.toLocaleString()}`,
    hintEn: `Base 100% = (${part} ÷ ${pct}) × 100 = ${whole.toLocaleString()}`,
  };
}

type ReflexOperation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'square-root'
  | 'exponent'
  | 'percentage';

type DailyReflexMode = 'dailyMix' | 'fastFour' | 'advanced' | 'custom';
type DailyReflexDifficulty = 'normal' | 'hard';

interface DailyReflexQuestion {
  operation: ReflexOperation;
  kind: 'binary' | 'sqrt' | 'power' | 'tokens';
  a: number;
  b?: number;
  opChar?: string;
  displayVi?: DisplayToken[];
  displayEn?: DisplayToken[];
  opLabelVi: string;
  opLabelEn: string;
  labelVi: string;
  labelEn: string;
  spokenVi: string;
  spokenEn: string;
  answer: number;
  answerSuffix?: string;
  hintVi: string;
  hintEn: string;
}

interface ReflexOperationMeta {
  id: ReflexOperation;
  symbol: string;
  labelVi: string;
  labelEn: string;
}

const REFLEX_OPERATIONS: ReflexOperationMeta[] = [
  { id: 'addition', symbol: '+', labelVi: 'Phép cộng', labelEn: 'Addition' },
  { id: 'subtraction', symbol: '−', labelVi: 'Phép trừ', labelEn: 'Subtraction' },
  { id: 'multiplication', symbol: '×', labelVi: 'Phép nhân', labelEn: 'Multiplication' },
  { id: 'division', symbol: '÷', labelVi: 'Phép chia', labelEn: 'Division' },
  { id: 'square-root', symbol: '√', labelVi: 'Căn bậc 2', labelEn: 'Square Root' },
  { id: 'exponent', symbol: 'xⁿ', labelVi: 'Lũy thừa', labelEn: 'Exponents' },
  { id: 'percentage', symbol: '%', labelVi: 'Tỷ lệ %', labelEn: 'Percentage' },
];

interface DailyReflexModeMeta {
  id: DailyReflexMode;
  icon: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

const DAILY_REFLEX_MODES: DailyReflexModeMeta[] = [
  {
    id: 'dailyMix',
    icon: '🎯',
    labelVi: 'Hỗn hợp hàng ngày',
    labelEn: 'Daily Full Mix',
    badgeVi: 'Phản xạ tổng hợp: Cộng · Trừ · Nhân · Chia · Căn · Lũy thừa · %',
    badgeEn: 'Full Daily Reflex: + · − · × · ÷ · √ · xⁿ · %',
  },
  {
    id: 'fastFour',
    icon: '⚡',
    labelVi: 'Tứ phép siêu tốc',
    labelEn: 'Fast 4 Ops (+−×÷)',
    badgeVi: 'Phản xạ tốc độ cao: Cộng · Trừ · Nhân · Chia',
    badgeEn: 'Rapid Reflex: Addition · Subtraction · Multiplication · Division',
  },
  {
    id: 'advanced',
    icon: '🧠',
    labelVi: 'Phản xạ nâng cao',
    labelEn: 'Advanced Mix',
    badgeVi: 'Nâng cao: Nhân 2CS · Chia lớn · Căn bậc 2 · Lũy thừa · Tỷ lệ %',
    badgeEn: 'Advanced Mix: 2D Multiply · Division · Roots · Powers · %',
  },
  {
    id: 'custom',
    icon: '🎛️',
    labelVi: 'Tùy chỉnh phép tính',
    labelEn: 'Custom Operations',
    badgeVi: 'Bài luyện tự chọn theo danh sách phép tính đã bật',
    badgeEn: 'Custom Daily Reflex using your selected operations',
  },
];

function generateMultiplicationReflexQuestion(
  difficulty: DailyReflexDifficulty
): DailyReflexQuestion {
  const isHard = difficulty === 'hard';
  const variant = isHard ? reflexRandInt(0, 4) : reflexRandInt(0, 4);

  let a = 12;
  let b = 11;
  let hintVi = '';
  let hintEn = '';

  if (variant === 0) {
    a = isHard ? reflexRandInt(125, 985) : reflexRandInt(14, 98);
    b = 11;
    const ans = a * 11;
    if (a < 100) {
      const t = Math.floor(a / 10);
      const u = a % 10;
      hintVi = `Mẹo nhân 11: Giữ ${t} và ${u}, cộng giữa ${t}+${u}=${t + u} ⇒ ${ans.toLocaleString()}`;
      hintEn = `×11 trick: Keep ${t} & ${u}, middle ${t}+${u}=${t + u} ⇒ ${ans.toLocaleString()}`;
    } else {
      hintVi = `Mẹo nhân 11: ${a.toLocaleString()} × 10 + ${a.toLocaleString()} = ${ans.toLocaleString()}`;
      hintEn = `×11 trick: ${a.toLocaleString()} × 10 + ${a.toLocaleString()} = ${ans.toLocaleString()}`;
    }
    return {
      operation: 'multiplication',
      kind: 'binary',
      a,
      b,
      opChar: '×',
      opLabelVi: 'Phép nhân',
      opLabelEn: 'Multiplication',
      labelVi: `${a.toLocaleString()} × 11`,
      labelEn: `${a.toLocaleString()} × 11`,
      spokenVi: `${a} nhân 11`,
      spokenEn: `${a} times 11`,
      answer: ans,
      hintVi,
      hintEn,
    };
  }

  if (variant === 1) {
    a = isHard ? reflexRandInt(25, 199) : reflexRandInt(12, 95);
    b = 99;
    const ans = a * 99;
    return {
      operation: 'multiplication',
      kind: 'binary',
      a,
      b,
      opChar: '×',
      opLabelVi: 'Phép nhân',
      opLabelEn: 'Multiplication',
      labelVi: `${a.toLocaleString()} × 99`,
      labelEn: `${a.toLocaleString()} × 99`,
      spokenVi: `${a} nhân 99`,
      spokenEn: `${a} times 99`,
      answer: ans,
      hintVi: `Mẹo nhân 99: (${a} × 100) − ${a} = ${(a * 100).toLocaleString()} − ${a} = ${ans.toLocaleString()}`,
      hintEn: `×99 trick: (${a} × 100) − ${a} = ${(a * 100).toLocaleString()} − ${a} = ${ans.toLocaleString()}`,
    };
  }

  if (variant === 2) {
    const t = isHard ? reflexRandInt(4, 9) : reflexRandInt(2, 8);
    const u1 = reflexRandInt(1, 9);
    const u2 = 10 - u1;
    a = t * 10 + u1;
    b = t * 10 + u2;
    const ans = a * b;
    return {
      operation: 'multiplication',
      kind: 'binary',
      a,
      b,
      opChar: '×',
      opLabelVi: 'Phép nhân',
      opLabelEn: 'Multiplication',
      labelVi: `${a} × ${b}`,
      labelEn: `${a} × ${b}`,
      spokenVi: `${a} nhân ${b}`,
      spokenEn: `${a} times ${b}`,
      answer: ans,
      hintVi: `Cùng hàng chục ${t}, đuôi cộng bằng 10: ${t}×(${t}+1)=${t * (t + 1)}, ghép ${u1}×${u2}=${String(u1 * u2).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
      hintEn: `Same tens ${t}, units sum to 10: ${t}×${t + 1}=${t * (t + 1)}, append ${String(u1 * u2).padStart(2, '0')} ⇒ ${ans.toLocaleString()}`,
    };
  }

  if (variant === 3) {
    a = isHard ? reflexRandInt(125, 989) : reflexRandInt(24, 198);
    b = isHard ? reflexRandInt(4, 9) : reflexRandInt(3, 9);
    const ans = a * b;
    return {
      operation: 'multiplication',
      kind: 'binary',
      a,
      b,
      opChar: '×',
      opLabelVi: 'Phép nhân',
      opLabelEn: 'Multiplication',
      labelVi: `${a.toLocaleString()} × ${b}`,
      labelEn: `${a.toLocaleString()} × ${b}`,
      spokenVi: `${a} nhân ${b}`,
      spokenEn: `${a} times ${b}`,
      answer: ans,
      hintVi: `Nhân tách từ trái sang phải: ${a.toLocaleString()} × ${b} = ${ans.toLocaleString()}`,
      hintEn: `Left-to-right multiply: ${a.toLocaleString()} × ${b} = ${ans.toLocaleString()}`,
    };
  }

  a = isHard ? reflexRandInt(32, 96) : reflexRandInt(14, 58);
  b = isHard ? reflexRandInt(24, 89) : reflexRandInt(12, 46);
  const ans = a * b;
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b % 10;
  return {
    operation: 'multiplication',
    kind: 'binary',
    a,
    b,
    opChar: '×',
    opLabelVi: 'Phép nhân',
    opLabelEn: 'Multiplication',
    labelVi: `${a} × ${b}`,
    labelEn: `${a} × ${b}`,
    spokenVi: `${a} nhân ${b}`,
    spokenEn: `${a} times ${b}`,
    answer: ans,
    hintVi: `Tách nhân: (${a} × ${bTens}) + (${a} × ${bOnes}) = ${a * bTens} + ${a * bOnes} = ${ans.toLocaleString()}`,
    hintEn: `Split: (${a} × ${bTens}) + (${a} × ${bOnes}) = ${a * bTens} + ${a * bOnes} = ${ans.toLocaleString()}`,
  };
}

function generateDailyReflexQuestion(
  mode: DailyReflexMode,
  difficulty: DailyReflexDifficulty = 'normal',
  customOps?: ReflexOperation[]
): DailyReflexQuestion {
  let pool: ReflexOperation[];
  if (mode === 'fastFour') {
    pool = ['addition', 'subtraction', 'multiplication', 'division'];
  } else if (mode === 'advanced') {
    pool = ['multiplication', 'division', 'square-root', 'exponent', 'percentage'];
  } else if (mode === 'custom') {
    pool =
      customOps && customOps.length > 0
        ? customOps
        : ['addition', 'subtraction', 'multiplication', 'division'];
  } else {
    pool = [
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'square-root',
      'exponent',
      'percentage',
    ];
  }

  const chosen = pool[reflexRandInt(0, pool.length - 1)];

  if (chosen === 'multiplication') {
    return generateMultiplicationReflexQuestion(difficulty);
  }

  if (chosen === 'percentage') {
    const pctModes: PercentageMode[] = ['basic', 'change', 'reverse'];
    const pctMode = pctModes[reflexRandInt(0, pctModes.length - 1)];
    const pq = generatePercentageQuestion(pctMode, 'general', difficulty);
    return {
      operation: 'percentage',
      kind: 'tokens',
      a: pq.answer,
      displayVi: pq.displayVi,
      displayEn: pq.displayEn,
      opLabelVi: 'Tỷ lệ %',
      opLabelEn: 'Percentage',
      labelVi: pq.labelVi,
      labelEn: pq.labelEn,
      spokenVi: pq.spokenVi,
      spokenEn: pq.spokenEn,
      answer: pq.answer,
      answerSuffix: pq.answerSuffix,
      hintVi: pq.hintVi,
      hintEn: pq.hintEn,
    };
  }

  const q = generateOperationQuestion(chosen, 'general', difficulty);
  const spokenVi = getOperationSpokenText(chosen, q, true);
  const spokenEn = getOperationSpokenText(chosen, q, false);

  if (chosen === 'square-root') {
    return {
      operation: 'square-root',
      kind: 'sqrt',
      a: q.a,
      opLabelVi: 'Căn bậc 2',
      opLabelEn: 'Square Root',
      labelVi: `√${q.a.toLocaleString()}`,
      labelEn: `√${q.a.toLocaleString()}`,
      spokenVi,
      spokenEn,
      answer: q.answer,
      hintVi: q.hintVi,
      hintEn: q.hintEn,
    };
  }

  if (chosen === 'exponent') {
    const exp = q.b ?? 2;
    return {
      operation: 'exponent',
      kind: 'power',
      a: q.a,
      b: exp,
      opLabelVi: 'Lũy thừa',
      opLabelEn: 'Exponents',
      labelVi: `${q.a.toLocaleString()}^${exp}`,
      labelEn: `${q.a.toLocaleString()}^${exp}`,
      spokenVi,
      spokenEn,
      answer: q.answer,
      hintVi: q.hintVi,
      hintEn: q.hintEn,
    };
  }

  const opChar = chosen === 'addition' ? '+' : chosen === 'subtraction' ? '−' : '÷';
  const opMeta = REFLEX_OPERATIONS.find((o) => o.id === chosen)!;

  return {
    operation: chosen,
    kind: 'binary',
    a: q.a,
    b: q.b,
    opChar,
    opLabelVi: opMeta.labelVi,
    opLabelEn: opMeta.labelEn,
    labelVi: `${q.a.toLocaleString()} ${opChar} ${q.b?.toLocaleString() ?? ''}`,
    labelEn: `${q.a.toLocaleString()} ${opChar} ${q.b?.toLocaleString() ?? ''}`,
    spokenVi,
    spokenEn,
    answer: q.answer,
    hintVi: q.hintVi,
    hintEn: q.hintEn,
  };
}

const STATS_STORAGE_KEY = 'daily_mental_math_reflex_stats_v1';
const STATS_UPDATE_EVENT = 'daily-reflex-stats-updated';

interface DailyReflexStats {
  todayDate: string;
  todayCompleted: number;
  todayCorrect: number;
  todayTotalMs: number;
  dailyGoal: number;
  streakDays: number;
  lastGoalMetDate: string | null;
  lastActiveDate: string | null;
  bestReactionMs: number | null;
  totalSolvedAllTime: number;
}

const getLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getYesterdayDateKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
};

const createFreshStats = (): DailyReflexStats => ({
  todayDate: getLocalDateKey(),
  todayCompleted: 0,
  todayCorrect: 0,
  todayTotalMs: 0,
  dailyGoal: 20,
  streakDays: 0,
  lastGoalMetDate: null,
  lastActiveDate: null,
  bestReactionMs: null,
  totalSolvedAllTime: 0,
});

const getDailyReflexStats = (): DailyReflexStats => {
  if (typeof window === 'undefined') return createFreshStats();
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return createFreshStats();
    const parsed = JSON.parse(raw) as Partial<DailyReflexStats>;
    const isSameDay = parsed.todayDate === today;

    let streakDays = typeof parsed.streakDays === 'number' ? parsed.streakDays : 0;
    const lastGoalMetDate = parsed.lastGoalMetDate || null;
    if (
      lastGoalMetDate &&
      lastGoalMetDate !== today &&
      lastGoalMetDate !== yesterday
    ) {
      streakDays = 0;
    }

    return {
      todayDate: today,
      todayCompleted: isSameDay ? Number(parsed.todayCompleted || 0) : 0,
      todayCorrect: isSameDay ? Number(parsed.todayCorrect || 0) : 0,
      todayTotalMs: isSameDay ? Number(parsed.todayTotalMs || 0) : 0,
      dailyGoal:
        typeof parsed.dailyGoal === 'number' && parsed.dailyGoal >= 5
          ? parsed.dailyGoal
          : 20,
      streakDays,
      lastGoalMetDate,
      lastActiveDate: parsed.lastActiveDate || null,
      bestReactionMs:
        typeof parsed.bestReactionMs === 'number' && parsed.bestReactionMs > 0
          ? parsed.bestReactionMs
          : null,
      totalSolvedAllTime: Number(parsed.totalSolvedAllTime || 0),
    };
  } catch {
    return createFreshStats();
  }
};

const writeStats = (next: DailyReflexStats) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(STATS_UPDATE_EVENT));
  } catch {
    // ignore storage errors
  }
};

const recordDailyReflexAttempt = (
  isCorrect: boolean,
  reactionMs: number
): DailyReflexStats => {
  const current = getDailyReflexStats();
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();

  const nextCompleted = current.todayCompleted + 1;
  const nextCorrect = current.todayCorrect + (isCorrect ? 1 : 0);
  const clampedMs = Math.max(200, Math.min(120000, Math.round(reactionMs)));
  const nextTotalMs = current.todayTotalMs + clampedMs;

  let nextStreak = current.streakDays;
  let nextLastGoalMetDate = current.lastGoalMetDate;

  if (nextCompleted >= current.dailyGoal && current.lastGoalMetDate !== today) {
    nextStreak =
      current.lastGoalMetDate === yesterday ? current.streakDays + 1 : 1;
    nextLastGoalMetDate = today;
  }

  const nextBestMs =
    isCorrect &&
    (current.bestReactionMs === null || clampedMs < current.bestReactionMs)
      ? clampedMs
      : current.bestReactionMs;

  const updated: DailyReflexStats = {
    ...current,
    todayDate: today,
    todayCompleted: nextCompleted,
    todayCorrect: nextCorrect,
    todayTotalMs: nextTotalMs,
    streakDays: nextStreak,
    lastGoalMetDate: nextLastGoalMetDate,
    lastActiveDate: today,
    bestReactionMs: nextBestMs,
    totalSolvedAllTime: current.totalSolvedAllTime + 1,
  };

  writeStats(updated);
  return updated;
};

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

interface DailyReflexChallengePageProps {
  initialMode?: DailyReflexMode;
  initialCustomOps?: ReflexOperation[];
  onBack: () => void;
  onOpenHardChallenge?: (mode?: DailyReflexMode, customOps?: ReflexOperation[]) => void;
  isHard?: boolean;
}

type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
const TOTAL_QUESTIONS = 10;

const DEFAULT_CUSTOM_OPS: ReflexOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

interface HistoryItem {
  qIndex: number;
  label: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  reactionMs: number;
}

// ============================================================================
// PHẦN E: COMPONENT CHÍNH THỬ THÁCH PHẢN XẠ HÀNG NGÀY (DailyReflexChallengePage)
// ============================================================================
export const DailyReflexChallengePage: React.FC<DailyReflexChallengePageProps> = ({
  initialMode = 'dailyMix',
  initialCustomOps,
  onBack,
  onOpenHardChallenge,
  isHard = false,
}) => {
  // --- Khởi tạo ngôn ngữ, chế độ Thường/Khó, cấu hình Timer & Auto-Next ---
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const hardMode = isHard;
  const difficulty = hardMode ? 'hard' : 'normal';
  const timerConfig = useMentalMathTimerConfig('DailyReflexChallengePage');
  const autoNextConfig = useMentalMathAutoNextConfig('DailyReflexChallengePage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('DailyReflexChallengePage');
  const showEditTimerButton = isEditTimerButtonVisible('DailyReflexChallengePage');

  // --- State quản lý chế độ phản xạ, danh sách phép tính tự chọn & lịch sử 10 câu ---
  const [selectedMode, setSelectedMode] = useState<DailyReflexMode>(initialMode);
  const [customOps, setCustomOps] = useState<ReflexOperation[]>(
    initialCustomOps && initialCustomOps.length > 0
      ? initialCustomOps
      : DEFAULT_CUSTOM_OPS
  );
  const [timeLimit, setTimeLimit] = useState<number>(timerConfig.defaultLimit);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<DailyReflexQuestion>(() =>
    generateDailyReflexQuestion(
      initialMode,
      difficulty,
      initialCustomOps && initialCustomOps.length > 0
        ? initialCustomOps
        : DEFAULT_CUSTOM_OPS
    )
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerConfig.defaultLimit);
  const [feedback, setFeedback] = useState<
    'idle' | 'correct' | 'incorrect' | 'timeout'
  >('idle');
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
      if (saved && [1.25, 1.5, 1.75].includes(parseFloat(saved))) {
        return parseFloat(saved);
      }
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
  const questionRef = useRef<DailyReflexQuestion>(question);
  const statusRef = useRef<GameStatus>(status);
  const questionIndexRef = useRef<number>(questionIndex);
  const selectedModeRef = useRef<DailyReflexMode>(selectedMode);
  const customOpsRef = useRef<ReflexOperation[]>(customOps);
  const timeLimitRef = useRef<number>(timeLimit);
  const questionStartRef = useRef<number>(Date.now());

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
    selectedModeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    customOpsRef.current = customOps;
  }, [customOps]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

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

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = isVi
        ? questionRef.current.spokenVi
        : questionRef.current.spokenEn;
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

  // --- Chuyển sang câu tiếp theo (hoặc kết thúc 10 câu) và bật đếm ngược tốc độ phản xạ ---
  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      modeOverride?: DailyReflexMode,
      limitOverride?: number,
      opsOverride?: ReflexOperation[]
    ) => {
      clearTimers();
      if (nextIdx > TOTAL_QUESTIONS) {
        setStatus('completed');
        statusRef.current = 'completed';
        stopListening();
        return;
      }

      const activeMode = modeOverride ?? selectedModeRef.current;
      const activeLimit = limitOverride ?? timeLimitRef.current;
      const activeOps = opsOverride ?? customOpsRef.current;
      const nextQ = generateDailyReflexQuestion(activeMode, difficulty, activeOps);

      setQuestionIndex(nextIdx);
      questionIndexRef.current = nextIdx;
      setQuestion(nextQ);
      questionRef.current = nextQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setTimeLeft(activeLimit);
      questionStartRef.current = Date.now();
      setStatus('running');
      statusRef.current = 'running';
      setTimeout(() => inputRef.current?.focus(), 50);

      const endTime = Date.now() + activeLimit * 1000;
      timerRef.current = window.setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          clearTimers();
          stopListening();
          const reactionMs = activeLimit * 1000;
          recordDailyReflexAttempt(false, reactionMs);
          setStatus('answered');
          statusRef.current = 'answered';
          setFeedback('timeout');
          setIncorrectCount((c) => c + 1);
          setStreak(0);
          setWrongStreak((w) => w + 1);
          setHistory((h) => [
            ...h,
            {
              qIndex: nextIdx,
              label: isVi ? nextQ.labelVi : nextQ.labelEn,
              userAnswer: tr("Hết giờ"),
              correctAnswer: `${nextQ.answer.toLocaleString()}${nextQ.answerSuffix || ''}`,
              isCorrect: false,
              reactionMs,
            },
          ]);
          if (isSpeakerEnabled) {
            triggerAnnouncement(false, nextQ.answer);
          }
          const delayMs = Math.round(autoNextDelayRef.current * 1000);
          if (delayMs > 0) {
            autoNextRef.current = window.setTimeout(() => {
              advanceQuestion(nextIdx + 1, activeMode, activeLimit, activeOps);
            }, delayMs);
          }
        }
      }, 50);
    },
    [clearTimers, difficulty, isSpeakerEnabled, isVi, stopListening, triggerAnnouncement]
  );

  const startChallenge = (
    modeOverride?: DailyReflexMode,
    limitOverride?: number,
    opsOverride?: ReflexOperation[]
  ) => {
    const activeMode = modeOverride ?? selectedModeRef.current;
    const activeLimit = limitOverride ?? timeLimitRef.current;
    const activeOps = opsOverride ?? customOpsRef.current;
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, activeMode, activeLimit, activeOps);
  };

  const handleReset = () => {
    clearTimers();
    stopCurrentSpeech();
    stopListening();
    setStatus('idle');
    statusRef.current = 'idle';
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
    setTimeLeft(timeLimit);
    const nextQ = generateDailyReflexQuestion(selectedMode, difficulty, customOps);
    setQuestion(nextQ);
    questionRef.current = nextQ;
  };

  // --- Chấm điểm đáp án, ghi nhận thời gian phản xạ (ms) và lên lịch tự chuyển câu ---
  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (statusRef.current !== 'running') return;
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      clearTimers();
      stopListening();

      const qCur = questionRef.current;
      const curIdx = questionIndexRef.current;
      const reactionMs = Date.now() - questionStartRef.current;
      const isCorrect = parsed === qCur.answer;

      recordDailyReflexAttempt(isCorrect, reactionMs);
      setStatus('answered');
      statusRef.current = 'answered';
      setFeedback(isCorrect ? 'correct' : 'incorrect');

      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((st) => st + 1);
        setWrongStreak(0);
      } else {
        setIncorrectCount((c) => c + 1);
        setStreak(0);
        setWrongStreak((w) => w + 1);
      }

      setHistory((h) => [
        ...h,
        {
          qIndex: curIdx,
          label: isVi ? qCur.labelVi : qCur.labelEn,
          userAnswer: `${parsed.toLocaleString()}${qCur.answerSuffix || ''}`,
          correctAnswer: `${qCur.answer.toLocaleString()}${qCur.answerSuffix || ''}`,
          isCorrect,
          reactionMs,
        },
      ]);

      if (isSpeakerEnabled) {
        triggerAnnouncement(isCorrect, qCur.answer);
      }

      const delayMs = Math.round(autoNextDelayRef.current * 1000);
      if (delayMs > 0) {
        autoNextRef.current = window.setTimeout(() => {
          advanceQuestion(curIdx + 1);
        }, delayMs);
      }
    },
    [advanceQuestion, clearTimers, isSpeakerEnabled, isVi, stopListening, triggerAnnouncement]
  );

  // --- Bật/tắt nhận diện giọng nói (Web Speech API) để trả lời bằng micro ---
  const toggleVoice = () => {
    if (status !== 'running') return;
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

  // --- Bật/tắt từng phép toán trong chế độ Phản xạ Tự chọn (Custom Ops) ---
  const toggleCustomOperation = (op: ReflexOperation) => {
    if (status === 'running') return;
    const exists = customOps.includes(op);
    if (exists && customOps.length <= 1) return;
    const nextOps = exists
      ? customOps.filter((o) => o !== op)
      : [...customOps, op];
    setCustomOps(nextOps);
    customOpsRef.current = nextOps;
    if (selectedMode === 'custom' && (status === 'idle' || status === 'completed')) {
      const nextQ = generateDailyReflexQuestion('custom', difficulty, nextOps);
      setQuestion(nextQ);
      questionRef.current = nextQ;
    }
  };

  const currentModeMeta =
    DAILY_REFLEX_MODES.find((m) => m.id === selectedMode) || DAILY_REFLEX_MODES[0];
  const isUrgent = timeLeft <= (timeLimit <= 4 ? 1 : timeLimit <= 8 ? 2 : 3);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const avgHistorySec =
    history.length > 0
      ? (
          history.reduce((sum, item) => sum + item.reactionMs, 0) /
          history.length /
          1000
        ).toFixed(1)
      : '0.0';

  // Hàm render công thức câu hỏi Phản xạ (Căn bậc 2, Lũy thừa, Tokens định dạng sẵn hoặc Phép tính 2 vế a op b) — code trực tiếp trong Page
  const renderDailyReflexFormula = () => {
    if (question.kind === 'sqrt') {
      const aStr = question.a.toLocaleString();
      const sizeClass =
        aStr.length >= 6
          ? 'text-2xl sm:text-4xl lg:text-5xl'
          : 'text-3xl sm:text-5xl lg:text-6xl';
      return (
        <div
          className={`${sizeClass} font-black text-white tracking-tight font-mono flex items-center justify-center whitespace-nowrap leading-tight`}
        >
          <span className="text-yellow-400 mr-1.5 font-sans">√</span>
          <span className="border-t-4 border-yellow-300/80 pt-1 px-1.5 whitespace-nowrap tabular-nums">
            {aStr}
          </span>
        </div>
      );
    }

    if (question.kind === 'power') {
      const aStr = question.a.toLocaleString();
      const expStr = String(question.b ?? 2);
      return (
        <div className="text-3xl sm:text-5xl font-black text-white tracking-normal font-mono flex items-start justify-center leading-tight tabular-nums">
          <span>{aStr}</span>
          <sup className="text-yellow-400 text-xl sm:text-3xl ml-0.5 mt-1 font-extrabold">
            {expStr}
          </sup>
        </div>
      );
    }

    if (question.kind === 'tokens') {
      const tokens = isVi ? question.displayVi || [] : question.displayEn || [];
      const joinedLen = tokens.map((t) => t.text).join(' ').length;
      const sizeClass =
        joinedLen >= 18
          ? 'text-xl sm:text-2xl lg:text-[2rem]'
          : joinedLen >= 14
          ? 'text-2xl sm:text-3xl lg:text-4xl'
          : 'text-2xl sm:text-4xl lg:text-[2.75rem]';
      return (
        <div
          className={`${sizeClass} font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-tight max-w-full`}
        >
          {tokens.map((tok, idx) => (
            <span
              key={idx}
              className={`whitespace-nowrap tabular-nums ${
                tok.accent ? 'text-yellow-400' : 'text-white'
              }`}
            >
              {tok.text}
            </span>
          ))}
        </div>
      );
    }

    const aStr = question.a.toLocaleString();
    const bStr = question.b?.toLocaleString() ?? '';
    const totalChars = aStr.length + bStr.length;
    const sizeClass =
      totalChars >= 12
        ? 'text-xl sm:text-2xl lg:text-3xl'
        : totalChars >= 9
        ? 'text-2xl sm:text-3xl lg:text-4xl'
        : totalChars >= 7
        ? 'text-3xl sm:text-4xl lg:text-[2.75rem]'
        : 'text-3xl sm:text-5xl';

    return (
      <div
        className={`${sizeClass} font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight tabular-nums`}
      >
        <span className="whitespace-nowrap">{aStr}</span>
        <span className="text-yellow-400 font-sans">{question.opChar || '+'}</span>
        <span className="whitespace-nowrap">{bStr}</span>
      </div>
    );
  };

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
          {isDifficultLevelChallengeButtonVisible('DailyReflexChallengePage') && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                clearTimers();
                stopCurrentSpeech();
                stopListening();
                onOpenHardChallenge(selectedMode, customOps);
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
              <span>
                {tr("Thử Thách Phản Xạ Hàng Ngày")}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Khung chứa toàn bộ giao diện Thử thách Phản xạ Hàng ngày */}
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

        {/* Thanh tiêu đề, chọn mốc giây Timer, nút Auto-Next và bật/tắt Loa */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
                hardMode
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/25'
              }`}
            >
              {hardMode ? (
                <Flame className="w-5 h-5 fill-yellow-200 text-yellow-200" />
              ) : (
                <Zap className="w-5 h-5 fill-slate-950" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>
                  {tr("Thử Thách Tính Nhẩm")}
                </span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                  {isVi ? currentModeMeta.labelVi : currentModeMeta.labelEn}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isVi ? currentModeMeta.badgeVi : currentModeMeta.badgeEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="hidden sm:inline">
                  {tr("Thời gian:")}
                </span>
              </span>
              {timerConfig.limitOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={status === 'running'}
                  onClick={() => {
                    setTimeLimit(sec);
                    timeLimitRef.current = sec;
                    if (status === 'idle') setTimeLeft(sec);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 tabular-nums ${
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
                  title={
                    tr("Chỉnh sửa Timer (Trang này / Toàn Tab)")
                  }
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
                  initialPageKey={"DailyReflexChallengePage"}
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
              title={
                isSpeakerEnabled
                  ? tr("Âm thanh: BẬT")
                  : tr("Âm thanh: TẮT")
              }
            >
              {isSpeakerEnabled ? (
                <Volume2
                  className={`w-4 h-4 text-yellow-400 ${
                    isSpeaking ? 'animate-bounce' : ''
                  }`}
                />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Bộ chọn chế độ phản xạ và danh sách phép tính bật nếu chọn Custom */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            {DAILY_REFLEX_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={status === 'running'}
                onClick={() => {
                  setSelectedMode(m.id);
                  selectedModeRef.current = m.id;
                  if (status === 'idle' || status === 'completed') {
                    const nextQ = generateDailyReflexQuestion(
                      m.id,
                      difficulty,
                      customOps
                    );
                    setQuestion(nextQ);
                    questionRef.current = nextQ;
                  }
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                  selectedMode === m.id
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-base">{m.icon}</span>
                <span className="truncate">{isVi ? m.labelVi : m.labelEn}</span>
              </button>
            ))}
          </div>

          {selectedMode === 'custom' && (
            <div className="p-2 bg-slate-950/75 rounded-2xl border border-yellow-500/25 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5">
                {tr("Phép tính bật:")}
              </span>
              {REFLEX_OPERATIONS.map((op) => {
                const active = customOps.includes(op.id);
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={status === 'running'}
                    onClick={() => toggleCustomOperation(op.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border disabled:opacity-60 ${
                      active
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/60'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold">{op.symbol}</span>
                    <span>{isVi ? op.labelVi : op.labelEn}</span>
                  </button>
                );
              })}
            </div>
          )}
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
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums">
                {streak} {streak >= 3 && '🔥'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tabular-nums">
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
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono tabular-nums">
                {wrongStreak}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tabular-nums">
                ({isVi ? `Sai: ${incorrectCount}` : `Wrong: ${incorrectCount}`})
              </span>
            </div>
          </div>
        </div>

        {/* Khu vực thi đấu chính hoặc Bảng tổng kết 10 câu kèm tốc độ TB (giây/câu) */}
        <div className="w-full space-y-3">
          {status === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>
                  {tr("Hoàn thành thử thách 10 câu!")}
                </span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {isVi
                  ? `Chế độ: ${currentModeMeta.labelVi} · Thời gian: ${timeLimit}s / câu · Tốc độ TB: ${avgHistorySec}s${hardMode ? ' (Cấp độ Khó)' : ''}`
                  : `Mode: ${currentModeMeta.labelEn} · Time limit: ${timeLimit}s / problem · Avg speed: ${avgHistorySec}s${hardMode ? ' (Hard Level)' : ''}`}
              </p>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {tr("Đúng")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tabular-nums">
                    {score}
                  </span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5 tabular-nums">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    {tr("Sai")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono tabular-nums">
                    {incorrectCount}
                  </span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5 tabular-nums">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    {tr("% Độ chính xác")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono tabular-nums">
                    {Math.round((score / TOTAL_QUESTIONS) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-500/80 block mt-0.5 tabular-nums">
                    {score >= 8
                      ? isVi
                        ? `Xuất sắc! 🌟 (${avgHistorySec}s/câu)`
                        : `Great! 🌟 (${avgHistorySec}s/q)`
                      : isVi
                      ? `${avgHistorySec}s/câu`
                      : `${avgHistorySec}s/q`}
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="max-w-lg mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>
                      {tr("Chi tiết 10 phép tính")}
                    </span>
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
                        <span className="font-bold font-mono shrink-0 tabular-nums">
                          {item.isCorrect
                            ? `✓ ${(item.reactionMs / 1000).toFixed(1)}s`
                            : `✗ (${item.correctAnswer})`}
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
                  <span>
                    {isVi
                      ? `Bắt đầu thử thách mới (${TOTAL_QUESTIONS} câu)`
                      : `Start New Challenge (${TOTAL_QUESTIONS} Problems)`}
                  </span>
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
              {/* Cột trái: Thanh đếm ngược, 10 chấm tiến độ, đề bài phản xạ & gợi ý */}
              <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : 'bg-yellow-400'
                    }`}
                    style={{
                      width: `${status === 'idle' ? 100 : timerPercentage}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                    {isVi ? question.opLabelVi : question.opLabelEn}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-yellow-300 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25 tabular-nums">
                    <span>
                      {isVi
                        ? `Câu ${questionIndex}/${TOTAL_QUESTIONS}`
                        : `Problem ${questionIndex}/${TOTAL_QUESTIONS}`}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors tabular-nums ${
                      isUrgent && status === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer
                      className={`w-3 h-3 ${
                        isUrgent && status === 'running'
                          ? 'text-rose-400'
                          : 'text-yellow-400'
                      }`}
                    />
                    <span className="font-mono">
                      {status === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}
                    </span>
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
                    } else if (
                      qNum === questionIndex &&
                      (status === 'running' || status === 'answered')
                    ) {
                      bg = 'bg-yellow-400 border-yellow-300 animate-pulse';
                    }
                    return (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full border transition-all duration-300 ${bg}`}
                      />
                    );
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
                        {tr("Bấm nút \"Bắt đầu\" để hiện câu hỏi phản xạ và bắt đầu tính giờ.")}
                      </p>
                    </div>
                  ) : (
                    /* Hiển thị phép tính phản xạ, nút loa đọc đề & bộ chọn tốc độ đọc (code trực tiếp trong Page) */
                    <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
                      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-full py-2 px-1">
                        {renderDailyReflexFormula()}

                        {/* Nút loa đọc đề bài */}
                        <button
                          type="button"
                          onClick={() => pronounceQuestion()}
                          className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                            isSpeakingQuestion
                              ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-yellow-500/30 animate-pulse'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/10'
                          }`}
                          title={
                            isVi
                              ? `Đọc câu hỏi - Tốc độ: ${questionSpeed}x`
                              : `Pronounce question - Speed: ${questionSpeed}x`
                          }
                        >
                          <Volume2
                            className={`w-5 h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Bộ chọn tốc độ đọc đề (1.25x, 1.5x, 1.75x) */}
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
                              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 tabular-nums ${
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
                    </div>
                  )}
                </div>

                {status === 'answered' && (
                  <div className="mt-2 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                    <span className="font-bold text-yellow-400 mr-1.5">
                      {tr("Gợi ý:")}
                    </span>
                    {isVi ? question.hintVi : question.hintEn}
                  </div>
                )}

                {feedback === 'correct' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {isVi
                        ? `Chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                        : `Correct: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isVi
                        ? `Chưa chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                        : `Incorrect: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      {isVi
                        ? `Hết giờ!: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                        : `Time's up!: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                    </span>
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
                    onChange={(e) =>
                      setUserAnswer(e.target.value.replace(/[^\d]/g, ''))
                    }
                    placeholder={
                      status === 'idle'
                        ? tr("Bấm \"Bắt đầu thử thách\" để đếm ngược...")
                        : isListening
                        ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn")
                        : tr("Nhập kết quả hoặc bấm phím số...")
                    }
                    disabled={status !== 'running'}
                    className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && status === 'running'
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {question.answerSuffix && (
                    <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 pointer-events-none select-none">
                      {question.answerSuffix}
                    </span>
                  )}
                  {userAnswer && status === 'running' && (
                    <button
                      type="button"
                      onClick={() => setUserAnswer('')}
                      className={`absolute ${
                        question.answerSuffix ? 'right-16' : 'right-3.5'
                      } p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer`}
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
                        onClick={() =>
                          setUserAnswer((p) =>
                            p.length >= 14 ? p : p + digit
                          )
                        }
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
                        onClick={() =>
                          setUserAnswer((p) =>
                            p.length >= 14 ? p : p + digit
                          )
                        }
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
                      aria-label="Backspace"
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
                      <span>
                        {isVi
                          ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} câu)`
                          : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}
                      </span>
                    </button>
                  ) : status === 'answered' ? (
                    questionIndex < TOTAL_QUESTIONS ? (
                      <button
                        type="button"
                        onClick={() =>
                          advanceQuestion(questionIndex + 1, selectedMode, timeLimit, customOps)
                        }
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
                          statusRef.current = 'completed';
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
                      className="flex-1 min-w-[130px] h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
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

      {/* Modal cấu hình thời gian Timer cho thử thách */}
      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="page"
          initialPageKey="DailyReflexChallengePage"
        />
      )}
    </div>
  );
};
