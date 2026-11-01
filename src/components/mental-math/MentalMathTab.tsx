import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TwoDigitMultiplicationPage } from './TwoDigitMultiplicationPage';
import cardBg from '../../assets/images/mental_math_bg_1793487233435.jpg';

export const MentalMathTab: React.FC = () => {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<'card' | 'two-digit-page'>('card');

  // Nếu đang ở trang chi tiết Phép nhân 2 chữ số
  if (currentPage === 'two-digit-page') {
    return <TwoDigitMultiplicationPage onBack={() => setCurrentPage('card')} />;
  }

  // Mặc định ở màn hình Card với nền Image và Text đồng bộ phong cách
  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 animate-in fade-in duration-300">
      {/* Card Container: Nền Image + Text đồng bộ theo Image */}
      <div className="max-w-xl w-full mx-auto">
        <div
          onClick={() => setCurrentPage('two-digit-page')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setCurrentPage('two-digit-page');
            }
          }}
          className="group relative rounded-3xl border border-amber-500/40 hover:border-amber-400 p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 hover:shadow-amber-500/25 hover:-translate-y-1.5 cursor-pointer overflow-hidden min-h-[220px] sm:min-h-[250px]"
        >
          {/* Background Image với hiệu ứng sáng rõ và zoom nhẹ khi hover */}
          <img
            src={cardBg}
            alt="Mental Math Neural Background"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-95"
          />

          {/* Lớp phủ tương phản nhẹ ở trung tâm để Phép nhân 2 chữ số nổi bật và giữ rõ dòng 86 x 68 phía dưới */}
          <div className="absolute inset-0 bg-radial from-slate-950/65 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Viền ánh sáng hổ phách đồng điệu với hình ảnh */}
          <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/20 group-hover:ring-amber-400/50 transition-all rounded-3xl pointer-events-none" />

          {/* Nội dung text: Chỉ thể hiện Phép nhân 2 chữ số */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-colors group-hover:text-amber-100">
              {t.cardMultiply2Title}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
