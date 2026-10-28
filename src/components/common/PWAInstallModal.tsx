import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';
import { Smartphone, Download, Share, PlusSquare, X, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-950/80 border border-amber-500/40 flex items-center justify-center p-1.5 shadow-lg shadow-amber-500/20">
            <img src="./icon.svg" alt="MY BRAIN ACADEMY" className="w-full h-full" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.installModalTitle}</h3>
            <p className="text-xs text-slate-400">{t.installModalSubtitle}</p>
          </div>
        </div>

        {/* Status / Instruction Body */}
        <div className="mt-5 space-y-4 text-xs">
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block font-semibold">
                  {language === 'vi' ? 'Đã cài đặt hoàn tất!' : 'Already Installed!'}
                </strong>
                <span>{t.alreadyInstalled}</span>
              </div>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2.5">
                <span className="font-semibold text-amber-400 block">{t.iosInstructionsTitle}:</span>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </div>
                  <div>
                    {t.iosStep1} <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </div>
                  <div>
                    {t.iosStep2} <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </div>
                  <div>
                    {t.iosStep3}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                {language === 'vi' 
                  ? 'Ứng dụng hỗ trợ ngoại tuyến và hoạt động mượt mà như app gốc.'
                  : 'Fast launching with offline caching capabilities.'}
              </div>
            </div>
          ) : (
            /* Android / Chrome / Desktop flow */
            <div className="space-y-4">
              <p className="text-slate-300">
                {language === 'vi'
                  ? 'Cài đặt ứng dụng trực tiếp lên thiết bị để khởi chạy tức thì và không phụ thuộc vào thanh địa chỉ trình duyệt.'
                  : 'Install the app directly on your home screen or desktop for fast standalone performance.'}
              </p>

              {isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.installNow}</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  {language === 'vi'
                    ? 'Nhấn vào biểu tượng Cài đặt trên thanh địa chỉ trình duyệt Chrome hoặc menu chia sẻ để cài đặt.'
                    : 'To install, click the install icon in your browser address bar or use the browser menu.'}
                </div>
              )}

              {installSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-medium">
                  {language === 'vi' ? 'Cài đặt ứng dụng thành công!' : 'App installed successfully!'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
