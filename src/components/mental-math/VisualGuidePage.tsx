import React from 'react';
import { ArrowLeft, BookOpen, Brain, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MentalMathGuideCarousel } from './MentalMathGuideCarousel';

interface VisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

export const VisualGuidePage: React.FC<VisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const stepsSummary = [
    {
      step: 1,
      title: isVi ? 'Bước 1: Tách hàng chục' : 'Step 1: Split Tens',
      desc: isVi
        ? 'Tách số thứ hai thành hàng chục tròn trịa (VD: 68 -> 60) rồi nhân nhẩm: 86 × 60 = 5,160.'
        : 'Split the second number into rounded tens (e.g. 68 -> 60) and multiply: 86 × 60 = 5,160.',
      formula: '86 × 60 = 5,160',
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    },
    {
      step: 2,
      title: isVi ? 'Bước 2: Nhân hàng đơn vị' : 'Step 2: Multiply Units',
      desc: isVi
        ? 'Lấy số ban đầu nhân với hàng đơn vị còn lại (VD: 8): 86 × 8 = 688.'
        : 'Multiply the initial number by the remaining units (e.g. 8): 86 × 8 = 688.',
      formula: '86 × 8 = 688',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    },
    {
      step: 3,
      title: isVi ? 'Bước 3: Cộng dồn tích' : 'Step 3: Combine Products',
      desc: isVi
        ? 'Cộng hai kết quả riêng phần lại để ra đáp số cuối cùng: 5,160 + 688 = 5,848.'
        : 'Add both partial products together for the final answer: 5,160 + 688 = 5,848.',
      formula: '5,160 + 688 = 5,848',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    {
      step: 4,
      title: isVi ? 'Cách 2: Nhân chéo Vedic' : 'Method 2: Vedic Cross',
      desc: isVi
        ? 'Nhân hàng đơn vị (6×8=48), nhân chéo cộng dồn (8×8 + 6×6 = 100), nhân hàng chục (8×6=48).'
        : 'Units multiply (6×8=48), cross-multiply and sum (8×8 + 6×6 = 100), tens multiply (8×6=48).',
      formula: '86 × 68 = 5,848',
      color: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300 pb-12">
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
      <MentalMathGuideCarousel />

      {/* 4 Step Summary Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isVi ? 'Tóm tắt các bước tính nhẩm' : 'Method Summary & Key Steps'}</span>
          </h2>
          <span className="text-xs text-slate-400">
            {isVi ? 'Ví dụ mẫu: 86 × 68' : 'Example: 86 × 68'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stepsSummary.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-2.5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>
                  Step {item.step}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {item.formula}
                </span>
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">{item.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

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
