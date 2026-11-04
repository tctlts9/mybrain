import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Mic,
  MicOff,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MentalMathGuideCarousel } from './MentalMathGuideCarousel';
import { speakText, playSpeakerChime, parseVoiceNumber } from '../../utils/speechUtils';

interface TwoDigitMultiplicationPageProps {
  onBack: () => void;
}

interface Question {
  a: number;
  b: number;
  answer: number;
}

type TrainingTopic = 'multiply11' | 'sameTensSum10' | 'twoDigit';

interface TrainingModeOption {
  id: TrainingTopic;
  labelVi: string;
  labelEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

const TRAINING_MODES: TrainingModeOption[] = [
  {
    id: 'twoDigit',
    labelVi: 'Nhân 2 chữ số (2D × 2D)',
    labelEn: '2-Digit × 2-Digit',
    icon: '🎯',
    badgeVi: 'Chuyên đề: Nhân 2 chữ số tổng quát',
    badgeEn: 'Topic: General 2D × 2D',
  },
  {
    id: 'multiply11',
    labelVi: 'Nhân với 11',
    labelEn: 'Multiply × 11',
    icon: '⚡',
    badgeVi: 'Chuyên đề: Nhân với số 11',
    badgeEn: 'Topic: Multiply by 11',
  },
  {
    id: 'sameTensSum10',
    labelVi: 'Đầu giống, đuôi = 10 (86 × 84)',
    labelEn: 'Same 1st, Sum 10 (86 × 84)',
    icon: '✨',
    badgeVi: 'Chuyên đề: 2 số đầu giống nhau & 2 số sau cộng lại = 10 (86 × 84)',
    badgeEn: 'Topic: Same Tens & Units sum to 10 (86 × 84)',
  },
];

const getSpelledOutDigits = (num: number, isVietnamese: boolean): string => {
  const digits = String(num).split('');
  const enWords: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
  };
  const viWords: Record<string, string> = {
    '0': 'không',
    '1': 'một',
    '2': 'hai',
    '3': 'ba',
    '4': 'bốn',
    '5': 'năm',
    '6': 'sáu',
    '7': 'bảy',
    '8': 'tám',
    '9': 'chín',
  };
  const words = isVietnamese ? viWords : enWords;
  return digits.map((d) => words[d] || d).join(', ');
};

export const TwoDigitMultiplicationPage: React.FC<TwoDigitMultiplicationPageProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Training Mode State
  const [selectedTopic, setSelectedTopic] = useState<TrainingTopic>('multiply11');
  const [question, setQuestion] = useState<Question>({ a: 35, b: 11, answer: 385 });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Voice Answering State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Read current problem aloud via device speaker
  const readQuestionAloud = useCallback(() => {
    if (!isSpeakerEnabled) return;
    setIsSpeaking(true);
    const text = isVi
      ? `${question.a} nhân ${question.b} bằng bao nhiêu?`
      : `What is ${question.a} times ${question.b}?`;
    speakText(text, isVi ? 'vi' : 'en', () => setIsSpeaking(false));
  }, [question.a, question.b, isVi, isSpeakerEnabled]);

  // Read answer aloud via device speaker
  const readAnswerAloud = useCallback(() => {
    if (!isSpeakerEnabled) return;
    setIsSpeaking(true);
    const spelledDigits = getSpelledOutDigits(question.answer, isVi);
    if (feedback === 'correct') {
      const text = isVi
        ? `Chính xác!: ${spelledDigits}.`
        : `Correct!: ${spelledDigits}.`;
      speakText(text, isVi ? 'vi' : 'en', () => setIsSpeaking(false));
    } else {
      const text = isVi
        ? `Chưa chính xác!: ${spelledDigits}.`
        : `Not quite!: ${spelledDigits}.`;
      speakText(text, isVi ? 'vi' : 'en', () => setIsSpeaking(false));
    }
  }, [question.answer, feedback, isVi, isSpeakerEnabled]);

  // Check answer and trigger speaker chime & evaluation
  const verifyAnswer = useCallback(
    (inputNum: number) => {
      if (inputNum === question.answer) {
        setFeedback('correct');

        if (isSpeakerEnabled) {
          playSpeakerChime('correct');
          setIsSpeaking(true);
          const spelledDigits = getSpelledOutDigits(question.answer, isVi);
          const praise = isVi
            ? `Chính xác!: ${spelledDigits}.`
            : `Correct!: ${spelledDigits}.`;
          speakText(praise, isVi ? 'vi' : 'en', () => setIsSpeaking(false));
        }
      } else {
        setFeedback('incorrect');

        if (isSpeakerEnabled) {
          playSpeakerChime('incorrect');
          setIsSpeaking(true);
          const spelledDigits = getSpelledOutDigits(question.answer, isVi);
          const retry = isVi
            ? `Chưa chính xác!: ${spelledDigits}.`
            : `Not quite!: ${spelledDigits}.`;
          speakText(retry, isVi ? 'vi' : 'en', () => setIsSpeaking(false));
        }
      }
    },
    [question.answer, isSpeakerEnabled, isVi]
  );

  // Toggle voice recognition for answering
  const toggleListening = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        isVi
          ? 'Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói Web Speech API. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge.'
          : 'Your browser does not support Web Speech Recognition API. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isVi ? 'vi-VN' : 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);

        const parsed = parseVoiceNumber(transcript, isVi ? 'vi' : 'en');
        if (parsed !== null) {
          setUserAnswer(parsed.toString());
          if (event.results[0].isFinal) {
            verifyAnswer(parsed);
            setIsListening(false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      setIsListening(false);
    }
  }, [isListening, isVi, verifyAnswer]);

  // Generate a problem based on Selected Topic
  const generateNewQuestion = useCallback(
    (targetTopic?: TrainingTopic) => {
      const activeTopic = targetTopic ?? selectedTopic;

      let a = 35;
      let b = 11;

      if (activeTopic === 'multiply11') {
        // Phép nhân 2 chữ số với số 11 (11-99 × 11)
        a = Math.floor(Math.random() * 89) + 11;
        b = 11;
      } else if (activeTopic === 'sameTensSum10') {
        // 2 số đầu giống nhau và 2 số sau cộng lại thành 10 (ví dụ: 86 × 84)
        const tens = Math.floor(Math.random() * 8) + 2; // hàng chục: 2 đến 9
        const u1 = Math.floor(Math.random() * 9) + 1; // hàng đơn vị 1: 1 đến 9
        const u2 = 10 - u1; // hàng đơn vị 2: tổng bằng 10
        a = tens * 10 + u1;
        b = tens * 10 + u2;
      } else if (activeTopic === 'twoDigit') {
        // Phép nhân 2 chữ số tổng quát (12-99 × 12-99)
        a = Math.floor(Math.random() * 88) + 12;
        b = Math.floor(Math.random() * 88) + 12;
      }

      setQuestion({
        a,
        b,
        answer: a * b,
      });
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [selectedTopic, isListening]
  );

  const handleSelectTopic = (newTopic: TrainingTopic) => {
    setSelectedTopic(newTopic);
    generateNewQuestion(newTopic);
  };

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;
    verifyAnswer(parsed);
  };

  const currentTopicMeta = TRAINING_MODES.find((m) => m.id === selectedTopic) || TRAINING_MODES[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back button & Breadcrumbs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-amber-400 font-semibold">
            {isVi ? 'Phép nhân 2 chữ số' : '2-Digit Multiplication'}
          </span>
        </div>
      </div>

      {/* Section 1: Scroll Image các Image hướng dẫn */}
      <MentalMathGuideCarousel />

      {/* Section 2: Training Section */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/25 p-4 sm:p-7 shadow-xl relative overflow-hidden space-y-5">
        {/* Subtle backdrop glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Title & Level Buttons [1, 2, 3] + Speaker Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi ? 'Luyện tập' : 'Training'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Direct Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs ring-1 ring-amber-400/20'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800'
              }`}
              title={
                isSpeakerEnabled
                  ? isVi
                    ? 'Đang bật Loa thiết bị (Bấm để tắt âm)'
                    : 'Device speaker ON (Click to mute)'
                  : isVi
                  ? 'Đang tắt Loa (Bấm để bật âm thanh)'
                  : 'Device speaker MUTED (Click to enable)'
              }
            >
              {isSpeakerEnabled ? (
                <Volume2
                  className={`w-3.5 h-3.5 text-amber-400 ${isSpeaking ? 'animate-bounce' : ''}`}
                />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="font-semibold">
                {isSpeakerEnabled
                  ? isVi
                    ? 'Loa: Bật'
                    : 'Speaker: ON'
                  : isVi
                  ? 'Loa: Tắt'
                  : 'Speaker: OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Group Buttons: Lựa chọn bài training theo yêu cầu */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVi ? 'Chọn bài luyện tập theo yêu cầu:' : 'Select training topic:'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            {TRAINING_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectTopic(mode.id)}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  selectedTopic === mode.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-base">{mode.icon}</span>
                <span className="truncate">{isVi ? mode.labelVi : mode.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Math Question Arena */}
        <div className="max-w-xl mx-auto space-y-6 pt-1">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-6 sm:p-10 text-center shadow-inner relative group">
            {/* Header: Topic Badge & Level & Speaker read aloud */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
              </span>

              <button
                type="button"
                onClick={readQuestionAloud}
                className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                title={isVi ? 'Nghe đọc phép tính qua loa' : 'Listen to problem via speaker'}
                aria-label="Listen via speaker"
              >
                <Volume2
                  className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-amber-300' : ''}`}
                />
                <span className="hidden xs:inline">{isVi ? 'Đọc đề bài' : 'Listen'}</span>
              </button>
            </div>

            {/* Large Mathematical Problem Display */}
            <div className="text-4xl sm:text-6xl font-black text-white tracking-wide font-mono py-2 flex items-center justify-center gap-2">
              <span>{question.a}</span>
              <span className="text-amber-400 font-sans">×</span>
              <span>{question.b}</span>
            </div>

            {/* Feedback message */}
            {feedback === 'correct' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isVi ? 'Chính xác! Bạn làm rất tốt!' : 'Correct! Great mental calculation!'}
                </span>
                <button
                  type="button"
                  onClick={readAnswerAloud}
                  className="ml-1 p-1 hover:text-white transition-colors"
                  title={isVi ? 'Nghe phát âm đáp án' : 'Hear answer'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {isVi
                    ? `Chưa chính xác!: ${question.answer} ( ${getSpelledOutDigits(question.answer, true)} )`
                    : `Not quite!: ${question.answer} ( ${getSpelledOutDigits(question.answer, false)} )`}
                </span>
                <button
                  type="button"
                  onClick={readAnswerAloud}
                  className="ml-1 p-1 hover:text-white transition-colors"
                  title={isVi ? 'Nghe phát âm đáp án' : 'Hear answer'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Input Form with Voice Answering Support */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  isListening
                    ? isVi
                      ? '🎙️ Đang lắng nghe... Hãy nói đáp án'
                      : '🎙️ Listening... Say your answer'
                    : isVi
                    ? 'Nhập kết quả hoặc bấm Micro để nói...'
                    : 'Type answer or click Mic to speak...'
                }
                disabled={feedback === 'correct' || isListening}
                className={`w-full h-14 pl-5 pr-14 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/30 animate-pulse'
                    : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
              />

              {/* Mic Icon Button inside input */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={feedback === 'correct'}
                className={`absolute right-2.5 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40'
                }`}
                title={
                  isListening
                    ? isVi
                      ? 'Đang nghe... Bấm để dừng'
                      : 'Listening... Click to stop'
                    : isVi
                    ? 'Trả lời bằng giọng nói (Voice)'
                    : 'Answer by voice'
                }
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-amber-400" />
                )}
              </button>
            </div>

            {/* Live voice feedback indicator if listening */}
            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 animate-in fade-in duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>
                  {voiceTranscript
                    ? `${isVi ? 'Đã nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                    : isVi
                    ? 'Đang lắng nghe... Hãy đọc to đáp án của bạn'
                    : 'Listening... Speak your answer aloud'}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Submit or Next Problem */}
              {feedback === 'correct' ? (
                <button
                  type="button"
                  onClick={() => generateNewQuestion()}
                  className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Câu tiếp theo' : 'Next Problem'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Kiểm tra kết quả' : 'Check Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Voice Answer button in action row */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={feedback === 'correct'}
                title={
                  isListening
                    ? isVi
                      ? 'Đang nghe... Bấm để dừng'
                      : 'Listening... Click to stop'
                    : isVi
                    ? 'Bấm để trả lời bằng Voice'
                    : 'Click to answer by Voice'
                }
                className={`h-12 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-500/40'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 text-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {isListening ? (isVi ? 'Dừng' : 'Stop') : 'Voice'}
                </span>
              </button>

              {/* Skip Problem Button */}
              <button
                type="button"
                onClick={() => generateNewQuestion()}
                title={isVi ? 'Đổi đề bài khác' : 'Skip problem'}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
