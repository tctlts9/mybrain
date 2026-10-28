import React, { useState } from 'react';
import { TabType } from './types/dashboard';
import { Header } from './components/Header';
import { XauusdTab } from './components/xauusd/XauusdTab';
import { PropFirmTab } from './components/propfirm/PropFirmTab';
import { BackcomTab } from './components/backcom/BackcomTab';
import { MobileNavBar } from './components/mobile/MobileNavBar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { EmailModal } from './components/common/EmailModal';
import { BuyCoffeeModal } from './components/common/BuyCoffeeModal';
import { PWAInstallModal } from './components/common/PWAInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Youtube, Mail, Coffee, Download } from 'lucide-react';

function DashboardApp() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'propfirm' || tabParam === 'backcom' || tabParam === 'xauusd') {
        return tabParam as TabType;
      }
    }
    return 'xauusd';
  });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const { isInstalled } = usePWAInstall();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <main className="pb-24 md:pb-8">
          {activeTab === 'xauusd' && <XauusdTab />}
          {activeTab === 'propfirm' && <PropFirmTab />}
          {activeTab === 'backcom' && <BackcomTab />}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Email Form Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Buy Coffee Modal */}
      <BuyCoffeeModal
        isOpen={isCoffeeModalOpen}
        onClose={() => setIsCoffeeModalOpen(false)}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-400">{t.copyright}</span>
          </div>

          {/* Action Buttons: Install App, Youtube, Email, Buy coffee */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isInstalled && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all text-xs font-semibold cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{t.installApp}</span>
              </button>
            )}

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
            >
              <Youtube className="w-4 h-4 text-rose-500" />
              <span>{t.youtube}</span>
            </a>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>{t.email}</span>
            </button>

            <button
              onClick={() => setIsCoffeeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all text-xs font-semibold cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>{t.buyCoffee}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DashboardApp />
    </LanguageProvider>
  );
}
