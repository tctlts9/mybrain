import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MultiplyWith1DigitGuideCarousel } from './MultiplyWith1DigitGuideCarousel';

interface MultiplyWith1DigitVisualGuidePageProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
}

interface GuideSlide {
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  formula: string;
  result: string;
  stepsVi: { title: string; desc: string; math: string }[];
  stepsEn: { title: string; desc: string; math: string }[];
  tipVi: string;
  tipEn: string;
}

const GUIDE_SLIDES: GuideSlide[] = [
  {
    titleVi: 'Phương Pháp Nhân Từ Trái Qua Phải (Left-to-Right)',
    titleEn: 'Left-to-Right Mental Math Strategy',
    badgeVi: 'Nguyên lý cốt lõi',
    badgeEn: 'Core Principle',
    formula: '68 × 7',
    result: '= 476',
    stepsVi: [
      {
        title: 'Bước 1: Tách hàng chục',
        desc: 'Nhân chữ số hàng chục với số nhân: 60 × 7 = 420. Giữ số 420 trong tâm trí.',
        math: '60 × 7 = 420',
      },
      {
        title: 'Bước 2: Tách hàng đơn vị',
        desc: 'Nhân chữ số hàng đơn vị: 8 × 7 = 56.',
        math: '8 × 7 = 56',
      },
      {
        title: 'Bước 3: Cộng dồn tức thì',
        desc: '420 + 56 = 476. Phương pháp từ trái qua phải giúp bạn đọc kết quả ngay lập tức!',
        math: '420 + 56 = 476',
      },
    ],
    stepsEn: [
      {
        title: 'Step 1: Multiply the tens',
        desc: 'Multiply the tens digit by the multiplier: 60 × 7 = 420. Hold 420 in working memory.',
        math: '60 × 7 = 420',
      },
      {
        title: 'Step 2: Multiply the units',
        desc: 'Multiply the ones digit: 8 × 7 = 56.',
        math: '8 × 7 = 56',
      },
      {
        title: 'Step 3: Immediate Accumulation',
        desc: '420 + 56 = 476. Calculating left-to-right lets you speak out digits without hesitation!',
        math: '420 + 56 = 476',
      },
    ],
    tipVi: 'Bí quyết: Luôn tính từ hàng cao nhất (trái sang phải) để không cần nhớ số dư đảo ngược như cách đặt tính truyền thống.',
    tipEn: 'Pro tip: Always compute highest digits first (left-to-right) so you never get slowed down by reversed carryover.',
  },
  {
    titleVi: 'Phép Nhân 3 Chữ Số Với 1 Chữ Số',
    titleEn: '3-Digit by 1-Digit Multiplication',
    badgeVi: 'Nâng cao cấp 1',
    badgeEn: 'Intermediate Level 1',
    formula: '436 × 8',
    result: '= 3,488',
    stepsVi: [
      {
        title: 'Bước 1: Hàng trăm',
        desc: '400 × 8 = 3,200.',
        math: '400 × 8 = 3,200',
      },
      {
        title: 'Bước 2: Hàng chục & cộng gộp',
        desc: '30 × 8 = 240. Cộng ngay vào 3,200 ➔ 3,440.',
        math: '3,200 + 240 = 3,440',
      },
      {
        title: 'Bước 3: Hàng đơn vị & kết quả cuối',
        desc: '6 × 8 = 48. Cộng 48 vào 3,440 ➔ 3,488.',
        math: '3,440 + 48 = 3,488',
      },
    ],
    stepsEn: [
      {
        title: 'Step 1: Hundreds',
        desc: '400 × 8 = 3,200.',
        math: '400 × 8 = 3,200',
      },
      {
        title: 'Step 2: Tens & Running Sum',
        desc: '30 × 8 = 240. Add immediately to 3,200 ➔ 3,440.',
        math: '3,200 + 240 = 3,440',
      },
      {
        title: 'Step 3: Ones & Final Result',
        desc: '6 × 8 = 48. Add 48 to 3,440 ➔ 3,488.',
        math: '3,440 + 48 = 3,488',
      },
    ],
    tipVi: 'Mẹo nhớ: Vừa nhẩm vừa cộng dồn liên tiếp thay vì đợi nhân hết 3 chữ số mới bắt đầu cộng.',
    tipEn: 'Memory trick: Maintain a running sum continuously rather than computing all products and adding at the end.',
  },
  {
    titleVi: 'Kỹ Thuật Làm Tròn Số (Rounding & Compensation)',
    titleEn: 'Rounding & Compensation Shortcut',
    badgeVi: 'Bí quyết siêu tốc',
    badgeEn: 'Speed Trick',
    formula: '79 × 6',
    result: '= 474',
    stepsVi: [
      {
        title: 'Bước 1: Làm tròn lên',
        desc: 'Nhận thấy 79 rất gần 80 (80 - 1). Tính: 80 × 6 = 480.',
        math: '80 × 6 = 480',
      },
      {
        title: 'Bước 2: Bù trừ phần thiếu',
        desc: 'Vì đã làm tròn dư 1 đơn vị, ta trừ đi: 1 × 6 = 6.',
        math: '1 × 6 = 6',
      },
      {
        title: 'Bước 3: Kết quả tức thì',
        desc: '480 - 6 = 474. Nhanh hơn gấp 3 lần so với nhân 70×6 + 9×6!',
        math: '480 - 6 = 474',
      },
    ],
    stepsEn: [
      {
        title: 'Step 1: Round up',
        desc: 'Notice 79 is close to 80 (80 - 1). Compute: 80 × 6 = 480.',
        math: '80 × 6 = 480',
      },
      {
        title: 'Step 2: Compensate overshoot',
        desc: 'Since we added 1 unit per multiple, subtract: 1 × 6 = 6.',
        math: '1 × 6 = 6',
      },
      {
        title: 'Step 3: Instant result',
        desc: '480 - 6 = 474. Three times faster than computing 70×6 + 9×6!',
        math: '480 - 6 = 474',
      },
    ],
    tipVi: 'Áp dụng khi chữ số tận cùng là 8 hoặc 9 (VD: 39×7, 88×5, 99×4, 198×6).',
    tipEn: 'Use when numbers end in 8 or 9 (e.g., 39×7, 88×5, 99×4, 198×6).',
  },
];

export const MultiplyWith1DigitVisualGuidePage: React.FC<MultiplyWith1DigitVisualGuidePageProps> = ({
  onBack,
  onOpenChallenge,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [slideIndex, setSlideIndex] = useState<number>(0);

  const cur = GUIDE_SLIDES[slideIndex];
  const steps = isVi ? cur.stepsVi : cur.stepsEn;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại Luyện tập Nhân 1 chữ số' : 'Back to Practice'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenChallenge && (
            <button
              onClick={onOpenChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Thử thách Nhân 1 chữ số (5s / 10s)' : '1-Digit Challenge (5s / 10s)'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Nhân 1 Chữ Số' : '1-Digit Challenge'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Nhân với 1 chữ số' : 'Multiply by 1-Digit'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Page Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/25 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5" />
              <span>{isVi ? 'Bí quyết tính nhẩm siêu tốc số 1 chữ số' : 'Mental Math Mastery: × 1-Digit'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{isVi ? 'Hướng Dẫn Trực Quan: Nhân Với 1 Chữ Số' : 'Visual Guide: Multiplying by 1-Digit'}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {isVi
                ? 'Phương pháp tính nhẩm từ trái qua phải (Left-to-Right), kỹ thuật cộng dồn liên tiếp và quy tắc bù trừ siêu tốc không cần giấy nháp.'
                : 'Left-to-right mental arithmetic, continuous accumulation, and rounding-compensation techniques.'}
            </p>
          </div>

          <button
            onClick={onBack}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span>{isVi ? 'Bắt đầu Luyện tập ngay' : 'Start Practice Now'}</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Main Visual Guide Carousel Component */}
      <MultiplyWith1DigitGuideCarousel />

      {/* Slide Navigation Dots & Arrows */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {GUIDE_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                slideIndex === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev > 0 ? prev - 1 : GUIDE_SLIDES.length - 1))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {slideIndex + 1} / {GUIDE_SLIDES.length}
          </span>
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev < GUIDE_SLIDES.length - 1 ? prev + 1 : 0))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Slide Card */}
      <div className="rounded-3xl border border-amber-500/30 bg-slate-950/90 p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Title and Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              {isVi ? cur.badgeVi : cur.badgeEn}
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-white mt-1.5">
              {isVi ? cur.titleVi : cur.titleEn}
            </h2>
          </div>

          {/* Large Equation */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-inner font-mono font-black text-xl sm:text-2xl text-white">
            <span className="text-amber-400">{cur.formula}</span>
            <span className="text-emerald-400">{cur.result}</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((st, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-3 relative group hover:border-amber-500/40 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono text-xs flex items-center justify-center border border-amber-500/30">
                  {i + 1}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {st.math}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">{st.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Pro Tip Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 block">
              {isVi ? 'Bí Quyết Tính Nhanh' : 'Pro Tip'}
            </span>
            <p className="leading-relaxed">{isVi ? cur.tipVi : cur.tipEn}</p>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          {isVi
            ? 'Đã hiểu phương pháp? Hãy tham gia Thử Thách Nhân 1 Chữ Số hoặc quay về Luyện tập!'
            : 'Ready to practice? Jump into the 1-Digit Blitz Challenge or Training page!'}
        </p>

        <div className="flex items-center gap-2">
          {onOpenChallenge && (
            <button
              onClick={onOpenChallenge}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Nhân 1 Chữ Số' : '1-Digit Challenge'}</span>
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
