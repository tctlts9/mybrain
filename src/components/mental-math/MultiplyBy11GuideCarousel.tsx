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

import step1Img from '../../assets/images/MultiplyingBy11Guide1.jpg';
import step2Img from '../../assets/images/MultiplyingBy11Guide2.jpg';
import multiplyBy11Pdf from '../../assets/images/MultiplyBy11Guide.pdf';

interface Slide {
  id: number;
  image: string;
  badgeVi: string;
  badgeEn: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: step1Img,
    badgeVi: 'Bước 1: Nhân 11 với số 2 & 3 chữ số',
    badgeEn: 'Step 1: Multiply 11 with 2 & 3-Digit',
  },
  {
    id: 2,
    image: step2Img,
    badgeVi: 'Bước 2: Mở rộng nhân 11 với số 4 & 5 chữ số',
    badgeEn: 'Step 2: 4-Digit & 5-Digit Extension',
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

  const zoomIn = () => {
    setIsTransitioning(true);
    setScale((prev) => clamp(prev * 1.4, 1, 4.5));
  };

  const zoomOut = () => {
    setIsTransitioning(true);
    setScale((prev) => {
      const next = clamp(prev / 1.4, 1, 4.5);
      if (next <= 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const resetZoom = () => {
    setIsTransitioning(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 touch-none select-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl z-20 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
          <Move className="w-3.5 h-3.5" />
          <span>
            {scale > 1.05
              ? isVi
                ? `Đang zoom ${Math.round(scale * 100)}% (Vuốt để di chuyển)`
                : `Zoom ${Math.round(scale * 100)}% (Drag to pan)`
              : isVi
              ? 'Dùng 2 ngón tay vuốt zoom hoặc chạm đúp'
              : 'Pinch to zoom or double-tap'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomIn}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title={isVi ? 'Phóng to' : 'Zoom in'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title={isVi ? 'Thu nhỏ' : 'Zoom out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {scale > 1.05 && (
            <button
              onClick={resetZoom}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              title={isVi ? 'Về kích thước chuẩn (100%)' : 'Reset zoom'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 ml-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
            title={isVi ? 'Đóng' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Zoomable Canvas */}
      <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2">
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isTransitioning ? 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
            transformOrigin: 'center center',
          }}
          className="will-change-transform flex items-center justify-center"
        >
          <img
            src={image}
            alt="Interactive Zoom Guide"
            className="max-h-[82vh] max-w-[94vw] object-contain rounded-xl shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Floating Hint */}
      <div className="z-20 text-[11px] sm:text-xs text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-full border border-slate-800">
        {isVi
          ? 'Mẹo: Chạm 2 lần liên tiếp để phóng to 250% tức thì'
          : 'Tip: Double tap to quickly zoom 250%'}
      </div>
    </div>
  );
};

export const MultiplyBy11GuideCarousel: React.FC = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [lightboxInitialScale, setLightboxInitialScale] = useState<number>(1);

  // Mobile Swipe State
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

      // Horizontal swipe threshold: 45px and more horizontal than vertical
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
  };

  const openZoomViewer = (initialScale = 1.6) => {
    setLightboxInitialScale(initialScale);
    setIsViewerOpen(true);
  };

  const currentSlide = slides[currentIndex];

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Lightbox Interactive Zoom Modal */}
      {isViewerOpen && (
        <MobileInteractiveZoomViewer
          image={currentSlide.image}
          onClose={() => setIsViewerOpen(false)}
          isVi={isVi}
          initialScale={lightboxInitialScale}
        />
      )}

      {/* Slide Navigation Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-sm">
            {isVi ? currentSlide.badgeVi : currentSlide.badgeEn}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Download Guide PDF Button */}
          <a
            href={multiplyBy11Pdf}
            download="MultiplyBy11_VisualGuide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title={isVi ? 'Tải hướng dẫn định dạng PDF' : 'Download Guide (PDF)'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isVi ? 'Tải Guide' : 'Download Guide'}</span>
            <span className="sm:hidden">{isVi ? 'Tải PDF' : 'PDF'}</span>
          </a>

          {/* Zoom Quick Button */}
          <button
            onClick={() => openZoomViewer(1.8)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isVi ? 'Phóng to / Vuốt zoom' : 'Pinch to Zoom'}</span>
            <span className="sm:hidden">{isVi ? 'Zoom' : 'Zoom'}</span>
          </button>
        </div>
      </div>

      {/* Main Image Display Card with Mobile Touch Swipe & Pinch Support */}
      <div
        className="relative w-full max-w-4xl aspect-[16/9] bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-2xl group flex items-center justify-center cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => openZoomViewer(1.8)}
      >
        <img
          src={currentSlide.image}
          alt={`Multiply by 11 Visual Guide Step ${currentIndex + 1}`}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover / Tap to Zoom Overlay Badge */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs shadow-lg transition-transform active:scale-95">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{isVi ? 'Chạm để phóng to & vuốt zoom' : 'Tap to zoom & pan'}</span>
        </div>

        {/* Prev & Next Floating Buttons for Desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-700/60 hover:border-amber-400 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-90 z-10"
          aria-label="Previous step"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-700/60 hover:border-amber-400 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-90 z-10"
          aria-label="Next step"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Dots Indicator & Quick Steps */}
      <div className="flex items-center gap-2 mt-4">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-8 h-2.5 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/30'
                : 'w-2.5 h-2.5 bg-slate-800 hover:bg-slate-700'
            }`}
            aria-label={`Jump to step ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
