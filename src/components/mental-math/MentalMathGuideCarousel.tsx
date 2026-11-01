import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Brain, Sparkles, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import step1Img from '../../assets/images/guide_step1_1793536046845.jpg';
import step2Img from '../../assets/images/guide_step2_1793536061230.jpg';
import step3Img from '../../assets/images/guide_step3_1793536073790.jpg';
import step4Img from '../../assets/images/guide_step4_1793536087412.jpg';

interface Slide {
  id: number;
  image: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: step1Img,
    titleVi: 'Bước 1: Tách thừa số & Nhân hàng chục (86 × 60 = 5,160)',
    titleEn: 'Step 1: Splitting & Tens Multiplication (86 × 60 = 5,160)',
    badgeVi: 'Bước 1 / 4 • Tách số',
    badgeEn: 'Step 1 / 4 • Split Tens',
  },
  {
    id: 2,
    image: step2Img,
    titleVi: 'Bước 2: Tính tích phần hàng đơn vị (86 × 8 = 688)',
    titleEn: 'Step 2: Units Multiplication (86 × 8 = 688)',
    badgeVi: 'Bước 2 / 4 • Hàng đơn vị',
    badgeEn: 'Step 2 / 4 • Split Ones',
  },
  {
    id: 3,
    image: step3Img,
    titleVi: 'Bước 3: Cộng dồn hai tích riêng phần (5,160 + 688 = 5,848)',
    titleEn: 'Step 3: Combine Partial Products (5,160 + 688 = 5,848)',
    badgeVi: 'Bước 3 / 4 • Cộng dồn',
    badgeEn: 'Step 3 / 4 • Sum Total',
  },
  {
    id: 4,
    image: step4Img,
    titleVi: 'Phương pháp 2: Nhân chéo Vedic siêu tốc (86 × 68 = 5,848)',
    titleEn: 'Method 2: Vedic Cross Multiplication (86 × 68 = 5,848)',
    badgeVi: 'Phương pháp 2 • Nhân chéo',
    badgeEn: 'Method 2 • Cross Multiply',
  },
];

export const MentalMathGuideCarousel: React.FC = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    setActiveIndex(index);

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetChild = container.children[index] as HTMLElement;
      if (targetChild) {
        targetChild.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  // Keyboard navigation & Esc to close zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomImage(null);
      if (e.key === 'ArrowRight') scrollToSlide(activeIndex + 1);
      if (e.key === 'ArrowLeft') scrollToSlide(activeIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-slate-900/80 p-2 sm:p-4 md:p-5 shadow-2xl space-y-2.5 sm:space-y-3">
      {/* Top Header: Title & Navigation Controls */}
      <div className="flex items-center justify-between px-1 sm:px-2 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2">
              <span>{isVi ? 'Hướng Dẫn Tính Nhẩm (86 × 68)' : 'Visual Guide (86 × 68)'}</span>
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              {isVi ? 'Vuốt ngang hoặc bấm mũi tên để xem các bước' : 'Swipe or tap arrows to navigate steps'}
            </p>
          </div>
        </div>

        {/* Counter & Arrow Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-950 border border-slate-800 text-[11px] sm:text-xs font-mono font-bold text-amber-400 shadow-xs">
            {activeIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => scrollToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title={isVi ? 'Ảnh trước' : 'Previous'}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => scrollToSlide(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title={isVi ? 'Ảnh sau' : 'Next'}
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Slider Container: Responsive for Mobile, Tablet, Web App */}
      <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl border border-amber-500/20 bg-[#061830] shadow-xl">
        {/* Horizontal Scroll Snap Track */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth touch-pan-x"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="min-w-full flex-shrink-0 snap-center relative overflow-hidden flex items-center justify-center bg-[#061830]"
            >
              {/* Responsive 16:9 Image Container */}
              <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden bg-[#061830]">
                <img
                  src={slide.image}
                  alt={isVi ? slide.titleVi : slide.titleEn}
                  className="w-full h-full object-contain cursor-zoom-in select-none transition-transform duration-500 group-hover:scale-[1.01]"
                  onClick={() => setZoomImage(slide.image)}
                  draggable={false}
                  loading="eager"
                />

                {/* Top-Right Zoom Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImage(slide.image);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-all cursor-pointer backdrop-blur-md opacity-85 hover:opacity-100 shadow-md active:scale-90"
                  title={isVi ? 'Phóng to ảnh' : 'Zoom image'}
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Top-Left Step Badge */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-950/85 border border-amber-500/30 text-[10px] sm:text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm">
                  {isVi ? slide.badgeVi : slide.badgeEn}
                </div>

                {/* Tap to zoom hint (visible on mobile / small devices) */}
                <div
                  onClick={() => setZoomImage(slide.image)}
                  className="sm:hidden absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/75 border border-slate-700/60 text-[10px] text-slate-300 backdrop-blur-xs cursor-pointer active:scale-95"
                >
                  <ZoomIn className="w-3 h-3 text-amber-400" />
                  <span>{isVi ? 'Chạm để phóng to' : 'Tap to zoom'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Side Arrow Buttons for Desktop & Tablet hover */}
        <button
          onClick={() => scrollToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === slides.length - 1}
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floating Indicator Dots centered at bottom */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 z-20 shadow-md">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToSlide(i)}
              className={`transition-all rounded-full cursor-pointer ${
                activeIndex === i
                  ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-600 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox / Zoom Modal for full detail and high-res viewing */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-2 sm:p-6 md:p-8 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 sm:-top-12 right-0 p-1.5 sm:p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all active:scale-90 shadow-lg"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed guide diagram"
              className="w-full max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800 select-none"
            />
            <p className="mt-2.5 text-[11px] sm:text-xs text-slate-400 text-center flex items-center gap-1.5">
              <span>{isVi ? 'Bấm phím Esc hoặc chạm ra ngoài để đóng' : 'Press Esc or tap outside to close'}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
