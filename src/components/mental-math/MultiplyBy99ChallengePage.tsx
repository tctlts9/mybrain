/**
 * ============================================================================
 * FILE: MultiplyBy99ChallengePage.tsx — TRANG THỬ THÁCH NHÂN VỚI SỐ 99 (10 CÂU TÍNH GIỜ)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình Timer & Modal chỉnh thời gian trả lời từng câu (PHẦN A & B).
 * 2. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN C & D).
 * 3. Quản lý thử thách 10 câu nhân với chuỗi 9 (99, 999, 9999, 99999, 999999) và tính chính xác bằng BigInt.
 * 4. Đếm ngược từng giây, lưu lịch sử 10 câu, chuỗi đúng/sai, đọc đề TTS, bàn phím ảo (18 số) & giọng nói.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Timer,
  Flame,
  Zap,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Play,
  Mic,
  MicOff,
  ArrowRight,
  Clock,
  AlertTriangle,
  Gauge,
  Delete,
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
import { isEditTimerButtonVisible,
  isAutoNextButtonVisible,
  isDifficultLevelChallengeButtonVisible,
} from '../../config/buttonVisibility';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  pronounceQuestionFemaleVoice,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';
import {
  Multiply99Topic,
  Multiply99Multiplier,
  MULTIPLY_99_MULTIPLIERS,
  formatBigIntStr,
  normalizeAnswerInput,
  computeExactProduct,
  getSpelledOutDigits,
  getMaxDigitsForMultiplier,
  getTopicsForMultiplier,
  clampTopicForMultiplier,
  getTopicGridClass,
  resolveDigitCount,
  generateDigitNumber,
  buildMultiply99Question,
} from './MultiplyBy99Page';

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

export interface TopicOption {
  id: Multiply99Topic;
  digits: number;
  labelVi: string;
  labelEn: string;
  fullNameVi: string;
  fullNameEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

export const MULTIPLY_99_TOPICS: TopicOption[] = [
  {
    id: 'general',
    digits: 0,
    labelVi: 'Tổng quát',
    labelEn: 'General',
    fullNameVi: 'Nhân với 99 tổng quát (ngẫu nhiên 1 - 2 chữ số)',
    fullNameEn: 'General Multiply by 99 (1 - 2 Digits)',
    icon: '⚡',
    badgeVi: 'Tổng quát: 1 - 2 chữ số × 99',
    badgeEn: 'General: 1 - 2 Digits × 99',
  },
  {
    id: 'digit1',
    digits: 1,
    labelVi: '1 Chữ số',
    labelEn: '1-Digit',
    fullNameVi: 'Nhân 1 chữ số với 99',
    fullNameEn: 'Multiply 1-Digit by 99',
    icon: '1️⃣',
    badgeVi: '1 chữ số × 99',
    badgeEn: '1-Digit × 99',
  },
  {
    id: 'digit2',
    digits: 2,
    labelVi: '2 Chữ số',
    labelEn: '2-Digit',
    fullNameVi: 'Nhân 2 chữ số với 99',
    fullNameEn: 'Multiply 2-Digit by 99',
    icon: '🔢',
    badgeVi: '2 chữ số × 99',
    badgeEn: '2-Digit × 99',
  },
  {
    id: 'digit3',
    digits: 3,
    labelVi: '3 Chữ số',
    labelEn: '3-Digit',
    fullNameVi: 'Nhân 3 chữ số với 999',
    fullNameEn: 'Multiply 3-Digit by 999',
    icon: '✨',
    badgeVi: '3 chữ số × 999',
    badgeEn: '3-Digit × 999',
  },
  {
    id: 'digit4',
    digits: 4,
    labelVi: '4 Chữ số',
    labelEn: '4-Digit',
    fullNameVi: 'Nhân 4 chữ số với 9999',
    fullNameEn: 'Multiply 4-Digit by 9999',
    icon: '🚀',
    badgeVi: '4 chữ số × 9999',
    badgeEn: '4-Digit × 9999',
  },
  {
    id: 'digit5',
    digits: 5,
    labelVi: '5 Chữ số',
    labelEn: '5-Digit',
    fullNameVi: 'Nhân 5 chữ số với 99999',
    fullNameEn: 'Multiply 5-Digit by 99999',
    icon: '⭐',
    badgeVi: '5 chữ số × 99999',
    badgeEn: '5-Digit × 99999',
  },
  {
    id: 'digit6',
    digits: 6,
    labelVi: '6 Chữ số',
    labelEn: '6-Digit',
    fullNameVi: 'Nhân 6 chữ số với 999999',
    fullNameEn: 'Multiply 6-Digit by 999999',
    icon: '🎯',
    badgeVi: '6 chữ số × 999999',
    badgeEn: '6-Digit × 999999',
  },
];

interface MultiplyBy99ChallengePageProps {
  onBack: () => void;
  initialTopic?: Multiply99Topic;
  initialMultiplier?: Multiply99Multiplier;
  onOpenHardChallenge?: (topic?: Multiply99Topic, multiplier?: Multiply99Multiplier) => void;
  isHard?: boolean;
}

interface Question {
  a: number;
  b: number;
  answer: string;
}

type TimeLimit = number;
type GameStatus = 'idle' | 'running' | 'paused' | 'answered' | 'completed';

const TOTAL_QUESTIONS = 10;

interface RoundHistoryItem {
  qIndex: number;
  a: number;
  b: number;
  userAnswer: string;
  isCorrect: boolean;
}

// ============================================================================
// PHẦN E: COMPONENT CHÍNH TRANG THỬ THÁCH NHÂN VỚI SỐ 99 (MultiplyBy99ChallengePage)
// ============================================================================
export const MultiplyBy99ChallengePage: React.FC<MultiplyBy99ChallengePageProps> = ({
  onBack,
  initialTopic,
  initialMultiplier,
  onOpenHardChallenge,
  isHard = false,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  const hardMode = isHard;
  const timerConfig = useMentalMathTimerConfig('MultiplyBy99ChallengePage');
  const autoNextConfig = useMentalMathAutoNextConfig('MultiplyBy99ChallengePage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('MultiplyBy99ChallengePage');

  // Topic & multiplier selection: Tổng quát (General) hoặc 3 đến 10 chữ số, với 99..999999
  const [selectedTopic, setSelectedTopic] = useState<Multiply99Topic>(initialTopic ?? 'general');
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiply99Multiplier>(
    initialMultiplier ?? 99
  );

  // Config: Limit / Timer
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(timerConfig.defaultLimit);
  const [timeLeft, setTimeLeft] = useState<number>(timerConfig.defaultLimit);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const showEditTimerButton = isEditTimerButtonVisible('MultiplyBy99ChallengePage');

  // 10 Phép nhân trong 1 lượt thử thách
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Math Problem
  const [question, setQuestion] = useState<Question>({ a: 68, b: 99, answer: '6732' });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');

  // Thống kê: Chuỗi đúng, Chuỗi sai, Điểm số
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);

  // Sound & Voice
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  // Tốc độ phát loa câu hỏi (1.25x, 1.5x, 1.75x)
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved) {
        const parsed = parseFloat(saved);
        if ([1.25, 1.5, 1.75].includes(parsed)) return parsed;
      }
    }
    return 1.25;
  });

  const handleSetSpeed = (newSpeed: number) => {
    setQuestionSpeed(newSpeed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mental_math_question_speed', String(newSpeed));
    }
    if (isSpeakingQuestion) {
      pronounceQuestion(newSpeed);
    }
  };

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const questionRef = useRef<Question>(question);
  questionRef.current = question;
  const autoNextTimerRef = useRef<any>(null);
  const gameStatusRef = useRef<GameStatus>(gameStatus);
  gameStatusRef.current = gameStatus;
  const isFirstTimerSyncRef = useRef(true);

  useEffect(() => {
    if (isFirstTimerSyncRef.current) {
      isFirstTimerSyncRef.current = false;
      return;
    }
    setTimeLimit(timerConfig.defaultLimit);
    setTimeLeft(timerConfig.defaultLimit);
  }, [timerConfig.defaultLimit, timerConfig.limitOptions]);

  // Sinh đề toán ngẫu nhiên theo chuyên đề và nhóm số nhân (99..999999), trả về kết quả chính xác dạng chuỗi BigInt
  const generateProblemForTopic = useCallback(
    (
      topicToUse?: Multiply99Topic,
      hardOverride?: boolean,
      multiplierOverride?: Multiply99Multiplier
    ): Question => {
      const active = topicToUse ?? selectedTopic;
      const activeHard = hardOverride ?? hardMode;
      const activeMultiplier = multiplierOverride ?? selectedMultiplier;
      const { digits, isGeneral } = resolveDigitCount(active, activeMultiplier);
      const num = generateDigitNumber(digits, activeHard);

      // Số 99..999999 có thể đứng trước hoặc đứng sau ở Tổng quát
      let a = num;
      let b: number = activeMultiplier;
      if (isGeneral) {
        const isMultiplierFirst = Math.random() < 0.5;
        if (isMultiplierFirst) {
          a = activeMultiplier;
          b = num;
        } else {
          a = num;
          b = activeMultiplier;
        }
      }

      return { a, b, answer: computeExactProduct(a, b) };
    },
    [selectedTopic, selectedMultiplier, hardMode]
  );

  // Dừng bộ đếm ngược giây
  const clearCountdown = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Phát âm thanh thông báo kết quả đúng/sai
  const announceResult = useCallback(
    (isCorrect: boolean, targetAnswer: string | number) => {
      if (!isSpeakerEnabled) return;

      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');

      setTimeout(() => {
        announceResultFemaleVoice(
          isCorrect,
          Number(targetAnswer),
          isVi ? 'vi' : 'en',
          () => setIsSpeaking(false),
          questionSpeed
        );
      }, 200);
    },
    [isSpeakerEnabled, isVi, questionSpeed]
  );

  // Đọc câu hỏi bằng giọng nói TTS với tốc độ đã chọn
  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      setIsSpeakingQuestion(true);
      const speedToUse = overrideSpeed ?? questionSpeed;
      pronounceQuestionFemaleVoice(
        question.a,
        question.b,
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        speedToUse
      );
    },
    [question.a, question.b, isVi, questionSpeed]
  );

  // Chấm đáp án bằng so khớp chuỗi chính xác (BigInt), cập nhật điểm và lịch sử 10 câu
  const submitAnswer = useCallback(
    (rawAns: string | number) => {
      clearCountdown();
      setGameStatus('answered');

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);

      const normalizedInput = normalizeAnswerInput(String(rawAns));
      const isCorrect = normalizedInput !== '' && normalizedInput === questionRef.current.answer;
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          userAnswer: normalizedInput || String(rawAns),
          isCorrect,
        },
      ]);

      if (isCorrect) {
        setFeedback('correct');
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setWrongStreak(0);
        const pointsAwarded = Math.max(10, (14 - timeLimit) * 5);
        setScore((prev) => prev + pointsAwarded);
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        setIncorrectCount((prev) => prev + 1);
        setStreak(0);
        setWrongStreak((prev) => prev + 1);
        announceResult(false, questionRef.current.answer);
      }
    },
    [clearCountdown, timeLimit, announceResult, currentQuestionIndex]
  );

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    clearCountdown();
    setGameStatus('answered');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);

    setTotalAttempts((prev) => prev + 1);
    setIncorrectCount((prev) => prev + 1);
    setFeedback('timeout');
    setStreak(0);
    setWrongStreak((prev) => prev + 1);

    setRoundHistory((prev) => [
      ...prev,
      {
        qIndex: currentQuestionIndex,
        a: questionRef.current.a,
        b: questionRef.current.b,
        userAnswer: tr("Hết giờ"),
        isCorrect: false,
      },
    ]);

    announceResult(false, questionRef.current.answer);
  }, [clearCountdown, announceResult, currentQuestionIndex, isVi]);

  // Start Countdown Timer
  const startCountdown = useCallback(
    (duration: number) => {
      clearCountdown();
      setTimeLeft(duration);

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      timerIntervalRef.current = setInterval(() => {
        const remainingMs = endTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          clearCountdown();
          handleTimeout();
        }
      }, 100);
    },
    [clearCountdown, handleTimeout]
  );

  // Bắt đầu đợt thử thách 10 phép nhân
  const startChallengeSession = useCallback(
    (
      explicitTimeLimit?: TimeLimit,
      explicitTopic?: Multiply99Topic,
      explicitMultiplier?: Multiply99Multiplier
    ) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      stopCurrentSpeech();
      clearCountdown();

      const activeLimit = explicitTimeLimit ?? timeLimit;
      const activeTopic = explicitTopic ?? selectedTopic;
      const activeMultiplier = explicitMultiplier ?? selectedMultiplier;
      const newQ = generateProblemForTopic(activeTopic, undefined, activeMultiplier);

      setCurrentQuestionIndex(1);
      setRoundHistory([]);
      setStreak(0);
      setWrongStreak(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setScore(0);

      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setGameStatus('running');

      startCountdown(activeLimit);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [
      timeLimit,
      selectedTopic,
      selectedMultiplier,
      generateProblemForTopic,
      clearCountdown,
      startCountdown,
    ]
  );

  // Chuyển sang câu tiếp theo trong 10 câu
  const goToNextQuestion = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    clearCountdown();

    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
      setGameStatus('completed');
      return;
    }

    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);

    const newQ = generateProblemForTopic(selectedTopic, undefined, selectedMultiplier);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setGameStatus('running');

    startCountdown(timeLimit);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [
    currentQuestionIndex,
    generateProblemForTopic,
    selectedTopic,
    selectedMultiplier,
    clearCountdown,
    startCountdown,
    timeLimit,
  ]);

  // Tự động chuyển câu hỏi sau số giây tùy chỉnh khi có kết quả
  useEffect(() => {
    if (gameStatus === 'answered') {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      if (autoNextConfig.delaySec > 0) {
        autoNextTimerRef.current = setTimeout(() => {
          goToNextQuestion();
        }, Math.round(autoNextConfig.delaySec * 1000));
      }
    } else {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    }

    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [gameStatus, goToNextQuestion, autoNextConfig.delaySec]);

  // Switch Time Limit
  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setTimeLimit(newLimit);
    setTimeLeft(newLimit);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(newLimit);
    }
  };

  // Switch Topic
  const handleSelectTopic = (newTopic: Multiply99Topic) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setSelectedTopic(newTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(undefined, newTopic, selectedMultiplier);
    } else {
      const newQ = generateProblemForTopic(newTopic, undefined, selectedMultiplier);
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Switch Multiplier (99 | 999 | 9999 | 99999 | 999999)
  const handleSelectMultiplier = (newMultiplier: Multiply99Multiplier) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    const nextTopic = clampTopicForMultiplier(selectedTopic, newMultiplier);
    setSelectedMultiplier(newMultiplier);
    setSelectedTopic(nextTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startChallengeSession(undefined, nextTopic, newMultiplier);
    } else {
      const newQ = generateProblemForTopic(nextTopic, undefined, newMultiplier);
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Reset Session
  const handleReset = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    clearCountdown();
    setGameStatus('idle');
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setUserAnswer('');
    setFeedback('idle');
    setTimeLeft(timeLimit);
    const newQ = generateProblemForTopic(selectedTopic, undefined, selectedMultiplier);
    setQuestion(newQ);
    questionRef.current = newQ;
  };

  // Phím số ảo 0-9 (hỗ trợ tối đa 18 chữ số)
  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (gameStatus !== 'running') return;
      setUserAnswer((prev) => {
        if (prev.length >= 18) return prev;
        return prev + digit;
      });
    },
    [gameStatus]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (gameStatus !== 'running') return;
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  const handleKeypadClear = useCallback(() => {
    if (gameStatus !== 'running') return;
    setUserAnswer('');
    inputRef.current?.focus();
  }, [gameStatus]);

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameStatus !== 'running') return;
    const normalized = normalizeAnswerInput(userAnswer);
    if (!normalized) return;
    submitAnswer(normalized);
  };

  // Voice Recognition Handler
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    setVoiceError('');
    setVoiceTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        tr("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.")
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isVi ? 'vi-VN' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);

        const parsedNumber = parseVoiceNumber(transcript, isVi ? 'vi' : 'en');
        if (parsedNumber !== null && parsedNumber > 0) {
          setUserAnswer(String(parsedNumber));
          submitAnswer(parsedNumber);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      clearCountdown();
      stopCurrentSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [clearCountdown]);

  // Initialize initial question on mount / prop change
  useEffect(() => {
    const resolvedMultiplier = initialMultiplier ?? 99;
    const resolvedTopic = clampTopicForMultiplier(initialTopic ?? 'general', resolvedMultiplier);
    setSelectedTopic(resolvedTopic);
    setSelectedMultiplier(resolvedMultiplier);
    const q = buildMultiply99Question(resolvedTopic, resolvedMultiplier, hardMode);
    setQuestion(q);
    questionRef.current = q;
  }, [initialTopic, initialMultiplier, hardMode]);

  // Timer Progress Calculation
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const isUrgent = timeLeft <= (timeLimit <= 4 ? 1 : timeLimit <= 8 ? 2 : 3);

  const maxAllowedDigits = getMaxDigitsForMultiplier(selectedMultiplier);
  const visibleTopics = getTopicsForMultiplier(selectedMultiplier, MULTIPLY_99_TOPICS);

  const currentTopicMeta =
    visibleTopics.find((t) => t.id === selectedTopic) ||
    visibleTopics.find(
      (t) =>
        (t.id === 'general' && (selectedTopic === 'general99' || selectedTopic === 'mixed99')) ||
        (t.id === 'digit2' && selectedTopic === 'twoDigit99') ||
        (t.id === 'digit3' && selectedTopic === 'threeDigit99')
    ) ||
    visibleTopics[0];

  const dynamicBadge = isVi
    ? currentTopicMeta.digits > 0
      ? `${currentTopicMeta.digits} chữ số × ${selectedMultiplier}`
      : `Tổng quát: 1 - ${maxAllowedDigits} chữ số × ${selectedMultiplier}`
    : currentTopicMeta.digits > 0
    ? `${currentTopicMeta.digits}-Digit × ${selectedMultiplier}`
    : `General: 1 - ${maxAllowedDigits} Digits × ${selectedMultiplier}`;

  const totalFormulaDigits = String(question.a).length + String(question.b).length;
  const maxDigits = Math.max(String(question.a).length, String(question.b).length);
  const formulaFontSize =
    totalFormulaDigits >= 13 || maxDigits >= 9
      ? 'text-lg sm:text-xl md:text-2xl'
      : totalFormulaDigits >= 10 || maxDigits >= 6
      ? 'text-xl sm:text-2xl md:text-3xl'
      : maxDigits >= 4
      ? 'text-2xl sm:text-4xl md:text-5xl'
      : 'text-3xl sm:text-5xl md:text-6xl';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: Nút quay lại Luyện tập & breadcrumb tiêu đề */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
        <button
          onClick={() => {
            stopCurrentSpeech();
            clearCountdown();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title={tr("Quay về trang Luyện tập Nhân với 99")}
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại")}</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isDifficultLevelChallengeButtonVisible('MultiplyBy99ChallengePage') && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                clearCountdown();
                onOpenHardChallenge(selectedTopic, selectedMultiplier);
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
                stopCurrentSpeech();
                clearCountdown();
                onBack();
              }}
              className="hover:text-yellow-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
              title={tr("Về trang Luyện tập Nhân với 99")}
            >
              {tr("Nhân với số 99")}
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{tr("Thử Thách Nhân 99 [Ngắn]")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Khung thử thách chính: chọn thời gian, chọn chuyên đề & nhóm thừa số 99..999999 */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode ? 'border-rose-500/45 to-rose-950/35' : 'border-yellow-500/35 to-yellow-950/30'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-yellow-500/10'
          }`}
        />

        {/* Top Header Row: Title, Mode Toggles & Sound */}
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
                <span>{tr("Thử Thách Nhân Với Số 99")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {dynamicBadge}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {hardMode
                  ? tr("Cấp độ khó: nhiều chữ số hơn, nhớ liên tục, phản xạ tốc độ cao")
                  : isVi
                  ? `Thử thách phản xạ tính nhẩm siêu tốc nhân với ${selectedMultiplier} từ 2s đến 12s`
                  : `Speed mental calculation challenge multiplying by ${selectedMultiplier} within 2s to 12s`}
              </p>
            </div>
          </div>

          {/* Right Controls: 2s-12s selector & Speaker Toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Mode Selector (2s - 12s) */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="hidden sm:inline">{tr("Thời gian:")}</span>
              </span>
              {timerConfig.limitOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTimeLimit(t)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    timeLimit === t
                      ? 'bg-yellow-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isVi ? `Thử thách ${t} giây` : `${t}-second mode`}
                >
                  {t}s
                </button>
              ))}
              {showEditTimerButton && (
                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(true)}
                  title={tr("Chỉnh sửa Timer (Trang này / Toàn Tab)")}
                  aria-label={tr("Chỉnh sửa Timer")}
                  className="ml-0.5 p-1.5 rounded-lg text-slate-400 hover:text-yellow-300 hover:bg-slate-800/90 border border-transparent hover:border-yellow-500/30 transition-all cursor-pointer active:scale-95"
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
                  initialPageKey={"MultiplyBy99ChallengePage"}
                />
              </>
            )}

            {/* Sound Toggle */}
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
                  ? tr("Âm thanh & Giọng đọc: BẬT")
                  : tr("Âm thanh & Giọng đọc: TẮT")
              }
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-4 h-4 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Nhóm nút chọn chuyên đề (theo số chữ số) & nhóm số nhân (99..999999) */}
        <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className={`grid ${getTopicGridClass(visibleTopics.length)} gap-1.5`}>
            {visibleTopics.map((topic) => {
              const isSelected =
                selectedTopic === topic.id ||
                (topic.id === 'general' &&
                  (selectedTopic === 'general99' || selectedTopic === 'mixed99')) ||
                (topic.id === 'digit2' && selectedTopic === 'twoDigit99') ||
                (topic.id === 'digit3' && selectedTopic === 'threeDigit99');
              const topicTitle = isVi
                ? topic.digits > 0
                  ? `Nhân ${topic.digits} chữ số với ${selectedMultiplier}`
                  : `Nhân với ${selectedMultiplier} tổng quát (ngẫu nhiên 1 - ${maxAllowedDigits} chữ số)`
                : topic.digits > 0
                ? `Multiply ${topic.digits}-Digit by ${selectedMultiplier}`
                : `General Multiply by ${selectedMultiplier} (1 - ${maxAllowedDigits} Digits)`;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopic(topic.id)}
                  title={topicTitle}
                  className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                      : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                  }`}
                >
                  <span className="text-sm shrink-0">{topic.icon}</span>
                  <span className="truncate whitespace-nowrap">{isVi ? topic.labelVi : topic.labelEn}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1.5 border-t border-slate-800/70">
            {MULTIPLY_99_MULTIPLIERS.map((m) => {
              const isSelected = selectedMultiplier === m;
              const mMax = getMaxDigitsForMultiplier(m);
              const multiplierTitle = isVi
                ? `Chọn × ${m} (hiển thị 1 - ${mMax} Chữ số)`
                : `Select × ${m} (shows 1-Digit to ${mMax}-Digit)`;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMultiplier(m)}
                  title={multiplierTitle}
                  className={`py-1.5 px-2 sm:py-2 sm:px-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                      : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                  }`}
                >
                  <span className="truncate whitespace-nowrap">× {m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hàng thống kê trực tiếp: Chuỗi đúng & Chuỗi sai */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* 1. Chuỗi đúng */}
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
                ({isVi ? `Đúng: ${correctCount}` : `Correct: ${correctCount}`})
              </span>
            </div>
          </div>

          {/* 2. Chuỗi sai */}
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

        {/* Khu vực hiển thị tổng kết 10 câu (khi completed) hoặc thẻ đề toán + đồng hồ đếm ngược */}
        <div className="w-full space-y-3">
          {gameStatus === 'completed' ? (
            <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-9 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 text-yellow-400 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>
                  {isVi
                    ? `Hoàn thành thử thách 10 phép nhân với ${selectedMultiplier}!`
                    : `10-Problem Multiply by ${selectedMultiplier} Challenge Completed!`}
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
                  ? `Chuyên đề: ${dynamicBadge}${hardMode ? ' (Cấp độ Khó)' : ''} • Thời gian: ${timeLimit}s / phép tính`
                  : `Topic: ${dynamicBadge}${hardMode ? ' (Hard Level)' : ''} • Time limit: ${timeLimit}s / problem`}
              </p>

              {/* Thống kê 3 chỉ số Đúng, Sai, % Độ chính xác */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {tr("Đúng")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    {correctCount}
                  </span>
                  <span className="text-[11px] text-emerald-500/80 block mt-0.5">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    {tr("Sai")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
                    {incorrectCount}
                  </span>
                  <span className="text-[11px] text-rose-500/80 block mt-0.5">
                    / {TOTAL_QUESTIONS}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    {tr("% Độ chính xác")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">
                    {Math.round((correctCount / TOTAL_QUESTIONS) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-500/80 block mt-0.5">
                    {correctCount >= 8 ? (tr("Xuất sắc! 🌟")) : (tr("Cần luyện thêm"))}
                  </span>
                </div>
              </div>

              {/* Chi tiết từng câu trong 10 câu */}
              {roundHistory.length > 0 && (
                <div className="max-w-lg mx-auto mb-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>{tr("Chi tiết 10 phép nhân")}</span>
                    <span>{tr("Kết quả")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {roundHistory.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          item.isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <span className="font-mono font-medium truncate">
                          #{item.qIndex}: {item.a.toLocaleString()} × {item.b.toLocaleString()}
                        </span>
                        <span className="font-bold font-mono shrink-0 ml-1">
                          {item.isCorrect ? '✓' : `✗ (${formatBigIntStr(computeExactProduct(item.a, item.b))})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => startChallengeSession()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{tr("Bắt đầu thử thách mới (10 câu)")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCurrentSpeech();
                    clearCountdown();
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
              <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
                {/* Top Timer Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-200 ease-linear ${
                      isUrgent
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : timeLimit <= 4
                        ? 'bg-purple-400'
                        : timeLimit <= 8
                        ? 'bg-yellow-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${gameStatus === 'idle' ? 100 : timerPercentage}%` }}
                  />
                </div>

                {/* Badges: Topic, Question Progress 10/10, and Countdown */}
                <div className="flex items-center justify-center gap-2 flex-wrap mb-2 mt-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    {dynamicBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25">
                    <span>{isVi ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS}` : `Problem ${currentQuestionIndex}/${TOTAL_QUESTIONS}`}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                      isUrgent && gameStatus === 'running'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Timer className={`w-3 h-3 ${isUrgent && gameStatus === 'running' ? 'text-rose-400' : 'text-yellow-400'}`} />
                    <span className="font-mono">
                      {gameStatus === 'idle' ? `${timeLimit}s` : `${timeLeft}s`}
                    </span>
                  </span>
                </div>

                {/* 10 Phép nhân mini-tracker dots */}
                <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-xs mx-auto mb-3 px-2">
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                    const qNum = idx + 1;
                    const record = roundHistory[idx];
                    let bg = 'bg-slate-800 border-slate-700/60';
                    if (record) {
                      bg = record.isCorrect
                        ? 'bg-emerald-500 border-emerald-400 shadow-xs shadow-emerald-500/40'
                        : 'bg-rose-500 border-rose-400 shadow-xs shadow-rose-500/40';
                    } else if (qNum === currentQuestionIndex && (gameStatus === 'running' || gameStatus === 'answered')) {
                      bg = 'bg-yellow-400 border-amber-300 animate-pulse';
                    }
                    return (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full border transition-all duration-300 ${bg}`}
                        title={isVi ? `Câu ${qNum}` : `Problem ${qNum}`}
                      />
                    );
                  })}
                </div>

                {/* Math Formula Display (Nhân với 99) with Speaker Button & Speed Selector */}
                <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-3 w-full">
                  {gameStatus === 'idle' ? (
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
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full py-1 px-1">
                        <div className={`font-black text-white font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 tracking-tight select-none leading-tight ${formulaFontSize}`}>
                          <span className="whitespace-nowrap">{question.a.toLocaleString()}</span>
                          <span className="text-yellow-400 font-sans">×</span>
                          <span className="whitespace-nowrap">{question.b.toLocaleString()}</span>
                        </div>

                        {/* Button Loa để phát thông tin câu hỏi */}
                        <button
                          type="button"
                          onClick={() => pronounceQuestion()}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                            isSpeakingQuestion
                              ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-yellow-500/30 animate-pulse'
                              : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/10'
                          }`}
                          title={
                            isVi
                              ? `Phát âm câu hỏi (${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}) - Tốc độ ${questionSpeed}x`
                              : `Pronounce question (${question.a} times ${question.b}) - Speed ${questionSpeed}x`
                          }
                          aria-label="Phát âm câu hỏi"
                        >
                          <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                        </button>
                      </div>

                      {/* Tùy chỉnh tốc độ loa phát câu hỏi (1.25x, 1.5x, 1.75x) */}
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
                                  ? 'bg-yellow-400 text-slate-950 shadow-xs ring-1 ring-yellow-400 font-extrabold'
                                  : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
                              }`}
                              title={isVi ? `Chỉnh tốc độ đọc ${s}x` : `Playback speed ${s}x`}
                            >
                              {`${s}x`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Immediate Result Feedback Badge */}
                {feedback === 'correct' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {isVi
                        ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Correct: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}

                {feedback === 'incorrect' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isVi
                        ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}

                {feedback === 'timeout' && (
                  <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-in zoom-in-95 duration-150 shadow-md">
                    <Timer className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      {isVi
                        ? `Hết giờ!: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                        : `Time's up!: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Form nhập đáp án, bàn phím số ảo, nhận diện giọng nói & các nút điều khiển */}
              <form onSubmit={handleSubmit} className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={
                      gameStatus === 'idle'
                        ? tr("Bấm \"Bắt đầu thử thách\" để đếm ngược...")
                        : isListening
                        ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn")
                        : tr("Nhập kết quả hoặc bấm phím số...")
                    }
                    disabled={gameStatus !== 'running'}
                    className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                      gameStatus === 'running'
                        ? isListening
                          ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                          : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                        : 'border-slate-850 opacity-60 cursor-not-allowed'
                    }`}
                  />
                  {userAnswer && gameStatus === 'running' && (
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors"
                      title={tr("Xóa ô nhập")}
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Bàn phím số từ 0 đến 9: 2 hàng 6 cột nhỏ gọn */}
                <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
                  <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                    {/* Hàng 1: 1, 2, 3, 4, 5, 6 */}
                    {[1, 2, 3, 4, 5, 6].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadDigit(String(digit))}
                        disabled={gameStatus !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                        aria-label={`Digit ${digit}`}
                      >
                        {digit}
                      </button>
                    ))}

                    {/* Hàng 2: 7, 8, 9, 0, Xóa, Backspace */}
                    {[7, 8, 9, 0].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadDigit(String(digit))}
                        disabled={gameStatus !== 'running'}
                        className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                        aria-label={`Digit ${digit}`}
                      >
                        {digit}
                      </button>
                    ))}

                    {/* Xóa toàn bộ */}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      disabled={gameStatus !== 'running' || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      title={tr("Xóa toàn bộ")}
                    >
                      {tr("Xóa")}
                    </button>

                    {/* Xóa 1 số lùi */}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      disabled={gameStatus !== 'running' || !userAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      title={tr("Xóa 1 số")}
                      aria-label="Backspace"
                    >
                      <Delete className="w-4 h-4 text-slate-400 hover:text-yellow-300" />
                    </button>
                  </div>
                </div>

                {/* Hiển thị nội dung giọng nói đang nhận diện theo thời gian thực */}
                {isListening && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="truncate">
                      {voiceTranscript
                        ? `${tr("Đang nhận diện:")} "${voiceTranscript}"`
                        : tr("🎙️ Hãy đọc to đáp án (VD: \"sáu bảy ba hai\", \"6732\",...)")}
                    </span>
                  </div>
                )}

                {/* Thông báo lỗi nếu trình duyệt chưa cấp quyền micro */}
                {voiceError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="flex-1 font-semibold">{voiceError}</p>
                  </div>
                )}

                {/* Nhóm nút hành động: Bắt đầu / Gửi / Câu tiếp theo / Giọng nói / Đặt lại */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {gameStatus === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => startChallengeSession()}
                      className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{isVi ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} phép nhân)` : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}</span>
                    </button>
                  ) : gameStatus === 'answered' ? (
                    currentQuestionIndex < TOTAL_QUESTIONS ? (
                      <button
                        type="button"
                        onClick={goToNextQuestion}
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                      >
                        <span>
                          {autoNextConfig.delaySec > 0
                            ? isVi
                              ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                              : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}) - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                            : isVi
                            ? `Câu tiếp theo (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`
                            : `Next Problem (${currentQuestionIndex + 1}/${TOTAL_QUESTIONS})`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (autoNextTimerRef.current) {
                            clearTimeout(autoNextTimerRef.current);
                            autoNextTimerRef.current = null;
                          }
                          setGameStatus('completed');
                        }}
                        className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-emerald-500 hover:from-yellow-300 hover:to-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
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

                  {/* Nút bật/tắt trả lời bằng giọng nói */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={gameStatus !== 'running'}
                    title={tr("Trả lời bằng giọng nói")}
                    className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border border-slate-700 hover:border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
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

                  {/* Nút bắt đầu lượt thử thách mới */}
                  <button
                    type="button"
                    onClick={() => startChallengeSession()}
                    title={tr("Bắt đầu câu hỏi thử thách")}
                    className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{tr("Bắt đầu")}</span>
                  </button>

                  {/* Nút đặt lại phiên thử thách */}
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

      {/* Modal tùy chỉnh thời gian trả lời từng câu (Timer) */}
      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="page"
          initialPageKey="MultiplyBy99ChallengePage"
        />
      )}
    </div>
  );
};
