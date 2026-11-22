export type PercentageMode = 'basic' | 'change' | 'reverse';

export interface PercentageTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

export interface PercentageModeMeta {
  id: PercentageMode;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  topics: PercentageTopic[];
}

export interface DisplayToken {
  text: string;
  accent?: boolean;
}

export interface PercentageQuestion {
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

export const PERCENTAGE_META: Record<PercentageMode, PercentageModeMeta> = {
  basic: {
    id: 'basic',
    titleVi: 'Tính % Của Một Số',
    titleEn: 'Basic Percentages',
    subtitleVi: 'Mốc chuẩn 10%·25%·50%, kỹ thuật tách % và mẹo đảo ngược x% của y',
    subtitleEn: 'Benchmark 10%·25%·50%, split percentages, and the x% of y flip trick',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Tính % siêu tốc',
        badgeEn: 'General: Fast Percentage Math',
      },
      {
        id: 'benchmarks',
        labelVi: 'Mốc chuẩn',
        labelEn: 'Benchmarks',
        badgeVi: 'Chuyên đề: Mốc 10% · 20% · 25% · 50% · 75%',
        badgeEn: 'Topic: 10% · 20% · 25% · 50% · 75%',
      },
      {
        id: 'split',
        labelVi: 'Tách % lẻ',
        labelEn: 'Split %',
        badgeVi: 'Chuyên đề: Tách 15% · 35% · 12% · 18% · 65%',
        badgeEn: 'Topic: Split 15% · 35% · 12% · 18% · 65%',
      },
      {
        id: 'flip',
        labelVi: 'Đảo x% ↔ y%',
        labelEn: 'Flip x% of y',
        badgeVi: 'Chuyên đề: Đảo x% của y = y% của x',
        badgeEn: 'Topic: Reversible x% of y = y% of x',
      },
    ],
  },
  change: {
    id: 'change',
    titleVi: 'Tăng / Giảm Tỷ Lệ %',
    titleEn: 'Percentage Increase & Decrease',
    subtitleVi: 'Nhẩm nhanh tăng %, giảm % và tính giá sau chiết khấu tức thì',
    subtitleEn: 'Instant mental % increase, % decrease, and real-world discount pricing',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Tăng & Giảm %',
        badgeEn: 'General: % Increase & Decrease',
      },
      {
        id: 'increase',
        labelVi: 'Tăng (+%)',
        labelEn: 'Increase (+%)',
        badgeVi: 'Chuyên đề: Cộng tăng thêm % (+10% đến +50%)',
        badgeEn: 'Topic: Percentage Increase (+10% to +50%)',
      },
      {
        id: 'decrease',
        labelVi: 'Giảm (−%)',
        labelEn: 'Decrease (−%)',
        badgeVi: 'Chuyên đề: Trừ giảm bớt % (−10% đến −50%)',
        badgeEn: 'Topic: Percentage Decrease (−10% to −50%)',
      },
      {
        id: 'discount',
        labelVi: 'Chiết khấu',
        labelEn: 'Discounts',
        badgeVi: 'Chuyên đề: Tính giá sau giảm % qua phần bù',
        badgeEn: 'Topic: Complement Method for Discounts',
      },
    ],
  },
  reverse: {
    id: 'reverse',
    titleVi: 'Tìm Tỷ Lệ & Số Gốc',
    titleEn: 'Ratio & Reverse %',
    subtitleVi: 'Tìm A chiếm bao nhiêu % của B, tìm số gốc 100% và tỷ lệ tăng trưởng',
    subtitleEn: 'Find what % A is of B, recover 100% base value, and compute % growth',
    topics: [
      {
        id: 'general',
        labelVi: 'Tổng quát',
        labelEn: 'General',
        badgeVi: 'Tổng quát: Tỷ lệ & Tìm số gốc',
        badgeEn: 'General: Ratios & Reverse %',
      },
      {
        id: 'findRate',
        labelVi: 'Tìm tỷ lệ ?%',
        labelEn: 'Find ?%',
        badgeVi: 'Chuyên đề: A bằng bao nhiêu % của B',
        badgeEn: 'Topic: A is ?% of B',
      },
      {
        id: 'findWhole',
        labelVi: 'Tìm số gốc',
        labelEn: 'Find Whole',
        badgeVi: 'Chuyên đề: Biết P% của ? ⇒ Tìm 100%',
        badgeEn: 'Topic: Recover 100% from P%',
      },
      {
        id: 'growthRate',
        labelVi: 'Tăng trưởng',
        labelEn: 'Growth %',
        badgeVi: 'Chuyên đề: Tính % tăng từ A lên B',
        badgeEn: 'Topic: Percentage Growth A → B',
      },
    ],
  },
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export type PercentageDifficulty = 'normal' | 'hard';

export function generatePercentageQuestion(
  mode: PercentageMode,
  topicId: string,
  difficulty: PercentageDifficulty = 'normal'
): PercentageQuestion {
  const isHard = difficulty === 'hard';

  if (mode === 'basic') {
    let sub = topicId;
    if (sub === 'general') {
      const pool = isHard ? ['split', 'flip', 'benchmarks'] : ['benchmarks', 'split', 'flip'];
      sub = pool[randInt(0, pool.length - 1)];
    }

    if (sub === 'benchmarks') {
      const choices = isHard ? [25, 75, 20, 50] : [10, 20, 25, 50, 75];
      const pct = choices[randInt(0, choices.length - 1)];
      let base = 100;
      if (pct === 10) base = randInt(12, 98) * 10;
      else if (pct === 20) base = (isHard ? randInt(42, 248) : randInt(8, 95)) * 10;
      else if (pct === 25) base = (isHard ? randInt(45, 245) : randInt(10, 95)) * 4;
      else if (pct === 50) base = (isHard ? randInt(125, 985) : randInt(25, 450)) * 2;
      else base = (isHard ? randInt(32, 185) : randInt(8, 75)) * 4;

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
      const y = anchors[randInt(0, anchors.length - 1)];
      let x = 24;
      if (y === 50) x = randInt(7, 49) * 2;
      else if (y === 25) x = (isHard ? randInt(24, 96) : randInt(6, 36)) * 4;
      else if (y === 20) x = (isHard ? randInt(22, 95) : randInt(5, 39)) * 5;
      else x = (isHard ? randInt(16, 68) : randInt(4, 24)) * 4;

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

    // split (%)
    const splitChoices = isHard ? [35, 45, 65, 85, 12, 18, 24, 36] : [15, 35, 45, 65, 12, 18];
    const pct = splitChoices[randInt(0, splitChoices.length - 1)];
    const isFiveStep = pct % 5 === 0;
    const base = isFiveStep
      ? (isHard ? randInt(16, 78) : randInt(4, 42)) * 20
      : (isHard ? randInt(9, 44) : randInt(3, 24)) * 50;
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
      sub = pool[randInt(0, pool.length - 1)];
    }

    if (sub === 'discount') {
      const prices = isHard
        ? [480, 640, 720, 840, 960, 1200, 1500, 1800, 2400, 3200, 3600, 4800]
        : [200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000];
      const pcts = isHard ? [15, 35, 45, 65] : [15, 20, 25, 30, 40];
      let price = prices[randInt(0, prices.length - 1)];
      const pct = pcts[randInt(0, pcts.length - 1)];
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
    const pct = pctChoices[randInt(0, pctChoices.length - 1)];
    const step = 100 / gcd(pct, 100);
    const base = isHard
      ? step * randInt(16, Math.min(90, Math.floor(2400 / step)))
      : step * randInt(4, Math.min(45, Math.floor(900 / step)));
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

  // reverse mode
  let sub = topicId;
  if (sub === 'general') {
    const pool = ['findRate', 'findWhole', 'growthRate'];
    sub = pool[randInt(0, pool.length - 1)];
  }

  if (sub === 'findRate') {
    const pcts = isHard
      ? [12, 15, 18, 24, 35, 45, 65, 75, 85]
      : [5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80];
    const pct = pcts[randInt(0, pcts.length - 1)];
    const step = 100 / gcd(pct, 100);
    const whole = isHard
      ? step * randInt(6, Math.min(45, Math.floor(2000 / step)))
      : step * randInt(2, Math.min(25, Math.floor(800 / step)));
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
    const pct = pcts[randInt(0, pcts.length - 1)];
    const step = 100 / gcd(pct, 100);
    const base = isHard
      ? step * randInt(8, Math.min(60, Math.floor(1800 / step)))
      : step * randInt(3, Math.min(30, Math.floor(600 / step)));
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

  // findWhole
  const pcts = isHard
    ? [15, 25, 35, 45, 65, 75, 85]
    : [10, 20, 25, 30, 40, 50, 60, 75, 80];
  const pct = pcts[randInt(0, pcts.length - 1)];
  const step = 100 / gcd(pct, 100);
  const whole = isHard
    ? step * randInt(10, Math.min(55, Math.floor(2400 / step)))
    : step * randInt(3, Math.min(28, Math.floor(900 / step)));
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
