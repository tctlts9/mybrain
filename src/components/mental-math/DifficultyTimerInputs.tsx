import React, { useState, useEffect, useRef } from 'react';
import { Clock, Timer } from 'lucide-react';

interface DifficultyTimerInputsProps {
  timeLimit: number;
  answerTimeLimit: number;
  onChangeTimeLimit: (seconds: number) => void;
  onChangeAnswerTimeLimit: (seconds: number) => void;
  disabled?: boolean;
  isVi: boolean;
  clockIconClassName?: string;
  limitFocusClassName?: string;
  showAnswer?: boolean;
  limitLabelVi?: string;
  limitLabelEn?: string;
}

const MIN_SECONDS = 1;
const MAX_SECONDS = 999;

const clampSeconds = (val: number): number =>
  Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(val)));

export const DifficultyTimerInputs: React.FC<DifficultyTimerInputsProps> = ({
  timeLimit,
  answerTimeLimit,
  onChangeTimeLimit,
  onChangeAnswerTimeLimit,
  disabled = false,
  isVi,
  clockIconClassName = 'text-amber-400',
  limitFocusClassName = 'focus:border-amber-400',
  showAnswer = true,
  limitLabelVi = 'Thời gian:',
  limitLabelEn = 'Limit:',
}) => {
  const [limitDraft, setLimitDraft] = useState<string>(String(timeLimit));
  const [answerDraft, setAnswerDraft] = useState<string>(String(answerTimeLimit));
  const isEditingLimitRef = useRef<boolean>(false);
  const isEditingAnswerRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isEditingLimitRef.current) {
      setLimitDraft(String(timeLimit));
    }
  }, [timeLimit]);

  useEffect(() => {
    if (!isEditingAnswerRef.current) {
      setAnswerDraft(String(answerTimeLimit));
    }
  }, [answerTimeLimit]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setLimitDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_SECONDS) {
        onChangeTimeLimit(clampSeconds(parsed));
      }
    }
  };

  const commitLimit = () => {
    isEditingLimitRef.current = false;
    const parsed = parseInt(limitDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_SECONDS) {
      const fallback = timeLimit >= MIN_SECONDS ? clampSeconds(timeLimit) : 10;
      setLimitDraft(String(fallback));
      onChangeTimeLimit(fallback);
      return;
    }
    const clamped = clampSeconds(parsed);
    setLimitDraft(String(clamped));
    onChangeTimeLimit(clamped);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setAnswerDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_SECONDS) {
        onChangeAnswerTimeLimit(clampSeconds(parsed));
      }
    }
  };

  const commitAnswer = () => {
    isEditingAnswerRef.current = false;
    const parsed = parseInt(answerDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_SECONDS) {
      const fallback = answerTimeLimit >= MIN_SECONDS ? clampSeconds(answerTimeLimit) : 10;
      setAnswerDraft(String(fallback));
      onChangeAnswerTimeLimit(fallback);
      return;
    }
    const clamped = clampSeconds(parsed);
    setAnswerDraft(String(clamped));
    onChangeAnswerTimeLimit(clamped);
  };

  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5 max-w-full">
      {/* Limit / Thời gian quan sát */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 max-w-full">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap">
          <Clock className={`w-3.5 h-3.5 ${clockIconClassName}`} />
          <span>{isVi ? limitLabelVi : limitLabelEn}</span>
        </span>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            disabled={disabled}
            value={limitDraft}
            onFocus={(e) => {
              isEditingLimitRef.current = true;
              e.target.select();
            }}
            onChange={handleLimitChange}
            onBlur={commitLimit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            aria-label={isVi ? 'Thời gian giới hạn (giây)' : 'Limit (seconds)'}
            title={isVi ? 'Nhập số giây giới hạn quan sát (mặc định 10s)' : 'Enter observation time limit in seconds (default 10s)'}
            className={`w-14 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 ${limitFocusClassName} focus:outline-none text-center text-xs font-bold text-white tabular-nums transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <span className="text-[11px] font-bold text-slate-400">s</span>
        </div>
      </div>

      {/* Answer / Thời gian trả lời */}
      {showAnswer && (
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/30 max-w-full">
          <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 whitespace-nowrap">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isVi ? 'Trả lời:' : 'Answer:'}</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              disabled={disabled}
              value={answerDraft}
              onFocus={(e) => {
                isEditingAnswerRef.current = true;
                e.target.select();
              }}
              onChange={handleAnswerChange}
              onBlur={commitAnswer}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              aria-label={isVi ? 'Thời gian trả lời (giây)' : 'Answer time limit (seconds)'}
              title={isVi ? 'Nhập số giây trả lời (mặc định 10s)' : 'Enter answer time limit in seconds (default 10s)'}
              className="w-14 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[11px] font-bold text-cyan-300/80">s</span>
          </div>
        </div>
      )}
    </div>
  );
};
