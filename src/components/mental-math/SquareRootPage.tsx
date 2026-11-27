/**
 * ============================================================================
 * FILE: SquareRootPage.tsx — TRANG LUYỆN TẬP CĂN BẬC HAI (MENTAL MATH PRACTICE)
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next).
 * 2. Quản lý luyện tập căn bậc 2 theo 4 chủ đề (Ngẫu nhiên, Căn nhỏ, Căn số 4 chữ số, Căn số 5 chữ số).
 * 3. Hỗ trợ đọc đề bằng giọng nói TTS (1.25x / 1.5x / 1.75x) và trả lời bằng Micro (Web Speech API).
 * 4. Hiển thị bàn phím số ảo 2x6, ô nhập đáp án, gợi ý nhẩm nhanh và điều hướng Hướng dẫn / Thử thách.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
// PHẦN 0: LOGIC CĂN BẬC 2 NHẨM (CODE TRỰC TIẾP TRONG PAGE)
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

interface OperationTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

interface OperationMeta {
  id: ArithmeticOperation;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  symbol: string;
  topics: OperationTopic[];
}

type OperationDifficulty = 'normal' | 'hard';

const OPERATION_META: { 'square-root': OperationMeta } = {
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
};

const opRandInt = (min: number, max: number) =>
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

function generateOperationQuestion(
  _operation: ArithmeticOperation,
  topicId: string,
  difficulty: OperationDifficulty = 'normal'
): OperationQuestion {
  const isHard = difficulty === 'hard';
  let mode = topicId;
  if (mode === 'general') {
    const pool = isHard
      ? ['sqrt4Digit', 'sqrt5Digit']
      : ['sqrtSmall', 'sqrt4Digit', 'sqrt5Digit'];
    mode = pool[opRandInt(0, pool.length - 1)];
  }

  let root = 25;
  if (mode === 'sqrtSmall') {
    root = isHard ? opRandInt(18, 30) : opRandInt(10, 30);
  } else if (mode === 'sqrt4Digit') {
    root = isHard ? opRandInt(46, 99) : opRandInt(32, 99);
  } else {
    root = isHard ? opRandInt(135, 495) : opRandInt(100, 295);
  }
  if (isHard && root % 10 === 0) root += opRandInt(1, 9);
  const square = root * root;
  const hint = buildSquareRootHint(root, square);
  return {
    a: square,
    answer: root,
    ...hint,
  };
}

function getOperationSpokenText(
  _operation: ArithmeticOperation,
  question: OperationQuestion,
  isVi: boolean
): string {
  return isVi
    ? `căn bậc hai của ${question.a}`
    : `square root of ${question.a}`;
}

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

// Danh sách chủ đề luyện tập Căn bậc hai & Icon tương ứng
export type SquareRootTopic = 'general' | 'sqrtSmall' | 'sqrt4Digit' | 'sqrt5Digit';

interface SquareRootPageProps {
  onBack: () => void;
  onOpenChallenge?: (topic?: SquareRootTopic) => void;
  onOpenHardChallenge?: (topic?: SquareRootTopic) => void;
  onOpenVisualGuide?: () => void;
  initialTopic?: SquareRootTopic;
}

export const SQUARE_ROOT_TOPICS = OPERATION_META['square-root'].topics;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  sqrtSmall: '⚡',
  sqrt4Digit: '✨',
  sqrt5Digit: '🚀',
};

export const SquareRootPage: React.FC<SquareRootPageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenHardChallenge,
  onOpenVisualGuide,
  initialTopic,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const meta = OPERATION_META['square-root'];

  // Cấu hình Auto-Next riêng cho trang SquareRootPage
  const autoNextConfig = useMentalMathAutoNextConfig('SquareRootPage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('SquareRootPage');
  const autoNextTimerRef = useRef<number | null>(null);

  // State chủ đề, câu hỏi căn bậc 2 hiện tại, đáp án nhập & phản hồi

  const [selectedTopic, setSelectedTopic] = useState<SquareRootTopic>(initialTopic || 'general');
  const [question, setQuestion] = useState<OperationQuestion>(() =>
    generateOperationQuestion('square-root', initialTopic || 'general')
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved && [1.25, 1.5, 1.75].includes(parseFloat(saved))) return parseFloat(saved);
    }
    return 1.25;
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const questionRef = useRef<OperationQuestion>(question);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

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
      stopCurrentSpeech();
      stopListening();
    };
  }, [stopListening]);

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = getOperationSpokenText('square-root', questionRef.current, isVi);
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
    (topicOverride?: SquareRootTopic) => {
      const activeTopic = topicOverride || selectedTopic;
      setQuestion(generateOperationQuestion('square-root', activeTopic));
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      stopCurrentSpeech();
      setIsSpeakingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [selectedTopic]
  );

  // Effect: Khi trả lời đúng và bật Auto-Next -> đếm giờ tự động sang câu mới
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

  // Phát chuông + đọc đáp án đúng/sai bằng giọng nữ
  const triggerAnnouncement = useCallback(
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  // Kiểm tra đáp án người dùng nhập hoặc đọc qua micro
  const verifyAnswer = useCallback(
    (rawVal: string) => {
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      if (parsed === questionRef.current.answer) {
        setFeedback('correct');
        stopListening();
        if (isSpeakerEnabled) {
          triggerAnnouncement(true, questionRef.current.answer);
        }
      } else {
        setFeedback('incorrect');
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

  const activeTopicObj =
    SQUARE_ROOT_TOPICS.find((tItem) => tItem.id === selectedTopic) || SQUARE_ROOT_TOPICS[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: Quay lại + Hướng dẫn + Thử thách + Breadcrumb */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopCurrentSpeech();
            stopListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại")}</span>
        </button>

        <div className="flex items-center gap-2">
          {isVisualGuideButtonVisible('SquareRootPage') && (
            <>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                title={tr("Xem nhanh hướng dẫn toàn bộ Web App", "Quick guide for the entire Web App")}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>{tr("Hướng dẫn")}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadGuidePdf('Guide.pdf')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                title={tr("Tải hướng dẫn định dạng PDF")}
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>{tr("Download PDF")}</span>
              </button>
            </>
          )}

          {isChallengeButtonVisible('SquareRootPage') && onOpenChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenChallenge(selectedTopic);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
              title={tr("Thử thách tính nhẩm tốc độ cao")}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{tr("Thử thách")}</span>
            </button>
          )}

          {isDifficultLevelChallengeButtonVisible('SquareRootPage') && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenHardChallenge(selectedTopic);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25"
              title={tr("Thử thách cấp độ khó")}
            >
              <Gauge className="w-3.5 h-3.5 text-white" />
              <span>{tr("Thử thách")}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{tr("Tính Nhẩm")}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold">
              {isVi ? meta.titleVi : meta.titleEn}
            </span>
          </div>
        </div>
      </div>

      {/* Khung luyện tập chính */}
      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-yellow-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Thanh tiêu đề & nhóm nút hành động (Hướng dẫn, Thử thách, Auto-Next, Loa) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {tr("Luyện tập")}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isVisualGuideButtonVisible('SquareRootPage') && (
              <>
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 text-xs"
                  title={tr("Xem nhanh hướng dẫn toàn bộ Web App", "Quick guide for the entire Web App")}
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tr("Hướng dẫn")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadGuidePdf('Guide.pdf')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
                  title={tr("Tải hướng dẫn định dạng PDF")}
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>{tr("Download PDF")}</span>
                </button>
              </>
            )}

            {isChallengeButtonVisible('SquareRootPage') && onOpenChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenChallenge(selectedTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-xs"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{tr("Thử thách")}</span>
              </button>
            )}

            {isDifficultLevelChallengeButtonVisible('SquareRootPage') && onOpenHardChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenHardChallenge(selectedTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition-all cursor-pointer active:scale-95 text-xs"
                title={tr("Thử thách cấp độ khó")}
              >
                <Gauge className="w-3.5 h-3.5 text-white" />
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
                  initialPageKey={"SquareRootPage"}
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
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-xs ring-1 ring-yellow-400/20'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800'
              }`}
              title={
                isSpeakerEnabled
                  ? tr("Đang bật thông báo kết quả (Bấm để tắt)")
                  : tr("Đang tắt thông báo kết quả (Bấm để bật)")
              }
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-3.5 h-3.5 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="font-semibold">
                {isSpeakerEnabled
                  ? tr("Kết quả: Bật")
                  : tr("Kết quả: Tắt")}
              </span>
            </button>
          </div>
        </div>

        {/* Thanh chọn chủ đề luyện tập Căn bậc hai */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
            <Sliders className="w-3.5 h-3.5 text-yellow-400" />
            <span>{tr("Chọn bài luyện tập theo yêu cầu:")}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            {SQUARE_ROOT_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  const nextId = topic.id as SquareRootTopic;
                  setSelectedTopic(nextId);
                  generateNewQuestion(nextId);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  selectedTopic === topic.id
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-base">{TOPIC_ICONS[topic.id] || '⚡'}</span>
                <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Khu vực làm bài chia 2 cột: Đề bài (trái) & Nhập đáp án / Bàn phím số (phải) */}
        <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
          {/* Cột trái: Hiển thị biểu thức căn bậc hai, nút loa đọc đề, tốc độ đọc & kết quả */}
          <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                {isVi ? activeTopicObj.badgeVi : activeTopicObj.badgeEn}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-full py-2 px-1">
                <div className={`${question.a.toLocaleString().length >= 6 ? 'text-2xl sm:text-4xl lg:text-5xl' : 'text-3xl sm:text-5xl lg:text-6xl'} font-black text-white tracking-tight font-mono flex items-center justify-center whitespace-nowrap`}>
                  <span className="text-yellow-400 mr-1.5 font-sans">√</span>
                  <span className="border-t-4 border-yellow-300/80 pt-1 px-1.5">
                    {question.a.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => pronounceQuestion()}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                    isSpeakingQuestion
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-yellow-500/30 animate-pulse'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/10'
                  }`}
                  title={isVi ? `Đọc câu hỏi - Tốc độ: ${questionSpeed}x` : `Pronounce question - Speed: ${questionSpeed}x`}
                >
                  <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Playback speed selector */}
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
                    >
                      {`${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {feedback !== 'idle' && (
              <div className="mt-3 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                <span className="font-bold text-yellow-400 mr-1.5">{tr("Gợi ý:")}</span>
                {isVi ? question.hintVi : question.hintEn}
              </div>
            )}

            {feedback === 'correct' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${question.answer.toLocaleString()}`
                    : `Correct: ${question.answer.toLocaleString()}`}
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
                    ? `Chưa chính xác: ${question.answer.toLocaleString()}`
                    : `Incorrect: ${question.answer.toLocaleString()}`}
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
              {userAnswer && feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
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
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
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
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
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
                    {tr("Hướng dẫn:")} {isVi ? meta.titleVi : meta.titleEn}
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
                  {isVi ? meta.subtitleVi : meta.subtitleEn}
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
