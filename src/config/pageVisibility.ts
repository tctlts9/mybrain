import { TabType } from '../types/tab';

// ============================================================================
// QUẢN TRỊ ẨN / HIỆN TAB VÀ PAGE (true = HIỆN | false = ẨN)
// Chỉnh trực tiếp file này để bật/tắt nhanh từng Tab, nhóm Page hoặc Page lẻ.
// ============================================================================

// 1. CÔNG TẮC TỔNG THEO TAB & NHÓM PAGE
// ----------------------------------------------------------------------------
export const SHOW_ALL_TABS: boolean = true;
export const SHOW_MENTAL_MATH_TAB: boolean = true;
export const SHOW_LOCI_JOURNEY_TAB: boolean = true;
export const SHOW_BRAIN_TRAINING_TAB: boolean = true;

// Công tắc tổng theo loại Page (đặt false sẽ ẩn toàn bộ nhóm page tương ứng)
export const SHOW_ALL_PAGES: boolean = true;
export const SHOW_HUB_PAGES: boolean = true; // Trang nhóm card con (Phép nhân, Tỷ lệ %)
export const SHOW_PRACTICE_PAGES: boolean = true; // Tất cả trang Luyện tập
export const SHOW_CHALLENGE_PAGES: boolean = true; // Tất cả trang Thử thách
export const SHOW_DIFFICULTY_CHALLENGE_PAGES: boolean = true; // Tất cả trang Thử thách cấp độ khó
export const SHOW_VISUAL_GUIDE_PAGES: boolean = true; // Tất cả trang Hướng dẫn trực quan

// 2. BẬT / TẮT TỪNG TAB CHÍNH TRÊN HEADER & MOBILE TAB BAR
// ----------------------------------------------------------------------------
export const TAB_VISIBILITY: Record<TabType, boolean> = {
  'mental-math': true,
  'loci-journey': true,
  'brain-training': true,
};

const TAB_ORDER: TabType[] = ['mental-math', 'loci-journey', 'brain-training'];

const getTabMasterSwitch = (tab: TabType): boolean => {
  if (!SHOW_ALL_TABS) return false;
  switch (tab) {
    case 'mental-math':
      return SHOW_MENTAL_MATH_TAB;
    case 'loci-journey':
      return SHOW_LOCI_JOURNEY_TAB;
    case 'brain-training':
      return SHOW_BRAIN_TRAINING_TAB;
  }
};

export const isTabVisible = (tab: TabType): boolean =>
  getTabMasterSwitch(tab) && TAB_VISIBILITY[tab];

export const getVisibleTabs = (): TabType[] =>
  TAB_ORDER.filter((tab) => isTabVisible(tab));

export const getFirstVisibleTab = (): TabType | null =>
  getVisibleTabs()[0] ?? null;

// 3. BẬT / TẮT TỪNG PAGE CHI TIẾT TRONG WEB APP
// Lưu ý: Page chỉ hiển thị khi CẢ Tab cha, công tắc nhóm (1) và mục này đều true.
// Khi Page bị ẩn, các nút/card dẫn tới Page đó cũng tự động ẩn hoặc không điều hướng tới.
// ----------------------------------------------------------------------------
export const PAGE_VISIBILITY = {
  // --- Tab Mental Math: Hub chứa Card con ---
  MultiplyHubPage: true,
  PercentageHubPage: true,

  // --- Tab Mental Math: Trang Luyện tập (Practice) ---
  TwoDigitMultiplicationPage: true,
  MultiplyBy11Page: true,
  MultiplyBy99Page: true,
  MultiplyWith1DigitPage: true,
  DivisionPage: true,
  AdditionPage: true,
  SubtractionPage: true,
  ExponentPage: true,
  SquareRootPage: true,
  PercentagePage_basic: true,
  PercentagePage_change: true,
  PercentagePage_reverse: true,
  DailyReflexPage: true,

  // --- Tab Mental Math: Trang Thử thách (Challenge) ---
  TwoDigitMentalMathChallengePage: true,
  MultiplyBy11ChallengePage: true,
  MultiplyBy99ChallengePage: true,
  MultiplyWith1DigitChallengePage: true,
  DivisionChallengePage: true,
  AdditionChallengePage: true,
  SubtractionChallengePage: true,
  ExponentChallengePage: true,
  SquareRootChallengePage: true,
  PercentageChallengePage_basic: true,
  PercentageChallengePage_change: true,
  PercentageChallengePage_reverse: true,
  DailyReflexChallengePage: true,

  // --- Tab Mental Math: Trang Thử thách cấp độ khó (Difficulty Challenge) ---
  TwoDigitMentalMathDifficultyChallengePage: true,
  MultiplyBy11DifficultyChallengePage: true,
  MultiplyBy99DifficultyChallengePage: true,
  MultiplyWith1DigitDifficultyChallengePage: true,
  DivisionDifficultyChallengePage: true,
  AdditionDifficultyChallengePage: true,
  SubtractionDifficultyChallengePage: true,
  ExponentDifficultyChallengePage: true,
  SquareRootDifficultyChallengePage: true,
  PercentageDifficultyChallengePage_basic: true,
  PercentageDifficultyChallengePage_change: true,
  PercentageDifficultyChallengePage_reverse: true,
  DailyReflexDifficultyChallengePage: true,

  // --- Tab Mental Math: Trang Hướng dẫn trực quan (Visual Guide) ---
  TwoDigitMentalMathVisualGuidePage: true,
  MultiplyBy11VisualGuidePage: true,
  MultiplyBy99VisualGuidePage: true,
  MultiplyWith1DigitVisualGuidePage: true,
  DivisionVisualGuidePage: true,
  AdditionVisualGuidePage: true,
  SubtractionVisualGuidePage: true,
  ExponentVisualGuidePage: true,
  SquareRootVisualGuidePage: true,
  PercentageVisualGuidePage_basic: true,
  PercentageVisualGuidePage_change: true,
  PercentageVisualGuidePage_reverse: true,
  DailyReflexVisualGuidePage: true,

  // --- Tab Brain Training: Bảng Schulte & Cross Math ---
  SchulteTablePage: true,
  SchulteTableChallengePage: true,
  SchulteTableDifficultyChallengePage: true,
  CrossMathPage: true,
} as const;

export type PageVisibilityKey = keyof typeof PAGE_VISIBILITY;

type PageGroup =
  | 'hub'
  | 'practice'
  | 'challenge'
  | 'difficulty-challenge'
  | 'visual-guide';

const PAGE_META_MAP: Record<
  PageVisibilityKey,
  { tab: TabType; group: PageGroup }
> = {
  // Hubs
  MultiplyHubPage: { tab: 'mental-math', group: 'hub' },
  PercentageHubPage: { tab: 'mental-math', group: 'hub' },

  // Mental Math Practice
  TwoDigitMultiplicationPage: { tab: 'mental-math', group: 'practice' },
  MultiplyBy11Page: { tab: 'mental-math', group: 'practice' },
  MultiplyBy99Page: { tab: 'mental-math', group: 'practice' },
  MultiplyWith1DigitPage: { tab: 'mental-math', group: 'practice' },
  DivisionPage: { tab: 'mental-math', group: 'practice' },
  AdditionPage: { tab: 'mental-math', group: 'practice' },
  SubtractionPage: { tab: 'mental-math', group: 'practice' },
  ExponentPage: { tab: 'mental-math', group: 'practice' },
  SquareRootPage: { tab: 'mental-math', group: 'practice' },
  PercentagePage_basic: { tab: 'mental-math', group: 'practice' },
  PercentagePage_change: { tab: 'mental-math', group: 'practice' },
  PercentagePage_reverse: { tab: 'mental-math', group: 'practice' },
  DailyReflexPage: { tab: 'mental-math', group: 'practice' },

  // Mental Math Challenge
  TwoDigitMentalMathChallengePage: { tab: 'mental-math', group: 'challenge' },
  MultiplyBy11ChallengePage: { tab: 'mental-math', group: 'challenge' },
  MultiplyBy99ChallengePage: { tab: 'mental-math', group: 'challenge' },
  MultiplyWith1DigitChallengePage: { tab: 'mental-math', group: 'challenge' },
  DivisionChallengePage: { tab: 'mental-math', group: 'challenge' },
  AdditionChallengePage: { tab: 'mental-math', group: 'challenge' },
  SubtractionChallengePage: { tab: 'mental-math', group: 'challenge' },
  ExponentChallengePage: { tab: 'mental-math', group: 'challenge' },
  SquareRootChallengePage: { tab: 'mental-math', group: 'challenge' },
  PercentageChallengePage_basic: { tab: 'mental-math', group: 'challenge' },
  PercentageChallengePage_change: { tab: 'mental-math', group: 'challenge' },
  PercentageChallengePage_reverse: { tab: 'mental-math', group: 'challenge' },
  DailyReflexChallengePage: { tab: 'mental-math', group: 'challenge' },

  // Mental Math Difficulty Challenge
  TwoDigitMentalMathDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  MultiplyBy11DifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  MultiplyBy99DifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  MultiplyWith1DigitDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  DivisionDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  AdditionDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  SubtractionDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  ExponentDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  SquareRootDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  PercentageDifficultyChallengePage_basic: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  PercentageDifficultyChallengePage_change: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  PercentageDifficultyChallengePage_reverse: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },
  DailyReflexDifficultyChallengePage: {
    tab: 'mental-math',
    group: 'difficulty-challenge',
  },

  // Mental Math Visual Guide
  TwoDigitMentalMathVisualGuidePage: {
    tab: 'mental-math',
    group: 'visual-guide',
  },
  MultiplyBy11VisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  MultiplyBy99VisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  MultiplyWith1DigitVisualGuidePage: {
    tab: 'mental-math',
    group: 'visual-guide',
  },
  DivisionVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  AdditionVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  SubtractionVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  ExponentVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  SquareRootVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },
  PercentageVisualGuidePage_basic: {
    tab: 'mental-math',
    group: 'visual-guide',
  },
  PercentageVisualGuidePage_change: {
    tab: 'mental-math',
    group: 'visual-guide',
  },
  PercentageVisualGuidePage_reverse: {
    tab: 'mental-math',
    group: 'visual-guide',
  },
  DailyReflexVisualGuidePage: { tab: 'mental-math', group: 'visual-guide' },

  // Brain Training
  SchulteTablePage: { tab: 'brain-training', group: 'practice' },
  SchulteTableChallengePage: { tab: 'brain-training', group: 'challenge' },
  SchulteTableDifficultyChallengePage: {
    tab: 'brain-training',
    group: 'difficulty-challenge',
  },
  CrossMathPage: { tab: 'brain-training', group: 'practice' },
};

const isPageGroupVisible = (group: PageGroup): boolean => {
  switch (group) {
    case 'hub':
      return SHOW_HUB_PAGES;
    case 'practice':
      return SHOW_PRACTICE_PAGES;
    case 'challenge':
      return SHOW_CHALLENGE_PAGES;
    case 'difficulty-challenge':
      return SHOW_DIFFICULTY_CHALLENGE_PAGES;
    case 'visual-guide':
      return SHOW_VISUAL_GUIDE_PAGES;
  }
};

export const isPageVisible = (page: PageVisibilityKey): boolean => {
  if (!SHOW_ALL_PAGES) return false;
  const meta = PAGE_META_MAP[page];
  if (!isTabVisible(meta.tab)) return false;
  if (!isPageGroupVisible(meta.group)) return false;
  return PAGE_VISIBILITY[page];
};
