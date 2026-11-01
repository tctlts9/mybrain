import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Brain, Sparkles, Layers } from 'lucide-react';
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
  descVi: string;
  descEn: string;
  badgeVi: string;
  badgeEn: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: step1Img,
    titleVi: 'Bước 1: Tách thừa số & Nhân hàng chục (86 × 60 = 5,160)',
    titleEn: 'Step 1: Splitting & Tens Multiplication (86 × 60 = 5,160)',
    descVi: 'Tách 68 thành (60 + 8). Nhẩm nhanh 86 × 60 bằng cách: (80 × 6 = 480) + (6 × 6 = 36) = 516, thêm số 0 thành 5,160.',
    descEn: 'Split 68 into 60 and 8. Multiply 86 × 60 mentally: (80×6=480) + (6×6=36) = 516, append 0 to get 5,160.',
    badgeVi: 'Bước 1 / 4 • Tách số',
    badgeEn: 'Step 1 / 4 • Split Tens',
  },
  {
    id: 2,
    image: step2Img,
    titleVi: 'Bước 2: Tính tích phần hàng đơn vị (86 × 8 = 688)',
    titleEn: 'Step 2: Units Multiplication (86 × 8 = 688)',
    descVi: 'Nhân 86 với 8 bằng phương pháp phân tách: (80 × 8 = 640) + (6 × 8 = 48) = 688 tích phần thứ hai.',
    descEn: 'Compute 86 × 8 mentally by partitioning: (80 × 8 = 640) + (6 × 8 = 48) = 688 second partial product.',
    badgeVi: 'Bước 2 / 4 • Hàng đơn vị',
    badgeEn: 'Step 2 / 4 • Split Ones',
  },
  {
    id: 3,
    image: step3Img,
    titleVi: 'Bước 3: Cộng dồn hai tích riêng phần (5,160 + 688 = 5,848)',
    titleEn: 'Step 3: Combine Partial Products (5,160 + 688 = 5,848)',
    descVi: 'Cộng nhẩm từ trái sang phải: 5,160 + 600 = 5,760, sau đó + 88 = 5,848. Hoàn tất đáp án cuối cùng!',
    descEn: 'Add mentally left-to-right: 5,160 + 600 = 5,760, then + 88 = 5,848. Final answer confirmed!',
    badgeVi: 'Bước 3 / 4 • Cộng dồn',
    badgeEn: 'Step 3 / 4 • Sum Total',
  },
  {
    id: 4,
    image: step4Img,
    titleVi: 'Phương pháp 2: Nhân chéo Vedic siêu tốc (86 × 68 = 5,848)',
    titleEn: 'Method 2: Vedic Cross Multiplication (86 × 68 = 5,848)',
    descVi: 'Đơn vị (6×8=48, nhớ 4) ➔ Nhân chéo (8×8 + 6×6 + 4=104, nhớ 10) ➔ Hàng chục (8×6 + 10=58) ➔ Ghép lại: 5,848.',
    descEn: 'Units (6×8=48, carry 4) ➔ Cross ((8×8)+(6×6)+4=104, carry 10) ➔ Tens (8×6+10=58) ➔ Final result: 5,848.',
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

  // Close zoom modal on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomImage(null);
      if (e.key === 'ArrowRight') scrollToSlide(activeIndex + 1);
      if (e.key === 'ArrowLeft') scrollToSlide(activeIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const activeSlide = slides[activeIndex];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header bar: Title & Step Counter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span>{isVi ? 'Hình Ảnh Hướng Dẫn Tính Nhẩm (86 × 68)' : 'Mental Math Visual Guide (86 × 68)'}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              {isVi ? 'Vuốt hoặc bấm nút để xem từng bước minh họa chi tiết' : 'Swipe or use buttons to navigate visual step-by-step guides'}
            </p>
          </div>
        </div>

        {/* Navigation Arrows & Counter */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400">
            {activeIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => scrollToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title={isVi ? 'Ảnh trước' : 'Previous image'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToSlide(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title={isVi ? 'Ảnh sau' : 'Next image'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Step Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => scrollToSlide(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeIndex === idx
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{isVi ? s.badgeVi : s.badgeEn}</span>
          </button>
        ))}
      </div>

      {/* Horizontal Scroll Image Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl border border-slate-800/80 bg-slate-950 shadow-inner scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="min-w-full flex-shrink-0 snap-center relative group overflow-hidden"
          >
            {/* Slide Image */}
            <div className="relative aspect-[16/9] w-full max-h-[460px] overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={slide.image}
                alt={isVi ? slide.titleVi : slide.titleEn}
                className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                onClick={() => setZoomImage(slide.image)}
                loading="lazy"
              />

              {/* Zoom In Button Hint */}
              <button
                onClick={() => setZoomImage(slide.image)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-all cursor-pointer backdrop-blur-md opacity-80 group-hover:opacity-100 shadow-md"
                title={isVi ? 'Phóng to ảnh' : 'Zoom image'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Slide Index Badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[11px] font-semibold text-amber-400 backdrop-blur-md">
                {isVi ? slide.badgeVi : slide.badgeEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Slide Explanation Card */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
        <h3 className="font-bold text-white text-sm sm:text-base text-amber-300">
          {isVi ? activeSlide.titleVi : activeSlide.titleEn}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {isVi ? activeSlide.descVi : activeSlide.descEn}
        </p>
      </div>

      {/* Lightbox / Zoom Modal for full detail */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed guide diagram"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
            <p className="mt-3 text-xs text-slate-400 text-center">
              {isVi ? 'Bấm phím Esc hoặc nhấp ra ngoài để đóng' : 'Press Esc or click outside to close'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
