import React, { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  SequenceDigitProfile,
  SequenceDisplayMode,
  MIN_SEQUENCE_COUNT,
  MAX_SEQUENCE_COUNT,
} from '../../utils/customDifficultyHelpers';

interface SequenceTopicControlsRowProps {
  idPrefix: string;
  isSelected: boolean;
  disabled?: boolean;
  isVi: boolean;
  sequenceCount: number;
  sequenceDigitProfile: SequenceDigitProfile;
  sequenceDisplayMode: SequenceDisplayMode;
  sequenceIncludeSubtraction: boolean;
  timeLimit: number;
  onSelectSequence: () => void;
  onToggleMixedPlusMinus: () => void;
  onChangeSequenceCount: (val: number) => void;
  onChangeSequenceDigitProfile: (profile: SequenceDigitProfile) => void;
  onChangeSequenceDisplayMode: (mode: SequenceDisplayMode) => void;
}

export const SequenceTopicControlsRow: React.FC<SequenceTopicControlsRowProps> = ({
  idPrefix,
  isSelected,
  disabled = false,
  isVi,
  sequenceCount,
  sequenceDigitProfile,
  sequenceDisplayMode,
  sequenceIncludeSubtraction,
  timeLimit,
  onSelectSequence,
  onToggleMixedPlusMinus,
  onChangeSequenceCount,
  onChangeSequenceDigitProfile,
  onChangeSequenceDisplayMode,
}) => {
  const [countDraft, setCountDraft] = useState<string>(String(sequenceCount));

  useEffect(() => {
    setCountDraft(String(sequenceCount));
  }, [sequenceCount]);

  return (
    <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onSelectSequence}
        title={
          isVi
            ? 'Tùy chọn dãy số cộng liên tiếp giống các cuộc thi Siêu trí tuệ'
            : 'Super-Brain number sequence challenge'
        }
        className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
          isSelected
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
            : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
        }`}
      >
        <SlidersHorizontal
          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-yellow-400'}`}
        />
        <span className="whitespace-nowrap">
          {isVi ? 'Tùy chọn (Dãy số)' : 'Custom (Number Sequence)'}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onToggleMixedPlusMinus}
        aria-pressed={isSelected && sequenceIncludeSubtraction}
        title={
          isVi
            ? 'Bật/tắt dãy số ngẫu nhiên kết hợp cả phép cộng (+) và phép trừ (−) với kết quả luôn hợp lý'
            : 'Toggle mixed addition (+) and subtraction (−) sequence with guaranteed valid results'
        }
        className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
          isSelected && sequenceIncludeSubtraction
            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
            : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
        }`}
      >
        <span
          className={`font-mono font-black text-xs leading-none px-1.5 py-0.5 rounded-md ${
            isSelected && sequenceIncludeSubtraction
              ? 'bg-slate-950/15 text-slate-950'
              : 'bg-emerald-500/15 text-emerald-300'
          }`}
        >
          +/-
        </span>
        <span className="whitespace-nowrap">Phép tính +/-</span>
      </button>

      {isSelected && (
        <div className="w-full flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
          {/* Textbox: Dãy số */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-yellow-500/35">
            <label
              htmlFor={`${idPrefix}-sequence-count`}
              className="text-[11px] font-semibold text-yellow-300 whitespace-nowrap select-none"
            >
              {isVi ? 'Dãy số:' : 'Numbers:'}
            </label>
            <input
              id={`${idPrefix}-sequence-count`}
              type="text"
              inputMode="numeric"
              maxLength={3}
              disabled={disabled}
              value={countDraft}
              onFocus={(e) => e.currentTarget.select()}
              onMouseUp={(e) => e.preventDefault()}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                setCountDraft(cleaned);
                const parsed = parseInt(cleaned, 10);
                if (!Number.isNaN(parsed) && parsed >= MIN_SEQUENCE_COUNT) {
                  const clamped = Math.min(MAX_SEQUENCE_COUNT, parsed);
                  onChangeSequenceCount(clamped);
                }
              }}
              onBlur={() => {
                const parsed = parseInt(countDraft, 10);
                if (Number.isNaN(parsed) || parsed < MIN_SEQUENCE_COUNT) {
                  setCountDraft(String(sequenceCount));
                  return;
                }
                const clamped = Math.min(MAX_SEQUENCE_COUNT, parsed);
                setCountDraft(String(clamped));
                if (clamped !== sequenceCount) {
                  onChangeSequenceCount(clamped);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              title={
                isVi
                  ? 'Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)'
                  : 'Count of numbers in sequence (2 to 100)'
              }
              className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-yellow-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60 selection:bg-yellow-400 selection:text-slate-950"
            />
          </div>

          {/* Combobox 1: Độ dài chữ số */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
            <label
              htmlFor={`${idPrefix}-sequence-digits-select`}
              className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none"
            >
              {isVi ? 'Độ dài chữ số:' : 'Digit length:'}
            </label>
            <select
              id={`${idPrefix}-sequence-digits-select`}
              disabled={disabled}
              value={sequenceDigitProfile}
              onChange={(e) => onChangeSequenceDigitProfile(e.target.value as SequenceDigitProfile)}
              className="px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-xs font-semibold text-cyan-200 cursor-pointer disabled:opacity-60"
            >
              <option value="2D">{isVi ? '2D · 2 chữ số' : '2D · 2-Digit'}</option>
              <option value="3D">{isVi ? '3D · 3 chữ số' : '3D · 3-Digit'}</option>
              <option value="2D3D">{isVi ? '2D3D · 2 chữ số và 3 chữ số' : '2D3D · 2 & 3-Digit'}</option>
              <option value="4D">{isVi ? '4D · 4 chữ số' : '4D · 4-Digit'}</option>
              <option value="3D4D">{isVi ? '3D4D · 3 chữ số và 4 chữ số' : '3D4D · 3 & 4-Digit'}</option>
            </select>
          </div>

          {/* Combobox 2: Hiển thị câu hỏi */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/35">
            <label
              htmlFor={`${idPrefix}-sequence-display-select`}
              className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
            >
              {isVi ? 'Hiển thị câu hỏi:' : 'Question display:'}
            </label>
            <select
              id={`${idPrefix}-sequence-display-select`}
              disabled={disabled}
              value={sequenceDisplayMode}
              onChange={(e) => onChangeSequenceDisplayMode(e.target.value as SequenceDisplayMode)}
              className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/40 focus:border-amber-300 focus:outline-none text-xs font-semibold text-amber-200 cursor-pointer disabled:opacity-60 max-w-[260px] sm:max-w-none"
            >
              <option value="flash">
                {isVi ? 'Chạy từng dãy số của phép tính' : 'Flash numbers sequentially'}
              </option>
              <option value="all">
                {isVi ? 'Câu hỏi trên màn hình' : 'Show full number sequence'}
              </option>
            </select>
          </div>

          {sequenceDisplayMode === 'flash' && (
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-lg bg-slate-900/60 border border-slate-800 tabular-nums">
              {(timeLimit / Math.max(1, sequenceCount)).toFixed(2)}s/{isVi ? 'số' : 'num'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
