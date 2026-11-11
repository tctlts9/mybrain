import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ArrowRight,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Gauge,
  BookOpen,
  Delete,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  playSpeakerChime,
  announceResultFemaleVoice,
  pronounceQuestionFemaleVoice,
  speakText,
  stopCurrentSpeech,
  parseVoiceNumber,
} from '../../utils/speechUtils';

export type TrainingTopic = 'multiply11' | 'sameTensSum10' | 'twoDigit';

interface TwoDigitMultiplicationPageProps {
  onBack: () => void;
  onOpenChallenge?: (topic?: TrainingTopic) => void;
  onOpenVisualGuide?: () => void;
  initialTopic?: TrainingTopic;
}

interface Question {
  a: number;
  b: number;
  answer: number;
}

interface TopicOption {
  id: TrainingTopic;
  labelVi: string;
  labelEn: string;
  icon: string;
  badgeVi: string;
  badgeEn: string;
}

const TRAINING_MODES: TopicOption[] = [
  {
    id: 'multiply11',
    labelVi: 'Nhân với 11',
    labelEn: 'Multiply by 11',
    icon: '⚡',
    badgeVi: 'Chuyên đề: Nhân 2 chữ số với 11',
    badgeEn: 'Topic: 2-Digit × 11',
  },
  {
    id: 'sameTensSum10',
    labelVi: 'Hàng chục giống nhau & Tổng đơn vị = 10',
    labelEn: 'Same Tens & Units sum = 10',
    icon: '✨',
    badgeVi: 'Chuyên đề: Hàng chục giống nhau & Tổng đơn vị = 10',
    badgeEn: 'Topic: Same Tens & Units Sum = 10',
  },
  {
    id: 'twoDigit',
    labelVi: 'Nhân 2 chữ số tổng quát',
    labelEn: 'General 2D × 2D',
    icon: '🎯',
    badgeVi: 'Chuyên đề: Nhân 2 chữ số tổng quát',
    badgeEn: 'Topic: General 2D × 2D',
  },
];

const getSpelledOutDigits = (num: number, isVietnamese: boolean): string => {
  const digits = String(num).split('');
  const enWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };
  const viWords: Record<string, string> = {
    '0': 'Không',
    '1': 'Một',
    '2': 'Hai',
    '3': 'Ba',
    '4': 'Bốn',
    '5': 'Năm',
    '6': 'Sáu',
    '7': 'Bảy',
    '8': 'Tám',
    '9': 'Chín',
  };
  const words = isVietnamese ? viWords : enWords;
  return digits.map((d) => words[d] || d).join(' ');
};

export const TwoDigitMultiplicationPage: React.FC<TwoDigitMultiplicationPageProps> = ({
  onBack,
  onOpenChallenge,
  onOpenVisualGuide,
  initialTopic,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Training Mode State
  const [selectedTopic, setSelectedTopic] = useState<TrainingTopic>(initialTopic || 'multiply11');
  const [question, setQuestion] = useState<Question>({ a: 35, b: 11, answer: 385 });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Thông báo kết quả qua loa & Giọng nói
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  // Tốc độ phát loa câu hỏi (1.25x, 1.5x, 1.75x)
  const [questionSpeed, setQuestionSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mental_math_question_speed');
      if (saved) {
        const parsed = parseFloat(saved);
        if ([1.25, 1.5, 1.75].includes(parsed)) return parsed;
      }
    }
    return 1.25;
  });

  const handleSetSpeed = (newSpeed: number) => {
    setQuestionSpeed(newSpeed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mental_math_question_speed', String(newSpeed));
    }
    if (isSpeakingQuestion) {
      pronounceQuestion(newSpeed);
    }
  };

  // Chức năng Trả lời bằng Voice
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<Question>(question);
  questionRef.current = question;

  const recognitionRef = useRef<any>(null);
  const submitTimerRef = useRef<any>(null);
  const lastParsedRef = useRef<number | null>(null);
  const hasSubmittedRef = useRef<boolean>(false);

  // Thông báo kết quả qua loa khi trả lời đúng hoặc sai
  const announceResult = useCallback(
    (isCorrect: boolean, targetAnswer: number) => {
      if (!isSpeakerEnabled) return;

      setIsSpeaking(true);
      playSpeakerChime(isCorrect ? 'correct' : 'incorrect');

      setTimeout(() => {
        announceResultFemaleVoice(
          isCorrect,
          targetAnswer,
          isVi ? 'vi' : 'en',
          () => setIsSpeaking(false),
          questionSpeed
        );
      }, 200);
    },
    [isSpeakerEnabled, isVi, questionSpeed]
  );

  const previewToggleRef = useRef<boolean>(false);

  // Nghe thử giọng đọc nữ truyền cảm (luân phiên 2 câu mẫu của người dùng)
  const previewFemaleVoice = useCallback(() => {
    setIsSpeaking(true);
    const isSampleCorrect = !previewToggleRef.current;
    previewToggleRef.current = !previewToggleRef.current;

    playSpeakerChime(isSampleCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      // 858 = "Chính xác: Tám Năm Tám", 792 = "Chưa chính xác: Bảy Chín Hai"
      announceResultFemaleVoice(
        isSampleCorrect,
        isSampleCorrect ? 858 : 792,
        isVi ? 'vi' : 'en',
        () => setIsSpeaking(false),
        questionSpeed
      );
    }, 280);
  }, [isVi, questionSpeed]);

  // Phát âm thông tin câu hỏi bằng giọng nữ (VD: "Năm Hai nhân Một Một")
  const pronounceQuestion = useCallback(
    (overrideSpeed?: number) => {
      setIsSpeakingQuestion(true);
      const speedToUse = overrideSpeed ?? questionSpeed;
      pronounceQuestionFemaleVoice(
        question.a,
        question.b,
        isVi ? 'vi' : 'en',
        () => setIsSpeakingQuestion(false),
        speedToUse
      );
    },
    [question.a, question.b, isVi, questionSpeed]
  );

  // Replay result announcement manually when clicking the audio icon
  const replayAnnouncement = useCallback(() => {
    if (feedback === 'correct') {
      announceResult(true, question.answer);
    } else if (feedback === 'incorrect') {
      announceResult(false, question.answer);
    }
  }, [feedback, question.answer, announceResult]);

  // Check answer and trigger speaker chime + voice notification
  const verifyAnswer = useCallback(
    (inputNum: number) => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
      hasSubmittedRef.current = true;

      // Stop recognition while announcing result
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);

      if (inputNum === questionRef.current.answer) {
        setFeedback('correct');
        announceResult(true, questionRef.current.answer);
      } else {
        setFeedback('incorrect');
        announceResult(false, questionRef.current.answer);
      }
    },
    [announceResult]
  );

  // Stop Voice Recognition
  const stopListening = useCallback(() => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  // Start Voice Recognition for answering with explicit permission checking
  const startListening = useCallback(async () => {
    setVoiceError('');
    setVoiceTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        isVi
          ? 'Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge.'
          : 'Your browser does not support Web Speech Recognition. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // Explicitly prompt/verify microphone permission via getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('Microphone permission check error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setVoiceError(
            isVi
              ? 'Trình duyệt chưa cho phép quyền Micro. Bạn vui lòng bấm vào biểu tượng 🔒 hoặc 🎙️ trên thanh địa chỉ trình duyệt để Bật/Cho phép Micro (Allow).'
              : 'Microphone permission denied. Please click the lock/microphone icon in the address bar and select Allow.'
          );
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = isVi ? 'vi-VN' : 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.continuous = false; // Phù hợp và ổn định nhất cho việc trả lời số từng câu

      lastParsedRef.current = null;
      hasSubmittedRef.current = false;
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        let bestTranscript = '';
        let detectedNumber: number | null = null;
        let isFinalResult = false;

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) isFinalResult = true;

          for (let j = 0; j < res.length; ++j) {
            const transcriptChunk = res[j].transcript;
            if (!bestTranscript) bestTranscript = transcriptChunk;

            const parsed = parseVoiceNumber(transcriptChunk, isVi ? 'vi' : 'en');
            if (parsed !== null && parsed > 0) {
              detectedNumber = parsed;
              bestTranscript = transcriptChunk;
              break;
            }
          }
          if (detectedNumber !== null) break;
        }

        setVoiceTranscript(bestTranscript);

        if (detectedNumber !== null && detectedNumber > 0) {
          lastParsedRef.current = detectedNumber;
          setUserAnswer(detectedNumber.toString());

          // Tự động kiểm tra và nộp kết quả ngay sau khi nhận diện
          if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
          const delay = isFinalResult ? 200 : 450;
          submitTimerRef.current = setTimeout(() => {
            if (!hasSubmittedRef.current && lastParsedRef.current !== null) {
              hasSubmittedRef.current = true;
              verifyAnswer(lastParsedRef.current);
            }
          }, delay);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          setVoiceError(
            isVi
              ? 'Quyền Micro bị từ chối. Vui lòng bấm vào biểu tượng Micro/Ổ khóa trên thanh địa chỉ trình duyệt để Bật Micro (Allow).'
              : 'Microphone access denied. Please click the lock or mic icon in the browser address bar to Allow.'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            isVi
              ? 'Không nghe thấy tiếng nói. Bạn hãy bấm lại nút Voice và nói to rõ hơn.'
              : 'No speech detected. Please click Voice and speak louder.'
          );
        } else if (event.error === 'audio-capture') {
          setVoiceError(
            isVi
              ? 'Không tìm thấy thiết bị thu âm (Micro). Vui lòng kiểm tra Micro của bạn.'
              : 'No microphone found on your device. Please verify your microphone.'
          );
        }

        if (!hasSubmittedRef.current && lastParsedRef.current !== null) {
          hasSubmittedRef.current = true;
          verifyAnswer(lastParsedRef.current);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!hasSubmittedRef.current && lastParsedRef.current !== null) {
          hasSubmittedRef.current = true;
          verifyAnswer(lastParsedRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start exception:', err);
      setIsListening(false);
      setVoiceError(
        isVi
          ? 'Không thể kích hoạt Micro. Vui lòng kiểm tra quyền truy cập Micro trên trình duyệt.'
          : 'Could not activate microphone. Please check your browser microphone permissions.'
      );
    }
  }, [isVi, verifyAnswer]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Generate a problem based on Selected Topic
  const generateNewQuestion = useCallback(
    (targetTopic?: TrainingTopic) => {
      stopListening();
      stopCurrentSpeech();

      const activeTopic = targetTopic ?? selectedTopic;

      let a = 35;
      let b = 11;

      if (activeTopic === 'multiply11') {
        // Phép nhân 2 chữ số với số 11 (ngẫu nhiên 11 × num hoặc num × 11)
        const num = Math.floor(Math.random() * 89) + 11;
        const isElevenFirst = Math.random() < 0.5;
        if (isElevenFirst) {
          a = 11;
          b = num;
        } else {
          a = num;
          b = 11;
        }
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

      const newQ = {
        a,
        b,
        answer: a * b,
      };
      setQuestion(newQ);
      questionRef.current = newQ;
      setUserAnswer('');
      setFeedback('idle');
      setVoiceTranscript('');
      setVoiceError('');
      lastParsedRef.current = null;
      hasSubmittedRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [selectedTopic, stopListening]
  );

  const handleSelectTopic = (newTopic: TrainingTopic) => {
    setSelectedTopic(newTopic);
    generateNewQuestion(newTopic);
  };

  useEffect(() => {
    generateNewQuestion();
    return () => {
      stopCurrentSpeech();
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [generateNewQuestion]);

  // Phím số ảo 0-9 nhập kết quả nhanh
  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') {
        setFeedback('idle');
      }
      setUserAnswer((prev) => {
        if (prev.length >= 6) return prev;
        return prev + digit;
      });
    },
    [feedback]
  );

  const handleKeypadBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (feedback === 'incorrect') {
      setFeedback('idle');
    }
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleKeypadClear = useCallback(() => {
    if (feedback === 'correct') return;
    setUserAnswer('');
    setFeedback('idle');
    inputRef.current?.focus();
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed)) return;
    verifyAnswer(parsed);
  };

  const currentTopicMeta = TRAINING_MODES.find((m) => m.id === selectedTopic) || TRAINING_MODES[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Bar: Back button, Challenge Button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Quay lại' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenVisualGuide && (
            <button
              type="button"
              onClick={onOpenVisualGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Xem hướng dẫn trực quan (Visual Guide)' : 'Visual Guide'}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isVi ? 'Hướng Dẫn Trực Quan' : 'Visual Guide'}</span>
            </button>
          )}

          {onOpenChallenge && (
            <button
              onClick={() => onOpenChallenge(selectedTopic)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isVi ? 'Thử thách Tính nhẩm (5s / 10s)' : 'Mental Math Challenge (5s / 10s)'}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isVi ? 'Thử Thách Tính Nhẩm' : 'Mental Math Challenge'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isVi ? 'Tính Nhẩm' : 'Mental Math'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">
              {isVi ? 'Phép nhân 2 chữ số' : '2-Digit Multiplication'}
            </span>
          </div>
        </div>
      </div>

      {/* Training Section */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/25 p-4 sm:p-7 shadow-xl relative overflow-hidden space-y-5">
        {/* Subtle backdrop glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Title, Action Buttons & Result Audio Announcement Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base sm:text-lg">
              {isVi ? 'Luyện tập' : 'Training'}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Button: Visual Guide / Hướng Dẫn Trực Quan */}
            {onOpenVisualGuide && (
              <button
                type="button"
                onClick={onOpenVisualGuide}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 text-xs"
                title={isVi ? 'Xem hướng dẫn trực quan (Visual Guide)' : 'Visual Guide'}
              >
                <BookOpen className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Hướng Dẫn' : 'Guide'}</span>
              </button>
            )}

            {/* Button: Mental Math Challenge */}
            {onOpenChallenge && (
              <button
                type="button"
                onClick={() => onOpenChallenge(selectedTopic)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-xs"
                title={isVi ? 'Thử thách tính nhẩm trong 5s hoặc 10s' : 'Mental Math Challenge in 5s or 10s'}
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>{isVi ? 'Thử Thách' : 'Challenge'}</span>
              </button>
            )}

            {/* Toggle Thông báo kết quả bằng giọng nói / âm thanh */}
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
                    ? 'Đang bật thông báo kết quả bằng giọng nói (Bấm để tắt)'
                    : 'Voice result announcement ON (Click to mute)'
                  : isVi
                  ? 'Đang tắt thông báo giọng nói (Bấm để bật)'
                  : 'Voice result announcement OFF (Click to enable)'
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
                    ? 'Kết quả: Bật'
                    : 'Result:ON'
                  : isVi
                  ? 'Kết quả: Tắt'
                  : 'Result:OFF'}
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
        <div className="max-w-xl mx-auto space-y-5 pt-1">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-6 sm:p-10 text-center shadow-inner relative group">
            {/* Header: Topic Badge */}
            <div className="flex items-center justify-center mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {isVi ? currentTopicMeta.badgeVi : currentTopicMeta.badgeEn}
              </span>
            </div>

            {/* Large Mathematical Problem Display with Speaker Button & Speed Adjustment */}
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className="text-4xl sm:text-6xl font-black text-white tracking-wide font-mono flex items-center gap-2 sm:gap-3">
                  <span>{question.a}</span>
                  <span className="text-amber-400 font-sans">×</span>
                  <span>{question.b}</span>
                </div>

                {/* Button Loa để phát thông tin câu hỏi (VD: "Năm Hai nhân Một Một") */}
                <button
                  type="button"
                  onClick={() => pronounceQuestion()}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center shrink-0 ${
                    isSpeakingQuestion
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/30 animate-pulse'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
                  }`}
                  title={
                    isVi
                      ? `Phát âm câu hỏi (${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}) - Tốc độ: ${questionSpeed}x`
                      : `Pronounce question (${question.a} times ${question.b}) - Speed: ${questionSpeed}x`
                  }
                  aria-label={
                    isVi
                      ? `Phát âm câu hỏi: ${getSpelledOutDigits(question.a, true)} nhân ${getSpelledOutDigits(question.b, true)}`
                      : 'Pronounce question'
                  }
                >
                  <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeakingQuestion ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Tùy chỉnh tốc độ loa phát câu hỏi (1.25x, 1.5x, 1.75x) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/90 text-slate-400 shadow-sm">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
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
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400 font-extrabold'
                          : 'hover:text-white hover:bg-slate-800/80 text-slate-400'
                      }`}
                      title={isVi ? `Chỉnh tốc độ đọc ${s}x` : `Playback speed ${s}x`}
                    >
                      {`${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback message with Replay Audio Button */}
            {feedback === 'correct' && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-95 duration-150 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isVi
                    ? `Chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer})`
                    : `Correct: ${getSpelledOutDigits(question.answer, false)} (${question.answer})`}
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
                    ? `Chưa chính xác: ${getSpelledOutDigits(question.answer, true)} (${question.answer})`
                    : `Incorrect: ${getSpelledOutDigits(question.answer, false)} (${question.answer})`}
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

          {/* Clean Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                inputMode="none"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
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
                className={`w-full h-14 px-5 text-center text-2xl sm:text-3xl font-bold font-mono rounded-2xl bg-slate-950 border text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/40 animate-pulse'
                    : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
              />
              {userAnswer && feedback !== 'correct' && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors"
                  title={isVi ? 'Xóa ô nhập' : 'Clear'}
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bàn phím số từ 0 đến 9 để Nhập kết quả trả lời nhanh - 2 hàng 6 cột nhỏ gọn */}
            <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner max-w-md mx-auto w-full">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {/* Hàng 1: 1, 2, 3, 4, 5, 6 */}
                {[1, 2, 3, 4, 5, 6].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Hàng 2: 7, 8, 9, 0, Xóa, Backspace */}
                {[7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(String(digit))}
                    disabled={feedback === 'correct'}
                    className="h-9 sm:h-10 rounded-xl bg-slate-900/95 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-white hover:text-amber-300 font-mono text-base sm:text-lg font-bold border border-slate-800 hover:border-amber-500/50 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center"
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Xóa toàn bộ */}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-rose-500/20 active:bg-rose-500 active:text-white text-slate-400 hover:text-rose-300 font-semibold text-xs sm:text-sm border border-slate-800 hover:border-rose-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa toàn bộ' : 'Clear all'}
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>

                {/* Xóa 1 số lùi */}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={feedback === 'correct' || !userAnswer}
                  className="h-9 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-amber-500/20 active:bg-amber-500 active:text-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center"
                  title={isVi ? 'Xóa 1 số' : 'Backspace'}
                  aria-label="Backspace"
                >
                  <Delete className="w-4 h-4 text-slate-400 hover:text-amber-300" />
                </button>
              </div>
            </div>

            {/* Live voice feedback indicator when listening */}
            {isListening && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-150">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="truncate">
                  {voiceTranscript
                    ? `${isVi ? 'Đang nhận diện:' : 'Detected:'} "${voiceTranscript}" ➔ ${isVi ? 'Tự nộp bài...' : 'Submitting...'}`
                    : isVi
                    ? '🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: "sáu không năm", "7224", "1029",...)'
                    : '🎙️ Listening: Speak your answer (e.g. "six zero five", "7224",...)'}
                </span>
              </div>
            )}

            {/* Error banner if microphone access is blocked or speech not heard */}
            {voiceError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold leading-relaxed">{voiceError}</p>
                </div>
                <button
                  type="button"
                  onClick={startListening}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold shrink-0 transition-colors"
                >
                  {isVi ? 'Thử lại' : 'Retry'}
                </button>
              </div>
            )}

            {/* Action Buttons: Submit/Next, Answer by Voice, and Refresh */}
            <div className="flex items-center gap-2.5">
              {/* Submit or Next Problem Button */}
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
                  <span>{isVi ? 'Kiểm tra KQ' : 'Answer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Chức năng Trả lời bằng Voice */}
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
                    ? 'Bấm để trả lời bằng giọng nói (Voice)'
                    : 'Answer by voice'
                }
                className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span>{isVi ? 'Đang nghe...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>{isVi ? 'Trả lời Voice' : 'Voice'}</span>
                  </>
                )}
              </button>

              {/* Skip / Refresh Problem Button */}
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
