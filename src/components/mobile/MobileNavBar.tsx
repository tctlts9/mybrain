import React from 'react';
import { TabType } from '../../types/dashboard';
import { Brain, ShieldCheck, Coins } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MobileNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-3 items-center h-16 px-2">
        {/* Tab 1: XAUUSD */}
        <button
          onClick={() => onTabChange('xauusd')}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full rounded-xl transition-all cursor-pointer ${
            activeTab === 'xauusd'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className={`w-5 h-5 transition-transform ${activeTab === 'xauusd' ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t.mobileXauusd}</span>
          {activeTab === 'xauusd' && (
            <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* Tab 2: Prop Firm */}
        <button
          onClick={() => onTabChange('propfirm')}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full rounded-xl transition-all cursor-pointer ${
            activeTab === 'propfirm'
              ? 'text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 transition-transform ${activeTab === 'propfirm' ? 'scale-110 text-blue-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t.mobilePropfirm}</span>
          {activeTab === 'propfirm' && (
            <span className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* Tab 3: Backcom */}
        <button
          onClick={() => onTabChange('backcom')}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full rounded-xl transition-all cursor-pointer ${
            activeTab === 'backcom'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className={`w-5 h-5 transition-transform ${activeTab === 'backcom' ? 'scale-110 text-emerald-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t.mobileBackcom}</span>
          {activeTab === 'backcom' && (
            <span className="w-1 h-1 bg-emerald-400 rounded-full mt-0.5"></span>
          )}
        </button>
      </div>
    </nav>
  );
};
