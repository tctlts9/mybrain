/**
 * ============================================================================
 * FILE: MultiplyBy99VisualGuidePage.tsx — TRANG HƯỚNG DẪN TRỰC QUAN (NHÂN VỚI 99)
 * ============================================================================
 * Công việc của file:
 * 1. Hiển thị thanh điều hướng trên cùng (nút Quay lại Luyện tập Nhân 99 + nút Thử thách theo buttonVisibility.ts).
 * 2. Nhúng component MultiplyBy99GuideCarousel minh họa mẹo bù 100 - 1 khi nhân với 99 / 999...
 * 3. Hiển thị thanh footer dưới cùng để chuyển nhanh sang Thử thách hoặc quay lại Luyện tập.
 * ============================================================================
 */
import React from 'react';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import { MultiplyBy99GuideCarousel } from './MultiplyBy99GuideCarousel';
import { isChallengeButtonVisible } from '../../config/buttonVisibility';

interface MultiplyBy99VisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const MultiplyBy99VisualGuidePage: React.FC<MultiplyBy99VisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      {/* Thanh điều hướng trên cùng: Nút Quay lại, nút Thử thách & Breadcrumb */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại Luyện tập Nhân 99")}</span>
        </button>

        <div className="flex items-center gap-2">
          {isChallengeButtonVisible('MultiplyBy99VisualGuidePage') && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
              title={tr("Thử thách Nhân 99 (2s - 12s)")}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{tr("Thử Thách Nhân 99")}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{tr("Nhân với số 99")}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-yellow-400" />
              <span>{tr("Hướng Dẫn Trực Quan")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Khung Carousel trình bày các slide hướng dẫn trực quan Nhân 99 */}
      <MultiplyBy99GuideCarousel />

      {/* Thanh hành động chân trang: Chuyển sang Thử thách hoặc Quay lại Luyện tập */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          {tr("Đã nắm vững bí quyết nhân 99? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Nhân 99 2s - 12s.")}
        </p>

        <div className="flex items-center gap-2">
          {isChallengeButtonVisible('MultiplyBy99VisualGuidePage') && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{tr("Thử Thách Nhân 99")}</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-yellow-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span>{tr("Quay lại Luyện tập [Hướng dẫn]")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
