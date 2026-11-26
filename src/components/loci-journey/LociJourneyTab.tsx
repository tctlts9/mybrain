/**
 * ============================================================================
 * FILE: LociJourneyTab.tsx — TAB HÀNH TRÌNH KÝ ỨC (MEMORY PALACE / LOCI)
 * ============================================================================
 * Công việc của file:
 * 1. Hiển thị nội dung của Tab Loci Journey (hiện đang là trang chờ thiết kế).
 * 2. Kiểm tra trạng thái Ẩn/Hiện của Card 'loci:memory-palace' từ cardVisibility.ts.
 * 3. Nếu Card bị ẩn, hiển thị khung thông báo và nút bật lại Card (nếu được phép).
 * ============================================================================
 */
import React from 'react';
import { Compass, Clock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import {
  ENABLE_BROWSER_CARD_OVERRIDES,
  isTabMasterCardVisible,
  setTabCardsVisibility,
  useCardVisibility,
} from '../../config/cardVisibility';

interface LociJourneyTabProps {
  onOpenCardVisibility?: () => void;
}

export const LociJourneyTab: React.FC<LociJourneyTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { tr } = useLanguage();
  const { isCardVisible } = useCardVisibility();

  // Chỉ cho phép nút "Hiện lại tất cả" trên UI khi bật override trình duyệt và công tắc tổng của Tab đang mở
  const canRestoreInUi =
    ENABLE_BROWSER_CARD_OVERRIDES && isTabMasterCardVisible('loci-journey');

  // Giao diện khi Card chính của Tab Loci đang bị ẩn
  if (!isCardVisible('loci:memory-palace')) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <EyeOff className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white">
              {tr("Tất cả Card trong Tab này đang ẩn")}
            </h2>
            <p className="text-xs text-slate-400">
              {tr("Bạn có thể bật hiển thị lại card của Tab Hành trình ký ức Loci bất cứ lúc nào.")}
            </p>
          </div>
          {(canRestoreInUi || onOpenCardVisibility) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {canRestoreInUi && (
                <button
                  type="button"
                  onClick={() => setTabCardsVisibility('loci-journey', true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{tr("Hiện lại tất cả")}</span>
                </button>
              )}
              {onOpenCardVisibility && (
                <button
                  type="button"
                  onClick={onOpenCardVisibility}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>{tr("Tùy chỉnh chi tiết")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Giao diện chính của Tab Loci Journey (Placeholder chờ bổ sung tính năng Memory Palace)
  return (
    <div className="min-h-[340px] sm:min-h-[400px] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-6 sm:p-12 text-center">
        {/* Icon with Emerald / Cyan Glowing Aura for Memory Palace */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-emerald-300 border border-slate-700 mb-3">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{tr("Trống (Sẽ thiết kế sau)")}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Memory Palace
        </h2>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          {tr("Nội dung phần này hiện đang để trống và sẽ được thiết kế, bổ sung sau theo kế hoạch của bạn.")}
        </p>
      </div>
    </div>
  );
};
