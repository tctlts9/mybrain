/**
 * ============================================================================
 * FILE: MentalMathTab.tsx — TRANG CHỦ & BỘ ĐIỀU PHỐI TAB TÍNH NHẨM (MENTAL MATH)
 * ============================================================================
 * Công việc của file:
 * 1. Cấu hình & quản lý Timer (mốc giây) cho toàn bộ 26 trang Challenge/Difficulty Challenge.
 * 2. Hiển thị Modal chỉnh sửa Timer toàn Tab hoặc từng trang (MentalMathChallengeTimerModal).
 * 3. Cấu hình & quản lý thời gian tự động chuyển câu (Auto-Next) cho toàn bộ 39 trang Mental Math.
 * 4. Hiển thị Modal tùy chỉnh Auto-Next (MentalMathAutoNextModal).
 * 5. Định tuyến (Routing) 10 nhánh phép tính (Practice, Challenge, Difficulty Challenge, Visual Guide)
 *    kèm kiểm tra quyền hiển thị trang (pageVisibility.ts) và Ẩn/Hiện card (cardVisibility.ts).
 * 6. Hiển thị 2 trang Hub con ("Phép nhân" gồm 4 card con, "Tỷ lệ %" gồm 3 card con) và lưới Card chính.
 * ============================================================================
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  SlidersHorizontal,
  Clock,
  TimerReset,
  Eye,
  EyeOff,
  Globe,
  X,
  RotateCcw,
  Check,
  Hand,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useLanguage, biLabel, translateText } from '../../context/Translations';
import { isEditTimerButtonVisible, isAutoNextButtonVisible } from '../../config/buttonVisibility';
import { isPageVisible, PageVisibilityKey } from '../../config/pageVisibility';
import {
  CardVisibilityId,
  ENABLE_BROWSER_CARD_OVERRIDES,
  isTabMasterCardVisible,
  setChildCardsVisibility,
  setTabCardsVisibility,
  useCardVisibility,
} from '../../config/cardVisibility';
import { TwoDigitMultiplicationPage, TrainingTopic } from './TwoDigitMultiplicationPage';
import { TwoDigitMentalMathChallengePage } from './TwoDigitMentalMathChallengePage';
import { TwoDigitMentalMathDifficultyChallengePage } from './TwoDigitMentalMathDifficultyChallengePage';
import { TwoDigitMentalMathVisualGuidePage } from './TwoDigitMentalMathVisualGuidePage';
import { MultiplyBy11Page, Multiply11Topic } from './MultiplyBy11Page';
import { MultiplyBy11ChallengePage } from './MultiplyBy11ChallengePage';
import { MultiplyBy11DifficultyChallengePage } from './MultiplyBy11DifficultyChallengePage';
import { MultiplyBy11VisualGuidePage } from './MultiplyBy11VisualGuidePage';
import { MultiplyBy99Page, Multiply99Topic, Multiply99Multiplier } from './MultiplyBy99Page';
import { MultiplyBy99ChallengePage } from './MultiplyBy99ChallengePage';
import { MultiplyBy99DifficultyChallengePage } from './MultiplyBy99DifficultyChallengePage';
import { MultiplyBy99VisualGuidePage } from './MultiplyBy99VisualGuidePage';
import { MultiplyWith1DigitPage, Multiply1DigitTopic } from './MultiplyWith1DigitPage';
import { MultiplyWith1DigitChallengePage } from './MultiplyWith1DigitChallengePage';
import { MultiplyWith1DigitDifficultyChallengePage } from './MultiplyWith1DigitDifficultyChallengePage';
import { MultiplyWith1DigitVisualGuidePage } from './MultiplyWith1DigitVisualGuidePage';
import { DivisionPage, DivisionTopic } from './DivisionPage';
import { DivisionChallengePage } from './DivisionChallengePage';
import { DivisionDifficultyChallengePage } from './DivisionDifficultyChallengePage';
import { DivisionVisualGuidePage } from './DivisionVisualGuidePage';
import { AdditionPage, AdditionTopic } from './AdditionPage';
import { AdditionChallengePage } from './AdditionChallengePage';
import { AdditionDifficultyChallengePage } from './AdditionDifficultyChallengePage';
import { AdditionVisualGuidePage } from './AdditionVisualGuidePage';
import { SubtractionPage, SubtractionTopic } from './SubtractionPage';
import { SubtractionChallengePage } from './SubtractionChallengePage';
import { SubtractionDifficultyChallengePage } from './SubtractionDifficultyChallengePage';
import { SubtractionVisualGuidePage } from './SubtractionVisualGuidePage';
import { ExponentPage, ExponentTopic } from './ExponentPage';
import { ExponentChallengePage } from './ExponentChallengePage';
import { ExponentDifficultyChallengePage } from './ExponentDifficultyChallengePage';
import { ExponentVisualGuidePage } from './ExponentVisualGuidePage';
import { SquareRootPage, SquareRootTopic } from './SquareRootPage';
import { SquareRootChallengePage } from './SquareRootChallengePage';
import { SquareRootDifficultyChallengePage } from './SquareRootDifficultyChallengePage';
import { SquareRootVisualGuidePage } from './SquareRootVisualGuidePage';
import { PercentagePage } from './PercentagePage';
import { PercentageChallengePage } from './PercentageChallengePage';
import { PercentageDifficultyChallengePage } from './PercentageDifficultyChallengePage';
import { PercentageVisualGuidePage } from './PercentageVisualGuidePage';
import { DailyReflexPage } from './DailyReflexPage';
import { DailyReflexChallengePage } from './DailyReflexChallengePage';
import { DailyReflexDifficultyChallengePage } from './DailyReflexDifficultyChallengePage';
import { DailyReflexVisualGuidePage } from './DailyReflexVisualGuidePage';

// Kiểu chế độ Tỷ lệ % và Phản xạ hàng ngày (code trực tiếp trong Tab)
type PercentageMode = 'basic' | 'change' | 'reverse';
type ReflexOperation =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'square-root'
  | 'exponent'
  | 'percentage';
type DailyReflexMode = 'dailyMix' | 'fastFour' | 'advanced' | 'custom';

import cardBg from '../../assets/images/TwoDigitBg.jpg';
import card11Bg from '../../assets/images/MultiplyBy11Bg.jpg';
import card1DigitBg from '../../assets/images/MultiplyWith1DigitBg.jpg';
//import cardMultiplyBg from '../../assets/images/mental_math_multiplication.jpg';
import cardMultiplyBg from '../../assets/images/Mental Math/Bg1_Multiplication.jpg';
//import cardDivideBg from '../../assets/images/mental_math_division.jpg';
import cardDivideBg from '../../assets/images/Mental Math/Bg1_Division.jpg';
//import cardAddBg from '../../assets/images/mental_math_addition.jpg';
import cardAddBg from '../../assets/images/Mental Math/Bg1_Addition.jpg';
import cardSubtractBg from '../../assets/images/Mental Math/Bg1_Subtraction.jpg';
import cardSqrtBg from '../../assets/images/Mental Math/Bg1_SquareRoot.jpg';
import cardPowerBg from '../../assets/images/Mental Math/Bg1_Exponentiation.jpg';
import cardPercentBg from '../../assets/images/Mental Math/Bg1_Percentage.jpg';
import cardPercentBasicBg from '../../assets/images/percentage_basic.jpg';
import cardPercentChangeBg from '../../assets/images/percentage_change.jpg';
import cardPercentReverseBg from '../../assets/images/percentage_reverse.jpg';

// ============================================================================
// PHẦN A: CẤU HÌNH TIMER (MỐC GIÂY) CHO CÁC TRANG THỬ THÁCH TRONG TAB MENTAL MATH
// Lưu trong localStorage 'mental_math_timer_overrides_v1', hỗ trợ chỉnh theo từng trang hoặc toàn Tab
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
// PHẦN B: MODAL CHỈNH SỬA TIMER (TOÀN TAB HOẶC TỪNG TRANG CHALLENGE)
// Cho phép chọn Preset, thêm/xóa mốc giây và chọn mốc mặc định
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
// PHẦN C: CẤU HÌNH TỰ ĐỘNG ĐỔI CÂU HỎI (AUTO-NEXT DELAY)
// Lưu trong localStorage 'mental_math_auto_next_v1', kiểm soát sau bao nhiêu giây sẽ sang câu mới
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
// PHẦN D: MODAL TÙY CHỈNH THỜI GIAN ĐỔI CÂU HỎI (CHẾ ĐỘ THỦ CÔNG / 0.5s - 60s)
// Cho phép áp dụng toàn bộ Mental Math, theo nhóm hoặc theo từng Page riêng lẻ
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

// Danh sách tất cả mã trang (route key) được điều phối bên trong Tab Mental Math
type MentalMathPage =
  | 'card'
  | 'multiply-hub'
  | 'two-digit-page'
  | 'challenge-page'
  | 'two-digit-difficulty-challenge'
  | 'visual-guide-page'
  | 'multiply-11-page'
  | 'multiply-11-challenge'
  | 'multiply-11-difficulty-challenge'
  | 'multiply-11-visual-guide'
  | 'multiply-99-page'
  | 'multiply-99-challenge'
  | 'multiply-99-difficulty-challenge'
  | 'multiply-99-visual-guide'
  | 'multiply-1-digit-page'
  | 'multiply-1-digit-challenge'
  | 'multiply-1-digit-difficulty-challenge'
  | 'multiply-1-digit-visual-guide'
  | 'division-page'
  | 'division-challenge'
  | 'division-difficulty-challenge'
  | 'division-visual-guide'
  | 'addition-page'
  | 'addition-challenge'
  | 'addition-difficulty-challenge'
  | 'addition-visual-guide'
  | 'subtraction-page'
  | 'subtraction-challenge'
  | 'subtraction-difficulty-challenge'
  | 'subtraction-visual-guide'
  | 'exponent-page'
  | 'exponent-challenge'
  | 'exponent-difficulty-challenge'
  | 'exponent-visual-guide'
  | 'square-root-page'
  | 'square-root-challenge'
  | 'square-root-difficulty-challenge'
  | 'square-root-visual-guide'
  | 'percentage-hub'
  | 'percentage-page'
  | 'percentage-challenge'
  | 'percentage-difficulty-challenge'
  | 'percentage-visual-guide'
  | 'daily-reflex-page'
  | 'daily-reflex-challenge'
  | 'daily-reflex-difficulty-challenge'
  | 'daily-reflex-visual-guide';

interface MentalMathTabProps {
  onOpenCardVisibility?: () => void;
}

export const MentalMathTab: React.FC<MentalMathTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { language, t, tr } = useLanguage();
  const isVi = language === 'vi';
  const { isCardVisible } = useCardVisibility();

  // State trang hiện tại + topic/mode đang chọn để truyền xuống các trang Challenge/Practice
  const [currentPage, setCurrentPage] = useState<MentalMathPage>('card');
  const [trainingTopic, setTrainingTopic] = useState<TrainingTopic>('twoDigit');
  const [challengeTopic, setChallengeTopic] = useState<TrainingTopic>('twoDigit');
  const [multiply11ChallengeTopic, setMultiply11ChallengeTopic] = useState<Multiply11Topic>('general');
  const [multiply99ChallengeTopic, setMultiply99ChallengeTopic] = useState<Multiply99Topic>('general');
  const [multiply99ChallengeMultiplier, setMultiply99ChallengeMultiplier] = useState<Multiply99Multiplier>(99);
  const [multiply1DigitChallengeTopic, setMultiply1DigitChallengeTopic] = useState<Multiply1DigitTopic>('general');
  const [divisionChallengeTopic, setDivisionChallengeTopic] = useState<DivisionTopic>('general');
  const [additionChallengeTopic, setAdditionChallengeTopic] = useState<AdditionTopic>('general');
  const [subtractionChallengeTopic, setSubtractionChallengeTopic] = useState<SubtractionTopic>('general');
  const [exponentChallengeTopic, setExponentChallengeTopic] = useState<ExponentTopic>('general');
  const [squareRootChallengeTopic, setSquareRootChallengeTopic] = useState<SquareRootTopic>('general');
  const [percentageMode, setPercentageMode] = useState<PercentageMode>('basic');
  const [percentageChallengeTopic, setPercentageChallengeTopic] = useState<string>('general');
  const [dailyReflexMode, setDailyReflexMode] = useState<DailyReflexMode>('dailyMix');
  const [dailyReflexCustomOps, setDailyReflexCustomOps] = useState<ReflexOperation[]>([
    'addition',
    'subtraction',
    'multiplication',
    'division',
  ]);

  // State đóng/mở Modal Timer & Auto-Next + kiểm tra quyền hiển thị nút cấu hình từ buttonVisibility.ts
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState<boolean>(false);
  const showEditTimerButton = isEditTimerButtonVisible('MentalMathTab');
  const showAutoNextButton = isAutoNextButtonVisible('MentalMathTab');
  const canRestoreInUi =
    ENABLE_BROWSER_CARD_OVERRIDES && isTabMasterCardVisible('mental-math');

  // ==================== FLOW 1: PHÉP NHÂN 2 CHỮ SỐ ====================
  if (
    currentPage === 'challenge-page' &&
    isPageVisible('TwoDigitMentalMathChallengePage')
  ) {
    return (
      <TwoDigitMentalMathChallengePage
        initialTopic={challengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('TwoDigitMultiplicationPage') ? 'two-digit-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('TwoDigitMentalMathDifficultyChallengePage')
            ? (topic) => {
                if (topic) setChallengeTopic(topic);
                setCurrentPage('two-digit-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'two-digit-difficulty-challenge' &&
    isPageVisible('TwoDigitMentalMathDifficultyChallengePage')
  ) {
    return (
      <TwoDigitMentalMathDifficultyChallengePage
        initialTopic={challengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('TwoDigitMultiplicationPage') ? 'two-digit-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'visual-guide-page' &&
    isPageVisible('TwoDigitMentalMathVisualGuidePage')
  ) {
    return (
      <TwoDigitMentalMathVisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('TwoDigitMultiplicationPage') ? 'two-digit-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('TwoDigitMentalMathChallengePage')
            ? () => setCurrentPage('challenge-page')
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'two-digit-page' &&
    isPageVisible('TwoDigitMultiplicationPage')
  ) {
    return (
      <TwoDigitMultiplicationPage
        initialTopic={trainingTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyHubPage') ? 'multiply-hub' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('TwoDigitMentalMathChallengePage')
            ? (topic) => {
                if (topic) setChallengeTopic(topic);
                setCurrentPage('challenge-page');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('TwoDigitMentalMathDifficultyChallengePage')
            ? (topic) => {
                if (topic) setChallengeTopic(topic);
                setCurrentPage('two-digit-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('TwoDigitMentalMathVisualGuidePage')
            ? () => setCurrentPage('visual-guide-page')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 2: NHÂN VỚI SỐ 11 ====================
  if (
    currentPage === 'multiply-11-challenge' &&
    isPageVisible('MultiplyBy11ChallengePage')
  ) {
    return (
      <MultiplyBy11ChallengePage
        initialTopic={multiply11ChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy11Page') ? 'multiply-11-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyBy11DifficultyChallengePage')
            ? (topic) => {
                if (topic) setMultiply11ChallengeTopic(topic);
                setCurrentPage('multiply-11-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'multiply-11-difficulty-challenge' &&
    isPageVisible('MultiplyBy11DifficultyChallengePage')
  ) {
    return (
      <MultiplyBy11DifficultyChallengePage
        initialTopic={multiply11ChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy11Page') ? 'multiply-11-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'multiply-11-visual-guide' &&
    isPageVisible('MultiplyBy11VisualGuidePage')
  ) {
    return (
      <MultiplyBy11VisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy11Page') ? 'multiply-11-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('MultiplyBy11ChallengePage')
            ? () => setCurrentPage('multiply-11-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'multiply-11-page' && isPageVisible('MultiplyBy11Page')) {
    return (
      <MultiplyBy11Page
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyHubPage') ? 'multiply-hub' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('MultiplyBy11ChallengePage')
            ? (topic) => {
                if (topic) setMultiply11ChallengeTopic(topic);
                setCurrentPage('multiply-11-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyBy11DifficultyChallengePage')
            ? (topic) => {
                if (topic) setMultiply11ChallengeTopic(topic);
                setCurrentPage('multiply-11-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('MultiplyBy11VisualGuidePage')
            ? () => setCurrentPage('multiply-11-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW: NHÂN VỚI SỐ 99 ====================
  if (
    currentPage === 'multiply-99-challenge' &&
    isPageVisible('MultiplyBy99ChallengePage')
  ) {
    return (
      <MultiplyBy99ChallengePage
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy99Page') ? 'multiply-99-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyBy99DifficultyChallengePage')
            ? (topic, multiplier) => {
                if (topic) setMultiply99ChallengeTopic(topic);
                if (multiplier) setMultiply99ChallengeMultiplier(multiplier);
                setCurrentPage('multiply-99-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'multiply-99-difficulty-challenge' &&
    isPageVisible('MultiplyBy99DifficultyChallengePage')
  ) {
    return (
      <MultiplyBy99DifficultyChallengePage
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy99Page') ? 'multiply-99-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'multiply-99-visual-guide' &&
    isPageVisible('MultiplyBy99VisualGuidePage')
  ) {
    return (
      <MultiplyBy99VisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyBy99Page') ? 'multiply-99-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('MultiplyBy99ChallengePage')
            ? () => setCurrentPage('multiply-99-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'multiply-99-page' && isPageVisible('MultiplyBy99Page')) {
    return (
      <MultiplyBy99Page
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyHubPage') ? 'multiply-hub' : 'card'
          )
        }
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onOpenChallenge={
          isPageVisible('MultiplyBy99ChallengePage')
            ? (topic, multiplier) => {
                if (topic) setMultiply99ChallengeTopic(topic);
                if (multiplier) setMultiply99ChallengeMultiplier(multiplier);
                setCurrentPage('multiply-99-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyBy99DifficultyChallengePage')
            ? (topic, multiplier) => {
                if (topic) setMultiply99ChallengeTopic(topic);
                if (multiplier) setMultiply99ChallengeMultiplier(multiplier);
                setCurrentPage('multiply-99-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('MultiplyBy99VisualGuidePage')
            ? () => setCurrentPage('multiply-99-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 3: NHÂN VỚI 1 CHỮ SỐ ====================
  if (
    currentPage === 'multiply-1-digit-challenge' &&
    isPageVisible('MultiplyWith1DigitChallengePage')
  ) {
    return (
      <MultiplyWith1DigitChallengePage
        initialTopic={multiply1DigitChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyWith1DigitPage')
              ? 'multiply-1-digit-page'
              : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyWith1DigitDifficultyChallengePage')
            ? (topic) => {
                if (topic) setMultiply1DigitChallengeTopic(topic);
                setCurrentPage('multiply-1-digit-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'multiply-1-digit-difficulty-challenge' &&
    isPageVisible('MultiplyWith1DigitDifficultyChallengePage')
  ) {
    return (
      <MultiplyWith1DigitDifficultyChallengePage
        initialTopic={multiply1DigitChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyWith1DigitPage')
              ? 'multiply-1-digit-page'
              : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'multiply-1-digit-visual-guide' &&
    isPageVisible('MultiplyWith1DigitVisualGuidePage')
  ) {
    return (
      <MultiplyWith1DigitVisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyWith1DigitPage')
              ? 'multiply-1-digit-page'
              : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('MultiplyWith1DigitChallengePage')
            ? () => setCurrentPage('multiply-1-digit-challenge')
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'multiply-1-digit-page' &&
    isPageVisible('MultiplyWith1DigitPage')
  ) {
    return (
      <MultiplyWith1DigitPage
        onBack={() =>
          setCurrentPage(
            isPageVisible('MultiplyHubPage') ? 'multiply-hub' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('MultiplyWith1DigitChallengePage')
            ? (topic) => {
                if (topic) setMultiply1DigitChallengeTopic(topic);
                setCurrentPage('multiply-1-digit-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('MultiplyWith1DigitDifficultyChallengePage')
            ? (topic) => {
                if (topic) setMultiply1DigitChallengeTopic(topic);
                setCurrentPage('multiply-1-digit-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('MultiplyWith1DigitVisualGuidePage')
            ? () => setCurrentPage('multiply-1-digit-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 4: PHÉP CHIA ====================
  if (
    currentPage === 'division-challenge' &&
    isPageVisible('DivisionChallengePage')
  ) {
    return (
      <DivisionChallengePage
        initialTopic={divisionChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('DivisionPage') ? 'division-page' : 'card')
        }
        onOpenHardChallenge={
          isPageVisible('DivisionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setDivisionChallengeTopic(topic);
                setCurrentPage('division-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'division-difficulty-challenge' &&
    isPageVisible('DivisionDifficultyChallengePage')
  ) {
    return (
      <DivisionDifficultyChallengePage
        initialTopic={divisionChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('DivisionPage') ? 'division-page' : 'card')
        }
      />
    );
  }

  if (
    currentPage === 'division-visual-guide' &&
    isPageVisible('DivisionVisualGuidePage')
  ) {
    return (
      <DivisionVisualGuidePage
        onBack={() =>
          setCurrentPage(isPageVisible('DivisionPage') ? 'division-page' : 'card')
        }
        onOpenChallenge={
          isPageVisible('DivisionChallengePage')
            ? () => setCurrentPage('division-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'division-page' && isPageVisible('DivisionPage')) {
    return (
      <DivisionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('DivisionChallengePage')
            ? (topic) => {
                if (topic) setDivisionChallengeTopic(topic);
                setCurrentPage('division-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('DivisionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setDivisionChallengeTopic(topic);
                setCurrentPage('division-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('DivisionVisualGuidePage')
            ? () => setCurrentPage('division-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 5: PHÉP CỘNG ====================
  if (
    currentPage === 'addition-challenge' &&
    isPageVisible('AdditionChallengePage')
  ) {
    return (
      <AdditionChallengePage
        initialTopic={additionChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('AdditionPage') ? 'addition-page' : 'card')
        }
        onOpenHardChallenge={
          isPageVisible('AdditionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setAdditionChallengeTopic(topic);
                setCurrentPage('addition-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'addition-difficulty-challenge' &&
    isPageVisible('AdditionDifficultyChallengePage')
  ) {
    return (
      <AdditionDifficultyChallengePage
        initialTopic={additionChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('AdditionPage') ? 'addition-page' : 'card')
        }
      />
    );
  }

  if (
    currentPage === 'addition-visual-guide' &&
    isPageVisible('AdditionVisualGuidePage')
  ) {
    return (
      <AdditionVisualGuidePage
        onBack={() =>
          setCurrentPage(isPageVisible('AdditionPage') ? 'addition-page' : 'card')
        }
        onOpenChallenge={
          isPageVisible('AdditionChallengePage')
            ? () => setCurrentPage('addition-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'addition-page' && isPageVisible('AdditionPage')) {
    return (
      <AdditionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('AdditionChallengePage')
            ? (topic) => {
                if (topic) setAdditionChallengeTopic(topic);
                setCurrentPage('addition-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('AdditionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setAdditionChallengeTopic(topic);
                setCurrentPage('addition-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('AdditionVisualGuidePage')
            ? () => setCurrentPage('addition-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 6: PHÉP TRỪ ====================
  if (
    currentPage === 'subtraction-challenge' &&
    isPageVisible('SubtractionChallengePage')
  ) {
    return (
      <SubtractionChallengePage
        initialTopic={subtractionChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SubtractionPage') ? 'subtraction-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('SubtractionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setSubtractionChallengeTopic(topic);
                setCurrentPage('subtraction-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'subtraction-difficulty-challenge' &&
    isPageVisible('SubtractionDifficultyChallengePage')
  ) {
    return (
      <SubtractionDifficultyChallengePage
        initialTopic={subtractionChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SubtractionPage') ? 'subtraction-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'subtraction-visual-guide' &&
    isPageVisible('SubtractionVisualGuidePage')
  ) {
    return (
      <SubtractionVisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('SubtractionPage') ? 'subtraction-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('SubtractionChallengePage')
            ? () => setCurrentPage('subtraction-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'subtraction-page' && isPageVisible('SubtractionPage')) {
    return (
      <SubtractionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('SubtractionChallengePage')
            ? (topic) => {
                if (topic) setSubtractionChallengeTopic(topic);
                setCurrentPage('subtraction-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('SubtractionDifficultyChallengePage')
            ? (topic) => {
                if (topic) setSubtractionChallengeTopic(topic);
                setCurrentPage('subtraction-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('SubtractionVisualGuidePage')
            ? () => setCurrentPage('subtraction-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 7: CĂN BẬC 2 ====================
  if (
    currentPage === 'square-root-challenge' &&
    isPageVisible('SquareRootChallengePage')
  ) {
    return (
      <SquareRootChallengePage
        initialTopic={squareRootChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SquareRootPage') ? 'square-root-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('SquareRootDifficultyChallengePage')
            ? (topic) => {
                if (topic) setSquareRootChallengeTopic(topic);
                setCurrentPage('square-root-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'square-root-difficulty-challenge' &&
    isPageVisible('SquareRootDifficultyChallengePage')
  ) {
    return (
      <SquareRootDifficultyChallengePage
        initialTopic={squareRootChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SquareRootPage') ? 'square-root-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'square-root-visual-guide' &&
    isPageVisible('SquareRootVisualGuidePage')
  ) {
    return (
      <SquareRootVisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('SquareRootPage') ? 'square-root-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('SquareRootChallengePage')
            ? () => setCurrentPage('square-root-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'square-root-page' && isPageVisible('SquareRootPage')) {
    return (
      <SquareRootPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('SquareRootChallengePage')
            ? (topic) => {
                if (topic) setSquareRootChallengeTopic(topic);
                setCurrentPage('square-root-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('SquareRootDifficultyChallengePage')
            ? (topic) => {
                if (topic) setSquareRootChallengeTopic(topic);
                setCurrentPage('square-root-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('SquareRootVisualGuidePage')
            ? () => setCurrentPage('square-root-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 8: LŨY THỪA ====================
  if (
    currentPage === 'exponent-challenge' &&
    isPageVisible('ExponentChallengePage')
  ) {
    return (
      <ExponentChallengePage
        initialTopic={exponentChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('ExponentPage') ? 'exponent-page' : 'card')
        }
        onOpenHardChallenge={
          isPageVisible('ExponentDifficultyChallengePage')
            ? (topic) => {
                if (topic) setExponentChallengeTopic(topic);
                setCurrentPage('exponent-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'exponent-difficulty-challenge' &&
    isPageVisible('ExponentDifficultyChallengePage')
  ) {
    return (
      <ExponentDifficultyChallengePage
        initialTopic={exponentChallengeTopic}
        onBack={() =>
          setCurrentPage(isPageVisible('ExponentPage') ? 'exponent-page' : 'card')
        }
      />
    );
  }

  if (
    currentPage === 'exponent-visual-guide' &&
    isPageVisible('ExponentVisualGuidePage')
  ) {
    return (
      <ExponentVisualGuidePage
        onBack={() =>
          setCurrentPage(isPageVisible('ExponentPage') ? 'exponent-page' : 'card')
        }
        onOpenChallenge={
          isPageVisible('ExponentChallengePage')
            ? () => setCurrentPage('exponent-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'exponent-page' && isPageVisible('ExponentPage')) {
    return (
      <ExponentPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('ExponentChallengePage')
            ? (topic) => {
                if (topic) setExponentChallengeTopic(topic);
                setCurrentPage('exponent-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('ExponentDifficultyChallengePage')
            ? (topic) => {
                if (topic) setExponentChallengeTopic(topic);
                setCurrentPage('exponent-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('ExponentVisualGuidePage')
            ? () => setCurrentPage('exponent-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 9: TỶ LỆ % (3 CARD CON) ====================
  const pctPracticeKey = `PercentagePage_${percentageMode}` as PageVisibilityKey;
  const pctChallengeKey =
    `PercentageChallengePage_${percentageMode}` as PageVisibilityKey;
  const pctHardChallengeKey =
    `PercentageDifficultyChallengePage_${percentageMode}` as PageVisibilityKey;
  const pctVisualGuideKey =
    `PercentageVisualGuidePage_${percentageMode}` as PageVisibilityKey;

  if (currentPage === 'percentage-challenge' && isPageVisible(pctChallengeKey)) {
    return (
      <PercentageChallengePage
        mode={percentageMode}
        initialTopic={percentageChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible(pctPracticeKey) ? 'percentage-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible(pctHardChallengeKey)
            ? (topic) => {
                if (topic) setPercentageChallengeTopic(topic);
                setCurrentPage('percentage-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'percentage-difficulty-challenge' &&
    isPageVisible(pctHardChallengeKey)
  ) {
    return (
      <PercentageDifficultyChallengePage
        mode={percentageMode}
        initialTopic={percentageChallengeTopic}
        onBack={() =>
          setCurrentPage(
            isPageVisible(pctPracticeKey) ? 'percentage-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'percentage-visual-guide' &&
    isPageVisible(pctVisualGuideKey)
  ) {
    return (
      <PercentageVisualGuidePage
        mode={percentageMode}
        onBack={() =>
          setCurrentPage(
            isPageVisible(pctPracticeKey) ? 'percentage-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible(pctChallengeKey)
            ? () => setCurrentPage('percentage-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'percentage-page' && isPageVisible(pctPracticeKey)) {
    return (
      <PercentagePage
        mode={percentageMode}
        onBack={() =>
          setCurrentPage(
            isPageVisible('PercentageHubPage') ? 'percentage-hub' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible(pctChallengeKey)
            ? (topic) => {
                if (topic) setPercentageChallengeTopic(topic);
                setCurrentPage('percentage-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible(pctHardChallengeKey)
            ? (topic) => {
                if (topic) setPercentageChallengeTopic(topic);
                setCurrentPage('percentage-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible(pctVisualGuideKey)
            ? () => setCurrentPage('percentage-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== FLOW 10: RÈN LUYỆN PHẢN XẠ TÍNH NHẨM HÀNG NGÀY ====================
  if (
    currentPage === 'daily-reflex-challenge' &&
    isPageVisible('DailyReflexChallengePage')
  ) {
    return (
      <DailyReflexChallengePage
        initialMode={dailyReflexMode}
        initialCustomOps={dailyReflexCustomOps}
        onBack={() =>
          setCurrentPage(
            isPageVisible('DailyReflexPage') ? 'daily-reflex-page' : 'card'
          )
        }
        onOpenHardChallenge={
          isPageVisible('DailyReflexDifficultyChallengePage')
            ? (mode, ops) => {
                if (mode) setDailyReflexMode(mode);
                if (ops) setDailyReflexCustomOps(ops);
                setCurrentPage('daily-reflex-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  if (
    currentPage === 'daily-reflex-difficulty-challenge' &&
    isPageVisible('DailyReflexDifficultyChallengePage')
  ) {
    return (
      <DailyReflexDifficultyChallengePage
        initialMode={dailyReflexMode}
        initialCustomOps={dailyReflexCustomOps}
        onBack={() =>
          setCurrentPage(
            isPageVisible('DailyReflexPage') ? 'daily-reflex-page' : 'card'
          )
        }
      />
    );
  }

  if (
    currentPage === 'daily-reflex-visual-guide' &&
    isPageVisible('DailyReflexVisualGuidePage')
  ) {
    return (
      <DailyReflexVisualGuidePage
        onBack={() =>
          setCurrentPage(
            isPageVisible('DailyReflexPage') ? 'daily-reflex-page' : 'card'
          )
        }
        onOpenChallenge={
          isPageVisible('DailyReflexChallengePage')
            ? () => setCurrentPage('daily-reflex-challenge')
            : undefined
        }
      />
    );
  }

  if (currentPage === 'daily-reflex-page' && isPageVisible('DailyReflexPage')) {
    return (
      <DailyReflexPage
        initialMode={dailyReflexMode}
        customOps={dailyReflexCustomOps}
        onChangeCustomOps={setDailyReflexCustomOps}
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('DailyReflexChallengePage')
            ? (mode, ops) => {
                if (mode) setDailyReflexMode(mode);
                if (ops) setDailyReflexCustomOps(ops);
                setCurrentPage('daily-reflex-challenge');
              }
            : undefined
        }
        onOpenHardChallenge={
          isPageVisible('DailyReflexDifficultyChallengePage')
            ? (mode, ops) => {
                if (mode) setDailyReflexMode(mode);
                if (ops) setDailyReflexCustomOps(ops);
                setCurrentPage('daily-reflex-difficulty-challenge');
              }
            : undefined
        }
        onOpenVisualGuide={
          isPageVisible('DailyReflexVisualGuidePage')
            ? () => setCurrentPage('daily-reflex-visual-guide')
            : undefined
        }
      />
    );
  }

  // ==================== SUB-PAGE: CARD CHA "PHÉP NHÂN" (4 CARD CON) ====================
  if (currentPage === 'multiply-hub' && isPageVisible('MultiplyHubPage')) {
    return (
      <div className="w-full max-w-7xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage('card')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-slate-300 hover:text-white transition-all text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-yellow-400" />
            <span>{t.backToMentalMath}</span>
          </button>

          <div className="flex items-center gap-3">
            {showAutoNextButton && (
              <button
                type="button"
                onClick={() => setIsAutoNextModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 transition-all text-xs font-bold cursor-pointer active:scale-95 whitespace-nowrap"
                title={
                  tr("Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)")
                }
              >
                <TimerReset className="w-3.5 h-3.5" />
                <span>{tr("Đổi câu hỏi")}</span>
              </button>
            )}
            {showEditTimerButton && (
              <button
                type="button"
                onClick={() => setIsTimerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-bold cursor-pointer active:scale-95"
                title={tr("Chỉnh sửa Timer toàn Tab hoặc từng Page")}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{tr("Chỉnh sửa Timer")}</span>
              </button>
            )}
            <div className="text-right">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {t.cardMultiplyTitle}
              </h1>
              <p className="text-xs text-slate-400">{t.cardMultiplySub}</p>
            </div>
          </div>
        </div>

        {(() => {
          const multiplyChildren = [
            isCardVisible('mm:multiply-2-digit') &&
              isPageVisible('TwoDigitMultiplicationPage') && (
              <div
                key="mm:multiply-2-digit"
                onClick={() => {
                  setTrainingTopic('twoDigit');
                  setCurrentPage('two-digit-page');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTrainingTopic('twoDigit');
                    setCurrentPage('two-digit-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={cardBg}
                  alt={t.cardMultiply2Title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardMultiply2Title}
                  </h2>
                </div>
              </div>
            ),
            isCardVisible('mm:multiply-11') &&
              isPageVisible('MultiplyBy11Page') && (
              <div
                key="mm:multiply-11"
                onClick={() => setCurrentPage('multiply-11-page')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentPage('multiply-11-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={card11Bg}
                  alt={t.cardMultiply11Title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/45 via-slate-950/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardMultiply11Title}
                  </h2>
                </div>
              </div>
            ),
            isCardVisible('mm:multiply-1-digit') &&
              isPageVisible('MultiplyWith1DigitPage') && (
              <div
                key="mm:multiply-1-digit"
                onClick={() => setCurrentPage('multiply-1-digit-page')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentPage('multiply-1-digit-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={card1DigitBg}
                  alt={t.cardMultiply1DigitTitle}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/45 via-slate-950/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardMultiply1DigitTitle}
                  </h2>
                </div>
              </div>
            ),
            isCardVisible('mm:multiply-99') &&
              isPageVisible('MultiplyBy99Page') && (
              <div
                key="mm:multiply-99"
                onClick={() => setCurrentPage('multiply-99-page')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentPage('multiply-99-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={cardMultiplyBg}
                  alt={t.cardMultiply99Title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/55 via-slate-950/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardMultiply99Title}
                  </h2>
                </div>
              </div>
            ),
          ].filter(Boolean);

          if (multiplyChildren.length === 0) {
            return (
              <div className="min-h-[240px] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-center space-y-4">
                  <EyeOff className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-white">
                    {tr("Các card con của Phép nhân đang ẩn")}
                  </p>
                  {(canRestoreInUi || onOpenCardVisibility) && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {canRestoreInUi && (
                        <button
                          type="button"
                          onClick={() => setChildCardsVisibility('mm:multiply', true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr("Hiện lại card con")}</span>
                        </button>
                      )}
                      {onOpenCardVisibility && (
                        <button
                          type="button"
                          onClick={onOpenCardVisibility}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                        >
                          <span>{tr("Tùy chỉnh chi tiết [Ngắn]")}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 w-full max-w-md sm:max-w-none mx-auto">
              {multiplyChildren}
            </div>
          );
        })()}

        {showEditTimerButton && (
          <MentalMathChallengeTimerModal
            isOpen={isTimerModalOpen}
            onClose={() => setIsTimerModalOpen(false)}
            initialScope="global"
          />
        )}
        {showAutoNextButton && (
          <MentalMathAutoNextModal
            isOpen={isAutoNextModalOpen}
            onClose={() => setIsAutoNextModalOpen(false)}
            initialScope="global"
          />
        )}
      </div>
    );
  }

  // ==================== SUB-PAGE: CARD CHA "TỶ LỆ %" (3 CARD CON) ====================
  if (currentPage === 'percentage-hub' && isPageVisible('PercentageHubPage')) {
    return (
      <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage('card')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-slate-300 hover:text-white transition-all text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-yellow-400" />
            <span>{t.backToMentalMath}</span>
          </button>

          <div className="flex items-center gap-3">
            {showAutoNextButton && (
              <button
                type="button"
                onClick={() => setIsAutoNextModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 transition-all text-xs font-bold cursor-pointer active:scale-95 whitespace-nowrap"
                title={
                  tr("Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)")
                }
              >
                <TimerReset className="w-3.5 h-3.5" />
                <span>{tr("Đổi câu hỏi")}</span>
              </button>
            )}
            {showEditTimerButton && (
              <button
                type="button"
                onClick={() => setIsTimerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-bold cursor-pointer active:scale-95"
                title={tr("Chỉnh sửa Timer toàn Tab hoặc từng Page")}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{tr("Chỉnh sửa Timer")}</span>
              </button>
            )}
            <div className="text-right">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {t.cardPercentTitle}
              </h1>
              <p className="text-xs text-slate-400">{t.cardPercentSub}</p>
            </div>
          </div>
        </div>

        {(() => {
          const percentageChildren = [
            isCardVisible('mm:percentage-basic') &&
              isPageVisible('PercentagePage_basic') && (
              <div
                key="mm:percentage-basic"
                onClick={() => {
                  setPercentageMode('basic');
                  setPercentageChallengeTopic('general');
                  setCurrentPage('percentage-page');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPercentageMode('basic');
                    setPercentageChallengeTopic('general');
                    setCurrentPage('percentage-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={cardPercentBasicBg}
                  alt={t.cardPercentBasicTitle}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                  <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardPercentBasicTitle}
                  </h2>
                </div>
              </div>
            ),
            isCardVisible('mm:percentage-change') &&
              isPageVisible('PercentagePage_change') && (
              <div
                key="mm:percentage-change"
                onClick={() => {
                  setPercentageMode('change');
                  setPercentageChallengeTopic('general');
                  setCurrentPage('percentage-page');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPercentageMode('change');
                    setPercentageChallengeTopic('general');
                    setCurrentPage('percentage-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={cardPercentChangeBg}
                  alt={t.cardPercentChangeTitle}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                  <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardPercentChangeTitle}
                  </h2>
                </div>
              </div>
            ),
            isCardVisible('mm:percentage-reverse') &&
              isPageVisible('PercentagePage_reverse') && (
              <div
                key="mm:percentage-reverse"
                onClick={() => {
                  setPercentageMode('reverse');
                  setPercentageChallengeTopic('general');
                  setCurrentPage('percentage-page');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPercentageMode('reverse');
                    setPercentageChallengeTopic('general');
                    setCurrentPage('percentage-page');
                  }
                }}
                className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
              >
                <img
                  src={cardPercentReverseBg}
                  alt={t.cardPercentReverseTitle}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
                />
                <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                  <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 whitespace-nowrap">
                    {t.cardPercentReverseTitle}
                  </h2>
                </div>
              </div>
            ),
          ].filter(Boolean);

          if (percentageChildren.length === 0) {
            return (
              <div className="min-h-[240px] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-center space-y-4">
                  <EyeOff className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-white">
                    {tr("Các card con của Tỷ lệ % đang ẩn")}
                  </p>
                  {(canRestoreInUi || onOpenCardVisibility) && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {canRestoreInUi && (
                        <button
                          type="button"
                          onClick={() => setChildCardsVisibility('mm:percentage', true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr("Hiện lại card con")}</span>
                        </button>
                      )}
                      {onOpenCardVisibility && (
                        <button
                          type="button"
                          onClick={onOpenCardVisibility}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                        >
                          <span>{tr("Tùy chỉnh chi tiết [Ngắn]")}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-7 w-full max-w-md md:max-w-none mx-auto">
              {percentageChildren}
            </div>
          );
        })()}

        {showEditTimerButton && (
          <MentalMathChallengeTimerModal
            isOpen={isTimerModalOpen}
            onClose={() => setIsTimerModalOpen(false)}
            initialScope="global"
          />
        )}
        {showAutoNextButton && (
          <MentalMathAutoNextModal
            isOpen={isAutoNextModalOpen}
            onClose={() => setIsAutoNextModalOpen(false)}
            initialScope="global"
          />
        )}
      </div>
    );
  }

  // ==================== MÀN HÌNH CHÍNH: CÁC CARD TÍNH NHẨM ====================
  // Danh sách 8 Card chính hiển thị ngoài màn hình Tab Tính nhẩm (lọc qua cardVisibility & pageVisibility)
  const mainCards: Array<{
    id: string;
    visibilityId: CardVisibilityId;
    pageKey: PageVisibilityKey;
    title: string;
    subtitle?: string;
    image: string;
    wrapTitle?: boolean;
    onSelect: () => void;
  }> = [
    {
      id: 'multiply',
      visibilityId: 'mm:multiply',
      pageKey: 'MultiplyHubPage',
      title: t.cardMultiplyTitle,
      subtitle: t.cardMultiplySub,
      image: cardMultiplyBg,
      onSelect: () => setCurrentPage('multiply-hub'),
    },
    {
      id: 'division',
      visibilityId: 'mm:division',
      pageKey: 'DivisionPage',
      title: t.cardDivideTitle,
      image: cardDivideBg,
      onSelect: () => setCurrentPage('division-page'),
    },
    {
      id: 'addition',
      visibilityId: 'mm:addition',
      pageKey: 'AdditionPage',
      title: t.cardAddTitle,
      image: cardAddBg,
      onSelect: () => setCurrentPage('addition-page'),
    },
    {
      id: 'subtraction',
      visibilityId: 'mm:subtraction',
      pageKey: 'SubtractionPage',
      title: t.cardSubtractTitle,
      image: cardSubtractBg,
      onSelect: () => setCurrentPage('subtraction-page'),
    },
    {
      id: 'square-root',
      visibilityId: 'mm:square-root',
      pageKey: 'SquareRootPage',
      title: t.cardSqrtTitle,
      image: cardSqrtBg,
      onSelect: () => setCurrentPage('square-root-page'),
    },
    {
      id: 'exponent',
      visibilityId: 'mm:exponent',
      pageKey: 'ExponentPage',
      title: t.cardPowerTitle,
      image: cardPowerBg,
      onSelect: () => setCurrentPage('exponent-page'),
    },
    {
      id: 'percentage',
      visibilityId: 'mm:percentage',
      pageKey: 'PercentageHubPage',
      title: t.cardPercentTitle,
      subtitle: t.cardPercentSub,
      image: cardPercentBg,
      onSelect: () => setCurrentPage('percentage-hub'),
    },
    {
      id: 'daily-reflex',
      visibilityId: 'mm:daily-reflex',
      pageKey: 'DailyReflexPage',
      title: t.cardDailyReflexTitle,
      subtitle: t.cardDailyReflexSub,
      image: cardBg,
      wrapTitle: true,
      onSelect: () => setCurrentPage('daily-reflex-page'),
    },
  ];

  const visibleMainCards = mainCards.filter(
    (card) => isCardVisible(card.visibilityId) && isPageVisible(card.pageKey)
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4 space-y-4">
      {(showAutoNextButton || showEditTimerButton) && (
        <div className="flex flex-wrap items-center justify-end gap-2 w-full max-w-md sm:max-w-none mx-auto">
          {showAutoNextButton && (
            <button
              type="button"
              onClick={() => setIsAutoNextModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-200 shadow-lg transition-all text-xs sm:text-sm font-bold cursor-pointer active:scale-95 whitespace-nowrap"
              title={
                tr("Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ Mental Math hoặc theo từng Page)")
              }
            >
              <TimerReset className="w-4 h-4 text-cyan-400" />
              <span>{tr("Tùy chỉnh đổi câu (Giây)")}</span>
            </button>
          )}

          {showEditTimerButton && (
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-slate-200 hover:text-yellow-200 shadow-lg transition-all text-xs sm:text-sm font-bold cursor-pointer active:scale-95"
              title={
                tr("Chỉnh sửa Timer cho toàn Tab Mental Math hoặc riêng lẻ từng page")
              }
            >
              <Clock className="w-4 h-4 text-yellow-400" />
              <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-300" />
              <span>{tr("Chỉnh sửa Timer")}</span>
            </button>
          )}
        </div>
      )}
      {visibleMainCards.length === 0 ? (
        <div className="min-h-[280px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <EyeOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {tr("Tất cả Card trong Tab này đang ẩn")}
              </h2>
              <p className="text-xs text-slate-400">
                {tr("Bạn có thể bật hiển thị lại toàn bộ hoặc chọn từng card chi tiết cho Tab Tính nhẩm.")}
              </p>
            </div>
            {(canRestoreInUi || onOpenCardVisibility) && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {canRestoreInUi && (
                  <button
                    type="button"
                    onClick={() => setTabCardsVisibility('mental-math', true, true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{tr("Hiện lại tất cả")}</span>
                  </button>
                )}
                {onOpenCardVisibility && (
                  <button
                    type="button"
                    onClick={onOpenCardVisibility}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>{tr("Tùy chỉnh chi tiết")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 w-full max-w-md sm:max-w-none mx-auto">
          {visibleMainCards.map((card) => (
            <div
              key={card.id}
              onClick={card.onSelect}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  card.onSelect();
                }
              }}
              className="group relative rounded-2xl sm:rounded-3xl border border-yellow-500/40 hover:border-yellow-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-yellow-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6 bg-slate-900"
            >
              <img
                src={card.image}
                alt={card.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
              />
              <div className="absolute inset-0 bg-radial from-slate-950/70 via-slate-950/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 group-hover:ring-yellow-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-3 pointer-events-none gap-1.5">
                <h2
                  className={`font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-yellow-100 ${
                    card.wrapTitle
                      ? 'text-sm sm:text-base lg:text-sm xl:text-base leading-snug text-balance max-w-[94%]'
                      : 'text-lg sm:text-xl lg:text-lg xl:text-xl whitespace-nowrap'
                  }`}
                >
                  {card.title}
                </h2>
                {card.subtitle && (
                  <p className="text-[11px] sm:text-xs font-medium text-yellow-200/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)] max-w-[92%] truncate">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render hai Modal cấu hình toàn Tab (Timer & Auto-Next) */}
      {showEditTimerButton && (
        <MentalMathChallengeTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          initialScope="global"
        />
      )}
      {showAutoNextButton && (
        <MentalMathAutoNextModal
          isOpen={isAutoNextModalOpen}
          onClose={() => setIsAutoNextModalOpen(false)}
          initialScope="global"
        />
      )}
    </div>
  );
};
