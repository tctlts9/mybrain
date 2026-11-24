import React from 'react';
import { Compass, Clock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { setTabCardsVisibility, useCardVisibility } from '../../config/cardVisibility';

interface LociJourneyTabProps {
  onOpenCardVisibility?: () => void;
}

export const LociJourneyTab: React.FC<LociJourneyTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { language } = useLanguage();
  const { isCardVisible } = useCardVisibility();

  const isVi = language === 'vi';

  if (!isCardVisible('loci:memory-palace')) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                ? 'Bạn có thể bật hiển thị lại card của Tab Hành trình ký ức Loci bất cứ lúc nào.'
                : 'You can re-enable cards for the Memory Palace tab anytime.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTabCardsVisibility('loci-journey', true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
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
    );
  }

  return (
    <div className="min-h-[340px] sm:min-h-[400px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-6 sm:p-12 text-center">
        {/* Icon with Emerald / Cyan Glowing Aura for Memory Palace */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-emerald-300 border border-slate-700 mb-3">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isVi ? 'Trống (Sẽ thiết kế sau)' : 'Empty (Will be designed later)'}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Memory Palace
        </h2>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          {isVi
            ? 'Nội dung phần này hiện đang để trống và sẽ được thiết kế, bổ sung sau theo kế hoạch của bạn.'
            : 'This section is currently empty and will be designed and added later according to your plan.'}
        </p>
      </div>
    </div>
  );
};
