/**
 * ============================================================================
 * FILE: CrossMathPage.tsx — TRANG LUYỆN TẬP CROSS MATH (BRAIN TRAINING)
 * ============================================================================
 * Công việc của file:
 * 1. Sinh và hiển thị bảng trò chơi Cross Math (Toán Ô Chữ đan xen ngang & dọc)
 *    với 5 cấp độ: Dễ, Trung bình, Khó, Chuyên gia, Siêu trí tuệ.
 * 2. Hỗ trợ kéo-thả (Drag & Drop) và chạm/chọn (Tap-to-Place / Swap) mượt mà
 *    trên cả máy tính và thiết bị di động.
 * 3. Kiểm tra hợp lệ toàn bộ phép tính theo toán học (hỗ trợ cả trường hợp nhiều
 *    cách đặt hợp lệ), có tùy chọn Kiểm tra tức thì, Gợi ý, Tạm dừng, Xóa ô, Ván mới.
 * 4. Bấm giờ chính xác (performance.now()) và lưu kỷ lục thời gian hoàn thành
 *    nhanh nhất cùng lịch sử hoàn thành theo từng cấp độ vào localStorage.
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Pause,
  Play,
  BookOpen,
  Download,
  X,
  History,
  Eraser,
  PlusSquare,
  Trash2,
  AlertCircle,
  Move,
} from 'lucide-react';
import { useLanguage } from '../../context/Translations';
import { playSpeakerChime } from '../../utils/MentalMathVoice';
import { isVisualGuideButtonVisible } from '../../config/buttonVisibility';
import { downloadGuidePdf } from '../../utils/guidePdfDownload';
import {
  CROSS_MATH_DIFFICULTIES,
  CrossMathDifficulty,
  CrossMathPuzzle,
  CrossMathTrayTile,
  coordKey,
  evalCrossMathOp,
  generateCrossMathPuzzle,
  getCrossMathDifficultyMeta,
} from '../../utils/crossMathGenerator';

interface CrossMathPageProps {
  onBack: () => void;
}

interface CrossMathHistoryEntry {
  id: string;
  difficulty: CrossMathDifficulty;
  elapsedMs: number;
  hintsUsed: number;
  mistakes: number;
  completedAt: string;
  isRecord: boolean;
}

interface CrossMathStorageData {
  bestByDifficulty: Partial<Record<CrossMathDifficulty, number>>;
  history: CrossMathHistoryEntry[];
}

const STORAGE_KEY = 'cross_math_records_v1';

const loadStorageData = (): CrossMathStorageData => {
  if (typeof window === 'undefined') {
    return { bestByDifficulty: {}, history: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestByDifficulty: {}, history: [] };
    const parsed = JSON.parse(raw) as Partial<CrossMathStorageData>;
    return {
      bestByDifficulty: parsed.bestByDifficulty ?? {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { bestByDifficulty: {}, history: [] };
  }
};

const saveStorageData = (data: CrossMathStorageData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

const formatDurationClock = (ms: number): string => {
  const safeMs = Math.max(0, ms);
  const totalSec = Math.floor(safeMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const centis = Math.floor((safeMs % 1000) / 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
};

const formatShortDate = (iso: string, isVi: boolean): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(isVi ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const CrossMathPage: React.FC<CrossMathPageProps> = ({ onBack }) => {
  const { language, tr } = useLanguage();
  const isVi = language === 'vi';

  const [difficulty, setDifficulty] = useState<CrossMathDifficulty>('medium');
  const [puzzle, setPuzzle] = useState<CrossMathPuzzle>(() =>
    generateCrossMathPuzzle('medium')
  );
  const [placements, setPlacements] = useState<Record<string, CrossMathTrayTile>>({});
  const [selectedTrayTileId, setSelectedTrayTileId] = useState<string | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const [dragPayload, setDragPayload] = useState<{
    source: 'tray' | 'slot';
    tileId: string;
    fromSlotKey?: string;
  } | null>(null);
  const [touchGhost, setTouchGhost] = useState<{
    source: 'tray' | 'slot';
    tileId: string;
    value: number;
    fromSlotKey?: string;
    x: number;
    y: number;
  } | null>(null);
  const touchStartRef = useRef<{
    source: 'tray' | 'slot';
    tileId: string;
    value: number;
    fromSlotKey?: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef<boolean>(false);

  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>(
    'idle'
  );
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [instantCheck, setInstantCheck] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<CrossMathDifficulty | 'all'>('all');

  const [storageData, setStorageData] = useState<CrossMathStorageData>(() =>
    loadStorageData()
  );

  const accumulatedMsRef = useRef<number>(0);
  const segmentStartRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const countedWrongEqsRef = useRef<Set<string>>(new Set());

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimerSegment = useCallback(() => {
    stopTimer();
    segmentStartRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      if (segmentStartRef.current !== null) {
        setElapsedMs(
          accumulatedMsRef.current + (performance.now() - segmentStartRef.current)
        );
      }
    }, 50);
  }, [stopTimer]);

  const ensureRunning = useCallback(() => {
    if (status === 'idle') {
      setStatus('running');
      startTimerSegment();
    } else if (status === 'paused') {
      setStatus('running');
      startTimerSegment();
    }
  }, [startTimerSegment, status]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  const startNewGame = useCallback(
    (targetDiff: CrossMathDifficulty = difficulty) => {
      stopTimer();
      accumulatedMsRef.current = 0;
      segmentStartRef.current = null;
      countedWrongEqsRef.current.clear();
      setDifficulty(targetDiff);
      setPuzzle(generateCrossMathPuzzle(targetDiff));
      setPlacements({});
      setSelectedTrayTileId(null);
      setSelectedSlotKey(null);
      setDragOverSlotKey(null);
      setDragPayload(null);
      setStatus('idle');
      setElapsedMs(0);
      setHintsUsed(0);
      setMistakes(0);
      setIsNewRecord(false);
    },
    [difficulty, stopTimer]
  );

  const clearPlacedTiles = useCallback(() => {
    if (status === 'completed') return;
    setPlacements({});
    setSelectedTrayTileId(null);
    setSelectedSlotKey(null);
    countedWrongEqsRef.current.clear();
  }, [status]);

  const togglePause = useCallback(() => {
    if (status === 'running') {
      if (segmentStartRef.current !== null) {
        accumulatedMsRef.current += performance.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      stopTimer();
      setElapsedMs(accumulatedMsRef.current);
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('running');
      startTimerSegment();
    }
  }, [startTimerSegment, status, stopTimer]);

  // Remaining unplaced tiles in tray (preserve original tray order)
  const placedTileIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(placements).forEach((t) => ids.add(t.id));
    return ids;
  }, [placements]);

  const availableTrayTiles = useMemo(
    () => puzzle.trayTiles.filter((t) => !placedTileIds.has(t.id)),
    [puzzle.trayTiles, placedTileIds]
  );

  // Evaluate every equation given current placements
  const equationEvaluations = useMemo(() => {
    const map: Record<string, 'incomplete' | 'valid' | 'invalid'> = {};
    const slotInvalid = new Set<string>();
    const slotValid = new Set<string>();

    puzzle.equations.forEach((eq) => {
      const vals = eq.cells.map((pt) => {
        const k = coordKey(pt.row, pt.col);
        const cell = puzzle.cells[k];
        if (!cell || cell.kind !== 'number') return null;
        if (cell.isGiven) return cell.solutionValue ?? null;
        return placements[k]?.value ?? null;
      });

      if (vals[0] === null || vals[1] === null || vals[2] === null) {
        map[eq.id] = 'incomplete';
        return;
      }

      const res = evalCrossMathOp(vals[0], eq.op, vals[1]);
      if (res !== null && res === vals[2]) {
        map[eq.id] = 'valid';
        eq.cells.forEach((pt) => slotValid.add(coordKey(pt.row, pt.col)));
      } else {
        map[eq.id] = 'invalid';
        eq.cells.forEach((pt) => slotInvalid.add(coordKey(pt.row, pt.col)));
      }
    });

    return { map, slotInvalid, slotValid };
  }, [placements, puzzle]);

  const validEqCount = useMemo(
    () =>
      Object.values(equationEvaluations.map).filter((state) => state === 'valid')
        .length,
    [equationEvaluations.map]
  );

  const placedCount = Object.keys(placements).length;

  // Check completion whenever placements change
  useEffect(() => {
    if (status === 'completed') return;
    if (puzzle.totalSlots === 0) return;

    // Track new mistakes if instantCheck is enabled
    let newlyWrongCount = 0;
    Object.entries(equationEvaluations.map).forEach(([eqId, state]) => {
      if (state === 'invalid') {
        if (!countedWrongEqsRef.current.has(eqId)) {
          countedWrongEqsRef.current.add(eqId);
          newlyWrongCount++;
        }
      } else {
        countedWrongEqsRef.current.delete(eqId);
      }
    });

    if (newlyWrongCount > 0) {
      setMistakes((prev) => prev + newlyWrongCount);
      if (isSoundOn && instantCheck) {
        playSpeakerChime('incorrect');
      }
    }

    const allFilled = placedCount === puzzle.totalSlots;
    const allValid =
      puzzle.equations.length > 0 && validEqCount === puzzle.equations.length;

    if (allFilled && allValid) {
      const finalMs =
        accumulatedMsRef.current +
        (segmentStartRef.current !== null
          ? performance.now() - segmentStartRef.current
          : 0);
      accumulatedMsRef.current = finalMs;
      segmentStartRef.current = null;
      stopTimer();
      setElapsedMs(finalMs);
      setStatus('completed');
      setSelectedTrayTileId(null);
      setSelectedSlotKey(null);

      if (isSoundOn) {
        playSpeakerChime('correct');
      }

      setStorageData((prev) => {
        const prevBest = prev.bestByDifficulty[difficulty];
        const beatRecord = prevBest === undefined || finalMs < prevBest;
        setIsNewRecord(beatRecord);

        const nextBestMap = {
          ...prev.bestByDifficulty,
          [difficulty]: beatRecord ? finalMs : prevBest,
        };
        const entry: CrossMathHistoryEntry = {
          id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          difficulty,
          elapsedMs: finalMs,
          hintsUsed,
          mistakes: mistakes + newlyWrongCount,
          completedAt: new Date().toISOString(),
          isRecord: beatRecord,
        };
        const nextHistory = [entry, ...prev.history].slice(0, 60);
        const nextData: CrossMathStorageData = {
          bestByDifficulty: nextBestMap,
          history: nextHistory,
        };
        saveStorageData(nextData);
        return nextData;
      });
    }
  }, [
    difficulty,
    equationEvaluations.map,
    hintsUsed,
    instantCheck,
    isSoundOn,
    mistakes,
    placedCount,
    puzzle.equations.length,
    puzzle.totalSlots,
    status,
    stopTimer,
    validEqCount,
  ]);

  // Place a tray tile into a target slot (swapping if occupied)
  const placeTrayTileIntoSlot = useCallback(
    (tileId: string, targetSlotKey: string) => {
      if (status === 'completed') return;
      const tile = puzzle.trayTiles.find((t) => t.id === tileId);
      if (!tile) return;

      ensureRunning();
      setPlacements((prev) => {
        const next = { ...prev };
        // Remove tile if it happened to be in another slot
        Object.keys(next).forEach((k) => {
          if (next[k].id === tileId) {
            delete next[k];
          }
        });
        next[targetSlotKey] = tile;
        return next;
      });
      if (isSoundOn) playSpeakerChime('correct');
      setSelectedTrayTileId(null);
      setSelectedSlotKey(null);
    },
    [ensureRunning, isSoundOn, puzzle.trayTiles, status]
  );

  // Move or swap tile between two slots
  const moveSlotTile = useCallback(
    (fromSlotKey: string, toSlotKey: string) => {
      if (status === 'completed' || fromSlotKey === toSlotKey) return;
      ensureRunning();
      setPlacements((prev) => {
        const fromTile = prev[fromSlotKey];
        if (!fromTile) return prev;
        const toTile = prev[toSlotKey];
        const next = { ...prev };
        next[toSlotKey] = fromTile;
        if (toTile) {
          next[fromSlotKey] = toTile;
        } else {
          delete next[fromSlotKey];
        }
        return next;
      });
      if (isSoundOn) playSpeakerChime('correct');
      setSelectedTrayTileId(null);
      setSelectedSlotKey(null);
    },
    [ensureRunning, isSoundOn, status]
  );

  // Return tile from a slot back to the tray
  const removeTileFromSlot = useCallback(
    (slotKey: string) => {
      if (status === 'completed') return;
      setPlacements((prev) => {
        if (!prev[slotKey]) return prev;
        const next = { ...prev };
        delete next[slotKey];
        return next;
      });
      setSelectedSlotKey(null);
    },
    [status]
  );

  const handleSlotClick = (slotKey: string) => {
    if (status === 'completed' || status === 'paused') return;

    // 1. If a tray tile is currently selected -> place it here (swapping if occupied)
    if (selectedTrayTileId) {
      placeTrayTileIntoSlot(selectedTrayTileId, slotKey);
      return;
    }

    // 2. If another slot is currently selected -> move/swap with it
    if (selectedSlotKey) {
      if (selectedSlotKey === slotKey) {
        // Clicking the same selected slot twice returns its tile if occupied, else deselects
        if (placements[slotKey]) {
          removeTileFromSlot(slotKey);
        } else {
          setSelectedSlotKey(null);
        }
        return;
      }
      if (placements[selectedSlotKey]) {
        moveSlotTile(selectedSlotKey, slotKey);
        return;
      }
    }

    // 3. Nothing selected yet:
    //    - If clicking an already-filled slot -> return its tile directly back to tray!
    //    - If clicking an empty slot -> select this slot so user can tap a tray tile next.
    if (placements[slotKey]) {
      removeTileFromSlot(slotKey);
    } else {
      setSelectedSlotKey(slotKey);
    }
  };

  const handleTrayTileClick = (tileId: string) => {
    if (status === 'completed' || status === 'paused') return;

    if (selectedSlotKey) {
      placeTrayTileIntoSlot(tileId, selectedSlotKey);
      return;
    }

    setSelectedTrayTileId((prev) => (prev === tileId ? null : tileId));
  };

  const handleHint = () => {
    if (status === 'completed' || status === 'paused') return;
    ensureRunning();

    // Find an empty slot first, or a slot whose current value differs from solutionValue
    const targetKey =
      puzzle.slotKeys.find((k) => !placements[k]) ??
      puzzle.slotKeys.find(
        (k) => placements[k]?.value !== puzzle.cells[k]?.solutionValue
      );

    if (!targetKey) return;
    const neededVal = puzzle.cells[targetKey]?.solutionValue;
    if (neededVal === undefined) return;

    // Prefer picking matching tile from available tray first, then from misplaced slot
    const matchingFromTray = availableTrayTiles.find((t) => t.value === neededVal);
    let chosenTile = matchingFromTray;
    if (!chosenTile) {
      const donorSlot = puzzle.slotKeys.find(
        (k) =>
          k !== targetKey &&
          placements[k]?.value === neededVal &&
          placements[k]?.value !== puzzle.cells[k]?.solutionValue
      );
      if (donorSlot) {
        chosenTile = placements[donorSlot];
      } else {
        const anyMatching = puzzle.trayTiles.find(
          (t) =>
            t.value === neededVal &&
            Object.entries(placements).every(
              ([sk, pt]) =>
                pt.id !== t.id || pt.value !== puzzle.cells[sk]?.solutionValue
            )
        );
        chosenTile = anyMatching ?? puzzle.trayTiles.find((t) => t.value === neededVal);
      }
    }
    if (!chosenTile) return;

    setHintsUsed((prev) => prev + 1);
    placeTrayTileIntoSlot(chosenTile.id, targetKey);
  };

  // Keyboard convenience: Backspace/Delete removes selected slot, Escape clears selections
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTrayTileId(null);
        setSelectedSlotKey(null);
        setIsGuideModalOpen(false);
        setIsHistoryModalOpen(false);
      } else if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectedSlotKey &&
        placements[selectedSlotKey]
      ) {
        removeTileFromSlot(selectedSlotKey);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [placements, removeTileFromSlot, selectedSlotKey]);

  // Smooth touch pointer drag-and-drop for Mobile / Tablet
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const pending = touchStartRef.current;
      if (!pending) return;
      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      if (!pending.dragging && Math.hypot(dx, dy) > 8) {
        pending.dragging = true;
      }
      if (!pending.dragging) return;

      setTouchGhost({
        source: pending.source,
        tileId: pending.tileId,
        value: pending.value,
        fromSlotKey: pending.fromSlotKey,
        x: e.clientX,
        y: e.clientY,
      });

      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const slotEl = els.find((el) => el.hasAttribute('data-slot-key'));
      const hoveredKey = slotEl?.getAttribute('data-slot-key') ?? null;
      setDragOverSlotKey(hoveredKey);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const pending = touchStartRef.current;
      if (!pending) return;
      touchStartRef.current = null;

      if (!pending.dragging) {
        setTouchGhost(null);
        setDragOverSlotKey(null);
        return;
      }

      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 60);

      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const slotEl = els.find((el) => el.hasAttribute('data-slot-key'));
      const targetSlotKey = slotEl?.getAttribute('data-slot-key');
      const trayEl = els.find((el) => el.hasAttribute('data-tray-drop'));

      if (targetSlotKey) {
        if (pending.source === 'tray') {
          placeTrayTileIntoSlot(pending.tileId, targetSlotKey);
        } else if (pending.source === 'slot' && pending.fromSlotKey) {
          moveSlotTile(pending.fromSlotKey, targetSlotKey);
        }
      } else if (trayEl && pending.source === 'slot' && pending.fromSlotKey) {
        removeTileFromSlot(pending.fromSlotKey);
      }

      setTouchGhost(null);
      setDragOverSlotKey(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [moveSlotTile, placeTrayTileIntoSlot, removeTileFromSlot]);

  const startTouchDrag = (
    e: React.PointerEvent,
    payload: {
      source: 'tray' | 'slot';
      tileId: string;
      value: number;
      fromSlotKey?: string;
    }
  ) => {
    if (e.pointerType === 'mouse') return;
    if (status === 'completed' || status === 'paused') return;
    touchStartRef.current = {
      ...payload,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    };
  };

  const diffMeta = getCrossMathDifficultyMeta(difficulty);
  const currentBestMs = storageData.bestByDifficulty[difficulty] ?? null;

  // Compute responsive tile sizing classes based on grid column count
  const cellTextClass =
    puzzle.cols <= 7
      ? 'text-base sm:text-xl md:text-2xl'
      : puzzle.cols <= 9
      ? 'text-sm sm:text-lg md:text-xl'
      : puzzle.cols <= 11
      ? 'text-xs sm:text-base md:text-lg'
      : 'text-[11px] sm:text-sm md:text-base';

  const maxBoardWidthPx =
    puzzle.cols <= 7
      ? 400
      : puzzle.cols <= 9
      ? 470
      : puzzle.cols <= 11
      ? 540
      : 600;

  const filteredHistory = useMemo(() => {
    const list =
      historyFilter === 'all'
        ? storageData.history
        : storageData.history.filter((item) => item.difficulty === historyFilter);
    return [...list].sort((a, b) => a.elapsedMs - b.elapsedMs);
  }, [historyFilter, storageData.history]);

  const clearHistory = () => {
    const empty: CrossMathStorageData = { bestByDifficulty: {}, history: [] };
    setStorageData(empty);
    saveStorageData(empty);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopTimer();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>{tr('Quay lại')}</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isVisualGuideButtonVisible('CrossMathPage') && (
            <>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                title={tr('Xem hướng dẫn Cross Math', 'View Cross Math Guide')}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>{tr('Hướng dẫn')}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadGuidePdf('Guide.pdf')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                title={tr('Tải hướng dẫn định dạng PDF')}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>{tr('Download PDF')}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>{tr('Lịch sử & Kỷ lục', 'History & Best')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSoundOn((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs whitespace-nowrap ${
              isSoundOn
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-xs ring-1 ring-sky-400/20'
                : 'bg-slate-950/70 text-slate-500 border-slate-800'
            }`}
          >
            {isSoundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold">
              {isSoundOn ? tr('Âm thanh: Bật') : tr('Âm thanh: Tắt')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Cross Math Arena Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/25 p-3.5 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5">
        {/* Header & Difficulty Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 shrink-0">
              <PlusSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base sm:text-xl leading-snug tracking-tight">
                {tr(
                  'Cross Math — Toán Ô Chữ Logic',
                  'Cross Math — Arithmetic Crossword'
                )}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-200 font-medium">
                {isVi ? diffMeta.descVi : diffMeta.descEn}
              </p>
            </div>
          </div>

          {/* 5 Difficulty Levels Segmented Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-700/80 self-start lg:self-auto">
            {CROSS_MATH_DIFFICULTIES.map((lvl) => {
              const active = difficulty === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => startNewGame(lvl.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    active
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isVi ? lvl.labelVi : lvl.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action & Options Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setInstantCheck((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              instantCheck
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
                : 'bg-slate-950/85 text-slate-200 border-slate-700 hover:text-white'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                instantCheck ? 'text-emerald-300' : 'text-slate-400'
              }`}
            />
            <span>
              {tr('Kiểm tra tức thì', 'Instant Check')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleHint}
            disabled={status === 'completed' || status === 'paused'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {tr('Gợi ý', 'Hint')} ({hintsUsed})
            </span>
          </button>

          {(status === 'running' || status === 'paused') && (
            <button
              type="button"
              onClick={togglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/60 text-sky-200 font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {status === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-sky-300 fill-sky-300" />
                  <span>{tr('Tiếp tục', 'Resume')}</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-sky-300" />
                  <span>{tr('Tạm dừng', 'Pause')}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={clearPlacedTiles}
            disabled={placedCount === 0 || status === 'completed'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-100 font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Eraser className="w-3.5 h-3.5 text-slate-300" />
            <span>{tr('Xóa ô đã điền', 'Clear Placed')}</span>
          </button>

          <button
            type="button"
            onClick={() => startNewGame(difficulty)}
            className="sm:ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{tr('Ván mới', 'New Puzzle')}</span>
          </button>
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
            <span className="text-[11px] sm:text-xs text-slate-200 font-semibold flex items-center justify-center gap-1">
              <Timer className="w-3.5 h-3.5 text-sky-300" />
              <span>{tr('Thời gian')}</span>
            </span>
            <span className="text-base sm:text-xl font-extrabold text-sky-300 font-sans tabular-nums">
              {formatDurationClock(elapsedMs)}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
            <span className="text-[11px] sm:text-xs text-slate-200 font-semibold block">
              {tr('Ô trống đã điền', 'Filled Slots')}
            </span>
            <span className="text-base sm:text-xl font-extrabold text-emerald-300 font-sans tabular-nums">
              {placedCount}
              <span className="text-slate-500">/</span>
              <span className="text-white">{puzzle.totalSlots}</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
            <span className="text-[11px] sm:text-xs text-slate-200 font-semibold block">
              {tr('Phép tính đúng', 'Valid Equations')}
            </span>
            <span className="text-base sm:text-xl font-extrabold font-sans tabular-nums">
              <span className="text-cyan-200">{validEqCount}</span>
              <span className="text-slate-500">/</span>
              <span className="text-white">{puzzle.equations.length}</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-center">
            <span className="text-[11px] sm:text-xs text-slate-200 font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-300" />
              <span>
                {isVi ? `Kỷ lục (${diffMeta.labelVi})` : `Best (${diffMeta.labelEn})`}
              </span>
            </span>
            <span className="text-base sm:text-xl font-extrabold text-yellow-300 font-sans tabular-nums">
              {currentBestMs !== null ? formatDurationClock(currentBestMs) : '--'}
            </span>
          </div>
        </div>

        {/* Victory Screen OR Interactive Cross Math Board + Tile Tray */}
        {status === 'completed' ? (
          <div className="rounded-3xl bg-slate-950/90 border border-emerald-500/45 p-6 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-200 max-w-2xl mx-auto">
            <div className="inline-flex p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
              <Trophy className="w-12 h-12" />
            </div>

            {isNewRecord && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tr('Kỷ lục nhanh nhất mới!', 'New Fastest Record!')}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {tr('Hoàn Thành Cross Math!', 'Cross Math Solved!')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {isVi
                  ? `Cấp độ ${diffMeta.labelVi} · Thời gian: ${formatDurationClock(elapsedMs)} · Gợi ý: ${hintsUsed} · Lỗi: ${mistakes}`
                  : `${diffMeta.labelEn} Level · Time: ${formatDurationClock(elapsedMs)} · Hints: ${hintsUsed} · Mistakes: ${mistakes}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startNewGame(difficulty)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr('Chơi Ván Mới', 'Play New Puzzle')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-sm border border-amber-500/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>{tr('Xem Kỷ Lục', 'View Records')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopTimer();
                  onBack();
                }}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>{tr('Về Brain Training')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
            {/* Cross Math Board Frame (Left / Main) */}
            <div className="lg:col-span-8 relative rounded-2xl sm:rounded-3xl bg-slate-950/90 border border-slate-800 p-2.5 sm:p-4 flex flex-col items-center justify-center overflow-x-auto">
              {/* Pause Overlay */}
              {status === 'paused' && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-4 rounded-2xl sm:rounded-3xl">
                  <Pause className="w-10 h-10 text-sky-400" />
                  <p className="text-base sm:text-lg font-bold text-white">
                    {tr('Trò chơi đang tạm dừng', 'Game Paused')}
                  </p>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{tr('Tiếp tục chơi', 'Resume Game')}</span>
                  </button>
                </div>
              )}

              {/* Interlocking Grid */}
              <div
                className="w-full mx-auto grid gap-1 sm:gap-1.5 select-none"
                style={{
                  maxWidth: `${maxBoardWidthPx}px`,
                  gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: puzzle.rows }).map((_, r) =>
                  Array.from({ length: puzzle.cols }).map((__, c) => {
                    const k = coordKey(r, c);
                    const cell = puzzle.cells[k];

                    if (!cell) {
                      return (
                        <div
                          key={k}
                          aria-hidden="true"
                          className="aspect-square"
                        />
                      );
                    }

                    // Reference-Matched Warm Golden Yellow Operators (+, −, ×, ÷) & Equals (=)
                    if (cell.kind === 'op' || cell.kind === 'equals') {
                      return (
                        <div
                          key={k}
                          className={`aspect-square rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-sans font-black ${cellTextClass} ${
                            cell.kind === 'equals'
                              ? 'bg-gradient-to-br from-[#FDE69A] via-[#F7D774] to-[#F0C451] border-[#FCEFB8] text-slate-950 shadow-md shadow-amber-400/25'
                              : 'bg-gradient-to-br from-[#FBE9AE] via-[#F6DA86] to-[#EEC85E] border-[#F8E7AE] text-slate-950 shadow-sm shadow-amber-400/20'
                          }`}
                        >
                          {cell.opSymbol}
                        </div>
                      );
                    }

                    // Reference-Matched Warm Golden Yellow Given Clue Number Cell
                    if (cell.isGiven) {
                      return (
                        <div
                          key={k}
                          className={`aspect-square rounded-lg sm:rounded-xl border-2 border-[#FCEFB8] bg-gradient-to-br from-[#FDE69A] via-[#F7D774] to-[#F0C451] text-slate-950 font-sans font-black tabular-nums flex items-center justify-center shadow-md shadow-amber-400/25 ${cellTextClass}`}
                        >
                          {cell.solutionValue}
                        </div>
                      );
                    }

                    // Interactive Empty / Filled Slot Cell
                    const placedTile = placements[k];
                    const isSelectedSlot = selectedSlotKey === k;
                    const isDragOver = dragOverSlotKey === k;
                    const isInvalidSlot =
                      instantCheck &&
                      Boolean(placedTile) &&
                      equationEvaluations.slotInvalid.has(k);
                    const isValidSlot =
                      instantCheck &&
                      Boolean(placedTile) &&
                      !isInvalidSlot &&
                      equationEvaluations.slotValid.has(k);

                    return (
                      <button
                        key={k}
                        type="button"
                        data-slot-key={k}
                        draggable={Boolean(placedTile)}
                        onPointerDown={(e) => {
                          if (!placedTile) return;
                          startTouchDrag(e, {
                            source: 'slot',
                            tileId: placedTile.id,
                            value: placedTile.value,
                            fromSlotKey: k,
                          });
                        }}
                        onDragStart={(e) => {
                          if (!placedTile) return;
                          setDragPayload({
                            source: 'slot',
                            tileId: placedTile.id,
                            fromSlotKey: k,
                          });
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', placedTile.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverSlotKey !== k) {
                            setDragOverSlotKey(k);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverSlotKey === k) {
                            setDragOverSlotKey(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSlotKey(null);
                          if (!dragPayload) return;
                          if (dragPayload.source === 'tray') {
                            placeTrayTileIntoSlot(dragPayload.tileId, k);
                          } else if (
                            dragPayload.source === 'slot' &&
                            dragPayload.fromSlotKey
                          ) {
                            moveSlotTile(dragPayload.fromSlotKey, k);
                          }
                          setDragPayload(null);
                        }}
                        onClick={() => {
                          if (suppressNextClickRef.current) return;
                          handleSlotClick(k);
                        }}
                        aria-label={
                          placedTile
                            ? isVi
                              ? `Ô chứa số ${placedTile.value}, bấm để trả về kho`
                              : `Slot with ${placedTile.value}, tap to return`
                            : isVi
                            ? 'Ô trống để đặt số'
                            : 'Empty slot for number'
                        }
                        className={`relative aspect-square rounded-lg sm:rounded-xl border-2 font-sans font-black tabular-nums flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 ${
                          placedTile ? 'touch-none' : ''
                        } ${cellTextClass} ${
                          isDragOver
                            ? 'bg-sky-400/45 border-white text-white ring-2 ring-sky-200 scale-105'
                            : isSelectedSlot
                            ? 'bg-sky-500/40 border-sky-200 text-white ring-2 ring-sky-300/80'
                            : isInvalidSlot
                            ? 'bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 border-rose-200 text-white shadow-md shadow-rose-500/35'
                            : isValidSlot
                            ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 border-emerald-200 text-white shadow-md shadow-emerald-500/35'
                            : placedTile
                            ? 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 border-sky-200 hover:border-white text-white shadow-md shadow-sky-500/30'
                            : selectedTrayTileId
                            ? 'border-dashed bg-slate-900/95 border-sky-300 hover:bg-sky-500/20 hover:border-white'
                            : 'border-dashed bg-slate-900/90 border-sky-400/70 hover:border-sky-200 hover:bg-slate-800/80'
                        }`}
                      >
                        {placedTile ? (
                          <>
                            <span>{placedTile.value}</span>
                            {isInvalidSlot && (
                              <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white absolute top-0.5 right-0.5 pointer-events-none" />
                            )}
                          </>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-sky-300/75 pointer-events-none" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Result Number Tile Tray Panel (Side panel on Desktop Web, Clear Bottom Panel on Mobile) */}
            <div
              data-tray-drop="true"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragPayload?.source === 'slot' && dragPayload.fromSlotKey) {
                  removeTileFromSlot(dragPayload.fromSlotKey);
                }
                setDragPayload(null);
              }}
              className="lg:col-span-4 lg:sticky lg:top-4 rounded-2xl sm:rounded-3xl bg-slate-950/95 border-2 border-sky-400/55 p-3.5 sm:p-4 shadow-xl space-y-3"
            >
              {/* Tray Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/60 flex items-center justify-center text-sky-300 shrink-0">
                    <Move className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {tr('Kho số kéo vào ô trả lời', 'Numbers to Drag & Place')}
                  </span>
                </div>
                <span className="text-xs font-sans font-extrabold tabular-nums text-sky-300 shrink-0 whitespace-nowrap">
                  {tr('Còn:', 'Left:')} {availableTrayTiles.length}
                </span>
              </div>

              {/* Active Selection / Interaction Hint */}
              <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-slate-200 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                {selectedTrayTileId
                  ? tr(
                      'Đang chọn số — Chạm vào ô trống nét đứt trên bảng để đặt vào.',
                      'Number selected — Tap a dashed empty slot on the board to place it.'
                    )
                  : selectedSlotKey
                  ? tr(
                      'Đang chọn ô trống — Chạm vào một số bên dưới để điền ngay.',
                      'Slot selected — Tap a number tile below to fill it.'
                    )
                  : tr(
                      'Kéo số thả vào ô trống (hoặc chạm số rồi chạm ô). Chạm ô đã điền để trả số về kho.',
                      'Drag & drop numbers into empty slots (or tap tile then slot). Tap a filled slot to return it.'
                    )}
              </p>

              {/* Draggable Bright Number Tiles */}
              {availableTrayTiles.length === 0 ? (
                <div className="py-4 text-center text-xs sm:text-sm font-semibold text-slate-200">
                  {tr(
                    'Tất cả các số đã được đặt lên bảng. Kiểm tra lại các phép tính chưa khớp để hoàn thành!',
                    'All numbers are placed on the board. Check any mismatched equations to complete!'
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {availableTrayTiles.map((tile) => {
                    const isSelected = selectedTrayTileId === tile.id;
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        draggable
                        onPointerDown={(e) =>
                          startTouchDrag(e, {
                            source: 'tray',
                            tileId: tile.id,
                            value: tile.value,
                          })
                        }
                        onDragStart={(e) => {
                          setDragPayload({ source: 'tray', tileId: tile.id });
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', tile.id);
                        }}
                        onDragEnd={() => {
                          setDragPayload(null);
                          setDragOverSlotKey(null);
                        }}
                        onClick={() => {
                          if (suppressNextClickRef.current) return;
                          handleTrayTileClick(tile.id);
                        }}
                        className={`touch-none min-w-[52px] sm:min-w-[58px] h-12 sm:h-13 px-3 rounded-xl border-2 font-sans font-black text-lg sm:text-xl tabular-nums flex items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing active:scale-95 select-none ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 border-white ring-2 ring-cyan-200 shadow-lg shadow-cyan-400/45 -translate-y-0.5'
                            : 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 border-sky-200 hover:border-white text-white shadow-md shadow-sky-500/30'
                        }`}
                      >
                        {tile.value}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Subtle Color Legend for Clarity */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F7D774] border border-[#FCEFB8]" />
                  <span>{tr('Cho trước & dấu', 'Given & ops')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs border border-dashed border-sky-300 bg-slate-900" />
                  <span>{tr('Ô trống', 'Empty slot')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 border border-sky-200" />
                  <span>{tr('Số trả lời', 'Answer tile')}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Touch-Drag Floating Ghost Tile */}
        {touchGhost && (
          <div
            aria-hidden="true"
            style={{
              left: `${touchGhost.x}px`,
              top: `${touchGhost.y}px`,
            }}
            className="fixed z-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none min-w-[54px] h-12 px-3 rounded-xl border-2 border-white bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-400 text-white font-sans font-black text-xl tabular-nums flex items-center justify-center shadow-2xl shadow-sky-500/50 scale-110"
          >
            {touchGhost.value}
          </div>
        )}
      </div>

      {/* Inline Cross Math Quick Guide Modal */}
      {isGuideModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsGuideModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {tr('Hướng dẫn chơi Cross Math', 'Cross Math Guide')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tr(
                      'Toán ô chữ rèn luyện tư duy logic & tính nhẩm nhanh',
                      'Arithmetic crossword for logical deduction & mental calculation'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={tr('Đóng')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{tr('Cách chơi & Quy tắc', 'How to Play')}</span>
                </div>
                <ul className="text-slate-300 leading-relaxed text-xs list-disc pl-4 space-y-1.5">
                  <li>
                    {tr(
                      'Di chuyển (kéo-thả) hoặc bấm chọn từng số ở kho bên dưới để đặt vào các ô trống trên lưới.',
                      'Drag & drop or tap number tiles from the tray below into the empty slots on the grid.'
                    )}
                  </li>
                  <li>
                    {tr(
                      'Mục tiêu là làm cho TẤT CẢ phép tính theo hàng ngang (trái → phải) và cột dọc (trên → dưới) đều đúng.',
                      'Make ALL horizontal (left → right) and vertical (top → bottom) equations mathematically true.'
                    )}
                  </li>
                  <li>
                    {tr(
                      'Chạm vào ô đã điền để trả số về kho, hoặc kéo sang ô khác để hoán đổi nhanh.',
                      'Tap a filled slot to return its number to the tray, or drag it to another slot to swap.'
                    )}
                  </li>
                  <li>
                    {tr(
                      'Thử thách bản thân qua 5 cấp độ từ Dễ đến Siêu trí tuệ — hệ thống tự động lưu kỷ lục thời gian nhanh nhất ở mỗi cấp độ.',
                      'Challenge yourself across 5 difficulty levels from Easy to Master — your fastest completion times are saved automatically.'
                    )}
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => downloadGuidePdf('Guide.pdf')}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>{tr('Tải tài liệu Guide.pdf toàn Web App')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Fastest Time & Completion History Modal */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsHistoryModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {tr(
                      'Lịch Sử Hoàn Thành & Kỷ Lục Nhanh Nhất',
                      'Completion History & Fastest Records'
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tr(
                      'Ghi nhận thành tích nhanh nhất theo từng cấp độ Cross Math',
                      'Fastest completion records per Cross Math difficulty level'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={tr('Đóng')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Best Time Summary Grid by Level */}
              <div>
                <div className="text-xs font-bold text-slate-300 mb-2">
                  {tr('Kỷ lục nhanh nhất từng cấp độ', 'Fastest Time by Level')}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CROSS_MATH_DIFFICULTIES.map((lvl) => {
                    const best = storageData.bestByDifficulty[lvl.id];
                    return (
                      <div
                        key={lvl.id}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1"
                      >
                        <div className="text-[11px] font-semibold text-slate-400">
                          {isVi ? lvl.labelVi : lvl.labelEn}
                        </div>
                        <div className="text-sm font-black font-mono tabular-nums text-yellow-400">
                          {best !== undefined ? formatDurationClock(best) : '--'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tr('Tất cả', 'All')}
                  </button>
                  {CROSS_MATH_DIFFICULTIES.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setHistoryFilter(lvl.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        historyFilter === lvl.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isVi ? lvl.labelVi : lvl.labelEn}
                    </button>
                  ))}
                </div>

                {storageData.history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{tr('Xóa lịch sử', 'Clear History')}</span>
                  </button>
                )}
              </div>

              {/* Fastest Sorted History Table */}
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs sm:text-sm text-slate-500">
                  {tr(
                    'Chưa có lịch sử hoàn thành ở cấp độ này. Hãy giải một ván để lưu kỷ lục!',
                    'No completed runs yet for this level. Solve a puzzle to set your record!'
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredHistory.map((item, idx) => {
                    const lvl = getCrossMathDifficultyMeta(item.difficulty);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 text-center font-mono font-bold tabular-nums ${
                              idx === 0 ? 'text-yellow-400' : 'text-slate-500'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-emerald-300">
                            {isVi ? lvl.labelVi : lvl.labelEn}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono font-black tabular-nums text-sky-300">
                            {formatDurationClock(item.elapsedMs)}
                          </span>
                          {item.isRecord && (
                            <span className="text-[11px] font-bold text-amber-400">
                              ★ {tr('Kỷ lục', 'Best')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                          <span>
                            {tr('Gợi ý:', 'Hints:')} {item.hintsUsed}
                          </span>
                          <span className="text-slate-700">/</span>
                          <span>
                            {tr('Lỗi:', 'Mistakes:')} {item.mistakes}
                          </span>
                          <span className="text-slate-700">/</span>
                          <span>{formatShortDate(item.completedAt, isVi)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
