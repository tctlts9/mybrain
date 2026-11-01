import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Lightbulb, Trophy, Timer, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MentalMathGuideCarousel } from './MentalMathGuideCarousel';

interface TwoDigitMultiplicationPageProps {
  onBack: () => void;
}

interface Question {
  a: number;
  b: number;
  answer: number;
}

export const TwoDigitMultiplicationPage: React.FC<TwoDigitMultiplicationPageProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Practice state
  const [question, setQuestion] = useState<Question>({ a: 86, b: 68, answer: 5848 });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate a new 2-digit multiplication problem
  const generateNewQuestion = () => {
    const a = Math.floor(Math.random() * 88) + 12; // 12 to 99
    const b = Math.floor(Math.random() * 88) + 11; // 11 to 98
    setQuestion({
      a,
      b,
      answer: a * b,
    });
    setUserAnswer('');
    setFeedback('idle');
    setShowHint(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    generateNewQuestion();
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;

    if (parsed === question.answer) {
      setFeedback('correct');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10 + streak * 2);
      setSolvedCount((c) => c + 1);
    } else {
      setFeedback('incorrect');
      setStreak(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Mental math steps calculation for hint
  const tensB = Math.floor(question.b / 10) * 10;
  const unitsB = question.b % 10;
  const step1 = question.a * tensB;
  const step2 = question.a * unitsB;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back button & Breadcrumbs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-amber-400 font-semibold">{isVi ? 'Phép nhân 2 chữ số' : '2-Digit Multiplication'}</span>
        </div>
      </div>

      {/* Section 1: Scroll Image các Image hướng dẫn */}
      <MentalMathGuideCarousel />

      {/* Section 2: Đấu trường Luyện tập Trực tiếp trên trang (Interactive Practice) */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/25 p-5 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle backdrop glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi ? 'Phòng Luyện Tính Nhẩm Tương Tác' : 'Interactive Mental Math Arena'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">{isVi ? 'Điểm:' : 'Score:'}</span>
              <span className="font-bold text-amber-400">{score}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
              <span className="text-emerald-400">🔥</span>
              <span className="text-slate-400">{isVi ? 'Chuỗi:' : 'Streak:'}</span>
              <span className="font-bold text-emerald-400">{streak}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono font-bold text-sky-400">{formatTime(timer)}</span>
            </div>
          </div>
        </div>

        {/* Math Question Arena */}
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-6 sm:p-10 text-center shadow-inner">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              {isVi ? `Bài tập #${solvedCount + 1}` : `Problem #${solvedCount + 1}`}
            </div>
            <div className="text-4xl sm:text-6xl font-black text-white tracking-wide font-mono py-2">
              {question.a} × {question.b}
            </div>

            {/* Hint Box (if toggled) */}
            {showHint && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs text-amber-300 font-mono space-y-1 animate-in fade-in duration-200">
                <div className="font-sans font-bold flex items-center gap-1 text-amber-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Gợi ý phân tách nhẩm:' : 'Mental split hint:'}</span>
                </div>
                <div>• ({question.a} × {tensB}) = {step1}</div>
                <div>• ({question.a} × {unitsB}) = {step2}</div>
                <div className="font-semibold">• Kết quả: {step1} + {step2}</div>
              </div>
            )}

            {/* Feedback message */}
            {feedback === 'correct' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVi ? 'Chính xác! Bạn làm rất tốt!' : 'Correct! Great mental calculation!'} (+{10 + (streak - 1) * 2}đ)</span>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150">
                <AlertCircle className="w-4 h-4" />
                <span>{isVi ? `Chưa chính xác! Đáp án đúng là ${question.answer}` : `Not quite! The correct answer is ${question.answer}`}</span>
              </div>
            )}
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={isVi ? 'Nhập kết quả tính nhẩm...' : 'Type your answer...'}
                disabled={feedback === 'correct'}
                className="w-full h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {feedback === 'correct' ? (
                <button
                  type="button"
                  onClick={generateNewQuestion}
                  className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  <span>{isVi ? 'Câu tiếp theo' : 'Next Problem'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <span>{isVi ? 'Kiểm tra kết quả' : 'Check Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                title={isVi ? 'Xem gợi ý cách tính' : 'Toggle calculation hint'}
                className="h-12 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-500/40 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">{isVi ? 'Gợi ý' : 'Hint'}</span>
              </button>

              <button
                type="button"
                onClick={generateNewQuestion}
                title={isVi ? 'Đổi đề bài khác' : 'Skip problem'}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
