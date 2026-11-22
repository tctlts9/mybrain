import React from 'react';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PERCENTAGE_META, PercentageMode } from '../../utils/percentageOperations';
import { PercentageGuideCarousel } from './PercentageGuideCarousel';
import { isChallengeButtonVisible } from '../../config/buttonVisibility';

interface PercentageVisualGuidePageProps {
  mode: PercentageMode;
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const PercentageVisualGuidePage: React.FC<PercentageVisualGuidePageProps> = ({
  mode,
  onBack,
  onOpenChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const meta = PERCENTAGE_META[mode];
  const pageVisibilityKey = `PercentageVisualGuidePage_${mode}` as
    | 'PercentageVisualGuidePage_basic'
    | 'PercentageVisualGuidePage_change'
    | 'PercentageVisualGuidePage_reverse';
  const showChallengeButton = isChallengeButtonVisible(pageVisibilityKey);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#F4A7B9]/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#F4A7B9]" />
          <span>
            {isVi
              ? `Quay lại ${meta.titleVi}`
              : `Back to ${meta.titleEn}`}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {showChallengeButton && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{isVi ? 'Thử Thách Tỷ Lệ %' : 'Percentage Challenge'}</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? meta.titleVi : meta.titleEn}</span>
            <span className="text-slate-600">/</span>
            <span className="text-[#F4A7B9] font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </span>
          </div>
        </div>
      </div>

      <PercentageGuideCarousel mode={mode} />
    </div>
  );
};
