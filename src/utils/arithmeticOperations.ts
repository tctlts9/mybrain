export type ArithmeticOperation =
  | 'division'
  | 'addition'
  | 'subtraction'
  | 'square-root'
  | 'exponent';

export interface OperationQuestion {
  a: number;
  b?: number;
  answer: number;
  hintVi: string;
  hintEn: string;
}

export interface OperationTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

export interface OperationMeta {
  id: ArithmeticOperation;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  symbol: string;
  topics: OperationTopic[];
}

export const OPERATION_META: Record<ArithmeticOperation, OperationMeta> = {
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
  addition: {
    id: 'addition',
    titleVi: 'Phép Cộng Nhẩm Siêu Tốc',
    titleEn: 'Fast Mental Addition',
    subtitleVi: 'Cộng từ trái sang phải và cộng bù tròn chục, tròn trăm',
    subtitleEn: 'Left-to-right mental addition and rounding complements',
    symbol: '+',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Cộng 2–4 chữ số & Bù tròn',
        badgeEn: 'General: 2–4 Digit & Complements',
      },
      {
        id: 'add2Digit',
        labelVi: '2 chữ số',
        labelEn: '2-Digit',
        badgeVi: 'Chuyên đề: Cộng 2 chữ số + 2 chữ số',
        badgeEn: 'Topic: 2-Digit + 2-Digit',
      },
      {
        id: 'add3Digit',
        labelVi: '3 chữ số',
        labelEn: '3-Digit',
        badgeVi: 'Chuyên đề: Cộng 3 chữ số + 3 chữ số',
        badgeEn: 'Topic: 3-Digit + 3-Digit',
      },
      {
        id: 'add4Digit',
        labelVi: '4 chữ số',
        labelEn: '4-Digit',
        badgeVi: 'Chuyên đề: Cộng 4 chữ số + 4 chữ số',
        badgeEn: 'Topic: 4-Digit + 4-Digit',
      },
      {
        id: 'addComplement',
        labelVi: 'Cộng bù tròn',
        labelEn: 'Round & Add',
        badgeVi: 'Chuyên đề: Cộng bù tròn trăm / tròn chục',
        badgeEn: 'Topic: Rounding & Compensation',
      },
    ],
  },
  subtraction: {
    id: 'subtraction',
    titleVi: 'Phép Trừ Nhẩm Siêu Tốc',
    titleEn: 'Fast Mental Subtraction',
    subtitleVi: 'Trừ từ trái sang phải, bù số và quy tắc 1000 − số bất kỳ',
    subtitleEn: 'Left-to-right subtraction, complements, and 1000-minus shortcuts',
    symbol: '−',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Trừ 2–4 chữ số & Bù 1000',
        badgeEn: 'General: 2–4 Digit & 1000-Complement',
      },
      {
        id: 'sub2Digit',
        labelVi: '2 chữ số',
        labelEn: '2-Digit',
        badgeVi: 'Chuyên đề: Trừ 2 chữ số − 2 chữ số',
        badgeEn: 'Topic: 2-Digit − 2-Digit',
      },
      {
        id: 'sub3Digit',
        labelVi: '3 chữ số',
        labelEn: '3-Digit',
        badgeVi: 'Chuyên đề: Trừ 3 chữ số − 3 chữ số',
        badgeEn: 'Topic: 3-Digit − 3-Digit',
      },
      {
        id: 'sub4Digit',
        labelVi: '4 chữ số',
        labelEn: '4-Digit',
        badgeVi: 'Chuyên đề: Trừ 4 chữ số − 4 chữ số',
        badgeEn: 'Topic: 4-Digit − 4-Digit',
      },
      {
        id: 'subPower10',
        labelVi: 'Bù 1000 / 10000',
        labelEn: '1000 − N',
        badgeVi: 'Chuyên đề: Phép trừ bù 1000 / 10000',
        badgeEn: 'Topic: 1000 / 10000 − N',
      },
    ],
  },
  'square-root': {
    id: 'square-root',
    titleVi: 'Tính Nhẩm Căn Bậc 2',
    titleEn: 'Mental Square Root',
    subtitleVi: 'Nhẩm căn bậc 2 số chính phương dựa vào chữ số tận cùng & cặp đầu',
    subtitleEn: 'Instant mental square roots of perfect squares via unit-digit anchors',
    symbol: '√',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Căn bậc 2 (10 – 250)',
        badgeEn: 'General: Roots (10 – 250)',
      },
      {
        id: 'sqrtSmall',
        labelVi: '10 – 30',
        labelEn: '10 – 30',
        badgeVi: 'Chuyên đề: Căn bậc 2 số 3 chữ số (√100 – √900)',
        badgeEn: 'Topic: 3-Digit Squares (√100 – √900)',
      },
      {
        id: 'sqrt4Digit',
        labelVi: '4 chữ số (31–99)',
        labelEn: '4-Digit (31–99)',
        badgeVi: 'Chuyên đề: Căn bậc 2 số 4 chữ số (√1024 – √9801)',
        badgeEn: 'Topic: 4-Digit Squares (√1024 – √9801)',
      },
      {
        id: 'sqrt5Digit',
        labelVi: '5–6 chữ số',
        labelEn: '5–6 Digit',
        badgeVi: 'Chuyên đề: Căn bậc 2 số 5–6 chữ số (√10000 – √99225)',
        badgeEn: 'Topic: 5–6 Digit Squares (√10000 – √99225)',
      },
    ],
  },
  exponent: {
    id: 'exponent',
    titleVi: 'Tính Nhẩm Lũy Thừa',
    titleEn: 'Mental Exponents & Powers',
    subtitleVi: 'Bình phương tận cùng là 5, bình phương 2 chữ số, lập phương & lũy thừa 2',
    subtitleEn: 'Squaring numbers ending in 5, 2-digit squares, cubes & powers of 2',
    symbol: 'xⁿ',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Bình phương & Lũy thừa',
        badgeEn: 'General: Squares & Powers',
      },
      {
        id: 'powEnd5',
        labelVi: 'Tận cùng 5 (n5²)',
        labelEn: 'Ending in 5 (n5²)',
        badgeVi: 'Chuyên đề: Bình phương số tận cùng là 5 (n5²)',
        badgeEn: 'Topic: Squaring Numbers Ending in 5 (n5²)',
      },
      {
        id: 'powSquare2D',
        labelVi: 'Bình phương 2CS',
        labelEn: '2-Digit Squares',
        badgeVi: 'Chuyên đề: Bình phương số 2 chữ số (11² – 99²)',
        badgeEn: 'Topic: 2-Digit Squares (11² – 99²)',
      },
      {
        id: 'powCubesAnd2',
        labelVi: 'Lập phương & 2ⁿ',
        labelEn: 'Cubes & 2ⁿ',
        badgeVi: 'Chuyên đề: Lũy thừa bậc 3 (2³–15³) và 2ⁿ, 3ⁿ',
        badgeEn: 'Topic: Cubes (2³–15³) & Powers of 2, 3',
      },
    ],
  },
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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

export type OperationDifficulty = 'normal' | 'hard';

export function generateOperationQuestion(
  operation: ArithmeticOperation,
  topicId: string,
  difficulty: OperationDifficulty = 'normal'
): OperationQuestion {
  const isHard = difficulty === 'hard';

  if (operation === 'division') {
    let mode = topicId;
    if (mode === 'general') {
      const pool = ['div1Digit', 'div5or25', 'div2Digit', 'div3Digit'];
      mode = pool[randInt(0, pool.length - 1)];
    }

    if (mode === 'div5or25') {
      const isDiv5 = Math.random() < (isHard ? 0.5 : 0.6);
      if (isDiv5) {
        let quotient = isHard ? randInt(125, 989) : randInt(14, 480);
        if (isHard && quotient % 10 === 0) quotient += randInt(1, 9);
        const dividend = quotient * 5;
        return {
          a: dividend,
          b: 5,
          answer: quotient,
          hintVi: `Mẹo chia 5: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
          hintEn: `÷ 5 Trick: (${dividend.toLocaleString()} × 2) ÷ 10 = ${(dividend * 2).toLocaleString()} ÷ 10 = ${quotient.toLocaleString()}`,
        };
      }
      let quotient = isHard ? randInt(64, 398) : randInt(11, 160);
      if (isHard && quotient % 10 === 0) quotient += randInt(1, 9);
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
      let divisor = isHard ? randInt(19, 69) : randInt(12, 38);
      if (isHard && divisor % 10 === 0) divisor += randInt(2, 8);
      let quotient = isHard ? randInt(28, 125) : randInt(12, 85);
      if (isHard && quotient % 10 === 0) quotient += randInt(1, 9);
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
      let divisor = isHard ? randInt(125, 495) : randInt(105, 295);
      if (divisor % 10 === 0) divisor += randInt(2, 8);
      let quotient = isHard ? randInt(12, 58) : randInt(6, 32);
      if (isHard && quotient % 10 === 0) quotient += randInt(1, 9);
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
    const divisor = isHard ? randInt(4, 9) : randInt(2, 9);
    let quotient = isHard ? randInt(125, 989) : randInt(18, 399);
    if (isHard && quotient % 10 === 0) quotient += randInt(1, 9);
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
      mode = pool[randInt(0, pool.length - 1)];
    }

    if (mode === 'add2Digit') {
      const a = isHard ? randInt(56, 99) : randInt(15, 99);
      const b = isHard ? randInt(56, 99) : randInt(15, 99);
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
      const a = isHard ? randInt(385, 998) : randInt(120, 989);
      const b = isHard ? randInt(385, 998) : randInt(110, 989);
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
      const a = isHard ? randInt(2450, 9989) : randInt(1100, 8999);
      const b = isHard ? randInt(2450, 9989) : randInt(1100, 8999);
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

    // addComplement
    const baseRound = isHard ? randInt(2, 9) * 1000 : randInt(2, 9) * 100;
    const offset = isHard ? randInt(1, 9) : randInt(1, 5);
    const a = baseRound - offset;
    const b = isHard ? randInt(1235, 6895) : randInt(115, 685);
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
      mode = pool[randInt(0, pool.length - 1)];
    }

    if (mode === 'sub2Digit') {
      let a = isHard ? randInt(62, 98) : randInt(42, 99);
      let b = isHard ? randInt(27, a - 14) : randInt(13, a - 5);
      if (isHard && a % 10 >= b % 10) {
        // Force a borrow in the units column when possible
        const aUnit = randInt(1, 5);
        const bUnit = randInt(aUnit + 2, 9);
        a = randInt(7, 9) * 10 + aUnit;
        b = randInt(2, Math.floor((a - 15) / 10)) * 10 + bUnit;
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
      const a = isHard ? randInt(512, 994) : randInt(320, 999);
      const b = isHard ? randInt(248, a - 45) : randInt(115, a - 25);
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
      const a = isHard ? randInt(4120, 9989) : randInt(2500, 9999);
      const b = isHard ? randInt(1650, a - 320) : randInt(1100, a - 150);
      const ans = a - b;
      return {
        a,
        b,
        answer: ans,
        hintVi: `Trừ từng hàng từ trái sang phải: ${a.toLocaleString()} − ${b.toLocaleString()} = ${ans.toLocaleString()}`,
        hintEn: `Left-to-right subtraction: ${a.toLocaleString()} − ${b.toLocaleString()} = ${ans.toLocaleString()}`,
      };
    }

    // subPower10
    const is100000 = isHard && Math.random() < 0.65;
    const is10000 = !is100000 && (isHard || Math.random() < 0.35);
    const base = is100000 ? 100000 : is10000 ? 10000 : 1000;
    let b = is100000
      ? randInt(12345, 98765)
      : is10000
      ? randInt(1234, 9876)
      : randInt(124, 986);
    if (b % 10 === 0) b += randInt(1, 9);
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
      mode = pool[randInt(0, pool.length - 1)];
    }

    let root = 25;
    if (mode === 'sqrtSmall') {
      root = isHard ? randInt(18, 30) : randInt(10, 30);
    } else if (mode === 'sqrt4Digit') {
      root = isHard ? randInt(46, 99) : randInt(32, 99);
    } else {
      root = isHard ? randInt(135, 495) : randInt(100, 295);
    }
    if (isHard && root % 10 === 0) root += randInt(1, 9);
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
    mode = pool[randInt(0, pool.length - 1)];
  }

  if (mode === 'powEnd5') {
    const tens = isHard ? randInt(6, 15) : randInt(1, 11);
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
    let base = isHard ? randInt(51, 99) : randInt(11, 99);
    if (isHard && base % 10 === 0) base += randInt(1, 9);
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

  // powCubesAnd2
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
  const [base, exp] = choices[randInt(0, choices.length - 1)];
  const ans = Math.pow(base, exp);
  return {
    a: base,
    b: exp,
    answer: ans,
    hintVi: `${base}^${exp} = ${Array(exp).fill(base).join(' × ')} = ${ans.toLocaleString()}`,
    hintEn: `${base}^${exp} = ${Array(exp).fill(base).join(' × ')} = ${ans.toLocaleString()}`,
  };
}

export function getOperationSpokenText(
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
