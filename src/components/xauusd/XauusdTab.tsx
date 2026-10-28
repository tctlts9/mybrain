import React from 'react';
import { Brain, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const XauusdTab: React.FC = () => {
  const { language } = useLanguage();

  const isVi = language === 'vi';

  return (
    <div className="min-h-[460px] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-8 sm:p-14 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-sm">
          <Brain className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-amber-300 border border-slate-700 mb-3">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{isVi ? 'Trống (Sẽ bổ sung sau)' : 'Empty (Will be added later)'}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {isVi ? 'Tính nhẩm Siêu trí tuệ' : 'Super Mental Math'}
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
