import React from 'react';
import { ArrowLeft, BookOpen, Brain, Zap, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TwoDigitMentalMathGuideCarousel } from './TwoDigitMentalMathGuideCarousel';

interface VisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const TwoDigitMentalMathVisualGuidePage: React.FC<VisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      {/* Top Navigation Bar: Back button, Challenge button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Practice'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenChallenge && (
            <button
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Thử thách Tính nhẩm (5s / 10s)' : 'Mental Math Challenge (5s / 10s)'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Page Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/25 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5" />
              <span>{isVi ? 'Hướng dẫn trực quan chuyên sâu' : 'Visual Guide & Mind Mapping'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {isVi
                ? 'Sơ đồ tư duy trực quan giúp bạn nắm vững 2 phương pháp tính nhẩm phép nhân 2 chữ số siêu tốc: Tách số từng phần và Nhân chéo Vedic.'
                : 'Interactive step-by-step visual blueprint mastering two lightning-fast 2-digit multiplication methods: Partial Product Splitting and Vedic Cross Multiplication.'}
            </p>
          </div>

          <button
            onClick={onBack}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span>{isVi ? 'Bắt đầu Luyện tập ngay' : 'Start Practice Now'}</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Main Visual Guide Carousel Component */}
      <TwoDigitMentalMathGuideCarousel />

      {/* Bottom Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          {isVi
            ? 'Đã nắm vững phương pháp? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Tính Nhẩm 5s / 10s.'
            : 'Ready to test your speed? Return to Training mode or challenge yourself with 5s / 10s blitz.'}
        </p>

        <div className="flex items-center gap-2">
          {onOpenChallenge && (
            <button
              onClick={onOpenChallenge}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span>{isVi ? 'Quay lại Luyện tập' : 'Back to Training'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const VisualGuidePage = TwoDigitMentalMathVisualGuidePage;
