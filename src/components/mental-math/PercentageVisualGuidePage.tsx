/**
 * ============================================================================
 * FILE: PercentageVisualGuidePage.tsx — TRANG HƯỚNG DẪN TRỰC QUAN (TỶ LỆ PHẦN TRĂM %)
 * ============================================================================
 * Công việc của file:
 * 1. Nhận chế độ phần trăm đang chọn (mode: 'basic' | 'change' | 'reverse') từ MentalMathTab.
 * 2. Kiểm tra quyền hiển thị nút "Thử thách" theo từng mode qua buttonVisibility.ts.
 * 3. Hiển thị thanh điều hướng trên cùng và component PercentageGuideCarousel tương ứng với mode.
 * ============================================================================
 */
import React from 'react';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import { PercentageGuideCarousel } from './PercentageGuideCarousel';
import { isChallengeButtonVisible } from '../../config/buttonVisibility';

// ============================================================================
// CẤU HÌNH METADATA TỶ LỆ PHẦN TRĂM % (CODE TRỰC TIẾP TRONG PAGE)
// ============================================================================
type PercentageMode = 'basic' | 'change' | 'reverse';

interface PercentageTopic {
  id: string;
  labelVi: string;
  labelEn: string;
  badgeVi: string;
  badgeEn: string;
}

interface PercentageModeMeta {
  id: PercentageMode;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  topics: PercentageTopic[];
}

const PERCENTAGE_META: Record<PercentageMode, PercentageModeMeta> = {
  basic: {
    id: 'basic',
    titleVi: 'Tính % Của Một Số',
    titleEn: 'Basic Percentages',
    subtitleVi: 'Mốc chuẩn 10%·25%·50%, kỹ thuật tách % và mẹo đảo ngược x% của y',
    subtitleEn: 'Benchmark 10%·25%·50%, split percentages, and the x% of y flip trick',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tính % siêu tốc', badgeEn: 'General: Fast Percentage Math' },
      { id: 'benchmarks', labelVi: 'Mốc chuẩn', labelEn: 'Benchmarks', badgeVi: 'Chuyên đề: Mốc 10% · 20% · 25% · 50% · 75%', badgeEn: 'Topic: 10% · 20% · 25% · 50% · 75%' },
      { id: 'split', labelVi: 'Tách % lẻ', labelEn: 'Split %', badgeVi: 'Chuyên đề: Tách 15% · 35% · 12% · 18% · 65%', badgeEn: 'Topic: Split 15% · 35% · 12% · 18% · 65%' },
      { id: 'flip', labelVi: 'Đảo x% ↔ y%', labelEn: 'Flip x% of y', badgeVi: 'Chuyên đề: Đảo x% của y = y% của x', badgeEn: 'Topic: Reversible x% of y = y% of x' },
    ],
  },
  change: {
    id: 'change',
    titleVi: 'Tăng / Giảm Tỷ Lệ %',
    titleEn: 'Percentage Increase & Decrease',
    subtitleVi: 'Nhẩm nhanh tăng %, giảm % và tính giá sau chiết khấu tức thì',
    subtitleEn: 'Instant mental % increase, % decrease, and real-world discount pricing',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tăng & Giảm %', badgeEn: 'General: % Increase & Decrease' },
      { id: 'increase', labelVi: 'Tăng (+%)', labelEn: 'Increase (+%)', badgeVi: 'Chuyên đề: Cộng tăng thêm % (+10% đến +50%)', badgeEn: 'Topic: Percentage Increase (+10% to +50%)' },
      { id: 'decrease', labelVi: 'Giảm (−%)', labelEn: 'Decrease (−%)', badgeVi: 'Chuyên đề: Trừ giảm bớt % (−10% đến −50%)', badgeEn: 'Topic: Percentage Decrease (−10% to −50%)' },
      { id: 'discount', labelVi: 'Chiết khấu', labelEn: 'Discounts', badgeVi: 'Chuyên đề: Tính giá sau giảm % qua phần bù', badgeEn: 'Topic: Complement Method for Discounts' },
    ],
  },
  reverse: {
    id: 'reverse',
    titleVi: 'Tìm Tỷ Lệ & Số Gốc',
    titleEn: 'Ratio & Reverse %',
    subtitleVi: 'Tìm A chiếm bao nhiêu % của B, tìm số gốc 100% và tỷ lệ tăng trưởng',
    subtitleEn: 'Find what % A is of B, recover 100% base value, and compute % growth',
    topics: [
      { id: 'general', labelVi: 'Tổng quát', labelEn: 'General', badgeVi: 'Tổng quát: Tỷ lệ & Tìm số gốc', badgeEn: 'General: Ratios & Reverse %' },
      { id: 'findRate', labelVi: 'Tìm tỷ lệ ?%', labelEn: 'Find ?%', badgeVi: 'Chuyên đề: A bằng bao nhiêu % của B', badgeEn: 'Topic: A is ?% of B' },
      { id: 'findWhole', labelVi: 'Tìm số gốc', labelEn: 'Find Whole', badgeVi: 'Chuyên đề: Biết P% của ? ⇒ Tìm 100%', badgeEn: 'Topic: Recover 100% from P%' },
      { id: 'growthRate', labelVi: 'Tăng trưởng', labelEn: 'Growth %', badgeVi: 'Chuyên đề: Tính % tăng từ A lên B', badgeEn: 'Topic: Percentage Growth A → B' },
    ],
  },
};

interface PercentageVisualGuidePageProps {
  mode: PercentageMode;
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const PercentageVisualGuidePage: React.FC<PercentageVisualGuidePageProps> = ({
  mode,
  onBack,
  onOpenChallenge,
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const meta = PERCENTAGE_META[mode];

  // Ánh xạ mode hiện tại sang key cấu hình Ẩn/Hiện nút Thử thách trong buttonVisibility.ts
  const pageVisibilityKey = `PercentageVisualGuidePage_${mode}` as
    | 'PercentageVisualGuidePage_basic'
    | 'PercentageVisualGuidePage_change'
    | 'PercentageVisualGuidePage_reverse';
  const showChallengeButton = isChallengeButtonVisible(pageVisibilityKey);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      {/* Thanh điều hướng trên cùng: Nút Quay lại & Nút mở Thử thách */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>
            {isVi
              ? `Quay lại ${meta.titleVi}`
              : `Back to ${meta.titleEn}`}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {showChallengeButton && onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{tr("Thử Thách Tỷ Lệ %")}</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? meta.titleVi : meta.titleEn}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{tr("Hướng Dẫn Trực Quan")}</span>
            </span>
          </div>
        </div>
      </div>

      <PercentageGuideCarousel mode={mode} />
    </div>
  );
};
