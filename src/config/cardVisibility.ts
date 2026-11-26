import { useState, useEffect, useCallback } from 'react';
import { TabType } from '../types/tab';
import { biLabel, biDesc } from '../context/Translations';

// ============================================================================
// QUẢN TRỊ ẨN / HIỆN CARD (true = HIỆN | false = ẨN)
// Chỉnh trực tiếp file này để bật/tắt nhanh theo toàn app, theo Tab, hoặc từng Card.
// ============================================================================

// 1. CÔNG TẮC TỔNG ẨN / HIỆN CARD
// ----------------------------------------------------------------------------
export const SHOW_ALL_CARDS: boolean = true;
export const SHOW_MENTAL_MATH_CARDS: boolean = true;
export const SHOW_LOCI_JOURNEY_CARDS: boolean = true;
export const SHOW_BRAIN_TRAINING_CARDS: boolean = true;

// Bật true nếu muốn cho phép trình duyệt (localStorage / Modal Ẩn-Hiện Card) ghi đè cấu hình file code.
// Mặc định false để mọi chỉnh sửa true/false trong CARD_VISIBILITY bên dưới áp dụng ngay lập tức.
export const ENABLE_BROWSER_CARD_OVERRIDES: boolean = false;

export type CardVisibilityId =
  // Tab: Mental Math (Main cards)
  | 'mm:multiply'
  | 'mm:division'
  | 'mm:addition'
  | 'mm:subtraction'
  | 'mm:square-root'
  | 'mm:exponent'
  | 'mm:percentage'
  | 'mm:daily-reflex'
  // Tab: Mental Math (Child cards under Phép nhân)
  | 'mm:multiply-2-digit'
  | 'mm:multiply-11'
  | 'mm:multiply-1-digit'
  | 'mm:multiply-99'
  // Tab: Mental Math (Child cards under Tỷ lệ %)
  | 'mm:percentage-basic'
  | 'mm:percentage-change'
  | 'mm:percentage-reverse'
  // Tab: Loci Journey
  | 'loci:memory-palace'
  // Tab: Brain Training
  | 'bt:schulte-table';

// 2. CẤU HÌNH CHI TIẾT TỪNG CARD (true = HIỆN | false = ẨN)
// ----------------------------------------------------------------------------
export const CARD_VISIBILITY: Record<CardVisibilityId, boolean> = {
  // --- Tab Tính nhẩm (Card chính) ---
  'mm:multiply': true,
  'mm:division': true,
  'mm:addition': true,
  'mm:subtraction': true,
  'mm:square-root': true,
  'mm:exponent': true,
  'mm:percentage': true,
  'mm:daily-reflex': true,

  // --- Tab Tính nhẩm (Card con của Phép nhân) ---
  'mm:multiply-2-digit': true,
  'mm:multiply-11': true,
  'mm:multiply-1-digit': true,
  'mm:multiply-99': true,

  // --- Tab Tính nhẩm (Card con của Tỷ lệ %) ---
  'mm:percentage-basic': true,
  'mm:percentage-change': true,
  'mm:percentage-reverse': true,

  // --- Tab Hành trình ký ức Loci ---
  'loci:memory-palace': true,

  // --- Tab Rèn luyện não bộ ---
  'bt:schulte-table': true,
};

// Giữ alias tương thích với các component đang dùng DEFAULT_CARD_VISIBILITY
export const DEFAULT_CARD_VISIBILITY: Record<CardVisibilityId, boolean> =
  CARD_VISIBILITY;

export interface CardMetadata {
  id: CardVisibilityId;
  tab: TabType;
  parentId?: CardVisibilityId;
  labelVi: string;
  labelEn: string;
  descVi?: string;
  descEn?: string;
}

export const TAB_VISIBILITY_META: Array<{
  id: TabType;
  labelVi: string;
  labelEn: string;
  accentClass: string;
}> = [
  {
    id: 'mental-math',
    ...biLabel("Tính nhẩm"),
    accentClass: 'text-amber-300',
  },
  {
    id: 'loci-journey',
    ...biLabel("Hành trình ký ức Loci"),
    accentClass: 'text-emerald-300',
  },
  {
    id: 'brain-training',
    ...biLabel("Rèn luyện não bộ"),
    accentClass: 'text-sky-300',
  },
];

export const ALL_CARDS_META: CardMetadata[] = [
  // --- Mental Math: Main Cards ---
  {
    id: 'mm:multiply',
    tab: 'mental-math',
    ...biLabel("Phép nhân"),
    ...biDesc("Nhóm 4 chuyên đề nhân nhanh"),
  },
  {
    id: 'mm:multiply-2-digit',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    ...biLabel("Phép nhân 2 chữ số"),
  },
  {
    id: 'mm:multiply-11',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    ...biLabel("Nhân với số 11"),
  },
  {
    id: 'mm:multiply-1-digit',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    ...biLabel("Nhân với 1 chữ số [Thẻ]"),
  },
  {
    id: 'mm:multiply-99',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    ...biLabel("Nhân với số 99"),
  },
  {
    id: 'mm:division',
    tab: 'mental-math',
    ...biLabel("Phép chia"),
  },
  {
    id: 'mm:addition',
    tab: 'mental-math',
    ...biLabel("Phép cộng"),
  },
  {
    id: 'mm:subtraction',
    tab: 'mental-math',
    ...biLabel("Phép trừ"),
  },
  {
    id: 'mm:square-root',
    tab: 'mental-math',
    ...biLabel("Căn bậc 2"),
  },
  {
    id: 'mm:exponent',
    tab: 'mental-math',
    ...biLabel("Lũy thừa"),
  },
  {
    id: 'mm:percentage',
    tab: 'mental-math',
    ...biLabel("Tỷ lệ %"),
    ...biDesc("Nhóm 3 chuyên đề tỷ lệ %"),
  },
  {
    id: 'mm:percentage-basic',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    ...biLabel("Tính % của một số"),
  },
  {
    id: 'mm:percentage-change',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    ...biLabel("Tăng / Giảm %"),
  },
  {
    id: 'mm:percentage-reverse',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    ...biLabel("Tìm tỷ lệ & Số gốc"),
  },
  {
    id: 'mm:daily-reflex',
    tab: 'mental-math',
    ...biLabel("Rèn luyện phản xạ tính nhẩm hàng ngày"),
  },

  // --- Loci Journey ---
  {
    id: 'loci:memory-palace',
    tab: 'loci-journey',
    ...biLabel("Memory Palace"),
    ...biDesc("Thẻ Hành trình ký ức Loci"),
  },

  // --- Brain Training ---
  {
    id: 'bt:schulte-table',
    tab: 'brain-training',
    ...biLabel("Bảng Schulte 5x5"),
    ...biDesc("Luyện tập phản xạ mắt & tập trung"),
  },
];

const CARD_TAB_MAP: Record<CardVisibilityId, TabType> = {
  'mm:multiply': 'mental-math',
  'mm:division': 'mental-math',
  'mm:addition': 'mental-math',
  'mm:subtraction': 'mental-math',
  'mm:square-root': 'mental-math',
  'mm:exponent': 'mental-math',
  'mm:percentage': 'mental-math',
  'mm:daily-reflex': 'mental-math',
  'mm:multiply-2-digit': 'mental-math',
  'mm:multiply-11': 'mental-math',
  'mm:multiply-1-digit': 'mental-math',
  'mm:multiply-99': 'mental-math',
  'mm:percentage-basic': 'mental-math',
  'mm:percentage-change': 'mental-math',
  'mm:percentage-reverse': 'mental-math',
  'loci:memory-palace': 'loci-journey',
  'bt:schulte-table': 'brain-training',
};

export const isTabMasterCardVisible = (tab: TabType): boolean => {
  if (!SHOW_ALL_CARDS) return false;
  switch (tab) {
    case 'mental-math':
      return SHOW_MENTAL_MATH_CARDS;
    case 'loci-journey':
      return SHOW_LOCI_JOURNEY_CARDS;
    case 'brain-training':
      return SHOW_BRAIN_TRAINING_CARDS;
  }
};

const STORAGE_KEY = 'card_visibility_overrides_v1';
const UPDATE_EVENT = 'card-visibility-updated';

export type CardVisibilityMap = Record<CardVisibilityId, boolean>;

const applyMasterSwitches = (map: CardVisibilityMap): CardVisibilityMap => {
  const next: CardVisibilityMap = { ...map };
  (Object.keys(next) as CardVisibilityId[]).forEach((id) => {
    if (!isTabMasterCardVisible(CARD_TAB_MAP[id])) {
      next[id] = false;
    }
  });
  return next;
};

export const getCardVisibilityMap = (): CardVisibilityMap => {
  const baseMap = { ...CARD_VISIBILITY };
  if (typeof window === 'undefined' || !ENABLE_BROWSER_CARD_OVERRIDES) {
    return applyMasterSwitches(baseMap);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return applyMasterSwitches(baseMap);
    const parsed = JSON.parse(raw) as Partial<CardVisibilityMap>;
    (Object.keys(baseMap) as CardVisibilityId[]).forEach((id) => {
      if (typeof parsed[id] === 'boolean') {
        baseMap[id] = parsed[id] as boolean;
      }
    });
    return applyMasterSwitches(baseMap);
  } catch {
    return applyMasterSwitches({ ...CARD_VISIBILITY });
  }
};

export const isCardConfigVisible = (id: CardVisibilityId): boolean =>
  getCardVisibilityMap()[id] !== false;

const saveCardVisibilityMap = (next: CardVisibilityMap): void => {
  if (typeof window === 'undefined' || !ENABLE_BROWSER_CARD_OVERRIDES) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
};

export const setSingleCardVisibility = (
  id: CardVisibilityId,
  visible: boolean
): void => {
  const current = getCardVisibilityMap();
  saveCardVisibilityMap({
    ...current,
    [id]: visible,
  });
};

export const setTabCardsVisibility = (
  tab: TabType | 'all',
  visible: boolean,
  includeChildren: boolean = true
): void => {
  const current = getCardVisibilityMap();
  const next = { ...current };
  for (const card of ALL_CARDS_META) {
    if (tab !== 'all' && card.tab !== tab) continue;
    if (!includeChildren && card.parentId) continue;
    next[card.id] = visible;
  }
  saveCardVisibilityMap(next);
};

export const setChildCardsVisibility = (
  parentId: CardVisibilityId,
  visible: boolean
): void => {
  const current = getCardVisibilityMap();
  const next = { ...current };
  for (const card of ALL_CARDS_META) {
    if (card.parentId === parentId) {
      next[card.id] = visible;
    }
  }
  saveCardVisibilityMap(next);
};

export const resetAllCardVisibility = (): void => {
  if (typeof window === 'undefined' || !ENABLE_BROWSER_CARD_OVERRIDES) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    saveCardVisibilityMap({ ...CARD_VISIBILITY });
  }
};

export const resetTabCardVisibility = (tab: TabType): void => {
  const current = getCardVisibilityMap();
  const next = { ...current };
  for (const card of ALL_CARDS_META) {
    if (card.tab === tab) {
      next[card.id] = CARD_VISIBILITY[card.id];
    }
  }
  saveCardVisibilityMap(next);
};

export const useCardVisibility = (): {
  visibility: CardVisibilityMap;
  isCardVisible: (id: CardVisibilityId) => boolean;
} => {
  const [visibility, setVisibility] = useState<CardVisibilityMap>(() =>
    getCardVisibilityMap()
  );

  const refresh = useCallback(() => {
    setVisibility(getCardVisibilityMap());
  }, []);

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

  const isCardVisible = useCallback(
    (id: CardVisibilityId) => visibility[id] !== false,
    [visibility]
  );

  return { visibility, isCardVisible };
};
