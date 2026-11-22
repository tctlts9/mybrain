import React, { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  CustomOperandMode,
  MIN_CUSTOM_DIGITS,
  MAX_CUSTOM_DIGITS,
  MIN_CUSTOM_OPERAND,
  MAX_CUSTOM_OPERAND,
} from '../../utils/customDifficultyHelpers';

interface CustomTopicControlsRowProps {
  idPrefix: string;
  isSelected: boolean;
  disabled?: boolean;
  isVi: boolean;
  buttonLabelVi: string;
  buttonLabelEn: string;
  buttonTitleVi: string;
  buttonTitleEn: string;
  digitLengthLabelVi?: string;
  digitLengthLabelEn?: string;
  operandSectionLabelVi: string;
  operandSectionLabelEn: string;
  exactLabelVi?: string;
  exactLabelEn?: string;
  digitsLabelVi?: string;
  digitsLabelEn?: string;
  exactTitleVi: string;
  exactTitleEn: string;
  digitsTitleVi: string;
  digitsTitleEn: string;
  customDigits: number;
  operandMode: CustomOperandMode;
  exactOperand: number;
  operandDigits: number;
  maxCustomDigits?: number;
  maxOperandDigits?: number;
  maxExactOperand?: number;
  onSelectCustom: () => void;
  onChangeCustomDigits: (val: number) => void;
  onChangeOperandMode: (mode: CustomOperandMode) => void;
  onChangeExactOperand: (val: number) => void;
  onChangeOperandDigits: (val: number) => void;
}

export const CustomTopicControlsRow: React.FC<CustomTopicControlsRowProps> = ({
  idPrefix,
  isSelected,
  disabled = false,
  isVi,
  buttonLabelVi,
  buttonLabelEn,
  buttonTitleVi,
  buttonTitleEn,
  digitLengthLabelVi = 'Độ dài Chữ số:',
  digitLengthLabelEn = 'Digit length:',
  operandSectionLabelVi,
  operandSectionLabelEn,
  exactLabelVi = 'Số đích danh',
  exactLabelEn = 'Exact Number',
  digitsLabelVi = 'Độ dài chữ số',
  digitsLabelEn = 'Digit Length',
  exactTitleVi,
  exactTitleEn,
  digitsTitleVi,
  digitsTitleEn,
  customDigits,
  operandMode,
  exactOperand,
  operandDigits,
  maxCustomDigits = MAX_CUSTOM_DIGITS,
  maxOperandDigits = MAX_CUSTOM_DIGITS,
  maxExactOperand = MAX_CUSTOM_OPERAND,
  onSelectCustom,
  onChangeCustomDigits,
  onChangeOperandMode,
  onChangeExactOperand,
  onChangeOperandDigits,
}) => {
  const [digitsDraft, setDigitsDraft] = useState<string>(String(customDigits));
  const [exactDraft, setExactDraft] = useState<string>(String(exactOperand));
  const [opDigitsDraft, setOpDigitsDraft] = useState<string>(String(operandDigits));

  useEffect(() => {
    setDigitsDraft(String(customDigits));
  }, [customDigits]);

  useEffect(() => {
    setExactDraft(String(exactOperand));
  }, [exactOperand]);

  useEffect(() => {
    setOpDigitsDraft(String(operandDigits));
  }, [operandDigits]);

  const handleDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        onChangeCustomDigits(Math.min(maxCustomDigits, Math.max(MIN_CUSTOM_DIGITS, parsed)));
      }
    }
  };

  const commitDigits = () => {
    const parsed = parseInt(digitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setDigitsDraft(String(customDigits));
      return;
    }
    const clamped = Math.min(maxCustomDigits, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setDigitsDraft(String(clamped));
    if (clamped !== customDigits) {
      onChangeCustomDigits(clamped);
    }
  };

  const exactMaxLen = String(maxExactOperand).length;
  const handleExactInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, exactMaxLen);
    setExactDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_OPERAND) {
        onChangeExactOperand(Math.min(maxExactOperand, Math.max(MIN_CUSTOM_OPERAND, parsed)));
      }
    }
  };

  const commitExact = () => {
    const parsed = parseInt(exactDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_OPERAND) {
      setExactDraft(String(exactOperand));
      return;
    }
    const clamped = Math.min(maxExactOperand, Math.max(MIN_CUSTOM_OPERAND, parsed));
    setExactDraft(String(clamped));
    if (clamped !== exactOperand) {
      onChangeExactOperand(clamped);
    }
  };

  const handleOpDigitsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
    setOpDigitsDraft(cleaned);
    if (cleaned.length > 0) {
      const parsed = parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_CUSTOM_DIGITS) {
        onChangeOperandDigits(Math.min(maxOperandDigits, Math.max(MIN_CUSTOM_DIGITS, parsed)));
      }
    }
  };

  const commitOpDigits = () => {
    const parsed = parseInt(opDigitsDraft, 10);
    if (Number.isNaN(parsed) || parsed < MIN_CUSTOM_DIGITS) {
      setOpDigitsDraft(String(operandDigits));
      return;
    }
    const clamped = Math.min(maxOperandDigits, Math.max(MIN_CUSTOM_DIGITS, parsed));
    setOpDigitsDraft(String(clamped));
    if (clamped !== operandDigits) {
      onChangeOperandDigits(clamped);
    }
  };

  return (
    <div className="pt-1.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onSelectCustom}
        title={isVi ? buttonTitleVi : buttonTitleEn}
        className={`py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
          isSelected
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
            : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
        }`}
      >
        <SlidersHorizontal
          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}
        />
        <span className="whitespace-nowrap">{isVi ? buttonLabelVi : buttonLabelEn}</span>
      </button>

      {isSelected && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
          {/* Textbox 1: Độ dài Chữ số */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/35">
            <label
              htmlFor={`${idPrefix}-custom-digit-length`}
              className="text-[11px] font-semibold text-amber-300 whitespace-nowrap select-none"
            >
              {isVi ? digitLengthLabelVi : digitLengthLabelEn}
            </label>
            <input
              id={`${idPrefix}-custom-digit-length`}
              type="text"
              inputMode="numeric"
              maxLength={3}
              disabled={disabled}
              value={digitsDraft}
              onFocus={(e) => e.target.select()}
              onChange={handleDigitsInput}
              onBlur={commitDigits}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              aria-label={isVi ? `Độ dài chữ số (1 - ${maxCustomDigits})` : `Digit length (1 - ${maxCustomDigits})`}
              title={isVi ? `Nhập độ dài chữ số (từ 1 đến ${maxCustomDigits})` : `Enter digit length (1 to ${maxCustomDigits})`}
              className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-center text-xs font-mono font-bold text-white tabular-nums transition-colors disabled:opacity-60"
            />
          </div>

          {/* Textbox 2: Toán hạng thứ 2 tùy chọn (Số đích danh | Độ dài chữ số) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-cyan-500/35">
            <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap select-none">
              {isVi ? operandSectionLabelVi : operandSectionLabelEn}
            </span>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 gap-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChangeOperandMode('exact')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
                  operandMode === 'exact'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {isVi ? exactLabelVi : exactLabelEn}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChangeOperandMode('digits')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
                  operandMode === 'digits'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {isVi ? digitsLabelVi : digitsLabelEn}
              </button>
            </div>

            {operandMode === 'exact' ? (
              <input
                id={`${idPrefix}-custom-operand-exact`}
                type="text"
                inputMode="numeric"
                maxLength={exactMaxLen}
                disabled={disabled}
                value={exactDraft}
                onFocus={(e) => e.target.select()}
                onChange={handleExactInput}
                onBlur={commitExact}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                aria-label={isVi ? exactTitleVi : exactTitleEn}
                title={isVi ? exactTitleVi : exactTitleEn}
                className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
              />
            ) : (
              <input
                id={`${idPrefix}-custom-operand-digits`}
                type="text"
                inputMode="numeric"
                maxLength={3}
                disabled={disabled}
                value={opDigitsDraft}
                onFocus={(e) => e.target.select()}
                onChange={handleOpDigitsInput}
                onBlur={commitOpDigits}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                aria-label={isVi ? digitsTitleVi : digitsTitleEn}
                title={isVi ? digitsTitleVi : digitsTitleEn}
                className="w-16 px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 focus:border-cyan-300 focus:outline-none text-center text-xs font-mono font-bold text-cyan-200 tabular-nums transition-colors disabled:opacity-60"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
