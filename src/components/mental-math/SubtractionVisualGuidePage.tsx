import React from 'react';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SubtractionGuideCarousel } from './SubtractionGuideCarousel';
import { isChallengeButtonVisible } from '../../config/buttonVisibility';

interface SubtractionVisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const SubtractionVisualGuidePage: React.FC<SubtractionVisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{isVi ? 'Quay lại Luyện tập Phép trừ' : 'Back to Subtraction Practice'}</span>
        </button>

        <div className="flex items-center gap-2">
          {isChallengeButtonVisible('SubtractionVisualGuidePage') && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{isVi ? 'Thử Thách Phép Trừ' : 'Subtraction Challenge'}</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Phép trừ' : 'Subtraction'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </span>
          </div>
        </div>
      </div>

      <SubtractionGuideCarousel />
    </div>
  );
};
