/**
 * ============================================================================
 * FILE: MultiplyWith1DigitChallengePage.tsx — TRANG THỬ THÁCH NHÂN VỚI 1 CHỮ SỐ (10 CÂU TÍNH GIỜ)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình Timer & Modal chỉnh thời gian trả lời từng câu (PHẦN A & B).
 * 2. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN C & D).
 * 3. Quản lý thử thách 10 câu nhân số 2–10 chữ số với 1 chữ số (×2..×9, hỗ trợ Cấp độ Khó).
 * 4. Đếm ngược từng giây, lưu lịch sử 10 câu, chuỗi đúng/sai, đọc đề TTS, bàn phím ảo & giọng nói.
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

export type Multiply1DigitTopic =
  | 'general'
  | 'digit2'
  | 'digit3'
  | 'digit4'
  | 'digit5'
  | 'digit6'
  | 'digit7'
  | 'digit8'
  | 'digit9'
  | 'digit10'
  | 'mul2'
  | 'mul3'
  | 'mul4'
  | 'mul5'
  | 'mul6'
  | 'mul7'
  | 'mul8'
  | 'mul9';

export interface TopicOption {
  id: Multiply1DigitTopic;
  digits: number;
  multiplier?: number;
  labelVi: string;
  labelEn: string;
  fullNameVi: string;
  fullNameEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

export const MULTIPLY_1_DIGIT_TOPICS: TopicOption[] = [
  {
    id: 'general',
    digits: 0,
    labelVi: 'Tổng quát',
    labelEn: 'General',
    fullNameVi: 'Nhân 1 chữ số tổng quát (ngẫu nhiên 2 - 10 chữ số × [2..9])',
    fullNameEn: 'General: 2 - 10 Digits × 1-Digit',
    icon: '⚡',
    badgeVi: 'Tổng quát: 2 - 10 chữ số × [2..9]',
    badgeEn: 'General: 2 - 10 Digits × [2..9]',
  },
  {
    id: 'digit2',
    digits: 2,
    labelVi: '2 Chữ số',
    labelEn: '2-Digit',
    fullNameVi: 'Nhân 2 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 2-Digit by 1-Digit',
    icon: '🔢',
    badgeVi: '2 chữ số × [2..9]',
    badgeEn: '2-Digit × [2..9]',
  },
  {
    id: 'digit3',
    digits: 3,
    labelVi: '3 Chữ số',
    labelEn: '3-Digit',
    fullNameVi: 'Nhân 3 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 3-Digit by 1-Digit',
    icon: '✨',
    badgeVi: '3 chữ số × [2..9]',
    badgeEn: '3-Digit × [2..9]',
  },
  {
    id: 'digit4',
    digits: 4,
    labelVi: '4 Chữ số',
    labelEn: '4-Digit',
    fullNameVi: 'Nhân 4 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 4-Digit by 1-Digit',
    icon: '🚀',
    badgeVi: '4 chữ số × [2..9]',
    badgeEn: '4-Digit × [2..9]',
  },
  {
    id: 'digit5',
    digits: 5,
    labelVi: '5 Chữ số',
    labelEn: '5-Digit',
    fullNameVi: 'Nhân 5 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 5-Digit by 1-Digit',
    icon: '⭐',
    badgeVi: '5 chữ số × [2..9]',
    badgeEn: '5-Digit × [2..9]',
  },
  {
    id: 'digit6',
    digits: 6,
    labelVi: '6 Chữ số',
    labelEn: '6-Digit',
    fullNameVi: 'Nhân 6 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 6-Digit by 1-Digit',
    icon: '🎯',
    badgeVi: '6 chữ số × [2..9]',
    badgeEn: '6-Digit × [2..9]',
  },
  {
    id: 'digit7',
    digits: 7,
    labelVi: '7 Chữ số',
    labelEn: '7-Digit',
    fullNameVi: 'Nhân 7 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 7-Digit by 1-Digit',
    icon: '🔥',
    badgeVi: '7 chữ số × [2..9]',
    badgeEn: '7-Digit × [2..9]',
  },
  {
    id: 'digit8',
    digits: 8,
    labelVi: '8 Chữ số',
    labelEn: '8-Digit',
    fullNameVi: 'Nhân 8 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 8-Digit by 1-Digit',
    icon: '💎',
    badgeVi: '8 chữ số × [2..9]',
    badgeEn: '8-Digit × [2..9]',
  },
  {
    id: 'digit9',
    digits: 9,
    labelVi: '9 Chữ số',
    labelEn: '9-Digit',
    fullNameVi: 'Nhân 9 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 9-Digit by 1-Digit',
    icon: '🏆',
    badgeVi: '9 chữ số × [2..9]',
    badgeEn: '9-Digit × [2..9]',
  },
  {
    id: 'digit10',
    digits: 10,
    labelVi: '10 Chữ số',
    labelEn: '10-Digit',
    fullNameVi: 'Nhân 10 chữ số với 1 chữ số',
    fullNameEn: 'Multiply 10-Digit by 1-Digit',
    icon: '👑',
    badgeVi: '10 chữ số × [2..9]',
    badgeEn: '10-Digit × [2..9]',
  },
  ...([2, 3, 4, 5, 6, 7, 8, 9] as const).map((m) => ({
    id: `mul${m}` as Multiply1DigitTopic,
    digits: 0,
    multiplier: m,
    labelVi: `Nhân với ${m}`,
    labelEn: `Multiply by ${m}`,
    fullNameVi: `Nhân với ${m} (2 - 10 chữ số × ${m})`,
    fullNameEn: `Multiply 2 - 10 Digits by ${m}`,
    icon: '✖️',
    badgeVi: `Nhân với ${m}`,
    badgeEn: `Multiply by ${m}`,
  })),
];

interface MultiplyWith1DigitChallengePageProps {
  onBack: () => void;
  initialTopic?: Multiply1DigitTopic;
  onOpenHardChallenge?: (topic?: Multiply1DigitTopic) => void;
  isHard?: boolean;
}

interface Question {
  a: number;
  b: number;
  answer: number;
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

const getSpelledOutDigits = (num: number, isVietnamese: boolean): string => {
  const digits = String(num).split('');
  const enWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };
  const viWords: Record<string, string> = {
    '0': 'Không',
    '1': 'Một',
    '2': 'Hai',
    '3': 'Ba',
    '4': 'Bốn',
    '5': 'Năm',
    '6': 'Sáu',
    '7': 'Bảy',
    '8': 'Tám',
    '9': 'Chín',
  };
  const words = isVietnamese ? viWords : enWords;
  return digits.map((d) => words[d] || d).join(' ');
};

// ============================================================================
// PHẦN E: COMPONENT CHÍNH TRANG THỬ THÁCH NHÂN VỚI 1 CHỮ SỐ (MultiplyWith1DigitChallengePage)
// ============================================================================
export const MultiplyWith1DigitChallengePage: React.FC<MultiplyWith1DigitChallengePageProps> = ({
  onBack,
  initialTopic,
  onOpenHardChallenge,
  isHard = false,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  const hardMode = isHard;
  const timerConfig = useMentalMathTimerConfig('MultiplyWith1DigitChallengePage');
  const autoNextConfig = useMentalMathAutoNextConfig('MultiplyWith1DigitChallengePage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('MultiplyWith1DigitChallengePage');

  // Topic selection: Tổng quát (General) hoặc 3 đến 10 chữ số
  const [selectedTopic, setSelectedTopic] = useState<Multiply1DigitTopic>(initialTopic ?? 'general');

  // Config: Limit / Timer
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(timerConfig.defaultLimit);
  const [timeLeft, setTimeLeft] = useState<number>(timerConfig.defaultLimit);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const showEditTimerButton = isEditTimerButtonVisible('MultiplyWith1DigitChallengePage');

  // 10 Phép nhân trong 1 lượt thử thách
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Math Problem
  const [question, setQuestion] = useState<Question>({ a: 74, b: 6, answer: 444 });
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

  // Generate random problem based on Selected Topic for Multiply by 1-Digit
  const generateProblemForTopic = useCallback(
    (topicToUse?: Multiply1DigitTopic, hardOverride?: boolean): Question => {
      const active = topicToUse ?? selectedTopic;
      const activeHard = hardOverride ?? hardMode;
      const isGeneral = active === 'general';
      const multiplierMatch = active.match(/^mul([2-9])$/);
      const fixedMultiplier = multiplierMatch ? Number(multiplierMatch[1]) : null;

      let digits = 2;
      if (isGeneral || fixedMultiplier !== null) {
        // Hard: 6-10 digits; Normal: 2-10 digits
        digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;
      } else if (active === 'digit2') digits = 2;
      else if (active === 'digit3') digits = 3;
      else if (active === 'digit4') digits = 4;
      else if (active === 'digit5') digits = 5;
      else if (active === 'digit6') digits = 6;
      else if (active === 'digit7') digits = 7;
      else if (active === 'digit8') digits = 8;
      else if (active === 'digit9') digits = 9;
      else if (active === 'digit10') digits = 10;
      else digits = activeHard ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 9) + 2;

      let multiDigitNum: number;
      if (activeHard) {
        let s = String(Math.floor(Math.random() * 7) + 3); // 3..9
        for (let i = 1; i < digits; i++) {
          s += String(Math.floor(Math.random() * 8) + 2); // 2..9 (avoid trivial 0/1)
        }
        multiDigitNum = Number(s);
      } else if (digits === 2) {
        multiDigitNum = Math.floor(Math.random() * 88) + 12;
      } else {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        multiDigitNum = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      // Fixed multiplier if mul2..mul9 selected, else Hard: 6..9 / Normal: 2..9
      const singleDigit =
        fixedMultiplier ??
        (activeHard ? Math.floor(Math.random() * 4) + 6 : Math.floor(Math.random() * 8) + 2);

      let a = multiDigitNum;
      let b = singleDigit;
      if (isGeneral || Math.random() < 0.35) {
        const isSingleDigitFirst = Math.random() < 0.5;
        if (isSingleDigitFirst) {
          a = singleDigit;
          b = multiDigitNum;
        } else {
          a = multiDigitNum;
          b = singleDigit;
        }
      }

      return {
        a,
        b,
        answer: a * b,
      };
    },
    [selectedTopic, hardMode]
  );

  // Announce result
  const announceResult = useCallback(
    (isCorrect: boolean, targetAnswer: number) => {
      if (!isSpeakerEnabled) return;
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');

      setTimeout(() => {
        announceResultFemaleVoice(
          isCorrect,
          targetAnswer,
          isVi ? 'vi' : 'en',
          () => setIsSpeaking(false),
          questionSpeed
        );
      }, 200);
    },
    [isSpeakerEnabled, isVi, questionSpeed]
  );

  // Pronounce Question
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

  // Replay announcement
  const replayAnnouncement = useCallback(() => {
    if (feedback === 'correct') {
      announceResult(true, question.answer);
    } else if (feedback === 'incorrect' || feedback === 'timeout') {
      announceResult(false, question.answer);
    }
  }, [feedback, question.answer, announceResult]);

  // Voice Recognition Control
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const handleTimeout = useCallback(() => {
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setFeedback('timeout');
    setGameStatus('answered');
    setIncorrectCount((prev) => prev + 1);
    setWrongStreak((prev) => prev + 1);
    setStreak(0);
    setTotalAttempts((prev) => prev + 1);

    setRoundHistory((prev) => [
      ...prev,
      {
        qIndex: currentQuestionIndex,
        a: questionRef.current.a,
        b: questionRef.current.b,
        userAnswer: tr("Hết giờ [2 từ]"),
        isCorrect: false,
      },
    ]);

    announceResult(false, questionRef.current.answer);
  }, [announceResult, currentQuestionIndex, isVi, stopListening]);

  // Chấm đáp án người dùng nhập/nói, cập nhật điểm, chuỗi đúng/sai và lưu vào lịch sử 10 câu
  const verifyAnswer = useCallback(
    (inputNum: number) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopListening();

      const isCorrect = inputNum === questionRef.current.answer;
      setGameStatus('answered');
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          userAnswer: String(inputNum),
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
        const earnedPoints = (7 - timeLimit) * 10;
        setScore((prev) => prev + earnedPoints);
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        setIncorrectCount((prev) => prev + 1);
        setWrongStreak((prev) => prev + 1);
        setStreak(0);
        announceResult(false, questionRef.current.answer);
      }
    },
    [announceResult, currentQuestionIndex, stopListening, timeLimit]
  );

  // Start voice recognition
  const startListening = useCallback(async () => {
    setVoiceError('');
    setVoiceTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        tr("Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge.")
      );
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setVoiceError(
        tr("Chưa cấp quyền Micro. Vui lòng click icon ổ khóa trên thanh địa chỉ để Cho phép Micro.")
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setVoiceTranscript(finalTranscript);

      const parsedNum = parseVoiceNumber(finalTranscript, isVi ? 'vi' : 'en');
      if (parsedNum !== null && parsedNum > 0) {
        setUserAnswer(String(parsedNum));
        verifyAnswer(parsedNum);
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
    setIsListening(true);
  }, [isVi, verifyAnswer]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Start Countdown Timer for problem
  const startTimer = useCallback(
    (limitOverride?: TimeLimit) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const activeLimit = limitOverride ?? timeLimit;
      setTimeLeft(activeLimit);

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [handleTimeout, timeLimit]
  );

  // Load next question or finish round
  const goToNextQuestion = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();

    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
      setGameStatus('completed');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setGameStatus('running');
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [
    currentQuestionIndex,
    generateProblemForTopic,
    selectedTopic,
    startTimer,
    stopListening,
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

  // Start a new Challenge Round (10 Questions)
  const startNewChallenge = useCallback(
    (topicOverride?: Multiply1DigitTopic, hardOverride?: boolean, limitOverride?: TimeLimit) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      stopCurrentSpeech();
      stopListening();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const topicToUse = topicOverride ?? selectedTopic;
      setSelectedTopic(topicToUse);
      setCurrentQuestionIndex(1);
      setRoundHistory([]);
      setScore(0);
      setStreak(0);
      setWrongStreak(0);
      setBestStreak(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setIncorrectCount(0);

      const newQ = generateProblemForTopic(topicToUse, hardOverride);
      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setGameStatus('running');
      startTimer(limitOverride);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [generateProblemForTopic, selectedTopic, startTimer, stopListening]
  );

  // Reset Challenge back to idle state (hide question until Start is clicked)
  const handleReset = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setTimeLeft(timeLimit);
    setGameStatus('idle');
  }, [generateProblemForTopic, selectedTopic, stopListening, timeLimit]);

  // Switch topic
  const handleSelectTopic = (newTopic: Multiply1DigitTopic) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setSelectedTopic(newTopic);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNewChallenge(newTopic);
    }
  };

  // Switch Time Limit (2s - 12s)
  const handleSelectTimeLimit = (limit: TimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setTimeLimit(limit);
    if (gameStatus === 'running') {
      setTimeLeft(limit);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameStatus === 'idle') {
      setTimeLeft(limit);
    }
  };

  const isFirstTimerSyncRef = useRef(true);
  useEffect(() => {
    if (isFirstTimerSyncRef.current) {
      isFirstTimerSyncRef.current = false;
      return;
    }
    setTimeLimit(timerConfig.defaultLimit);
    setTimeLeft(timerConfig.defaultLimit);
    if (gameStatus === 'running') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerConfig.defaultLimit, timerConfig.limitOptions]);

  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    stopCurrentSpeech();
    stopListening();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const topicToUse = initialTopic ?? 'general';
    setSelectedTopic(topicToUse);
    setCurrentQuestionIndex(1);
    setRoundHistory([]);
    setScore(0);
    setStreak(0);
    setWrongStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    const newQ = generateProblemForTopic(topicToUse);
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setTimeLeft(timeLimit);
    setGameStatus('idle');
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      stopCurrentSpeech();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  // Virtual Keypad handlers (up to 14 digits)
  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (gameStatus !== 'running') return;
      if (feedback === 'incorrect') {
        setFeedback('idle');
      }
      setUserAnswer((prev) => {
        if (prev.length >= 14) return prev;
        return prev + digit;
      });
    },
    [feedback, gameStatus]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameStatus !== 'running') return;
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;
    verifyAnswer(parsed);
  };

  const currentTopicMeta =
    MULTIPLY_1_DIGIT_TOPICS.find((m) => m.id === selectedTopic) || MULTIPLY_1_DIGIT_TOPICS[0];

  const maxDigits = Math.max(String(question.a).length, String(question.b).length);
  const formulaFontSize =
    maxDigits >= 9
      ? 'text-lg sm:text-2xl md:text-3xl'
      : maxDigits >= 6
      ? 'text-xl sm:text-3xl md:text-4xl'
      : maxDigits >= 4
      ? 'text-2xl sm:text-4xl md:text-5xl'
      : 'text-3xl sm:text-5xl md:text-6xl';

  const timerColor =
    timeLeft <= (timeLimit <= 4 ? 1 : timeLimit <= 8 ? 2 : 3)
      ? 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : timeLeft <= (timeLimit <= 4 ? 2 : timeLimit <= 8 ? 4 : 5)
      ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: Quay lại Luyện tập, cấu hình Auto-Next & nút Loa */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại Luyện tập")}</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isDifficultLevelChallengeButtonVisible('MultiplyWith1DigitChallengePage') && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
                initialPageKey={"MultiplyWith1DigitChallengePage"}
              />
            </>
          )}
          {/* Audio Speaker toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isSpeakerEnabled;
              setIsSpeakerEnabled(next);
              if (next) playSpeakerChime('correct');
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${
              isSpeakerEnabled
                ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-xs ring-1 ring-yellow-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
            title={
              isSpeakerEnabled
                ? tr("Đang bật loa đọc đáp án")
                : tr("Đang tắt loa")
            }
          >
            {isSpeakerEnabled ? (
              <Volume2
                className={`w-3.5 h-3.5 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`}
              />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold">
              {isSpeakerEnabled ? (tr("Loa: Bật")) : tr("Loa: Tắt")}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{tr("Nhân với 1 chữ số")}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{tr("Thử Thách Siêu Tốc")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Challenge Container */}
      <div
        className={`rounded-3xl border bg-gradient-to-br from-slate-900/95 via-slate-900/80 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 ${
          hardMode ? 'border-rose-500/45 to-rose-950/35' : 'border-yellow-500/30 to-yellow-950/30'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            hardMode ? 'bg-rose-500/15' : 'bg-yellow-500/10'
          }`}
        />

        {/* Header: Title + Mode Settings (2s - 12s) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                hardMode ? 'bg-rose-500/20 border-rose-500/40' : 'bg-yellow-500/20 border-yellow-500/30'
              }`}
            >
              {hardMode ? (
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
              ) : (
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                <span>{tr("Thử Thách Nhân Với 1 Chữ Số")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {hardMode
                  ? isVi
                    ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Cấp độ khó (×6 đến ×9, số lớn)`
                    : `Question ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Hard mode (×6 to ×9, larger numbers)`
                  : isVi
                  ? `Câu ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Thử thách tính nhanh`
                  : `Question ${currentQuestionIndex}/${TOTAL_QUESTIONS} • Blitz math trial`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Time Selector: 2s - 12s */}
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
          </div>
        </div>

        {/* Nhóm nút chọn chuyên đề thử thách: theo số chữ số (2–10) hoặc cố định thừa số (×2..×9) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>{tr("Chọn chuyên đề thử thách:")}</span>
            <span className="text-yellow-400/90 text-[11px]">
              {isVi ? currentTopicMeta.fullNameVi : currentTopicMeta.fullNameEn}
            </span>
          </div>

          <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
              {MULTIPLY_1_DIGIT_TOPICS.filter((m) => !m.multiplier).map((mode) => {
                const isSelected = selectedTopic === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleSelectTopic(mode.id)}
                    title={isVi ? mode.fullNameVi : mode.fullNameEn}
                    className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                    }`}
                  >
                    <span className="text-sm shrink-0">{mode.icon}</span>
                    <span className="truncate whitespace-nowrap">{isVi ? mode.labelVi : mode.labelEn}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 pt-1.5 border-t border-slate-800/70">
              {MULTIPLY_1_DIGIT_TOPICS.filter((m) => Boolean(m.multiplier)).map((mode) => {
                const isSelected = selectedTopic === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleSelectTopic(mode.id)}
                    title={isVi ? mode.fullNameVi : mode.fullNameEn}
                    className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                    }`}
                  >
                    <span className="text-xs shrink-0">{mode.icon}</span>
                    <span className="truncate whitespace-nowrap">{isVi ? mode.labelVi : mode.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Thanh thống kê trực tiếp: Điểm, Chuỗi đúng, Kỷ lục & Tỉ lệ đúng */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {tr("Điểm số")}
            </span>
            <span className="text-base sm:text-xl font-black text-yellow-400 font-mono">
              {score}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{tr("Chuỗi đúng")}</span>
            </span>
            <span className="text-base sm:text-xl font-black text-orange-400 font-mono">
              {streak}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span>{tr("Kỷ lục chuỗi")}</span>
            </span>
            <span className="text-base sm:text-xl font-black text-yellow-400 font-mono">
              {bestStreak}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block">
              {tr("Đúng / Tổng")}
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">
              {correctCount}/{totalAttempts}
            </span>
          </div>
        </div>

        {/* Màn hình tổng kết 10 câu khi hoàn thành thử thách */}
        {gameStatus === 'completed' ? (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950/90 border border-yellow-500/40 p-6 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 rounded-3xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2 flex-wrap">
                <span>{tr("Hoàn Thành Lượt Thử Thách!")}</span>
                {hardMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{tr("Cấp độ Khó")}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {isVi
                  ? `Bạn đã hoàn thành 10 câu${hardMode ? ' (Cấp độ Khó)' : ''} với số điểm ${score} • Chuỗi đúng cao nhất: ${bestStreak}`
                  : `You finished 10 questions${hardMode ? ' (Hard Level)' : ''} with ${score} pts • Best streak: ${bestStreak}`}
              </p>
            </div>

            {/* History Table */}
            <div className="max-w-md mx-auto max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              {roundHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60"
                >
                  <span className="font-mono text-slate-400">#{h.qIndex}</span>
                  <span className="font-mono font-bold text-white">
                    {h.a.toLocaleString()} × {h.b.toLocaleString()} = {(h.a * h.b).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-300">{h.userAnswer}</span>
                    {h.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startNewChallenge()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr("Thử Thách Lại")}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>{tr("Về Luyện Tập")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Math Problem Arena — Side-by-Side on Desktop */
          <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
            <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center">
              {/* Header: Progress & Timer Countdown */}
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
                </span>

                {/* Countdown Timer Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs sm:text-sm font-black font-mono transition-all ${timerColor}`}
                >
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Large Mathematical Problem Display */}
              <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-2 w-full">
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
                      <div
                        className={`font-black text-white font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 tracking-tight select-none leading-tight ${formulaFontSize}`}
                      >
                        <span className="whitespace-nowrap">{question.a.toLocaleString()}</span>
                        <span className="text-yellow-400 font-sans">×</span>
                        <span className="whitespace-nowrap">{question.b.toLocaleString()}</span>
                      </div>

                      {/* Button Loa để phát thông tin câu hỏi */}
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
                            ? `Phát âm câu hỏi (${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}) - Tốc độ: ${questionSpeed}x`
                            : `Pronounce question (${question.a} times ${question.b}) - Speed: ${questionSpeed}x`
                        }
                      >
                        <Volume2
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`}
                        />
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

              {/* Feedback messages */}
              {feedback === 'correct' && (
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isVi
                      ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer.toLocaleString()})`
                      : `Correct: ${getSpelledOutDigits(question.answer, false)} (${question.answer.toLocaleString()})`}
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
                      ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer.toLocaleString()})`
                      : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${question.answer.toLocaleString()})`}
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

              {feedback === 'timeout' && (
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {isVi
                      ? `Hết giờ! Đáp án: ${getSpelledOutDigits(question.answer, true)} (${question.answer.toLocaleString()})`
                      : `Time's up! Answer: ${getSpelledOutDigits(question.answer, false)} (${question.answer.toLocaleString()})`}
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
                      ? tr("Bấm \"Bắt đầu\" để bắt đầu thử thách...")
                      : isListening
                      ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn [Đọc to]")
                      : tr("Nhập kết quả hoặc bấm phím số bên dưới...")
                  }
                  disabled={gameStatus !== 'running'}
                  className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                    isListening
                      ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                      : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
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

              {/* Bàn phím số ảo từ 0 đến 9 */}
              <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
                <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadDigit(String(digit))}
                      disabled={gameStatus !== 'running'}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                      disabled={gameStatus !== 'running'}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label={`Digit ${digit}`}
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    disabled={gameStatus !== 'running' || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa toàn bộ")}
                  >
                    {tr("Xóa")}
                  </button>

                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    disabled={gameStatus !== 'running' || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa 1 số")}
                    aria-label="Backspace"
                  >
                    <Delete className="w-4 h-4 text-slate-400 hover:text-yellow-300" />
                  </button>
                </div>
              </div>

              {/* Chỉ báo trạng thái đang nghe giọng nói */}
              {isListening && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="truncate">
                    {voiceTranscript
                      ? `${tr("Đang nhận diện:")} "${voiceTranscript}" ➔ ${tr("Tự nộp bài...")}`
                      : tr("🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"bốn bốn bốn\", \"444\",...)")}
                  </span>
                </div>
              )}

              {/* Thông báo lỗi nếu micro bị chặn */}
              {voiceError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold leading-relaxed">{voiceError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={startListening}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold shrink-0 transition-colors"
                  >
                    {tr("Thử lại")}
                  </button>
                </div>
              )}

              {/* Nhóm nút hành động: Bắt đầu / Câu tiếp theo / Nộp bài / Giọng nói / Làm mới */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {gameStatus === 'idle' ? (
                  <button
                    type="button"
                    onClick={() => startNewChallenge()}
                    className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 active:scale-95 text-xs sm:text-sm"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>
                      {isVi
                        ? `Bắt đầu thử thách (${TOTAL_QUESTIONS} câu)`
                        : `Start Challenge (${TOTAL_QUESTIONS} Problems)`}
                    </span>
                  </button>
                ) : gameStatus === 'answered' ? (
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                  >
                    <span>
                      {currentQuestionIndex >= TOTAL_QUESTIONS
                        ? autoNextConfig.delaySec > 0
                          ? isVi
                            ? `Xem Tổng Kết (tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)})`
                            : `View Results (auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)})`
                          : tr("Xem Tổng Kết")
                        : autoNextConfig.delaySec > 0
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
                    type="submit"
                    className="flex-1 min-w-[130px] h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>{tr("Kết quả [Đáp án]")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Nút bật/tắt trả lời bằng giọng nói */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={gameStatus !== 'running'}
                  title={
                    isListening
                      ? tr("Đang nghe... Bấm để dừng")
                      : tr("Trả lời bằng giọng nói")
                  }
                  className={`h-12 px-3.5 sm:px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
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
                  onClick={() => startNewChallenge()}
                  title={tr("Bắt đầu câu hỏi thử thách")}
                  className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{tr("Bắt đầu")}</span>
                </button>

                {/* Nút đặt lại thử thách */}
                <button
                  type="button"
                  onClick={handleReset}
                  title={tr("Thiết lập lại thử thách")}
                  className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal tùy chỉnh thời gian trả lời từng câu (Timer) */}
      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="page"
          initialPageKey="MultiplyWith1DigitChallengePage"
        />
      )}
    </div>
  );
};
