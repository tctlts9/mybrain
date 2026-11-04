/**
 * Speech Recognition and Speech Synthesis Utilities for Mental Math
 */

// Convert spoken Vietnamese text to an integer
export function parseVietnameseNumber(text: string): number | null {
  const cleaned = text.trim().toLowerCase();
  
  // 1. Direct digits in text (e.g. "5.848", "5848", "kết quả là 5848")
  const digitMatch = cleaned.replace(/[,.\s]/g, '').match(/\d+/);
  if (digitMatch) {
    const val = parseInt(digitMatch[0], 10);
    if (!isNaN(val)) return val;
  }

  // 2. Mapping Vietnamese spoken number words
  const digitWords: Record<string, number> = {
    'không': 0, 'khong': 0,
    'một': 1, 'mot': 1, 'mốt': 1,
    'hai': 2,
    'ba': 3,
    'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
    'năm': 5, 'nam': 5, 'lăm': 5,
    'sáu': 6, 'sau': 6,
    'bảy': 7, 'bay': 7,
    'tám': 8, 'tam': 8,
    'chín': 9, 'chin': 9,
  };

  const tokens = cleaned.replace(/[.,?!]/g, '').split(/\s+/);

  // Check if it's digit-by-digit spoken (e.g. "hai tám chín không" -> 2890)
  const isAllSingleDigits = tokens.every(t => digitWords[t] !== undefined);
  if (isAllSingleDigits && tokens.length > 0) {
    const numStr = tokens.map(t => digitWords[t]).join('');
    return parseInt(numStr, 10);
  }

  // Parse structured Vietnamese numbers (e.g. "hai ngàn tám trăm chín mươi")
  let total = 0;
  let currentGroup = 0;
  let currentNumber = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    if (digitWords[word] !== undefined) {
      currentNumber = digitWords[word];
    } else if (word === 'mười' || word === 'muoi') {
      if (currentNumber === 0) currentNumber = 1;
      currentGroup += currentNumber * 10;
      currentNumber = 0;
    } else if (word === 'mươi' || word === 'muoi') {
      currentGroup += currentNumber * 10;
      currentNumber = 0;
    } else if (word === 'trăm' || word === 'tram') {
      if (currentNumber === 0) currentNumber = 1;
      currentGroup += currentNumber * 100;
      currentNumber = 0;
    } else if (word === 'nghìn' || word === 'nghin' || word === 'ngàn' || word === 'ngan') {
      currentGroup += currentNumber;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000;
      currentGroup = 0;
      currentNumber = 0;
    } else if (word === 'triệu' || word === 'trieu') {
      currentGroup += currentNumber;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000000;
      currentGroup = 0;
      currentNumber = 0;
    } else if (word === 'lẻ' || word === 'le' || word === 'linh') {
      // ignore connecting word
    }
  }

  total += currentGroup + currentNumber;
  return total > 0 ? total : null;
}

// Convert spoken English text to an integer
export function parseEnglishNumber(text: string): number | null {
  const cleaned = text.trim().toLowerCase();

  // 1. Direct digits in text
  const digitMatch = cleaned.replace(/[,.\s]/g, '').match(/\d+/);
  if (digitMatch) {
    const val = parseInt(digitMatch[0], 10);
    if (!isNaN(val)) return val;
  }

  const smalls: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  };

  const tokens = cleaned.replace(/[.,?!]/g, '').split(/\s+/);

  // Check digit-by-digit spoken (e.g. "two eight nine zero" -> 2890)
  const isAllSmallDigits = tokens.every(t => smalls[t] !== undefined && smalls[t] < 10);
  if (isAllSmallDigits && tokens.length > 0) {
    const numStr = tokens.map(t => smalls[t]).join('');
    return parseInt(numStr, 10);
  }

  let total = 0;
  let current = 0;

  for (const word of tokens) {
    if (smalls[word] !== undefined) {
      current += smalls[word];
    } else if (word === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
    } else if (word === 'thousand') {
      current = (current === 0 ? 1 : current) * 1000;
      total += current;
      current = 0;
    }
  }

  total += current;
  return total > 0 ? total : null;
}

// Master parser that detects either language or direct digits
export function parseVoiceNumber(transcript: string, lang: 'vi' | 'en'): number | null {
  if (!transcript) return null;

  // 1. First attempt: direct digits
  const cleanDigits = transcript.replace(/[^\d]/g, '');
  if (cleanDigits.length > 0) {
    const n = parseInt(cleanDigits, 10);
    if (!isNaN(n)) return n;
  }

  // 2. Language-specific word parsing
  if (lang === 'vi') {
    const viVal = parseVietnameseNumber(transcript);
    if (viVal !== null) return viVal;
    return parseEnglishNumber(transcript);
  } else {
    const enVal = parseEnglishNumber(transcript);
    if (enVal !== null) return enVal;
    return parseVietnameseNumber(transcript);
  }
}

// Speech Synthesis: Read text aloud through device speaker
export function speakText(text: string, lang: 'vi' | 'en', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 0.95; // slightly slower for arithmetic clarity
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLangPrefix = lang === 'vi' ? 'vi' : 'en';
    const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

// Play instant audio chime feedback through laptop or mobile speaker
export function playSpeakerChime(type: 'correct' | 'incorrect') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'correct') {
      // Harmonic pleasant victory chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.22); // G5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'incorrect') {
      // Gentle notification tone
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.setValueAtTime(261.63, now + 0.16); // C4

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch {
    // audio context suppressed until user gesture
  }
}

