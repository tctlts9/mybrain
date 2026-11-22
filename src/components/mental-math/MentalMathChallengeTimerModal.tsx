import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Globe,
  SlidersHorizontal,
  Plus,
  X,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  GLOBAL_CHALLENGE_LIMIT,
  MENTAL_MATH_TIMER_PAGE_META,
  MentalMathTimerPageKey,
  getEffectiveMentalMathTimerConfig,
  getStoredTimerOverrides,
  pickValidDefault,
  resetGlobalChallengeTimerOverride,
  resetPageTimerOverride,
  sanitizeSecondsList,
  saveGlobalTimerOverride,
  savePageTimerOverride,
} from '../../config/mentalMathTimers';

export interface MentalMathChallengeTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: 'global' | 'page';
  initialPageKey?: MentalMathTimerPageKey;
}

const CHALLENGE_PAGES = MENTAL_MATH_TIMER_PAGE_META.filter((m) => m.group === 'challenge');

const TIMER_PRESETS: Array<{
  id: string;
  labelVi: string;
  labelEn: string;
  limitOptions: number[];
  defaultLimit: number;
}> = [
  {
    id: 'default',
    labelVi: 'Mặc định (2s–12s)',
    labelEn: 'Default (2s–12s)',
    limitOptions: [2, 4, 6, 8, 10, 12],
    defaultLimit: 10,
  },
  {
    id: 'blitz',
    labelVi: 'Siêu tốc (1s–6s)',
    labelEn: 'Blitz (1s–6s)',
    limitOptions: [1, 2, 3, 4, 5, 6],
    defaultLimit: 4,
  },
  {
    id: 'standard',
    labelVi: 'Tiêu chuẩn (5s–30s)',
    labelEn: 'Standard (5s–30s)',
    limitOptions: [5, 10, 15, 20, 25, 30],
    defaultLimit: 10,
  },
  {
    id: 'relaxed',
    labelVi: 'Thoải mái (10s–60s)',
    labelEn: 'Relaxed (10s–60s)',
    limitOptions: [10, 15, 20, 30, 45, 60],
    defaultLimit: 20,
  },
];

export const MentalMathChallengeTimerModal: React.FC<MentalMathChallengeTimerModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'global',
  initialPageKey = 'TwoDigitMentalMathChallengePage',
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const validInitialPageKey = useMemo<MentalMathTimerPageKey>(() => {
    const found = CHALLENGE_PAGES.find((p) => p.key === initialPageKey);
    return found ? found.key : CHALLENGE_PAGES[0].key;
  }, [initialPageKey]);

  const [scope, setScope] = useState<'global' | 'page'>(initialScope);
  const [selectedPageKey, setSelectedPageKey] =
    useState<MentalMathTimerPageKey>(validInitialPageKey);
  const [limitOptions, setLimitOptions] = useState<number[]>([2, 4, 6, 8, 10, 12]);
  const [defaultLimit, setDefaultLimit] = useState<number>(10);
  const [newSecondInput, setNewSecondInput] = useState<string>('');
  const [overrideExistingPages, setOverrideExistingPages] = useState<boolean>(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sync draft state whenever modal opens or scope/page changes
  useEffect(() => {
    if (!isOpen) return;
    setScope(initialScope);
    setSelectedPageKey(validInitialPageKey);
    setNewSecondInput('');
    setSavedNotice(null);
  }, [isOpen, initialScope, validInitialPageKey]);

  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'global') {
      const stored = getStoredTimerOverrides();
      const baseOptions = stored.globalChallenge?.limitOptions ?? GLOBAL_CHALLENGE_LIMIT.limitOptions;
      const cleanOptions = sanitizeSecondsList(baseOptions, [2, 4, 6, 8, 10, 12]);
      const baseDefault = stored.globalChallenge?.defaultLimit ?? GLOBAL_CHALLENGE_LIMIT.defaultLimit;
      setLimitOptions(cleanOptions);
      setDefaultLimit(pickValidDefault(baseDefault, cleanOptions));
    } else {
      const effective = getEffectiveMentalMathTimerConfig(selectedPageKey);
      setLimitOptions(effective.limitOptions);
      setDefaultLimit(effective.defaultLimit);
    }
    setNewSecondInput('');
  }, [isOpen, scope, selectedPageKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stored = getStoredTimerOverrides();
  const perPageOverrideKeys = CHALLENGE_PAGES.filter((p) => Boolean(stored.pages?.[p.key]));
  const currentPageEffective = getEffectiveMentalMathTimerConfig(selectedPageKey);

  const handleAddSeconds = () => {
    const tokens = newSecondInput
      .split(/[,\s;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const parsed = tokens
      .map((t) => Math.round(Number(t)))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 999);

    if (parsed.length === 0) {
      setNewSecondInput('');
      return;
    }

    const merged = sanitizeSecondsList([...limitOptions, ...parsed], limitOptions);
    setLimitOptions(merged);
    if (!merged.includes(defaultLimit)) {
      setDefaultLimit(pickValidDefault(defaultLimit, merged));
    }
    setNewSecondInput('');
  };

  const handleRemoveSecond = (sec: number) => {
    if (limitOptions.length <= 1) return;
    const next = limitOptions.filter((n) => n !== sec);
    setLimitOptions(next);
    if (defaultLimit === sec) {
      setDefaultLimit(next[0]);
    }
  };

  const handleApplyPreset = (presetOptions: number[], presetDefault: number) => {
    const clean = sanitizeSecondsList(presetOptions, [2, 4, 6, 8, 10, 12]);
    setLimitOptions(clean);
    setDefaultLimit(pickValidDefault(presetDefault, clean));
  };

  const handleSave = () => {
    if (scope === 'global') {
      saveGlobalTimerOverride(
        'challenge',
        { limitOptions, defaultLimit },
        overrideExistingPages
      );
      setSavedNotice(
        isVi
          ? 'Đã áp dụng cấu hình Timer cho toàn Tab Mental Math!'
          : 'Timer settings saved for all Mental Math Challenge pages!'
      );
    } else {
      savePageTimerOverride(selectedPageKey, { limitOptions, defaultLimit });
      const meta = CHALLENGE_PAGES.find((p) => p.key === selectedPageKey);
      const label = meta ? (isVi ? meta.labelVi : meta.labelEn) : '';
      setSavedNotice(
        isVi
          ? `Đã lưu cấu hình Timer riêng cho "${label}"!`
          : `Saved Timer settings for "${label}"!`
      );
    }
    window.setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleReset = () => {
    if (scope === 'global') {
      resetGlobalChallengeTimerOverride();
      if (overrideExistingPages) {
        CHALLENGE_PAGES.forEach((p) => resetPageTimerOverride(p.key));
      }
      const clean = [...GLOBAL_CHALLENGE_LIMIT.limitOptions];
      setLimitOptions(clean);
      setDefaultLimit(GLOBAL_CHALLENGE_LIMIT.defaultLimit);
      setSavedNotice(
        isVi ? 'Đã khôi phục Timer mặc định toàn Tab!' : 'Reset global Timer to defaults!'
      );
    } else {
      resetPageTimerOverride(selectedPageKey);
      const effective = getEffectiveMentalMathTimerConfig(selectedPageKey);
      setLimitOptions(effective.limitOptions);
      setDefaultLimit(effective.defaultLimit);
      setSavedNotice(
        isVi ? 'Đã khôi phục cấu hình trang này!' : 'Reset this page to inherited Timer!'
      );
    }
  };

  const sourceLabel =
    currentPageEffective.source === 'page'
      ? isVi
        ? 'Cấu hình riêng trang này'
        : 'Custom per-page'
      : currentPageEffective.source === 'global'
      ? isVi
        ? 'Theo cấu hình toàn Tab'
        : 'Inherited from Tab'
      : isVi
      ? 'Mặc định hệ thống'
      : 'System default';

  const sourceBadgeClass =
    currentPageEffective.source === 'page'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : currentPageEffective.source === 'global'
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
      : 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mental-math-timer-modal-title"
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3
                id="mental-math-timer-modal-title"
                className="text-sm sm:text-base font-extrabold text-white"
              >
                {isVi ? 'Chỉnh sửa Timer — Mental Math' : 'Edit Timer — Mental Math'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isVi
                  ? 'Tùy chỉnh các mốc giây & thời gian mặc định cho toàn Tab hoặc từng page'
                  : 'Customize timer presets & default seconds globally or per page'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isVi ? 'Đóng' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Scope Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setScope('global')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                scope === 'global'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{isVi ? 'Toàn Tab Mental Math' : 'All Mental Math'}</span>
            </button>

            <button
              type="button"
              onClick={() => setScope('page')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                scope === 'page'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isVi ? 'Riêng lẻ từng Page' : 'Per Individual Page'}</span>
            </button>
          </div>

          {/* Page Selector (only in Page scope) */}
          {scope === 'page' && (
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="timer-page-selector"
                  className="text-xs font-bold text-slate-300"
                >
                  {isVi ? 'Chọn trang áp dụng:' : 'Select Challenge page:'}
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sourceBadgeClass}`}
                >
                  {sourceLabel}
                </span>
              </div>
              <select
                id="timer-page-selector"
                value={selectedPageKey}
                onChange={(e) => setSelectedPageKey(e.target.value as MentalMathTimerPageKey)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {CHALLENGE_PAGES.map((page) => {
                  const hasCustom = Boolean(stored.pages?.[page.key]);
                  const label = isVi ? page.labelVi : page.labelEn;
                  return (
                    <option key={page.key} value={page.key}>
                      {hasCustom ? `★ ${label}` : label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? 'Mẫu chọn nhanh:' : 'Quick presets:'}</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TIMER_PRESETS.map((preset) => {
                const isActive =
                  preset.limitOptions.length === limitOptions.length &&
                  preset.limitOptions.every((v, idx) => v === limitOptions[idx]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.limitOptions, preset.defaultLimit)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {isVi ? preset.labelVi : preset.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer Options Chips + Add New Second */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {isVi ? 'Các mốc giây trên thanh Timer:' : 'Timer bar seconds (1–999s):'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isVi ? `${limitOptions.length} mốc` : `${limitOptions.length} options`}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {limitOptions.map((sec) => {
                const isDef = defaultLimit === sec;
                return (
                  <div
                    key={sec}
                    className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                      isDef
                        ? 'bg-amber-500/20 border-amber-400/70 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{sec}s</span>
                    <button
                      type="button"
                      disabled={limitOptions.length <= 1}
                      onClick={() => handleRemoveSecond(sec)}
                      title={
                        limitOptions.length <= 1
                          ? isVi
                            ? 'Cần ít nhất 1 mốc thời gian'
                            : 'Keep at least 1 option'
                          : isVi
                          ? `Xóa ${sec}s`
                          : `Remove ${sec}s`
                      }
                      className="p-0.5 rounded hover:bg-rose-500/30 hover:text-rose-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                inputMode="numeric"
                value={newSecondInput}
                onChange={(e) => setNewSecondInput(e.target.value.replace(/[^\d,\s;]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSeconds();
                  }
                }}
                placeholder={
                  isVi ? 'Nhập số giây để thêm (vd: 15 hoặc 3, 5, 9)...' : 'Add seconds (e.g. 15 or 3, 5, 9)...'
                }
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddSeconds}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>{isVi ? 'Thêm' : 'Add'}</span>
              </button>
            </div>
          </div>

          {/* Default Limit Selector + Live Preview */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {isVi
                  ? 'Thời gian mặc định khi mở trang (Xem trước thanh Timer):'
                  : 'Default selected Timer (Live preview):'}
              </span>
              <span className="text-xs font-extrabold text-amber-400">{defaultLimit}s</span>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{isVi ? 'Thời gian:' : 'Timer:'}</span>
              </span>
              {limitOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDefaultLimit(sec)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    defaultLimit === sec
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Global scope override option */}
          {scope === 'global' && perPageOverrideKeys.length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={overrideExistingPages}
                onChange={(e) => setOverrideExistingPages(e.target.checked)}
                className="mt-0.5 accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-amber-100 leading-relaxed">
                {isVi
                  ? `Áp dụng đồng bộ cho cả ${perPageOverrideKeys.length} trang đang có cấu hình Timer riêng.`
                  : `Also overwrite ${perPageOverrideKeys.length} page(s) that currently have custom per-page overrides.`}
              </span>
            </label>
          )}

          {savedNotice && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đặt lại mặc định' : 'Reset Default'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isVi ? 'Đóng' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>
                {scope === 'global'
                  ? isVi
                    ? 'Áp dụng toàn Tab'
                    : 'Apply to All'
                  : isVi
                  ? 'Lưu trang này'
                  : 'Save Page'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
