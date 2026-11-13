export type SchulteColorAnswer = 'green' | 'red' | 'yellow' | 'purple';

export type SchulteVoiceAction =
  | { type: 'reset' }
  | { type: 'markFound' }
  | { type: 'noMarkFound' }
  | { type: 'color'; color: SchulteColorAnswer }
  | { type: 'coord'; row: number; col: number }
  | { type: 'number'; value: number };

const VI_ONES: Record<string, number> = {
  'một': 1, 'mot': 1, 'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
  'năm': 5, 'nam': 5, 'lăm': 5, 'lam': 5,
  'sáu': 6, 'sau': 6,
  'bảy': 7, 'bay': 7,
  'tám': 8, 'tam': 8,
  'chín': 9, 'chin': 9,
};

const EN_NUMS: Record<string, number> = {
  'one': 1, 'won': 1,
  'two': 2, 'to': 2, 'too': 2,
  'three': 3, 'tree': 3,
  'four': 4, 'for': 4, 'fore': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8, 'ate': 8,
  'nine': 9, 'night': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
};

export function parseSchulteVoiceActions(
  rawTranscript: string,
  gridSize: number,
  nextTarget?: number
): SchulteVoiceAction[] {
  if (!rawTranscript) return [];
  const cleaned = rawTranscript.trim().toLowerCase();
  if (!cleaned) return [];

  const maxNum = gridSize * gridSize;

  // 1. Control commands
  if (
    cleaned.includes('no mark found') ||
    cleaned.includes('không đánh dấu') ||
    cleaned.includes('tắt đánh dấu') ||
    cleaned.includes('bỏ đánh dấu')
  ) {
    return [{ type: 'noMarkFound' }];
  }

  if (
    cleaned.includes('mark found') ||
    cleaned.includes('bật đánh dấu') ||
    cleaned.includes('đánh dấu')
  ) {
    return [{ type: 'markFound' }];
  }

  if (
    cleaned.includes('làm mới') ||
    cleaned.includes('xáo trộn') ||
    cleaned.includes('new board') ||
    cleaned.includes('reset')
  ) {
    return [{ type: 'reset' }];
  }

  // 1b. Color answers (for Pro mode)
  if (
    /\b(xanh lá|xanh lục|xanh|green|màu xanh)\b/.test(cleaned) ||
    cleaned.includes('xanh') ||
    cleaned.includes('green')
  ) {
    return [{ type: 'color', color: 'green' }];
  }
  if (
    /(?:^|\s)(đỏ|màu đỏ|mau do|red)(?:\s|$|[.,!?])/.test(cleaned)
  ) {
    return [{ type: 'color', color: 'red' }];
  }
  if (
    /(?:^|\s)(vàng|màu vàng|mau vang|yellow)(?:\s|$|[.,!?])/.test(cleaned)
  ) {
    return [{ type: 'color', color: 'yellow' }];
  }
  if (
    /(?:^|\s)(tím|màu tím|mau tim|purple|violet)(?:\s|$|[.,!?])/.test(cleaned)
  ) {
    return [{ type: 'color', color: 'purple' }];
  }

  // 2. Grid coordinates: "A1", "b 3", "c-4", "hàng 2 cột 3", "row 2 col 3"
  const letterCoordMatch = cleaned.match(/\b([a-f])\s*[-.]?\s*([1-6])\b/);
  if (letterCoordMatch) {
    const row = letterCoordMatch[1].charCodeAt(0) - 97;
    const col = parseInt(letterCoordMatch[2], 10) - 1;
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return [{ type: 'coord', row, col }];
    }
  }

  const rowColMatch = cleaned.match(
    /(?:hàng|hang|row|dòng|dong)\s*(\d)\s*(?:cột|cot|col|column)?\s*(\d)/
  );
  if (rowColMatch) {
    const row = parseInt(rowColMatch[1], 10) - 1;
    const col = parseInt(rowColMatch[2], 10) - 1;
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return [{ type: 'coord', row, col }];
    }
  }

  // 3. Direct digits in transcript (e.g., "1", "25", "1 2 3")
  const digitMatches = cleaned.match(/\d+/g);
  if (digitMatches && digitMatches.length > 0) {
    const actions: SchulteVoiceAction[] = [];
    for (const d of digitMatches) {
      const val = parseInt(d, 10);
      if (!isNaN(val) && val >= 1 && val <= maxNum) {
        actions.push({ type: 'number', value: val });
      }
    }
    if (actions.length > 0) return actions;
  }

  // 4. Token-based Vietnamese & English number parsing (1..36)
  const tokens = cleaned
    .replace(/[.,?!:;/-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const actions: SchulteVoiceAction[] = [];
  let i = 0;

  while (i < tokens.length) {
    const w = tokens[i];
    const next = tokens[i + 1];
    const next2 = tokens[i + 2];

    // Vietnamese "mười ..." (10..19)
    if (w === 'mười' || w === 'muoi') {
      if (next && VI_ONES[next] !== undefined) {
        const val = 10 + VI_ONES[next];
        if (val <= maxNum) actions.push({ type: 'number', value: val });
        i += 2;
        continue;
      }
      if (10 <= maxNum) actions.push({ type: 'number', value: 10 });
      i += 1;
      continue;
    }

    // Vietnamese "hai mươi ..." / "ba mươi ..."
    if ((w === 'hai' || w === 'ba') && (next === 'mươi' || next === 'muoi')) {
      const tens = w === 'hai' ? 20 : 30;
      if (next2 && VI_ONES[next2] !== undefined) {
        const val = tens + VI_ONES[next2];
        if (val <= maxNum) actions.push({ type: 'number', value: val });
        i += 3;
        continue;
      }
      if (tens <= maxNum) actions.push({ type: 'number', value: tens });
      i += 2;
      continue;
    }

    // Vietnamese shorthand "hai mốt" (21), "hai lăm" (25), "ba hai" (32), etc.
    if ((w === 'hai' || w === 'ba') && next && VI_ONES[next] !== undefined) {
      const tens = w === 'hai' ? 20 : 30;
      const compound = tens + VI_ONES[next];
      const firstSingle = w === 'hai' ? 2 : 3;
      // Disambiguate "hai ba" when user is counting 2 then 3 vs saying 23
      if (nextTarget === firstSingle) {
        actions.push({ type: 'number', value: firstSingle });
        i += 1;
        continue;
      }
      if (compound <= maxNum && (nextTarget === compound || next !== w || nextTarget === undefined)) {
        actions.push({ type: 'number', value: compound });
        i += 2;
        continue;
      }
    }

    // Single Vietnamese number 1..9
    if (VI_ONES[w] !== undefined) {
      const val = VI_ONES[w];
      if (val <= maxNum) actions.push({ type: 'number', value: val });
      i += 1;
      continue;
    }

    // English "twenty ..." / "thirty ..."
    if ((w === 'twenty' || w === 'thirty') && next && EN_NUMS[next] !== undefined && EN_NUMS[next] < 10) {
      const val = EN_NUMS[w] + EN_NUMS[next];
      if (val <= maxNum) actions.push({ type: 'number', value: val });
      i += 2;
      continue;
    }

    // Single English number 1..30
    if (EN_NUMS[w] !== undefined) {
      const val = EN_NUMS[w];
      if (val <= maxNum) actions.push({ type: 'number', value: val });
      i += 1;
      continue;
    }

    i += 1;
  }

  return actions;
}
