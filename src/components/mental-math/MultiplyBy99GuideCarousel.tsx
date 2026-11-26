import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Brain,
  Sparkles,
  Download,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useLanguage, translateText } from '../../context/Translations';
import { downloadGuidePdf } from '../../utils/guidePdfDownload';

interface SlideMeta {
  id: number;
  badgeVi: string;
  badgeEn: string;
}

const SLIDES: SlideMeta[] = [
  {
    id: 1,
    badgeVi: 'Bước 1: Nhân 99 với số 2 chữ số (N − 1 | 100 − N)',
    badgeEn: 'Step 1: 2-Digit × 99 Shortcut (N − 1 | 100 − N)',
  },
  {
    id: 2,
    badgeVi: 'Bước 2: Nhân 99 với số 3 đến 10 chữ số (N × 100 − N)',
    badgeEn: 'Step 2: 3 to 10-Digit × 99 Extension (N × 100 − N)',
  },
];

const SlideContent: React.FC<{ slideId: number; isVi: boolean; compact?: boolean }> = ({
  slideId,
  isVi,
  compact = false,
}) => {
  if (slideId === 1) {
    return (
      <div
        className={`w-full h-full flex flex-col justify-between bg-gradient-to-br from-[#061830] via-[#082040] to-[#041022] text-white select-none ${
          compact ? 'p-4 sm:p-6 md:p-8' : 'p-5 sm:p-8 md:p-10'
        }`}
      >
        {/* Header Badge & Formula */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yellow-500/20 pb-3 sm:pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-300/35 text-yellow-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{translateText(isVi ? 'vi' : 'en', "Quy tắc 1 • Số 2 chữ số × 99")}</span>
            </div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              {translateText(isVi ? 'vi' : 'en', "Tuyệt Chiêu Ghép Cặp: (N − 1) | (100 − N)")}
            </h3>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-cyan-500/35 text-center shadow-lg">
            <div className="text-[10px] sm:text-xs text-cyan-300 font-semibold uppercase tracking-wider">
              {translateText(isVi ? 'vi' : 'en', "Công thức nhẩm nhanh")}
            </div>
            <div className="text-sm sm:text-lg font-black font-mono text-yellow-300">
              N × 99 = [N − 1][100 − N]
            </div>
          </div>
        </div>

        {/* Main Step-by-Step Visual: 68 × 99 = 6,732 */}
        <div className="my-3 sm:my-5 rounded-2xl sm:rounded-3xl bg-slate-950/75 border border-yellow-500/30 p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-yellow-300 uppercase tracking-wider">
              {translateText(isVi ? 'vi' : 'en', "Ví dụ kinh điển: 68 × 99")}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 rounded-full">
              68 × 99 = 6,732
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center">
            {/* Step A: Left 2 digits */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/35 text-center space-y-1.5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-yellow-300">
                {translateText(isVi ? 'vi' : 'en', "Bước 1 • 2 số đầu (Trái)")}
              </div>
              <div className="text-sm sm:text-base font-mono text-slate-300">
                68 − 1
              </div>
              <div className="text-2xl sm:text-4xl font-black font-mono text-yellow-400">
                67
              </div>
              <p className="text-[11px] text-slate-400">
                {translateText(isVi ? 'vi' : 'en', "Lấy số ban đầu trừ đi 1")}
              </p>
            </div>

            {/* Step B: Right 2 digits */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/35 text-center space-y-1.5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-300">
                {translateText(isVi ? 'vi' : 'en', "Bước 2 • 2 số cuối (Phải)")}
              </div>
              <div className="text-sm sm:text-base font-mono text-slate-300">
                100 − 68
              </div>
              <div className="text-2xl sm:text-4xl font-black font-mono text-cyan-300">
                32
              </div>
              <p className="text-[11px] text-slate-400">
                {translateText(isVi ? 'vi' : 'en', "Mẹo: (9 − 6) = 3, (10 − 8) = 2")}
              </p>
            </div>

            {/* Step C: Combined Result */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-center space-y-1.5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300">
                {translateText(isVi ? 'vi' : 'en', "Bước 3 • Ghép kết quả")}
              </div>
              <div className="text-sm sm:text-base font-mono text-slate-300 flex items-center justify-center gap-1">
                <span className="text-yellow-400 font-bold">67</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-cyan-300 font-bold">32</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black font-mono text-emerald-300">
                6,732
              </div>
              <p className="text-[11px] text-slate-400">
                {translateText(isVi ? 'vi' : 'en', "Đọc thẳng từ trái sang phải!")}
              </p>
            </div>
          </div>
        </div>

        {/* Extra Quick Examples */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">{translateText(isVi ? 'vi' : 'en', "Mẫu nhanh 1")}</div>
              <div className="text-sm sm:text-base font-mono font-bold text-white">43 × 99</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-slate-400">42 | 57</div>
              <div className="text-base sm:text-lg font-black text-yellow-400">4,257</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">{translateText(isVi ? 'vi' : 'en', "Mẫu có số 0 đầu")}</div>
              <div className="text-sm sm:text-base font-mono font-bold text-white">94 × 99</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-slate-400">93 | 06</div>
              <div className="text-base sm:text-lg font-black text-cyan-300">9,306</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">{translateText(isVi ? 'vi' : 'en', "Số tròn chục")}</div>
              <div className="text-sm sm:text-base font-mono font-bold text-white">30 × 99</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-slate-400">29 | 70</div>
              <div className="text-base sm:text-lg font-black text-emerald-300">2,970</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col justify-between bg-gradient-to-br from-[#061830] via-[#0a2244] to-[#041022] text-white select-none ${
        compact ? 'p-4 sm:p-6 md:p-8' : 'p-5 sm:p-8 md:p-10'
      }`}
    >
      {/* Header Badge & Formula */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 sm:pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>{translateText(isVi ? 'vi' : 'en', "Quy tắc 2 • Số 3 đến 10 chữ số × 99")}</span>
          </div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            {translateText(isVi ? 'vi' : 'en', "Mở Rộng Siêu Tốc: N × 100 − N")}
          </h3>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-yellow-500/35 text-center shadow-lg">
          <div className="text-[10px] sm:text-xs text-yellow-300 font-semibold uppercase tracking-wider">
            {translateText(isVi ? 'vi' : 'en', "Bản chất đại số")}
          </div>
          <div className="text-sm sm:text-lg font-black font-mono text-cyan-300">
            N × 99 = N00 − N
          </div>
        </div>
      </div>

      {/* Two Methods Side by Side */}
      <div className="my-3 sm:my-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
        {/* Method A: Append 00 and Subtract N */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/75 border border-yellow-500/30 p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-yellow-300 uppercase tracking-wider">
              {translateText(isVi ? 'vi' : 'en', "Cách A • Nhân 100 rồi trừ N")}
            </span>
            <span className="text-xs font-mono font-bold text-yellow-200 bg-yellow-500/15 px-2 py-0.5 rounded-full">
              345 × 99
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{translateText(isVi ? 'vi' : 'en', "1. Thêm \"00\" vào sau N:")}</span>
              <span className="font-bold text-yellow-300">34,500</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{translateText(isVi ? 'vi' : 'en', "2. Trừ đi chính số N:")}</span>
              <span className="font-bold text-rose-300">− 345</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between">
              <span className="font-sans font-bold text-emerald-300">{translateText(isVi ? 'vi' : 'en', "Kết quả:")}</span>
              <span className="text-lg sm:text-xl font-black text-emerald-300">34,155</span>
            </div>
          </div>
        </div>

        {/* Method B: Left-to-Right Chunking for 3+ digits */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/75 border border-cyan-500/30 p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider">
              {translateText(isVi ? 'vi' : 'en', "Cách B • Tách đầu & 2 số cuối")}
            </span>
            <span className="text-xs font-mono font-bold text-cyan-200 bg-cyan-500/15 px-2 py-0.5 rounded-full">
              2,468 × 99
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{translateText(isVi ? 'vi' : 'en', "1. Phần đầu (24 + 1 = 25):")}</span>
              <span className="font-bold text-yellow-300">2,468 − 25 = 2,443</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{translateText(isVi ? 'vi' : 'en', "2. Phần bù 2 số cuối:")}</span>
              <span className="font-bold text-cyan-300">100 − 68 = 32</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between">
              <span className="font-sans font-bold text-emerald-300">{translateText(isVi ? 'vi' : 'en', "Ghép kết quả:")}</span>
              <span className="text-lg sm:text-xl font-black text-emerald-300">244,332</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tip Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-semibold text-yellow-200">
          {translateText(isVi ? 'vi' : 'en', "💡 Mở rộng cho 999, 9999, 99999, 999999: Luôn lấy N thêm đúng k số 0 (N × 10ᵏ) rồi trừ chính số N!")}
        </span>
        <span className="font-mono font-bold text-cyan-300">
          345 × 999 = 345,000 − 345 = 344,655
        </span>
      </div>
    </div>
  );
};

export const MultiplyBy99GuideCarousel: React.FC = () => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [fullscreenSlideId, setFullscreenSlideId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const scrollToSlide = useCallback((index: number) => {
    let targetIndex = index;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= SLIDES.length) targetIndex = SLIDES.length - 1;
    setActiveIndex(targetIndex);

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetChild = container.children[targetIndex] as HTMLElement;
      if (targetChild) {
        targetChild.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    if (itemWidth === 0) return;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < SLIDES.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40;
    if (diff > threshold && activeIndex < SLIDES.length - 1) {
      scrollToSlide(activeIndex + 1);
    } else if (diff < -threshold && activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenSlideId(null);
      if (e.key === 'ArrowRight' && fullscreenSlideId === null) scrollToSlide(activeIndex + 1);
      if (e.key === 'ArrowLeft' && fullscreenSlideId === null) scrollToSlide(activeIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToSlide, fullscreenSlideId]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-slate-900/80 p-2 sm:p-4 md:p-5 shadow-2xl space-y-2.5 sm:space-y-3">
      {/* Top Header: Title & Navigation Controls */}
      <div className="flex items-center justify-between px-1 sm:px-2 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2">
              <span>{tr("Hướng Dẫn Nhân Với 99")}</span>
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              {tr("Vuốt ngang hoặc bấm mũi tên để chuyển bước")}
            </p>
          </div>
        </div>

        {/* Counter, Download Button & Arrow Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => downloadGuidePdf('Guide.pdf')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title={tr("Tải hướng dẫn định dạng PDF")}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{tr("Tải Guide")}</span>
            <span className="sm:hidden">{tr("Tải PDF")}</span>
          </button>

          <span className="px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-950 border border-slate-800 text-[11px] sm:text-xs font-mono font-bold text-yellow-400 shadow-xs">
            {activeIndex + 1} / {SLIDES.length}
          </span>
          <button
            type="button"
            onClick={() => scrollToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 hover:border-yellow-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title={tr("Bước trước")}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(activeIndex + 1)}
            disabled={activeIndex === SLIDES.length - 1}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 hover:border-yellow-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title={tr("Bước sau")}
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Container */}
      <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl border border-yellow-500/20 bg-[#061830] shadow-xl">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="carousel-track"
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="carousel-slide flex items-center justify-center bg-[#061830] relative overflow-hidden"
            >
              <div className="w-full relative overflow-hidden bg-[#061830] pb-8 sm:pb-10">
                <SlideContent slideId={slide.id} isVi={isVi} compact />

                {/* Top-Right Fullscreen Action Button */}
                <button
                  type="button"
                  onClick={() => setFullscreenSlideId(slide.id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-yellow-400 transition-all cursor-pointer backdrop-blur-md opacity-85 hover:opacity-100 shadow-md active:scale-90 z-10"
                  title={tr("Phóng to toàn màn hình")}
                  aria-label="Fullscreen guide"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Side Arrow Buttons */}
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-yellow-400 hover:text-slate-950 disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === SLIDES.length - 1}
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-yellow-400 hover:text-slate-950 disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floating Indicator Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 z-20 shadow-md">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              className={`transition-all rounded-full cursor-pointer ${
                activeIndex === i
                  ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-600 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenSlideId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFullscreenSlideId(null);
            }
          }}
        >
          <div className="w-full max-w-5xl flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-yellow-300">
              {isVi
                ? SLIDES.find((s) => s.id === fullscreenSlideId)?.badgeVi
                : SLIDES.find((s) => s.id === fullscreenSlideId)?.badgeEn}
            </span>
            <button
              type="button"
              onClick={() => setFullscreenSlideId(null)}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center transition-all cursor-pointer"
              title={tr("Đóng (Esc)")}
              aria-label="Close fullscreen guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl max-h-[85vh] overflow-y-auto">
            <SlideContent slideId={fullscreenSlideId} isVi={isVi} />
          </div>
        </div>
      )}
    </div>
  );
};
