import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  X,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { TabType } from '../../types/tab';
import { useLanguage } from '../../context/Translations';
import {
  ALL_CARDS_META,
  CardVisibilityId,
  TAB_VISIBILITY_META,
  resetAllCardVisibility,
  resetTabCardVisibility,
  setChildCardsVisibility,
  setSingleCardVisibility,
  setTabCardsVisibility,
  useCardVisibility,
} from '../../config/cardVisibility';

interface CardVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType | 'all';
}

export const CardVisibilityModal: React.FC<CardVisibilityModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'mental-math',
}) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';
  const { visibility } = useCardVisibility();

  const [selectedTab, setSelectedTab] = useState<TabType | 'all'>(initialTab);
  const [expandedParents, setExpandedParents] = useState<
    Record<string, boolean>
  >({
    'mm:multiply': true,
    'mm:percentage': true,
  });

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTab(initialTab);
  }, [isOpen, initialTab]);

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

  const visibleTabs =
    selectedTab === 'all'
      ? TAB_VISIBILITY_META
      : TAB_VISIBILITY_META.filter((t) => t.id === selectedTab);

  const countTabCards = (tabId: TabType | 'all') => {
    const list =
      tabId === 'all'
        ? ALL_CARDS_META
        : ALL_CARDS_META.filter((c) => c.tab === tabId);
    const visibleCount = list.filter((c) => visibility[c.id] !== false).length;
    return { visibleCount, totalCount: list.length };
  };

  const activeScopeStats = countTabCards(selectedTab);

  const toggleParentExpand = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSwitchButton = (
    id: CardVisibilityId,
    label: string,
    isOn: boolean,
    onToggle: () => void,
    compact: boolean = false
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      } ${
        isOn
          ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 hover:bg-emerald-500/25'
          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
      }`}
    >
      {isOn ? (
        <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      )}
      <span>{isOn ? (tr("Đang hiện")) : tr("Đang ẩn")}</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-visibility-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800/90 bg-slate-900/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="card-visibility-modal-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight"
              >
                {tr("Ẩn / Hiện Card theo Tab")}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr("Chỉnh chi tiết từng card (bao gồm card con) hoặc bật/tắt hàng loạt theo Tab.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tr("Đóng")}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector & Bulk Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 space-y-3">
          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedTab === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{tr("Tất cả Tab")}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  selectedTab === 'all' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {countTabCards('all').visibleCount}/{countTabCards('all').totalCount}
              </span>
            </button>

            {TAB_VISIBILITY_META.map((tabMeta) => {
              const stats = countTabCards(tabMeta.id);
              const active = selectedTab === tabMeta.id;
              return (
                <button
                  key={tabMeta.id}
                  type="button"
                  onClick={() => setSelectedTab(tabMeta.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{isVi ? tabMeta.labelVi : tabMeta.labelEn}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {stats.visibleCount}/{stats.totalCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Controls ("Tất cả card") */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {tr("Đang hiện:")}{' '}
              <strong className="text-white font-mono">
                {activeScopeStats.visibleCount}/{activeScopeStats.totalCount}
              </strong>{' '}
              {tr("card")}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTabCardsVisibility(selectedTab, true, true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {selectedTab === 'all'
                    ? tr("Hiện tất cả Card")
                    : tr("Hiện tất cả Tab này")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabCardsVisibility(selectedTab, false, true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>
                  {selectedTab === 'all'
                    ? tr("Ẩn tất cả Card")
                    : tr("Ẩn tất cả Tab này")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedTab === 'all') {
                    resetAllCardVisibility();
                  } else {
                    resetTabCardVisibility(selectedTab);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{tr("Mặc định")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Detailed Card List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {visibleTabs.map((tabMeta) => {
            const topCards = ALL_CARDS_META.filter(
              (c) => c.tab === tabMeta.id && !c.parentId
            );
            const tabStats = countTabCards(tabMeta.id);

            return (
              <div key={tabMeta.id} className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                    <span className={tabMeta.accentClass}>
                      {isVi ? tabMeta.labelVi : tabMeta.labelEn}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-mono font-normal text-slate-400 tabular-nums">
                      {tabStats.visibleCount}/{tabStats.totalCount}
                    </span>
                  </div>

                  {selectedTab === 'all' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTabCardsVisibility(tabMeta.id, true, true)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-emerald-300 cursor-pointer whitespace-nowrap"
                      >
                        {tr("Hiện hết")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTabCardsVisibility(tabMeta.id, false, true)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-rose-300 cursor-pointer whitespace-nowrap"
                      >
                        {tr("Ẩn hết")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {topCards.map((card) => {
                    const isCardOn = visibility[card.id] !== false;
                    const childCards = ALL_CARDS_META.filter(
                      (c) => c.parentId === card.id
                    );
                    const hasChildren = childCards.length > 0;
                    const isExpanded = expandedParents[card.id] !== false;
                    const visibleChildCount = childCards.filter(
                      (c) => visibility[c.id] !== false
                    ).length;

                    return (
                      <div
                        key={card.id}
                        className={`rounded-2xl border transition-colors ${
                          isCardOn
                            ? 'bg-slate-900/70 border-slate-800'
                            : 'bg-slate-950/70 border-slate-800/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() => toggleParentExpand(card.id)}
                                aria-label={
                                  isExpanded
                                    ? tr("Thu gọn card con")
                                    : tr("Mở rộng card con")
                                }
                                className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isCardOn ? 'text-white' : 'text-slate-400 line-through'
                                  }`}
                                >
                                  {isVi ? card.labelVi : card.labelEn}
                                </span>
                                {hasChildren && (
                                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                                    ({visibleChildCount}/{childCards.length}{' '}
                                    {tr("con")})
                                  </span>
                                )}
                              </div>
                              {(card.descVi || card.descEn) && (
                                <p className="text-[11px] text-slate-500 truncate">
                                  {isVi ? card.descVi : card.descEn}
                                </p>
                              )}
                            </div>
                          </div>

                          {renderSwitchButton(
                            card.id,
                            isVi ? card.labelVi : card.labelEn,
                            isCardOn,
                            () => setSingleCardVisibility(card.id, !isCardOn)
                          )}
                        </div>

                        {hasChildren && isExpanded && (
                          <div className="px-3.5 pb-3 pt-2 border-t border-slate-800/70 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pb-1">
                              <span>
                                {!isCardOn
                                  ? tr("Lưu ý: Card cha đang ẩn nên các card con cũng không hiển thị ở màn hình chính.")
                                  : tr("Tùy chỉnh chi tiết từng card con:")}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setChildCardsVisibility(card.id, true)}
                                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  {tr("Hiện con")}
                                </button>
                                <span className="text-slate-700">/</span>
                                <button
                                  type="button"
                                  onClick={() => setChildCardsVisibility(card.id, false)}
                                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  {tr("Ẩn con")}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {childCards.map((child) => {
                                const isChildOn = visibility[child.id] !== false;
                                return (
                                  <div
                                    key={child.id}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
                                      isChildOn
                                        ? 'bg-slate-950/80 border-slate-800/90'
                                        : 'bg-slate-950/40 border-slate-800/50 opacity-70'
                                    }`}
                                  >
                                    <span
                                      className={`text-xs font-medium truncate ${
                                        isChildOn
                                          ? 'text-slate-200'
                                          : 'text-slate-500 line-through'
                                      }`}
                                    >
                                      {isVi ? child.labelVi : child.labelEn}
                                    </span>
                                    {renderSwitchButton(
                                      child.id,
                                      isVi ? child.labelVi : child.labelEn,
                                      isChildOn,
                                      () => setSingleCardVisibility(child.id, !isChildOn),
                                      true
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-800/90 bg-slate-900/50">
          <span className="text-[11px] sm:text-xs text-slate-400">
            {tr("Thay đổi được tự động lưu và áp dụng ngay lập tức.")}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>{tr("Xong")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
