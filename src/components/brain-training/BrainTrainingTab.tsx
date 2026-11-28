/**
 * ============================================================================
 * FILE: BrainTrainingTab.tsx — TAB RÈN LUYỆN NÃO BỘ (BRAIN TRAINING)
 * ============================================================================
 * Công việc của file:
 * 1. Quản lý điều hướng giữa màn hình danh sách Card và 3 trang con của Bảng Schulte:
 *    - SchulteTablePage (Luyện tập tự do)
 *    - SchulteTableChallengePage (Thử thách tốc độ 3 vòng)
 *    - SchulteTableDifficultyChallengePage (Thử thách cấp độ khó: Hard / Pro / Pro+)
 * 2. Áp dụng kiểm tra hiển thị Page từ pageVisibility.ts và hiển thị Card từ cardVisibility.ts.
 * 3. Lưu kích thước lưới (3x3..6x6) đang chọn để truyền đồng bộ khi chuyển giữa các trang con.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import {
  ENABLE_BROWSER_CARD_OVERRIDES,
  isTabMasterCardVisible,
  setTabCardsVisibility,
  useCardVisibility,
} from '../../config/cardVisibility';
import { isPageVisible } from '../../config/pageVisibility';
import { SchulteTablePage } from './SchulteTablePage';
import {
  SchulteTableChallengePage,
  SchulteGridSize,
} from './SchulteTableChallengePage';
import { SchulteTableDifficultyChallengePage } from './SchulteTableDifficultyChallengePage';
import { CrossMathPage } from './CrossMathPage';
import schulteTableBg from '../../assets/images/Brain Training/SchulteTable.jpg';
import crossMathBg from '../../assets/images/cross_math_card_1795842646280.jpg';

// Định danh các màn hình con bên trong Tab Brain Training
type BrainTrainingPage =
  | 'card'
  | 'schulte-table'
  | 'schulte-challenge'
  | 'schulte-difficulty-challenge'
  | 'cross-math';

interface BrainTrainingTabProps {
  onOpenCardVisibility?: () => void;
}

export const BrainTrainingTab: React.FC<BrainTrainingTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { tr } = useLanguage();
  const { isCardVisible } = useCardVisibility();
  const [currentPage, setCurrentPage] = useState<BrainTrainingPage>('card');
  const [challengeGridSize, setChallengeGridSize] = useState<SchulteGridSize>(5);

  const canRestoreInUi =
    ENABLE_BROWSER_CARD_OVERRIDES && isTabMasterCardVisible('brain-training');

  // --- Luồng 1: Trang Thử thách Bảng Schulte (chỉ mở nếu Page được bật) ---
  if (
    currentPage === 'schulte-challenge' &&
    isPageVisible('SchulteTableChallengePage')
  ) {
    return (
      <SchulteTableChallengePage
        initialGridSize={challengeGridSize}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SchulteTablePage') ? 'schulte-table' : 'card'
          )
        }
        onOpenDifficultyChallenge={
          isPageVisible('SchulteTableDifficultyChallengePage')
            ? (size) => {
                setChallengeGridSize(size);
                setCurrentPage('schulte-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  // --- Luồng 2: Trang Thử thách Cấp độ khó Bảng Schulte ---
  if (
    currentPage === 'schulte-difficulty-challenge' &&
    isPageVisible('SchulteTableDifficultyChallengePage')
  ) {
    return (
      <SchulteTableDifficultyChallengePage
        initialGridSize={challengeGridSize}
        onBack={() =>
          setCurrentPage(
            isPageVisible('SchulteTablePage') ? 'schulte-table' : 'card'
          )
        }
      />
    );
  }

  // --- Luồng 3: Trang Luyện tập Bảng Schulte ---
  if (currentPage === 'schulte-table' && isPageVisible('SchulteTablePage')) {
    return (
      <SchulteTablePage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={
          isPageVisible('SchulteTableChallengePage')
            ? (size) => {
                setChallengeGridSize(size);
                setCurrentPage('schulte-challenge');
              }
            : undefined
        }
        onOpenDifficultyChallenge={
          isPageVisible('SchulteTableDifficultyChallengePage')
            ? (size) => {
                setChallengeGridSize(size);
                setCurrentPage('schulte-difficulty-challenge');
              }
            : undefined
        }
      />
    );
  }

  // --- Luồng 4: Trang Cross Math (Toán Ô Chữ) ---
  if (currentPage === 'cross-math' && isPageVisible('CrossMathPage')) {
    return <CrossMathPage onBack={() => setCurrentPage('card')} />;
  }

  // Kiểm tra trạng thái hiển thị của các Card trong Tab Brain Training
  const showSchulteCard =
    isCardVisible('bt:schulte-table') && isPageVisible('SchulteTablePage');
  const showCrossMathCard =
    isCardVisible('bt:cross-math') && isPageVisible('CrossMathPage');
  const hasAnyVisibleCard = showSchulteCard || showCrossMathCard;

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4">
      {/* Trạng thái khi toàn bộ Card trong Tab đang bị ẩn */}
      {!hasAnyVisibleCard ? (
        <div className="min-h-[280px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <EyeOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {tr("Tất cả Card trong Tab này đang ẩn")}
              </h2>
              <p className="text-xs text-slate-400">
                {tr("Bạn có thể bật hiển thị lại card của Tab Rèn luyện não bộ bất cứ lúc nào.")}
              </p>
            </div>
            {(canRestoreInUi || onOpenCardVisibility) && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {canRestoreInUi && (
                  <button
                    type="button"
                    onClick={() => setTabCardsVisibility('brain-training', true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-7 w-full max-w-md md:max-w-none mx-auto">
          {/* Card 1: Bảng Schulte 5x5 (Schulte Table) */}
          {showSchulteCard && (
            <div
              onClick={() => setCurrentPage('schulte-table')}
              role="button"
              tabIndex={0}
              aria-label={tr("Bảng Schulte 5x5 - Luyện tập ngay")}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentPage('schulte-table');
                }
              }}
              className="group relative rounded-2xl sm:rounded-3xl border border-sky-500/40 hover:border-sky-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-sky-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6"
            >
              {/* Background Image: SchulteTable.jpg */}
              <img
                src={schulteTableBg}
                alt="Schulte Table Brain Training"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
              />

              {/* Lớp phủ tương phản nhẹ */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/20 pointer-events-none" />

              {/* Viền ánh sáng xanh dương đồng điệu với hình ảnh */}
              <div className="absolute inset-0 ring-1 ring-inset ring-sky-400/20 group-hover:ring-sky-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

              {/* Hover CTA Pill */}
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/90 text-slate-950 shadow-md">
                  {tr("Luyện tập ngay →")}
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Cross Math — Toán Ô Chữ Logic */}
          {showCrossMathCard && (
            <div
              onClick={() => setCurrentPage('cross-math')}
              role="button"
              tabIndex={0}
              aria-label={tr("Cross Math - Toán Ô Chữ Logic - Luyện tập ngay", "Cross Math - Arithmetic Crossword - Practice Now")}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentPage('cross-math');
                }
              }}
              className="group relative rounded-2xl sm:rounded-3xl border border-emerald-500/40 hover:border-emerald-400 aspect-[16/9] w-full flex flex-col items-end justify-end text-center shadow-2xl transition-all duration-300 hover:shadow-emerald-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40"
            >
              <img
                src={crossMathBg}
                alt="Cross Math Brain Training"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
              />

              {/* Lớp phủ tạo độ tương phản chuẩn cho tiêu đề dưới đáy Card */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-slate-950/15 pointer-events-none" />

              {/* Viền ánh sáng ngọc lục bảo đồng điệu */}
              <div className="absolute inset-0 ring-1 ring-inset ring-emerald-400/20 group-hover:ring-emerald-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

              {/* Hover CTA */}
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/95 text-slate-950 shadow-md">
                  {tr("Luyện tập ngay →")}
                </span>
              </div>

              {/* Tiêu đề & mô tả đồng bộ phong cách thẻ Schulte */}
              <div className="relative z-10 w-full px-4 pb-3 sm:pb-4 pt-6 text-center pointer-events-none">
                <div className="text-sm sm:text-base font-extrabold tracking-wide text-amber-300 drop-shadow">
                  CROSS MATH ({tr("TOÁN Ô CHỮ", "ARITHMETIC CROSSWORD")})
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-200/95 leading-snug mt-0.5">
                  {tr(
                    "GHÉP SỐ VÀO Ô TRỐNG TẠO PHÉP TÍNH ĐÚNG · NHIỀU CẤP ĐỘ",
                    "PLACE NUMBERS TO SOLVE INTERLOCKING EQUATIONS · MULTI-LEVEL"
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
