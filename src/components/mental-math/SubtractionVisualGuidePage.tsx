/**
 * ============================================================================
 * FILE: SubtractionVisualGuidePage.tsx — TRANG HƯỚNG DẪN TRỰC QUAN (PHÉP TRỪ)
 * ============================================================================
 * Công việc của file:
 * 1. Hiển thị thanh điều hướng trên cùng (nút Quay lại Luyện tập Phép trừ + nút Thử thách theo buttonVisibility.ts).
 * 2. Nhúng component SubtractionGuideCarousel trình bày trực quan các mẹo trừ nhẩm từ trái sang phải và bù tròn số.
 * ============================================================================
 */
import React from 'react';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import { SubtractionGuideCarousel } from './SubtractionGuideCarousel';
import { isChallengeButtonVisible } from '../../config/buttonVisibility';

interface SubtractionVisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const SubtractionVisualGuidePage: React.FC<SubtractionVisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      {/* Thanh điều hướng trên cùng: Nút Quay lại & Nút chuyển sang Thử thách */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{tr("Quay lại Luyện tập Phép trừ")}</span>
        </button>

        <div className="flex items-center gap-2">
          {isChallengeButtonVisible('SubtractionVisualGuidePage') && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{tr("Thử Thách Phép Trừ")}</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{tr("Phép trừ")}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{tr("Hướng Dẫn Trực Quan")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Khung Carousel trình bày các slide hướng dẫn trực quan Phép trừ */}
      <SubtractionGuideCarousel />
    </div>
  );
};
