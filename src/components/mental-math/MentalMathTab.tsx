import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TwoDigitMultiplicationPage, TrainingTopic } from './TwoDigitMultiplicationPage';
import { TwoDigitMentalMathChallengePage } from './TwoDigitMentalMathChallengePage';
import { TwoDigitMentalMathVisualGuidePage } from './TwoDigitMentalMathVisualGuidePage';
import { MultiplyBy11Page, Multiply11Topic } from './MultiplyBy11Page';
import { MultiplyBy11ChallengePage } from './MultiplyBy11ChallengePage';
import { MultiplyBy11VisualGuidePage } from './MultiplyBy11VisualGuidePage';
import { MultiplyWith1DigitPage, Multiply1DigitTopic } from './MultiplyWith1DigitPage';
import { MultiplyWith1DigitChallengePage } from './MultiplyWith1DigitChallengePage';
import { MultiplyWith1DigitVisualGuidePage } from './MultiplyWith1DigitVisualGuidePage';
import cardBg from '../../assets/images/Mental Math/TwoDigitBg.jpg';
import card11Bg from '../../assets/images/Mental Math/MultiplyBy11Bg.jpg';
import card1DigitBg from '../../assets/images/Mental Math/MultiplyWith1DigitBg.jpg';

type MentalMathPage =
  | 'card'
  | 'two-digit-page'
  | 'challenge-page'
  | 'visual-guide-page'
  | 'multiply-11-page'
  | 'multiply-11-challenge'
  | 'multiply-11-visual-guide'
  | 'multiply-1-digit-page'
  | 'multiply-1-digit-challenge'
  | 'multiply-1-digit-visual-guide';

export const MentalMathTab: React.FC = () => {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<MentalMathPage>('card');
  const [trainingTopic, setTrainingTopic] = useState<TrainingTopic>('twoDigit');
  const [challengeTopic, setChallengeTopic] = useState<TrainingTopic>('twoDigit');
  const [multiply11ChallengeTopic, setMultiply11ChallengeTopic] = useState<Multiply11Topic>('general');
  const [multiply1DigitChallengeTopic, setMultiply1DigitChallengeTopic] = useState<Multiply1DigitTopic>('general');

  // ==================== FLOW 1: PHÉP NHÂN 2 CHỮ SỐ ====================
  // Trang Thử thách Mental Math Challenge (5s / 10s) -> Quay lại trang Luyện tập (Training Page)
  if (currentPage === 'challenge-page') {
    return (
      <TwoDigitMentalMathChallengePage
        initialTopic={challengeTopic}
        onBack={() => setCurrentPage('two-digit-page')}
      />
    );
  }

  // Trang Hướng dẫn Trực quan (Visual Guide Page)
  if (currentPage === 'visual-guide-page') {
    return (
      <TwoDigitMentalMathVisualGuidePage
        onBack={() => setCurrentPage('two-digit-page')}
        onOpenChallenge={() => setCurrentPage('challenge-page')}
      />
    );
  }

  // Trang Luyện tập Phép nhân 2 chữ số
  if (currentPage === 'two-digit-page') {
    return (
      <TwoDigitMultiplicationPage
        initialTopic={trainingTopic}
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setChallengeTopic(topic);
          setCurrentPage('challenge-page');
        }}
        onOpenVisualGuide={() => setCurrentPage('visual-guide-page')}
      />
    );
  }

  // ==================== FLOW 2: NHÂN VỚI SỐ 11 (RIÊNG BIỆT) ====================
  // Trang Thử thách Nhân với 11 Challenge (5s / 10s)
  if (currentPage === 'multiply-11-challenge') {
    return (
      <MultiplyBy11ChallengePage
        initialTopic={multiply11ChallengeTopic}
        onBack={() => setCurrentPage('multiply-11-page')}
      />
    );
  }

  // Trang Hướng dẫn Trực quan Nhân với 11
  if (currentPage === 'multiply-11-visual-guide') {
    return (
      <MultiplyBy11VisualGuidePage
        onBack={() => setCurrentPage('multiply-11-page')}
        onOpenChallenge={() => setCurrentPage('multiply-11-challenge')}
      />
    );
  }

  // Trang Luyện tập Nhân với 11
  if (currentPage === 'multiply-11-page') {
    return (
      <MultiplyBy11Page
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setMultiply11ChallengeTopic(topic);
          setCurrentPage('multiply-11-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('multiply-11-visual-guide')}
      />
    );
  }

  // ==================== FLOW 3: NHÂN VỚI 1 CHỮ SỐ (RIÊNG BIỆT) ====================
  // Trang Thử thách Nhân với 1 chữ số Challenge (5s / 10s)
  if (currentPage === 'multiply-1-digit-challenge') {
    return (
      <MultiplyWith1DigitChallengePage
        initialTopic={multiply1DigitChallengeTopic}
        onBack={() => setCurrentPage('multiply-1-digit-page')}
      />
    );
  }

  // Trang Hướng dẫn Trực quan Nhân với 1 chữ số
  if (currentPage === 'multiply-1-digit-visual-guide') {
    return (
      <MultiplyWith1DigitVisualGuidePage
        onBack={() => setCurrentPage('multiply-1-digit-page')}
        onOpenChallenge={() => setCurrentPage('multiply-1-digit-challenge')}
      />
    );
  }

  // Trang Luyện tập Nhân với 1 chữ số
  if (currentPage === 'multiply-1-digit-page') {
    return (
      <MultiplyWith1DigitPage
        onBack={() => setCurrentPage('card')}
        onOpenChallenge={(topic) => {
          if (topic) setMultiply1DigitChallengeTopic(topic);
          setCurrentPage('multiply-1-digit-challenge');
        }}
        onOpenVisualGuide={() => setCurrentPage('multiply-1-digit-visual-guide')}
      />
    );
  }

  // Màn hình chính 3 Card: Phép nhân 2 chữ số, Nhân với số 11, Nhân với 1 chữ số
  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300 px-2 sm:px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-7 w-full max-w-md md:max-w-none mx-auto">
        {/* Card 1: Phép nhân 2 chữ số (68 × 99) */}
        <div
          onClick={() => {
            setTrainingTopic('twoDigit');
            setCurrentPage('two-digit-page');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setTrainingTopic('twoDigit');
              setCurrentPage('two-digit-page');
            }
          }}
          className="group relative rounded-2xl sm:rounded-3xl border border-amber-500/40 hover:border-amber-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-amber-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6"
        >
          {/* Background Image với hiệu ứng sáng rõ và zoom nhẹ khi hover */}
          <img
            src={cardBg}
            alt="2-Digit Multiplication Neural Background"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
          />

          {/* Lớp phủ tương phản nhẹ ở trung tâm */}
          <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Viền ánh sáng hổ phách đồng điệu với hình ảnh */}
          <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/20 group-hover:ring-amber-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

          {/* Nội dung text: Căn giữa hoàn hảo ngay giữa card */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-amber-100 whitespace-nowrap">
              {t.cardMultiply2Title}
            </h2>
          </div>
        </div>

        {/* Card 2: Nhân với số 11 (Căn chuẩn xác bên trong khung phát sáng của tranh) */}
        <div
          onClick={() => {
            setCurrentPage('multiply-11-page');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setCurrentPage('multiply-11-page');
            }
          }}
          className="group relative rounded-2xl sm:rounded-3xl border border-amber-500/40 hover:border-amber-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-amber-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6"
        >
          {/* Background Image với hiệu ứng sáng rõ và zoom nhẹ khi hover */}
          <img
            src={card11Bg}
            alt="Multiply by 11 Neural Background"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
          />

          {/* Lớp phủ tương phản nhẹ */}
          <div className="absolute inset-0 bg-radial from-slate-950/45 via-slate-950/10 to-transparent pointer-events-none" />

          {/* Viền ánh sáng hổ phách đồng điệu với hình ảnh */}
          <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/20 group-hover:ring-amber-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

          {/* Nội dung text: Căn giữa hoàn hảo và luôn trên 1 dòng duy nhất */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-amber-100 whitespace-nowrap">
              {t.cardMultiply11Title}
            </h2>
          </div>
        </div>

        {/* Card 3: Nhân với 1 chữ số (Copy nguyên cấu trúc của card Nhân với số 11) */}
        <div
          onClick={() => {
            setCurrentPage('multiply-1-digit-page');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setCurrentPage('multiply-1-digit-page');
            }
          }}
          className="group relative rounded-2xl sm:rounded-3xl border border-amber-500/40 hover:border-amber-400 aspect-[16/9] w-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-amber-500/25 hover:-translate-y-1 cursor-pointer overflow-hidden p-4 sm:p-6"
        >
          {/* Background Image với hiệu ứng sáng rõ và zoom nhẹ khi hover */}
          <img
            src={card1DigitBg}
            alt="Multiply by 1-Digit Neural Background"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
          />

          {/* Lớp phủ tương phản nhẹ */}
          <div className="absolute inset-0 bg-radial from-slate-950/45 via-slate-950/10 to-transparent pointer-events-none" />

          {/* Viền ánh sáng hổ phách đồng điệu với hình ảnh */}
          <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/20 group-hover:ring-amber-400/50 transition-all rounded-2xl sm:rounded-3xl pointer-events-none" />

          {/* Nội dung text: Căn giữa hoàn hảo và luôn trên 1 dòng duy nhất */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-amber-100 whitespace-nowrap">
              {t.cardMultiply1DigitTitle}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
