import { useState, useEffect, useCallback } from 'react';
import { PercentageMode } from '../utils/percentageOperations';

export type MentalMathAutoNextGroup = 'practice' | 'challenge' | 'difficulty';

export interface MentalMathAutoNextPageMeta {
  key: MentalMathAutoNextPageKey;
  group: MentalMathAutoNextGroup;
  defaultDelaySec: number;
  labelVi: string;
  labelEn: string;
}

export const MENTAL_MATH_AUTO_NEXT_PAGE_META = [
  // --- Challenge pages (12) ---
  {
    key: 'TwoDigitMentalMathChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    labelVi: 'Nhân 2 chữ số — Thử thách',
    labelEn: '2-Digit Multiplication — Challenge',
  },
  {
    key: 'MultiplyBy11ChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 11 — Thử thách',
    labelEn: 'Multiply by 11 — Challenge',
  },
  {
    key: 'MultiplyBy99ChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 99 — Thử thách',
    labelEn: 'Multiply by 99 — Challenge',
  },
  {
    key: 'MultiplyWith1DigitChallengePage',
    group: 'challenge',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 1 chữ số — Thử thách',
    labelEn: 'Multiply 1-Digit — Challenge',
  },
  {
    key: 'DivisionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Phép chia — Thử thách',
    labelEn: 'Division — Challenge',
  },
  {
    key: 'AdditionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Phép cộng — Thử thách',
    labelEn: 'Addition — Challenge',
  },
  {
    key: 'SubtractionChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Phép trừ — Thử thách',
    labelEn: 'Subtraction — Challenge',
  },
  {
    key: 'ExponentChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Lũy thừa — Thử thách',
    labelEn: 'Exponents — Challenge',
  },
  {
    key: 'SquareRootChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Căn bậc 2 — Thử thách',
    labelEn: 'Square Root — Challenge',
  },
  {
    key: 'PercentageChallengePage_basic',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tính % của số) — Thử thách',
    labelEn: 'Percentage (% of a Number) — Challenge',
  },
  {
    key: 'PercentageChallengePage_change',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tăng / Giảm %) — Thử thách',
    labelEn: 'Percentage (% Increase & Decrease) — Challenge',
  },
  {
    key: 'PercentageChallengePage_reverse',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách',
    labelEn: 'Percentage (Find Rate & Whole) — Challenge',
  },
  {
    key: 'DailyReflexChallengePage',
    group: 'challenge',
    defaultDelaySec: 2,
    labelVi: 'Phản xạ hàng ngày — Thử thách',
    labelEn: 'Daily Mental Math Reflex — Challenge',
  },

  // --- Difficult Level Challenge pages (12) ---
  {
    key: 'TwoDigitMentalMathDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    labelVi: 'Nhân 2 chữ số — Thử thách khó',
    labelEn: '2-Digit Multiplication — Difficult Challenge',
  },
  {
    key: 'MultiplyBy11DifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 11 — Thử thách khó',
    labelEn: 'Multiply by 11 — Difficult Challenge',
  },
  {
    key: 'MultiplyBy99DifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 99 — Thử thách khó',
    labelEn: 'Multiply by 99 — Difficult Challenge',
  },
  {
    key: 'MultiplyWith1DigitDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 3,
    labelVi: 'Nhân với 1 chữ số — Thử thách khó',
    labelEn: 'Multiply 1-Digit — Difficult Challenge',
  },
  {
    key: 'DivisionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Phép chia — Thử thách khó',
    labelEn: 'Division — Difficult Challenge',
  },
  {
    key: 'AdditionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Phép cộng — Thử thách khó',
    labelEn: 'Addition — Difficult Challenge',
  },
  {
    key: 'SubtractionDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Phép trừ — Thử thách khó',
    labelEn: 'Subtraction — Difficult Challenge',
  },
  {
    key: 'ExponentDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Lũy thừa — Thử thách khó',
    labelEn: 'Exponents — Difficult Challenge',
  },
  {
    key: 'SquareRootDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Căn bậc 2 — Thử thách khó',
    labelEn: 'Square Root — Difficult Challenge',
  },
  {
    key: 'PercentageDifficultyChallengePage_basic',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tính % của số) — Thử thách khó',
    labelEn: 'Percentage (% of a Number) — Difficult Challenge',
  },
  {
    key: 'PercentageDifficultyChallengePage_change',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tăng / Giảm %) — Thử thách khó',
    labelEn: 'Percentage (% Increase & Decrease) — Difficult Challenge',
  },
  {
    key: 'PercentageDifficultyChallengePage_reverse',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách khó',
    labelEn: 'Percentage (Find Rate & Whole) — Difficult Challenge',
  },
  {
    key: 'DailyReflexDifficultyChallengePage',
    group: 'difficulty',
    defaultDelaySec: 2,
    labelVi: 'Phản xạ hàng ngày — Thử thách khó',
    labelEn: 'Daily Mental Math Reflex — Difficult Challenge',
  },

  // --- Practice pages (12) ---
  {
    key: 'TwoDigitMultiplicationPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Nhân 2 chữ số — Luyện tập',
    labelEn: '2-Digit Multiplication — Practice',
  },
  {
    key: 'MultiplyBy11Page',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Nhân với 11 — Luyện tập',
    labelEn: 'Multiply by 11 — Practice',
  },
  {
    key: 'MultiplyBy99Page',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Nhân với 99 — Luyện tập',
    labelEn: 'Multiply by 99 — Practice',
  },
  {
    key: 'MultiplyWith1DigitPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Nhân với 1 chữ số — Luyện tập',
    labelEn: 'Multiply 1-Digit — Practice',
  },
  {
    key: 'DivisionPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Phép chia — Luyện tập',
    labelEn: 'Division — Practice',
  },
  {
    key: 'AdditionPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Phép cộng — Luyện tập',
    labelEn: 'Addition — Practice',
  },
  {
    key: 'SubtractionPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Phép trừ — Luyện tập',
    labelEn: 'Subtraction — Practice',
  },
  {
    key: 'ExponentPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Lũy thừa — Luyện tập',
    labelEn: 'Exponents — Practice',
  },
  {
    key: 'SquareRootPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Căn bậc 2 — Luyện tập',
    labelEn: 'Square Root — Practice',
  },
  {
    key: 'PercentagePage_basic',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Tỷ lệ % (Tính % của số) — Luyện tập',
    labelEn: 'Percentage (% of a Number) — Practice',
  },
  {
    key: 'PercentagePage_change',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Tỷ lệ % (Tăng / Giảm %) — Luyện tập',
    labelEn: 'Percentage (% Increase & Decrease) — Practice',
  },
  {
    key: 'PercentagePage_reverse',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Luyện tập',
    labelEn: 'Percentage (Find Rate & Whole) — Practice',
  },
  {
    key: 'DailyReflexPage',
    group: 'practice',
    defaultDelaySec: 0,
    labelVi: 'Phản xạ hàng ngày — Luyện tập',
    labelEn: 'Daily Mental Math Reflex — Practice',
  },
] as const;

export type MentalMathAutoNextPageKey =
  (typeof MENTAL_MATH_AUTO_NEXT_PAGE_META)[number]['key'];

export const getPercentagePracticeAutoNextPageKey = (
  mode: PercentageMode
): MentalMathAutoNextPageKey =>
  mode === 'basic'
    ? 'PercentagePage_basic'
    : mode === 'change'
    ? 'PercentagePage_change'
    : 'PercentagePage_reverse';

export const getPercentageChallengeAutoNextPageKey = (
  mode: PercentageMode
): MentalMathAutoNextPageKey =>
  mode === 'basic'
    ? 'PercentageChallengePage_basic'
    : mode === 'change'
    ? 'PercentageChallengePage_change'
    : 'PercentageChallengePage_reverse';

export const getPercentageDifficultyChallengeAutoNextPageKey = (
  mode: PercentageMode
): MentalMathAutoNextPageKey =>
  mode === 'basic'
    ? 'PercentageDifficultyChallengePage_basic'
    : mode === 'change'
    ? 'PercentageDifficultyChallengePage_change'
    : 'PercentageDifficultyChallengePage_reverse';

const STORAGE_KEY = 'mental_math_auto_next_v1';
const UPDATE_EVENT = 'mental-math-auto-next-updated';

export type AutoNextGlobalTarget = 'all' | 'challenges' | 'practice';

export interface StoredMentalMathAutoNext {
  globalChallenge?: number;
  globalPractice?: number;
  pages: Partial<Record<MentalMathAutoNextPageKey, number>>;
}

export interface EffectiveAutoNextConfig {
  delaySec: number;
  defaultDelaySec: number;
  source: 'page' | 'global' | 'default';
  group: MentalMathAutoNextGroup;
}

export const sanitizeAutoNextDelay = (val: unknown, fallback = 3): number => {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  if (num <= 0) return 0;
  const clamped = Math.min(60, Math.max(0.5, num));
  return Math.round(clamped * 10) / 10;
};

export const formatAutoNextDelay = (delaySec: number, isVi: boolean): string => {
  if (delaySec <= 0) {
    return isVi ? 'Thủ công' : 'Manual';
  }
  const clean = Number.isInteger(delaySec) ? String(delaySec) : String(Math.round(delaySec * 10) / 10);
  return `${clean}s`;
};

export const getAutoNextPageMeta = (pageKey: MentalMathAutoNextPageKey) => {
  return (
    MENTAL_MATH_AUTO_NEXT_PAGE_META.find((m) => m.key === pageKey) ||
    MENTAL_MATH_AUTO_NEXT_PAGE_META[0]
  );
};

export const getStoredAutoNextOverrides = (): StoredMentalMathAutoNext => {
  if (typeof window === 'undefined') {
    return { pages: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // Ignore storage errors
  }
};

export const getEffectiveAutoNextConfig = (
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

export const savePageAutoNextOverride = (
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

export const saveGlobalAutoNextOverride = (
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

export const resetPageAutoNextOverride = (pageKey: MentalMathAutoNextPageKey): void => {
  const current = getStoredAutoNextOverrides();
  const nextPages = { ...current.pages };
  delete nextPages[pageKey];
  writeStoredAutoNextOverrides({
    ...current,
    pages: nextPages,
  });
};

export const resetGlobalAutoNextOverride = (
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

export const useMentalMathAutoNextConfig = (
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
    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refresh]);

  return config;
};
