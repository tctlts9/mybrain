/**
 * ============================================================================
 * FILE: MultiplyWith1DigitDifficultyChallengePage.tsx — TRANG THỬ THÁCH CẤP ĐỘ KHÓ NHÂN VỚI 1 CHỮ SỐ
 * ============================================================================
 * Công việc của file:
 * 1. Tích hợp cấu hình & Modal tùy chỉnh thời gian tự động chuyển câu (Auto-Next, PHẦN A & B).
 * 2. Định nghĩa 19 chuyên đề nhân với 1 chữ số (Tổng quát, 2–10 chữ số, Nhân với 2..9) và chế độ Tùy chọn BigInt.
 * 3. Vận hành thử thách 10 câu theo cơ chế 2 giai đoạn: Quan sát đề (timeLimit) -> Ẩn đề & Trả lời (answerTimeLimit).
 * 4. Hỗ trợ đọc đề TTS tốc độ 1.25x/1.5x/1.75x, nhận diện giọng nói và bàn phím số ảo 0-9.
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
  AlertTriangle,
  Gauge,
  Delete,
  EyeOff,
  SlidersHorizontal,
  Clock,
  TimerReset,
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
  pronounceQuestionFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/MentalMathVoice';
import {
  SEQUENCE_DIGIT_PROFILE_OPTIONS,
  type SequenceDigitProfile,
  getSequenceDigitBounds,
  resolveSequenceDigitLengths,
} from '../../utils/sequenceDigitProfiles';

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
  | 'mul9'
  | 'custom';

type Multiply1DigitDifficultyTopic = Multiply1DigitTopic | 'sequence';

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

// Danh sách chuyên đề thử thách nhân với 1 chữ số (Tổng quát, 2–10 chữ số, Nhân 2..9, Tùy chọn)
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
    labelVi: `Nhân với  ${m}`,
    labelEn: `Multiply by ${m}`,
    fullNameVi: `Nhân với  ${m} (2 - 10 chữ số × ${m})`,
    fullNameEn: `Multiply 2 - 10 Digits by ${m}`,
    icon: '✖️',
    badgeVi: `Nhân với số ${m}`,
    badgeEn: `Multiply by ${m}`,
  })),
  {
    id: 'custom',
    digits: 0,
    labelVi: 'Tùy chọn',
    labelEn: 'Custom',
    fullNameVi: 'Tùy chọn độ dài chữ số & số nhân',
    fullNameEn: 'Custom digit length & multiplier',
    icon: '🎛️',
    badgeVi: 'Tùy chọn',
    badgeEn: 'Custom',
  },
];

interface MultiplyWith1DigitDifficultyChallengePageProps {
  onBack: () => void;
  initialTopic?: Multiply1DigitTopic;
}

interface Question {
  a: string;
  b: string;
  answer: string;
  numbers?: string[];
  operations?: ('×' | '÷')[];
}

type SequenceDisplayMode = 'flash' | 'all';

type TimeLimit = number;
type AnswerTimeLimit = number;
type GameStatus = 'idle' | 'running' | 'paused' | 'answered' | 'completed';
type ChallengePhase = 'idle' | 'observing' | 'answering';
type CustomMultiplierMode = 'exact' | 'digits';

const TOTAL_QUESTIONS = 10;
const MIN_CUSTOM_DIGITS = 1;
const MAX_CUSTOM_DIGITS = 100;
const MIN_CUSTOM_MULTIPLIER = 1;
const MAX_CUSTOM_MULTIPLIER = 999999999;
const MIN_SEQUENCE_COUNT = 2;
const MAX_SEQUENCE_COUNT = 100;

const randMulSeqInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const findExactDivisorsForMulSeq = (
  val: bigint,
  minD: number,
  maxD: number,
  avoidVal?: string
): number[] => {
  if (val < BigInt(minD)) return [];
  const capD = val < BigInt(maxD) ? Number(val) : maxD;
  if (capD < minD) return [];
  const span = capD - minD + 1;
  const startOffset = randMulSeqInt(0, span - 1);
  const maxSteps = Math.min(span, 120000);
  const found: number[] = [];
  for (let k = 0; k < maxSteps && found.length < 24; k++) {
    const d = minD + ((startOffset + k) % span);
    if (avoidVal && String(d) === avoidVal) continue;
    if (val % BigInt(d) === 0n) {
      found.push(d);
    }
  }
  if (found.length === 0 && avoidVal) {
    const avoidNum = Number(avoidVal);
    if (avoidNum >= minD && avoidNum <= capD && val % BigInt(avoidNum) === 0n) {
      found.push(avoidNum);
    }
  }
  return found;
};

function generateMultiplicationSequenceQuestion(
  rawCount: number,
  profile: SequenceDigitProfile,
  includeDivision: boolean = false
): Question {
  const count = Math.min(MAX_SEQUENCE_COUNT, Math.max(MIN_SEQUENCE_COUNT, rawCount));
  const digitLengths = resolveSequenceDigitLengths(count, profile, includeDivision);

  if (includeDivision && count === 2) {
    const [firstMin, firstMax] = getSequenceDigitBounds(digitLengths[0]);
    const [secondMin, secondMax] = getSequenceDigitBounds(digitLengths[1]);
    if (firstMax >= secondMin * 2 && Math.random() < 0.6) {
      const maxQ = Math.floor(firstMax / secondMin);
      const qVal = randMulSeqInt(2, Math.max(2, maxQ));
      const dMax = Math.min(secondMax, Math.floor(firstMax / qVal));
      const dMin = Math.max(secondMin, Math.ceil(firstMin / qVal));
      if (dMax >= dMin) {
        const dVal = randMulSeqInt(dMin, dMax);
        const a0 = qVal * dVal;
        return {
          a: String(a0),
          b: String(dVal),
          numbers: [String(a0), String(dVal)],
          operations: ['×', '÷'],
          answer: String(qVal),
        };
      }
    }
  }

  const numbers: string[] = [];
  const operations: ('×' | '÷')[] = [];
  let runningVal = 1n;
  let divCount = 0;
  let mulAfterFirstCount = 0;

  for (let i = 0; i < count; i++) {
    const [minVal, maxVal] = getSequenceDigitBounds(digitLengths[i]);
    if (i === 0) {
      const firstNum = randMulSeqInt(minVal, maxVal);
      numbers.push(String(firstNum));
      operations.push('×');
      runningVal = BigInt(firstNum);
      continue;
    }

    const candidates = includeDivision
      ? findExactDivisorsForMulSeq(runningVal, minVal, maxVal, numbers[i - 1])
      : [];
    const canDivide = includeDivision && candidates.length > 0;

    let op: '×' | '÷' = '×';
    if (canDivide) {
      const mustDiv = divCount === 0 && i >= count - 2;
      const shouldMul =
        count >= 3 && i === count - 1 && mulAfterFirstCount === 0 && divCount > 0;
      if (mustDiv) {
        op = '÷';
      } else if (shouldMul) {
        op = '×';
      } else {
        const digitCountNow = runningVal.toString().length;
        const divProb = digitCountNow >= 10 ? 0.68 : 0.42;
        op = Math.random() < divProb ? '÷' : '×';
      }
    }

    if (op === '÷') {
      const chosen = candidates[randMulSeqInt(0, candidates.length - 1)];
      numbers.push(String(chosen));
      operations.push('÷');
      runningVal = runningVal / BigInt(chosen);
      divCount++;
    } else {
      let chosen = randMulSeqInt(minVal, maxVal);
      if (maxVal > minVal) {
        for (let attempt = 0; attempt < 5 && String(chosen) === numbers[i - 1]; attempt++) {
          chosen = randMulSeqInt(minVal, maxVal);
        }
      }
      numbers.push(String(chosen));
      operations.push('×');
      runningVal = runningVal * BigInt(chosen);
      mulAfterFirstCount++;
    }
  }

  return {
    a: numbers[0] ?? '0',
    b: numbers[1] ?? '0',
    numbers,
    operations,
    answer: runningVal.toString(),
  };
}

// Các hàm tiện ích định dạng số lớn BigInt, chuẩn hóa đáp án và sinh số ngẫu nhiên
const formatBigIntStr = (val: string | number): string =>
  String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const normalizeAnswerInput = (val: string): string =>
  val
    .trim()
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '');

const computeExactProduct = (a: string | number, b: string | number): string =>
  (BigInt(a) * BigInt(b)).toString();

const buildRandomDigitString = (digits: number, activeHard: boolean): string => {
  if (activeHard) {
    let s = String(Math.floor(Math.random() * 7) + 3); // 3..9
    for (let i = 1; i < digits; i++) {
      s += String(Math.floor(Math.random() * 8) + 2); // 2..9 (avoid trivial 0/1)
    }
    return s;
  }
  if (digits === 1) {
    return String(Math.floor(Math.random() * 8) + 2);
  }
  if (digits === 2) {
    return String(Math.floor(Math.random() * 88) + 12);
  }
  let s = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < digits; i++) {
    s += String(Math.floor(Math.random() * 10));
  }
  return s;
};

const splitFormattedIntoBalancedLines = (numStr: string, maxGroupsPerLine = 5): string[] => {
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

interface RoundHistoryItem {
  qIndex: number;
  a: string;
  b: string;
  label?: string;
  answer?: string;
  userAnswer: string;
  isCorrect: boolean;
}

const getSpelledOutDigits = (num: string | number, isVietnamese: boolean): string => {
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
// PHẦN C: COMPONENT CHÍNH TRANG THỬ THÁCH CẤP ĐỘ KHÓ NHÂN VỚI 1 CHỮ SỐ (10 CÂU)
// ============================================================================
export const MultiplyWith1DigitDifficultyChallengePage: React.FC<MultiplyWith1DigitDifficultyChallengePageProps> = ({
  onBack,
  initialTopic,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const autoNextConfig = useMentalMathAutoNextConfig('MultiplyWith1DigitDifficultyChallengePage');
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState(false);
  const showAutoNextButton = isAutoNextButtonVisible('MultiplyWith1DigitDifficultyChallengePage');

  const hardMode = true;

  // Topic selection: Tổng quát (General), 2-10 chữ số, Nhân 2..9, Tùy chọn hoặc Dãy số
  const [selectedTopic, setSelectedTopic] = useState<Multiply1DigitDifficultyTopic>(initialTopic ?? 'general');
  const [customDigits, setCustomDigits] = useState<number>(3);
  const [customMultiplierMode, setCustomMultiplierMode] = useState<CustomMultiplierMode>('exact');
  const [customMultiplier, setCustomMultiplier] = useState<number>(7);
  const [customMultiplierDigits, setCustomMultiplierDigits] = useState<number>(2);
  const [customDigitsDraft, setCustomDigitsDraft] = useState<string>('3');
  const [customMultiplierDraft, setCustomMultiplierDraft] = useState<string>('7');
  const [customMultiplierDigitsDraft, setCustomMultiplierDigitsDraft] = useState<string>('2');
  const [sequenceCount, setSequenceCount] = useState<number>(5);
  const [sequenceDigitProfile, setSequenceDigitProfile] = useState<SequenceDigitProfile>('3D');
  const [sequenceDisplayMode, setSequenceDisplayMode] = useState<SequenceDisplayMode>('flash');
  const [sequenceIncludeDivision, setSequenceIncludeDivision] = useState<boolean>(false);
  const [flashIndex, setFlashIndex] = useState<number>(0);
  const [sequenceCountDraft, setSequenceCountDraft] = useState<string>('5');

  useEffect(() => {
    setSequenceCountDraft(String(sequenceCount));
  }, [sequenceCount]);

  // Config: Quan sát (Limit) & Trả lời (Answer) - mặc định 10s, 10s
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
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');

  // 10 Phép nhân trong 1 lượt thử thách
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Math Problem
  const [question, setQuestion] = useState<Question>({ a: '74', b: '6', answer: '444' });
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
  const answerTimeLimitRef = useRef<AnswerTimeLimit>(answerTimeLimit);
  answerTimeLimitRef.current = answerTimeLimit;
  const challengePhaseRef = useRef<ChallengePhase>(challengePhase);
  challengePhaseRef.current = challengePhase;

  const customDigitsRef = useRef<number>(customDigits);
  customDigitsRef.current = customDigits;
  const customMultiplierModeRef = useRef<CustomMultiplierMode>(customMultiplierMode);
  customMultiplierModeRef.current = customMultiplierMode;
  const customMultiplierRef = useRef<number>(customMultiplier);
  customMultiplierRef.current = customMultiplier;
  const customMultiplierDigitsRef = useRef<number>(customMultiplierDigits);
  customMultiplierDigitsRef.current = customMultiplierDigits;
  const isEditingCustomDigitsRef = useRef<boolean>(false);
  const isEditingCustomMultiplierRef = useRef<boolean>(false);
  const isEditingCustomMultiplierDigitsRef = useRef<boolean>(false);
  const selectedTopicRef = useRef<Multiply1DigitDifficultyTopic>(selectedTopic);
  selectedTopicRef.current = selectedTopic;
  const sequenceCountRef = useRef<number>(sequenceCount);
  sequenceCountRef.current = sequenceCount;
  const sequenceDigitProfileRef = useRef<SequenceDigitProfile>(sequenceDigitProfile);
  sequenceDigitProfileRef.current = sequenceDigitProfile;
  const sequenceDisplayModeRef = useRef<SequenceDisplayMode>(sequenceDisplayMode);
  sequenceDisplayModeRef.current = sequenceDisplayMode;
  const sequenceIncludeDivisionRef = useRef<boolean>(sequenceIncludeDivision);
  sequenceIncludeDivisionRef.current = sequenceIncludeDivision;

  // Sinh phép nhân ngẫu nhiên dựa theo chuyên đề, cấu hình BigInt tùy chọn hoặc Dãy số
  const generateProblemForTopic = useCallback(
    (
      topicToUse?: Multiply1DigitDifficultyTopic,
      hardOverride?: boolean,
      customDigitsOverride?: number,
      customMultiplierOverride?: number,
      customMultiplierModeOverride?: CustomMultiplierMode,
      customMultiplierDigitsOverride?: number,
      seqCountOverride?: number,
      seqProfileOverride?: SequenceDigitProfile,
      seqIncludeDivOverride?: boolean
    ): Question => {
      const active = topicToUse ?? selectedTopic;
      const activeHard = hardOverride ?? hardMode;
      if (active === 'sequence') {
        return generateMultiplicationSequenceQuestion(
          seqCountOverride ?? sequenceCountRef.current,
          seqProfileOverride ?? sequenceDigitProfileRef.current,
          seqIncludeDivOverride ?? sequenceIncludeDivisionRef.current
        );
      }
      const isCustom = active === 'custom';
      const isGeneral = active === 'general';
      const multiplierMatch = active.match(/^mul([2-9])$/);
      const fixedMultiplier = multiplierMatch ? Number(multiplierMatch[1]) : null;

      let digits = 2;
      if (isCustom) {
        digits = Math.min(
          MAX_CUSTOM_DIGITS,
          Math.max(MIN_CUSTOM_DIGITS, customDigitsOverride ?? customDigitsRef.current)
        );
      } else if (isGeneral || fixedMultiplier !== null) {
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

      const multiDigitStr = buildRandomDigitString(digits, activeHard);

      if (isCustom) {
        const modeToUse = customMultiplierModeOverride ?? customMultiplierModeRef.current;
        const multStr =
          modeToUse === 'digits'
            ? buildRandomDigitString(
                Math.min(
                  MAX_CUSTOM_DIGITS,
                  Math.max(
                    MIN_CUSTOM_DIGITS,
                    customMultiplierDigitsOverride ?? customMultiplierDigitsRef.current
                  )
                ),
                activeHard
              )
            : String(
                Math.min(
                  MAX_CUSTOM_MULTIPLIER,
                  Math.max(MIN_CUSTOM_MULTIPLIER, customMultiplierOverride ?? customMultiplierRef.current)
                )
              );
        return {
          a: multiDigitStr,
          b: multStr,
          answer: computeExactProduct(multiDigitStr, multStr),
        };
      }

      // Fixed multiplier if mul2..mul9 selected, else Hard: 6..9 / Normal: 2..9
      const singleDigit =
        fixedMultiplier ??
        (activeHard ? Math.floor(Math.random() * 4) + 6 : Math.floor(Math.random() * 8) + 2);

      let a = multiDigitStr;
      let b = String(singleDigit);
      if (isGeneral || Math.random() < 0.35) {
        const isSingleDigitFirst = Math.random() < 0.5;
        if (isSingleDigitFirst) {
          a = String(singleDigit);
          b = multiDigitStr;
        } else {
          a = multiDigitStr;
          b = String(singleDigit);
        }
      }

      return {
        a,
        b,
        answer: computeExactProduct(a, b),
      };
    },
    [selectedTopic, hardMode]
  );

  // Announce result
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

  const formatQuestionLabel = (q: Question): string => {
    if (q.numbers && q.numbers.length > 0) {
      const fmtList = (limit?: number) => {
        const list = limit !== undefined ? q.numbers!.slice(0, limit) : q.numbers!;
        return list
          .map((n, idx) => (idx === 0 ? formatBigIntStr(n) : `${q.operations?.[idx] ?? '×'} ${formatBigIntStr(n)}`))
          .join(' ');
      };
      return q.numbers.length > 4 ? `${fmtList(4)} ... (${q.numbers.length} số)` : fmtList();
    }
    return `${formatBigIntStr(q.a)} × ${formatBigIntStr(q.b)}`;
  };

  // Pronounce Question
  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const qCur = questionRef.current;
      const speedToUse = overrideSpeed ?? questionSpeed;
      if (qCur.numbers && qCur.numbers.length > 0) {
        const text = qCur.numbers
          .map((n, idx) => {
            if (idx === 0) return n;
            const op = qCur.operations?.[idx] ?? '×';
            const opWord = op === '÷' ? (isVi ? 'chia' : 'divided by') : isVi ? 'nhân' : 'times';
            return `${opWord} ${n}`;
          })
          .join(' ');
        setIsSpeakingQuestion(true);
        speakText(
          text,
          isVi ? 'vi' : 'en',
          () => setIsSpeakingQuestion(false),
          Math.min(1.5, speedToUse * 0.85)
        );
        return;
      }
      setIsSpeakingQuestion(true);
      pronounceQuestionFemaleVoice(
        Number(question.a),
        Number(question.b),
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
        label: formatQuestionLabel(questionRef.current),
        answer: questionRef.current.answer,
        userAnswer: tr("Hết giờ [2 từ]"),
        isCorrect: false,
      },
    ]);

    announceResult(false, questionRef.current.answer);
  }, [announceResult, currentQuestionIndex, isVi, stopListening]);

  // Kiểm tra đáp án người dùng nhập và cập nhật điểm, chuỗi đúng/sai, lịch sử 10 câu
  const verifyAnswer = useCallback(
    (rawInput: string | number) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopListening();

      const normalizedInput = normalizeAnswerInput(String(rawInput));
      const isCorrect = normalizedInput !== '' && normalizedInput === questionRef.current.answer;
      setGameStatus('answered');
      setTotalAttempts((prev) => prev + 1);

      setRoundHistory((prev) => [
        ...prev,
        {
          qIndex: currentQuestionIndex,
          a: questionRef.current.a,
          b: questionRef.current.b,
          label: formatQuestionLabel(questionRef.current),
          answer: questionRef.current.answer,
          userAnswer: normalizedInput || String(rawInput),
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
        const earnedPoints = Math.max(10, (14 - timeLimit) * 5);
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
        verifyAnswer(String(parsedNum));
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

  // Chuyển từ pha Quan sát sang pha Ẩn đề & Trả lời (Answer Time Limit)
  const beginAnsweringPhase = useCallback(
    (explicitAnswerLimit?: AnswerTimeLimit) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const activeAnswerLimit = explicitAnswerLimit ?? answerTimeLimitRef.current;
      setChallengePhase('answering');
      challengePhaseRef.current = 'answering';
      setTimeLeft(activeAnswerLimit);

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

      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [handleTimeout]
  );

  // Bắt đầu đếm ngược 2 pha cho mỗi câu hỏi (Quan sát, hỗ trợ Flash từng số -> Trả lời)
  const startTimer = useCallback(
    (
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit,
      qOverride?: Question,
      topicOverride?: Multiply1DigitDifficultyTopic
    ) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const activeLimit = limitOverride ?? timeLimit;
      setChallengePhase('observing');
      challengePhaseRef.current = 'observing';
      setTimeLeft(activeLimit);
      setFlashIndex(0);

      const startTime = Date.now();
      const totalDurationMs = activeLimit * 1000;
      const endTime = startTime + totalDurationMs;
      const activeTopic = topicOverride ?? selectedTopicRef.current;
      const seqNumbers = (qOverride ?? questionRef.current).numbers;
      const shouldFlashSeq =
        activeTopic === 'sequence' &&
        Boolean(seqNumbers && seqNumbers.length > 0) &&
        sequenceDisplayModeRef.current === 'flash';

      timerIntervalRef.current = setInterval(() => {
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
          clearInterval(timerIntervalRef.current);
          beginAnsweringPhase(answerLimitOverride);
        }
      }, 50);
    },
    [beginAnsweringPhase, timeLimit]
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
      setChallengePhase('idle');
      challengePhaseRef.current = 'idle';
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    const newQ = generateProblemForTopic(selectedTopic);
    setQuestion(newQ);
    questionRef.current = newQ;
    setFlashIndex(0);
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setGameStatus('running');
    startTimer(undefined, undefined, newQ, selectedTopic);
  }, [
    currentQuestionIndex,
    generateProblemForTopic,
    selectedTopic,
    startTimer,
    stopListening,
  ]);

  // Tự động chuyển câu hỏi theo thời gian cấu hình khi có kết quả (chính xác / chưa chính xác / hết giờ)
  useEffect(() => {
    if (gameStatus === 'answered' && autoNextConfig.delaySec > 0) {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = setTimeout(() => {
        goToNextQuestion();
      }, Math.round(autoNextConfig.delaySec * 1000));
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

  // Bắt đầu lượt thử thách 10 câu mới và đặt lại toàn bộ điểm số / chuỗi
  const startNewChallenge = useCallback(
    (
      topicOverride?: Multiply1DigitDifficultyTopic,
      hardOverride?: boolean,
      limitOverride?: TimeLimit,
      answerLimitOverride?: AnswerTimeLimit,
      customDigitsOverride?: number,
      customMultiplierOverride?: number,
      customMultiplierModeOverride?: CustomMultiplierMode,
      customMultiplierDigitsOverride?: number
    ) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      stopCurrentSpeech();
      stopListening();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const topicToUse = topicOverride ?? selectedTopic;
      setSelectedTopic(topicToUse);
      selectedTopicRef.current = topicToUse;
      setCurrentQuestionIndex(1);
      setRoundHistory([]);
      setScore(0);
      setStreak(0);
      setWrongStreak(0);
      setBestStreak(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setIncorrectCount(0);

      const newQ = generateProblemForTopic(
        topicToUse,
        hardOverride,
        customDigitsOverride,
        customMultiplierOverride,
        customMultiplierModeOverride,
        customMultiplierDigitsOverride
      );
      setQuestion(newQ);
      questionRef.current = newQ;
      setFlashIndex(0);
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      setGameStatus('running');
      startTimer(limitOverride, answerLimitOverride, newQ, topicToUse);
    },
    [generateProblemForTopic, selectedTopic, startTimer, stopListening]
  );

  // Đặt lại phiên thử thách về trạng thái chờ (ẩn đề cho tới khi bấm Bắt đầu)
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
    const newQ = generateProblemForTopic(
      selectedTopic,
      undefined,
      customDigitsRef.current,
      customMultiplierRef.current,
      customMultiplierModeRef.current,
      customMultiplierDigitsRef.current
    );
    setQuestion(newQ);
    questionRef.current = newQ;
    setFlashIndex(0);
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
    setTimeLeft(timeLimit);
    setGameStatus('idle');
  }, [generateProblemForTopic, selectedTopic, stopListening, timeLimit]);

  // Switch topic
  const handleSelectTopic = (newTopic: Multiply1DigitDifficultyTopic) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setSelectedTopic(newTopic);
    selectedTopicRef.current = newTopic;
    setFlashIndex(0);
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNewChallenge(newTopic);
    } else {
      const newQ = generateProblemForTopic(newTopic);
      setQuestion(newQ);
      questionRef.current = newQ;
    }
  };

  // Custom Digits Textbox handlers
  const handleCustomDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setCustomDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
        setCustomDigits(clamped);
        customDigitsRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            clamped,
            customMultiplierRef.current,
            customMultiplierModeRef.current,
            customMultiplierDigitsRef.current
          );
        }
      }
    }
  };

  const commitCustomDigits = () => {
    isEditingCustomDigitsRef.current = false;
    const parsed = parseInt(customDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      const fallback = customDigitsRef.current >= MIN_CUSTOM_DIGITS ? customDigitsRef.current : 3;
      setCustomDigitsDraft(String(fallback));
      setCustomDigits(fallback);
      customDigitsRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setCustomDigitsDraft(String(clamped));
    if (clamped !== customDigitsRef.current) {
      setCustomDigits(clamped);
      customDigitsRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          clamped,
          customMultiplierRef.current,
          customMultiplierModeRef.current,
          customMultiplierDigitsRef.current
        );
      }
    }
  };

  // Switch Custom Multiplier Mode (Exact number vs Digit length)
  const handleCustomMultiplierModeChange = (mode: CustomMultiplierMode) => {
    setCustomMultiplierMode(mode);
    customMultiplierModeRef.current = mode;
    if (selectedTopic !== 'custom') {
      setSelectedTopic('custom');
    }
    if (gameStatus === 'running' || gameStatus === 'answered') {
      startNewChallenge(
        'custom',
        undefined,
        undefined,
        undefined,
        customDigitsRef.current,
        customMultiplierRef.current,
        mode,
        customMultiplierDigitsRef.current
      );
    }
  };

  // Custom Multiplier Exact Number Textbox handlers
  const handleCustomMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 9);
    setCustomMultiplierDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_MULTIPLIER) {
        const clamped = Math.min(MAX_CUSTOM_MULTIPLIER, Math.max(MIN_CUSTOM_MULTIPLIER, parsed));
        setCustomMultiplier(clamped);
        customMultiplierRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            customDigitsRef.current,
            clamped,
            'exact',
            customMultiplierDigitsRef.current
          );
        }
      }
    }
  };

  const commitCustomMultiplier = () => {
    isEditingCustomMultiplierRef.current = false;
    const parsed = parseInt(customMultiplierDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_MULTIPLIER) {
      const fallback = customMultiplierRef.current >= MIN_CUSTOM_MULTIPLIER ? customMultiplierRef.current : 7;
      setCustomMultiplierDraft(String(fallback));
      setCustomMultiplier(fallback);
      customMultiplierRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_MULTIPLIER, Math.max(MIN_CUSTOM_MULTIPLIER, parsed));
    setCustomMultiplierDraft(String(clamped));
    if (clamped !== customMultiplierRef.current) {
      setCustomMultiplier(clamped);
      customMultiplierRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          customDigitsRef.current,
          clamped,
          'exact',
          customMultiplierDigitsRef.current
        );
      }
    }
  };

  // Custom Multiplier Digit Length Textbox handlers
  const handleCustomMultiplierDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setCustomMultiplierDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
        setCustomMultiplierDigits(clamped);
        customMultiplierDigitsRef.current = clamped;
        if (gameStatus === 'running' || gameStatus === 'answered') {
          startNewChallenge(
            'custom',
            undefined,
            undefined,
            undefined,
            customDigitsRef.current,
            customMultiplierRef.current,
            'digits',
            clamped
          );
        }
      }
    }
  };

  const commitCustomMultiplierDigits = () => {
    isEditingCustomMultiplierDigitsRef.current = false;
    const parsed = parseInt(customMultiplierDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      const fallback = customMultiplierDigitsRef.current >= MIN_CUSTOM_DIGITS ? customMultiplierDigitsRef.current : 2;
      setCustomMultiplierDigitsDraft(String(fallback));
      setCustomMultiplierDigits(fallback);
      customMultiplierDigitsRef.current = fallback;
      return;
    }
    const clamped = Math.min(MAX_CUSTOM_DIGITS, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setCustomMultiplierDigitsDraft(String(clamped));
    if (clamped !== customMultiplierDigitsRef.current) {
      setCustomMultiplierDigits(clamped);
      customMultiplierDigitsRef.current = clamped;
      if (gameStatus === 'running' || gameStatus === 'answered') {
        startNewChallenge(
          'custom',
          undefined,
          undefined,
          undefined,
          customDigitsRef.current,
          customMultiplierRef.current,
          'digits',
          clamped
        );
      }
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
      startTimer(limit);
    }
  };

  // Switch Answer Time Limit
  const handleSelectAnswerTimeLimit = (limit: AnswerTimeLimit) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAnswerTimeLimit(limit);
    answerTimeLimitRef.current = limit;
    if (gameStatus === 'running' && challengePhaseRef.current === 'answering') {
      beginAnsweringPhase(limit);
    }
  };

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
    const newQ = generateProblemForTopic(
      topicToUse,
      undefined,
      customDigitsRef.current,
      customMultiplierRef.current
    );
    setQuestion(newQ);
    questionRef.current = newQ;
    setUserAnswer('');
    setFeedback('idle');
    setVoiceTranscript('');
    setVoiceError('');
    setChallengePhase('idle');
    challengePhaseRef.current = 'idle';
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

  // Virtual Keypad handlers (up to 24 digits for large custom products)
  const canAnswer = gameStatus === 'running' && challengePhase === 'answering';

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (!canAnswer) return;
      if (feedback === 'incorrect') {
        setFeedback('idle');
      }
      setUserAnswer((prev) => {
        if (prev.length >= 500) return prev;
        return prev + digit;
      });
    },
    [feedback, canAnswer]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (!canAnswer) return;
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [canAnswer]);

  const handleKeypadClear = useCallback(() => {
    if (!canAnswer) return;
    setUserAnswer('');
    inputRef.current?.focus();
  }, [canAnswer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAnswer) return;
    const normalized = normalizeAnswerInput(userAnswer);
    if (!normalized) return;
    verifyAnswer(normalized);
  };

  const currentTopicMeta =
    MULTIPLY_1_DIGIT_TOPICS.find((m) => m.id === selectedTopic) || MULTIPLY_1_DIGIT_TOPICS[0];

  const dynamicTopicFullName =
    selectedTopic === 'custom'
      ? customMultiplierMode === 'digits'
        ? isVi
          ? `Tùy chọn: ${customDigits} chữ số × ${customMultiplierDigits} chữ số`
          : `Custom: ${customDigits}-Digit × ${customMultiplierDigits}-Digit`
        : isVi
        ? `Tùy chọn: ${customDigits} chữ số × ${formatBigIntStr(customMultiplier)}`
        : `Custom: ${customDigits}-Digit × ${formatBigIntStr(customMultiplier)}`
      : selectedTopic === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} số (${sequenceDigitProfile}${sequenceIncludeDivision ? ', ×/÷' : ', ×'})`
        : `${sequenceCount}-Number Sequence (${sequenceDigitProfile}${sequenceIncludeDivision ? ', ×/÷' : ', ×'})`
      : isVi
      ? currentTopicMeta.fullNameVi
      : currentTopicMeta.fullNameEn;

  const dynamicTopicBadge =
    selectedTopic === 'custom'
      ? customMultiplierMode === 'digits'
        ? isVi
          ? `${customDigits} chữ số × ${customMultiplierDigits} chữ số`
          : `${customDigits}-Digit × ${customMultiplierDigits}-Digit`
        : isVi
        ? `${customDigits} chữ số × ${formatBigIntStr(customMultiplier)}`
        : `${customDigits}-Digit × ${formatBigIntStr(customMultiplier)}`
      : selectedTopic === 'sequence'
      ? isVi
        ? `Dãy ${sequenceCount} số · ${sequenceDigitProfile}${sequenceIncludeDivision ? ' · ×/÷' : ' · ×'}`
        : `${sequenceCount}-Num Seq · ${sequenceDigitProfile}${sequenceIncludeDivision ? ' · ×/÷' : ' · ×'}`
      : isVi
      ? currentTopicMeta.badgeVi
      : currentTopicMeta.badgeEn;

  const isCustomLayout = selectedTopic === 'custom' || selectedTopic === 'sequence';
  const formattedA = formatBigIntStr(question.a);
  const formattedB = formatBigIntStr(question.b);
  const totalFormulaDigits = question.a.length + question.b.length;
  const maxDigits = Math.max(question.a.length, question.b.length);
  const totalFormattedLen = formattedA.length + formattedB.length + 3;
  const useStackedFormula = isCustomLayout ? totalFormattedLen > 64 : totalFormulaDigits >= 14;
  const multiplicandLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.a, isCustomLayout ? 10 : 5)
    : [formattedA];
  const multiplierLines = useStackedFormula
    ? splitFormattedIntoBalancedLines(question.b, isCustomLayout ? 10 : 5)
    : [formattedB];
  const formulaFontSize = isCustomLayout
    ? totalFormattedLen > 64
      ? 'text-xs sm:text-base md:text-lg lg:text-xl'
      : totalFormattedLen > 48
      ? 'text-xs sm:text-sm md:text-base lg:text-xl'
      : totalFormattedLen > 35
      ? 'text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl'
      : totalFormattedLen > 22
      ? 'text-base sm:text-xl md:text-2xl lg:text-3xl'
      : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl'
    : question.a.length >= 61
    ? 'text-sm sm:text-base md:text-lg'
    : question.a.length >= 31
    ? 'text-sm sm:text-lg md:text-xl'
    : totalFormulaDigits >= 14 || maxDigits >= 11
    ? 'text-base sm:text-xl md:text-2xl'
    : maxDigits >= 9
    ? 'text-lg sm:text-2xl md:text-3xl'
    : maxDigits >= 6
    ? 'text-xl sm:text-3xl md:text-4xl'
    : maxDigits >= 4
    ? 'text-2xl sm:text-4xl md:text-5xl'
    : 'text-3xl sm:text-5xl md:text-6xl';

  const activePhaseDuration = challengePhase === 'answering' ? answerTimeLimit : timeLimit;
  const timerColor =
    timeLeft <= (activePhaseDuration <= 4 ? 1 : activePhaseDuration <= 12 ? 3 : 5)
      ? 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse'
      : challengePhase === 'answering'
      ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
      : timeLeft <= (timeLimit <= 4 ? 2 : timeLimit <= 8 ? 4 : 5)
      ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Thanh điều hướng trên cùng: Nút quay lại & nút Bật/Tắt loa */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại Luyện tập")}</span>
        </button>

        <div className="flex items-center gap-2">
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
            <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{tr("Thử Thách Cấp Độ Khó")}</span>
          </span>
          </div>
        </div>
      </div>

      {/* Khung chính chứa giao diện Thử Thách Cấp Độ Khó */}
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

        {/* Tiêu đề trang & Bộ cài đặt thời gian Quan sát / Trả lời + nút Đổi câu */}
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
                <span>{tr("Thử Thách Cấp Độ Khó")}</span>
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
                    disabled={gameStatus === 'running'}
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
                          handleSelectTimeLimit(clamped);
                          if (gameStatus === 'idle') setTimeLeft(clamped);
                        }
                      }
                    }}
                    onBlur={() => {
                      isEditingLimitRef.current = false;
                      const parsed = parseInt(limitDraft, 10);
                      const resolved =
                        Number.isNaN(parsed) || parsed < 1
                          ? Math.min(999, Math.max(1, timeLimit >= 1 ? Math.round(timeLimit) : 10))
                          : Math.min(999, Math.max(1, Math.round(parsed)));
                      setLimitDraft(String(resolved));
                      handleSelectTimeLimit(resolved);
                      if (gameStatus === 'idle') setTimeLeft(resolved);
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
                    disabled={gameStatus === 'running'}
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
                          handleSelectAnswerTimeLimit(Math.min(999, Math.max(1, Math.round(parsed))));
                        }
                      }
                    }}
                    onBlur={() => {
                      isEditingAnswerRef.current = false;
                      const parsed = parseInt(answerDraft, 10);
                      const resolved =
                        Number.isNaN(parsed) || parsed < 1
                          ? Math.min(999, Math.max(1, answerTimeLimit >= 1 ? Math.round(answerTimeLimit) : 10))
                          : Math.min(999, Math.max(1, Math.round(parsed)));
                      setAnswerDraft(String(resolved));
                      handleSelectAnswerTimeLimit(resolved);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    aria-label={tr("Thời gian trả lời (giây)")}
                    title={tr("Nhập số giây trả lời (mặc định 10s)")}
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
                  initialPageKey={"MultiplyWith1DigitDifficultyChallengePage"}
                />
              </>
            )}
          </div>
        </div>

        {/* Nhóm nút chọn chuyên đề thử thách & cấu hình Tùy chọn BigInt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 gap-2 flex-wrap">
            <span>{tr("Chọn chuyên đề thử thách:")}</span>
            <span className="text-yellow-400/90 text-[11px]">{dynamicTopicFullName}</span>
          </div>

          <div className="p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
              {MULTIPLY_1_DIGIT_TOPICS.filter((m) => !m.multiplier && m.id !== 'custom').map((mode) => {
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

            {/* Row 3: Custom Topic Selection + 2 Textboxes (Độ dài Chữ số & Nhân với số tùy chọn) */}
            <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectTopic('custom')}
                title={
                  tr("Tùy chọn độ dài chữ số và nhân với số tùy ý")
                }
                className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  selectedTopic === 'custom'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <SlidersHorizontal
                  className={`w-3.5 h-3.5 shrink-0 ${
                    selectedTopic === 'custom' ? 'text-slate-950' : 'text-yellow-400'
                  }`}
                />
                <span className="whitespace-nowrap">
                  {tr("Tùy chọn (Chữ số & Số nhân)")}
                </span>
              </button>

              {selectedTopic === 'custom' && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                  {/* Textbox 1: Độ dài Chữ số */}
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                    <label
                      htmlFor="custom-digit-length"
                      className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                    >
                      {tr("Độ dài Chữ số:")}
                    </label>
                    <input
                      id="custom-digit-length"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={customDigitsDraft}
                      onFocus={(e) => {
                        isEditingCustomDigitsRef.current = true;
                        e.target.select();
                      }}
                      onChange={handleCustomDigitsChange}
                      onBlur={commitCustomDigits}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      aria-label={tr("Độ dài chữ số (1 - 100)")}
                      title={tr("Nhập độ dài chữ số (từ 1 đến 100)")}
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors"
                    />
                  </div>

                  {/* Textbox 2: Nhân với số tùy chọn (2 options: Số đích danh | Độ dài chữ số) */}
                  <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                    <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none">
                      {tr("Nhân với số tùy chọn:")}
                    </span>

                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleCustomMultiplierModeChange('exact')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                          customMultiplierMode === 'exact'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        {tr("Số đích danh")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustomMultiplierModeChange('digits')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                          customMultiplierMode === 'digits'
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        {tr("Độ dài chữ số")}
                      </button>
                    </div>

                    {customMultiplierMode === 'exact' ? (
                      <input
                        id="custom-multiplier-value"
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        value={customMultiplierDraft}
                        onFocus={(e) => {
                          isEditingCustomMultiplierRef.current = true;
                          e.target.select();
                        }}
                        onChange={handleCustomMultiplierChange}
                        onBlur={commitCustomMultiplier}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        aria-label={tr("Nhân với số đích danh")}
                        title={
                          tr("Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 125...)")
                        }
                        className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors"
                      />
                    ) : (
                      <input
                        id="custom-multiplier-digits"
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={customMultiplierDigitsDraft}
                        onFocus={(e) => {
                          isEditingCustomMultiplierDigitsRef.current = true;
                          e.target.select();
                        }}
                        onChange={handleCustomMultiplierDigitsChange}
                        onBlur={commitCustomMultiplierDigits}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        aria-label={
                          tr("Độ dài chữ số của số nhân (1 - 100)")
                        }
                        title={
                          tr("Nhập độ dài chữ số của số nhân (từ 1 đến 100)")
                        }
                        className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Tùy chọn (Dãy số), Phép tính ×/÷ & bộ điều khiển chi tiết */}
            <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={gameStatus === 'running'}
                onClick={() => handleSelectTopic('sequence')}
                title={tr("Tùy chọn dãy số nhân liên tiếp giống các cuộc thi Siêu trí tuệ")}
                className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                  selectedTopic === 'sequence'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <SlidersHorizontal
                  className={`w-3.5 h-3.5 shrink-0 ${
                    selectedTopic === 'sequence' ? 'text-slate-950' : 'text-yellow-400'
                  }`}
                />
                <span className="whitespace-nowrap">{tr("Tùy chọn (Dãy số)")}</span>
              </button>

              <button
                type="button"
                disabled={gameStatus === 'running'}
                onClick={() => {
                  const nextIncludeDiv =
                    selectedTopic === 'sequence' ? !sequenceIncludeDivision : true;
                  setSelectedTopic('sequence');
                  selectedTopicRef.current = 'sequence';
                  setSequenceIncludeDivision(nextIncludeDiv);
                  sequenceIncludeDivisionRef.current = nextIncludeDiv;
                  setFlashIndex(0);
                  if (gameStatus === 'idle' || gameStatus === 'completed') {
                    const nextQ = generateProblemForTopic(
                      'sequence',
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      sequenceCount,
                      sequenceDigitProfile,
                      nextIncludeDiv
                    );
                    setQuestion(nextQ);
                    questionRef.current = nextQ;
                  }
                }}
                aria-pressed={selectedTopic === 'sequence' && sequenceIncludeDivision}
                title={tr("Bật/tắt dãy số ngẫu nhiên kết hợp cả phép nhân (×) và phép chia hết (÷)")}
                className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                  selectedTopic === 'sequence' && sequenceIncludeDivision
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="whitespace-nowrap">{tr("Phép tính ×/÷")}</span>
              </button>

              {selectedTopic === 'sequence' && (
                <div className="w-full flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
                    <label
                      htmlFor="mul1d-sequence-count"
                      className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
                    >
                      {tr("Dãy số:")}
                    </label>
                    <input
                      id="mul1d-sequence-count"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      disabled={gameStatus === 'running'}
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
                          if (gameStatus === 'idle' || gameStatus === 'completed') {
                            const nextQ = generateProblemForTopic(
                              'sequence',
                              undefined,
                              undefined,
                              undefined,
                              undefined,
                              undefined,
                              clamped,
                              sequenceDigitProfile,
                              sequenceIncludeDivision
                            );
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
                          if (gameStatus === 'idle' || gameStatus === 'completed') {
                            const nextQ = generateProblemForTopic(
                              'sequence',
                              undefined,
                              undefined,
                              undefined,
                              undefined,
                              undefined,
                              clamped,
                              sequenceDigitProfile,
                              sequenceIncludeDivision
                            );
                            setQuestion(nextQ);
                            questionRef.current = nextQ;
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      title={tr("Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)")}
                      className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60 selection:bg-yellow-400 selection:text-slate-950"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
                    <label
                      htmlFor="mul1d-sequence-digits-select"
                      className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
                    >
                      {tr("Độ dài chữ số:")}
                    </label>
                    <select
                      id="mul1d-sequence-digits-select"
                      disabled={gameStatus === 'running'}
                      value={sequenceDigitProfile}
                      onChange={(e) => {
                        const nextProfile = e.target.value as SequenceDigitProfile;
                        setSequenceDigitProfile(nextProfile);
                        sequenceDigitProfileRef.current = nextProfile;
                        if (gameStatus === 'idle' || gameStatus === 'completed') {
                          const nextQ = generateProblemForTopic(
                            'sequence',
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            sequenceCount,
                            nextProfile,
                            sequenceIncludeDivision
                          );
                          setQuestion(nextQ);
                          questionRef.current = nextQ;
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-xs font-semibold text-cyan-200 cursor-pointer disabled:opacity-60"
                    >
                      {SEQUENCE_DIGIT_PROFILE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {isVi ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/35">
                    <label
                      htmlFor="mul1d-sequence-display-select"
                      className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
                    >
                      {tr("Hiển thị câu hỏi:")}
                    </label>
                    <select
                      id="mul1d-sequence-display-select"
                      disabled={gameStatus === 'running'}
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
        </div>

        {/* Thanh thống kê trực tiếp 4 chỉ số: Điểm số, Chuỗi đúng, Kỷ lục, Đúng/Tổng */}
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

        {/* Màn hình tổng kết sau khi hoàn thành 10 câu hoặc Khu vực thi đấu chính */}
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

            {/* Bảng lịch sử 10 câu vừa làm */}
            <div className="max-w-xl mx-auto max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              {roundHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 rounded-lg bg-slate-950/60 text-left"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="font-mono text-slate-400 shrink-0">#{h.qIndex}</span>
                    <span className="font-mono font-bold text-white break-all">
                      {h.label
                        ? `${h.label} = ${formatBigIntStr(h.answer ?? h.a)}`
                        : `${formatBigIntStr(h.a)} × ${formatBigIntStr(h.b)} = ${formatBigIntStr(computeExactProduct(h.a, h.b))}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 max-w-full">
                    <span className="font-mono text-slate-300 break-all">
                      {h.userAnswer ? formatBigIntStr(h.userAnswer) : '—'}
                    </span>
                    {h.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
          /* Khu vực hiển thị phép tính & nhập đáp án (1 cột khi dùng Tùy chọn, 2 cột trên Desktop) */
          <div
            className={
              isCustomLayout
                ? 'flex flex-col gap-4 md:gap-5 pt-0.5'
                : 'landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5'
            }
          >
            <div
              className={`${
                isCustomLayout ? 'w-full' : 'landscape-math-col md:col-span-6'
              } rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center`}
            >
              {/* Header: Progress & Timer Countdown */}
              <div className="flex items-center justify-between gap-2.5 mb-3 px-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  {dynamicTopicBadge}
                </span>

                {/* Countdown Timer Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs sm:text-sm font-black font-mono transition-all ${timerColor}`}
                >
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>
                    {gameStatus === 'running'
                      ? challengePhase === 'answering'
                        ? `${tr("Trả lời")}: ${timeLeft}s`
                        : `${tr("Quan sát")}: ${timeLeft}s`
                      : `${timeLeft}s`}
                  </span>
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
                ) : gameStatus === 'running' && challengePhase === 'answering' ? (
                  <div className="py-5 px-6 rounded-2xl bg-slate-900/90 border border-cyan-500/35 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                      <EyeOff className="w-5 h-5 text-cyan-400" />
                      <span>{tr("Đã hết thời gian quan sát")}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isVi
                        ? `Hãy nhớ lại phép tính và nhập đáp án trong ${timeLeft}s`
                        : `Recall the problem and enter your answer within ${timeLeft}s`}
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedTopic === 'sequence' && question.numbers && question.numbers.length > 0 ? (
                      sequenceDisplayMode === 'flash' && gameStatus === 'running' ? (
                        <div className="w-full max-w-lg mx-auto py-2 space-y-3 select-none">
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
                            {(() => {
                              const opsTail = question.operations?.slice(1) ?? [];
                              const hasMixedOps = opsTail.includes('÷') && opsTail.includes('×');
                              const activeOp = question.operations?.[flashIndex] ?? '×';
                              const showSign = flashIndex > 0;
                              return (
                                <span
                                  key={`flash-${currentQuestionIndex}-${flashIndex}`}
                                  className="text-5xl sm:text-6xl font-black font-mono text-white tabular-nums tracking-tight animate-in zoom-in-95 fade-in duration-100 flex items-center gap-2.5"
                                >
                                  {showSign && (
                                    <span
                                      className={`font-sans ${
                                        activeOp === '÷'
                                          ? 'text-rose-400'
                                          : hasMixedOps
                                          ? 'text-emerald-400'
                                          : 'text-yellow-400'
                                      }`}
                                    >
                                      {activeOp}
                                    </span>
                                  )}
                                  <span>{formatBigIntStr(question.numbers[flashIndex] ?? '0')}</span>
                                </span>
                              );
                            })()}
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
                      ) : (
                        <div className="w-full space-y-2.5 py-1 select-none">
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                            <span className="font-semibold text-yellow-300">
                              {(() => {
                                const opsTail = question.operations?.slice(1) ?? [];
                                const hasDiv = opsTail.includes('÷');
                                const hasMul = opsTail.includes('×');
                                if (hasDiv && hasMul) {
                                  return isVi
                                    ? `Dãy phép tính (×/÷) gồm ${question.numbers.length} số:`
                                    : `Mixed (×/÷) sequence of ${question.numbers.length} numbers:`;
                                }
                                if (hasDiv) {
                                  return isVi
                                    ? `Dãy phép chia gồm ${question.numbers.length} số:`
                                    : `Division sequence of ${question.numbers.length} numbers:`;
                                }
                                return isVi
                                  ? `Dãy phép nhân gồm ${question.numbers.length} số:`
                                  : `Multiplication sequence of ${question.numbers.length} numbers:`;
                              })()}
                            </span>
                            <button
                              type="button"
                              onClick={() => pronounceQuestion()}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                                isSpeakingQuestion
                                  ? 'bg-yellow-400 text-slate-950 border-yellow-300 animate-pulse'
                                  : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 border-yellow-500/40'
                              }`}
                              title={tr("Phát âm câu hỏi")}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          {(() => {
                            const opsTail = question.operations?.slice(1) ?? [];
                            const hasMixedOps = opsTail.includes('÷') && opsTail.includes('×');
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
                              <div className="w-full px-3 sm:px-4 py-4 sm:py-5 rounded-2xl bg-slate-900/75 border border-slate-800/90 flex items-center justify-center">
                                <div
                                  className={`${exprSizeClass} font-mono text-white tabular-nums tracking-tight leading-relaxed text-center`}
                                >
                                  {question.numbers.map((numVal, idx) => {
                                    const op = question.operations?.[idx] ?? '×';
                                    const isDiv = idx > 0 && op === '÷';
                                    return (
                                      <React.Fragment key={idx}>
                                        {idx > 0 && (
                                          <>
                                            {' '}
                                            <span
                                              className={`font-sans font-black ${
                                                isDiv
                                                  ? 'text-rose-400'
                                                  : hasMixedOps
                                                  ? 'text-emerald-400'
                                                  : 'text-yellow-400'
                                              }`}
                                            >
                                              {isDiv ? '÷' : '×'}
                                            </span>
                                            {' '}
                                          </>
                                        )}
                                        <span className="whitespace-nowrap">
                                          {formatBigIntStr(numVal)}
                                        </span>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )
                    ) : useStackedFormula ? (
                      <div className="w-full flex flex-col items-center justify-center gap-2.5 py-1 select-none">
                        <div
                          className={`font-black text-white font-mono tabular-nums flex flex-col items-center justify-center gap-1 tracking-wide leading-snug max-w-full ${formulaFontSize}`}
                        >
                          {multiplicandLines.map((line, idx) => (
                            <span key={idx} className="whitespace-nowrap">
                              {line}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-1 max-w-full">
                          <div
                            className={`font-black text-white font-mono tabular-nums flex items-start justify-center gap-2 tracking-tight ${
                              question.b.length >= 30
                                ? 'text-xs sm:text-base md:text-lg lg:text-xl'
                                : question.b.length >= 12
                                ? 'text-sm sm:text-lg md:text-xl lg:text-2xl'
                                : question.b.length >= 7
                                ? 'text-base sm:text-xl md:text-2xl'
                                : 'text-xl sm:text-2xl md:text-3xl'
                            }`}
                          >
                            <span className="text-yellow-400 font-sans shrink-0">×</span>
                            <div className="flex flex-col items-center justify-center gap-1 leading-snug">
                              {multiplierLines.map((line, idx) => (
                                <span key={idx} className="whitespace-nowrap">
                                  {line}
                                </span>
                              ))}
                            </div>
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
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full py-1 px-1">
                        <div
                          className={`font-black text-white font-mono tabular-nums flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 tracking-tight select-none leading-tight ${formulaFontSize}`}
                        >
                          <span className="whitespace-nowrap">{formatBigIntStr(question.a)}</span>
                          <span className="text-yellow-400 font-sans">×</span>
                          <span className="whitespace-nowrap">{formatBigIntStr(question.b)}</span>
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
                    )}

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
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="break-all font-mono sm:font-sans">
                    {question.answer.length > 15
                      ? isVi
                        ? `Chính xác: ${formatBigIntStr(question.answer)}`
                        : `Correct: ${formatBigIntStr(question.answer)}`
                      : isVi
                      ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                      : `Correct: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 shrink-0"
                    title={tr("Nghe lại thông báo kết quả")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {feedback === 'incorrect' && (
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-all font-mono sm:font-sans">
                    {question.answer.length > 15
                      ? isVi
                        ? `Chưa chính xác: ${formatBigIntStr(question.answer)}`
                        : `Incorrect: ${formatBigIntStr(question.answer)}`
                      : isVi
                      ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                      : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60 shrink-0"
                    title={tr("Nghe lại thông báo kết quả")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {feedback === 'timeout' && (
                <div className="mt-4 max-w-full inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-all font-mono sm:font-sans">
                    {question.answer.length > 15
                      ? isVi
                        ? `Hết giờ! Đáp án: ${formatBigIntStr(question.answer)}`
                        : `Time's up! Answer: ${formatBigIntStr(question.answer)}`
                      : isVi
                      ? `Hết giờ! Đáp án: ${getSpelledOutDigits(question.answer, true)} (${formatBigIntStr(question.answer)})`
                      : `Time's up! Answer: ${getSpelledOutDigits(question.answer, false)} (${formatBigIntStr(question.answer)})`}
                  </span>
                  <button
                    type="button"
                    onClick={replayAnnouncement}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60 shrink-0"
                    title={tr("Nghe lại thông báo kết quả")}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Biểu mẫu nhập đáp án, bàn phím số ảo 0-9 & các nút điều khiển */}
            <form
              onSubmit={handleSubmit}
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
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={
                    gameStatus === 'idle'
                      ? tr("Bấm \"Bắt đầu\" để bắt đầu thử thách...")
                      : challengePhase === 'observing'
                      ? isVi
                        ? `Đang quan sát đề (${timeLeft}s)... Bấm "Trả lời ngay"`
                        : `Observing (${timeLeft}s)... Click "Answer Now"`
                      : isListening
                      ? tr("🎙️ Đang nghe... Hãy đọc to đáp án của bạn [Đọc to]")
                      : tr("Nhập kết quả hoặc bấm phím số bên dưới...")
                  }
                  disabled={!canAnswer}
                  className={`w-full h-13 sm:h-14 px-5 pr-11 text-center ${
                    userAnswer.length > 22 ? 'text-base sm:text-xl' : 'text-2xl sm:text-3xl'
                  } font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                    isListening
                      ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                      : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                  }`}
                />
                {userAnswer && canAnswer && (
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
                      disabled={!canAnswer}
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
                      disabled={!canAnswer}
                      className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                      aria-label={`Digit ${digit}`}
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    disabled={!canAnswer || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa toàn bộ")}
                  >
                    {tr("Xóa")}
                  </button>

                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    disabled={!canAnswer || !userAnswer}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    title={tr("Xóa 1 số")}
                    aria-label="Backspace"
                  >
                    <Delete className="w-4 h-4 text-slate-400 hover:text-yellow-300" />
                  </button>
                </div>
              </div>

              {/* Voice indicator */}
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

              {/* Voice Error banner */}
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

              {/* Action Buttons */}
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
                ) : challengePhase === 'observing' ? (
                  <button
                    type="button"
                    onClick={() => beginAnsweringPhase()}
                    className="flex-1 min-w-[140px] h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:via-sky-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-cyan-300/30 shadow-[0_8px_24px_-4px_rgba(14,165,233,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(56,189,248,0.55)] active:scale-95 text-xs sm:text-sm"
                  >
                    <Timer className="w-4 h-4" />
                    <span>{isVi ? `Trả lời ngay (${timeLeft}s)` : `Answer Now (${timeLeft}s)`}</span>
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

                {/* Voice button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!canAnswer}
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

                {/* Start Challenge Question button */}
                <button
                  type="button"
                  onClick={() => startNewChallenge()}
                  title={tr("Bắt đầu câu hỏi thử thách")}
                  className="h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-500/25 active:scale-95 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{tr("Bắt đầu")}</span>
                </button>

                {/* Reset button */}
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
    </div>
  );
};
