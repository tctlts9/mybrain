import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <aside
      aria-label="Network connection status"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl border border-amber-300/40">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span>{t.offlineNotice}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-emerald-400/40">
          <Wifi className="w-4 h-4 text-white shrink-0" />
          <span>
            {language === 'vi' ? 'Đã kết nối lại Internet thành công.' : 'Back Online — Internet connection restored.'}
          </span>
        </div>
      )}
    </aside>
  );
};
