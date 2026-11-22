import React, { useState } from 'react';
import { TabType } from './types/tab';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MentalMathTab } from './components/mental-math/MentalMathTab';
import { LociJourneyTab } from './components/loci-journey/LociJourneyTab';
import { BrainTrainingTab } from './components/brain-training/BrainTrainingTab';
import { MobileTabBar } from './components/common/MobileTabBar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { EmailModal } from './components/common/EmailModal';
import { LanguageProvider } from './context/LanguageContext';

function DashboardApp() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'loci-journey' || tabParam === 'mental-math' || tabParam === 'brain-training') {
        return tabParam as TabType;
      }
    }
    return 'mental-math';
  });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Top Bar Navigation with 2 Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col justify-center">
        <main className="pb-20 md:pb-4">
          {activeTab === 'mental-math' && <MentalMathTab />}
          {activeTab === 'loci-journey' && <LociJourneyTab />}
          {activeTab === 'brain-training' && <BrainTrainingTab />}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Email Form Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Compact Professional Footer */}
      <Footer
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
      />
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
