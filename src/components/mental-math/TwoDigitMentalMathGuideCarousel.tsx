import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Brain,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Download,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import step1Img from '../../assets/images/Mental Math/TwoDigitGuide1.jpg';
import step2Img from '../../assets/images/Mental Math/TwoDigitGuide2.jpg';
import step3Img from '../../assets/images/Mental Math/TwoDigitGuide3.jpg';
import step4Img from '../../assets/images/Mental Math/TwoDigitGuide4.jpg';
import Guide from '../../assets/images/Guide.pdf';
import { downloadGuidePdf } from '../../utils/guidePdfDownload';

interface Slide {
  id: number;
  image: string;
  badgeVi?: string;
  badgeEn?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: step1Img,
    //badgeVi: 'Bước 1: Tính tích riêng thứ nhất',
    //badgeEn: 'Step 1: First Partial Product',
  },
  {
    id: 2,
    image: step2Img,
    //badgeVi: 'Bước 2: Tích riêng thứ hai (86 × 8)',
    //badgeEn: 'Step 2: Second Partial Product (86 × 8)',
  },
  {
    id: 3,
    image: step3Img,
    //badgeVi: 'Bước 3: Kết hợp các tích riêng',
    //badgeEn: 'Step 3: Combining Partial Products',
  },
  {
    id: 4,
    image: step4Img,
    //badgeVi: 'Bước 4: Nhân chéo Vedic (86 × 68)',
    //badgeEn: 'Step 4: Vedic Cross Multiplication',
  },
];

interface MobileInteractiveZoomViewerProps {
  image: string;
  onClose: () => void;
  isVi: boolean;
  initialScale?: number;
}

/**
 * Mobile-first Interactive Lightbox & Pinch-to-Zoom Image Viewer
 * Supports:
 * - 2-finger pinch-to-zoom (vuốt phóng to / thu nhỏ)
 * - 1-finger drag & pan when zoomed in
 * - Double-tap to quick toggle zoom (1x <-> 2.5x)
 * - Dedicated touch buttons: Zoom In (+), Zoom Out (-), Reset (1x), Close (✕)
 * - Mouse-wheel zoom on desktop
 */
const MobileInteractiveZoomViewer: React.FC<MobileInteractiveZoomViewerProps> = ({
  image,
  onClose,
  isVi,
  initialScale = 1,
}) => {
  const [scale, setScale] = useState<number>(initialScale);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);

  // References for touch calculation
  const touchStartDistRef = useRef<number>(0);
  const touchStartScaleRef = useRef<number>(1);
  const touchLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch-to-zoom
      isPinchingRef.current = true;
      isPanningRef.current = false;
      setIsTransitioning(false);
      touchStartDistRef.current = getDistance(e.touches[0], e.touches[1]);
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const touch = e.touches[0];
      const timeDiff = now - lastTapTimeRef.current;
      const distFromLastTap = Math.hypot(
        touch.clientX - lastTapPosRef.current.x,
        touch.clientY - lastTapPosRef.current.y
      );

      // Double tap detected: quick zoom in/out
      if (timeDiff < 300 && distFromLastTap < 40) {
        lastTapTimeRef.current = 0;
        setIsTransitioning(true);
        if (scale > 1.2) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          const offsetX = (window.innerWidth / 2 - touch.clientX) * 1.2;
          const offsetY = (window.innerHeight / 2 - touch.clientY) * 1.2;
          setPosition({ x: offsetX, y: offsetY });
        }
        return;
      }

      lastTapTimeRef.current = now;
      lastTapPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (scale > 1) {
        isPanningRef.current = true;
        setIsTransitioning(false);
        touchLastPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      if (touchStartDistRef.current > 0) {
        const factor = currentDist / touchStartDistRef.current;
        const newScale = clamp(touchStartScaleRef.current * factor, 1, 4.5);
        setScale(newScale);
        if (newScale <= 1.05) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && isPanningRef.current && scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - touchLastPosRef.current.x;
      const dy = touch.clientY - touchLastPosRef.current.y;
      touchLastPosRef.current = { x: touch.clientX, y: touch.clientY };

      setPosition((prev) => {
        const maxPanX = (window.innerWidth * (scale - 1)) / 1.7;
        const maxPanY = (window.innerHeight * (scale - 1)) / 1.7;
        return {
          x: clamp(prev.x + dx, -maxPanX, maxPanX),
          y: clamp(prev.y + dy, -maxPanY, maxPanY),
        };
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isPinchingRef.current = false;
      isPanningRef.current = false;
      if (scale <= 1.05) {
        setIsTransitioning(true);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && scale > 1) {
      isPinchingRef.current = false;
      isPanningRef.current = true;
      touchLastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    setScale((prev) => {
      const next = clamp(prev * zoomFactor, 1, 4.5);
      if (next <= 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleZoomIn = () => {
    setIsTransitioning(true);
    setScale((prev) => clamp(prev + 0.5, 1, 4.5));
  };

  const handleZoomOut = () => {
    setIsTransitioning(true);
    setScale((prev) => {
      const next = clamp(prev - 0.5, 1, 4.5);
      if (next <= 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setIsTransitioning(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center select-none touch-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onClick={(e) => {
        // If tapping backdrop while at 1x, close viewer
        if (scale <= 1.1 && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-3 inset-x-3 sm:top-5 sm:inset-x-6 z-30 flex items-center justify-between pointer-events-auto">
        {/* Zoom level pill badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-400 font-mono text-xs font-bold shadow-xl backdrop-blur-md">
          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
          <span>{Math.round(scale * 100)}%</span>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2">
          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer"
            title={isVi ? 'Phóng to (+)' : 'Zoom In (+)'}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-amber-400" />
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1.05}
            className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer"
            title={isVi ? 'Thu nhỏ (-)' : 'Zoom Out (-)'}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-amber-400" />
          </button>

          {/* Reset Zoom Button */}
          {scale > 1.05 && (
            <button
              onClick={handleResetZoom}
              className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/40 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer"
              title={isVi ? 'Đặt lại 100%' : 'Reset 100%'}
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/50 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer ml-1"
            title={isVi ? 'Đóng (Esc)' : 'Close (Esc)'}
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Zoomable Media Canvas */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6">
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
            transition: isTransitioning ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            transformOrigin: 'center center',
          }}
          className="will-change-transform flex items-center justify-center max-w-full max-h-full"
        >
          <img
            src={image}
            alt={isVi ? 'Hướng dẫn tính nhẩm chi tiết' : 'Mental math visual guide'}
            className="max-w-[92vw] max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800/80 select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Hint Banner for Mobile Touch Users */}
      <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-auto flex justify-center pointer-events-none z-30">
        <div className="px-3 py-1.5 rounded-full bg-slate-950/85 border border-slate-800 text-[11px] sm:text-xs text-slate-300 flex items-center gap-2 shadow-2xl backdrop-blur-md text-center">
          <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isVi
              ? 'Vuốt 2 ngón tay để zoom • Chạm 2 lần để zoom nhanh • Kéo để di chuyển'
              : 'Pinch with 2 fingers to zoom • Double-tap to quick zoom • Drag to pan'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const TwoDigitMentalMathGuideCarousel: React.FC = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [initialZoomScale, setInitialZoomScale] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Touch gesture tracking for responsive mobile and tablet swipe
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);
  const slideLastTapTimeRef = useRef<number>(0);

  const scrollToSlide = useCallback((index: number) => {
    let targetIndex = index;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= slides.length) targetIndex = slides.length - 1;
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
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, slideImage: string) => {
    // If user touches with 2 fingers directly on the slide, trigger interactive pinch zoom
    if (e.touches.length === 2) {
      setInitialZoomScale(1.4);
      setZoomImage(slideImage);
      return;
    }

    // Check for double tap on the slide
    const now = Date.now();
    if (now - slideLastTapTimeRef.current < 300) {
      slideLastTapTimeRef.current = 0;
      setInitialZoomScale(2.5);
      setZoomImage(slideImage);
      return;
    }
    slideLastTapTimeRef.current = now;

    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40; // minimum swipe distance in pixels
    if (diff > threshold && activeIndex < slides.length - 1) {
      scrollToSlide(activeIndex + 1);
    } else if (diff < -threshold && activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    }
  };

  // Keyboard navigation & Esc to close zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomImage(null);
      if (e.key === 'ArrowRight' && !zoomImage) scrollToSlide(activeIndex + 1);
      if (e.key === 'ArrowLeft' && !zoomImage) scrollToSlide(activeIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToSlide, zoomImage]);

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
              <span>{isVi ? 'Hướng Dẫn' : 'Visual Guide'}</span>
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              {isVi ? 'Vuốt ngang để chuyển bước • Vuốt 2 ngón để zoom' : 'Swipe to switch steps • Pinch to zoom'}
            </p>
          </div>
        </div>

        {/* Counter, Download Button & Arrow Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Download Guide PDF Button */}
          <button
            type="button"
            onClick={() => downloadGuidePdf('Guide.pdf')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title={isVi ? 'Tải hướng dẫn định dạng PDF' : 'Download Guide (PDF)'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isVi ? 'Tải Guide' : 'Download Guide'}</span>
            <span className="sm:hidden">{isVi ? 'Tải PDF' : 'PDF'}</span>
          </button>

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
        {/* Hardware-Accelerated Responsive Track (CSS Snap & Touch Event Support) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="carousel-track"
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              onTouchStart={(e) => handleTouchStart(e, slide.image)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="carousel-slide flex items-center justify-center bg-[#061830] relative overflow-hidden"
            >
              {/* Responsive 16:9 Slide Media Frame */}
              <div className="carousel-slide-media relative flex items-center justify-center overflow-hidden bg-[#061830]">
                <img
                  src={slide.image}
                  alt={isVi ? (slide.badgeVi || 'Hướng dẫn tính nhẩm') : (slide.badgeEn || 'Mental math guide')}
                  className="w-full h-full object-contain cursor-zoom-in select-none transition-transform duration-500 group-hover:scale-[1.01]"
                  onClick={() => {
                    setInitialZoomScale(1);
                    setZoomImage(slide.image);
                  }}
                  draggable={false}
                  loading="eager"
                />

                {/* Top-Right Zoom Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInitialZoomScale(1);
                    setZoomImage(slide.image);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-all cursor-pointer backdrop-blur-md opacity-85 hover:opacity-100 shadow-md active:scale-90 z-10"
                  title={isVi ? 'Phóng to ảnh' : 'Zoom image'}
                  aria-label="Zoom diagram"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Top-Left Step Badge */}
                {(isVi ? slide.badgeVi : slide.badgeEn) && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-950/85 border border-amber-500/30 text-[10px] sm:text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm z-10">
                    {isVi ? slide.badgeVi : slide.badgeEn}
                  </div>
                )}

                {/* Mobile Touch Zoom Button / Hint */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInitialZoomScale(1);
                    setZoomImage(slide.image);
                  }}
                  className="sm:hidden absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border border-amber-500/40 text-[10px] font-semibold text-amber-300 backdrop-blur-md cursor-pointer active:scale-95 shadow-lg z-10"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isVi ? 'Vuốt zoom ảnh' : 'Pinch to zoom'}</span>
                </button>
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

      {/* Interactive Mobile Pinch-to-Zoom & Pan Lightbox Modal */}
      {zoomImage && (
        <MobileInteractiveZoomViewer
          image={zoomImage}
          onClose={() => setZoomImage(null)}
          isVi={isVi}
          initialScale={initialZoomScale}
        />
      )}
    </div>
  );
};

export const MentalMathGuideCarousel = TwoDigitMentalMathGuideCarousel;

