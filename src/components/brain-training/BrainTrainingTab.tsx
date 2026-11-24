import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { setTabCardsVisibility, useCardVisibility } from '../../config/cardVisibility';
import { SchulteTablePage } from './SchulteTablePage';
import {
  SchulteTableChallengePage,
  SchulteGridSize,
} from './SchulteTableChallengePage';
import { SchulteTableDifficultyChallengePage } from './SchulteTableDifficultyChallengePage';
import schulteTableBg from '../../assets/images/Brain Training/SchulteTable.jpg';

type BrainTrainingPage =
  | 'card'
  | 'schulte-table'
  | 'schulte-challenge'
  | 'schulte-difficulty-challenge';

interface BrainTrainingTabProps {
  onOpenCardVisibility?: () => void;
}

export const BrainTrainingTab: React.FC<BrainTrainingTabProps> = ({
  onOpenCardVisibility,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { isCardVisible } = useCardVisibility();
  const [currentPage, setCurrentPage] = useState<BrainTrainingPage>('card');
  const [challengeGridSize, setChallengeGridSize] = useState<SchulteGridSize>(5);

  if (currentPage === 'schulte-challenge') {
    return (
      <SchulteTableChallengePage
        initialGridSize={challengeGridSize}
        onBack={() => setCurrentPage('schulte-table')}
        onOpenDifficultyChallenge={(size) => {
          setChallengeGridSize(size);
          setCurrentPage('schulte-difficulty-challenge');
        }}
      />
    );
  }

  if (currentPage === 'schulte-difficulty-challenge') {
    return (
      <SchulteTableDifficultyChallengePage
        initialGridSize={challengeGridSize}
        onBack={() => setCurrentPage('schulte-table')}
      />
    );
  }

  if (currentPage === 'schulte-table') {
    return (
      <SchulteTablePage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(size) => {
          setChallengeGridSize(size);
          setCurrentPage('schulte-challenge');
        }}
        onOpenDifficultyChallenge={(size) => {
          setChallengeGridSize(size);
          setCurrentPage('schulte-difficulty-challenge');
        }}
      />
    );
  }

  const showSchulteCard = isCardVisible('bt:schulte-table');

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4">
      {!showSchulteCard ? (
        <div className="min-h-[280px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <EyeOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isVi ? 'Tất cả Card trong Tab này đang ẩn' : 'All Cards in this Tab are Hidden'}
              </h2>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Bạn có thể bật hiển thị lại card của Tab Rèn luyện não bộ bất cứ lúc nào.'
                  : 'You can re-enable cards for Brain Training anytime.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTabCardsVisibility('brain-training', true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isVi ? 'Hiện lại tất cả' : 'Show All'}</span>
              </button>
              {onOpenCardVisibility && (
                <button
                  type="button"
                  onClick={onOpenCardVisibility}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>{isVi ? 'Tùy chỉnh chi tiết' : 'Customize Cards'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-7 w-full max-w-md md:max-w-none mx-auto">
          {/* Card 1: Bảng Schulte 5x5 (Schulte Table) */}
          <div
            onClick={() => setCurrentPage('schulte-table')}
            role="button"
            tabIndex={0}
            aria-label={isVi ? 'Bảng Schulte 5x5 - Luyện tập ngay' : '5x5 Schulte Table - Start training'}
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
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
            />

            {/* Lớp phủ tương phản nhẹ */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/20 pointer-events-none" />

            {/* Viền ánh sáng xanh dương đồng điệu với hình ảnh */}
            <div className="absolute inset-0 ring-1 ring-inset ring-sky-400/20 group-hover:ring-sky-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

            {/* Hover CTA Pill */}
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/90 text-slate-950 shadow-md">
                {isVi ? 'Luyện tập ngay →' : 'Start Training →'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
