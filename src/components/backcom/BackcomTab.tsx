import React from 'react';
import { Coins, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BackcomTab: React.FC = () => {
  const { language } = useLanguage();

  const isVi = language === 'vi';

  return (
    <div className="min-h-[460px] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-8 sm:p-14 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-sm">
          <Coins className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-emerald-300 border border-slate-700 mb-3">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isVi ? 'Trống (Sẽ bổ sung sau)' : 'Empty (Will be added later)'}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Backcom
        </h2>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          {isVi
            ? 'Nội dung trong Tab này hiện đang để trống và sẽ được thiết kế, bổ sung sau theo kế hoạch của bạn.'
            : 'The content in this tab is currently empty and will be designed and added later.'}
        </p>
      </div>
    </div>
  );
};
