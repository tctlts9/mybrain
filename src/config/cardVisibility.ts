import { useState, useEffect, useCallback } from 'react';
import { TabType } from '../types/tab';

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
    labelVi: 'Tính nhẩm',
    labelEn: 'Mental Math',
    accentClass: 'text-amber-300',
  },
  {
    id: 'loci-journey',
    labelVi: 'Hành trình ký ức Loci',
    labelEn: 'Memory Palace',
    accentClass: 'text-emerald-300',
  },
  {
    id: 'brain-training',
    labelVi: 'Rèn luyện não bộ',
    labelEn: 'Brain Training',
    accentClass: 'text-sky-300',
  },
];

export const ALL_CARDS_META: CardMetadata[] = [
  // --- Mental Math: Main Cards ---
  {
    id: 'mm:multiply',
    tab: 'mental-math',
    labelVi: 'Phép nhân',
    labelEn: 'Multiplication',
    descVi: 'Nhóm 4 chuyên đề nhân nhanh',
    descEn: '4 speed multiplication modules',
  },
  {
    id: 'mm:multiply-2-digit',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    labelVi: 'Phép nhân 2 chữ số',
    labelEn: '2-Digit Multiplication',
  },
  {
    id: 'mm:multiply-11',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    labelVi: 'Nhân với số 11',
    labelEn: 'Multiply by 11',
  },
  {
    id: 'mm:multiply-1-digit',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    labelVi: 'Nhân với 1 chữ số',
    labelEn: 'Multiply with 1 Digit',
  },
  {
    id: 'mm:multiply-99',
    tab: 'mental-math',
    parentId: 'mm:multiply',
    labelVi: 'Nhân với số 99',
    labelEn: 'Multiply by 99',
  },
  {
    id: 'mm:division',
    tab: 'mental-math',
    labelVi: 'Phép chia',
    labelEn: 'Division',
  },
  {
    id: 'mm:addition',
    tab: 'mental-math',
    labelVi: 'Phép cộng',
    labelEn: 'Addition',
  },
  {
    id: 'mm:subtraction',
    tab: 'mental-math',
    labelVi: 'Phép trừ',
    labelEn: 'Subtraction',
  },
  {
    id: 'mm:square-root',
    tab: 'mental-math',
    labelVi: 'Căn bậc 2',
    labelEn: 'Square Root',
  },
  {
    id: 'mm:exponent',
    tab: 'mental-math',
    labelVi: 'Lũy thừa',
    labelEn: 'Exponents',
  },
  {
    id: 'mm:percentage',
    tab: 'mental-math',
    labelVi: 'Tỷ lệ %',
    labelEn: 'Percentage',
    descVi: 'Nhóm 3 chuyên đề tỷ lệ %',
    descEn: '3 percentage modules',
  },
  {
    id: 'mm:percentage-basic',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    labelVi: 'Tính % của một số',
    labelEn: '% of a Number',
  },
  {
    id: 'mm:percentage-change',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    labelVi: 'Tăng / Giảm %',
    labelEn: '% Increase & Decrease',
  },
  {
    id: 'mm:percentage-reverse',
    tab: 'mental-math',
    parentId: 'mm:percentage',
    labelVi: 'Tìm tỷ lệ & Số gốc',
    labelEn: 'Find Rate & Whole',
  },
  {
    id: 'mm:daily-reflex',
    tab: 'mental-math',
    labelVi: 'Rèn luyện phản xạ tính nhẩm hàng ngày',
    labelEn: 'Daily Mental Math Reflex',
  },

  // --- Loci Journey ---
  {
    id: 'loci:memory-palace',
    tab: 'loci-journey',
    labelVi: 'Memory Palace',
    labelEn: 'Memory Palace',
    descVi: 'Thẻ Hành trình ký ức Loci',
    descEn: 'Memory Palace card',
  },

  // --- Brain Training ---
  {
    id: 'bt:schulte-table',
    tab: 'brain-training',
    labelVi: 'Bảng Schulte 5x5',
    labelEn: '5x5 Schulte Table',
    descVi: 'Luyện tập phản xạ mắt & tập trung',
    descEn: 'Visual focus & speed grid training',
  },
];

export const DEFAULT_CARD_VISIBILITY: Record<CardVisibilityId, boolean> = {
  'mm:multiply': true,
  'mm:division': true,
  'mm:addition': true,
  'mm:subtraction': true,
  'mm:square-root': true,
  'mm:exponent': true,
  'mm:percentage': true,
  'mm:daily-reflex': true,
  'mm:multiply-2-digit': true,
  'mm:multiply-11': true,
  'mm:multiply-1-digit': true,
  'mm:multiply-99': true,
  'mm:percentage-basic': true,
  'mm:percentage-change': true,
  'mm:percentage-reverse': true,
  'loci:memory-palace': true,
  'bt:schulte-table': true,
};

const STORAGE_KEY = 'card_visibility_overrides_v1';
const UPDATE_EVENT = 'card-visibility-updated';

export type CardVisibilityMap = Record<CardVisibilityId, boolean>;

export const getCardVisibilityMap = (): CardVisibilityMap => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CARD_VISIBILITY };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CARD_VISIBILITY };
    const parsed = JSON.parse(raw) as Partial<CardVisibilityMap>;
    const merged: CardVisibilityMap = { ...DEFAULT_CARD_VISIBILITY };
    (Object.keys(DEFAULT_CARD_VISIBILITY) as CardVisibilityId[]).forEach((id) => {
      if (typeof parsed[id] === 'boolean') {
        merged[id] = parsed[id] as boolean;
      }
    });
    return merged;
  } catch {
    return { ...DEFAULT_CARD_VISIBILITY };
  }
};

const saveCardVisibilityMap = (next: CardVisibilityMap): void => {
  if (typeof window === 'undefined') return;
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
  saveCardVisibilityMap({ ...DEFAULT_CARD_VISIBILITY });
};

export const resetTabCardVisibility = (tab: TabType): void => {
  const current = getCardVisibilityMap();
  const next = { ...current };
  for (const card of ALL_CARDS_META) {
    if (card.tab === tab) {
      next[card.id] = DEFAULT_CARD_VISIBILITY[card.id];
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
