/**
 * Speech Recognition and Speech Synthesis Utilities for Mental Math
 * Guaranteed Natural Female Voice for result announcements
 */

// Normalize transcript: cleans punctuation, handles dots/commas as thousand separators
function normalizeSpeechText(text: string): string {
  if (!text) return '';
  let cleaned = text.trim().toLowerCase();

  // Remove dots or commas when used as thousand separators between digits: e.g. "1.029" -> "1029", "7,224" -> "7224"
  cleaned = cleaned.replace(/(\d+)[.,](\d{3})/g, '$1$2');

  // Replace symbols with words
  cleaned = cleaned.replace(/=/g, ' bằng ');
  cleaned = cleaned.replace(/x/g, ' nhân ');
  cleaned = cleaned.replace(/\*/g, ' nhân ');

  return cleaned;
}

// Convert spoken Vietnamese text to an integer
export function parseVietnameseNumber(text: string): number | null {
  if (!text) return null;
  const cleaned = normalizeSpeechText(text);

  // If the speech has "bằng", "là", "kết quả", "đáp án", try parsing the portion after it first
  const resultSplitters = ['bằng', 'là', 'kết quả là', 'đáp án là', 'kết quả', 'đáp án', 'ra'];
  for (const splitter of resultSplitters) {
    const idx = cleaned.lastIndexOf(splitter);
    if (idx !== -1) {
      const after = cleaned.substring(idx + splitter.length).trim();
      if (after) {
        const afterVal = parseVietnameseNumberDirect(after);
        if (afterVal !== null && afterVal > 0) return afterVal;
      }
    }
  }

  return parseVietnameseNumberDirect(cleaned);
}

function parseVietnameseNumberDirect(cleaned: string): number | null {
  // 1. Direct digits in text (e.g. "5848", "1 0 2 9", "7224")
  const allDigitGroups = cleaned.match(/\d+/g);
  if (allDigitGroups && allDigitGroups.length > 0) {
    // If user said spaced digits "1 0 2 9" or "6 0 5"
    if (allDigitGroups.length >= 2 && allDigitGroups.every((g) => g.length === 1)) {
      const combined = parseInt(allDigitGroups.join(''), 10);
      if (!isNaN(combined) && combined > 0) return combined;
    }
    // Take the last number group (e.g. in "86 nhân 84 bằng 7224", take 7224)
    const lastNum = parseInt(allDigitGroups[allDigitGroups.length - 1], 10);
    if (!isNaN(lastNum) && lastNum > 0) return lastNum;
  }

  // 2. Mapping Vietnamese spoken number words
  const digitWords: Record<string, number> = {
    'không': 0, 'khong': 0, 'zêrô': 0, 'dêrô': 0, 'zero': 0, 'o': 0, '0': 0,
    'một': 1, 'mot': 1, 'mốt': 1, '1': 1,
    'hai': 2, '2': 2,
    'ba': 3, '3': 3,
    'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4, '4': 4,
    'năm': 5, 'nam': 5, 'lăm': 5, '5': 5,
    'sáu': 6, 'sau': 6, '6': 6,
    'bảy': 7, 'bay': 7, '7': 7,
    'tám': 8, 'tam': 8, '8': 8,
    'chín': 9, 'chin': 9, '9': 9,
  };

  const tokens = cleaned.replace(/[.,?!:;]/g, '').split(/\s+/).filter(Boolean);

  // Filter out common filler words
  const fillerWords = new Set(['là', 'bằng', 'kết', 'quả', 'đáp', 'án', 'em', 'ra', 'số', 'của', 'thì', 'phép', 'tính', 'cho']);
  const meaningfulTokens = tokens.filter((t) => !fillerWords.has(t));

  // Check if meaningful tokens are digit-by-digit spoken (e.g. "sáu không năm" -> 605, "bảy hai hai bốn" -> 7224)
  const singleDigitsList: number[] = [];
  let isAllDigits = meaningfulTokens.length > 0;
  for (const t of meaningfulTokens) {
    if (digitWords[t] !== undefined) {
      singleDigitsList.push(digitWords[t]);
    } else {
      isAllDigits = false;
      break;
    }
  }

  if (isAllDigits && singleDigitsList.length > 0) {
    const numStr = singleDigitsList.join('');
    return parseInt(numStr, 10);
  }

  // Parse structured Vietnamese numbers (e.g. "sáu trăm linh năm", "bảy nghìn hai trăm hai mươi tư")
  let total = 0;
  let currentGroup = 0;
  let currentNumber = 0;
  let hasNumberWord = false;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    if (digitWords[word] !== undefined) {
      currentNumber = digitWords[word];
      hasNumberWord = true;
    } else if (word === 'mười' || word === 'muoi') {
      if (currentNumber === 0) currentNumber = 1;
      currentGroup += currentNumber * 10;
      currentNumber = 0;
      hasNumberWord = true;
    } else if (word === 'mươi' || word === 'muoi') {
      currentGroup += currentNumber * 10;
      currentNumber = 0;
      hasNumberWord = true;
    } else if (word === 'trăm' || word === 'tram') {
      if (currentNumber === 0) currentNumber = 1;
      currentGroup += currentNumber * 100;
      currentNumber = 0;
      hasNumberWord = true;
    } else if (word === 'nghìn' || word === 'nghin' || word === 'ngàn' || word === 'ngan') {
      currentGroup += currentNumber;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000;
      currentGroup = 0;
      currentNumber = 0;
      hasNumberWord = true;
    } else if (word === 'triệu' || word === 'trieu') {
      currentGroup += currentNumber;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000000;
      currentGroup = 0;
      currentNumber = 0;
      hasNumberWord = true;
    } else if (word === 'lẻ' || word === 'le' || word === 'linh') {
      hasNumberWord = true;
    }
  }

  total += currentGroup + currentNumber;
  return hasNumberWord && total > 0 ? total : null;
}

// Convert spoken English text to an integer
export function parseEnglishNumber(text: string): number | null {
  if (!text) return null;
  const cleaned = normalizeSpeechText(text);

  // If speech contains "equals", "equal", "is", "answer is": parse part after it
  const resultSplitters = ['equals', 'equal', 'answer is', 'is'];
  for (const splitter of resultSplitters) {
    const idx = cleaned.lastIndexOf(splitter);
    if (idx !== -1) {
      const after = cleaned.substring(idx + splitter.length).trim();
      if (after) {
        const afterVal = parseEnglishNumberDirect(after);
        if (afterVal !== null && afterVal > 0) return afterVal;
      }
    }
  }

  return parseEnglishNumberDirect(cleaned);
}

function parseEnglishNumberDirect(cleaned: string): number | null {
  // 1. Direct digits in text
  const allDigitGroups = cleaned.match(/\d+/g);
  if (allDigitGroups && allDigitGroups.length > 0) {
    if (allDigitGroups.length >= 2 && allDigitGroups.every((g) => g.length === 1)) {
      const combined = parseInt(allDigitGroups.join(''), 10);
      if (!isNaN(combined) && combined > 0) return combined;
    }
    const lastNum = parseInt(allDigitGroups[allDigitGroups.length - 1], 10);
    if (!isNaN(lastNum) && lastNum > 0) return lastNum;
  }

  const smalls: Record<string, number> = {
    'zero': 0, 'o': 0, 'oh': 0, '0': 0,
    'one': 1, 'won': 1, '1': 1,
    'two': 2, 'to': 2, 'too': 2, '2': 2,
    'three': 3, 'tree': 3, '3': 3,
    'four': 4, 'for': 4, 'fore': 4, '4': 4,
    'five': 5, '5': 5,
    'six': 6, '6': 6,
    'seven': 7, '7': 7,
    'eight': 8, 'ate': 8, '8': 8,
    'nine': 9, 'night': 9, 'knight': 9, 'line': 9, '9': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  };

  const tokens = cleaned.replace(/[.,?!:;]/g, '').split(/\s+/).filter(Boolean);

  // Filter out filler words like "it", "is", "equals", "the", "answer", "result"
  const fillerWords = new Set(['it', 'is', 'equals', 'the', 'answer', 'result', 'and', 'equal', 'my']);
  const meaningfulTokens = tokens.filter((t) => !fillerWords.has(t));

  // Check digit-by-digit spoken (e.g. "six zero five" -> 605, "seven two two four" -> 7224)
  const singleDigitsList: number[] = [];
  let isAllSmallDigits = meaningfulTokens.length > 0;
  for (const t of meaningfulTokens) {
    if (smalls[t] !== undefined && smalls[t] < 10) {
      singleDigitsList.push(smalls[t]);
    } else {
      isAllSmallDigits = false;
      break;
    }
  }

  if (isAllSmallDigits && singleDigitsList.length > 0) {
    const numStr = singleDigitsList.join('');
    return parseInt(numStr, 10);
  }

  // Parse structured English numbers (e.g. "six hundred five", "one thousand twenty nine")
  let total = 0;
  let current = 0;
  let hasNumberWord = false;

  for (const word of tokens) {
    if (smalls[word] !== undefined) {
      current += smalls[word];
      hasNumberWord = true;
    } else if (word === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
      hasNumberWord = true;
    } else if (word === 'thousand') {
      current = (current === 0 ? 1 : current) * 1000;
      total += current;
      current = 0;
      hasNumberWord = true;
    }
  }

  total += current;
  return hasNumberWord && total > 0 ? total : null;
}

// Master parser that detects either language or direct digits
export function parseVoiceNumber(transcript: string, lang: 'vi' | 'en'): number | null {
  if (!transcript) return null;

  // 1. Language-specific parsing first
  if (lang === 'vi') {
    const viVal = parseVietnameseNumber(transcript);
    if (viVal !== null && viVal > 0) return viVal;
    const enVal = parseEnglishNumber(transcript);
    if (enVal !== null && enVal > 0) return enVal;
  } else {
    const enVal = parseEnglishNumber(transcript);
    if (enVal !== null && enVal > 0) return enVal;
    const viVal = parseVietnameseNumber(transcript);
    if (viVal !== null && viVal > 0) return viVal;
  }

  // 2. Direct digits fallback
  const cleaned = normalizeSpeechText(transcript);
  const allDigitGroups = cleaned.match(/\d+/g);
  if (allDigitGroups && allDigitGroups.length > 0) {
    const lastNum = parseInt(allDigitGroups[allDigitGroups.length - 1], 10);
    if (!isNaN(lastNum) && lastNum > 0) return lastNum;
  }

  return null;
}

// Speech Synthesis Cache & Voice Selector
let cachedVoices: SpeechSynthesisVoice[] = [];

export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const initial = window.speechSynthesis.getVoices();
    if (initial && initial.length > 0) {
      cachedVoices = initial;
      resolve(initial);
      return;
    }

    const handleChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
        resolve(voices);
      }
    };

    window.speechSynthesis.onvoiceschanged = handleChanged;

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      cachedVoices = voices;
      resolve(voices);
    }, 250);
  });
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  ensureVoicesLoaded();
}

/**
 * Checks if a voice is explicitly male
 */
function isMaleVoiceName(name: string): boolean {
  const n = name.toLowerCase();
  // Microsoft An, Microsoft NamMinh, male markers
  if (n.includes('microsoft an') || n.includes('namminh') || n.includes('male') || n.includes('đức') || n.includes('duc')) {
    return true;
  }
  if (/\b(an|nam|david|mark|george|guy|paul|stefan|man|boy)\b/i.test(n)) {
    return true;
  }
  return false;
}

/**
 * Finds a verified female voice from installed voices
 */
export function getBestFemaleVoice(lang: 'vi' | 'en'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = lang === 'vi' ? 'vi' : 'en';
  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix)
  );

  if (lang === 'vi') {
    // 1. Microsoft HoaiMy Online Natural (Giọng nữ ấm áp, chuẩn Việt số 1)
    const hoaiMy = langVoices.find((v) => v.name.toLowerCase().includes('hoaimy'));
    if (hoaiMy) return hoaiMy;

    // 2. Google Tiếng Việt (Giọng nữ tiêu chuẩn Google)
    const googleVi = langVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (n.includes('google') || n.includes('tiếng việt')) && !isMaleVoiceName(n);
    });
    if (googleVi) return googleVi;

    // 3. Apple Linh / Mai / Thảo
    const appleFemale = langVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (n.includes('linh') || n.includes('mai') || n.includes('thảo') || n.includes('thao') || n.includes('ngọc')) && !isMaleVoiceName(n);
    });
    if (appleFemale) return appleFemale;

    // 4. Any voice that does NOT match male name
    const strictlyFemale = langVoices.find((v) => !isMaleVoiceName(v.name));
    if (strictlyFemale) return strictlyFemale;

    return null;
  } else {
    // English Natural Female Voices
    const topKeywords = ['jenny', 'aria', 'natural', 'samantha', 'google uk english female', 'female', 'karen', 'victoria', 'zira'];
    for (const kw of topKeywords) {
      const match = langVoices.find((v) => v.name.toLowerCase().includes(kw) && !isMaleVoiceName(v.name));
      if (match) return match;
    }

    const strictlyFemale = langVoices.find((v) => !isMaleVoiceName(v.name));
    if (strictlyFemale) return strictlyFemale;

    return null;
  }
}

// Global active audio reference to ensure only one speech announcement plays at a time
let activeTtsAudio: HTMLAudioElement | null = null;
const audioBlobCache = new Map<string, string>();

/**
 * Stop any active audio announcement or synthesis
 */
export function stopCurrentSpeech() {
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.currentTime = 0;
    } catch {}
    activeTtsAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Fallback Web Speech Synthesis with Pitch Adjustment for feminine voice timbre
 */
async function speakWithSynthesisFallback(text: string, lang: 'vi' | 'en', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    await ensureVoicesLoaded();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

    const femaleVoice = getBestFemaleVoice(lang);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.15; // Natural gentle female pitch
    } else {
      // If OS only has default male voice (e.g. Windows Microsoft An), shift pitch to high female range
      utterance.rate = 1.0;
      utterance.pitch = 1.45; // Pitch-shift formant to sound like a female voice
    }
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis fallback failed:', err);
    if (onEnd) onEnd();
  }
}

/**
 * Plays text aloud using the guaranteed authentic Google Vietnamese Female Voice
 * with zero dependency on client OS voice packages, falling back to synthesis if offline.
 */
export async function speakText(text: string, lang: 'vi' | 'en', onEnd?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any running speech
  stopCurrentSpeech();

  // 1. Try High-Quality Natural Female Voice via /api/tts endpoint (Google Female TTS Voice)
  try {
    const cacheKey = `${lang}:${text}`;
    let objectUrl = audioBlobCache.get(cacheKey);

    if (!objectUrl) {
      const endpoint = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        audioBlobCache.set(cacheKey, objectUrl);
      }
    }

    if (objectUrl) {
      const audio = new Audio(objectUrl);
      activeTtsAudio = audio;

      audio.onended = () => {
        if (activeTtsAudio === audio) activeTtsAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        if (activeTtsAudio === audio) activeTtsAudio = null;
        // Fall back to SpeechSynthesis
        speakWithSynthesisFallback(text, lang, onEnd);
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Online female voice audio play failed, falling back to synthesis:', err);
  }

  // 2. Fallback to Web Speech Synthesis
  speakWithSynthesisFallback(text, lang, onEnd);
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'incorrect') {
      // Gentle notification tone
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.setValueAtTime(261.63, now + 0.14); // C4

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // audio context suppressed until user gesture
  }
}
