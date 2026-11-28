export type CrossMathDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'master';

export type CrossMathOperator = '+' | '−' | '×' | '÷';

export interface CrossMathCell {
  row: number;
  col: number;
  kind: 'number' | 'op' | 'equals';
  solutionValue?: number;
  isGiven?: boolean;
  opSymbol?: CrossMathOperator | '=';
}

export interface CrossMathEquation {
  id: string;
  direction: 'h' | 'v';
  cells: [
    { row: number; col: number },
    { row: number; col: number },
    { row: number; col: number }
  ];
  op: CrossMathOperator;
  opCoord: { row: number; col: number };
  eqCoord: { row: number; col: number };
}

export interface CrossMathTrayTile {
  id: string;
  value: number;
}

export interface CrossMathPuzzle {
  id: string;
  difficulty: CrossMathDifficulty;
  rows: number;
  cols: number;
  cells: Record<string, CrossMathCell>;
  equations: CrossMathEquation[];
  trayTiles: CrossMathTrayTile[];
  slotKeys: string[];
  totalSlots: number;
}

export interface CrossMathDifficultyMeta {
  id: CrossMathDifficulty;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  targetEquations: number;
  minVal: number;
  maxVal: number;
  ops: CrossMathOperator[];
  blankRatio: number;
  maxGridSpan: number;
}

export const CROSS_MATH_DIFFICULTIES: CrossMathDifficultyMeta[] = [
  {
    id: 'easy',
    labelVi: 'Dễ',
    labelEn: 'Easy',
    descVi: 'Phép +, − • Số nhỏ 1–20 • 4 phép tính liên kết',
    descEn: '+, − ops • Numbers 1–20 • 4 linked equations',
    targetEquations: 4,
    minVal: 1,
    maxVal: 20,
    ops: ['+', '−'],
    blankRatio: 0.56,
    maxGridSpan: 9,
  },
  {
    id: 'medium',
    labelVi: 'Trung bình',
    labelEn: 'Medium',
    descVi: 'Đủ +, −, ×, ÷ • Số 2–45 • 6 phép tính liên kết',
    descEn: 'All +, −, ×, ÷ • Numbers 2–45 • 6 linked equations',
    targetEquations: 6,
    minVal: 2,
    maxVal: 45,
    ops: ['+', '−', '×', '÷'],
    blankRatio: 0.63,
    maxGridSpan: 9,
  },
  {
    id: 'hard',
    labelVi: 'Khó',
    labelEn: 'Hard',
    descVi: 'Đủ 4 phép tính • Số tới 99 • 9 phép tính đan xen',
    descEn: 'All 4 ops • Up to 99 • 9 interlocking equations',
    targetEquations: 9,
    minVal: 2,
    maxVal: 99,
    ops: ['+', '−', '×', '÷'],
    blankRatio: 0.68,
    maxGridSpan: 11,
  },
  {
    id: 'expert',
    labelVi: 'Chuyên gia',
    labelEn: 'Expert',
    descVi: 'Lưới nhiều nhánh • Số tới 140 • 12 phép tính thử thách',
    descEn: 'Multi-branch grid • Up to 140 • 12 challenging equations',
    targetEquations: 12,
    minVal: 2,
    maxVal: 140,
    ops: ['+', '−', '×', '÷'],
    blankRatio: 0.72,
    maxGridSpan: 11,
  },
  {
    id: 'master',
    labelVi: 'Siêu trí tuệ',
    labelEn: 'Master',
    descVi: 'Lưới lớn phức tạp • Số tới 220 • 15 phép tính đỉnh cao',
    descEn: 'Complex dense grid • Up to 220 • 15 master equations',
    targetEquations: 15,
    minVal: 2,
    maxVal: 220,
    ops: ['+', '−', '×', '÷'],
    blankRatio: 0.75,
    maxGridSpan: 13,
  },
];

export const getCrossMathDifficultyMeta = (
  id: CrossMathDifficulty
): CrossMathDifficultyMeta =>
  CROSS_MATH_DIFFICULTIES.find((d) => d.id === id) ?? CROSS_MATH_DIFFICULTIES[0];

export const coordKey = (row: number, col: number): string => `${row},${col}`;

export const evalCrossMathOp = (
  a: number,
  op: CrossMathOperator,
  b: number
): number | null => {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0 || a % b !== 0) return null;
      return a / b;
  }
};

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArr = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

interface InternalEquation {
  direction: 'h' | 'v';
  coords: [
    { r: number; c: number },
    { r: number; c: number },
    { r: number; c: number }
  ];
  opCoord: { r: number; c: number };
  eqCoord: { r: number; c: number };
  op: CrossMathOperator;
  values: [number, number, number];
}

const solveForOneMissing = (
  knownVals: [number | null, number | null, number | null],
  ops: CrossMathOperator[],
  minVal: number,
  maxVal: number
): { op: CrossMathOperator; values: [number, number, number] } | null => {
  const [v0, v1, v2] = knownVals;
  const knownCount = [v0, v1, v2].filter((v) => v !== null).length;

  // Case A: All 3 already known -> check if any allowed op satisfies equation
  if (knownCount === 3 && v0 !== null && v1 !== null && v2 !== null) {
    for (const op of shuffleArr(ops)) {
      if (evalCrossMathOp(v0, op, v1) === v2) {
        return { op, values: [v0, v1, v2] };
      }
    }
    return null;
  }

  // Case B: Exactly 2 known -> solve for the 3rd deterministically
  if (knownCount === 2) {
    for (const op of shuffleArr(ops)) {
      if (v0 !== null && v1 !== null && v2 === null) {
        const c = evalCrossMathOp(v0, op, v1);
        if (c !== null && c >= minVal && c <= maxVal) {
          return { op, values: [v0, v1, c] };
        }
      } else if (v0 !== null && v2 !== null && v1 === null) {
        let b: number | null = null;
        if (op === '+') b = v2 - v0;
        else if (op === '−') b = v0 - v2;
        else if (op === '×' && v0 !== 0 && v2 % v0 === 0) b = v2 / v0;
        else if (op === '÷' && v2 !== 0 && v0 % v2 === 0) b = v0 / v2;

        if (b !== null && b >= minVal && b <= maxVal) {
          if ((op === '×' || op === '÷') && (b < 2 || v0 < 2)) continue;
          return { op, values: [v0, b, v2] };
        }
      } else if (v1 !== null && v2 !== null && v0 === null) {
        let a: number | null = null;
        if (op === '+') a = v2 - v1;
        else if (op === '−') a = v2 + v1;
        else if (op === '×' && v1 !== 0 && v2 % v1 === 0) a = v2 / v1;
        else if (op === '÷') a = v2 * v1;

        if (a !== null && a >= minVal && a <= maxVal) {
          if ((op === '×' || op === '÷') && (v1 < 2 || v2 < 2)) continue;
          return { op, values: [a, v1, v2] };
        }
      }
    }
    return null;
  }

  // Case C: Exactly 1 known (most common anchor expansion) -> pick op & generate 2 numbers
  const shuffledOps = shuffleArr(ops);
  for (const op of shuffledOps) {
    for (let attempt = 0; attempt < 24; attempt++) {
      if (v0 !== null) {
        if (op === '+') {
          const maxB = maxVal - v0;
          if (maxB < minVal) break;
          const b = randInt(minVal, maxB);
          return { op, values: [v0, b, v0 + b] };
        }
        if (op === '−') {
          const maxB = v0 - minVal;
          if (maxB < minVal) break;
          const b = randInt(minVal, maxB);
          return { op, values: [v0, b, v0 - b] };
        }
        if (op === '×') {
          if (v0 < 2) break;
          const maxB = Math.floor(maxVal / v0);
          if (maxB < 2) break;
          const b = randInt(2, Math.min(maxB, 18));
          return { op, values: [v0, b, v0 * b] };
        }
        if (op === '÷') {
          if (v0 < 4) break;
          const divisors: number[] = [];
          const upper = Math.min(v0 - 1, Math.floor(v0 / 2));
          for (let d = 2; d <= upper; d++) {
            if (v0 % d === 0) {
              const q = v0 / d;
              if (q >= minVal && q <= maxVal && d >= minVal && d <= maxVal) {
                divisors.push(d);
              }
            }
          }
          if (divisors.length === 0) break;
          const b = divisors[randInt(0, divisors.length - 1)];
          return { op, values: [v0, b, v0 / b] };
        }
      } else if (v1 !== null) {
        if (op === '+') {
          const maxA = maxVal - v1;
          if (maxA < minVal) break;
          const a = randInt(minVal, maxA);
          return { op, values: [a, v1, a + v1] };
        }
        if (op === '−') {
          const maxC = maxVal - v1;
          if (maxC < minVal) break;
          const c = randInt(minVal, maxC);
          return { op, values: [c + v1, v1, c] };
        }
        if (op === '×') {
          if (v1 < 2) break;
          const maxA = Math.floor(maxVal / v1);
          if (maxA < 2) break;
          const a = randInt(2, Math.min(maxA, 18));
          return { op, values: [a, v1, a * v1] };
        }
        if (op === '÷') {
          if (v1 < 2) break;
          const maxQ = Math.floor(maxVal / v1);
          if (maxQ < 2) break;
          const q = randInt(2, Math.min(maxQ, 20));
          return { op, values: [q * v1, v1, q] };
        }
      } else if (v2 !== null) {
        if (op === '+') {
          if (v2 < minVal * 2) break;
          const a = randInt(minVal, v2 - minVal);
          return { op, values: [a, v2 - a, v2] };
        }
        if (op === '−') {
          const maxB = maxVal - v2;
          if (maxB < minVal) break;
          const b = randInt(minVal, maxB);
          return { op, values: [v2 + b, b, v2] };
        }
        if (op === '×') {
          if (v2 < 4) break;
          const factors: number[] = [];
          const upper = Math.floor(Math.sqrt(v2));
          for (let d = 2; d <= upper; d++) {
            if (v2 % d === 0) {
              const other = v2 / d;
              if (d >= minVal && d <= maxVal && other >= minVal && other <= maxVal) {
                factors.push(d);
              }
            }
          }
          if (factors.length === 0) break;
          const a = factors[randInt(0, factors.length - 1)];
          const b = v2 / a;
          return Math.random() < 0.5
            ? { op, values: [a, b, v2] }
            : { op, values: [b, a, v2] };
        }
        if (op === '÷') {
          if (v2 < 2) break;
          const maxB = Math.floor(maxVal / v2);
          if (maxB < 2) break;
          const b = randInt(2, Math.min(maxB, 18));
          return { op, values: [v2 * b, b, v2] };
        }
      }
    }
  }

  return null;
};

const generateInitialEquationValues = (
  ops: CrossMathOperator[],
  minVal: number,
  maxVal: number
): { op: CrossMathOperator; values: [number, number, number] } => {
  const seed = randInt(Math.max(minVal, 4), Math.min(maxVal, Math.max(12, Math.floor(maxVal * 0.6))));
  const solved = solveForOneMissing([seed, null, null], ops, minVal, maxVal);
  if (solved) return solved;
  const a = randInt(minVal, Math.max(minVal + 1, Math.floor(maxVal / 2)));
  const b = randInt(minVal, Math.max(minVal + 1, Math.floor(maxVal / 2)));
  return { op: '+', values: [a, b, a + b] };
};

export function generateCrossMathPuzzle(
  difficulty: CrossMathDifficulty
): CrossMathPuzzle {
  const meta = getCrossMathDifficultyMeta(difficulty);
  let bestEquations: InternalEquation[] = [];
  let bestNumberMap = new Map<string, number>();

  for (let run = 0; run < 28; run++) {
    const numberMap = new Map<string, number>();
    const hUsedNums = new Set<string>();
    const vUsedNums = new Set<string>();
    const occupiedOps = new Set<string>();
    const equations: InternalEquation[] = [];

    let minR = 0;
    let maxR = 0;
    let minC = 0;
    let maxC = 4;

    // Seed first equation horizontally at row 0, col 0..4
    const first = generateInitialEquationValues(meta.ops, meta.minVal, meta.maxVal);
    const firstEq: InternalEquation = {
      direction: 'h',
      coords: [
        { r: 0, c: 0 },
        { r: 0, c: 2 },
        { r: 0, c: 4 },
      ],
      opCoord: { r: 0, c: 1 },
      eqCoord: { r: 0, c: 3 },
      op: first.op,
      values: first.values,
    };
    equations.push(firstEq);
    firstEq.coords.forEach((pt, idx) => {
      const k = coordKey(pt.r, pt.c);
      numberMap.set(k, firstEq.values[idx]);
      hUsedNums.add(k);
    });
    occupiedOps.add(coordKey(0, 1));
    occupiedOps.add(coordKey(0, 3));

    const tryAttachEquation = (): boolean => {
      const anchorKeys = shuffleArr(Array.from(numberMap.keys()));

      for (const anchorKey of anchorKeys) {
        const [ar, ac] = anchorKey.split(',').map(Number);
        const anchorInH = hUsedNums.has(anchorKey);
        const anchorInV = vUsedNums.has(anchorKey);

        // Prefer perpendicular expansion
        const candidateDirs: ('h' | 'v')[] = [];
        if (!anchorInV) candidateDirs.push('v');
        if (!anchorInH) candidateDirs.push('h');
        if (candidateDirs.length === 0) continue;

        for (const dir of shuffleArr(candidateDirs)) {
          const anchorSlots = shuffleArr([0, 1, 2] as const);
          for (const slotIdx of anchorSlots) {
            const coords: [
              { r: number; c: number },
              { r: number; c: number },
              { r: number; c: number }
            ] =
              dir === 'h'
                ? [
                    { r: ar, c: ac - slotIdx * 2 },
                    { r: ar, c: ac + (1 - slotIdx) * 2 },
                    { r: ar, c: ac + (2 - slotIdx) * 2 },
                  ]
                : [
                    { r: ar - slotIdx * 2, c: ac },
                    { r: ar + (1 - slotIdx) * 2, c: ac },
                    { r: ar + (2 - slotIdx) * 2, c: ac },
                  ];

            const opCoord =
              dir === 'h'
                ? { r: coords[0].r, c: coords[0].c + 1 }
                : { r: coords[0].r + 1, c: coords[0].c };
            const eqCoord =
              dir === 'h'
                ? { r: coords[1].r, c: coords[1].c + 1 }
                : { r: coords[1].r + 1, c: coords[1].c };

            const nextMinR = Math.min(minR, coords[0].r, coords[2].r);
            const nextMaxR = Math.max(maxR, coords[0].r, coords[2].r);
            const nextMinC = Math.min(minC, coords[0].c, coords[2].c);
            const nextMaxC = Math.max(maxC, coords[0].c, coords[2].c);

            if (
              nextMaxR - nextMinR + 1 > meta.maxGridSpan ||
              nextMaxC - nextMinC + 1 > meta.maxGridSpan
            ) {
              continue;
            }

            const sameDirSet = dir === 'h' ? hUsedNums : vUsedNums;
            let conflict = false;

            if (
              occupiedOps.has(coordKey(opCoord.r, opCoord.c)) ||
              occupiedOps.has(coordKey(eqCoord.r, eqCoord.c))
            ) {
              conflict = true;
            }

            // Ensure no same-direction equation shares any number cell or chains directly off endpoints
            for (const pt of coords) {
              const k = coordKey(pt.r, pt.c);
              if (sameDirSet.has(k)) {
                conflict = true;
                break;
              }
            }
            if (!conflict) {
              const beforeKey =
                dir === 'h'
                  ? coordKey(coords[0].r, coords[0].c - 2)
                  : coordKey(coords[0].r - 2, coords[0].c);
              const afterKey =
                dir === 'h'
                  ? coordKey(coords[2].r, coords[2].c + 2)
                  : coordKey(coords[2].r + 2, coords[2].c);
              if (sameDirSet.has(beforeKey) || sameDirSet.has(afterKey)) {
                conflict = true;
              }
            }
            if (conflict) continue;

            const known: [number | null, number | null, number | null] = [
              numberMap.get(coordKey(coords[0].r, coords[0].c)) ?? null,
              numberMap.get(coordKey(coords[1].r, coords[1].c)) ?? null,
              numberMap.get(coordKey(coords[2].r, coords[2].c)) ?? null,
            ];

            // Favor × / ÷ slightly more on medium+ so puzzles feel diverse
            const preferredOps =
              meta.ops.length > 2 && Math.random() < 0.55
                ? (['×', '÷', '+', '−'] as CrossMathOperator[])
                : meta.ops;

            const solved = solveForOneMissing(
              known,
              preferredOps.filter((o) => meta.ops.includes(o)),
              meta.minVal,
              meta.maxVal
            );
            if (!solved) continue;

            const newEq: InternalEquation = {
              direction: dir,
              coords,
              opCoord,
              eqCoord,
              op: solved.op,
              values: solved.values,
            };

            equations.push(newEq);
            coords.forEach((pt, idx) => {
              const k = coordKey(pt.r, pt.c);
              numberMap.set(k, newEq.values[idx]);
              sameDirSet.add(k);
            });
            occupiedOps.add(coordKey(opCoord.r, opCoord.c));
            occupiedOps.add(coordKey(eqCoord.r, eqCoord.c));
            minR = nextMinR;
            maxR = nextMaxR;
            minC = nextMinC;
            maxC = nextMaxC;
            return true;
          }
        }
      }
      return false;
    };

    for (let step = 0; step < 60 && equations.length < meta.targetEquations; step++) {
      if (!tryAttachEquation()) break;
    }

    if (equations.length > bestEquations.length) {
      bestEquations = equations;
      bestNumberMap = numberMap;
    }
    if (equations.length >= meta.targetEquations) {
      break;
    }
  }

  // Normalize coordinates so bounding box starts at (0, 0)
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;

  bestEquations.forEach((eq) => {
    eq.coords.forEach((pt) => {
      minR = Math.min(minR, pt.r);
      maxR = Math.max(maxR, pt.r);
      minC = Math.min(minC, pt.c);
      maxC = Math.max(maxC, pt.c);
    });
  });

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cells: Record<string, CrossMathCell> = {};
  const normalizedEquations: CrossMathEquation[] = bestEquations.map((eq, idx) => {
    const nCoords = eq.coords.map((pt) => ({
      row: pt.r - minR,
      col: pt.c - minC,
    })) as [
      { row: number; col: number },
      { row: number; col: number },
      { row: number; col: number }
    ];
    const nOp = { row: eq.opCoord.r - minR, col: eq.opCoord.c - minC };
    const nEq = { row: eq.eqCoord.r - minR, col: eq.eqCoord.c - minC };

    nCoords.forEach((pt, vIdx) => {
      const k = coordKey(pt.row, pt.col);
      if (!cells[k]) {
        cells[k] = {
          row: pt.row,
          col: pt.col,
          kind: 'number',
          solutionValue: eq.values[vIdx],
          isGiven: true,
        };
      }
    });
    cells[coordKey(nOp.row, nOp.col)] = {
      row: nOp.row,
      col: nOp.col,
      kind: 'op',
      opSymbol: eq.op,
    };
    cells[coordKey(nEq.row, nEq.col)] = {
      row: nEq.row,
      col: nEq.col,
      kind: 'equals',
      opSymbol: '=',
    };

    return {
      id: `eq-${idx}`,
      direction: eq.direction,
      cells: nCoords,
      op: eq.op,
      opCoord: nOp,
      eqCoord: nEq,
    };
  });

  // Choose which number cells become blank slots vs given clues
  const numberKeys = Object.keys(cells).filter((k) => cells[k].kind === 'number');
  const targetBlanks = Math.max(
    normalizedEquations.length,
    Math.min(numberKeys.length - 2, Math.round(numberKeys.length * meta.blankRatio))
  );

  // Step 1: Ensure each equation gets at least 1 blank slot when possible
  const selectedSlots = new Set<string>();
  for (const eq of shuffleArr(normalizedEquations)) {
    const eqKeys = eq.cells.map((pt) => coordKey(pt.row, pt.col));
    const alreadyBlank = eqKeys.some((k) => selectedSlots.has(k));
    if (!alreadyBlank) {
      // Prefer blanking result C or operand A/B randomly
      const pick = eqKeys[randInt(0, eqKeys.length - 1)];
      selectedSlots.add(pick);
    }
  }

  // Step 2: Fill up to targetBlanks while trying not to leave completely empty equations early
  const remainingCandidates = shuffleArr(
    numberKeys.filter((k) => !selectedSlots.has(k))
  );

  // First pass: prefer cells in equations that currently have <= 1 blank
  for (const k of remainingCandidates) {
    if (selectedSlots.size >= targetBlanks) break;
    const eqsContaining = normalizedEquations.filter((eq) =>
      eq.cells.some((pt) => coordKey(pt.row, pt.col) === k)
    );
    const wouldMakeAllBlank = eqsContaining.some((eq) =>
      eq.cells.every((pt) => {
        const ck = coordKey(pt.row, pt.col);
        return ck === k || selectedSlots.has(ck);
      })
    );
    if (!wouldMakeAllBlank) {
      selectedSlots.add(k);
    }
  }

  // Second pass: allow remaining slots up to targetBlanks if needed for higher densities
  for (const k of remainingCandidates) {
    if (selectedSlots.size >= targetBlanks) break;
    if (!selectedSlots.has(k)) {
      selectedSlots.add(k);
    }
  }

  // Safety: ensure at least 2 given numbers remain on the board
  while (numberKeys.length - selectedSlots.size < 2 && selectedSlots.size > 1) {
    const arr = Array.from(selectedSlots);
    selectedSlots.delete(arr[arr.length - 1]);
  }

  const slotKeys: string[] = [];
  const trayTiles: CrossMathTrayTile[] = [];

  // Order slotKeys top-to-bottom, left-to-right
  const sortedNumberKeys = [...numberKeys].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number);
    const [br, bc] = b.split(',').map(Number);
    return ar !== br ? ar - br : ac - bc;
  });

  sortedNumberKeys.forEach((k) => {
    if (selectedSlots.has(k)) {
      cells[k].isGiven = false;
      slotKeys.push(k);
      trayTiles.push({
        id: `tile-${k}-${Math.random().toString(36).slice(2, 7)}`,
        value: cells[k].solutionValue ?? 0,
      });
    } else {
      cells[k].isGiven = true;
    }
  });

  void bestNumberMap;

  return {
    id: `crossmath-${difficulty}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    difficulty,
    rows,
    cols,
    cells,
    equations: normalizedEquations,
    trayTiles: shuffleArr(trayTiles),
    slotKeys,
    totalSlots: slotKeys.length,
  };
}
