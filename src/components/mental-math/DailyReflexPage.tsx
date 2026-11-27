/**
 * ============================================================================
 * FILE: DailyReflexPage.tsx — TRANG RÈN LUYỆN PHẢN XẠ HÀNG NGÀY (PRACTICE)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next).
 * 2. Quản lý mục tiêu luyện tập hàng ngày (Daily Goal, Chuỗi ngày, Độ chính xác, Tốc độ TB).
 * 3. Tích hợp chế độ "Phản xạ nhanh 9 ô" (Quick Reflex 3x3: Cộng/Trừ/Nhân/Chia/Lũy thừa/Căn/Phần trăm, đếm ngược, bàn phím 14 phím & Voice).
 * 4. Quản lý chế độ Phản xạ tiêu chuẩn/nâng cao/tùy chỉnh phép tính, đồng hồ nhịp phản xạ & điều hướng Hướng dẫn / Thử thách.
 * ============================================================================
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Gauge,
  Download,
  Delete,
  Sparkles,
  Sliders,
  TimerReset,
  Globe,
  SlidersHorizontal,
  X,
  Check,
  Hand,
  Timer,
  Flame,
  Trophy,
  Play,
  Clock,
  Eye,
  EyeOff,
  Target,
  Hash,
  BookOpen,
} from 'lucide-react';
import { useLanguage, biLabel, translateText } from '../../context/Translations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';
import {
  isChallengeButtonVisible,
  isDifficultLevelChallengeButtonVisible,
  isAutoNextButtonVisible,
  isVisualGuideButtonVisible,
} from '../../config/buttonVisibility';
import { downloadGuidePdf } from '../../utils/guidePdfDownload';

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

  // exponent
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

const updateDailyReflexGoal = (goal: number): DailyReflexStats => {
  const current = getDailyReflexStats();
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  let nextStreak = current.streakDays;
  let nextLastGoalMetDate = current.lastGoalMetDate;

  if (current.todayCompleted >= goal && current.lastGoalMetDate !== today) {
    nextStreak =
      current.lastGoalMetDate === yesterday ? current.streakDays + 1 : 1;
    nextLastGoalMetDate = today;
  }

  const updated: DailyReflexStats = {
    ...current,
    dailyGoal: goal,
    streakDays: nextStreak,
    lastGoalMetDate: nextLastGoalMetDate,
  };
  writeStats(updated);
  return updated;
};

const subscribeDailyReflexStats = (cb: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STATS_UPDATE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(STATS_UPDATE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};

// ============================================================================
// PHẦN A: CẤU HÌNH & HOOK AUTO-NEXT (TỰ ĐỘNG CHUYỂN CÂU KHI TRẢ LỜI ĐÚNG)
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

// Props, cấu hình chế độ phản xạ 9 ô nhanh & các hàm tiện ích chuẩn hóa số / giọng nói
interface DailyReflexPageProps {
  onBack: () => void;
  onOpenChallenge?: (mode?: DailyReflexMode, customOps?: ReflexOperation[]) => void;
  onOpenHardChallenge?: (mode?: DailyReflexMode, customOps?: ReflexOperation[]) => void;
  onOpenVisualGuide?: () => void;
  initialMode?: DailyReflexMode;
  customOps?: ReflexOperation[];
  onChangeCustomOps?: (ops: ReflexOperation[]) => void;
}

const DEFAULT_CUSTOM_OPS: ReflexOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const DAILY_GOAL_OPTIONS = [15, 20, 30, 50];
const PACE_OPTIONS = [0, 5, 8, 12]; // 0 = Free stopwatch, >0 = Target reflex countdown

export type QuickReflexDigitMode = 1 | 2 | 3;

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

const QUICK_DIGIT_OPTIONS: QuickReflexDigitMode[] = [1, 2, 3];

const SQUARES_1D = [1, 4, 9];
const SQUARES_2D = [16, 25, 36, 49, 64, 81];
const SQUARES_3D = [
  100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625,
  676, 729, 784, 841, 900, 961,
];

const quickRandInt = (min: number, max: number) =>
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
 * Phân tích số đọc qua giọng nói cho Phản xạ nhanh (hỗ trợ 0, số thập phân "phẩy/chấm/point", số âm "âm/trừ/minus").
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

function generateQuickReflexInitialState(op: ReflexOperation, digits: QuickReflexDigitMode) {
  if (op === 'addition') {
    const start =
      digits === 1 ? quickRandInt(2, 9) : digits === 2 ? quickRandInt(12, 98) : quickRandInt(115, 985);
    const step =
      digits === 1 ? quickRandInt(2, 9) : digits === 2 ? quickRandInt(11, 49) : quickRandInt(25, 195);
    return { start, step };
  }
  if (op === 'subtraction') {
    if (digits === 1) {
      return { start: 9, step: 1 };
    }
    const step = digits === 2 ? quickRandInt(3, 9) : quickRandInt(12, 45);
    const minStart =
      digits === 2 ? Math.max(55, step * 9 + 1) : Math.max(450, step * 9 + 20);
    const maxStart = digits === 2 ? 99 : 999;
    const start = quickRandInt(Math.min(minStart, maxStart), maxStart);
    return { start, step };
  }
  if (op === 'multiplication') {
    const start =
      digits === 1 ? quickRandInt(2, 9) : digits === 2 ? quickRandInt(11, 95) : quickRandInt(105, 985);
    return { start, step: 2 };
  }
  if (op === 'division') {
    const step = 2;
    const start =
      digits === 1
        ? quickRandInt(2, 4) * 2
        : digits === 2
        ? quickRandInt(12, 49) * 2
        : quickRandInt(50, 499) * 2;
    return { start, step };
  }
  if (op === 'exponent') {
    const start =
      digits === 1 ? quickRandInt(2, 9) : digits === 2 ? quickRandInt(11, 89) : quickRandInt(101, 499);
    return { start, step: 2 };
  }
  if (op === 'square-root') {
    const pool =
      digits === 1 ? SQUARES_1D : digits === 2 ? SQUARES_2D : SQUARES_3D;
    const start = pool[quickRandInt(0, pool.length - 1)];
    return { start, step: 1 };
  }
  // percentage
  const start =
    digits === 1
      ? quickRandInt(2, 9)
      : digits === 2
      ? quickRandInt(1, 9) * 10
      : quickRandInt(10, 99) * 10;
  return { start, step: 10 };
}

interface QuickReflexComputedBox {
  index: number; // 1..9
  formulaLabel: string;
  maskedFormulaLabel?: string;
  value: number;
  formatted: string;
}

type QuickReflexBoxStatus = 'pending' | 'correct' | 'incorrect';

export const DailyReflexPage: React.FC<DailyReflexPageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenHardChallenge,
  onOpenVisualGuide,
  initialMode,
  customOps: controlledCustomOps,
  onChangeCustomOps,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('DailyReflexPage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('DailyReflexPage');
  const autoNextTimerRef = useRef<number | null>(null);

  const [selectedMode, setSelectedMode] = useState<DailyReflexMode>(
    initialMode || 'dailyMix'
  );
  const [difficulty, setDifficulty] = useState<DailyReflexDifficulty>('normal');
  const [isQuickReflexActive, setIsQuickReflexActive] = useState<boolean>(true);
  const [internalCustomOps, setInternalCustomOps] =
    useState<ReflexOperation[]>(DEFAULT_CUSTOM_OPS);
  const customOps = controlledCustomOps ?? internalCustomOps;
  const setCustomOps = useCallback(
    (nextOps: ReflexOperation[]) => {
      if (onChangeCustomOps) {
        onChangeCustomOps(nextOps);
      } else {
        setInternalCustomOps(nextOps);
      }
    },
    [onChangeCustomOps]
  );

  const [targetPaceSec, setTargetPaceSec] = useState<number>(0);

  const [question, setQuestion] = useState<DailyReflexQuestion>(() =>
    generateDailyReflexQuestion(
      initialMode || 'dailyMix',
      'normal',
      controlledCustomOps ?? DEFAULT_CUSTOM_OPS
    )
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [sessionStreak, setSessionStreak] = useState<number>(0);

  // Reaction timer state (ms)
  const questionStartRef = useRef<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [paceExpired, setPaceExpired] = useState<boolean>(false);

  // Persistent daily stats
  const [dailyStats, setDailyStats] = useState<DailyReflexStats>(() =>
    getDailyReflexStats()
  );

  // Audio & voice state
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
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const questionRef = useRef<DailyReflexQuestion>(question);
  const recordedCurrentRef = useRef<boolean>(false);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    const sync = () => setDailyStats(getDailyReflexStats());
    sync();
    return subscribeDailyReflexStats(sync);
  }, []);

  // Live reaction stopwatch while question is unanswered
  useEffect(() => {
    if (feedback === 'correct' || isQuickReflexActive) return;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - questionStartRef.current;
      setElapsedMs(elapsed);
      if (targetPaceSec > 0 && elapsed >= targetPaceSec * 1000) {
        setPaceExpired(true);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [feedback, targetPaceSec, question, isQuickReflexActive]);

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

  // State chế độ Phản xạ nhanh 9 ô (3x3) & bộ đếm giới hạn thời gian
  const [quickSelectedOp, setQuickSelectedOp] = useState<ReflexOperation | null>(null);
  const [quickDigitMode, setQuickDigitMode] = useState<QuickReflexDigitMode>(2);
  const [quickTimeLimitSec, setQuickTimeLimitSec] = useState<number>(60);
  const [quickLimitDraft, setQuickLimitDraft] = useState<string>('60');
  const isEditingQuickLimitRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isEditingQuickLimitRef.current) {
      setQuickLimitDraft(String(quickTimeLimitSec));
    }
  }, [quickTimeLimitSec]);

  const [quickStartDraft, setQuickStartDraft] = useState<string>('20');
  const [quickStepValue, setQuickStepValue] = useState<number>(2);
  const [quickStepDraft, setQuickStepDraft] = useState<string>('2');
  const [quickPercentageStyle, setQuickPercentageStyle] = useState<'ofBase' | 'chain'>('ofBase');

  useEffect(() => {
    setQuickStepDraft(String(quickStepValue));
  }, [quickStepValue]);

  const [quickActiveBoxIndex, setQuickActiveBoxIndex] = useState<number>(1);
  const [quickUserEntries, setQuickUserEntries] = useState<Record<number, string>>({});
  const [quickBoxStatuses, setQuickBoxStatuses] = useState<Record<number, QuickReflexBoxStatus>>({});
  const [quickShowAllAnswers, setQuickShowAllAnswers] = useState<boolean>(false);

  const [quickRemainingMs, setQuickRemainingMs] = useState<number>(60 * 1000);
  const [quickRoundState, setQuickRoundState] = useState<'idle' | 'running' | 'completed' | 'timeout'>('idle');
  const [quickCompletedInMs, setQuickCompletedInMs] = useState<number | null>(null);
  const quickRoundStartAtRef = useRef<number>(Date.now());

  const [quickIsListening, setQuickIsListening] = useState<boolean>(false);
  const [quickVoiceTranscript, setQuickVoiceTranscript] = useState<string>('');
  const [quickVoiceError, setQuickVoiceError] = useState<string>('');
  const quickRecognitionRef = useRef<any>(null);
  const quickIsListeningRef = useRef<boolean>(false);
  const quickLastSolvedSpeechRef = useRef<{ value: number; time: number } | null>(null);
  const quickConsumedLengthRef = useRef<Map<number, number>>(new Map());
  const quickConsumedValueRef = useRef<Map<number, number>>(new Map());
  const quickInputRef = useRef<HTMLInputElement>(null);

  const quickStartNum = useMemo(() => {
    const parsed = parseNumericString(quickStartDraft);
    return parsed ?? 0;
  }, [quickStartDraft]);

  // Tính toán danh sách 9 ô công thức & đáp án chuẩn dựa theo phép toán, số gốc và bước nhảy
  const quickResultBoxes = useMemo<QuickReflexComputedBox[]>(() => {
    if (!quickSelectedOp) return [];
    const boxes: QuickReflexComputedBox[] = [];
    const safeStep = Number.isFinite(quickStepValue) ? quickStepValue : 1;

    if (quickSelectedOp === 'addition') {
      let cur = quickStartNum;
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

    if (quickSelectedOp === 'subtraction') {
      let cur = quickStartNum;
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

    if (quickSelectedOp === 'multiplication') {
      let cur = quickStartNum;
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

    if (quickSelectedOp === 'division') {
      const div = safeStep === 0 ? 2 : safeStep;
      let cur = quickStartNum;
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

    if (quickSelectedOp === 'exponent') {
      const exp = safeStep === 3 ? 3 : 2;
      for (let i = 1; i <= 9; i++) {
        const base = quickStartNum + (i - 1);
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

    if (quickSelectedOp === 'square-root') {
      const root0 = Math.sqrt(Math.max(0, quickStartNum));
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
          const rad = Math.max(0, quickStartNum + (i - 1));
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
    if (quickPercentageStyle === 'chain') {
      let cur = quickStartNum;
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
      const val = Math.round(((quickStartNum * pct) / 100) * 10000) / 10000;
      boxes.push({
        index: i,
        formulaLabel: `${pct}% × ${formatCleanNumber(quickStartNum)}`,
        value: val,
        formatted: formatCleanNumber(val),
      });
    }
    return boxes;
  }, [quickSelectedOp, quickStartNum, quickStepValue, quickPercentageStyle]);

  const stopQuickListening = useCallback(() => {
    quickIsListeningRef.current = false;
    setQuickIsListening(false);
    quickConsumedLengthRef.current.clear();
    quickConsumedValueRef.current.clear();
    if (quickRecognitionRef.current) {
      try {
        quickRecognitionRef.current.stop();
      } catch {}
      quickRecognitionRef.current = null;
    }
  }, []);

  const quickResultBoxesRef = useRef<QuickReflexComputedBox[]>(quickResultBoxes);
  const quickActiveBoxIndexRef = useRef<number>(quickActiveBoxIndex);
  const quickBoxStatusesRef = useRef<Record<number, QuickReflexBoxStatus>>(quickBoxStatuses);
  const quickRoundStateRef = useRef(quickRoundState);

  useEffect(() => {
    quickResultBoxesRef.current = quickResultBoxes;
  }, [quickResultBoxes]);

  useEffect(() => {
    quickActiveBoxIndexRef.current = quickActiveBoxIndex;
  }, [quickActiveBoxIndex]);

  useEffect(() => {
    quickBoxStatusesRef.current = quickBoxStatuses;
  }, [quickBoxStatuses]);

  useEffect(() => {
    quickRoundStateRef.current = quickRoundState;
  }, [quickRoundState]);

  const resetProgressForCurrentQuickGrid = useCallback(
    (newLimitSec?: number) => {
      const limit = newLimitSec ?? quickTimeLimitSec;
      setQuickUserEntries({});
      setQuickBoxStatuses({});
      setQuickActiveBoxIndex(1);
      setQuickShowAllAnswers(false);
      setQuickRemainingMs(limit * 1000);
      setQuickCompletedInMs(null);
      setQuickRoundState('idle');
      setQuickVoiceTranscript('');
      setQuickVoiceError('');
    },
    [quickTimeLimitSec]
  );

  const startQuickRound = useCallback(() => {
    if (!quickSelectedOp) return;
    if (quickRoundStateRef.current === 'completed' || quickRoundStateRef.current === 'timeout') {
      setQuickUserEntries({});
      setQuickBoxStatuses({});
      setQuickActiveBoxIndex(1);
      setQuickShowAllAnswers(false);
      setQuickCompletedInMs(null);
    }
    quickRoundStartAtRef.current = Date.now();
    setQuickRemainingMs(quickTimeLimitSec * 1000);
    setQuickRoundState('running');
    setQuickVoiceError('');
    setTimeout(() => quickInputRef.current?.focus(), 60);
  }, [quickSelectedOp, quickTimeLimitSec]);

  const applyNewQuickGeneration = useCallback(
    (op: ReflexOperation, digits: QuickReflexDigitMode, limitSecOverride?: number) => {
      const { start, step } = generateQuickReflexInitialState(op, digits);
      setQuickSelectedOp(op);
      setQuickStartDraft(String(start));
      setQuickStepValue(step);
      resetProgressForCurrentQuickGrid(limitSecOverride);
    },
    [resetProgressForCurrentQuickGrid]
  );

  // Effect: Bộ đếm ngược thời gian cho vòng chơi Phản xạ nhanh 9 ô
  useEffect(() => {
    if (!isQuickReflexActive || quickRoundState !== 'running' || !quickSelectedOp) return;
    const totalLimitMs = quickTimeLimitSec * 1000;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - quickRoundStartAtRef.current;
      const left = Math.max(0, totalLimitMs - elapsed);
      setQuickRemainingMs(left);
      if (left <= 0) {
        setQuickRoundState('timeout');
        stopQuickListening();
        if (isSpeakerEnabled) {
          playSpeakerChime('incorrect');
        }
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [isQuickReflexActive, quickRoundState, quickSelectedOp, quickTimeLimitSec, stopQuickListening, isSpeakerEnabled]);

  const findNextPendingQuickBox = (
    statuses: Record<number, QuickReflexBoxStatus>,
    afterIndex: number
  ): number | null => {
    for (let i = afterIndex + 1; i <= 9; i++) {
      if (statuses[i] !== 'correct') return i;
    }
    for (let i = 1; i <= 9; i++) {
      if (statuses[i] !== 'correct') return i;
    }
    return null;
  };

  const markQuickBoxCorrect = useCallback(
    (boxIndex: number, formattedDisplay: string) => {
      const nextStatuses: Record<number, QuickReflexBoxStatus> = {
        ...quickBoxStatusesRef.current,
        [boxIndex]: 'correct',
      };
      const nextPending = findNextPendingQuickBox(nextStatuses, boxIndex);
      if (nextPending !== null && nextStatuses[nextPending] === 'incorrect') {
        nextStatuses[nextPending] = 'pending';
      }

      quickBoxStatusesRef.current = nextStatuses;
      setQuickBoxStatuses(nextStatuses);
      setQuickUserEntries((prev) => ({
        ...prev,
        [boxIndex]: formattedDisplay,
        ...(nextPending !== null ? { [nextPending]: '' } : {}),
      }));
      setQuickVoiceTranscript('');

      if (nextPending === null) {
        const elapsed = Date.now() - quickRoundStartAtRef.current;
        setQuickCompletedInMs(elapsed);
        setQuickRoundState('completed');
        stopQuickListening();
        if (isSpeakerEnabled) {
          playSpeakerChime('correct');
          announceResultFemaleVoice(
            true,
            quickResultBoxesRef.current[boxIndex - 1]?.value ?? 0,
            isVi ? 'vi' : 'en'
          );
        }
      } else {
        quickActiveBoxIndexRef.current = nextPending;
        setQuickActiveBoxIndex(nextPending);
        if (isSpeakerEnabled) {
          playSpeakerChime('correct');
        }
        setTimeout(() => quickInputRef.current?.focus(), 20);
      }
    },
    [isSpeakerEnabled, isVi, stopQuickListening]
  );

  const evaluateQuickEntry = useCallback(
    (boxIndex: number, rawStr: string, allowAutoOnly: boolean) => {
      if (quickRoundStateRef.current !== 'running') return;
      const box = quickResultBoxesRef.current.find((b) => b.index === boxIndex);
      if (!box) return;

      const parsed = parseNumericString(rawStr);
      if (parsed === null) {
        if (!allowAutoOnly) {
          setQuickBoxStatuses((prev) => ({ ...prev, [boxIndex]: 'incorrect' }));
          if (isSpeakerEnabled) playSpeakerChime('incorrect');
        }
        return;
      }

      const isMatch = Math.abs(parsed - box.value) < 0.001;
      if (isMatch) {
        markQuickBoxCorrect(boxIndex, box.formatted);
      } else if (!allowAutoOnly) {
        setQuickBoxStatuses((prev) => ({ ...prev, [boxIndex]: 'incorrect' }));
        if (isSpeakerEnabled) playSpeakerChime('incorrect');
      }
    },
    [isSpeakerEnabled, markQuickBoxCorrect]
  );

  const updateQuickActiveDraft = useCallback(
    (nextVal: string) => {
      if (quickRoundStateRef.current !== 'running') return;
      const idx = quickActiveBoxIndexRef.current;
      setQuickUserEntries((prev) => ({ ...prev, [idx]: nextVal }));
      if (quickBoxStatusesRef.current[idx] === 'incorrect') {
        setQuickBoxStatuses((prev) => ({ ...prev, [idx]: 'pending' }));
      }
      evaluateQuickEntry(idx, nextVal, true);
    },
    [evaluateQuickEntry]
  );

  const handleQuickKeypadChar = (ch: string) => {
    if (quickRoundState !== 'running') return;
    const current = quickUserEntries[quickActiveBoxIndex] ?? '';
    if (ch === '−' || ch === '-') {
      if (current.startsWith('-')) {
        updateQuickActiveDraft(current.slice(1));
      } else {
        updateQuickActiveDraft('-' + current);
      }
      return;
    }
    if (ch === '.') {
      if (current.includes('.')) return;
      updateQuickActiveDraft(current ? current + '.' : '0.');
      return;
    }
    if (current.length >= 14) return;
    updateQuickActiveDraft(current + ch);
  };

  const handleQuickKeypadClear = () => {
    if (quickRoundState !== 'running') return;
    setQuickUserEntries((prev) => ({ ...prev, [quickActiveBoxIndex]: '' }));
    setQuickBoxStatuses((prev) => ({ ...prev, [quickActiveBoxIndex]: 'pending' }));
    quickInputRef.current?.focus();
  };

  const handleQuickKeypadBackspace = () => {
    if (quickRoundState !== 'running') return;
    const current = quickUserEntries[quickActiveBoxIndex] ?? '';
    const next = current.slice(0, -1);
    setQuickUserEntries((prev) => ({ ...prev, [quickActiveBoxIndex]: next }));
    setQuickBoxStatuses((prev) => ({ ...prev, [quickActiveBoxIndex]: 'pending' }));
  };

  const toggleQuickListening = () => {
    if (quickRoundState !== 'running') return;
    if (quickIsListening) {
      stopQuickListening();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQuickVoiceError(
        tr("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.")
      );
      return;
    }
    stopCurrentSpeech();
    setQuickVoiceError('');
    setQuickVoiceTranscript('');
    quickConsumedLengthRef.current.clear();
    quickConsumedValueRef.current.clear();
    quickLastSolvedSpeechRef.current = null;
    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      if (quickRoundStateRef.current !== 'running') return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const fullTranscript = res[0]?.transcript || '';
        const consumedOffset = quickConsumedLengthRef.current.get(i) ?? 0;
        const activeTranscript = fullTranscript.slice(consumedOffset);
        if (!activeTranscript.trim()) continue;

        setQuickVoiceTranscript(activeTranscript.trim());

        const parsed = parseQuickReflexVoice(activeTranscript, isVi ? 'vi' : 'en');
        if (parsed === null) continue;

        const prevSlotVal = quickConsumedValueRef.current.get(i);
        if (prevSlotVal !== undefined && Math.abs(prevSlotVal - parsed) < 0.001) {
          continue;
        }

        const idx = quickActiveBoxIndexRef.current;
        const activeBox = quickResultBoxesRef.current.find((b) => b.index === idx);
        if (!activeBox) continue;

        const now = Date.now();
        if (
          quickLastSolvedSpeechRef.current &&
          Math.abs(quickLastSolvedSpeechRef.current.value - parsed) < 0.001 &&
          now - quickLastSolvedSpeechRef.current.time < 3500 &&
          Math.abs(activeBox.value - parsed) >= 0.001
        ) {
          continue;
        }

        if (Math.abs(parsed - activeBox.value) < 0.001) {
          quickLastSolvedSpeechRef.current = { value: parsed, time: now };
          quickConsumedLengthRef.current.set(i, fullTranscript.length);
          quickConsumedValueRef.current.set(i, parsed);
          markQuickBoxCorrect(idx, activeBox.formatted);
          return;
        } else if (res.isFinal) {
          setQuickUserEntries((prev) => ({ ...prev, [idx]: String(parsed) }));
          setQuickBoxStatuses((prev) => ({ ...prev, [idx]: 'incorrect' }));
        }
      }
    };

    recognition.onerror = () => stopQuickListening();
    recognition.onend = () => {
      if (quickIsListeningRef.current && quickRoundStateRef.current === 'running') {
        quickConsumedLengthRef.current.clear();
        quickConsumedValueRef.current.clear();
        try {
          recognition.start();
        } catch {
          stopQuickListening();
        }
      }
    };

    quickRecognitionRef.current = recognition;
    quickIsListeningRef.current = true;
    setQuickIsListening(true);
    try {
      recognition.start();
    } catch {
      stopQuickListening();
    }
  };

  const handleSelectQuickOp = (op: ReflexOperation) => {
    stopQuickListening();
    applyNewQuickGeneration(op, quickDigitMode);
  };

  const handleChangeQuickDigits = (digits: QuickReflexDigitMode) => {
    setQuickDigitMode(digits);
    if (quickSelectedOp) {
      stopQuickListening();
      applyNewQuickGeneration(quickSelectedOp, digits);
    }
  };

  const handleChangeQuickTimeLimit = (sec: number) => {
    setQuickTimeLimitSec(sec);
    if (quickSelectedOp) {
      stopQuickListening();
      resetProgressForCurrentQuickGrid(sec);
    } else {
      setQuickRemainingMs(sec * 1000);
    }
  };

  const handleQuickReroll = () => {
    if (!quickSelectedOp) return;
    stopQuickListening();
    applyNewQuickGeneration(quickSelectedOp, quickDigitMode);
  };

  const quickActiveOpMeta = QUICK_REFLEX_OPS.find((o) => o.id === quickSelectedOp);
  const quickActiveBox = quickResultBoxes.find((b) => b.index === quickActiveBoxIndex);
  const quickSolvedCount = useMemo(
    () => Object.values(quickBoxStatuses).filter((s) => s === 'correct').length,
    [quickBoxStatuses]
  );

  const quickRemainingSec = quickRemainingMs / 1000;
  const quickRemainingPct = Math.max(
    0,
    Math.min(100, (quickRemainingMs / Math.max(1000, quickTimeLimitSec * 1000)) * 100)
  );

  const renderQuickStepPresets = () => {
    if (!quickSelectedOp) return null;

    if (quickSelectedOp === 'multiplication' || quickSelectedOp === 'division') {
      const presets =
        quickSelectedOp === 'multiplication' ? [2, 3, 4, 5, 9] : [2, 4, 5, 10];
      const sym = quickSelectedOp === 'multiplication' ? '×' : '÷';
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {quickSelectedOp === 'multiplication'
              ? tr("Nhân với:")
              : tr("Chia cho:")}
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQuickStepValue(p);
                resetProgressForCurrentQuickGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer tabular-nums ${
                quickStepValue === p
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
            value={quickStepDraft}
            onFocus={(e) => e.currentTarget.select()}
            onMouseUp={(e) => e.preventDefault()}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
              setQuickStepDraft(cleaned);
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed) && parsed > 0) {
                setQuickStepValue(parsed);
                resetProgressForCurrentQuickGrid();
              }
            }}
            onBlur={() => {
              const parsed = parseInt(quickStepDraft, 10);
              if (Number.isNaN(parsed) || parsed <= 0) {
                setQuickStepDraft(String(quickStepValue));
              }
            }}
            aria-label={tr("Hệ số tùy chỉnh")}
            className="w-12 h-7 px-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums selection:bg-yellow-400 selection:text-slate-950"
          />
        </div>
      );
    }

    if (quickSelectedOp === 'addition' || quickSelectedOp === 'subtraction') {
      const sym = quickSelectedOp === 'addition' ? '+' : '−';
      const presets =
        quickDigitMode === 1
          ? quickSelectedOp === 'addition'
            ? [2, 3, 5, 9]
            : [1, 2, 3, 5]
          : quickDigitMode === 2
          ? quickSelectedOp === 'addition'
            ? [11, 15, 25, 37]
            : [3, 5, 7, 9]
          : quickSelectedOp === 'addition'
          ? [25, 50, 125, 250]
          : [15, 25, 37, 45];
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {tr("Bước nhảy:")}
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQuickStepValue(p);
                resetProgressForCurrentQuickGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer tabular-nums ${
                quickStepValue === p
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
            value={quickStepDraft}
            onFocus={(e) => e.currentTarget.select()}
            onMouseUp={(e) => e.preventDefault()}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
              setQuickStepDraft(cleaned);
              const parsed = parseInt(cleaned, 10);
              if (!Number.isNaN(parsed) && parsed > 0) {
                setQuickStepValue(parsed);
                resetProgressForCurrentQuickGrid();
              }
            }}
            onBlur={() => {
              const parsed = parseInt(quickStepDraft, 10);
              if (Number.isNaN(parsed) || parsed <= 0) {
                setQuickStepDraft(String(quickStepValue));
              }
            }}
            aria-label={tr("Bước nhảy tùy chỉnh")}
            className="w-14 h-7 px-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums selection:bg-yellow-400 selection:text-slate-950"
          />
        </div>
      );
    }

    if (quickSelectedOp === 'exponent') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {tr("Số mũ:")}
          </span>
          {[2, 3].map((exp) => (
            <button
              key={exp}
              type="button"
              onClick={() => {
                setQuickStepValue(exp);
                resetProgressForCurrentQuickGrid();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                quickStepValue === exp
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

    if (quickSelectedOp === 'percentage') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setQuickPercentageStyle('ofBase');
                setQuickStepValue(10);
                resetProgressForCurrentQuickGrid();
              }}
              className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                quickPercentageStyle === 'ofBase'
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tr("10% → 90% của số")}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickPercentageStyle('chain');
                setQuickStepValue(10);
                resetProgressForCurrentQuickGrid();
              }}
              className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                quickPercentageStyle === 'chain'
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tr("Tăng +% nối tiếp")}
            </button>
          </div>
          {quickPercentageStyle === 'chain' && (
            <div className="flex items-center gap-1">
              {[10, 20, 25, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setQuickStepValue(p);
                    resetProgressForCurrentQuickGrid();
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    quickStepValue === p
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
        {tr("9 số chính phương liên tiếp để nhẩm căn bậc 2")}
      </span>
    );
  };

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
      stopCurrentSpeech();
      stopListening();
      stopQuickListening();
    };
  }, [stopListening, stopQuickListening]);

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

  const generateNewQuestion = useCallback(
    (
      modeOverride?: DailyReflexMode,
      diffOverride?: DailyReflexDifficulty,
      opsOverride?: ReflexOperation[]
    ) => {
      const activeMode = modeOverride ?? selectedMode;
      const activeDiff = diffOverride ?? difficulty;
      const activeOps = opsOverride ?? customOps;
      setQuestion(generateDailyReflexQuestion(activeMode, activeDiff, activeOps));
      setUserAnswer('');
      setFeedback('idle');
      setLastReactionMs(null);
      setElapsedMs(0);
      setPaceExpired(false);
      recordedCurrentRef.current = false;
      questionStartRef.current = Date.now();
      setVoiceTranscript('');
      setVoiceError('');
      stopCurrentSpeech();
      setIsSpeakingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [selectedMode, difficulty, customOps]
  );

  // Effect: Tự động chuyển câu mới sau khi trả lời đúng (khi bật Auto-Next)
  useEffect(() => {
    if (feedback === 'correct' && autoNextConfig.delaySec > 0) {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = window.setTimeout(() => {
        autoNextTimerRef.current = null;
        generateNewQuestion();
      }, Math.round(autoNextConfig.delaySec * 1000));
    } else if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [feedback, autoNextConfig.delaySec, generateNewQuestion]);

  const triggerAnnouncement = useCallback(
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  const verifyAnswer = useCallback(
    (rawVal: string) => {
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      const reactionMs = Date.now() - questionStartRef.current;

      if (parsed === questionRef.current.answer) {
        setFeedback('correct');
        setLastReactionMs(reactionMs);
        setSessionStreak((s) => s + 1);
        if (!recordedCurrentRef.current) {
          recordedCurrentRef.current = true;
          const nextStats = recordDailyReflexAttempt(true, reactionMs);
          setDailyStats(nextStats);
        }
        stopListening();
        if (isSpeakerEnabled) {
          triggerAnnouncement(true, questionRef.current.answer);
        }
      } else {
        setFeedback('incorrect');
        setSessionStreak(0);
        if (!recordedCurrentRef.current) {
          recordedCurrentRef.current = true;
          const nextStats = recordDailyReflexAttempt(false, reactionMs);
          setDailyStats(nextStats);
        }
        if (isSpeakerEnabled) {
          triggerAnnouncement(false, questionRef.current.answer);
        }
      }
    },
    [isSpeakerEnabled, stopListening, triggerAnnouncement]
  );

  const replayAnnouncement = () => {
    if (feedback === 'idle') return;
    triggerAnnouncement(feedback === 'correct', question.answer);
  };

  const toggleListening = () => {
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
        if (parsed !== null) {
          setUserAnswer(String(parsed));
          if (parsed === questionRef.current.answer || res.isFinal) {
            verifyAnswer(String(parsed));
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

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') setFeedback('idle');
      setUserAnswer((prev) => (prev.length >= 14 ? prev : prev + digit));
    },
    [feedback]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (feedback === 'incorrect') setFeedback('idle');
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleKeypadClear = useCallback(() => {
    if (feedback === 'correct') return;
    setUserAnswer('');
    setFeedback('idle');
    inputRef.current?.focus();
  }, [feedback]);

  const toggleCustomOperation = (op: ReflexOperation) => {
    const exists = customOps.includes(op);
    if (exists && customOps.length <= 1) return; // keep at least 1 op active
    const nextOps = exists
      ? customOps.filter((o) => o !== op)
      : [...customOps, op];
    setCustomOps(nextOps);
    if (selectedMode === 'custom') {
      generateNewQuestion('custom', difficulty, nextOps);
    }
  };

  const activeModeObj =
    DAILY_REFLEX_MODES.find((m) => m.id === selectedMode) || DAILY_REFLEX_MODES[0];

  const goalProgressPct = Math.min(
    100,
    Math.round((dailyStats.todayCompleted / Math.max(1, dailyStats.dailyGoal)) * 100)
  );
  const todayAccuracy =
    dailyStats.todayCompleted > 0
      ? Math.round((dailyStats.todayCorrect / dailyStats.todayCompleted) * 100)
      : 0;
  const avgSecStr =
    dailyStats.todayCompleted > 0
      ? (dailyStats.todayTotalMs / dailyStats.todayCompleted / 1000).toFixed(1)
      : '0.0';

  const displayTimeSec =
    targetPaceSec > 0
      ? Math.max(0, targetPaceSec - elapsedMs / 1000).toFixed(1)
      : ((lastReactionMs ?? elapsedMs) / 1000).toFixed(1);

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
      {/* Thanh điều hướng trên cùng: Quay lại + 5 nút (Hướng dẫn, Download PDF, Thử thách, Thử thách khó, Kết quả) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopCurrentSpeech();
            stopListening();
            stopQuickListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại")}</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isVisualGuideButtonVisible('DailyReflexPage') && (
            <>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                title={tr("Xem nhanh hướng dẫn toàn bộ Web App", "Quick guide for the entire Web App")}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>{tr("Hướng dẫn")}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadGuidePdf('Guide.pdf')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                title={tr("Tải hướng dẫn định dạng PDF")}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>{tr("Download PDF")}</span>
              </button>
            </>
          )}

          {isChallengeButtonVisible('DailyReflexPage') && onOpenChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                stopQuickListening();
                onOpenChallenge(selectedMode, customOps);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20 whitespace-nowrap"
              title={tr("Thử thách tính nhẩm tốc độ cao")}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950 text-slate-950" />
              <span>{tr("Thử thách")}</span>
            </button>
          )}

          {isDifficultLevelChallengeButtonVisible('DailyReflexPage') &&
            onOpenHardChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  stopQuickListening();
                  onOpenHardChallenge(selectedMode, customOps);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25 whitespace-nowrap"
                title={tr("Thử thách cấp độ khó")}
              >
                <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span>{tr("Thử thách")}</span>
              </button>
            )}

          <button
            type="button"
            onClick={() => {
              const next = !isSpeakerEnabled;
              setIsSpeakerEnabled(next);
              if (next) playSpeakerChime('correct');
            }}
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs sm:text-sm font-semibold whitespace-nowrap ${
              isSpeakerEnabled
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-xs ring-1 ring-sky-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
            title={
              isSpeakerEnabled
                ? tr("Đang bật thông báo kết quả (Bấm để tắt)")
                : tr("Đang tắt thông báo kết quả (Bấm để bật)")
            }
          >
            {isSpeakerEnabled ? (
              <Volume2
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 ${
                  isSpeaking ? 'animate-bounce' : ''
                }`}
              />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            )}
            <span>
              {isSpeakerEnabled
                ? tr("Kết quả: Bật")
                : tr("Kết quả: Tắt")}
            </span>
          </button>
        </div>
      </div>

      {/* Khung luyện tập chính */}
      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-yellow-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Thanh tiêu đề & Auto-Next */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {tr("Rèn luyện phản xạ tính nhẩm hàng ngày")}
            </h2>
          </div>

          {showAutoNextButton && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
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
                initialPageKey={"DailyReflexPage"}
              />
            </div>
          )}
        </div>

        {/* Thanh tiến độ mục tiêu & thống kê phản xạ trong ngày */}
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800/90 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Target className="w-3.5 h-3.5 text-yellow-400" />
                <span>{tr("Mục tiêu hôm nay:")}</span>
                <span className="font-mono font-bold text-yellow-300 tabular-nums">
                  {dailyStats.todayCompleted}/{dailyStats.dailyGoal}
                </span>
                {dailyStats.todayCompleted >= dailyStats.dailyGoal && (
                  <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" />
                    {tr("Hoàn thành")}
                  </span>
                )}
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">
                  {tr("Chuỗi ngày:")}
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {dailyStats.streakDays} {tr("ngày")}
                </span>
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400">
                  {tr("Chính xác:")}
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {todayAccuracy}%
                </span>
              </span>

              <span className="text-slate-600 hidden sm:inline">·</span>

              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400">
                  {tr("Tốc độ TB:")}
                </span>
                <span className="font-mono font-bold text-sky-300 tabular-nums">
                  {avgSecStr}s/{tr("câu")}
                </span>
              </span>
            </div>

            {/* Goal target selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-1.5 whitespace-nowrap">
                {tr("Chỉ tiêu:")}
              </span>
              {DAILY_GOAL_OPTIONS.map((goalVal) => (
                <button
                  key={goalVal}
                  type="button"
                  onClick={() => setDailyStats(updateDailyReflexGoal(goalVal))}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer tabular-nums ${
                    dailyStats.dailyGoal === goalVal
                      ? 'bg-yellow-400 text-slate-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {goalVal}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-300 ${
                goalProgressPct >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-500'
              }`}
              style={{ width: `${goalProgressPct}%` }}
            />
          </div>
        </div>

        {/* Thanh chọn chế độ, độ khó (Tiêu chuẩn / Nâng cao / Phản xạ nhanh) & nhịp thời gian */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                {tr("Chọn chế độ phản xạ hàng ngày:")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty & Quick Reflex toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    stopQuickListening();
                    setIsQuickReflexActive(false);
                    if (difficulty !== 'normal') {
                      setDifficulty('normal');
                      generateNewQuestion(selectedMode, 'normal', customOps);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    !isQuickReflexActive && difficulty === 'normal'
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr("Tiêu chuẩn")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopQuickListening();
                    setIsQuickReflexActive(false);
                    if (difficulty !== 'hard') {
                      setDifficulty('hard');
                      generateNewQuestion(selectedMode, 'hard', customOps);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    !isQuickReflexActive && difficulty === 'hard'
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr("Nâng cao")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickReflexActive(true);
                    stopCurrentSpeech();
                    stopListening();
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isQuickReflexActive
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr("Phản xạ nhanh")}
                </button>
              </div>

              {/* Target Pace Selector */}
              {!isQuickReflexActive && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1 whitespace-nowrap">
                    <Timer className="w-3 h-3 text-yellow-400" />
                    <span className="hidden sm:inline">
                      {tr("Nhịp:")}
                    </span>
                  </span>
                  {PACE_OPTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setTargetPaceSec(sec);
                        setPaceExpired(false);
                      }}
                      className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                        targetPaceSec === sec
                          ? 'bg-yellow-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? (tr("Tự do")) : `${sec}s`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isQuickReflexActive && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                {DAILY_REFLEX_MODES.map((modeItem) => (
                  <button
                    key={modeItem.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(modeItem.id);
                      generateNewQuestion(modeItem.id, difficulty, customOps);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                      selectedMode === modeItem.id
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{modeItem.icon}</span>
                    <span className="truncate">
                      {isVi ? modeItem.labelVi : modeItem.labelEn}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom operation toggles when Custom mode is active */}
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
                        onClick={() => toggleCustomOperation(op.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
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
            </>
          )}
        </div>

        {isQuickReflexActive ? (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Top Controls: Digit Length (1/2/3), Time Limit, & 7 Operations */}
            <div className="rounded-2xl bg-slate-950/75 border border-slate-800 p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                  <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>
                    {tr("Chọn phép toán và số chữ số để tạo 9 ô phản xạ nhanh:")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 1-digit / 2-digit / 3-digit toggle */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    {QUICK_DIGIT_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleChangeQuickDigits(d)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          quickDigitMode === d
                            ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {isVi ? `${d} chữ số` : `${d}-Digit`}
                      </button>
                    ))}
                  </div>

                  {/* 9-Box Time Limit Input */}
                  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 max-w-full">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{tr("Giới hạn:")}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        disabled={quickRoundState === 'running'}
                        value={quickLimitDraft}
                        onFocus={(e) => {
                          isEditingQuickLimitRef.current = true;
                          e.currentTarget.select();
                        }}
                        onMouseUp={(e) => e.preventDefault()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                          setQuickLimitDraft(cleaned);
                          if (cleaned.length > 0) {
                            const parsed = parseInt(cleaned, 10);
                            if (!Number.isNaN(parsed) && parsed >= 1) {
                              handleChangeQuickTimeLimit(Math.min(999, Math.max(1, Math.round(parsed))));
                            }
                          }
                        }}
                        onBlur={() => {
                          isEditingQuickLimitRef.current = false;
                          const parsed = parseInt(quickLimitDraft, 10);
                          const resolved =
                            Number.isNaN(parsed) || parsed < 1
                              ? Math.min(
                                  999,
                                  Math.max(
                                    1,
                                    quickTimeLimitSec >= 1 ? Math.round(quickTimeLimitSec) : 60
                                  )
                                )
                              : Math.min(999, Math.max(1, Math.round(parsed)));
                          setQuickLimitDraft(String(resolved));
                          handleChangeQuickTimeLimit(resolved);
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

                  {quickSelectedOp && (
                    <>
                      <button
                        type="button"
                        onClick={startQuickRound}
                        disabled={quickRoundState === 'running'}
                        title={tr("Bắt đầu tính giờ trả lời 9 ô")}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25 whitespace-nowrap ${
                          quickRoundState === 'running' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{tr("Bắt đầu")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickReroll}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/40 text-yellow-300 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{tr("Số mới")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuickShowAllAnswers((s) => !s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                          quickShowAllAnswers
                            ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {quickShowAllAnswers ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{tr("Ẩn đáp án")}</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tr("Hiện đáp án")}</span>
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
                  const isSelected = quickSelectedOp === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => handleSelectQuickOp(op.id)}
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
            {!quickSelectedOp ? (
              <div className="rounded-3xl bg-slate-950/75 border border-slate-800/90 p-8 text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
                  <Hash className="w-5 h-5" />
                </div>
                <p className="text-sm sm:text-base font-bold text-white">
                  {tr("Chọn một trong 7 phép toán ở trên để bắt đầu")}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr("Hệ thống sẽ tạo 1 số gốc ngẫu nhiên (1, 2 hoặc 3 chữ số) cùng 9 ô trả lời (3×3) và bộ đếm thời gian giới hạn để bạn phản xạ bằng bàn phím hoặc giọng nói.")}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-950/80 border border-yellow-500/30 p-3.5 sm:p-5 space-y-3.5">
                {/* Sub-header: Active op, step presets, and live countdown */}
                <div className="space-y-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-yellow-400">
                        {isVi ? quickActiveOpMeta?.labelVi : quickActiveOpMeta?.labelEn}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        {isVi ? `${quickDigitMode} chữ số` : `${quickDigitMode}-Digit`}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-semibold tabular-nums">
                        {isVi ? `Đã đúng ${quickSolvedCount}/9 ô` : `${quickSolvedCount}/9 solved`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderQuickStepPresets()}

                      {/* Live Countdown Badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-mono font-bold tabular-nums ${
                          quickRoundState === 'completed'
                            ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                            : quickRoundState === 'timeout'
                            ? 'bg-rose-500/15 border-rose-400/50 text-rose-300'
                            : quickRemainingSec <= 5
                            ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                            : quickRemainingSec <= 12
                            ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                            : 'bg-slate-900 border-yellow-500/35 text-yellow-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {quickRoundState === 'completed' && quickCompletedInMs !== null
                            ? `${(quickCompletedInMs / 1000).toFixed(1)}s`
                            : `${quickRemainingSec.toFixed(1)}s / ${quickTimeLimitSec}s`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-100 ${
                        quickRoundState === 'completed'
                          ? 'bg-emerald-400'
                          : quickRoundState === 'timeout' || quickRemainingSec <= 5
                          ? 'bg-rose-500'
                          : quickRemainingSec <= 12
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      }`}
                      style={{
                        width: `${quickRoundState === 'completed' ? 100 : quickRemainingPct}%`,
                      }}
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
                          ? `Số gốc ngẫu nhiên (${quickDigitMode} chữ số)`
                          : `Random Start (${quickDigitMode}-Digit)`}
                      </label>
                      <input
                        id="quick-reflex-start-input"
                        type="text"
                        inputMode="decimal"
                        value={quickStartDraft}
                        onFocus={(e) => e.currentTarget.select()}
                        onMouseUp={(e) => e.preventDefault()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d.-]/g, '').slice(0, 8);
                          setQuickStartDraft(cleaned);
                          resetProgressForCurrentQuickGrid();
                        }}
                        className="w-32 sm:w-40 h-10 px-3 rounded-xl bg-slate-950 border border-yellow-400/60 focus:border-yellow-300 focus:outline-none text-center text-xl sm:text-2xl font-black font-mono text-yellow-300 tabular-nums selection:bg-yellow-400 selection:text-slate-950"
                      />
                    </div>

                    {/* 3 Columns × 3 Rows Answer Grid (9 Boxes) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                      {quickResultBoxes.map((box) => {
                        const status = quickBoxStatuses[box.index] ?? 'pending';
                        const isActive =
                          quickRoundState === 'running' && quickActiveBoxIndex === box.index;
                        const entryStr = quickUserEntries[box.index] ?? '';
                        const revealCorrect =
                          status === 'correct' ||
                          quickShowAllAnswers ||
                          quickRoundState === 'timeout';

                        return (
                          <button
                            key={box.index}
                            type="button"
                            onClick={() => {
                              if (quickRoundState === 'running') {
                                setQuickActiveBoxIndex(box.index);
                                setTimeout(() => quickInputRef.current?.focus(), 40);
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
                                {(() => {
                                  if (quickRoundState === 'idle' && !quickShowAllAnswers) {
                                    return tr("Sẵn sàng");
                                  }
                                  const label =
                                    box.maskedFormulaLabel &&
                                    box.index > 1 &&
                                    !quickShowAllAnswers &&
                                    quickRoundState === 'running' &&
                                    quickBoxStatuses[box.index - 1] !== 'correct'
                                      ? isVi
                                        ? box.maskedFormulaLabel
                                        : box.maskedFormulaLabel.replace('Ô ', 'Box ')
                                      : box.formulaLabel;
                                  if (label.startsWith('√')) {
                                    return (
                                      <span className="inline-flex items-center">
                                        <span className="text-yellow-400 mr-0.5 font-sans">√</span>
                                        <span className="border-t border-yellow-300/80 pt-px px-0.5">
                                          {label.slice(1)}
                                        </span>
                                      </span>
                                    );
                                  }
                                  return label;
                                })()}
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
                                    quickRoundState === 'timeout'
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
                      if (quickRoundState === 'running') {
                        evaluateQuickEntry(
                          quickActiveBoxIndex,
                          quickUserEntries[quickActiveBoxIndex] ?? '',
                          false
                        );
                      } else {
                        handleQuickReroll();
                      }
                    }}
                    className="lg:col-span-5 flex flex-col justify-between space-y-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 p-3 sm:p-4"
                  >
                    <div className="space-y-2.5">
                      {/* Active Box Indicator */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-300">
                          {quickRoundState === 'idle'
                            ? tr("Sẵn sàng tính giờ 9 ô")
                            : quickRoundState === 'completed'
                            ? tr("Hoàn thành cả 9 ô!")
                            : quickRoundState === 'timeout'
                            ? tr("Hết thời gian!")
                            : isVi
                            ? `Đang trả lời: Ô ${quickActiveBoxIndex}/9`
                            : `Answering: Box ${quickActiveBoxIndex}/9`}
                        </span>
                        {quickActiveBox && quickRoundState === 'running' && (
                          <span className="font-mono font-bold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-lg tabular-nums inline-flex items-center gap-1">
                            {(() => {
                              const label =
                                quickActiveBox.maskedFormulaLabel &&
                                quickActiveBox.index > 1 &&
                                !quickShowAllAnswers &&
                                quickBoxStatuses[quickActiveBox.index - 1] !== 'correct'
                                  ? isVi
                                    ? quickActiveBox.maskedFormulaLabel
                                    : quickActiveBox.maskedFormulaLabel.replace('Ô ', 'Box ')
                                  : quickActiveBox.formulaLabel;
                              if (label.startsWith('√')) {
                                return (
                                  <span className="inline-flex items-center">
                                    <span className="text-yellow-400 mr-0.5 font-sans">√</span>
                                    <span className="border-t border-yellow-300/80 pt-px px-0.5">
                                      {label.slice(1)}
                                    </span>
                                  </span>
                                );
                              }
                              return <span>{label}</span>;
                            })()}
                            <span>= ?</span>
                          </span>
                        )}
                      </div>

                      {/* Completion / Timeout Banner */}
                      {quickRoundState === 'completed' && (
                        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm font-bold animate-in zoom-in-95 duration-150">
                          <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            {isVi
                              ? `Tuyệt vời! Bạn hoàn thành 9/9 ô trong ${((quickCompletedInMs ?? 0) / 1000).toFixed(1)}s.`
                              : `Awesome! You solved 9/9 boxes in ${((quickCompletedInMs ?? 0) / 1000).toFixed(1)}s.`}
                          </span>
                        </div>
                      )}

                      {quickRoundState === 'timeout' && (
                        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center gap-2.5 text-rose-300 text-xs sm:text-sm font-bold animate-in zoom-in-95 duration-150">
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          <span>
                            {isVi
                              ? `Hết giờ (${quickTimeLimitSec}s)! Đạt ${quickSolvedCount}/9 ô. Đáp án đúng đã hiển thị ở lưới.`
                              : `Time's up (${quickTimeLimitSec}s)! Score: ${quickSolvedCount}/9. Correct answers shown.`}
                          </span>
                        </div>
                      )}

                      {/* Main Answer Textbox */}
                      <div className="relative flex items-center">
                        <input
                          ref={quickInputRef}
                          type="text"
                          inputMode="none"
                          disabled={quickRoundState !== 'running'}
                          value={quickUserEntries[quickActiveBoxIndex] ?? ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d.-]/g, '').slice(0, 14);
                            updateQuickActiveDraft(cleaned);
                          }}
                          placeholder={
                            quickRoundState === 'idle'
                              ? tr("Bấm \"Bắt đầu\" để tính giờ trả lời 9 ô...")
                              : quickIsListening
                              ? tr("Đang nghe... Hãy đọc đáp án")
                              : tr("Nhập bằng phím số hoặc giọng nói...")
                          }
                          className={`w-full h-12 sm:h-13 px-4 text-center text-2xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs placeholder:font-sans focus:outline-none transition-all shadow-inner ${
                            quickIsListening
                              ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                              : quickBoxStatuses[quickActiveBoxIndex] === 'incorrect'
                              ? 'border-rose-400 focus:border-rose-400'
                              : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                          }`}
                        />
                        {quickUserEntries[quickActiveBoxIndex] && quickRoundState === 'running' && (
                          <button
                            type="button"
                            onClick={handleQuickKeypadClear}
                            className="absolute right-3 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title={tr("Xóa ô nhập")}
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
                              onClick={() => handleQuickKeypadChar(key)}
                              disabled={quickRoundState !== 'running'}
                              className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base font-bold border border-slate-800 hover:border-yellow-500/50 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                            >
                              {key}
                            </button>
                          ))}

                          {['7', '8', '9', '0', '.'].map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleQuickKeypadChar(key)}
                              disabled={quickRoundState !== 'running'}
                              className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base font-bold border border-slate-800 hover:border-yellow-500/50 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                            >
                              {key}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={handleQuickKeypadClear}
                            disabled={
                              quickRoundState !== 'running' ||
                              !quickUserEntries[quickActiveBoxIndex]
                            }
                            className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs border border-slate-800 hover:border-rose-500/40 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                            title={tr("Xóa toàn bộ")}
                          >
                            {tr("Xóa [Ngắn]")}
                          </button>

                          <button
                            type="button"
                            onClick={handleQuickKeypadBackspace}
                            disabled={
                              quickRoundState !== 'running' ||
                              !quickUserEntries[quickActiveBoxIndex]
                            }
                            className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                            title={tr("Xóa 1 ký tự")}
                            aria-label="Backspace"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Live Voice Feedback */}
                      {quickIsListening && (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                          <span className="truncate">
                            {quickVoiceTranscript
                              ? `${tr("Đang nhận diện:")} "${quickVoiceTranscript}"`
                              : tr("Đang lắng nghe: Hãy đọc to đáp án cho từng ô")}
                          </span>
                        </div>
                      )}

                      {quickVoiceError && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="flex-1 font-semibold">{quickVoiceError}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Start / Check / Play Again + Voice + New Number */}
                    <div className="flex items-center gap-2 pt-1">
                      {quickRoundState === 'idle' ? (
                        <button
                          type="button"
                          onClick={startQuickRound}
                          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-500/25 active:scale-95 text-xs sm:text-sm"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>{tr("Bắt đầu")}</span>
                        </button>
                      ) : quickRoundState === 'running' ? (
                        <button
                          type="submit"
                          className="flex-1 h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                        >
                          <span>{tr("Kiểm tra")}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleQuickReroll}
                          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>{tr("Chơi lượt mới")}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleQuickListening}
                        disabled={quickRoundState !== 'running'}
                        title={
                          quickIsListening
                            ? tr("Đang nghe... Bấm để dừng")
                            : tr("Trả lời liên tiếp bằng giọng nói")
                        }
                        className={`h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                          quickIsListening
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40'
                        }`}
                      >
                        {quickIsListening ? (
                          <>
                            <MicOff className="w-4 h-4 text-white" />
                            <span>{tr("Dừng")}</span>
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
                        onClick={handleQuickReroll}
                        title={tr("Đổi số mới & chạy lại đồng hồ")}
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
        ) : (
          /* Khu vực làm bài chế độ chuẩn/tùy chọn chia 2 cột: Đề bài (trái) & Nhập đáp án (phải) */
          <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
            {/* Cột trái: Hiển thị đề bài, badge thời gian phản xạ, chuỗi đúng & gợi ý */}
            <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
                  {isVi ? question.opLabelVi : question.opLabelEn}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-slate-300 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                  {isVi ? activeModeObj.labelVi : activeModeObj.labelEn}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold tabular-nums border ${
                    paceExpired && feedback !== 'correct'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : feedback === 'correct'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                      : 'bg-slate-900 text-sky-300 border-slate-800'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{displayTimeSec}s</span>
                </span>
                {sessionStreak >= 2 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 tabular-nums">
                    {isVi ? `Chuỗi ${sessionStreak}` : `Streak ${sessionStreak}`}
                  </span>
                )}
              </div>

              {/* Hiển thị phép tính phản xạ, nút loa đọc đề & bộ chọn tốc độ đọc (code trực tiếp trong Page) */}
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

              {feedback !== 'idle' && (
                <div className="mt-3 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                  <span className="font-bold text-yellow-400 mr-1.5">
                    {tr("Gợi ý:")}
                  </span>
                  {isVi ? question.hintVi : question.hintEn}
                </div>
              )}

              {feedback === 'correct' && (
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isVi
                      ? `Chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                      : `Correct: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                    {lastReactionMs !== null &&
                      ` (${(lastReactionMs / 1000).toFixed(1)}s)`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60"
                    title={tr("Nghe lại thông báo kết quả")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {feedback === 'incorrect' && (
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {isVi
                      ? `Chưa chính xác: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`
                      : `Incorrect: ${question.answer.toLocaleString()}${question.answerSuffix || ''}`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60"
                    title={tr("Nghe lại thông báo kết quả")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Cột phải: Ô nhập đáp án, bàn phím số ảo 2x6 & điều khiển giọng nói */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (feedback === 'correct') generateNewQuestion();
                else verifyAnswer(userAnswer);
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
                    isListening
                      ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn [Đọc to]")
                      : tr("Nhập kết quả hoặc bấm phím số bên dưới...")
                  }
                  disabled={feedback === 'correct'}
                  className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                    isListening
                      ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                      : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                  }`}
                />
                {question.answerSuffix && (
                  <span className="absolute right-11 text-lg sm:text-xl font-black text-yellow-400 pointer-events-none select-none">
                    {question.answerSuffix}
                  </span>
                )}
                {userAnswer && feedback !== 'correct' && (
                  <button
                    type="button"
                    onClick={handleKeypadClear}
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
                      onClick={() => handleKeypadDigit(String(digit))}
                      disabled={feedback === 'correct'}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label={`Digit ${digit}`}
                    >
                      {digit}
                    </button>
                  ))}

                  {[7, 8, 9, 0].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(String(digit))}
                      disabled={feedback === 'correct'}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label={`Digit ${digit}`}
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    disabled={feedback === 'correct' || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa toàn bộ")}
                  >
                    {tr("Xóa")}
                  </button>

                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    disabled={feedback === 'correct' || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-400/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa 1 số")}
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
                      : tr("🎙️ Đang lắng nghe: Hãy đọc to đáp án của bạn")}
                  </span>
                </div>
              )}

              {voiceError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="flex-1 font-semibold leading-relaxed">{voiceError}</p>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {feedback === 'correct' ? (
                  <button
                    type="button"
                    onClick={() => generateNewQuestion()}
                    className="flex-1 h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>
                      {autoNextConfig.delaySec > 0
                        ? isVi
                          ? `Câu tiếp theo - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                          : `Next Problem - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                        : tr("Câu tiếp theo")}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>{tr("Kết quả [Đáp án]")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={feedback === 'correct'}
                  title={
                    isListening
                      ? tr("Đang nghe... Bấm để dừng")
                      : tr("Bấm để trả lời bằng giọng nói")
                  }
                  className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
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
                  onClick={() => generateNewQuestion()}
                  title={tr("Đổi đề bài khác")}
                  className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Inline Quick Guide Modal coded directly in Page */}
      {isGuideModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsGuideModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {tr("Hướng dẫn:")} {tr("Phản xạ hàng ngày")}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tr("Xem nhanh mẹo tính nhẩm & tài liệu hướng dẫn Web App")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={tr("Đóng")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>{tr("Phương pháp tính nhẩm nhanh")}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {tr("Luyện tập phản xạ tính nhẩm siêu tốc tổng hợp phép cộng, trừ, nhân, chia, lũy thừa, căn bậc 2 và dãy số liên tiếp.")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {onOpenVisualGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuideModalOpen(false);
                      onOpenVisualGuide();
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>{tr("Xem Hướng Dẫn Trực Quan (Từng bước)")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadGuidePdf('Guide.pdf')}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>{tr("Tải tài liệu Guide.pdf toàn Web App")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
