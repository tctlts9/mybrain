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
import { downloadGuidePdf } from '../../utils/guidePdfDownload';

export interface BlueprintSlide {
  id: number;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  formula: string;
  stepsVi: string[];
  stepsEn: string[];
  exampleVi: string;
  exampleEn: string;
  /** Nếu sau này bạn muốn chèn ảnh JPG/PNG riêng cho slide, chỉ cần truyền đường dẫn image vào đây */
  image?: string;
}

export type CarouselAccentColor = 'amber' | 'sky' | 'silver' | 'emerald' | 'lime' | 'rose' | 'violet' | 'yellow' | 'blue' | 'teal' | 'pink';

interface VisualBlueprintCarouselProps {
  slides: BlueprintSlide[];
  accentColor?: CarouselAccentColor;
}

const ACCENT_THEME: Record<
  CarouselAccentColor,
  {
    iconBox: string;
    sparkle: string;
    counterText: string;
    arrowBtnHover: string;
    containerBorder: string;
    badgeBorderText: string;
    formulaBorder: string;
    stepNumText: string;
    zoomBtnHover: string;
    mobileZoomBtn: string;
    mobileZoomIcon: string;
    sideArrowHover: string;
    dotActive: string;
    zoomPillText: string;
    zoomIcon: string;
    zoomResetBorder: string;
  }
> = {
  amber: {
    iconBox: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    sparkle: 'text-amber-400',
    counterText: 'text-amber-400',
    arrowBtnHover: 'hover:border-amber-500/40',
    containerBorder: 'border-amber-500/20',
    badgeBorderText: 'border-amber-500/30 text-amber-300',
    formulaBorder: 'border-amber-500/35',
    stepNumText: 'text-amber-300',
    zoomBtnHover: 'hover:text-amber-400',
    mobileZoomBtn: 'border-amber-500/40 text-amber-300',
    mobileZoomIcon: 'text-amber-400',
    sideArrowHover: 'hover:bg-amber-500 hover:text-slate-950',
    dotActive: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
    zoomPillText: 'text-amber-400',
    zoomIcon: 'text-amber-400',
    zoomResetBorder: 'text-amber-400 border-amber-500/40',
  },
  sky: {
    iconBox: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    sparkle: 'text-sky-400',
    counterText: 'text-sky-400',
    arrowBtnHover: 'hover:border-sky-500/40',
    containerBorder: 'border-sky-500/20',
    badgeBorderText: 'border-sky-500/30 text-sky-300',
    formulaBorder: 'border-sky-500/35',
    stepNumText: 'text-sky-300',
    zoomBtnHover: 'hover:text-sky-400',
    mobileZoomBtn: 'border-sky-500/40 text-sky-300',
    mobileZoomIcon: 'text-sky-400',
    sideArrowHover: 'hover:bg-sky-500 hover:text-slate-950',
    dotActive: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    zoomPillText: 'text-sky-400',
    zoomIcon: 'text-sky-400',
    zoomResetBorder: 'text-sky-400 border-sky-500/40',
  },
  silver: {
    iconBox: 'bg-[#C4C4C4]/15 border-[#C4C4C4]/30 text-[#C4C4C4]',
    sparkle: 'text-[#C4C4C4]',
    counterText: 'text-[#C4C4C4]',
    arrowBtnHover: 'hover:border-[#C4C4C4]/40',
    containerBorder: 'border-[#C4C4C4]/25',
    badgeBorderText: 'border-[#C4C4C4]/30 text-[#E0E0E0]',
    formulaBorder: 'border-[#C4C4C4]/35',
    stepNumText: 'text-[#E0E0E0]',
    zoomBtnHover: 'hover:text-[#C4C4C4]',
    mobileZoomBtn: 'border-[#C4C4C4]/40 text-[#E0E0E0]',
    mobileZoomIcon: 'text-[#C4C4C4]',
    sideArrowHover: 'hover:bg-[#C4C4C4] hover:text-slate-950',
    dotActive: 'bg-[#C4C4C4] shadow-[0_0_8px_rgba(196,196,196,0.9)]',
    zoomPillText: 'text-[#C4C4C4]',
    zoomIcon: 'text-[#C4C4C4]',
    zoomResetBorder: 'text-[#C4C4C4] border-[#C4C4C4]/40',
  },
  emerald: {
    iconBox: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    sparkle: 'text-emerald-400',
    counterText: 'text-emerald-400',
    arrowBtnHover: 'hover:border-emerald-500/40',
    containerBorder: 'border-emerald-500/20',
    badgeBorderText: 'border-emerald-500/30 text-emerald-300',
    formulaBorder: 'border-emerald-500/35',
    stepNumText: 'text-emerald-300',
    zoomBtnHover: 'hover:text-emerald-400',
    mobileZoomBtn: 'border-emerald-500/40 text-emerald-300',
    mobileZoomIcon: 'text-emerald-400',
    sideArrowHover: 'hover:bg-emerald-500 hover:text-slate-950',
    dotActive: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
    zoomPillText: 'text-emerald-400',
    zoomIcon: 'text-emerald-400',
    zoomResetBorder: 'text-emerald-400 border-emerald-500/40',
  },
  lime: {
    iconBox: 'bg-[#D8E46B]/15 border-[#D8E46B]/30 text-[#D8E46B]',
    sparkle: 'text-[#D8E46B]',
    counterText: 'text-[#D8E46B]',
    arrowBtnHover: 'hover:border-[#D8E46B]/40',
    containerBorder: 'border-[#D8E46B]/25',
    badgeBorderText: 'border-[#D8E46B]/30 text-[#e4ee8e]',
    formulaBorder: 'border-[#D8E46B]/35',
    stepNumText: 'text-[#e4ee8e]',
    zoomBtnHover: 'hover:text-[#D8E46B]',
    mobileZoomBtn: 'border-[#D8E46B]/40 text-[#e4ee8e]',
    mobileZoomIcon: 'text-[#D8E46B]',
    sideArrowHover: 'hover:bg-[#D8E46B] hover:text-slate-950',
    dotActive: 'bg-[#D8E46B] shadow-[0_0_8px_rgba(216,228,107,0.9)]',
    zoomPillText: 'text-[#D8E46B]',
    zoomIcon: 'text-[#D8E46B]',
    zoomResetBorder: 'text-[#D8E46B] border-[#D8E46B]/40',
  },
  yellow: {
    iconBox: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    sparkle: 'text-yellow-400',
    counterText: 'text-yellow-400',
    arrowBtnHover: 'hover:border-yellow-500/40',
    containerBorder: 'border-yellow-500/20',
    badgeBorderText: 'border-yellow-500/30 text-yellow-300',
    formulaBorder: 'border-yellow-500/35',
    stepNumText: 'text-yellow-300',
    zoomBtnHover: 'hover:text-yellow-400',
    mobileZoomBtn: 'border-yellow-500/40 text-yellow-300',
    mobileZoomIcon: 'text-yellow-400',
    sideArrowHover: 'hover:bg-yellow-400 hover:text-slate-950',
    dotActive: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]',
    zoomPillText: 'text-yellow-400',
    zoomIcon: 'text-yellow-400',
    zoomResetBorder: 'text-yellow-400 border-yellow-500/40',
  },
  blue: {
    iconBox: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    sparkle: 'text-blue-400',
    counterText: 'text-blue-400',
    arrowBtnHover: 'hover:border-blue-500/40',
    containerBorder: 'border-blue-500/20',
    badgeBorderText: 'border-blue-500/30 text-blue-300',
    formulaBorder: 'border-blue-500/35',
    stepNumText: 'text-blue-300',
    zoomBtnHover: 'hover:text-blue-400',
    mobileZoomBtn: 'border-blue-500/40 text-blue-300',
    mobileZoomIcon: 'text-blue-400',
    sideArrowHover: 'hover:bg-blue-500 hover:text-white',
    dotActive: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]',
    zoomPillText: 'text-blue-400',
    zoomIcon: 'text-blue-400',
    zoomResetBorder: 'text-blue-400 border-blue-500/40',
  },
  violet: {
    iconBox: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
    sparkle: 'text-violet-400',
    counterText: 'text-violet-400',
    arrowBtnHover: 'hover:border-violet-500/40',
    containerBorder: 'border-violet-500/20',
    badgeBorderText: 'border-violet-500/30 text-violet-300',
    formulaBorder: 'border-violet-500/35',
    stepNumText: 'text-violet-300',
    zoomBtnHover: 'hover:text-violet-400',
    mobileZoomBtn: 'border-violet-500/40 text-violet-300',
    mobileZoomIcon: 'text-violet-400',
    sideArrowHover: 'hover:bg-violet-500 hover:text-white',
    dotActive: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]',
    zoomPillText: 'text-violet-400',
    zoomIcon: 'text-violet-400',
    zoomResetBorder: 'text-violet-400 border-violet-500/40',
  },
  rose: {
    iconBox: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    sparkle: 'text-rose-400',
    counterText: 'text-rose-400',
    arrowBtnHover: 'hover:border-rose-500/40',
    containerBorder: 'border-rose-500/20',
    badgeBorderText: 'border-rose-500/30 text-rose-300',
    formulaBorder: 'border-rose-500/35',
    stepNumText: 'text-rose-300',
    zoomBtnHover: 'hover:text-rose-400',
    mobileZoomBtn: 'border-rose-500/40 text-rose-300',
    mobileZoomIcon: 'text-rose-400',
    sideArrowHover: 'hover:bg-rose-500 hover:text-white',
    dotActive: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
    zoomPillText: 'text-rose-400',
    zoomIcon: 'text-rose-400',
    zoomResetBorder: 'text-rose-400 border-rose-500/40',
  },
  teal: {
    iconBox: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
    sparkle: 'text-teal-400',
    counterText: 'text-teal-400',
    arrowBtnHover: 'hover:border-teal-500/40',
    containerBorder: 'border-teal-500/20',
    badgeBorderText: 'border-teal-500/30 text-teal-300',
    formulaBorder: 'border-teal-500/35',
    stepNumText: 'text-teal-300',
    zoomBtnHover: 'hover:text-teal-400',
    mobileZoomBtn: 'border-teal-500/40 text-teal-300',
    mobileZoomIcon: 'text-teal-400',
    sideArrowHover: 'hover:bg-teal-500 hover:text-slate-950',
    dotActive: 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]',
    zoomPillText: 'text-teal-400',
    zoomIcon: 'text-teal-400',
    zoomResetBorder: 'text-teal-400 border-teal-500/40',
  },
  pink: {
    iconBox: 'bg-[#F4A7B9]/15 border-[#F4A7B9]/30 text-[#F4A7B9]',
    sparkle: 'text-[#F4A7B9]',
    counterText: 'text-[#F4A7B9]',
    arrowBtnHover: 'hover:border-[#F4A7B9]/40',
    containerBorder: 'border-[#F4A7B9]/25',
    badgeBorderText: 'border-[#F4A7B9]/30 text-[#FBCFE8]',
    formulaBorder: 'border-[#F4A7B9]/35',
    stepNumText: 'text-[#FBCFE8]',
    zoomBtnHover: 'hover:text-[#F4A7B9]',
    mobileZoomBtn: 'border-[#F4A7B9]/40 text-[#FBCFE8]',
    mobileZoomIcon: 'text-[#F4A7B9]',
    sideArrowHover: 'hover:bg-[#F4A7B9] hover:text-slate-950',
    dotActive: 'bg-[#F4A7B9] shadow-[0_0_8px_rgba(244,167,185,0.9)]',
    zoomPillText: 'text-[#F4A7B9]',
    zoomIcon: 'text-[#F4A7B9]',
    zoomResetBorder: 'text-[#F4A7B9] border-[#F4A7B9]/40',
  },
};

export const VisualBlueprintCarousel: React.FC<VisualBlueprintCarouselProps> = ({
  slides,
  accentColor = 'yellow',
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const theme = ACCENT_THEME[accentColor];

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [zoomSlide, setZoomSlide] = useState<BlueprintSlide | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);
  const slideLastTapTimeRef = useRef<number>(0);

  // Lightbox pinch/pan refs
  const touchStartDistRef = useRef<number>(0);
  const touchStartScaleRef = useRef<number>(1);
  const touchLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lightboxLastTapTimeRef = useRef<number>(0);
  const lightboxLastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const scrollToSlide = useCallback(
    (index: number) => {
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
    },
    [slides.length]
  );

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

  const openZoom = (slide: BlueprintSlide, initialScale = 1) => {
    setIsTransitioning(true);
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    setZoomSlide(slide);
  };

  const handleSlideTouchStart = (e: React.TouchEvent, slide: BlueprintSlide) => {
    if (e.touches.length === 2) {
      openZoom(slide, 1.4);
      return;
    }

    const now = Date.now();
    if (now - slideLastTapTimeRef.current < 300) {
      slideLastTapTimeRef.current = 0;
      openZoom(slide, 1.5);
      return;
    }
    slideLastTapTimeRef.current = now;

    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleSlideTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleSlideTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40;
    if (diff > threshold && activeIndex < slides.length - 1) {
      scrollToSlide(activeIndex + 1);
    } else if (diff < -threshold && activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    }
  };

  // Lightbox gesture handlers
  const handleViewerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      isPanningRef.current = false;
      setIsTransitioning(false);
      touchStartDistRef.current = getDistance(e.touches[0], e.touches[1]);
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const touch = e.touches[0];
      const timeDiff = now - lightboxLastTapTimeRef.current;
      const distFromLastTap = Math.hypot(
        touch.clientX - lightboxLastTapPosRef.current.x,
        touch.clientY - lightboxLastTapPosRef.current.y
      );

      if (timeDiff < 300 && distFromLastTap < 40) {
        lightboxLastTapTimeRef.current = 0;
        setIsTransitioning(true);
        if (scale > 1.2) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.0);
          setPosition({ x: 0, y: 0 });
        }
        return;
      }

      lightboxLastTapTimeRef.current = now;
      lightboxLastTapPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (scale > 1) {
        isPanningRef.current = true;
        setIsTransitioning(false);
        touchLastPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleViewerTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      if (touchStartDistRef.current > 0) {
        const factor = currentDist / touchStartDistRef.current;
        const newScale = clamp(touchStartScaleRef.current * factor, 1, 3.5);
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

  const handleViewerTouchEnd = (e: React.TouchEvent) => {
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

  const handleViewerWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.85;
    setScale((prev) => {
      const next = clamp(prev * zoomFactor, 1, 3.5);
      if (next <= 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomSlide(null);
      if (e.key === 'ArrowRight' && !zoomSlide) scrollToSlide(activeIndex + 1);
      if (e.key === 'ArrowLeft' && !zoomSlide) scrollToSlide(activeIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToSlide, zoomSlide]);

  const renderSlideCard = (slide: BlueprintSlide, zoomed = false) => {
    if (slide.image) {
      return (
        <img
          src={slide.image}
          alt={isVi ? slide.titleVi : slide.titleEn}
          referrerPolicy="no-referrer"
          className={
            zoomed
              ? 'max-w-[92vw] max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800/80 select-none pointer-events-none'
              : 'w-full h-full object-contain cursor-zoom-in select-none transition-transform duration-500 group-hover:scale-[1.01]'
          }
          onClick={!zoomed ? () => openZoom(slide, 1) : undefined}
          draggable={false}
          loading="eager"
        />
      );
    }

    const steps = isVi ? slide.stepsVi : slide.stepsEn;

    return (
      <div
        onClick={!zoomed ? () => openZoom(slide, 1.1) : undefined}
        className={`w-full h-full flex flex-col justify-between p-5 sm:p-8 md:p-10 bg-gradient-to-br from-[#061830] via-slate-950 to-slate-900 text-left ${
          zoomed
            ? 'max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl pointer-events-none'
            : 'cursor-zoom-in pt-6 sm:pt-8 pb-12 sm:pb-14'
        }`}
      >
        <div className="space-y-3 sm:space-y-4">
          <h3 className={`text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight ${!zoomed ? 'pr-10 sm:pr-12' : ''}`}>
            {isVi ? slide.titleVi : slide.titleEn}
          </h3>

          <div
            className={`px-4 py-3 sm:py-4 rounded-2xl bg-slate-950/90 border ${theme.formulaBorder} font-mono text-sm sm:text-xl md:text-2xl font-black text-white tracking-tight text-center shadow-inner`}
          >
            {slide.formula}
          </div>
        </div>

        <div className="my-4 space-y-2.5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/75 border border-slate-800/90"
            >
              <span
                className={`w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold ${theme.stepNumText} flex items-center justify-center shrink-0 mt-0.5`}
              >
                {i + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200 font-mono">
          <strong className="text-emerald-400 mr-2 font-sans">
            {isVi ? 'Ví dụ minh họa:' : 'Worked Example:'}
          </strong>
          <span>{isVi ? slide.exampleVi : slide.exampleEn}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-slate-900/80 p-2 sm:p-4 md:p-5 shadow-2xl space-y-2.5 sm:space-y-3">
      {/* Top Header: Title & Navigation Controls (Synced with TwoDigitMentalMathGuideCarousel) */}
      <div className="flex items-center justify-between px-1 sm:px-2 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 ${theme.iconBox}`}
          >
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2">
              <span>{isVi ? 'Hướng Dẫn' : 'Visual Guide'}</span>
              <Sparkles className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${theme.sparkle}`} />
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              {isVi ? 'Vuốt ngang để chuyển bước • Vuốt 2 ngón để zoom' : 'Swipe to switch steps • Pinch to zoom'}
            </p>
          </div>
        </div>

        {/* Counter, Download Button & Arrow Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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

          <span
            className={`px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-950 border border-slate-800 text-[11px] sm:text-xs font-mono font-bold shadow-xs ${theme.counterText}`}
          >
            {activeIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => scrollToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 ${theme.arrowBtnHover} text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90`}
            title={isVi ? 'Bước trước' : 'Previous'}
            aria-label="Previous step"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 ${theme.arrowBtnHover} text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90`}
            title={isVi ? 'Bước sau' : 'Next'}
            aria-label="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slider Container */}
      <div className={`relative group overflow-hidden rounded-xl sm:rounded-2xl border ${theme.containerBorder} bg-[#061830] shadow-xl`}>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="carousel-track"
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              onTouchStart={(e) => handleSlideTouchStart(e, slide)}
              onTouchMove={handleSlideTouchMove}
              onTouchEnd={handleSlideTouchEnd}
              className="carousel-slide flex items-center justify-center bg-[#061830] relative overflow-hidden"
            >
              <div
                className={`${
                  slide.image ? 'carousel-slide-media' : 'w-full min-h-[380px] sm:aspect-[16/9]'
                } relative flex items-center justify-center overflow-hidden bg-[#061830]`}
              >
                {renderSlideCard(slide)}

                {/* Top-Right Zoom Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openZoom(slide, slide.image ? 1 : 1.1);
                  }}
                  className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 ${theme.zoomBtnHover} transition-all cursor-pointer backdrop-blur-md opacity-85 hover:opacity-100 shadow-md active:scale-90 z-10`}
                  title={isVi ? 'Phóng to hướng dẫn' : 'Zoom guide'}
                  aria-label="Zoom diagram"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Mobile Touch Zoom Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openZoom(slide, slide.image ? 1 : 1.1);
                  }}
                  className={`sm:hidden absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border ${theme.mobileZoomBtn} text-[10px] font-semibold backdrop-blur-md cursor-pointer active:scale-95 shadow-lg z-10`}
                >
                  <ZoomIn className={`w-3.5 h-3.5 ${theme.mobileZoomIcon}`} />
                  <span>{isVi ? 'Vuốt zoom' : 'Pinch to zoom'}</span>
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
          className={`hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 ${theme.sideArrowHover} disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer`}
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === slides.length - 1}
          className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 ${theme.sideArrowHover} disabled:opacity-0 disabled:pointer-events-none text-white border border-slate-700/80 backdrop-blur-md items-center justify-center transition-all shadow-lg active:scale-90 z-20 cursor-pointer`}
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floating Indicator Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 z-20 shadow-md">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              className={`transition-all rounded-full cursor-pointer ${
                activeIndex === i
                  ? `w-5 sm:w-6 h-1.5 sm:h-2 ${theme.dotActive}`
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-600 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Mobile Pinch-to-Zoom & Pan Lightbox Modal */}
      {zoomSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center select-none touch-none animate-in fade-in duration-200"
          onTouchStart={handleViewerTouchStart}
          onTouchMove={handleViewerTouchMove}
          onTouchEnd={handleViewerTouchEnd}
          onWheel={handleViewerWheel}
          onClick={(e) => {
            if (scale <= 1.15 && e.target === e.currentTarget) {
              setZoomSlide(null);
            }
          }}
        >
          <div className="absolute top-3 inset-x-3 sm:top-5 sm:inset-x-6 z-30 flex items-center justify-between pointer-events-auto">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 ${theme.zoomPillText} font-mono text-xs font-bold shadow-xl backdrop-blur-md`}
            >
              <ZoomIn className={`w-3.5 h-3.5 ${theme.zoomIcon}`} />
              <span>{Math.round(scale * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setScale((prev) => clamp(prev + 0.35, 1, 3.5));
                }}
                className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer"
                title={isVi ? 'Phóng to (+)' : 'Zoom In (+)'}
                aria-label="Zoom in"
              >
                <ZoomIn className={`w-4 h-4 ${theme.zoomIcon}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setScale((prev) => {
                    const next = clamp(prev - 0.35, 1, 3.5);
                    if (next <= 1.05) {
                      setPosition({ x: 0, y: 0 });
                      return 1;
                    }
                    return next;
                  });
                }}
                disabled={scale <= 1.05}
                className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer"
                title={isVi ? 'Thu nhỏ (-)' : 'Zoom Out (-)'}
                aria-label="Zoom out"
              >
                <ZoomOut className={`w-4 h-4 ${theme.zoomIcon}`} />
              </button>

              {scale > 1.05 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsTransitioning(true);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 ${theme.zoomResetBorder} border flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer`}
                  title={isVi ? 'Đặt lại 100%' : 'Reset 100%'}
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setZoomSlide(null)}
                className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/50 flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer ml-1"
                title={isVi ? 'Đóng (Esc)' : 'Close (Esc)'}
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-3 sm:p-6">
            <div
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                transition: isTransitioning ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                transformOrigin: 'center center',
              }}
              className="will-change-transform flex items-center justify-center w-full max-w-4xl"
            >
              {renderSlideCard(zoomSlide, true)}
            </div>
          </div>

          <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-auto flex justify-center pointer-events-none z-30">
            <div className="px-3 py-1.5 rounded-full bg-slate-950/85 border border-slate-800 text-[11px] sm:text-xs text-slate-300 flex items-center gap-2 shadow-2xl backdrop-blur-md text-center">
              <Move className={`w-3.5 h-3.5 ${theme.zoomIcon} shrink-0`} />
              <span>
                {isVi
                  ? 'Vuốt 2 ngón tay để zoom • Chạm 2 lần để zoom nhanh • Kéo để di chuyển'
                  : 'Pinch with 2 fingers to zoom • Double-tap to quick zoom • Drag to pan'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
