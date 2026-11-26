import React, { useState } from 'react';
import { Youtube, Mail, Coffee } from 'lucide-react';
import { useLanguage } from '../context/Translations';
import { BuyCoffeeModal } from './common/BuyCoffeeModal';
import {
  SHOW_BUY_COFFEE_BUTTON,
  SHOW_YOUTUBE_BUTTON,
  SHOW_EMAIL_BUTTON,
} from '../config/buttonVisibility';

interface FooterProps {
  onOpenEmailModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenEmailModal,
}) => {
  const { t } = useLanguage();
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState<boolean>(false);

  return (
    <>
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* 2 Dòng text & Copyright 2026 */}
          <div className="flex flex-col text-center md:text-left gap-0.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-medium tracking-wide text-slate-400">
                Copyright © 2026
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="font-semibold text-amber-300 text-xs sm:text-sm tracking-wide">
                {t.footerQuoteLine1}
              </span>
            </div>
            <span className="text-slate-400 text-[11px] sm:text-xs italic">
              {t.footerQuoteLine2}
            </span>
          </div>

          {/* Action Buttons: Youtube, Email, Buy Coffee */}
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            {SHOW_YOUTUBE_BUTTON && (
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                <Youtube className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.youtube}</span>
              </a>
            )}

            {SHOW_EMAIL_BUTTON && (
              <button
                type="button"
                onClick={onOpenEmailModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.email}</span>
              </button>
            )}

            {SHOW_BUY_COFFEE_BUTTON && (
              <button
                type="button"
                onClick={() => setIsCoffeeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all text-xs font-semibold cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95 whitespace-nowrap shrink-0"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.buyCoffee}</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Buy Coffee Modal managed inside Footer */}
      <BuyCoffeeModal
        isOpen={isCoffeeModalOpen}
        onClose={() => setIsCoffeeModalOpen(false)}
      />
    </>
  );
};
