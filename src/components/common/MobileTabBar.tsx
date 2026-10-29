import React from 'react';
import { TabType } from '../../types/tab';
import { Brain, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MobileTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  return (
    <nav
      aria-label="Thanh điều hướng tab dưới cùng màn hình"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 md:hidden pb-[env(safe-area-inset-bottom,0px)] shadow-2xl shadow-black"
    >
      <div className="grid grid-cols-2 items-center h-16 max-w-md mx-auto px-2 gap-2">
        {/* Tab 1: Mental Math */}
        <button
          onClick={() => onTabChange('mental-math')}
          className={`flex flex-col items-center justify-center h-12 rounded-xl transition-all cursor-pointer px-1 ${
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
          <span className="text-[11px] sm:text-xs mt-1 font-semibold truncate max-w-full">
            {t.tabMentalMath}
          </span>
        </button>

        {/* Tab 2: Hành trình ký ức Loci */}
        <button
          onClick={() => onTabChange('loci-journey')}
          className={`flex flex-col items-center justify-center h-12 rounded-xl transition-all cursor-pointer px-1 ${
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
          <span className="text-[11px] sm:text-xs mt-1 font-semibold truncate max-w-full">
            {t.tabLociJourney}
          </span>
        </button>
      </div>
    </nav>
  );
};
