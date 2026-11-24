import React, { useState } from 'react';
import { ArrowLeft, SlidersHorizontal, Clock, TimerReset, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isEditTimerButtonVisible, isAutoNextButtonVisible } from '../../config/buttonVisibility';
import {
  CardVisibilityId,
  setChildCardsVisibility,
  setTabCardsVisibility,
  useCardVisibility,
} from '../../config/cardVisibility';
import { MentalMathChallengeTimerModal } from './MentalMathChallengeTimerModal';
import { MentalMathAutoNextModal } from './MentalMathAutoNextModal';
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
import { PercentageMode } from '../../utils/percentageOperations';
import { DailyReflexPage } from './DailyReflexPage';
import { DailyReflexChallengePage } from './DailyReflexChallengePage';
import { DailyReflexDifficultyChallengePage } from './DailyReflexDifficultyChallengePage';
import { DailyReflexMode } from '../../utils/dailyReflexOperations';

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
  | 'daily-reflex-difficulty-challenge';

interface MentalMathTabProps {
  onOpenCardVisibility?: () => void;
}

export const MentalMathTab: React.FC<MentalMathTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { language, t } = useLanguage();
  const isVi = language === 'vi';
  const { isCardVisible } = useCardVisibility();
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
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [isAutoNextModalOpen, setIsAutoNextModalOpen] = useState<boolean>(false);
  const showEditTimerButton = isEditTimerButtonVisible('MentalMathTab');
  const showAutoNextButton = isAutoNextButtonVisible('MentalMathTab');

  // ==================== FLOW 1: PHÉP NHÂN 2 CHỮ SỐ ====================
  if (currentPage === 'challenge-page') {
    return (
      <TwoDigitMentalMathChallengePage
        initialTopic={challengeTopic}
        onBack={() => setCurrentPage('two-digit-page')}
      />
    );
  }

  if (currentPage === 'two-digit-difficulty-challenge') {
    return (
      <TwoDigitMentalMathDifficultyChallengePage
        initialTopic={challengeTopic}
        onBack={() => setCurrentPage('two-digit-page')}
      />
    );
  }

  if (currentPage === 'visual-guide-page') {
    return (
      <TwoDigitMentalMathVisualGuidePage
        onBack={() => setCurrentPage('two-digit-page')}
        onOpenChallenge={() => setCurrentPage('challenge-page')}
      />
    );
  }

  if (currentPage === 'two-digit-page') {
    return (
      <TwoDigitMultiplicationPage
        initialTopic={trainingTopic}
        onBack={() => setCurrentPage('multiply-hub')}
        onOpenChallenge={(topic) => {
          if (topic) setChallengeTopic(topic);
          setCurrentPage('challenge-page');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setChallengeTopic(topic);
          setCurrentPage('two-digit-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('visual-guide-page')}
      />
    );
  }

  // ==================== FLOW 2: NHÂN VỚI SỐ 11 ====================
  if (currentPage === 'multiply-11-challenge') {
    return (
      <MultiplyBy11ChallengePage
        initialTopic={multiply11ChallengeTopic}
        onBack={() => setCurrentPage('multiply-11-page')}
      />
    );
  }

  if (currentPage === 'multiply-11-difficulty-challenge') {
    return (
      <MultiplyBy11DifficultyChallengePage
        initialTopic={multiply11ChallengeTopic}
        onBack={() => setCurrentPage('multiply-11-page')}
      />
    );
  }

  if (currentPage === 'multiply-11-visual-guide') {
    return (
      <MultiplyBy11VisualGuidePage
        onBack={() => setCurrentPage('multiply-11-page')}
        onOpenChallenge={() => setCurrentPage('multiply-11-challenge')}
      />
    );
  }

  if (currentPage === 'multiply-11-page') {
    return (
      <MultiplyBy11Page
        onBack={() => setCurrentPage('multiply-hub')}
        onOpenChallenge={(topic) => {
          if (topic) setMultiply11ChallengeTopic(topic);
          setCurrentPage('multiply-11-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setMultiply11ChallengeTopic(topic);
          setCurrentPage('multiply-11-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('multiply-11-visual-guide')}
      />
    );
  }

  // ==================== FLOW: NHÂN VỚI SỐ 99 ====================
  if (currentPage === 'multiply-99-challenge') {
    return (
      <MultiplyBy99ChallengePage
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onBack={() => setCurrentPage('multiply-99-page')}
      />
    );
  }

  if (currentPage === 'multiply-99-difficulty-challenge') {
    return (
      <MultiplyBy99DifficultyChallengePage
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onBack={() => setCurrentPage('multiply-99-page')}
      />
    );
  }

  if (currentPage === 'multiply-99-visual-guide') {
    return (
      <MultiplyBy99VisualGuidePage
        onBack={() => setCurrentPage('multiply-99-page')}
        onOpenChallenge={() => setCurrentPage('multiply-99-challenge')}
      />
    );
  }

  if (currentPage === 'multiply-99-page') {
    return (
      <MultiplyBy99Page
        onBack={() => setCurrentPage('multiply-hub')}
        initialTopic={multiply99ChallengeTopic}
        initialMultiplier={multiply99ChallengeMultiplier}
        onOpenChallenge={(topic, multiplier) => {
          if (topic) setMultiply99ChallengeTopic(topic);
          if (multiplier) setMultiply99ChallengeMultiplier(multiplier);
          setCurrentPage('multiply-99-challenge');
        }}
        onOpenHardChallenge={(topic, multiplier) => {
          if (topic) setMultiply99ChallengeTopic(topic);
          if (multiplier) setMultiply99ChallengeMultiplier(multiplier);
          setCurrentPage('multiply-99-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('multiply-99-visual-guide')}
      />
    );
  }

  // ==================== FLOW 3: NHÂN VỚI 1 CHỮ SỐ ====================
  if (currentPage === 'multiply-1-digit-challenge') {
    return (
      <MultiplyWith1DigitChallengePage
        initialTopic={multiply1DigitChallengeTopic}
        onBack={() => setCurrentPage('multiply-1-digit-page')}
      />
    );
  }

  if (currentPage === 'multiply-1-digit-difficulty-challenge') {
    return (
      <MultiplyWith1DigitDifficultyChallengePage
        initialTopic={multiply1DigitChallengeTopic}
        onBack={() => setCurrentPage('multiply-1-digit-page')}
      />
    );
  }

  if (currentPage === 'multiply-1-digit-visual-guide') {
    return (
      <MultiplyWith1DigitVisualGuidePage
        onBack={() => setCurrentPage('multiply-1-digit-page')}
        onOpenChallenge={() => setCurrentPage('multiply-1-digit-challenge')}
      />
    );
  }

  if (currentPage === 'multiply-1-digit-page') {
    return (
      <MultiplyWith1DigitPage
        onBack={() => setCurrentPage('multiply-hub')}
        onOpenChallenge={(topic) => {
          if (topic) setMultiply1DigitChallengeTopic(topic);
          setCurrentPage('multiply-1-digit-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setMultiply1DigitChallengeTopic(topic);
          setCurrentPage('multiply-1-digit-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('multiply-1-digit-visual-guide')}
      />
    );
  }

  // ==================== FLOW 4: PHÉP CHIA ====================
  if (currentPage === 'division-challenge') {
    return (
      <DivisionChallengePage
        initialTopic={divisionChallengeTopic}
        onBack={() => setCurrentPage('division-page')}
      />
    );
  }

  if (currentPage === 'division-difficulty-challenge') {
    return (
      <DivisionDifficultyChallengePage
        initialTopic={divisionChallengeTopic}
        onBack={() => setCurrentPage('division-page')}
      />
    );
  }

  if (currentPage === 'division-visual-guide') {
    return (
      <DivisionVisualGuidePage
        onBack={() => setCurrentPage('division-page')}
        onOpenChallenge={() => setCurrentPage('division-challenge')}
      />
    );
  }

  if (currentPage === 'division-page') {
    return (
      <DivisionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setDivisionChallengeTopic(topic);
          setCurrentPage('division-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setDivisionChallengeTopic(topic);
          setCurrentPage('division-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('division-visual-guide')}
      />
    );
  }

  // ==================== FLOW 5: PHÉP CỘNG ====================
  if (currentPage === 'addition-challenge') {
    return (
      <AdditionChallengePage
        initialTopic={additionChallengeTopic}
        onBack={() => setCurrentPage('addition-page')}
      />
    );
  }

  if (currentPage === 'addition-difficulty-challenge') {
    return (
      <AdditionDifficultyChallengePage
        initialTopic={additionChallengeTopic}
        onBack={() => setCurrentPage('addition-page')}
      />
    );
  }

  if (currentPage === 'addition-visual-guide') {
    return (
      <AdditionVisualGuidePage
        onBack={() => setCurrentPage('addition-page')}
        onOpenChallenge={() => setCurrentPage('addition-challenge')}
      />
    );
  }

  if (currentPage === 'addition-page') {
    return (
      <AdditionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setAdditionChallengeTopic(topic);
          setCurrentPage('addition-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setAdditionChallengeTopic(topic);
          setCurrentPage('addition-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('addition-visual-guide')}
      />
    );
  }

  // ==================== FLOW 6: PHÉP TRỪ ====================
  if (currentPage === 'subtraction-challenge') {
    return (
      <SubtractionChallengePage
        initialTopic={subtractionChallengeTopic}
        onBack={() => setCurrentPage('subtraction-page')}
      />
    );
  }

  if (currentPage === 'subtraction-difficulty-challenge') {
    return (
      <SubtractionDifficultyChallengePage
        initialTopic={subtractionChallengeTopic}
        onBack={() => setCurrentPage('subtraction-page')}
      />
    );
  }

  if (currentPage === 'subtraction-visual-guide') {
    return (
      <SubtractionVisualGuidePage
        onBack={() => setCurrentPage('subtraction-page')}
        onOpenChallenge={() => setCurrentPage('subtraction-challenge')}
      />
    );
  }

  if (currentPage === 'subtraction-page') {
    return (
      <SubtractionPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setSubtractionChallengeTopic(topic);
          setCurrentPage('subtraction-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setSubtractionChallengeTopic(topic);
          setCurrentPage('subtraction-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('subtraction-visual-guide')}
      />
    );
  }

  // ==================== FLOW 7: CĂN BẬC 2 ====================
  if (currentPage === 'square-root-challenge') {
    return (
      <SquareRootChallengePage
        initialTopic={squareRootChallengeTopic}
        onBack={() => setCurrentPage('square-root-page')}
      />
    );
  }

  if (currentPage === 'square-root-difficulty-challenge') {
    return (
      <SquareRootDifficultyChallengePage
        initialTopic={squareRootChallengeTopic}
        onBack={() => setCurrentPage('square-root-page')}
      />
    );
  }

  if (currentPage === 'square-root-visual-guide') {
    return (
      <SquareRootVisualGuidePage
        onBack={() => setCurrentPage('square-root-page')}
        onOpenChallenge={() => setCurrentPage('square-root-challenge')}
      />
    );
  }

  if (currentPage === 'square-root-page') {
    return (
      <SquareRootPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setSquareRootChallengeTopic(topic);
          setCurrentPage('square-root-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setSquareRootChallengeTopic(topic);
          setCurrentPage('square-root-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('square-root-visual-guide')}
      />
    );
  }

  // ==================== FLOW 8: LŨY THỪA ====================
  if (currentPage === 'exponent-challenge') {
    return (
      <ExponentChallengePage
        initialTopic={exponentChallengeTopic}
        onBack={() => setCurrentPage('exponent-page')}
      />
    );
  }

  if (currentPage === 'exponent-difficulty-challenge') {
    return (
      <ExponentDifficultyChallengePage
        initialTopic={exponentChallengeTopic}
        onBack={() => setCurrentPage('exponent-page')}
      />
    );
  }

  if (currentPage === 'exponent-visual-guide') {
    return (
      <ExponentVisualGuidePage
        onBack={() => setCurrentPage('exponent-page')}
        onOpenChallenge={() => setCurrentPage('exponent-challenge')}
      />
    );
  }

  if (currentPage === 'exponent-page') {
    return (
      <ExponentPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setExponentChallengeTopic(topic);
          setCurrentPage('exponent-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setExponentChallengeTopic(topic);
          setCurrentPage('exponent-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('exponent-visual-guide')}
      />
    );
  }

  // ==================== FLOW 9: TỶ LỆ % (3 CARD CON) ====================
  if (currentPage === 'percentage-challenge') {
    return (
      <PercentageChallengePage
        mode={percentageMode}
        initialTopic={percentageChallengeTopic}
        onBack={() => setCurrentPage('percentage-page')}
      />
    );
  }

  if (currentPage === 'percentage-difficulty-challenge') {
    return (
      <PercentageDifficultyChallengePage
        mode={percentageMode}
        initialTopic={percentageChallengeTopic}
        onBack={() => setCurrentPage('percentage-page')}
      />
    );
  }

  if (currentPage === 'percentage-visual-guide') {
    return (
      <PercentageVisualGuidePage
        mode={percentageMode}
        onBack={() => setCurrentPage('percentage-page')}
        onOpenChallenge={() => setCurrentPage('percentage-challenge')}
      />
    );
  }

  if (currentPage === 'percentage-page') {
    return (
      <PercentagePage
        mode={percentageMode}
        onBack={() => setCurrentPage('percentage-hub')}
        onOpenChallenge={(topic) => {
          if (topic) setPercentageChallengeTopic(topic);
          setCurrentPage('percentage-challenge');
        }}
        onOpenHardChallenge={(topic) => {
          if (topic) setPercentageChallengeTopic(topic);
          setCurrentPage('percentage-difficulty-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('percentage-visual-guide')}
      />
    );
  }

  // ==================== FLOW 10: RÈN LUYỆN PHẢN XẠ TÍNH NHẨM HÀNG NGÀY ====================
  if (currentPage === 'daily-reflex-challenge') {
    return (
      <DailyReflexChallengePage
        initialMode={dailyReflexMode}
        onBack={() => setCurrentPage('daily-reflex-page')}
      />
    );
  }

  if (currentPage === 'daily-reflex-difficulty-challenge') {
    return (
      <DailyReflexDifficultyChallengePage
        initialMode={dailyReflexMode}
        onBack={() => setCurrentPage('daily-reflex-page')}
      />
    );
  }

  if (currentPage === 'daily-reflex-page') {
    return (
      <DailyReflexPage
        initialMode={dailyReflexMode}
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(mode) => {
          if (mode) setDailyReflexMode(mode);
          setCurrentPage('daily-reflex-challenge');
        }}
        onOpenHardChallenge={(mode) => {
          if (mode) setDailyReflexMode(mode);
          setCurrentPage('daily-reflex-difficulty-challenge');
        }}
      />
    );
  }

  // ==================== SUB-PAGE: CARD CHA "PHÉP NHÂN" (3 CARD CON) ====================
  if (currentPage === 'multiply-hub') {
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
                  isVi
                    ? 'Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)'
                    : 'Customize auto-switch delay globally or per page'
                }
              >
                <TimerReset className="w-3.5 h-3.5" />
                <span>{isVi ? 'Đổi câu hỏi' : 'Auto-Next'}</span>
              </button>
            )}
            {showEditTimerButton && (
              <button
                type="button"
                onClick={() => setIsTimerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-bold cursor-pointer active:scale-95"
                title={isVi ? 'Chỉnh sửa Timer toàn Tab hoặc từng Page' : 'Edit Timer globally or per page'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isVi ? 'Chỉnh sửa Timer' : 'Edit Timer'}</span>
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
            isCardVisible('mm:multiply-2-digit') && (
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
            isCardVisible('mm:multiply-11') && (
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
            isCardVisible('mm:multiply-1-digit') && (
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
            isCardVisible('mm:multiply-99') && (
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
                    {isVi ? 'Các card con của Phép nhân đang ẩn' : 'Multiplication sub-cards are hidden'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildCardsVisibility('mm:multiply', true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Hiện lại card con' : 'Show Sub-cards'}</span>
                    </button>
                    {onOpenCardVisibility && (
                      <button
                        type="button"
                        onClick={onOpenCardVisibility}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                      >
                        <span>{isVi ? 'Tùy chỉnh chi tiết' : 'Customize'}</span>
                      </button>
                    )}
                  </div>
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
  if (currentPage === 'percentage-hub') {
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
                  isVi
                    ? 'Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)'
                    : 'Customize auto-switch delay globally or per page'
                }
              >
                <TimerReset className="w-3.5 h-3.5" />
                <span>{isVi ? 'Đổi câu hỏi' : 'Auto-Next'}</span>
              </button>
            )}
            {showEditTimerButton && (
              <button
                type="button"
                onClick={() => setIsTimerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-bold cursor-pointer active:scale-95"
                title={isVi ? 'Chỉnh sửa Timer toàn Tab hoặc từng Page' : 'Edit Timer globally or per page'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isVi ? 'Chỉnh sửa Timer' : 'Edit Timer'}</span>
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
            isCardVisible('mm:percentage-basic') && (
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
            isCardVisible('mm:percentage-change') && (
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
            isCardVisible('mm:percentage-reverse') && (
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
                    {isVi ? 'Các card con của Tỷ lệ % đang ẩn' : 'Percentage sub-cards are hidden'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildCardsVisibility('mm:percentage', true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Hiện lại card con' : 'Show Sub-cards'}</span>
                    </button>
                    {onOpenCardVisibility && (
                      <button
                        type="button"
                        onClick={onOpenCardVisibility}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                      >
                        <span>{isVi ? 'Tùy chỉnh chi tiết' : 'Customize'}</span>
                      </button>
                    )}
                  </div>
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
  const mainCards: Array<{
    id: string;
    visibilityId: CardVisibilityId;
    title: string;
    subtitle?: string;
    image: string;
    wrapTitle?: boolean;
    onSelect: () => void;
  }> = [
    {
      id: 'multiply',
      visibilityId: 'mm:multiply',
      title: t.cardMultiplyTitle,
      subtitle: t.cardMultiplySub,
      image: cardMultiplyBg,
      onSelect: () => setCurrentPage('multiply-hub'),
    },
    {
      id: 'division',
      visibilityId: 'mm:division',
      title: t.cardDivideTitle,
      image: cardDivideBg,
      onSelect: () => setCurrentPage('division-page'),
    },
    {
      id: 'addition',
      visibilityId: 'mm:addition',
      title: t.cardAddTitle,
      image: cardAddBg,
      onSelect: () => setCurrentPage('addition-page'),
    },
    {
      id: 'subtraction',
      visibilityId: 'mm:subtraction',
      title: t.cardSubtractTitle,
      image: cardSubtractBg,
      onSelect: () => setCurrentPage('subtraction-page'),
    },
    {
      id: 'square-root',
      visibilityId: 'mm:square-root',
      title: t.cardSqrtTitle,
      image: cardSqrtBg,
      onSelect: () => setCurrentPage('square-root-page'),
    },
    {
      id: 'exponent',
      visibilityId: 'mm:exponent',
      title: t.cardPowerTitle,
      image: cardPowerBg,
      onSelect: () => setCurrentPage('exponent-page'),
    },
    {
      id: 'percentage',
      visibilityId: 'mm:percentage',
      title: t.cardPercentTitle,
      subtitle: t.cardPercentSub,
      image: cardPercentBg,
      onSelect: () => setCurrentPage('percentage-hub'),
    },
    {
      id: 'daily-reflex',
      visibilityId: 'mm:daily-reflex',
      title: t.cardDailyReflexTitle,
      subtitle: t.cardDailyReflexSub,
      image: cardBg,
      wrapTitle: true,
      onSelect: () => setCurrentPage('daily-reflex-page'),
    },
  ];

  const visibleMainCards = mainCards.filter((card) =>
    isCardVisible(card.visibilityId)
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
                isVi
                  ? 'Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ Mental Math hoặc theo từng Page)'
                  : 'Customize auto-switch delay to next question (Globally or per Page)'
              }
            >
              <TimerReset className="w-4 h-4 text-cyan-400" />
              <span>{isVi ? 'Tùy chỉnh đổi câu (Giây)' : 'Auto-Switch Delay'}</span>
            </button>
          )}

          {showEditTimerButton && (
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/50 text-slate-200 hover:text-yellow-200 shadow-lg transition-all text-xs sm:text-sm font-bold cursor-pointer active:scale-95"
              title={
                isVi
                  ? 'Chỉnh sửa Timer cho toàn Tab Mental Math hoặc riêng lẻ từng page'
                  : 'Edit Timer for all Mental Math pages or individually per page'
              }
            >
              <Clock className="w-4 h-4 text-yellow-400" />
              <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-300" />
              <span>{isVi ? 'Chỉnh sửa Timer' : 'Edit Timer'}</span>
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
                {isVi ? 'Tất cả Card trong Tab này đang ẩn' : 'All Cards in this Tab are Hidden'}
              </h2>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Bạn có thể bật hiển thị lại toàn bộ hoặc chọn từng card chi tiết cho Tab Tính nhẩm.'
                  : 'You can re-enable all cards or customize individual cards for Mental Math.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTabCardsVisibility('mental-math', true, true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isVi ? 'Hiện lại tất cả' : 'Show All'}</span>
              </button>
              {onOpenCardVisibility && (
                <button
                  type="button"
                  onClick={onOpenCardVisibility}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>{isVi ? 'Tùy chỉnh chi tiết' : 'Customize Cards'}</span>
                </button>
              )}
            </div>
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
