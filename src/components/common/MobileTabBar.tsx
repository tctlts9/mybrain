import React from 'react';
import { TabType } from '../../types/tab';
import { Brain, Compass, Zap } from 'lucide-react';
import { useLanguage } from '../../context/Translations';

import { getVisibleTabs } from '../../config/pageVisibility';

interface MobileTabBarProps {
  activeTab: TabType | null;
  onTabChange: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();
  const visibleTabs = getVisibleTabs();

  if (visibleTabs.length === 0) return null;

  const gridColsClass =
    visibleTabs.length === 1
      ? 'grid-cols-1'
      : visibleTabs.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <nav
      aria-label="Thanh điều hướng tab dưới cùng màn hình"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 md:hidden pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] shadow-2xl shadow-black"
    >
      <div className={`mobile-tab-bar-inner grid ${gridColsClass} items-center h-16 max-w-md mx-auto px-2 gap-1.5`}>
        {visibleTabs.map((tab) => {
          if (tab === 'mental-math') {
            return (
              <button
                key="mental-math"
                onClick={() => onTabChange('mental-math')}
                className={`mobile-tab-bar-btn flex flex-col items-center justify-center h-12 rounded-xl transition-all cursor-pointer px-1 ${
                  activeTab === 'mental-math'
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="relative">
                  <Brain
                    className={`w-5 h-5 transition-transform ${
                      activeTab === 'mental-math' ? 'scale-110 text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  {activeTab === 'mental-math' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                  )}
                </div>
                <span className="mobile-tab-bar-label text-[11px] sm:text-xs mt-1 font-semibold truncate max-w-full">
                  {t.mobileMentalMath}
                </span>
              </button>
            );
          }

          if (tab === 'loci-journey') {
            return (
              <button
                key="loci-journey"
                onClick={() => onTabChange('loci-journey')}
                className={`mobile-tab-bar-btn flex flex-col items-center justify-center h-12 rounded-xl transition-all cursor-pointer px-1 ${
                  activeTab === 'loci-journey'
                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="relative">
                  <Compass
                    className={`w-5 h-5 transition-transform ${
                      activeTab === 'loci-journey' ? 'scale-110 text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  {activeTab === 'loci-journey' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>
                <span className="mobile-tab-bar-label text-[11px] sm:text-xs mt-1 font-semibold truncate max-w-full">
                  {t.mobileLociJourney}
                </span>
              </button>
            );
          }

          return (
            <button
              key="brain-training"
              onClick={() => onTabChange('brain-training')}
              className={`mobile-tab-bar-btn flex flex-col items-center justify-center h-12 rounded-xl transition-all cursor-pointer px-1 ${
                activeTab === 'brain-training'
                  ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/40 shadow-sm shadow-sky-500/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="relative">
                <Zap
                  className={`w-5 h-5 transition-transform ${
                    activeTab === 'brain-training' ? 'scale-110 text-sky-400' : 'text-slate-400'
                  }`}
                />
                {activeTab === 'brain-training' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="mobile-tab-bar-label text-[11px] sm:text-xs mt-1 font-semibold truncate max-w-full">
                {t.mobileBrainTraining}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
