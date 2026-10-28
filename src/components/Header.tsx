import React from 'react';
import { TabType } from '../types/dashboard';
import { Brain, ShieldCheck, Coins } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { language, setLanguage, countryCode, isDetecting, t } = useLanguage();

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'xauusd':
        return t.tabXauusd;
      case 'propfirm':
        return t.tabPropfirm;
      case 'backcom':
        return t.tabBackcom;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-6 h-14 sm:h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-950/80 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/25 p-1 shrink-0">
              {/* Superintelligence Quantum Brain Vector Icon */}
              <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left Hemisphere Organic Lobes */}
                <path d="M18 9C13 9 9.5 12.5 9.5 17C9.5 18.8 10.2 20.4 11.2 21.6C9.8 23.2 9.5 25.5 10.3 27.6C11.3 30.2 14.2 32.3 18 33V9Z" 
                      stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.5 17C14.5 16 16 18.5 18 17.5" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M12 23C14 22 15.5 24.5 18 23.5" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
                
                {/* Right Hemisphere Quantum Neural Circuits */}
                <path d="M22 9C27 9 30.5 12.5 30.5 17C30.5 18.8 29.8 20.4 28.8 21.6C30.2 23.2 30.5 25.5 29.7 27.6C28.7 30.2 25.8 32.3 22 33V9Z" 
                      stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 14H25.5L27 16H29.5" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 21H25L26.5 19H29.5" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 27H26L28 29" stroke="#818CF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Synaptic Core Nodes */}
                <circle cx="29.5" cy="16" r="1.5" fill="#38BDF8" />
                <circle cx="29.5" cy="19" r="1.5" fill="#38BDF8" />
                <circle cx="28" cy="29" r="1.5" fill="#818CF8" />
                
                {/* Central Singularity Core Spark */}
                <circle cx="20" cy="20.5" r="2.2" fill="#FFFFFF" />
                <circle cx="20" cy="20.5" r="1.2" fill="#F59E0B" />
              </svg>
            </div>
            <a
              href="#"
              className="text-sm sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
            >
              MY BRAIN <span className="text-amber-400 font-semibold">ACADEMY</span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('xauusd')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'xauusd'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Brain className="w-4 h-4 text-amber-400" />
              <span>{t.tabXauusd}</span>
            </button>

            <button
              onClick={() => onTabChange('propfirm')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'propfirm'
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>{t.tabPropfirm}</span>
            </button>

            <button
              onClick={() => onTabChange('backcom')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'backcom'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>{t.tabBackcom}</span>
            </button>
          </nav>

          {/* Right Action: Clean Language Toggle (Only VI or EN) */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
              aria-label="Toggle Language (VI/EN)"
              className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-xs font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-sm active:scale-95 tracking-wider shrink-0"
            >
              {language === 'vi' ? 'VI' : 'EN'}
            </button>

            {/* Mobile Active Tab Badge */}
            <div className="flex md:hidden items-center">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${
                  activeTab === 'xauusd'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : activeTab === 'propfirm'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {activeTab === 'xauusd' && <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                {activeTab === 'propfirm' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                {activeTab === 'backcom' && <Coins className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="tracking-tight text-[11px]">{getTabLabel(activeTab)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
