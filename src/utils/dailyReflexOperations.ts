import {
  generateOperationQuestion,
  getOperationSpokenText,
} from './arithmeticOperations';
import {
  DisplayToken,
  PercentageMode,
  generatePercentageQuestion,
} from './percentageOperations';

export type ReflexOperation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'square-root'
  | 'exponent'
  | 'percentage';

export type DailyReflexMode = 'dailyMix' | 'fastFour' | 'advanced' | 'custom';
export type DailyReflexDifficulty = 'normal' | 'hard';

export interface DailyReflexQuestion {
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

export interface ReflexOperationMeta {
  id: ReflexOperation;
  symbol: string;
  labelVi: string;
  labelEn: string;
}

export const REFLEX_OPERATIONS: ReflexOperationMeta[] = [
  { id: 'addition', symbol: '+', labelVi: 'Phép cộng', labelEn: 'Addition' },
  { id: 'subtraction', symbol: '−', labelVi: 'Phép trừ', labelEn: 'Subtraction' },
  { id: 'multiplication', symbol: '×', labelVi: 'Phép nhân', labelEn: 'Multiplication' },
  { id: 'division', symbol: '÷', labelVi: 'Phép chia', labelEn: 'Division' },
  { id: 'square-root', symbol: '√', labelVi: 'Căn bậc 2', labelEn: 'Square Root' },
  { id: 'exponent', symbol: 'xⁿ', labelVi: 'Lũy thừa', labelEn: 'Exponents' },
  { id: 'percentage', symbol: '%', labelVi: 'Tỷ lệ %', labelEn: 'Percentage' },
];

export interface DailyReflexModeMeta {
  id: DailyReflexMode;
  icon: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

export const DAILY_REFLEX_MODES: DailyReflexModeMeta[] = [
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

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function generateMultiplicationReflexQuestion(
  difficulty: DailyReflexDifficulty
): DailyReflexQuestion {
  const isHard = difficulty === 'hard';
  const variant = isHard ? randInt(0, 4) : randInt(0, 4);

  let a = 12;
  let b = 11;
  let hintVi = '';
  let hintEn = '';

  if (variant === 0) {
    // Multiply by 11
    a = isHard ? randInt(125, 985) : randInt(14, 98);
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
    // Multiply by 99
    a = isHard ? randInt(25, 199) : randInt(12, 95);
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
    // Same tens, units sum to 10
    const t = isHard ? randInt(4, 9) : randInt(2, 8);
    const u1 = randInt(1, 9);
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
    // 2-3 digit × 1-digit
    a = isHard ? randInt(125, 989) : randInt(24, 198);
    b = isHard ? randInt(4, 9) : randInt(3, 9);
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

  // General 2-digit × 2-digit
  a = isHard ? randInt(32, 96) : randInt(14, 58);
  b = isHard ? randInt(24, 89) : randInt(12, 46);
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

export function generateDailyReflexQuestion(
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

  const chosen = pool[randInt(0, pool.length - 1)];

  if (chosen === 'multiplication') {
    return generateMultiplicationReflexQuestion(difficulty);
  }

  if (chosen === 'percentage') {
    const pctModes: PercentageMode[] = ['basic', 'change', 'reverse'];
    const pctMode = pctModes[randInt(0, pctModes.length - 1)];
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

// ============================================================================
// DAILY STREAK & GOAL STORAGE
// ============================================================================

const STATS_STORAGE_KEY = 'daily_mental_math_reflex_stats_v1';
const STATS_UPDATE_EVENT = 'daily-reflex-stats-updated';

export interface DailyReflexStats {
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

export const getLocalDateKey = (date: Date = new Date()): string => {
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

export const getDailyReflexStats = (): DailyReflexStats => {
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

export const recordDailyReflexAttempt = (
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

export const updateDailyReflexGoal = (goal: number): DailyReflexStats => {
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

export const subscribeDailyReflexStats = (cb: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STATS_UPDATE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(STATS_UPDATE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};
