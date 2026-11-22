import React, { useState } from 'react';
import { TimerReset } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  MentalMathAutoNextPageKey,
  formatAutoNextDelay,
  useMentalMathAutoNextConfig,
} from '../../config/mentalMathAutoNext';
import { isAutoNextButtonVisible } from '../../config/buttonVisibility';
import { MentalMathAutoNextModal } from './MentalMathAutoNextModal';

interface AutoNextSettingButtonProps {
  pageKey: MentalMathAutoNextPageKey;
  className?: string;
}

export const AutoNextSettingButton: React.FC<AutoNextSettingButtonProps> = ({
  pageKey,
  className,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [isOpen, setIsOpen] = useState(false);
  const config = useMentalMathAutoNextConfig(pageKey);
  const isVisible = isAutoNextButtonVisible(pageKey);

  if (!isVisible) {
    return null;
  }

  const delayLabel = formatAutoNextDelay(config.delaySec, isVi);
  const isCustomized = config.source !== 'default';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={
          isVi
            ? `Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Hiện tại: ${delayLabel})`
            : `Customize auto-switch delay to next question (Current: ${delayLabel})`
        }
        aria-label={
          isVi
            ? `Tùy chỉnh đổi câu (${delayLabel})`
            : `Auto-switch delay (${delayLabel})`
        }
        className={
          className ||
          `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
            isCustomized
              ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-200 hover:bg-cyan-500/25'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-slate-900'
          }`
        }
      >
        <TimerReset className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="hidden sm:inline">{isVi ? 'Đổi câu:' : 'Next:'}</span>
        <span className="font-mono tabular-nums text-cyan-300">{delayLabel}</span>
      </button>

      <MentalMathAutoNextModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialScope="page"
        initialPageKey={pageKey}
      />
    </>
  );
};
