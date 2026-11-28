import { TabType } from '../types/tab';

// ============================================================================
// QUẢN TRỊ ẨN / HIỆN BUTTON (true = HIỆN | false = ẨN)
// Chỉnh trực tiếp file này để bật/tắt nhanh nút toàn Web App hoặc theo từng Page.
// ============================================================================

// 1. CÔNG TẮC TỔNG TOÀN WEB APP (true = HIỆN | false = ẨN TẤT CẢ)
// ----------------------------------------------------------------------------

// Nút Chuyển đổi ngôn ngữ VI / EN (Header)
export const SHOW_LANGUAGE_BUTTON: boolean = true;

// Công tắc tổng nút Ẩn/Hiện Card (Header) (đặt false sẽ ẩn ở TẤT CẢ các Tab)
export const SHOW_CARD_VISIBILITY_BUTTON: boolean = false;

// Nút Buy Coffee (Footer)
export const SHOW_BUY_COFFEE_BUTTON: boolean = false;

// Nút YouTube (Footer)
export const SHOW_YOUTUBE_BUTTON: boolean = true;

// Nút Email (Footer)
export const SHOW_EMAIL_BUTTON: boolean = true;

// Công tắc tổng nút Hướng dẫn trực quan / Visual Guide (đặt false sẽ ẩn ở TẤT CẢ các page Luyện tập)
export const SHOW_VISUAL_GUIDE_BUTTON: boolean = true;

// Công tắc tổng nút Challenge / Thử Thách (đặt false sẽ ẩn ở TẤT CẢ các page)
export const SHOW_CHALLENGE_BUTTON: boolean = true;

// Công tắc tổng nút Difficult Level Challenge / Thử Thách Cấp Độ Khó (đặt false sẽ ẩn ở TẤT CẢ các page)
export const SHOW_DIFFICULT_LEVEL_CHALLENGE_BUTTON: boolean = true;

// Công tắc tổng nút Edit Timer / Chỉnh sửa Timer (đặt false sẽ ẩn ở TẤT CẢ các page)
export const SHOW_EDIT_TIMER_BUTTON: boolean = false;

// Công tắc tổng nút Tùy chỉnh đổi câu / Auto-Next (đặt false sẽ ẩn ở TẤT CẢ các page)
export const SHOW_AUTO_NEXT_BUTTON: boolean = false;

// ============================================================================
// 2. TÙY CHỈNH ẨN / HIỆN THEO TỪNG PAGE CỤ THỂ (true = HIỆN | false = ẨN)
// Lưu ý: Nút chỉ hiển thị khi CẢ công tắc tổng ở mục (1) và công tắc của page đều là true.
// ============================================================================

interface PracticePageVisibility {
  visualGuide: boolean;
  challenge: boolean;
  difficultLevelChallenge: boolean;
}

interface MentalMathPracticePageVisibility extends PracticePageVisibility {
  visualGuide: boolean;
  autoNext: boolean;
}

interface VisualGuidePageVisibility {
  challenge: boolean;
}

interface ChallengePageVisibility {
  difficultLevelChallenge: boolean;
}

interface EditTimerPageVisibility {
  editTimer: boolean;
}

interface MentalMathHubVisibility extends EditTimerPageVisibility {
  autoNext: boolean;
}

interface MentalMathChallengePageVisibility
  extends EditTimerPageVisibility,
    ChallengePageVisibility {
  autoNext: boolean;
}

interface AutoNextOnlyPageVisibility {
  autoNext: boolean;
}

export const PAGE_BUTTON_VISIBILITY: {
  // Tab Mental Math - Trang Luyện tập
  TwoDigitMultiplicationPage: MentalMathPracticePageVisibility;
  MultiplyBy11Page: MentalMathPracticePageVisibility;
  MultiplyBy99Page: MentalMathPracticePageVisibility;
  MultiplyWith1DigitPage: MentalMathPracticePageVisibility;
  DivisionPage: MentalMathPracticePageVisibility;
  AdditionPage: MentalMathPracticePageVisibility;
  SubtractionPage: MentalMathPracticePageVisibility;
  ExponentPage: MentalMathPracticePageVisibility;
  SquareRootPage: MentalMathPracticePageVisibility;
  PercentagePage_basic: MentalMathPracticePageVisibility;
  PercentagePage_change: MentalMathPracticePageVisibility;
  PercentagePage_reverse: MentalMathPracticePageVisibility;
  DailyReflexPage: MentalMathPracticePageVisibility;

  // Tab Mental Math - Trang Hướng dẫn trực quan (Visual Guide)
  TwoDigitMentalMathVisualGuidePage: VisualGuidePageVisibility;
  MultiplyBy11VisualGuidePage: VisualGuidePageVisibility;
  MultiplyBy99VisualGuidePage: VisualGuidePageVisibility;
  MultiplyWith1DigitVisualGuidePage: VisualGuidePageVisibility;
  DivisionVisualGuidePage: VisualGuidePageVisibility;
  AdditionVisualGuidePage: VisualGuidePageVisibility;
  SubtractionVisualGuidePage: VisualGuidePageVisibility;
  ExponentVisualGuidePage: VisualGuidePageVisibility;
  SquareRootVisualGuidePage: VisualGuidePageVisibility;
  PercentageVisualGuidePage_basic: VisualGuidePageVisibility;
  PercentageVisualGuidePage_change: VisualGuidePageVisibility;
  PercentageVisualGuidePage_reverse: VisualGuidePageVisibility;
  DailyReflexVisualGuidePage: VisualGuidePageVisibility;

  // Tab Mental Math - Nút Edit Timer & Tùy chỉnh đổi câu (Trang chính & các trang Challenge)
  MentalMathTab: MentalMathHubVisibility;
  TwoDigitMentalMathChallengePage: MentalMathChallengePageVisibility;
  MultiplyBy11ChallengePage: MentalMathChallengePageVisibility;
  MultiplyBy99ChallengePage: MentalMathChallengePageVisibility;
  MultiplyWith1DigitChallengePage: MentalMathChallengePageVisibility;
  DivisionChallengePage: MentalMathChallengePageVisibility;
  AdditionChallengePage: MentalMathChallengePageVisibility;
  SubtractionChallengePage: MentalMathChallengePageVisibility;
  ExponentChallengePage: MentalMathChallengePageVisibility;
  SquareRootChallengePage: MentalMathChallengePageVisibility;
  PercentageChallengePage_basic: MentalMathChallengePageVisibility;
  PercentageChallengePage_change: MentalMathChallengePageVisibility;
  PercentageChallengePage_reverse: MentalMathChallengePageVisibility;
  DailyReflexChallengePage: MentalMathChallengePageVisibility;

  // Tab Mental Math - Trang Difficult Level Challenge (Nút Tùy chỉnh đổi câu)
  TwoDigitMentalMathDifficultyChallengePage: AutoNextOnlyPageVisibility;
  MultiplyBy11DifficultyChallengePage: AutoNextOnlyPageVisibility;
  MultiplyBy99DifficultyChallengePage: AutoNextOnlyPageVisibility;
  MultiplyWith1DigitDifficultyChallengePage: AutoNextOnlyPageVisibility;
  DivisionDifficultyChallengePage: AutoNextOnlyPageVisibility;
  AdditionDifficultyChallengePage: AutoNextOnlyPageVisibility;
  SubtractionDifficultyChallengePage: AutoNextOnlyPageVisibility;
  ExponentDifficultyChallengePage: AutoNextOnlyPageVisibility;
  SquareRootDifficultyChallengePage: AutoNextOnlyPageVisibility;
  PercentageDifficultyChallengePage_basic: AutoNextOnlyPageVisibility;
  PercentageDifficultyChallengePage_change: AutoNextOnlyPageVisibility;
  PercentageDifficultyChallengePage_reverse: AutoNextOnlyPageVisibility;
  DailyReflexDifficultyChallengePage: AutoNextOnlyPageVisibility;

  // Tab Brain Training - Bảng Schulte & Cross Math
  SchulteTablePage: PracticePageVisibility;
  SchulteTableChallengePage: ChallengePageVisibility;
  CrossMathPage: { visualGuide: boolean };
} = {
  // --- Tab Mental Math: Trang Luyện tập ---
  TwoDigitMultiplicationPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  MultiplyBy11Page: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  MultiplyBy99Page: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  MultiplyWith1DigitPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  DivisionPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  AdditionPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  SubtractionPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  ExponentPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  SquareRootPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  PercentagePage_basic: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  PercentagePage_change: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  PercentagePage_reverse: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },
  DailyReflexPage: { visualGuide: true, challenge: true, difficultLevelChallenge: true, autoNext: true },

  // --- Tab Mental Math: Trang Hướng dẫn trực quan (Visual Guide) ---
  TwoDigitMentalMathVisualGuidePage: { challenge: true },
  MultiplyBy11VisualGuidePage: { challenge: true },
  MultiplyBy99VisualGuidePage: { challenge: true },
  MultiplyWith1DigitVisualGuidePage: { challenge: true },
  DivisionVisualGuidePage: { challenge: true },
  AdditionVisualGuidePage: { challenge: true },
  SubtractionVisualGuidePage: { challenge: true },
  ExponentVisualGuidePage: { challenge: true },
  SquareRootVisualGuidePage: { challenge: true },
  PercentageVisualGuidePage_basic: { challenge: true },
  PercentageVisualGuidePage_change: { challenge: true },
  PercentageVisualGuidePage_reverse: { challenge: true },
  DailyReflexVisualGuidePage: { challenge: true },

  // --- Tab Mental Math: Nút Edit Timer & Tùy chỉnh đổi câu ---
  MentalMathTab: { editTimer: true, autoNext: true },
  TwoDigitMentalMathChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  MultiplyBy11ChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  MultiplyBy99ChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  MultiplyWith1DigitChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  DivisionChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  AdditionChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  SubtractionChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  ExponentChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  SquareRootChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  PercentageChallengePage_basic: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  PercentageChallengePage_change: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  PercentageChallengePage_reverse: { editTimer: true, autoNext: true, difficultLevelChallenge: true },
  DailyReflexChallengePage: { editTimer: true, autoNext: true, difficultLevelChallenge: true },

  // --- Tab Mental Math: Trang Difficult Level Challenge (Tùy chỉnh đổi câu) ---
  TwoDigitMentalMathDifficultyChallengePage: { autoNext: true },
  MultiplyBy11DifficultyChallengePage: { autoNext: true },
  MultiplyBy99DifficultyChallengePage: { autoNext: true },
  MultiplyWith1DigitDifficultyChallengePage: { autoNext: true },
  DivisionDifficultyChallengePage: { autoNext: true },
  AdditionDifficultyChallengePage: { autoNext: true },
  SubtractionDifficultyChallengePage: { autoNext: true },
  ExponentDifficultyChallengePage: { autoNext: true },
  SquareRootDifficultyChallengePage: { autoNext: true },
  PercentageDifficultyChallengePage_basic: { autoNext: true },
  PercentageDifficultyChallengePage_change: { autoNext: true },
  PercentageDifficultyChallengePage_reverse: { autoNext: true },
  DailyReflexDifficultyChallengePage: { autoNext: true },

  // --- Tab Brain Training: Bảng Schulte & Cross Math ---
  SchulteTablePage: { visualGuide: true, challenge: true, difficultLevelChallenge: true },
  SchulteTableChallengePage: { difficultLevelChallenge: true },
  CrossMathPage: { visualGuide: true },
};

export type VisualGuideButtonPageKey = {
  [K in keyof typeof PAGE_BUTTON_VISIBILITY]: 'visualGuide' extends keyof (typeof PAGE_BUTTON_VISIBILITY)[K]
    ? K
    : never;
}[keyof typeof PAGE_BUTTON_VISIBILITY];

export type ChallengePageKey = {
  [K in keyof typeof PAGE_BUTTON_VISIBILITY]: 'challenge' extends keyof (typeof PAGE_BUTTON_VISIBILITY)[K]
    ? K
    : never;
}[keyof typeof PAGE_BUTTON_VISIBILITY];

export type DifficultLevelChallengePageKey = {
  [K in keyof typeof PAGE_BUTTON_VISIBILITY]: 'difficultLevelChallenge' extends keyof (typeof PAGE_BUTTON_VISIBILITY)[K]
    ? K
    : never;
}[keyof typeof PAGE_BUTTON_VISIBILITY];

export type EditTimerPageKey = {
  [K in keyof typeof PAGE_BUTTON_VISIBILITY]: 'editTimer' extends keyof (typeof PAGE_BUTTON_VISIBILITY)[K]
    ? K
    : never;
}[keyof typeof PAGE_BUTTON_VISIBILITY];

export type AutoNextButtonPageKey = {
  [K in keyof typeof PAGE_BUTTON_VISIBILITY]: 'autoNext' extends keyof (typeof PAGE_BUTTON_VISIBILITY)[K]
    ? K
    : never;
}[keyof typeof PAGE_BUTTON_VISIBILITY];

export const isVisualGuideButtonVisible = (
  page: VisualGuideButtonPageKey
): boolean => SHOW_VISUAL_GUIDE_BUTTON && PAGE_BUTTON_VISIBILITY[page].visualGuide;

export const isChallengeButtonVisible = (page: ChallengePageKey): boolean =>
  SHOW_CHALLENGE_BUTTON && PAGE_BUTTON_VISIBILITY[page].challenge;

export const isDifficultLevelChallengeButtonVisible = (
  page: DifficultLevelChallengePageKey
): boolean =>
  SHOW_DIFFICULT_LEVEL_CHALLENGE_BUTTON &&
  PAGE_BUTTON_VISIBILITY[page].difficultLevelChallenge;

export const isEditTimerButtonVisible = (page: EditTimerPageKey): boolean =>
  SHOW_EDIT_TIMER_BUTTON && PAGE_BUTTON_VISIBILITY[page].editTimer;

export const isAutoNextButtonVisible = (page: AutoNextButtonPageKey): boolean =>
  SHOW_AUTO_NEXT_BUTTON && PAGE_BUTTON_VISIBILITY[page].autoNext;

// Tùy chỉnh ẩn/hiện nút "Ẩn/Hiện Card" theo từng Tab (true = HIỆN | false = ẨN)
export const TAB_CARD_VISIBILITY_BUTTON: Record<TabType, boolean> = {
  'mental-math': true,
  'loci-journey': true,
  'brain-training': true,
};

export const isCardVisibilityButtonVisible = (tab: TabType): boolean =>
  SHOW_CARD_VISIBILITY_BUTTON && TAB_CARD_VISIBILITY_BUTTON[tab];
