import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Gauge,
  BookOpen,
  Delete,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  OPERATION_META,
  OperationQuestion,
  generateOperationQuestion,
  getOperationSpokenText,
} from '../../utils/arithmeticOperations';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';
import {
  isChallengeButtonVisible,
  isDifficultLevelChallengeButtonVisible,
} from '../../config/buttonVisibility';
import {
  useMentalMathAutoNextConfig,
  formatAutoNextDelay,
} from '../../config/mentalMathAutoNext';
import { AutoNextSettingButton } from './AutoNextSettingButton';

export type SquareRootTopic = 'general' | 'sqrtSmall' | 'sqrt4Digit' | 'sqrt5Digit';

interface SquareRootPageProps {
  onBack: () => void;
  onOpenChallenge?: (topic?: SquareRootTopic) => void;
  onOpenHardChallenge?: (topic?: SquareRootTopic) => void;
  onOpenVisualGuide?: () => void;
  initialTopic?: SquareRootTopic;
}

export const SQUARE_ROOT_TOPICS = OPERATION_META['square-root'].topics;

const TOPIC_ICONS: Record<string, string> = {
  general: '🎯',
  sqrtSmall: '⚡',
  sqrt4Digit: '✨',
  sqrt5Digit: '🚀',
};

export const SquareRootPage: React.FC<SquareRootPageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenHardChallenge,
  onOpenVisualGuide,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const meta = OPERATION_META['square-root'];
  const autoNextConfig = useMentalMathAutoNextConfig('SquareRootPage');
  const autoNextTimerRef = useRef<number | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<SquareRootTopic>(initialTopic || 'general');
  const [question, setQuestion] = useState<OperationQuestion>(() =>
    generateOperationQuestion('square-root', initialTopic || 'general')
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved && [1.25, 1.5, 1.75].includes(parseFloat(saved))) return parseFloat(saved);
    }
    return 1.25;
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const questionRef = useRef<OperationQuestion>(question);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
      stopListening();
    };
  }, [stopListening]);

  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      const activeSpeed = overrideSpeed ?? questionSpeed;
      const text = getOperationSpokenText('square-root', questionRef.current, isVi);
      setIsSpeakingQuestion(true);
      speakText(
        text,
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        Math.min(1.5, activeSpeed * 0.85)
      );
    },
    [isVi, questionSpeed]
  );

  const handleSetSpeed = (newSpeed: number) => {
    setQuestionSpeed(newSpeed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mental_math_question_speed', String(newSpeed));
    }
    if (isSpeakingQuestion) pronounceQuestion(newSpeed);
  };

  const generateNewQuestion = useCallback(
    (topicOverride?: SquareRootTopic) => {
      const activeTopic = topicOverride || selectedTopic;
      setQuestion(generateOperationQuestion('square-root', activeTopic));
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      stopCurrentSpeech();
      setIsSpeakingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [selectedTopic]
  );

  useEffect(() => {
    if (feedback === 'correct' && autoNextConfig.delaySec > 0) {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
      }
      autoNextTimerRef.current = window.setTimeout(() => {
        autoNextTimerRef.current = null;
        generateNewQuestion();
      }, Math.round(autoNextConfig.delaySec * 1000));
    } else if (autoNextTimerRef.current !== null) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    return () => {
      if (autoNextTimerRef.current !== null) {
        window.clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [feedback, autoNextConfig.delaySec, generateNewQuestion]);

  const triggerAnnouncement = useCallback(
    (isCorrect: boolean, answerVal: number) => {
      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');
      announceResultFemaleVoice(isCorrect, answerVal, isVi ? 'vi' : 'en');
      setTimeout(() => setIsSpeaking(false), 1800);
    },
    [isVi]
  );

  const verifyAnswer = useCallback(
    (rawVal: string) => {
      const cleaned = rawVal.replace(/[^\d]/g, '');
      if (!cleaned) return;
      const parsed = parseInt(cleaned, 10);
      if (Number.isNaN(parsed)) return;

      if (parsed === questionRef.current.answer) {
        setFeedback('correct');
        stopListening();
        if (isSpeakerEnabled) {
          triggerAnnouncement(true, questionRef.current.answer);
        }
      } else {
        setFeedback('incorrect');
        if (isSpeakerEnabled) {
          triggerAnnouncement(false, questionRef.current.answer);
        }
      }
    },
    [isSpeakerEnabled, stopListening, triggerAnnouncement]
  );

  const replayAnnouncement = () => {
    if (feedback === 'idle') return;
    triggerAnnouncement(feedback === 'correct', question.answer);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.'
          : 'Voice recognition is not supported in this browser.'
      );
      return;
    }
    stopCurrentSpeech();
    setVoiceError('');
    setVoiceTranscript('');
    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript || '';
        setVoiceTranscript(transcript);
        const parsed = parseVoiceNumber(transcript, isVi ? 'vi' : 'en');
        if (parsed !== null) {
          setUserAnswer(String(parsed));
          if (parsed === questionRef.current.answer || res.isFinal) {
            verifyAnswer(String(parsed));
            return;
          }
        }
      }
    };
    recognition.onerror = () => stopListening();
    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          stopListening();
        }
      }
    };
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      stopListening();
    }
  };

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') setFeedback('idle');
      setUserAnswer((prev) => (prev.length >= 14 ? prev : prev + digit));
    },
    [feedback]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (feedback === 'incorrect') setFeedback('idle');
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleKeypadClear = useCallback(() => {
    if (feedback === 'correct') return;
    setUserAnswer('');
    setFeedback('idle');
    inputRef.current?.focus();
  }, [feedback]);

  const activeTopicObj =
    SQUARE_ROOT_TOPICS.find((tItem) => tItem.id === selectedTopic) || SQUARE_ROOT_TOPICS[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
        <button
          type="button"
          onClick={() => {
            stopCurrentSpeech();
            stopListening();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-yellow-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenVisualGuide && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenVisualGuide();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Xem hướng dẫn trực quan' : 'Visual Guide'}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isVi ? 'Hướng dẫn' : 'Guide'}</span>
            </button>
          )}

          {isChallengeButtonVisible('SquareRootPage') && onOpenChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenChallenge(selectedTopic);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
              title={isVi ? 'Thử thách tính nhẩm tốc độ cao' : 'Mental Math Challenge'}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
            </button>
          )}

          {isDifficultLevelChallengeButtonVisible('SquareRootPage') && onOpenHardChallenge && (
            <button
              type="button"
              onClick={() => {
                stopCurrentSpeech();
                stopListening();
                onOpenHardChallenge(selectedTopic);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-500/25"
              title={isVi ? 'Thử thách cấp độ khó' : 'Difficult Level Challenge'}
            >
              <Gauge className="w-3.5 h-3.5 text-white" />
              <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-yellow-400 font-semibold">
              {isVi ? meta.titleVi : meta.titleEn}
            </span>
          </div>
        </div>
      </div>

      {/* Main Training Container */}
      <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-yellow-950/25 p-3.5 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi ? 'Luyện tập' : 'Training'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {onOpenVisualGuide && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenVisualGuide();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Hướng dẫn' : 'Guide'}</span>
              </button>
            )}

            {isChallengeButtonVisible('SquareRootPage') && onOpenChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenChallenge(selectedTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-xs"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
              </button>
            )}

            {isDifficultLevelChallengeButtonVisible('SquareRootPage') && onOpenHardChallenge && (
              <button
                type="button"
                onClick={() => {
                  stopCurrentSpeech();
                  stopListening();
                  onOpenHardChallenge(selectedTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition-all cursor-pointer active:scale-95 text-xs"
                title={isVi ? 'Thử thách cấp độ khó' : 'Difficult Level Challenge'}
              >
                <Gauge className="w-3.5 h-3.5 text-white" />
                <span>{isVi ? 'Thử thách' : 'Challenge'}</span>
              </button>
            )}

            <AutoNextSettingButton pageKey="SquareRootPage" />

            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerEnabled;
                setIsSpeakerEnabled(next);
                if (next) playSpeakerChime('correct');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isSpeakerEnabled
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 shadow-xs ring-1 ring-yellow-400/20'
                  : 'bg-slate-950/70 text-slate-500 border-slate-800'
              }`}
              title={
                isSpeakerEnabled
                  ? isVi
                    ? 'Đang bật thông báo kết quả (Bấm để tắt)'
                    : 'Voice result announcement ON (Click to mute)'
                  : isVi
                  ? 'Đang tắt thông báo kết quả (Bấm để bật)'
                  : 'Voice result announcement OFF (Click to enable)'
              }
            >
              {isSpeakerEnabled ? (
                <Volume2 className={`w-3.5 h-3.5 text-yellow-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="font-semibold">
                {isSpeakerEnabled
                  ? isVi
                    ? 'Kết quả: Bật'
                    : 'Result:ON'
                  : isVi
                  ? 'Kết quả: Tắt'
                  : 'Result:OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Topic Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
            <Sliders className="w-3.5 h-3.5 text-yellow-400" />
            <span>{isVi ? 'Chọn bài luyện tập theo yêu cầu:' : 'Select training topic:'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            {SQUARE_ROOT_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  const nextId = topic.id as SquareRootTopic;
                  setSelectedTopic(nextId);
                  generateNewQuestion(nextId);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  selectedTopic === topic.id
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25 ring-1 ring-yellow-400'
                    : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-base">{TOPIC_ICONS[topic.id] || '⚡'}</span>
                <span className="truncate">{isVi ? topic.labelVi : topic.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-Side Arena */}
        <div className="landscape-math-grid grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch pt-0.5">
          {/* Left: Question Display */}
          <div className="landscape-math-col md:col-span-6 rounded-3xl bg-slate-950/80 border border-slate-800 p-3.5 sm:p-6 text-center shadow-inner relative group flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-yellow-400 font-semibold px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                {isVi ? activeTopicObj.badgeVi : activeTopicObj.badgeEn}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-full py-2 px-1">
                <div className={`${question.a.toLocaleString().length >= 6 ? 'text-2xl sm:text-4xl lg:text-5xl' : 'text-3xl sm:text-5xl lg:text-6xl'} font-black text-white tracking-tight font-mono flex items-center justify-center whitespace-nowrap`}>
                  <span className="text-yellow-400 mr-1.5 font-sans">√</span>
                  <span className="border-t-4 border-yellow-300/80 pt-1 px-1.5">
                    {question.a.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => pronounceQuestion()}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                    isSpeakingQuestion
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-yellow-500/30 animate-pulse'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/10'
                  }`}
                  title={isVi ? `Đọc câu hỏi - Tốc độ: ${questionSpeed}x` : `Pronounce question - Speed: ${questionSpeed}x`}
                >
                  <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Playback speed selector */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{isVi ? 'Tốc độ:' : 'Speed:'}</span>
                </span>
                <div className="flex items-center gap-1 ml-0.5">
                  {[1.25, 1.5, 1.75].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSetSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                        questionSpeed === s
                          ? 'bg-yellow-400 text-slate-950 shadow-xs ring-1 ring-yellow-400 font-extrabold'
                          : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {`${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {feedback !== 'idle' && (
              <div className="mt-3 w-full rounded-2xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed text-left">
                <span className="font-bold text-yellow-400 mr-1.5">{isVi ? 'Gợi ý:' : 'Method:'}</span>
                {isVi ? question.hintVi : question.hintEn}
              </div>
            )}

            {feedback === 'correct' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${question.answer.toLocaleString()}`
                    : `Correct: ${question.answer.toLocaleString()}`}
                </span>
                <button
                  type="button"
                  onClick={replayAnnouncement}
                  className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60"
                  title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {feedback === 'incorrect' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chưa chính xác: ${question.answer.toLocaleString()}`
                    : `Incorrect: ${question.answer.toLocaleString()}`}
                </span>
                <button
                  type="button"
                  onClick={replayAnnouncement}
                  className="p-1 hover:text-white transition-colors cursor-pointer rounded-lg bg-rose-900/40 hover:bg-rose-900/60"
                  title={isVi ? 'Nghe lại thông báo kết quả' : 'Replay voice announcement'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Input & Keypad */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (feedback === 'correct') generateNewQuestion();
              else verifyAnswer(userAnswer);
            }}
            className="landscape-math-col md:col-span-6 flex flex-col justify-center space-y-3"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={
                  isListening
                    ? isVi
                      ? '🎙️ Đang nghe... Hãy đọc to đáp án của bạn'
                      : '🎙️ Listening... Speak your answer aloud'
                    : isVi
                    ? 'Nhập kết quả hoặc bấm phím số bên dưới...'
                    : 'Type answer or tap numeric keys below...'
                }
                disabled={feedback === 'correct'}
                className={`w-full h-13 sm:h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 placeholder:text-xs sm:placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                    : 'border-slate-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                }`}
              />
              {userAnswer && feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isVi ? 'Xóa ô nhập' : 'Clear'}
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md md:max-w-none mx-auto w-full">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {[7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-white hover:text-yellow-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-yellow-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleKeypadClear}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-yellow-500/20 active:bg-yellow-400 active:text-slate-950 text-slate-400 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa 1 số' : 'Backspace'}
                  aria-label="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="truncate">
                  {voiceTranscript
                    ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}"`
                    : isVi
                    ? '🎙️ Đang lắng nghe: Hãy đọc to đáp án của bạn'
                    : '🎙️ Listening: Speak your answer aloud'}
                </span>
              </div>
            )}

            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="flex-1 font-semibold leading-relaxed">{voiceError}</p>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              {feedback === 'correct' ? (
                <button
                  type="button"
                  onClick={() => generateNewQuestion()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_28px_-4px_rgba(20,184,166,0.55)] active:scale-95 text-xs sm:text-sm"
                >
                  <span>
                    {autoNextConfig.delaySec > 0
                      ? isVi
                        ? `Câu tiếp theo - tự chuyển sau ${formatAutoNextDelay(autoNextConfig.delaySec, true)}`
                        : `Next Problem - auto in ${formatAutoNextDelay(autoNextConfig.delaySec, false)}`
                      : isVi
                      ? 'Câu tiếp theo'
                      : 'Next Problem'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95 text-xs sm:text-sm"
                >
                  <span>{isVi ? 'Kết quả' : 'Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

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
                    ? 'Bấm để trả lời bằng giọng nói'
                    : 'Answer by voice'
                }
                className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 border-slate-700 hover:border-yellow-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>{isVi ? 'Đang nghe...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-yellow-400" />
                    <span>{isVi ? 'Trả lời' : 'Voice'}</span>
                  </>
                )}
              </button>

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
