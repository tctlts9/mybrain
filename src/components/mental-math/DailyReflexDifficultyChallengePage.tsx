/**
 * ============================================================================
 * FILE: DailyReflexDifficultyChallengePage.tsx — TRANG THỬ THÁCH PHẢN XẠ HÀNG NGÀY CẤP ĐỘ KHÓ
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN A & B).
 * 2. Quản lý thử thách 10 câu Phản xạ Tổng hợp hàng ngày Cấp độ Khó (Cộng, Trừ, Nhân, Chia, Căn, Lũy thừa, %).
 * 3. Cho phép chọn chế độ hỗn hợp hoặc Tùy chọn bật/tắt từng phép tính riêng lẻ và ghi nhận thời gian phản xạ (ms).
 * 4. Vận hành cơ chế 2 giai đoạn Quan sát -> Ẩn đề & Trả lời, đọc đề TTS và trả lời bằng Giọng nói / Bàn phím ảo.
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

type DailyReflexMode =
  | 'dailyMix'
  | 'fastFour'
  | 'advanced'
  | 'custom'
  | 'customDigits'
  | 'sequence';
type DailyReflexDifficulty = 'normal' | 'hard';

interface DailyReflexQuestion {
  operation: ReflexOperation;
  kind: 'binary' | 'sqrt' | 'power' | 'tokens' | 'sequence';
  a: number;
  b?: number;
  aStr?: string;
  bStr?: string;
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
  answerStr?: string;
  answerSuffix?: string;
  hintVi: string;
  hintEn: string;
  numbers?: number[];
  operations?: ('+' | '−')[];
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

type CustomOperandMode = 'exact' | 'digits';
type CustomReflexOp = '+' | '−' | '×' | '÷';
type SequenceDigitProfile = '2D' | '3D' | '2D3D' | '4D' | '3D4D';
type SequenceDisplayMode = 'flash' | 'all';

const MIN_CUSTOM_DIGITS = 1;
const MAX_CUSTOM_DIGITS = 100;
const MIN_CUSTOM_OPERAND = 1;
const MAX_CUSTOM_OPERAND = 999999999;
const MIN_SEQUENCE_COUNT = 2;
const MAX_SEQUENCE_COUNT = 100;

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

const getSpelledOutDigits = (val: string | number, isVi: boolean): string => {
  const str = String(val).replace(/[^\d]/g, '');
  if (!str) return '';
  if (isVi) {
    const mapVi = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    return str.split('').map((d) => mapVi[Number(d)] ?? d).join(' ');
  }
  const mapEn = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  return str.split('').map((d) => mapEn[Number(d)] ?? d).join(' ');
};

const randSeqInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getSequenceDigitBounds = (digits: 2 | 3 | 4): [number, number] => {
  if (digits === 2) return [10, 99];
  if (digits === 3) return [100, 999];
  return [1000, 9999];
};

function generateCustomDailyReflexQuestion(
  op: CustomReflexOp,
  digits: number,
  operandMode: CustomOperandMode,
  exactOperand: number,
  operandDigits: number
): DailyReflexQuestion {
  const safeDigits = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, digits));
  const safeOperand = Math.min(MAX_CUSTOM_OPERAND, Math.max(MIN_CUSTOM_OPERAND, exactOperand));
  const safeOperandDigits = Math.min(
    MAX_CUSTOM_DIGITS,
    Math.max(MIN_CUSTOM_DIGITS, operandDigits)
  );

  let aStr = buildRandomDigitString(safeDigits, true);
  let bStr =
    operandMode === 'digits'
      ? buildRandomDigitString(safeOperandDigits, true)
      : String(safeOperand);

  let ansStr = '0';
  let reflexOp: ReflexOperation = 'addition';
  let opLabelVi = 'Phép cộng';
  let opLabelEn = 'Addition';
  let spokenOpVi = 'cộng';
  let spokenOpEn = 'plus';

  if (op === '+') {
    ansStr = (BigInt(aStr) + BigInt(bStr)).toString();
    reflexOp = 'addition';
    opLabelVi = 'Phép cộng';
    opLabelEn = 'Addition';
    spokenOpVi = 'cộng';
    spokenOpEn = 'plus';
  } else if (op === '−') {
    if (BigInt(aStr) < BigInt(bStr)) {
      if (operandMode === 'exact' && safeDigits === bStr.length) {
        const maxVal = 10n ** BigInt(safeDigits) - 1n;
        aStr = buildRandomBigIntInRange(BigInt(bStr), maxVal).toString();
      } else {
        [aStr, bStr] = [bStr, aStr];
      }
    }
    ansStr = (BigInt(aStr) - BigInt(bStr)).toString();
    reflexOp = 'subtraction';
    opLabelVi = 'Phép trừ';
    opLabelEn = 'Subtraction';
    spokenOpVi = 'trừ';
    spokenOpEn = 'minus';
  } else if (op === '×') {
    ansStr = (BigInt(aStr) * BigInt(bStr)).toString();
    reflexOp = 'multiplication';
    opLabelVi = 'Phép nhân';
    opLabelEn = 'Multiplication';
    spokenOpVi = 'nhân';
    spokenOpEn = 'times';
  } else {
    const bBig = BigInt(Math.max(1, Number(bStr) || 1));
    const exactBStr = operandMode === 'digits' ? bStr : String(Math.max(1, safeOperand));
    const divB = BigInt(exactBStr);
    const minDiv = safeDigits === 1 ? 1n : 10n ** BigInt(safeDigits - 1);
    const maxDiv = 10n ** BigInt(safeDigits) - 1n;
    const minQ = (minDiv + divB - 1n) / divB;
    const maxQ = maxDiv / divB;
    let qBig: bigint;
    if (maxQ >= 1n && minQ <= maxQ) {
      const lowQ = maxQ >= 2n && minQ < 2n ? 2n : minQ;
      qBig = buildRandomBigIntInRange(lowQ, maxQ);
    } else {
      qBig = BigInt(reflexRandInt(2, 19));
    }
    void bBig;
    bStr = exactBStr;
    aStr = (qBig * divB).toString();
    ansStr = qBig.toString();
    reflexOp = 'division';
    opLabelVi = 'Phép chia';
    opLabelEn = 'Division';
    spokenOpVi = 'chia';
    spokenOpEn = 'divided by';
  }

  const formattedExpr = `${formatBigIntStr(aStr)} ${op} ${formatBigIntStr(bStr)}`;
  const spokenA = aStr.length > 9 ? getSpelledOutDigits(aStr, true) : aStr;
  const spokenB = bStr.length > 9 ? getSpelledOutDigits(bStr, true) : bStr;
  const spokenAEn = aStr.length > 9 ? getSpelledOutDigits(aStr, false) : aStr;
  const spokenBEn = bStr.length > 9 ? getSpelledOutDigits(bStr, false) : bStr;

  return {
    operation: reflexOp,
    kind: 'binary',
    a: Number(aStr),
    b: Number(bStr),
    aStr,
    bStr,
    opChar: op,
    opLabelVi,
    opLabelEn,
    labelVi: formattedExpr,
    labelEn: formattedExpr,
    spokenVi: `${spokenA} ${spokenOpVi} ${spokenB}`,
    spokenEn: `${spokenAEn} ${spokenOpEn} ${spokenBEn}`,
    answer: Number(ansStr),
    answerStr: ansStr,
    hintVi: `${formattedExpr} = ${formatBigIntStr(ansStr)}`,
    hintEn: `${formattedExpr} = ${formatBigIntStr(ansStr)}`,
  };
}

function generateDailyReflexSequenceQuestion(
  rawCount: number,
  profile: SequenceDigitProfile,
  includeSubtraction: boolean = false
): DailyReflexQuestion {
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
    if (includeSubtraction && count === 2 && digitLengths[0] < digitLengths[1]) {
      [digitLengths[0], digitLengths[1]] = [digitLengths[1], digitLengths[0]];
    }
  }

  const profileDescVi: Record<SequenceDigitProfile, string> = {
    '2D': '2 chữ số',
    '3D': '3 chữ số',
    '2D3D': '2 & 3 chữ số',
    '4D': '4 chữ số',
    '3D4D': '3 & 4 chữ số',
  };

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
        firstMin = Math.max(minVal, Math.min(maxVal, nextMin + 1));
      }
      const firstVal = randSeqInt(firstMin, maxVal);
      numbers.push(firstVal);
      operations.push('+');
      runningSum = firstVal;
      continue;
    }

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

  const exprParts = numbers.map((n, idx) =>
    idx === 0 ? formatBigIntStr(n) : `${operations[idx] ?? '+'} ${formatBigIntStr(n)}`
  );
  const fullExpr = exprParts.join(' ');
  const shortLabel =
    numbers.length > 5
      ? `${formatBigIntStr(numbers[0])} ${operations[1] ?? '+'} ${formatBigIntStr(numbers[1])} … (${numbers.length} số)`
      : fullExpr;
  const shortLabelEn =
    numbers.length > 5
      ? `${formatBigIntStr(numbers[0])} ${operations[1] ?? '+'} ${formatBigIntStr(numbers[1])} … (${numbers.length} nums)`
      : fullExpr;

  const spokenVi = numbers
    .map((n, idx) =>
      idx === 0
        ? getSpelledOutDigits(n, true)
        : `${operations[idx] === '−' ? 'trừ' : 'cộng'} ${getSpelledOutDigits(n, true)}`
    )
    .join(' ');
  const spokenEn = numbers
    .map((n, idx) =>
      idx === 0
        ? getSpelledOutDigits(n, false)
        : `${operations[idx] === '−' ? 'minus' : 'plus'} ${getSpelledOutDigits(n, false)}`
    )
    .join(' ');

  return {
    operation: includeSubtraction ? 'subtraction' : 'addition',
    kind: 'sequence',
    a: numbers[0] ?? 0,
    b: numbers[1] ?? 0,
    aStr: String(numbers[0] ?? 0),
    bStr: String(numbers[1] ?? 0),
    numbers,
    operations,
    opLabelVi: includeSubtraction ? 'Dãy số (+/-)' : 'Dãy số (+)',
    opLabelEn: includeSubtraction ? 'Sequence (+/-)' : 'Sequence (+)',
    labelVi: shortLabel,
    labelEn: shortLabelEn,
    spokenVi,
    spokenEn,
    answer: runningSum,
    answerStr: String(runningSum),
    hintVi: includeSubtraction
      ? `Tính cộng trừ lần lượt ${count} số (${profileDescVi[profile]}) từ trái sang phải ⇒ ${formatBigIntStr(runningSum)}`
      : `Cộng dồn lần lượt ${count} số (${profileDescVi[profile]}) từ trái sang phải ⇒ ${formatBigIntStr(runningSum)}`,
    hintEn: includeSubtraction
      ? `Calculate sequentially (+ / −) across all ${count} numbers (${profile}) ⇒ ${formatBigIntStr(runningSum)}`
      : `Accumulate the sum across all ${count} numbers (${profile}) sequentially ⇒ ${formatBigIntStr(runningSum)}`,
  };
}

function generateDailyReflexQuestion(
  mode: DailyReflexMode,
  difficulty: DailyReflexDifficulty = 'normal',
  customOps?: ReflexOperation[],
  customDigitConfig?: {
    op: CustomReflexOp;
    digits: number;
    operandMode: CustomOperandMode;
    exactOperand: number;
    operandDigits: number;
  },
  sequenceConfig?: {
    count: number;
    profile: SequenceDigitProfile;
    includeSubtraction: boolean;
  }
): DailyReflexQuestion {
  if (mode === 'customDigits') {
    const cfg = customDigitConfig ?? {
      op: '+' as CustomReflexOp,
      digits: 3,
      operandMode: 'exact' as CustomOperandMode,
      exactOperand: 25,
      operandDigits: 2,
    };
    return generateCustomDailyReflexQuestion(
      cfg.op,
      cfg.digits,
      cfg.operandMode,
      cfg.exactOperand,
      cfg.operandDigits
    );
  }
  if (mode === 'sequence') {
    const cfg = sequenceConfig ?? {
      count: 10,
      profile: '2D' as SequenceDigitProfile,
      includeSubtraction: false,
    };
    return generateDailyReflexSequenceQuestion(
      cfg.count,
      cfg.profile,
      cfg.includeSubtraction
    );
  }

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

interface DailyReflexDifficultyChallengePageProps {
  initialMode?: DailyReflexMode;
  initialCustomOps?: ReflexOperation[];
  onBack: () => void;
  isHard?: boolean;
}

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';

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
// PHẦN C: COMPONENT CHÍNH TRANG THỬ THÁCH PHẢN XẠ HÀNG NGÀY CẤP ĐỘ KHÓ (10 CÂU)
// ============================================================================
export const DailyReflexDifficultyChallengePage: React.FC<
  DailyReflexDifficultyChallengePageProps
> = ({ initialMode = 'dailyMix', initialCustomOps, onBack, isHard = true }) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const hardMode = isHard;
  const difficulty = hardMode ? 'hard' : 'normal';
  const autoNextConfig = useMentalMathAutoNextConfig(
    'DailyReflexDifficultyChallengePage'
  );
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('DailyReflexDifficultyChallengePage');

  // Trạng thái chế độ phản xạ, danh sách phép tính bật ở mode Tùy chọn & thời gian 2 pha (Quan sát / Trả lời)
  const [selectedMode, setSelectedMode] = useState<DailyReflexMode>(initialMode);
  const [customOps, setCustomOps] = useState<ReflexOperation[]>(
    initialCustomOps && initialCustomOps.length > 0
      ? initialCustomOps
      : DEFAULT_CUSTOM_OPS
  );
  // Tùy chọn Hàng 1: Độ dài chữ số & Phép tính (+ − × ÷) + Toán hạng thứ 2
  const [customOp, setCustomOp] = useState<CustomReflexOp>('+');
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [digitsDraft, setDigitsDraft] = useState<string>('3');
  const [operandMode, setOperandMode] = useState<CustomOperandMode>('exact');
  const [exactOperand, setExactOperand] = useState<number>(25);
  const [exactDraft, setExactDraft] = useState<string>('25');
  const [operandDigits, setOperandDigits] = useState<number>(2);
  const [opDigitsDraft, setOpDigitsDraft] = useState<string>('2');
  // Tùy chọn Hàng 2: Dãy số Siêu trí tuệ (2-100 số, 2D/3D/2D3D/4D/3D4D, Flash/All, +/-)
  const [sequenceCount, setSequenceCount] = useState<number>(10);
  const [sequenceCountDraft, setSequenceCountDraft] = useState<string>('10');
  const [sequenceDigitProfile, setSequenceDigitProfile] = useState<SequenceDigitProfile>('2D');
  const [sequenceIncludeSubtraction, setSequenceIncludeSubtraction] = useState<boolean>(false);
  const [sequenceDisplayMode, setSequenceDisplayMode] = useState<SequenceDisplayMode>('flash');
  const [flashIndex, setFlashIndex] = useState<number>(0);

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

  // Trạng thái ván thử thách 10 câu, pha (idle / observing / answering), điểm số & lịch sử phản xạ
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [question, setQuestion] = useState<DailyReflexQuestion>(() =>
    generateDailyReflexQuestion(
      initialMode,
      difficulty,
      initialCustomOps && initialCustomOps.length > 0
        ? initialCustomOps
        : DEFAULT_CUSTOM_OPS,
      { op: '+', digits: 3, operandMode: 'exact', exactOperand: 25, operandDigits: 2 },
      { count: 10, profile: '2D', includeSubtraction: false }
    )
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [feedback, setFeedback] = useState<
    'idle' | 'correct' | 'incorrect' | 'timeout'
  >('idle');
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
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  const questionIndexRef = useRef<number>(questionIndex);
  const selectedModeRef = useRef<DailyReflexMode>(selectedMode);
  const customOpsRef = useRef<ReflexOperation[]>(customOps);
  const customOpRef = useRef<CustomReflexOp>(customOp);
  const customDigitsRef = useRef<number>(customDigits);
  const operandModeRef = useRef<CustomOperandMode>(operandMode);
  const exactOperandRef = useRef<number>(exactOperand);
  const operandDigitsRef = useRef<number>(operandDigits);
  const sequenceCountRef = useRef<number>(sequenceCount);
  const sequenceDigitProfileRef = useRef<SequenceDigitProfile>(sequenceDigitProfile);
  const sequenceIncludeSubtractionRef = useRef<boolean>(sequenceIncludeSubtraction);
  const sequenceDisplayModeRef = useRef<SequenceDisplayMode>(sequenceDisplayMode);
  const timeLimitRef = useRef<TimeLimit>(timeLimit);
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  const advanceQuestionRef = useRef<
    (
      nextIdx: number,
      modeOverride?: DailyReflexMode,
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit,
      opsOverride?: ReflexOperation[]
    ) => void
  >(() => {});
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    challengePhaseRef.current = challengePhase;
  }, [challengePhase]);

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
    customOpRef.current = customOp;
  }, [customOp]);

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
    sequenceIncludeSubtractionRef.current = sequenceIncludeSubtraction;
  }, [sequenceIncludeSubtraction]);

  useEffect(() => {
    sequenceDisplayModeRef.current = sequenceDisplayMode;
  }, [sequenceDisplayMode]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  useEffect(() => {
    answerTimeLimitRef.current = answerTimeLimit;
  }, [answerTimeLimit]);

  const buildQuestionFromRefs = useCallback(
    (
      modeArg?: DailyReflexMode,
      opsArg?: ReflexOperation[],
      customOverride?: Partial<{
        op: CustomReflexOp;
        digits: number;
        operandMode: CustomOperandMode;
        exactOperand: number;
        operandDigits: number;
      }>,
      sequenceOverride?: Partial<{
        count: number;
        profile: SequenceDigitProfile;
        includeSubtraction: boolean;
      }>
    ) =>
      generateDailyReflexQuestion(
        modeArg ?? selectedModeRef.current,
        difficulty,
        opsArg ?? customOpsRef.current,
        {
          op: customOverride?.op ?? customOpRef.current,
          digits: customOverride?.digits ?? customDigitsRef.current,
          operandMode: customOverride?.operandMode ?? operandModeRef.current,
          exactOperand: customOverride?.exactOperand ?? exactOperandRef.current,
          operandDigits: customOverride?.operandDigits ?? operandDigitsRef.current,
        },
        {
          count: sequenceOverride?.count ?? sequenceCountRef.current,
          profile: sequenceOverride?.profile ?? sequenceDigitProfileRef.current,
          includeSubtraction:
            sequenceOverride?.includeSubtraction ?? sequenceIncludeSubtractionRef.current,
        }
      ),
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

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const cur = questionRef.current;
      let text = isVi ? cur.spokenVi : cur.spokenEn;
      if (cur.kind === 'sequence' && cur.numbers && cur.numbers.length > 0) {
        text = cur.numbers
          .map((n, idx) => {
            const spelled = getSpelledOutDigits(n, isVi);
            if (idx === 0) return spelled;
            const opWord =
              cur.operations?.[idx] === '−'
                ? isVi
                  ? 'trừ'
                  : 'minus'
                : isVi
                ? 'cộng'
                : 'plus';
            return `${opWord} ${spelled}`;
          })
          .join(' ');
      }
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
    (isCorrect: boolean, answerVal: number | string) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, Number(answerVal), isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  // Chuyển sang giai đoạn 2 (ẩn đề & đếm ngược thời gian trả lời), ghi nhận thống kê nếu hết giờ
  const beginAnsweringPhase = useCallback(
    (
      idxArg?: number,
      qArg?: DailyReflexQuestion,
      modeArg?: DailyReflexMode,
      limitArg?: TimeLimit,
      ansLimitArg?: AnswerTimeLimit,
      opsArg?: ReflexOperation[]
    ) => {
      if (statusRef.current !== 'running') return;
      clearTimers();
      const idx = idxArg ?? questionIndexRef.current;
      const activeQ = qArg ?? questionRef.current;
      const activeMode = modeArg ?? selectedModeRef.current;
      const activeLimit = limitArg ?? timeLimitRef.current;
      const ansLimit = ansLimitArg ?? answerTimeLimitRef.current;
      const activeOps = opsArg ?? customOpsRef.current;
      const activeAnsStr = activeQ.answerStr ?? String(activeQ.answer);

      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(ansLimit);
      setTimeout(() => inputRef.current?.focus(), 50);

      const ansEndTime = Date.now() + ansLimit * 1000;
      timerRef.current = window.setInterval(() => {
        const remainingMs = ansEndTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          clearTimers();
          stopListening();
          const reactionMs = (activeLimit + ansLimit) * 1000;
          recordDailyReflexAttempt(false, reactionMs);
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
              qIndex: idx,
              label: isVi ? activeQ.labelVi : activeQ.labelEn,
              userAnswer: tr("Hết giờ"),
              correctAnswer: `${formatBigIntStr(activeAnsStr)}${activeQ.answerSuffix || ''}`,
              isCorrect: false,
              reactionMs,
            },
          ]);
          if (isSpeakerEnabled) {
            triggerAnnouncement(false, activeAnsStr);
          }
          if (autoNextDelayRef.current > 0) {
            autoNextRef.current = window.setTimeout(() => {
              advanceQuestionRef.current(
                idx + 1,
                activeMode,
                activeLimit,
                ansLimit,
                activeOps
              );
            }, Math.round(autoNextDelayRef.current * 1000));
          }
        }
      }, 50);
    },
    [clearTimers, isSpeakerEnabled, isVi, stopListening, triggerAnnouncement]
  );

  // Chuyển sang câu hỏi tiếp theo trong 10 câu và bắt đầu giai đoạn Quan sát (hỗ trợ Flash từng số)
  const advanceQuestion = useCallback(
    (
      nextIdx: number,
      modeOverride?: DailyReflexMode,
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit,
      opsOverride?: ReflexOperation[]
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

      const activeMode = modeOverride ?? selectedModeRef.current;
      const activeLimit = limitOverride ?? timeLimitRef.current;
      const activeAnsLimit = answerLimitOverride ?? answerTimeLimitRef.current;
      const activeOps = opsOverride ?? customOpsRef.current;

      const nextQ = buildQuestionFromRefs(activeMode, activeOps);
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
      setTimeLeft(activeLimit);
      questionStartRef.current = Date.now();
      setStatus('running');
      statusRef.current = 'running';

      const startTime = Date.now();
      const totalDurationMs = activeLimit * 1000;
      const endTime = startTime + totalDurationMs;
      const seqNumbers = nextQ.numbers;
      const shouldFlashSeq =
        activeMode === 'sequence' &&
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
          beginAnsweringPhase(
            nextIdx,
            nextQ,
            activeMode,
            activeLimit,
            activeAnsLimit,
            activeOps
          );
        }
      }, 50);
    },
    [beginAnsweringPhase, buildQuestionFromRefs, clearTimers, stopListening]
  );

  useEffect(() => {
    advanceQuestionRef.current = advanceQuestion;
  }, [advanceQuestion]);

  // Bắt đầu phiên thử thách 10 câu mới từ câu #1
  const startChallenge = (
    modeOverride?: DailyReflexMode,
    limitOverride?: TimeLimit,
    answerLimitOverride?: AnswerTimeLimit,
    opsOverride?: ReflexOperation[]
  ) => {
    const activeMode = modeOverride ?? selectedModeRef.current;
    const activeLimit = limitOverride ?? timeLimitRef.current;
    const activeAnswerLimit = answerLimitOverride ?? answerTimeLimitRef.current;
    const activeOps = opsOverride ?? customOpsRef.current;
    setScore(0);
    setIncorrectCount(0);
    setStreak(0);
    setWrongStreak(0);
    setHistory([]);
    advanceQuestion(1, activeMode, activeLimit, activeAnswerLimit, activeOps);
  };

  // Đặt lại toàn bộ thử thách về trạng thái chờ ban đầu
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
    setFlashIndex(0);
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setTimeLeft(timeLimit);
    const nextQ = buildQuestionFromRefs(selectedMode, customOps);
    setQuestion(nextQ);
    questionRef.current = nextQ;
  };

  // Chấm đáp án người dùng, lưu thời gian phản xạ (ms), lịch sử 10 câu và hẹn giờ Auto-Next
  const submitAnswer = useCallback(
    (rawVal: string) => {
      if (
        statusRef.current !== 'running' ||
        challengePhaseRef.current !== 'answering'
      ) {
        return;
      }
      const normalized = normalizeAnswerInput(rawVal);
      if (!normalized) return;

      clearTimers();
      stopListening();

      const qCur = questionRef.current;
      const curIdx = questionIndexRef.current;
      const reactionMs = Date.now() - questionStartRef.current;
      const correctStr = normalizeAnswerInput(qCur.answerStr ?? String(qCur.answer));
      const isCorrect = normalized === correctStr;

      recordDailyReflexAttempt(isCorrect, reactionMs);
      setStatus('answered');
      statusRef.current = 'answered';
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
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
          userAnswer: `${formatBigIntStr(normalized)}${qCur.answerSuffix || ''}`,
          correctAnswer: `${formatBigIntStr(correctStr)}${qCur.answerSuffix || ''}`,
          isCorrect,
          reactionMs,
        },
      ]);

      if (isSpeakerEnabled) {
        triggerAnnouncement(isCorrect, correctStr);
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

  // Bật/tắt nhận diện giọng nói Web Speech API khi đang ở pha trả lời
  const toggleVoice = () => {
    if (status !== 'running' || challengePhase !== 'answering') return;
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
        if (
          parsed !== null &&
          statusRef.current === 'running' &&
          challengePhaseRef.current === 'answering'
        ) {
          const targetStr = normalizeAnswerInput(
            questionRef.current.answerStr ?? String(questionRef.current.answer)
          );
          setUserAnswer(String(parsed));
          if (String(parsed) === targetStr || res.isFinal) {
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

  // Bật/tắt từng phép tính trong chế độ Phản xạ Tùy chọn (luôn giữ tối thiểu 1 phép tính)
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

  // Hàm xử lý nhập độ dài chữ số & toán hạng thứ 2 cho Tùy chọn Hàng 1
  const handleDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setDigitsDraft(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
      const clamped = Math.min(MAX_CUSTOM_DIGITS, parsed);
      setCustomDigits(clamped);
      customDigitsRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { digits: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const commitDigits = () => {
    const parsed = parseInt(digitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setDigitsDraft(String(customDigits));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, parsed);
    setDigitsDraft(String(clamped));
    if (clamped !== customDigits) {
      setCustomDigits(clamped);
      customDigitsRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { digits: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const handleExactInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value
      .replace(/[^\d]/g, '')
      .slice(0, String(MAX_CUSTOM_OPERAND).length);
    setExactDraft(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_OPERAND) {
      const clamped = Math.min(MAX_CUSTOM_OPERAND, parsed);
      setExactOperand(clamped);
      exactOperandRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { exactOperand: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const commitExact = () => {
    const parsed = parseInt(exactDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_OPERAND) {
      setExactDraft(String(exactOperand));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_OPERAND, parsed);
    setExactDraft(String(clamped));
    if (clamped !== exactOperand) {
      setExactOperand(clamped);
      exactOperandRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { exactOperand: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const handleOpDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setOpDigitsDraft(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
      const clamped = Math.min(MAX_CUSTOM_DIGITS, parsed);
      setOperandDigits(clamped);
      operandDigitsRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { operandDigits: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const commitOpDigits = () => {
    const parsed = parseInt(opDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setOpDigitsDraft(String(operandDigits));
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, parsed);
    setOpDigitsDraft(String(clamped));
    if (clamped !== operandDigits) {
      setOperandDigits(clamped);
      operandDigitsRef.current = clamped;
      if (selectedMode === 'customDigits' && (status === 'idle' || status === 'completed')) {
        const nextQ = buildQuestionFromRefs('customDigits', undefined, { operandDigits: clamped });
        setQuestion(nextQ);
        questionRef.current = nextQ;
      }
    }
  };

  const currentModeMeta =
    DAILY_REFLEX_MODES.find((m) => m.id === selectedMode) || DAILY_REFLEX_MODES[0];
  const dynamicModeLabel =
    selectedMode === 'customDigits'
      ? operandMode === 'digits'
        ? isVi
          ? `Tùy chọn (${customDigits} chữ số ${customOp} ${operandDigits} chữ số)`
          : `Custom (${customDigits}-Digit ${customOp} ${operandDigits}-Digit)`
        : isVi
        ? `Tùy chọn (${customDigits} chữ số ${customOp} ${formatBigIntStr(exactOperand)})`
        : `Custom (${customDigits}-Digit ${customOp} ${formatBigIntStr(exactOperand)})`
      : selectedMode === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} số (${sequenceDigitProfile}${sequenceIncludeSubtraction ? ', +/-' : ', +'})`
        : `${sequenceCount}-Number Sequence (${sequenceDigitProfile}${sequenceIncludeSubtraction ? ', +/-' : ', +'})`
      : isVi
      ? currentModeMeta.labelVi
      : currentModeMeta.labelEn;

  const isCustomLayout =
    selectedMode === 'customDigits' || selectedMode === 'sequence';
  const answerDisplayStr = formatBigIntStr(question.answerStr ?? question.answer);
  const canAnswer = status === 'running' && challengePhase === 'answering';
  const activePhaseDuration =
    challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const isUrgent =
    timeLeft <=
    (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5);
  const timerPercentage = Math.max(
    0,
    Math.min(100, (timeLeft / Math.max(1, activePhaseDuration)) * 100)
  );
  const avgHistorySec =
    history.length > 0
      ? (
          history.reduce((sum, item) => sum + item.reactionMs, 0) /
          history.length /
          1000
        ).toFixed(1)
      : '0.0';

  // Hàm render công thức câu hỏi Phản xạ (Dãy số Flash/All, BigInt Tùy chọn, Căn bậc 2, Lũy thừa, Tokens hoặc Phép tính 2 vế) — code trực tiếp trong Page
  const renderDailyReflexFormula = () => {
    if (question.kind === 'sequence' && question.numbers && question.numbers.length > 0) {
      if (sequenceDisplayMode === 'flash' && status === 'running') {
        const opsTail = question.operations?.slice(1) ?? [];
        const hasMixedOps = opsTail.includes('−') && opsTail.includes('+');
        const activeOp = question.operations?.[flashIndex] ?? '+';
        const showSign = flashIndex > 0;
        return (
          <div className="w-full max-w-lg mx-auto py-1 space-y-3 select-none">
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

            <div className="py-6 sm:py-8 px-4 rounded-2xl bg-slate-900/80 border border-yellow-500/35 flex items-center justify-center gap-3 shadow-inner">
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
                <span>{formatBigIntStr(question.numbers[flashIndex] ?? 0)}</span>
              </span>
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
        );
      }

      const opsTail = question.operations?.slice(1) ?? [];
      const hasSub = opsTail.includes('−');
      const hasAdd = opsTail.includes('+');
      const hasMixedOps = hasSub && hasAdd;
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
        <div className="w-full space-y-2 py-1 select-none">
          <div className="text-xs font-semibold text-yellow-300 text-center">
            {hasMixedOps
              ? isVi
                ? `Dãy phép tính (+/-) gồm ${question.numbers.length} số:`
                : `Mixed (+/-) sequence of ${question.numbers.length} numbers:`
              : isVi
              ? `Dãy phép cộng gồm ${question.numbers.length} số:`
              : `Addition sequence of ${question.numbers.length} numbers:`}
          </div>
          <div className="w-full px-3 sm:px-4 py-4 sm:py-5 rounded-2xl bg-slate-900/75 border border-slate-800/90 flex items-center justify-center">
            <div
              className={`${exprSizeClass} font-mono text-white tabular-nums tracking-tight leading-relaxed text-center`}
            >
              {question.numbers.map((numVal, idx) => {
                const op = question.operations?.[idx] ?? '+';
                const isSub = idx > 0 && op === '−';
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <>
                        {' '}
                        <span
                          className={`font-sans font-black ${
                            isSub
                              ? 'text-rose-400'
                              : hasMixedOps
                              ? 'text-emerald-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {isSub ? '−' : '+'}
                        </span>
                        {' '}
                      </>
                    )}
                    <span className="whitespace-nowrap">{formatBigIntStr(numVal)}</span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

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

    if (question.aStr && question.bStr) {
      const formattedA = formatBigIntStr(question.aStr);
      const formattedB = formatBigIntStr(question.bStr);
      const totalFormattedLen = formattedA.length + formattedB.length + 3;
      const useStackedFormula = totalFormattedLen > 64;
      const formulaFontSize = getCustomFormulaFontSize(totalFormattedLen);
      if (useStackedFormula) {
        const linesA = splitFormattedIntoBalancedLines(question.aStr, 10);
        const linesB = splitFormattedIntoBalancedLines(question.bStr, 10);
        return (
          <div className="w-full flex flex-col items-center justify-center gap-2 py-1 select-none">
            <div
              className={`font-black text-white font-mono tabular-nums flex flex-col items-center justify-center gap-1 tracking-wide leading-snug max-w-full ${formulaFontSize}`}
            >
              {linesA.map((line, idx) => (
                <span key={idx} className="whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>
            <div
              className={`font-black text-white font-mono tabular-nums flex items-start justify-center gap-2 tracking-tight max-w-full ${formulaFontSize}`}
            >
              <span className="text-yellow-400 font-sans shrink-0">{question.opChar || '+'}</span>
              <div className="flex flex-col items-center justify-center gap-1 leading-snug">
                {linesB.map((line, idx) => (
                  <span key={idx} className="whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      }
      return (
        <div
          className={`${formulaFontSize} font-black text-white tracking-wide font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-tight tabular-nums max-w-full`}
        >
          <span className="break-all">{formattedA}</span>
          <span className="text-yellow-400 font-sans">{question.opChar || '+'}</span>
          <span className="break-all">{formattedB}</span>
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
            <span>
              {tr("Thử Thách Cấp Độ Khó")}
            </span>
          </span>
        </div>
      </div>

      {/* Khung chứa chính khu vực Thử thách Cấp độ Khó */}
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

        {/* Hàng tiêu đề & bộ điều khiển thời gian Quan sát / Trả lời / Đổi câu / Âm thanh */}
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
                  {tr("Thử Thách Cấp Độ Khó")}
                </span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                  {dynamicModeLabel}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? tr("Cấp độ khó: Cộng · Trừ · Nhân · Chia · Căn · Lũy thừa · % tốc độ cao, ghi nhớ & phản xạ nhanh")
                  : isVi
                  ? currentModeMeta.badgeVi
                  : currentModeMeta.badgeEn}
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
                          timeLimitRef.current = clamped;
                          if (status === 'idle') setTimeLeft(clamped);
                        }
                      }
                    }}
                    onBlur={() => {
                      isEditingLimitRef.current = false;
                      const parsed = parseInt(limitDraft, 10);
                      const resolved =
                        Number.isNaN(parsed) || parsed < 1
                          ? Math.min(
                              999,
                              Math.max(1, timeLimit >= 1 ? Math.round(timeLimit) : 10)
                            )
                          : Math.min(999, Math.max(1, Math.round(parsed)));
                      setLimitDraft(String(resolved));
                      setTimeLimit(resolved);
                      timeLimitRef.current = resolved;
                      if (status === 'idle') setTimeLeft(resolved);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    aria-label={tr("Thời gian giới hạn (giây)")}
                    title={
                      tr("Nhập số giây giới hạn (giây)")
                    }
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
                          ? Math.min(
                              999,
                              Math.max(
                                1,
                                answerTimeLimit >= 1 ? Math.round(answerTimeLimit) : 10
                              )
                            )
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
                    aria-label={
                      tr("Thời gian trả lời (giây)")
                    }
                    title={
                      tr("Nhập số giây trả lời (mặc định 10s)")
                    }
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
                  initialPageKey={"DailyReflexDifficultyChallengePage"}
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

        {/* Lưới chọn chế độ phản xạ & hàng bật/tắt phép tính khi chọn mode Tùy chọn */}
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

          {/* Hàng tùy chọn 1: Tùy chọn (Chữ số & Phép tính) — Độ dài chữ số 1-100, Phép tính + − × ÷, Số đích danh | Độ dài chữ số */}
          <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedMode('customDigits');
                selectedModeRef.current = 'customDigits';
                if (status === 'idle' || status === 'completed') {
                  const nextQ = buildQuestionFromRefs('customDigits');
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              title={tr("Tùy chọn độ dài chữ số, phép tính và số đích danh tùy ý")}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedMode === 'customDigits'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${
                  selectedMode === 'customDigits' ? 'text-slate-950' : 'text-yellow-400'
                }`}
              />
              <span className="whitespace-nowrap">{tr("Tùy chọn (Chữ số & Phép tính)")}</span>
            </button>

            {selectedMode === 'customDigits' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                {/* Textbox 1: Độ dài Chữ số (1-100) */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="reflex-custom-digit-length"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài Chữ số:")}
                  </label>
                  <input
                    id="reflex-custom-digit-length"
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

                {/* Bộ chọn Phép tính (+ − × ÷) */}
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  {(['+', '−', '×', '÷'] as CustomReflexOp[]).map((opSymbol) => (
                    <button
                      key={opSymbol}
                      type="button"
                      disabled={status === 'running'}
                      onClick={() => {
                        setCustomOp(opSymbol);
                        customOpRef.current = opSymbol;
                        if (status === 'idle' || status === 'completed') {
                          const nextQ = buildQuestionFromRefs('customDigits', undefined, { op: opSymbol });
                          setQuestion(nextQ);
                          questionRef.current = nextQ;
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer active:scale-95 disabled:opacity-60 ${
                        customOp === opSymbol
                          ? 'bg-yellow-400 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opSymbol}
                    </button>
                  ))}
                </div>

                {/* Textbox 2: Toán hạng thứ 2 (Số đích danh | Độ dài chữ số) */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                  <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none">
                    {tr("Số thứ 2 tùy chọn:")}
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
                          const nextQ = buildQuestionFromRefs('customDigits', undefined, { operandMode: modeVal });
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
                          const nextQ = buildQuestionFromRefs('customDigits', undefined, { operandMode: modeVal });
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
                      id="reflex-custom-operand-exact"
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
                      aria-label={tr("Nhập số đích danh tùy chọn (VD: 19, 25, 99...)")}
                      title={tr("Nhập số đích danh tùy chọn (VD: 19, 25, 99...)")}
                      className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  ) : (
                    <input
                      id="reflex-custom-operand-digits"
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
                      aria-label={tr("Nhập độ dài chữ số của toán hạng thứ 2 (từ 1 đến 100)")}
                      title={tr("Nhập độ dài chữ số của toán hạng thứ 2 (từ 1 đến 100)")}
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hàng tùy chọn 2: Dãy số Siêu trí tuệ — Nút Tùy chọn (Dãy số), Phép tính +/- và bộ điều khiển chi tiết */}
          <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                setSelectedMode('sequence');
                selectedModeRef.current = 'sequence';
                if (status === 'idle' || status === 'completed') {
                  const nextQ = buildQuestionFromRefs('sequence');
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              title={
                isVi
                  ? 'Tùy chọn dãy số cộng/trừ liên tiếp giống các cuộc thi Siêu trí tuệ'
                  : 'Super-Brain sequential reflex challenge'
              }
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedMode === 'sequence'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <SlidersHorizontal
                className={`w-3.5 h-3.5 shrink-0 ${
                  selectedMode === 'sequence' ? 'text-slate-950' : 'text-yellow-400'
                }`}
              />
              <span className="whitespace-nowrap">{tr("Tùy chọn (Dãy số)")}</span>
            </button>

            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => {
                const nextIncludeSub =
                  selectedMode === 'sequence' ? !sequenceIncludeSubtraction : true;
                setSelectedMode('sequence');
                selectedModeRef.current = 'sequence';
                setSequenceIncludeSubtraction(nextIncludeSub);
                sequenceIncludeSubtractionRef.current = nextIncludeSub;
                if (status === 'idle' || status === 'completed') {
                  const nextQ = buildQuestionFromRefs('sequence', undefined, undefined, {
                    includeSubtraction: nextIncludeSub,
                  });
                  setQuestion(nextQ);
                  questionRef.current = nextQ;
                }
              }}
              aria-pressed={selectedMode === 'sequence' && sequenceIncludeSubtraction}
              title={tr(
                "Bật/tắt dãy số ngẫu nhiên kết hợp cả phép cộng (+) và phép trừ (−) với kết quả luôn hợp lý"
              )}
              className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedMode === 'sequence' && sequenceIncludeSubtraction
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="whitespace-nowrap">{tr("Phép tính +/-")}</span>
            </button>

            {selectedMode === 'sequence' && (
              <div className="w-full flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                  <label
                    htmlFor="reflex-sequence-count"
                    className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                  >
                    {tr("Dãy số:")}
                  </label>
                  <input
                    id="reflex-sequence-count"
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
                          const nextQ = buildQuestionFromRefs('sequence', undefined, undefined, {
                            count: clamped,
                          });
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
                          const nextQ = buildQuestionFromRefs('sequence', undefined, undefined, {
                            count: clamped,
                          });
                          setQuestion(nextQ);
                          questionRef.current = nextQ;
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    title={tr(
                      "Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)"
                    )}
                    className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60 selection:bg-yellow-400 selection:text-slate-950"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                  <label
                    htmlFor="reflex-sequence-digits-select"
                    className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                  >
                    {tr("Độ dài chữ số:")}
                  </label>
                  <select
                    id="reflex-sequence-digits-select"
                    disabled={status === 'running'}
                    value={sequenceDigitProfile}
                    onChange={(e) => {
                      const nextProfile = e.target.value as SequenceDigitProfile;
                      setSequenceDigitProfile(nextProfile);
                      sequenceDigitProfileRef.current = nextProfile;
                      if (status === 'idle' || status === 'completed') {
                        const nextQ = buildQuestionFromRefs('sequence', undefined, undefined, {
                          profile: nextProfile,
                        });
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
                    htmlFor="reflex-sequence-display-select"
                    className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                  >
                    {tr("Hiển thị câu hỏi:")}
                  </label>
                  <select
                    id="reflex-sequence-display-select"
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

        {/* Khu vực hiển thị Tổng kết 10 câu hoặc Sân thi đấu 2 cột */}
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
                  ? `Chế độ: ${dynamicModeLabel}${hardMode ? ' (Cấp độ Khó)' : ''} • Quan sát: ${timeLimit}s • Trả lời: ${answerTimeLimit}s • TB: ${avgHistorySec}s`
                  : `Mode: ${dynamicModeLabel}${hardMode ? ' (Hard Level)' : ''} • Observe: ${timeLimit}s • Answer: ${answerTimeLimit}s • Avg: ${avgHistorySec}s`}
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
                      ? tr("Xuất sắc! 🌟")
                      : tr("Cần luyện thêm")}
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
                  <div
                    className={
                      isCustomLayout
                        ? 'max-h-56 overflow-y-auto space-y-1.5 text-xs'
                        : 'grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs'
                    }
                  >
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
                          {item.isCorrect ? '✓' : `✗ (${item.correctAnswer})`}
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
            <div
              className={
                isCustomLayout
                  ? 'flex flex-col gap-4 md:gap-5 items-center'
                  : 'landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch'
              }
            >
              {/* Cột trái: Thanh đếm ngược 2 giai đoạn & hiển thị câu hỏi phản xạ */}
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
                        ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
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
                        : challengePhase === 'answering' && status === 'running'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer
                      className={`w-3 h-3 ${
                        isUrgent && status === 'running'
                          ? 'text-rose-400'
                          : challengePhase === 'answering' && status === 'running'
                          ? 'text-cyan-400'
                          : 'text-yellow-400'
                      }`}
                    />
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
                        {tr("Bấm nút \"Bắt đầu\" để quan sát câu hỏi, ghi nhớ rồi trả lời.")}
                      </p>
                    </div>
                  ) : status === 'running' && challengePhase === 'answering' ? (
                    <div className="py-5 px-6 rounded-2xl bg-slate-900/90 border border-cyan-500/35 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                        <EyeOff className="w-5 h-5 text-cyan-400" />
                        <span>
                          {tr("Đã hết thời gian quan sát")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {isVi
                          ? `Hãy nhớ lại phép tính và nhập đáp án trong ${timeLeft}s`
                          : `Recall the problem and enter your answer within ${timeLeft}s`}
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
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi
                        ? `Chính xác: ${answerDisplayStr}${question.answerSuffix || ''}`
                        : `Correct: ${answerDisplayStr}${question.answerSuffix || ''}`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi
                        ? `Chưa chính xác: ${answerDisplayStr}${question.answerSuffix || ''}`
                        : `Incorrect: ${answerDisplayStr}${question.answerSuffix || ''}`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="break-all font-mono sm:font-sans">
                      {isVi
                        ? `Hết giờ!: ${answerDisplayStr}${question.answerSuffix || ''}`
                        : `Time's up!: ${answerDisplayStr}${question.answerSuffix || ''}`}
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
                  isCustomLayout
                    ? 'w-full max-w-2xl mx-auto'
                    : 'landscape-math-col md:col-span-6'
                } flex flex-col justify-center space-y-3`}
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
                        : challengePhase === 'observing'
                        ? isVi
                          ? `Đang quan sát đề (${timeLeft}s)... Bấm "Trả lời ngay"`
                          : `Observing (${timeLeft}s)... Click "Answer Now"`
                        : isListening
                        ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn")
                        : tr("Nhập đáp án bạn vừa ghi nhớ...")
                    }
                    disabled={!canAnswer}
                    className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      isListening
                        ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                        : isUrgent && canAnswer
                        ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                        : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                    }`}
                  />
                  {question.answerSuffix && (
                    <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 pointer-events-none select-none">
                      {question.answerSuffix}
                    </span>
                  )}
                  {userAnswer && canAnswer && (
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
                          canAnswer &&
                          setUserAnswer((p) => (p.length >= (isCustomLayout ? 250 : 14) ? p : p + digit))
                        }
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
                        onClick={() =>
                          canAnswer &&
                          setUserAnswer((p) => (p.length >= (isCustomLayout ? 250 : 14) ? p : p + digit))
                        }
                        disabled={!canAnswer}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => canAnswer && setUserAnswer('')}
                      disabled={!canAnswer || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    >
                      {tr("Xóa")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        canAnswer && setUserAnswer((p) => p.slice(0, -1))
                      }
                      disabled={!canAnswer || !userAnswer}
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
                          advanceQuestion(
                            questionIndex + 1,
                            selectedMode,
                            timeLimit,
                            answerTimeLimit,
                            customOps
                          )
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
                          setChallengePhase('idle');
                          challengePhaseRef.current = 'idle';
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
                      <span>
                        {isVi
                          ? `Trả lời ngay (${timeLeft}s)`
                          : `Answer Now (${timeLeft}s)`}
                      </span>
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
