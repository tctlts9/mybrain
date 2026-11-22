import React from 'react';
import { Volume2, Gauge } from 'lucide-react';
import { DailyReflexQuestion } from '../../utils/dailyReflexOperations';

interface DailyReflexQuestionDisplayProps {
  question: DailyReflexQuestion;
  isVi: boolean;
  isSpeakingQuestion: boolean;
  questionSpeed: number;
  onPronounce: () => void;
  onSetSpeed: (speed: number) => void;
}

export const DailyReflexQuestionDisplay: React.FC<DailyReflexQuestionDisplayProps> = ({
  question,
  isVi,
  isSpeakingQuestion,
  questionSpeed,
  onPronounce,
  onSetSpeed,
}) => {
  const renderFormula = () => {
    if (question.kind === 'sqrt') {
      const aStr = question.a.toLocaleString();
      const sizeClass =
        aStr.length >= 6
          ? 'text-2xl sm:text-3xl lg:text-4xl'
          : 'text-3xl sm:text-5xl';
      return (
        <div
          className={`${sizeClass} font-black text-white tracking-normal font-mono flex items-center justify-center gap-1.5 leading-tight`}
        >
          <span className="text-yellow-400 font-sans">√</span>
          <span className="whitespace-nowrap tabular-nums">{aStr}</span>
        </div>
      );
    }

    if (question.kind === 'power') {
      const aStr = question.a.toLocaleString();
      const expStr = String(question.b ?? 2);
      return (
        <div className="text-3xl sm:text-5xl font-black text-white tracking-normal font-mono flex items-start justify-center leading-tight tabular-nums">
          <span>{aStr}</span>
          <sup className="text-yellow-400 text-xl sm:text-3xl ml-0.5 mt-1 font-extrabold">
            {expStr}
          </sup>
        </div>
      );
    }

    if (question.kind === 'tokens') {
      const tokens = isVi ? question.displayVi || [] : question.displayEn || [];
      const joinedLen = tokens.map((t) => t.text).join(' ').length;
      const sizeClass =
        joinedLen >= 18
          ? 'text-xl sm:text-2xl lg:text-[2rem]'
          : joinedLen >= 14
          ? 'text-2xl sm:text-3xl lg:text-4xl'
          : 'text-2xl sm:text-4xl lg:text-[2.75rem]';
      return (
        <div
          className={`${sizeClass} font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-tight max-w-full`}
        >
          {tokens.map((tok, idx) => (
            <span
              key={idx}
              className={`whitespace-nowrap tabular-nums ${
                tok.accent ? 'text-yellow-400' : 'text-white'
              }`}
            >
              {tok.text}
            </span>
          ))}
        </div>
      );
    }

    const aStr = question.a.toLocaleString();
    const bStr = question.b?.toLocaleString() ?? '';
    const totalChars = aStr.length + bStr.length;
    const sizeClass =
      totalChars >= 12
        ? 'text-xl sm:text-2xl lg:text-3xl'
        : totalChars >= 9
        ? 'text-2xl sm:text-3xl lg:text-4xl'
        : totalChars >= 7
        ? 'text-3xl sm:text-4xl lg:text-[2.75rem]'
        : 'text-3xl sm:text-5xl';

    return (
      <div
        className={`${sizeClass} font-black text-white tracking-normal font-mono flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2.5 gap-y-1 leading-tight tabular-nums`}
      >
        <span className="whitespace-nowrap">{aStr}</span>
        <span className="text-yellow-400 font-sans">{question.opChar || '+'}</span>
        <span className="whitespace-nowrap">{bStr}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-full py-2 px-1">
        {renderFormula()}

        <button
          type="button"
          onClick={onPronounce}
          className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
            isSpeakingQuestion
              ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-yellow-500/30 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/10'
          }`}
          title={
            isVi
              ? `Đọc câu hỏi - Tốc độ: ${questionSpeed}x`
              : `Pronounce question - Speed: ${questionSpeed}x`
          }
        >
          <Volume2
            className={`w-5 h-5 ${isSpeakingQuestion ? 'animate-bounce' : ''}`}
          />
        </button>
      </div>

      {/* Playback speed selector */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-yellow-400" />
          <span>{isVi ? 'Tốc độ:' : 'Speed:'}</span>
        </span>
        <div className="flex items-center gap-1 ml-0.5">
          {[1.25, 1.5, 1.75].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 tabular-nums ${
                questionSpeed === s
                  ? 'bg-yellow-400 text-slate-950 shadow-xs ring-1 ring-yellow-300 font-extrabold'
                  : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
              }`}
            >
              {`${s}x`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
