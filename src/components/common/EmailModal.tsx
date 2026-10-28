import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Mail,
  X,
  Send,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = 'tctlts9@gmail.com',
}) => {
  const { language, t } = useLanguage();
  const [recipient] = useState<string>(defaultRecipient);
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>(() => {
    return language === 'vi'
      ? 'Phản hồi / Góp ý về MY BRAIN ACADEMY'
      : 'Inquiry / Feedback regarding MY BRAIN ACADEMY';
  });
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const subjectPresets = language === 'vi'
    ? [
        'Phản hồi & Đóng góp ý kiến',
        'Câu hỏi về MY BRAIN ACADEMY',
        'Đề xuất tính năng mới',
        'Hợp tác & Liên kết đối tác',
      ]
    : [
        'Feedback & Suggestion',
        'MY BRAIN ACADEMY Inquiry',
        'Feature Request',
        'Partnership & Collaboration',
      ];

  const validateForm = (): boolean => {
    if (!senderEmail.trim()) {
      setError(t.errorEmailRequired || 'Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail.trim())) {
      setError(t.errorEmailInvalid || 'Please enter a valid email address.');
      return false;
    }
    if (!subject.trim()) {
      setError(t.errorSubjectRequired || 'Please enter an email subject.');
      return false;
    }
    if (!content.trim()) {
      setError(t.errorContentRequired || 'Please enter your message content.');
      return false;
    }
    setError('');
    return true;
  };

  const getFullBodyText = () => {
    return `From: ${senderEmail}\nPlatform: MY BRAIN ACADEMY\n\nMessage:\n${content}`;
  };

  const getGmailUrl = () => {
    const fullBody = getFullBodyText();
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  };

  // Primary submit: launches Gmail directly (No Outlook)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setIsSubmitting(true);

    const fullBody = getFullBodyText();
    const gmailUrl = getGmailUrl();

    // 1. Open Gmail Web Composer directly in a new window/tab
    try {
      const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed) {
        // Fallback if popup is blocked
        window.location.assign(gmailUrl);
      }
    } catch (err) {
      console.warn('Could not open Gmail window directly', err);
      window.location.assign(gmailUrl);
    }

    // 2. Dispatch background attempt to FormSubmit gateway
    try {
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: senderEmail,
          email: senderEmail,
          _replyto: senderEmail,
          _subject: `[MY BRAIN ACADEMY] ${subject}`,
          message: fullBody,
        }),
      }).catch(() => {});
    } catch {
      // Ignore background fetch failure
    }

    // 3. Switch to confirmation screen with direct Gmail action
    setIsSubmitting(false);
    setIsSent(true);
  };

  const handleCopy = () => {
    const fullText = `To: ${recipient}\nFrom: ${senderEmail}\nSubject: ${subject}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetForm = () => {
    setIsSent(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.emailModalTitle}</h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? `Gửi tin nhắn trực tiếp qua Gmail tới ${recipient}`
                : `Direct message via Gmail to ${recipient}`}
            </p>
          </div>
        </div>

        {/* Confirmation & Success View */}
        {isSent ? (
          <div className="my-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">
                {language === 'vi' ? 'Sẵn Sàng Gửi Qua Gmail!' : 'Gmail Composer Ready!'}
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {language === 'vi' ? (
                  <>
                    Thư của bạn đã được soạn sẵn cho người nhận{' '}
                    <span className="text-red-400 font-mono font-semibold">{recipient}</span>. Nhấn nút bên dưới để mở trong Gmail và gửi:
                  </>
                ) : (
                  <>
                    Your draft has been formatted for{' '}
                    <span className="text-red-400 font-mono font-semibold">{recipient}</span>. Click the button below to view in Gmail:
                  </>
                )}
              </p>
            </div>

            {/* Email Summary Details */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>To:</span>
                <span className="text-red-400 font-semibold">{recipient}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>From:</span>
                <span className="text-slate-200">{senderEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subject:</span>
                <span className="text-slate-200 truncate max-w-[240px]">{subject}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400">
                <span className="block mb-1 font-semibold text-slate-300">
                  {language === 'vi' ? 'Nội dung thư:' : 'Message Content:'}
                </span>
                <p className="font-sans text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {content}
                </p>
              </div>
            </div>

            {/* Direct Gmail Action Button (NO Outlook) */}
            <div className="space-y-2 pt-1">
              <a
                href={getGmailUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all cursor-pointer active:scale-98"
              >
                <Mail className="w-4 h-4" />
                <span>{language === 'vi' ? 'Mở trong Gmail (Open in Gmail)' : 'Open in Gmail'}</span>
                <ExternalLink className="w-4 h-4 opacity-90" />
              </a>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isCopied ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Sao chép nội dung' : 'Copy Draft Text')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer py-1 px-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Soạn thư khác' : 'Send another'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  {language === 'vi' ? 'Email Người Nhận (To)' : 'Recipient Email (To)'}
                </label>
                <span className="text-[10px] text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  {language === 'vi' ? 'Liên Hệ Chính Thức' : 'Official Contact'}
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={recipient}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed select-all focus:outline-none"
              />
            </div>

            {/* Sender Email */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {language === 'vi' ? 'Email Của Bạn (From)' : 'Your Email (From)'} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 text-white placeholder-slate-600 text-xs transition-all outline-none"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {language === 'vi' ? 'Chủ Đề (Subject)' : 'Subject'} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập chủ đề thư...' : 'Enter email subject...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 text-white placeholder-slate-600 text-xs transition-all outline-none"
              />

              {/* Subject Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {subjectPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubject(preset)}
                    className="text-[10px] text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-800 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {language === 'vi' ? 'Nội Dung Thư' : 'Message Content'} <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'Nhập nội dung câu hỏi, góp ý hoặc liên hệ của bạn tại đây...'
                    : 'Type your message, questions, or comments here...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 text-white placeholder-slate-600 text-xs transition-all outline-none resize-none"
              />
            </div>

            {/* Direct Gmail Info Banner (No Outlook) */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-red-500" />
                <span>
                  {language === 'vi'
                    ? 'Tự động mở trình soạn thư Gmail trực tiếp (Không dùng Outlook)'
                    : 'Directly opens Gmail Web Composer (No Outlook)'}
                </span>
              </span>
              <span className="text-red-400 font-bold font-mono">Gmail</span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                title={language === 'vi' ? 'Sao chép toàn bộ bản nháp' : 'Copy entire email draft to clipboard'}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{language === 'vi' ? 'Đã chép!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'vi' ? 'Sao chép nháp' : 'Copy Draft'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                {/* Primary Send Button: Direct to Gmail */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-lg shadow-md shadow-red-600/25 transition-all cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'vi' ? 'Đang mở Gmail...' : 'Opening Gmail...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Gửi qua Gmail' : 'Send via Gmail'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
