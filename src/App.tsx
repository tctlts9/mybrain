/**
 * ============================================================================
 * FILE: src/App.tsx — BỘ ĐIỀU PHỐI CHÍNH CỦA TOÀN BỘ WEB APP
 * ============================================================================
 * Công việc của file:
 * 1. Bọc toàn bộ ứng dụng trong LanguageProvider để hỗ trợ song ngữ Việt / Anh.
 * 2. Quản lý Tab đang hoạt động (activeTab: 'mental-math' | 'brain-training' | 'loci-journey')
 *    đồng thời kiểm tra quyền hiển thị Tab từ cấu hình src/config/pageVisibility.ts.
 * 3. Đọc tham số ?tab=... trên URL khi khởi tạo để mở đúng Tab nếu Tab đó đang được bật.
 * 4. Quản lý trạng thái mở/đóng các Modal dùng chung toàn App:
 *    - EmailModal (gửi phản hồi / liên hệ)
 *    - CardVisibilityModal (ẩn/hiện từng Card khi bật trong buttonVisibility.ts)
 * 5. Render bố cục khung chính: OfflineIndicator -> Header -> Nội dung Tab -> MobileTabBar -> Footer.
 * ============================================================================
 */
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
import { CardVisibilityModal } from './components/common/CardVisibilityModal';
import { LanguageProvider } from './context/Translations';
import {
  SHOW_CARD_VISIBILITY_BUTTON,
  isCardVisibilityButtonVisible,
} from './config/buttonVisibility';
import { getFirstVisibleTab, isTabVisible } from './config/pageVisibility';
import { useLanguage } from './context/Translations';

// Component nội dung chính bên trong LanguageProvider
function DashboardApp() {
  const { tr } = useLanguage();

  // State xác định Tab đang mở; ưu tiên tham số ?tab=... trên URL nếu hợp lệ và đang được bật
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const fallbackTab = getFirstVisibleTab() ?? 'mental-math';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        (tabParam === 'loci-journey' ||
          tabParam === 'mental-math' ||
          tabParam === 'brain-training') &&
        isTabVisible(tabParam)
      ) {
        return tabParam as TabType;
      }
    }
    return fallbackTab;
  });

  // State quản lý Modal Email và Modal Ẩn/Hiện Card toàn ứng dụng
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isCardVisibilityModalOpen, setIsCardVisibilityModalOpen] = useState<boolean>(false);
  const [cardVisibilityInitialTab, setCardVisibilityInitialTab] = useState<TabType | 'all'>('mental-math');

  // Nếu Tab hiện tại bị tắt trong pageVisibility.ts, tự động chuyển sang Tab khả dụng đầu tiên
  const resolvedActiveTab = isTabVisible(activeTab)
    ? activeTab
    : getFirstVisibleTab();

  // Hàm chuyển Tab an toàn (chỉ cho phép chuyển khi Tab đích đang bật)
  const handleTabChange = (nextTab: TabType) => {
    if (isTabVisible(nextTab)) {
      setActiveTab(nextTab);
    }
  };

  // Mở Modal quản lý Ẩn/Hiện Card và chọn sẵn Tab tương ứng
  const openCardVisibilityModal = (tabOverride?: TabType | 'all') => {
    setCardVisibilityInitialTab(tabOverride ?? resolvedActiveTab ?? 'all');
    setIsCardVisibilityModalOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Top Bar Navigation with Visible Tabs */}
      <Header
        activeTab={resolvedActiveTab}
        onTabChange={handleTabChange}
        onOpenCardVisibility={
          resolvedActiveTab && isCardVisibilityButtonVisible(resolvedActiveTab)
            ? () => openCardVisibilityModal(resolvedActiveTab)
            : undefined
        }
      />

      {/* Main Content Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col justify-center">
        <main className="pb-20 md:pb-4">
          {/* Trường hợp toàn bộ 3 Tab đều đang bị ẩn trong pageVisibility.ts */}
          {!resolvedActiveTab && (
            <div className="min-h-[280px] flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 text-center space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {tr("Hiện chưa có Tab nào được bật hiển thị", "No Tabs are currently enabled")}
                </h2>
                <p className="text-xs text-slate-400">
                  {tr("Vui lòng bật lại ít nhất một Tab trong cấu hình quản trị.", "Please enable at least one Tab in the configuration.")}
                </p>
              </div>
            </div>
          )}
          {/* Tab 1: Tính Nhẩm (Mental Math) */}
          {resolvedActiveTab === 'mental-math' && (
            <MentalMathTab
              onOpenCardVisibility={
                isCardVisibilityButtonVisible('mental-math')
                  ? () => openCardVisibilityModal('mental-math')
                  : undefined
              }
            />
          )}
          {resolvedActiveTab === 'loci-journey' && (
            <LociJourneyTab
              onOpenCardVisibility={
                isCardVisibilityButtonVisible('loci-journey')
                  ? () => openCardVisibilityModal('loci-journey')
                  : undefined
              }
            />
          )}
          {resolvedActiveTab === 'brain-training' && (
            <BrainTrainingTab
              onOpenCardVisibility={
                isCardVisibilityButtonVisible('brain-training')
                  ? () => openCardVisibilityModal('brain-training')
                  : undefined
              }
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation Bar */}
      <MobileTabBar
        activeTab={resolvedActiveTab}
        onTabChange={handleTabChange}
      />

      {/* Email Form Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Card Visibility Manager Modal */}
      {SHOW_CARD_VISIBILITY_BUTTON && (
        <CardVisibilityModal
          isOpen={isCardVisibilityModalOpen}
          onClose={() => setIsCardVisibilityModalOpen(false)}
          initialTab={cardVisibilityInitialTab}
        />
      )}

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
