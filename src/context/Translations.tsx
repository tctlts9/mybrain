import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// HỆ THỐNG DỊCH TIẾNG VIỆT - TIẾNG ANH DUY NHẤT CỦA TOÀN WEB APP
// Toàn bộ từ điển, câu văn, nhãn giao diện và logic nhận diện ngôn ngữ đều
// tập trung tại file này để dễ dàng chỉnh sửa khi cần thiết.
// ============================================================================

// ============================================================================
// 1. CẤU TRÚC & BẢN DỊCH CHÍNH (dùng qua t.*)
// ============================================================================
export type Language = 'vi' | 'en';

export interface Translations {
  // Brand
  brandTitle: string;
  brandSubtitle: string;
  systemOnline: string;
  detectingLocation: string;
  detectedCountry: string;
  switchToVi: string;
  switchToEn: string;

  // Tabs
  tabMentalMath: string;
  tabLociJourney: string;
  tabBrainTraining: string;
  mobileMentalMath: string;
  mobileLociJourney: string;
  mobileBrainTraining: string;

  // Mental Math Content
  mentalMathTitle: string;
  mentalMathDesc: string;
  mentalMathChallenge: string;
  cardMultiplyTitle: string;
  cardMultiplySub: string;
  cardDivideTitle: string;
  cardAddTitle: string;
  cardSubtractTitle: string;
  cardSqrtTitle: string;
  cardPowerTitle: string;
  cardPercentTitle: string;
  cardPercentSub: string;
  cardPercentBasicTitle: string;
  cardPercentChangeTitle: string;
  cardPercentReverseTitle: string;
  cardDailyReflexTitle: string;
  cardDailyReflexSub: string;
  backToMentalMath: string;
  cardMultiply2Title: string;
  cardMultiply2Desc: string;
  cardMultiply2Tag: string;
  cardMultiply11Title: string;
  cardMultiply11Desc: string;
  cardMultiply11Tag: string;
  cardMultiply99Title: string;
  cardMultiply99Desc: string;
  cardMultiply99Tag: string;
  cardMultiply1DigitTitle: string;
  cardMultiply1DigitDesc: string;
  cardMultiply1DigitTag: string;
  cardMultiply3Title: string;
  cardMultiply3Desc: string;
  cardMultiply3Tag: string;
  practiceNow: string;
  practiceModalTitle: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  checkAnswer: string;
  yourAnswer: string;
  streak: string;
  score: string;

  // Footer & Common Actions
  copyright: string;
  footerQuoteLine1: string;
  footerQuoteLine2: string;
  installApp: string;
  youtube: string;
  email: string;
  buyCoffee: string;
  offlineNotice: string;

  // Email Modal
  emailModalTitle: string;
  emailModalSubtitle: string;
  yourEmail: string;
  yourEmailPlaceholder: string;
  recipientLabel: string;
  subjectLabel: string;
  contentLabel: string;
  contentPlaceholder: string;
  sendViaApp: string;
  openEmailClient: string;
  copyContent: string;
  copiedContent: string;
  close: string;
  errorEmailRequired: string;
  errorEmailInvalid: string;
  errorSubjectRequired: string;
  errorContentRequired: string;
  emailSentSuccess: string;

  // Buy Coffee Modal
  buyCoffeeTitle: string;
  buyCoffeeSubtitle: string;
  vietnamBankTab: string;
  internationalTab: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  copySuccess: string;
  paypalEmail: string;

  // PWA Install Modal
  installModalTitle: string;
  installModalSubtitle: string;
  alreadyInstalled: string;
  installNow: string;
  iosInstructionsTitle: string;
  iosStep1: string;
  iosStep2: string;
  iosStep3: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    // Brand
    brandTitle: 'MY BRAIN',
    brandSubtitle: 'ACADEMY',
    systemOnline: 'Hệ thống Trực tuyến',
    detectingLocation: 'Đang định vị IP...',
    detectedCountry: 'Vị trí',
    switchToVi: 'Tiếng Việt',
    switchToEn: 'English',

    // Tabs
    tabMentalMath: 'Tính Nhẩm',
    tabLociJourney: 'Hành trình Ký Ức',
    tabBrainTraining: 'Luyện Não Bộ',
    mobileMentalMath: 'Tính Nhẩm',
    mobileLociJourney: 'Hành trình Ký Ức ',
    mobileBrainTraining: 'Luyện Não Bộ',

    // Content
    mentalMathTitle: 'Tính Nhẩm',
    mentalMathDesc: 'Học viện huấn luyện não bộ, rèn luyện kỹ năng tính nhẩm siêu trí tuệ và phương pháp tư duy số học Super Brain.',
    mentalMathChallenge: 'Thử Thách Tính Nhẩm',
    cardMultiplyTitle: 'Phép nhân',
    cardMultiplySub: '2 chữ số · Nhân với số 11 · Nhân với 1 chữ số · Nhân với số 99',
    cardDivideTitle: 'Phép chia',
    cardAddTitle: 'Phép cộng',
    cardSubtractTitle: 'Phép trừ',
    cardSqrtTitle: 'Căn bậc 2',
    cardPowerTitle: 'Lũy thừa',
    cardPercentTitle: 'Tỷ lệ %',
    cardPercentSub: 'Tính % của số · Tăng / Giảm % · Tỷ lệ & Số gốc',
    cardPercentBasicTitle: 'Tính % của một số',
    cardPercentChangeTitle: 'Tăng / Giảm %',
    cardPercentReverseTitle: 'Tìm tỷ lệ & Số gốc',
    cardDailyReflexTitle: 'Rèn luyện phản xạ tính nhẩm hàng ngày',
    cardDailyReflexSub: 'Cộng · Trừ · Nhân · Chia · Căn bậc 2 · Lũy thừa · %',
    backToMentalMath: 'Quay lại Tính Nhẩm',
    cardMultiply2Title: 'Phép nhân 2 chữ số',
    cardMultiply2Desc: 'Rèn luyện phản xạ tính nhẩm tích 2 chữ số với 2 chữ số nhanh chóng, chính xác không cần dùng giấy bút hay máy tính.',
    cardMultiply2Tag: 'Cơ bản & Nâng cao',
    cardMultiply11Title: 'Nhân với số 11',
    cardMultiply11Desc: 'Bí quyết tính nhẩm nhân nhanh với số 11 từ 2 chữ số đến nhiều chữ số siêu tốc.',
    cardMultiply11Tag: 'Bí quyết siêu tốc',
    cardMultiply99Title: 'Nhân với số 99',
    cardMultiply99Desc: 'Bí quyết tính nhẩm nhân nhanh với số 99 từ 2 chữ số đến nhiều chữ số siêu tốc.',
    cardMultiply99Tag: 'Bí quyết siêu tốc',
    cardMultiply1DigitTitle: 'Nhân với 1 chữ số',
    cardMultiply1DigitDesc: 'Bí quyết tính nhẩm nhân nhanh số có nhiều chữ số với 1 chữ số (từ 2 đến 9) siêu tốc.',
    cardMultiply1DigitTag: 'Nền tảng & Phản xạ',
    cardMultiply3Title: 'Phép nhân 3 số',
    cardMultiply3Desc: 'Thử thách nâng cao bộ nhớ làm việc và tốc độ tư duy với kỹ thuật tính nhẩm tích 3 số siêu trí tuệ.',
    cardMultiply3Tag: 'Siêu trí tuệ',
    practiceNow: 'Luyện tập ngay',
    practiceModalTitle: 'Luyện Tập Tính Nhẩm',
    correct: 'Chính xác! Xuất sắc!',
    incorrect: 'Chưa chính xác, thử lại nhé!',
    nextQuestion: 'Câu tiếp theo',
    checkAnswer: 'Kiểm tra',
    yourAnswer: 'Đáp án của bạn',
    streak: 'Chuỗi đúng',
    score: 'Điểm số',

    // Footer & Common Actions
    copyright: 'Bản quyền © 2026 MY BRAIN ACADEMY',
    footerQuoteLine1: 'Chuyên môn không bằng kỹ năng',
    footerQuoteLine2: 'Hy vọng các em có thể xây dựng cho mình kỹ năng cần thiết nhất',
    installApp: 'Cài Đặt App',
    youtube: 'Youtube',
    email: 'Email',
    buyCoffee: 'Buy Coffee',
    offlineNotice: 'Chế độ Ngoại tuyến — Dữ liệu đã lưu bộ nhớ đệm.',

    // Email Modal
    emailModalTitle: 'Gửi Thư Trực Tuyến',
    emailModalSubtitle: 'Liên hệ trao đổi, phản hồi góp ý hoặc hợp tác cùng MY BRAIN ACADEMY',
    yourEmail: 'Email của bạn',
    yourEmailPlaceholder: 'name@example.com',
    recipientLabel: 'Người nhận',
    subjectLabel: 'Chủ đề thư',
    contentLabel: 'Nội dung phản hồi',
    contentPlaceholder: 'Nhập nội dung bạn muốn gửi tới chúng tôi...',
    sendViaApp: 'Gửi Thư Ngay',
    openEmailClient: 'Mở ứng dụng Email ngoài',
    copyContent: 'Sao Chép Nội Dung',
    copiedContent: 'Đã Sao Chép!',
    close: 'Đóng',
    errorEmailRequired: 'Vui lòng nhập địa chỉ email của bạn.',
    errorEmailInvalid: 'Địa chỉ email không đúng định dạng.',
    errorSubjectRequired: 'Vui lòng nhập tiêu đề thư.',
    errorContentRequired: 'Vui lòng nhập nội dung thư.',
    emailSentSuccess: 'Thư của bạn đã được gửi thành công!',

    // Buy Coffee Modal
    buyCoffeeTitle: 'Ủng Hộ Cà Phê (Buy Me A Coffee)',
    buyCoffeeSubtitle: 'Cảm ơn bạn đã đồng hành và ủng hộ đội ngũ phát triển MY BRAIN ACADEMY!',
    vietnamBankTab: 'Ngân Hàng Việt Nam',
    internationalTab: 'Quốc Tế (PayPal / Swift)',
    bankName: 'Ngân Hàng',
    accountNumber: 'Số Tài Khoản',
    accountHolder: 'Chủ Tài Khoản',
    copySuccess: 'Đã sao chép vào bộ nhớ tạm!',
    paypalEmail: 'Tài Khoản PayPal',

    // PWA Install Modal
    installModalTitle: 'Cài Đặt Ứng Dụng MY BRAIN ACADEMY',
    installModalSubtitle: 'Trải nghiệm mượt mà không cần mở trình duyệt trên cả điện thoại & máy tính',
    alreadyInstalled: 'Ứng dụng đã được cài đặt trên thiết bị của bạn.',
    installNow: 'Cài Đặt Ngay',
    iosInstructionsTitle: 'Hướng dẫn cài đặt trên iPhone / iPad (Safari)',
    iosStep1: 'Nhấn vào nút Chia sẻ (Share) ở thanh dưới cùng Safari.',
    iosStep2: 'Cuộn xuống và chọn "Thêm vào Màn hình chính" (Add to Home Screen).',
    iosStep3: 'Nhấn "Thêm" (Add) ở góc trên bên phải để hoàn tất.',
  },
  en: {
    // Brand
    brandTitle: 'MY BRAIN',
    brandSubtitle: 'ACADEMY',
    systemOnline: 'System Online',
    detectingLocation: 'Detecting IP...',
    detectedCountry: 'Location',
    switchToVi: 'Tiếng Việt',
    switchToEn: 'English',

    // Tabs
    tabMentalMath: 'Mental Math',
    tabLociJourney: 'Memory Palace',
    tabBrainTraining: 'Brain Training',
    mobileMentalMath: 'Mental Math',
    mobileLociJourney: 'Memory Palace',
    mobileBrainTraining: 'Brain Training',

    // Content
    mentalMathTitle: 'Mental Math',
    mentalMathDesc: 'Brain training academy for advanced cognitive arithmetic, lightning-speed calculation, and brain agility development.',
    mentalMathChallenge: 'Mental Math Challenge',
    cardMultiplyTitle: 'Multiplication',
    cardMultiplySub: '2-Digit · Multiply by 11 · Multiply by 1-Digit · Multiply by 99',
    cardDivideTitle: 'Division',
    cardAddTitle: 'Addition',
    cardSubtractTitle: 'Subtraction',
    cardSqrtTitle: 'Square Root',
    cardPowerTitle: 'Exponents',
    cardPercentTitle: 'Percentage',
    cardPercentSub: 'Basic % · Increase / Decrease · Ratio & Reverse %',
    cardPercentBasicTitle: 'Basic Percentages',
    cardPercentChangeTitle: 'Increase & Decrease %',
    cardPercentReverseTitle: 'Ratio & Reverse %',
    cardDailyReflexTitle: 'Daily Mental Math Reflex',
    cardDailyReflexSub: 'Add · Subtract · Multiply · Divide · Roots · Powers · %',
    backToMentalMath: 'Back to Mental Math',
    cardMultiply2Title: '2-Digit Multiplication',
    cardMultiply2Desc: 'Master mental calculation reflexes for multiplying 2-digit numbers with speed and precision without a calculator.',
    cardMultiply2Tag: 'Core & Intermediate',
    cardMultiply11Title: 'Multiply by 11',
    cardMultiply11Desc: 'Fast mental math shortcut for multiplying 2-digit and multi-digit numbers by 11.',
    cardMultiply11Tag: 'Fast Shortcut',
    cardMultiply99Title: 'Multiply by 99',
    cardMultiply99Desc: 'Fast mental math shortcut for multiplying 2-digit and multi-digit numbers by 99.',
    cardMultiply99Tag: 'Fast Shortcut',
    cardMultiply1DigitTitle: 'Multiply by 1-Digit',
    cardMultiply1DigitDesc: 'Mental math mastery for multiplying multi-digit numbers by a single digit (2 to 9) with speed and precision.',
    cardMultiply1DigitTag: 'Core Foundation',
    cardMultiply3Title: '3-Number Multiplication',
    cardMultiply3Desc: 'Push your working memory and mental agility to the limit with advanced 3-number multiplication mastery.',
    cardMultiply3Tag: 'Advanced Mastery',
    practiceNow: 'Start Practice',
    practiceModalTitle: 'Mental Math Practice',
    correct: 'Correct! Excellent!',
    incorrect: 'Not quite, try again!',
    nextQuestion: 'Next Problem',
    checkAnswer: 'Check',
    yourAnswer: 'Your Answer',
    streak: 'Streak',
    score: 'Score',

    // Footer & Common Actions
    copyright: 'Copyright © 2026 MY BRAIN ACADEMY',
    footerQuoteLine1: 'Skill outweighs pure expertise',
    footerQuoteLine2: 'I hope you develop the skills that truly matter',
    installApp: 'Install App',
    youtube: 'Youtube',
    email: 'Email',
    buyCoffee: 'Buy Coffee',
    offlineNotice: 'Offline Mode — Cached data is being used.',

    // Email Modal
    emailModalTitle: 'Send Message Online',
    emailModalSubtitle: 'Reach out for inquiries, feedback, or collaborations with MY BRAIN ACADEMY',
    yourEmail: 'Your Email',
    yourEmailPlaceholder: 'name@example.com',
    recipientLabel: 'Recipient',
    subjectLabel: 'Subject',
    contentLabel: 'Message Content',
    contentPlaceholder: 'Type your message or feedback here...',
    sendViaApp: 'Send Message Now',
    openEmailClient: 'Open Email Client',
    copyContent: 'Copy Content',
    copiedContent: 'Copied!',
    close: 'Close',
    errorEmailRequired: 'Please enter your email address.',
    errorEmailInvalid: 'Please enter a valid email address.',
    errorSubjectRequired: 'Please enter a subject.',
    errorContentRequired: 'Please enter your message.',
    emailSentSuccess: 'Your message has been sent successfully!',

    // Buy Coffee Modal
    buyCoffeeTitle: 'Buy Me A Coffee',
    buyCoffeeSubtitle: 'Thank you for supporting the development of MY BRAIN ACADEMY!',
    vietnamBankTab: 'Vietnam Bank Transfer',
    internationalTab: 'International (PayPal / Swift)',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    accountHolder: 'Account Holder',
    copySuccess: 'Copied to clipboard!',
    paypalEmail: 'PayPal Account',

    // PWA Install Modal
    installModalTitle: 'Install MY BRAIN ACADEMY App',
    installModalSubtitle: 'Fast and seamless mobile & desktop experience without browser chrome',
    alreadyInstalled: 'You are currently running the installed standalone app.',
    installNow: 'Install Now',
    iosInstructionsTitle: 'Install on iPhone / iPad (Safari)',
    iosStep1: 'Tap the Share icon in the bottom Safari toolbar.',
    iosStep2: 'Scroll down and tap "Add to Home Screen".',
    iosStep3: 'Tap "Add" in the top-right corner to complete installation.',
  },
};

// ============================================================================
// 2. TỪ ĐIỂN CỤM TỪ & NHÃN GIAO DIỆN TOÀN WEB APP (dùng qua tr(...) / translateText(...))
// Bạn có thể chỉnh trực tiếp nội dung "vi" hoặc "en" của từng mục bên dưới.
// ============================================================================
export interface PhraseTranslation {
  vi: string;
  en: string;
}

export const PHRASE_TRANSLATIONS: Record<string, PhraseTranslation> = {
  "% Độ chính xác": { vi: "% Độ chính xác", en: "Accuracy" },
  "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"bảy bốn tám\", \"748\",...)": { vi: "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"bảy bốn tám\", \"748\",...)", en: "🎙️ Listening: Speak your answer (e.g. \"seven four eight\", \"748\",...)" },
  "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"bốn bốn bốn\", \"444\",...)": { vi: "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"bốn bốn bốn\", \"444\",...)", en: "🎙️ Listening: Speak your answer (e.g. \"four four four\", \"444\",...)" },
  "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"sáu bảy ba hai\", \"6732\",...)": { vi: "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"sáu bảy ba hai\", \"6732\",...)", en: "🎙️ Listening: Speak your answer (e.g. \"six seven three two\", \"6732\",...)" },
  "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"sáu không năm\", \"7224\", \"1029\",...)": { vi: "🎙️ Đang lắng nghe: Hãy đọc to đáp án (VD: \"sáu không năm\", \"7224\", \"1029\",...)", en: "🎙️ Listening: Speak your answer (e.g. \"six zero five\", \"7224\",...)" },
  "🎙️ Đang lắng nghe: Hãy đọc to đáp án của bạn": { vi: "🎙️ Đang lắng nghe: Hãy đọc to đáp án của bạn", en: "🎙️ Listening: Speak your answer aloud" },
  "🎙️ Đang nghe... Hãy đọc to đáp án của bạn": { vi: "🎙️ Đang nghe... Hãy đọc to đáp án của bạn", en: "🎙️ Listening... Speak your answer" },
  "🎙️ Đang nghe... Hãy đọc to đáp án của bạn [Đọc to]": { vi: "🎙️ Đang nghe... Hãy đọc to đáp án của bạn", en: "🎙️ Listening... Speak your answer aloud" },
  "🎙️ Hãy đọc to đáp án (VD: \"bảy bốn tám\", \"748\",...)": { vi: "🎙️ Hãy đọc to đáp án (VD: \"bảy bốn tám\", \"748\",...)", en: "🎙️ Speak answer aloud (e.g. \"seven four eight\", \"748\",...)" },
  "🎙️ Hãy đọc to đáp án (VD: \"sáu bảy ba hai\", \"6732\",...)": { vi: "🎙️ Hãy đọc to đáp án (VD: \"sáu bảy ba hai\", \"6732\",...)", en: "🎙️ Speak answer aloud (e.g. \"six seven three two\", \"6732\",...)" },
  "🎙️ Hãy đọc to đáp án (VD: \"tám năm tám\", \"792\",...)": { vi: "🎙️ Hãy đọc to đáp án (VD: \"tám năm tám\", \"792\",...)", en: "🎙️ Speak answer aloud (e.g. \"eight five eight\", \"792\",...)" },
  "🎙️ Hãy đọc to đáp án của bạn...": { vi: "🎙️ Hãy đọc to đáp án của bạn...", en: "🎙️ Speak answer aloud..." },
  "💡 Mở rộng cho 999, 9999, 99999, 999999: Luôn lấy N thêm đúng k số 0 (N × 10ᵏ) rồi trừ chính số N!": { vi: "💡 Mở rộng cho 999, 9999, 99999, 999999: Luôn lấy N thêm đúng k số 0 (N × 10ᵏ) rồi trừ chính số N!", en: "💡 Extends to 999, 9999, 99999, 999999: Append k zeros (N × 10ᵏ) and subtract N itself!" },
  "1. Phần đầu (24 + 1 = 25):": { vi: "1. Phần đầu (24 + 1 = 25):", en: "1. Head (24 + 1 = 25):" },
  "1. Thêm \"00\" vào sau N:": { vi: "1. Thêm \"00\" vào sau N:", en: "1. Append \"00\" to N:" },
  "10% → 90% của số": { vi: "10% → 90% của số", en: "10% → 90% of Base" },
  "2. Phần bù 2 số cuối:": { vi: "2. Phần bù 2 số cuối:", en: "2. Complement of 68:" },
  "2. Trừ đi chính số N:": { vi: "2. Trừ đi chính số N:", en: "2. Subtract N itself:" },
  "2D · 2 chữ số": { vi: "2D · 2 chữ số", en: "2D · 2-Digit" },
  "2D3D · 2 chữ số và 3 chữ số": { vi: "2D3D · 2 chữ số và 3 chữ số", en: "2D3D · 2 & 3-Digit" },
  "3D · 3 chữ số": { vi: "3D · 3 chữ số", en: "3D · 3-Digit" },
  "3D4D · 3 chữ số và 4 chữ số": { vi: "3D4D · 3 chữ số và 4 chữ số", en: "3D4D · 3 & 4-Digit" },
  "4D · 4 chữ số": { vi: "4D · 4 chữ số", en: "4D · 4-Digit" },
  "9 số chính phương liên tiếp để nhẩm căn bậc 2": { vi: "9 số chính phương liên tiếp để nhẩm căn bậc 2", en: "9 consecutive square roots from the starting square" },
  "Ảnh sau": { vi: "Ảnh sau", en: "Next" },
  "Ảnh trước": { vi: "Ảnh trước", en: "Previous" },
  "Áp dụng toàn bộ": { vi: "Áp dụng toàn bộ", en: "Apply Globally" },
  "Áp dụng toàn Tab": { vi: "Áp dụng toàn Tab", en: "Apply to All" },
  "Âm thanh & Giọng đọc: BẬT": { vi: "Âm thanh & Giọng đọc: BẬT", en: "Sound: ON" },
  "Âm thanh & Giọng đọc: TẮT": { vi: "Âm thanh & Giọng đọc: TẮT", en: "Sound: OFF" },
  "Âm thanh: Bật": { vi: "Âm thanh: Bật", en: "Sound: ON" },
  "Âm thanh: BẬT": { vi: "Âm thanh: BẬT", en: "Sound: ON" },
  "Âm thanh: Tắt": { vi: "Âm thanh: Tắt", en: "Sound: OFF" },
  "Âm thanh: TẮT": { vi: "Âm thanh: TẮT", en: "Sound: OFF" },
  "Ẩn / Hiện Card": { vi: "Ẩn / Hiện Card", en: "Show / Hide Cards" },
  "Ẩn / Hiện Card theo Tab": { vi: "Ẩn / Hiện Card theo Tab", en: "Show / Hide Cards by Tab" },
  "Ẩn / Hiện Card theo Tab (chỉnh chi tiết và tất cả card)": { vi: "Ẩn / Hiện Card theo Tab (chỉnh chi tiết và tất cả card)", en: "Show / Hide Cards by Tab (individual & all cards)" },
  "Ẩn con": { vi: "Ẩn con", en: "Hide sub" },
  "Ẩn đáp án": { vi: "Ẩn đáp án", en: "Hide Answers" },
  "Ẩn hết": { vi: "Ẩn hết", en: "Hide all" },
  "Ẩn tất cả Card": { vi: "Ẩn tất cả Card", en: "Hide All Cards" },
  "Ẩn tất cả Tab này": { vi: "Ẩn tất cả Tab này", en: "Hide All in Tab" },
  "Ẩn/Hiện Card": { vi: "Ẩn/Hiện Card", en: "Cards" },
  "Bản chất đại số": { vi: "Bản chất đại số", en: "Core Identity" },
  "Bạn có thể bật hiển thị lại card của Tab Hành trình ký ức Loci bất cứ lúc nào.": { vi: "Bạn có thể bật hiển thị lại card của Tab Hành trình ký ức Loci bất cứ lúc nào.", en: "You can re-enable cards for the Memory Palace tab anytime." },
  "Bạn có thể bật hiển thị lại card của Tab Rèn luyện não bộ bất cứ lúc nào.": { vi: "Bạn có thể bật hiển thị lại card của Tab Rèn luyện não bộ bất cứ lúc nào.", en: "You can re-enable cards for Brain Training anytime." },
  "Bạn có thể bật hiển thị lại toàn bộ hoặc chọn từng card chi tiết cho Tab Tính nhẩm.": { vi: "Bạn có thể bật hiển thị lại toàn bộ hoặc chọn từng card chi tiết cho Tab Tính nhẩm.", en: "You can re-enable all cards or customize individual cards for Mental Math." },
  "Bảng Schulte": { vi: "Bảng Schulte", en: "Schulte Table" },
  "Bảng Schulte — Luyện Tập Trung & Thị Giác (Siêu trí tuệ)": { vi: "Bảng Schulte — Luyện Tập Trung & Thị Giác (Siêu trí tuệ)", en: "Schulte Table-Focus&Peripheral Vision(Super Intelligence)" },
  "Bảng Schulte 5x5": { vi: "Bảng Schulte 5x5", en: "5x5 Schulte Table" },
  "Bảng Schulte 5x5 - Luyện tập ngay": { vi: "Bảng Schulte 5x5 - Luyện tập ngay", en: "5x5 Schulte Table - Start training" },
  "Bảng vừa được xáo trộn lại!": { vi: "Bảng vừa được xáo trộn lại!", en: "Board reshuffled!" },
  "Bắt đầu": { vi: "Bắt đầu", en: "Start" },
  "Bắt đầu câu hỏi thử thách": { vi: "Bắt đầu câu hỏi thử thách", en: "Start challenge question" },
  "Bắt đầu thử thách mới (10 câu)": { vi: "Bắt đầu thử thách mới (10 câu)", en: "Start New Challenge (10 Problems)" },
  "Bắt đầu tính giờ trả lời 9 ô": { vi: "Bắt đầu tính giờ trả lời 9 ô", en: "Start 9-box countdown" },
  "Bấm \"Bắt đầu thử thách\" để đếm ngược...": { vi: "Bấm \"Bắt đầu thử thách\" để đếm ngược...", en: "Click \"Start Challenge\" to begin..." },
  "Bấm \"Bắt đầu\" để bắt đầu thử thách...": { vi: "Bấm \"Bắt đầu\" để bắt đầu thử thách...", en: "Click \"Start\" to begin challenge..." },
  "Bấm \"Bắt đầu\" để tính giờ trả lời 9 ô...": { vi: "Bấm \"Bắt đầu\" để tính giờ trả lời 9 ô...", en: "Click \"Start\" to start the 9-box timer..." },
  "Bấm để trả lời bằng giọng nói": { vi: "Bấm để trả lời bằng giọng nói", en: "Answer by voice" },
  "Bấm để trả lời bằng giọng nói (Voice)": { vi: "Bấm để trả lời bằng giọng nói (Voice)", en: "Answer by voice" },
  "Bấm nút \"Bắt đầu\" để hiện câu hỏi phản xạ và bắt đầu tính giờ.": { vi: "Bấm nút \"Bắt đầu\" để hiện câu hỏi phản xạ và bắt đầu tính giờ.", en: "Click \"Start\" to reveal the reflex problem and start the timer." },
  "Bấm nút \"Bắt đầu\" để hiện câu hỏi và bắt đầu tính giờ.": { vi: "Bấm nút \"Bắt đầu\" để hiện câu hỏi và bắt đầu tính giờ.", en: "Click \"Start\" to reveal the problem and start the timer." },
  "Bấm nút \"Bắt đầu\" để quan sát câu hỏi, ghi nhớ rồi trả lời.": { vi: "Bấm nút \"Bắt đầu\" để quan sát câu hỏi, ghi nhớ rồi trả lời.", en: "Click \"Start\" to observe, memorize, then answer." },
  "Bấm vào Vòng 1, 2, 3 để chọn nhanh hoặc nhập số": { vi: "Bấm vào Vòng 1, 2, 3 để chọn nhanh hoặc nhập số", en: "Click Ring 1, 2, 3 to quick-pick or type numbers" },
  "Bật": { vi: "Bật", en: "On" },
  "Bật/tắt dãy số ngẫu nhiên kết hợp cả phép cộng (+) và phép trừ (−) với kết quả luôn hợp lý": { vi: "Bật/tắt dãy số ngẫu nhiên kết hợp cả phép cộng (+) và phép trừ (−) với kết quả luôn hợp lý", en: "Toggle mixed addition (+) and subtraction (−) sequence with guaranteed valid results" },
  "Bí Quyết Tính Nhanh": { vi: "Bí Quyết Tính Nhanh", en: "Pro Tip" },
  "Bội số gốc": { vi: "Bội số gốc", en: "Root Factor" },
  "Bước 1 • 2 số đầu (Trái)": { vi: "Bước 1 • 2 số đầu (Trái)", en: "Step 1 • Left 2 Digits" },
  "Bước 2 • 2 số cuối (Phải)": { vi: "Bước 2 • 2 số cuối (Phải)", en: "Step 2 • Right 2 Digits" },
  "Bước 3 • Ghép kết quả": { vi: "Bước 3 • Ghép kết quả", en: "Step 3 • Combine" },
  "Bước nhảy tùy chỉnh": { vi: "Bước nhảy tùy chỉnh", en: "Custom step" },
  "Bước nhảy:": { vi: "Bước nhảy:", en: "Step:" },
  "Bước sau": { vi: "Bước sau", en: "Next" },
  "Bước trước": { vi: "Bước trước", en: "Previous" },
  "Các card con của Phép nhân đang ẩn": { vi: "Các card con của Phép nhân đang ẩn", en: "Multiplication sub-cards are hidden" },
  "Các card con của Tỷ lệ % đang ẩn": { vi: "Các card con của Tỷ lệ % đang ẩn", en: "Percentage sub-cards are hidden" },
  "Các mốc giây trên thanh Timer:": { vi: "Các mốc giây trên thanh Timer:", en: "Timer bar seconds (1–999s):" },
  "Cách A • Nhân 100 rồi trừ N": { vi: "Cách A • Nhân 100 rồi trừ N", en: "Method A • Append 00 & Subtract N" },
  "Cách B • Tách đầu & 2 số cuối": { vi: "Cách B • Tách đầu & 2 số cuối", en: "Method B • Split Head & Last 2 Digits" },
  "card": { vi: "card", en: "cards" },
  "Căn bậc 2": { vi: "Căn bậc 2", en: "Square Root" },
  "Căn bậc 2 — Challenge": { vi: "Căn bậc 2 — Challenge", en: "Square Root — Challenge" },
  "Căn bậc 2 — Difficult Level Challenge": { vi: "Căn bậc 2 — Difficult Level Challenge", en: "Square Root — Difficult Level Challenge" },
  "Căn bậc 2 — Luyện tập": { vi: "Căn bậc 2 — Luyện tập", en: "Square Root — Practice" },
  "Căn bậc 2 — Thử thách": { vi: "Căn bậc 2 — Thử thách", en: "Square Root — Challenge" },
  "Căn bậc 2 — Thử thách khó": { vi: "Căn bậc 2 — Thử thách khó", en: "Square Root — Difficult Challenge" },
  "Cần ít nhất 1 mốc thời gian": { vi: "Cần ít nhất 1 mốc thời gian", en: "Keep at least 1 option" },
  "Cần luyện thêm": { vi: "Cần luyện thêm", en: "Keep practicing" },
  "Cấp độ Khó": { vi: "Cấp độ Khó", en: "Hard Level" },
  "Cấp độ khó: Cộng · Trừ · Nhân · Chia · Căn · Lũy thừa · % tốc độ cao, ghi nhớ & phản xạ nhanh": { vi: "Cấp độ khó: Cộng · Trừ · Nhân · Chia · Căn · Lũy thừa · % tốc độ cao, ghi nhớ & phản xạ nhanh", en: "Hard level: multi-op reflex, memorize & recall under rapid timer" },
  "Cấp độ khó: cơ số và số mũ lớn hơn, phản xạ tốc độ cao": { vi: "Cấp độ khó: cơ số và số mũ lớn hơn, phản xạ tốc độ cao", en: "Hard level: larger bases and higher exponents, faster timer" },
  "Cấp độ khó: nhiều chữ số hơn, nhớ liên tục, phản xạ tốc độ cao": { vi: "Cấp độ khó: nhiều chữ số hơn, nhớ liên tục, phản xạ tốc độ cao", en: "Hard mode: more digits, frequent carries, faster pace" },
  "Cấp độ khó: số bị chia và số chia lớn hơn, phản xạ tốc độ cao": { vi: "Cấp độ khó: số bị chia và số chia lớn hơn, phản xạ tốc độ cao", en: "Hard level: larger dividends and divisors, faster countdown" },
  "Cấp độ khó: số chính phương lớn hơn, ước lượng & chốt đuôi nhanh": { vi: "Cấp độ khó: số chính phương lớn hơn, ước lượng & chốt đuôi nhanh", en: "Hard level: larger perfect squares, faster estimation" },
  "Cấp độ khó: số hạng nhiều chữ số, nhiều lần nhớ, phản xạ nhanh": { vi: "Cấp độ khó: số hạng nhiều chữ số, nhiều lần nhớ, phản xạ nhanh", en: "Hard level: larger multi-digit addends, heavier carries, faster timer" },
  "Cấp độ khó: số lớn hơn, mượn nhiều hàng, phản xạ nhanh": { vi: "Cấp độ khó: số lớn hơn, mượn nhiều hàng, phản xạ nhanh", en: "Hard level: larger numbers, heavier borrowing, faster timer" },
  "Cấp độ khó: số lớn hơn, nhớ nhiều hơn, phản xạ tốc độ cao": { vi: "Cấp độ khó: số lớn hơn, nhớ nhiều hơn, phản xạ tốc độ cao", en: "Hard mode: larger numbers, heavier carries, faster pace" },
  "Cấp độ khó: tỷ lệ % lẻ, số lớn hơn, tính nhẩm tốc độ cao": { vi: "Cấp độ khó: tỷ lệ % lẻ, số lớn hơn, tính nhẩm tốc độ cao", en: "Hard level: trickier percentages, larger base values, faster timer" },
  "Cấp độ:": { vi: "Cấp độ:", en: "Difficulty:" },
  "câu": { vi: "câu", en: "q" },
  "Cấu hình riêng trang này": { vi: "Cấu hình riêng trang này", en: "Custom per-page" },
  "Câu hỏi trên màn hình": { vi: "Câu hỏi trên màn hình", en: "Show full number sequence" },
  "Câu tiếp theo": { vi: "Câu tiếp theo", en: "Next Problem" },
  "Chạy từng dãy số của phép tính": { vi: "Chạy từng dãy số của phép tính", en: "Flash numbers sequentially" },
  "Chế độ thủ công: Sau khi có kết quả, giữ nguyên màn hình để bạn bấm \"Câu tiếp theo\" khi sẵn sàng.": { vi: "Chế độ thủ công: Sau khi có kết quả, giữ nguyên màn hình để bạn bấm \"Câu tiếp theo\" khi sẵn sàng.", en: "Manual mode: Stays on result until you click \"Next Problem\"." },
  "Chi tiết 10 phép nhân": { vi: "Chi tiết 10 phép nhân", en: "Problem Breakdown" },
  "Chi tiết 10 phép tính": { vi: "Chi tiết 10 phép tính", en: "Problem Breakdown" },
  "Chỉ tiêu:": { vi: "Chỉ tiêu:", en: "Goal:" },
  "Chia cho:": { vi: "Chia cho:", en: "Divide by:" },
  "Chia với số tùy chọn:": { vi: "Chia với số tùy chọn:", en: "Custom divisor:" },
  "Chỉnh chi tiết từng card (bao gồm card con) hoặc bật/tắt hàng loạt theo Tab.": { vi: "Chỉnh chi tiết từng card (bao gồm card con) hoặc bật/tắt hàng loạt theo Tab.", en: "Configure individual cards (including sub-cards) or bulk toggle per Tab." },
  "Chỉnh sửa Timer": { vi: "Chỉnh sửa Timer", en: "Edit Timer" },
  "Chỉnh sửa Timer — Mental Math": { vi: "Chỉnh sửa Timer — Mental Math", en: "Edit Timer — Mental Math" },
  "Chỉnh sửa Timer (Trang này / Toàn Tab)": { vi: "Chỉnh sửa Timer (Trang này / Toàn Tab)", en: "Edit Timer (This Page / All Tab)" },
  "Chỉnh sửa Timer cho toàn Tab Mental Math hoặc riêng lẻ từng page": { vi: "Chỉnh sửa Timer cho toàn Tab Mental Math hoặc riêng lẻ từng page", en: "Edit Timer for all Mental Math pages or individually per page" },
  "Chỉnh sửa Timer toàn Tab hoặc từng Page": { vi: "Chỉnh sửa Timer toàn Tab hoặc từng Page", en: "Edit Timer globally or per page" },
  "Chỉnh theo Page": { vi: "Chỉnh theo Page", en: "Per Individual Page" },
  "Chỉnh toàn bộ": { vi: "Chỉnh toàn bộ", en: "Global (All Pages)" },
  "Chính xác:": { vi: "Chính xác:", en: "Accuracy:" },
  "Chọn bài luyện tập theo yêu cầu:": { vi: "Chọn bài luyện tập theo yêu cầu:", en: "Select training topic:" },
  "Chọn chế độ phản xạ hàng ngày:": { vi: "Chọn chế độ phản xạ hàng ngày:", en: "Select daily reflex mode:" },
  "Chọn chuyên đề thử thách:": { vi: "Chọn chuyên đề thử thách:", en: "Select challenge topic:" },
  "Chọn lại": { vi: "Chọn lại", en: "Reset" },
  "Chọn một trong 7 phép toán ở trên để bắt đầu": { vi: "Chọn một trong 7 phép toán ở trên để bắt đầu", en: "Select one of the 7 operations above to start" },
  "Chọn Page cần tùy chỉnh:": { vi: "Chọn Page cần tùy chỉnh:", en: "Select page:" },
  "Chọn phép toán và số chữ số để tạo 9 ô phản xạ nhanh:": { vi: "Chọn phép toán và số chữ số để tạo 9 ô phản xạ nhanh:", en: "Select operation & digits to generate 9 quick-reflex boxes:" },
  "Chọn sau bao nhiêu giây sẽ chuyển qua câu hỏi khác (Toàn bộ hoặc từng Page)": { vi: "Chọn sau bao nhiêu giây sẽ chuyển qua câu hỏi khác (Toàn bộ hoặc từng Page)", en: "Configure delay in seconds before advancing to the next question" },
  "Chọn trang áp dụng:": { vi: "Chọn trang áp dụng:", en: "Select Challenge page:" },
  "Chơi lại": { vi: "Chơi lại", en: "Try Again" },
  "Chơi Lại": { vi: "Chơi Lại", en: "Play Again" },
  "Chơi lượt mới": { vi: "Chơi lượt mới", en: "Play Again" },
  "Chủ Đề (Subject)": { vi: "Chủ Đề (Subject)", en: "Subject" },
  "Chuỗi đúng": { vi: "Chuỗi đúng", en: "Streak" },
  "Chuỗi đúng:": { vi: "Chuỗi đúng:", en: "Streak:" },
  "Chuỗi ngày:": { vi: "Chuỗi ngày:", en: "Daily streak:" },
  "Chuỗi sai:": { vi: "Chuỗi sai:", en: "Wrong Streak:" },
  "Chuyển sang English": { vi: "Chuyển sang English", en: "Switch to Tiếng Việt" },
  "Chữ số %": { vi: "Chữ số %", en: "% Digits" },
  "Chữ số kết quả": { vi: "Chữ số kết quả", en: "Root Digits" },
  "Chưa bắt đầu thử thách": { vi: "Chưa bắt đầu thử thách", en: "Challenge Not Started" },
  "Chưa cấp quyền Micro. Vui lòng cho phép truy cập Micro trên trình duyệt.": { vi: "Chưa cấp quyền Micro. Vui lòng cho phép truy cập Micro trên trình duyệt.", en: "Microphone permission denied. Please allow microphone access." },
  "Chưa cấp quyền Micro. Vui lòng click icon ổ khóa trên thanh địa chỉ để Cho phép Micro.": { vi: "Chưa cấp quyền Micro. Vui lòng click icon ổ khóa trên thanh địa chỉ để Cho phép Micro.", en: "Microphone permission denied. Please allow microphone access." },
  "Có màu nền → Chọn MÀU bên cạnh bảng • Không nền → Bấm hoặc nói SỐ": { vi: "Có màu nền → Chọn MÀU bên cạnh bảng • Không nền → Bấm hoặc nói SỐ", en: "Colored bg → Tap COLOR beside grid • No bg → Tap or speak NUMBER" },
  "con": { vi: "con", en: "sub" },
  "cộng": { vi: "cộng", en: "plus" },
  "Công thức nhẩm nhanh": { vi: "Công thức nhẩm nhanh", en: "Mental Formula" },
  "Cộng với số tùy chọn:": { vi: "Cộng với số tùy chọn:", en: "Custom addend:" },
  "Download PDF": { vi: "Tải PDF", en: "Download PDF" },
  "Dãy số:": { vi: "Dãy số:", en: "Numbers:" },
  "Dừng": { vi: "Dừng", en: "Stop" },
  "Đã áp dụng cấu hình Timer cho toàn Tab Mental Math!": { vi: "Đã áp dụng cấu hình Timer cho toàn Tab Mental Math!", en: "Timer settings saved for all Mental Math Challenge pages!" },
  "Đã chép!": { vi: "Đã chép!", en: "Copied!" },
  "Đã hết thời gian quan sát": { vi: "Đã hết thời gian quan sát", en: "Observation time ended" },
  "Đã hiểu phương pháp? Hãy tham gia Thử Thách Nhân 1 Chữ Số hoặc quay về Luyện tập!": { vi: "Đã hiểu phương pháp? Hãy tham gia Thử Thách Nhân 1 Chữ Số hoặc quay về Luyện tập!", en: "Ready to practice? Jump into the 1-Digit Blitz Challenge or Training page!" },
  "Đã kết nối lại Internet thành công.": { vi: "Đã kết nối lại Internet thành công.", en: "Back Online — Internet connection restored." },
  "Đã khôi phục cấu hình trang này!": { vi: "Đã khôi phục cấu hình trang này!", en: "Reset this page to inherited setting!" },
  "Đã khôi phục cấu hình trang này! [Timer]": { vi: "Đã khôi phục cấu hình trang này!", en: "Reset this page to inherited Timer!" },
  "Đã khôi phục mặc định hệ thống!": { vi: "Đã khôi phục mặc định hệ thống!", en: "Reset global auto-switch settings to defaults!" },
  "Đã khôi phục Timer mặc định toàn Tab!": { vi: "Đã khôi phục Timer mặc định toàn Tab!", en: "Reset global Timer to defaults!" },
  "Đã nắm vững bí quyết nhân 11? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Nhân 11 2s - 12s.": { vi: "Đã nắm vững bí quyết nhân 11? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Nhân 11 2s - 12s.", en: "Mastered the shortcut? Return to Practice or take the 2s - 12s speed blitz challenge." },
  "Đã nắm vững bí quyết nhân 99? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Nhân 99 2s - 12s.": { vi: "Đã nắm vững bí quyết nhân 99? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Nhân 99 2s - 12s.", en: "Mastered the shortcut? Return to Practice or take the 2s - 12s speed blitz challenge." },
  "Đã nắm vững phương pháp? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Tính Nhẩm 2s - 12s.": { vi: "Đã nắm vững phương pháp? Hãy quay lại chế độ Luyện tập hoặc tham gia Thử Thách Tính Nhẩm 2s - 12s.", en: "Ready to test your speed? Return to Training mode or challenge yourself with 2s - 12s blitz." },
  "Đã sao chép!": { vi: "Đã sao chép!", en: "Copied!" },
  "Đang ẩn": { vi: "Đang ẩn", en: "Hidden" },
  "Đang bật loa đọc đáp án": { vi: "Đang bật loa đọc đáp án", en: "Speaker ON" },
  "Đang bật thông báo kết quả (Bấm để tắt)": { vi: "Đang bật thông báo kết quả (Bấm để tắt)", en: "Voice result announcement ON (Click to mute)" },
  "Đang bật thông báo kết quả bằng giọng nói (Bấm để tắt)": { vi: "Đang bật thông báo kết quả bằng giọng nói (Bấm để tắt)", en: "Voice result announcement ON (Click to mute)" },
  "Đang hiện": { vi: "Đang hiện", en: "Shown" },
  "Đang hiện:": { vi: "Đang hiện:", en: "Visible:" },
  "Đang lắng nghe: Hãy đọc to đáp án cho từng ô": { vi: "Đang lắng nghe: Hãy đọc to đáp án cho từng ô", en: "Listening: Speak the answer for each box" },
  "Đang mở Gmail...": { vi: "Đang mở Gmail...", en: "Opening Gmail..." },
  "Đang nghe": { vi: "Đang nghe", en: "Listening" },
  "Đang nghe giọng nói... (Bấm để dừng)": { vi: "Đang nghe giọng nói... (Bấm để dừng)", en: "Listening Voice... (Click to stop)" },
  "Đang nghe:": { vi: "Đang nghe:", en: "Heard:" },
  "Đang nghe...": { vi: "Đang nghe...", en: "Listening..." },
  "Đang nghe... Bấm để dừng": { vi: "Đang nghe... Bấm để dừng", en: "Listening... Click to stop" },
  "Đang nghe... Hãy đọc đáp án": { vi: "Đang nghe... Hãy đọc đáp án", en: "Listening... Speak answer" },
  "Đang nhận diện:": { vi: "Đang nhận diện:", en: "Detected:" },
  "Đang quay — Hãy ghi nhớ 3 vòng!": { vi: "Đang quay — Hãy ghi nhớ 3 vòng!", en: "Spinning — Memorize all 3 rings!" },
  "Đang tắt loa": { vi: "Đang tắt loa", en: "Speaker OFF" },
  "Đang tắt thông báo giọng nói (Bấm để bật)": { vi: "Đang tắt thông báo giọng nói (Bấm để bật)", en: "Voice result announcement OFF (Click to enable)" },
  "Đang tắt thông báo kết quả (Bấm để bật)": { vi: "Đang tắt thông báo kết quả (Bấm để bật)", en: "Voice result announcement OFF (Click to enable)" },
  "Đặt lại": { vi: "Đặt lại", en: "Reset" },
  "Đặt lại 100%": { vi: "Đặt lại 100%", en: "Reset 100%" },
  "Đặt lại mặc định": { vi: "Đặt lại mặc định", en: "Reset Default" },
  "Đến số": { vi: "Đến số", en: "To" },
  "Điểm số": { vi: "Điểm số", en: "Score" },
  "Đọc số cần tìm": { vi: "Đọc số cần tìm", en: "Speak target number" },
  "Đọc thẳng từ trái sang phải!": { vi: "Đọc thẳng từ trái sang phải!", en: "Read straight left to right!" },
  "Đóng": { vi: "Đóng", en: "Close" },
  "Đóng (Esc)": { vi: "Đóng (Esc)", en: "Close (Esc)" },
  "Đóng [Hủy]": { vi: "Đóng", en: "Cancel" },
  "Độ dài chữ số": { vi: "Độ dài chữ số", en: "Digit Length" },
  "Độ dài chữ số (1 - 100)": { vi: "Độ dài chữ số (1 - 100)", en: "Digit length (1 - 100)" },
  "Độ dài chữ số của số nhân (1 - 100)": { vi: "Độ dài chữ số của số nhân (1 - 100)", en: "Multiplier digit length (1 - 100)" },
  "Độ dài chữ số:": { vi: "Độ dài chữ số:", en: "Digit length:" },
  "Độ dài Chữ số:": { vi: "Độ dài Chữ số:", en: "Digit length:" },
  "Độ dài Cơ số:": { vi: "Độ dài Cơ số:", en: "Base digits:" },
  "Độ dài Số gốc:": { vi: "Độ dài Số gốc:", en: "Base digits:" },
  "Đổi câu hỏi": { vi: "Đổi câu hỏi", en: "Auto-Next" },
  "Đổi câu:": { vi: "Đổi câu:", en: "Next:" },
  "Đổi đề bài khác": { vi: "Đổi đề bài khác", en: "Skip problem" },
  "Đổi số mới & chạy lại đồng hồ": { vi: "Đổi số mới & chạy lại đồng hồ", en: "New number & reset timer" },
  "đúng": { vi: "đúng", en: "correct" },
  "Đúng": { vi: "Đúng", en: "Correct" },
  "Đúng / Tổng": { vi: "Đúng / Tổng", en: "Accuracy" },
  "Email Của Bạn (From)": { vi: "Email Của Bạn (From)", en: "Your Email (From)" },
  "Email Người Nhận (To)": { vi: "Email Người Nhận (To)", en: "Recipient Email (To)" },
  "Ghép kết quả:": { vi: "Ghép kết quả:", en: "Combine:" },
  "giây": { vi: "giây", en: "sec" },
  "Giới hạn:": { vi: "Giới hạn:", en: "Limit:" },
  "Gợi ý:": { vi: "Gợi ý:", en: "Method:" },
  "Gửi qua Gmail": { vi: "Gửi qua Gmail", en: "Send via Gmail" },
  "Guide": { vi: "Hướng dẫn", en: "Guide" },
  "Hành trình ký ức Loci": { vi: "Hành trình ký ức Loci", en: "Memory Palace" },
  "Hệ số căn tùy chọn:": { vi: "Hệ số căn tùy chọn:", en: "Custom root:" },
  "Hệ số tùy chỉnh": { vi: "Hệ số tùy chỉnh", en: "Custom factor" },
  "Hệ thống sẽ tạo 1 số gốc ngẫu nhiên (1, 2 hoặc 3 chữ số) cùng 9 ô trả lời (3×3) và bộ đếm thời gian giới hạn để bạn phản xạ bằng bàn phím hoặc giọng nói.": { vi: "Hệ thống sẽ tạo 1 số gốc ngẫu nhiên (1, 2 hoặc 3 chữ số) cùng 9 ô trả lời (3×3) và bộ đếm thời gian giới hạn để bạn phản xạ bằng bàn phím hoặc giọng nói.", en: "Generates a random starting number (1, 2, or 3 digits), 9 answer boxes (3×3), and a countdown timer with keypad and voice input." },
  "Hết giờ": { vi: "Hết giờ", en: "Timeout" },
  "Hết giờ [2 từ]": { vi: "Hết giờ", en: "Time out" },
  "Hết thời gian!": { vi: "Hết thời gian!", en: "Time expired!" },
  "Hiện con": { vi: "Hiện con", en: "Show sub" },
  "Hiện đáp án": { vi: "Hiện đáp án", en: "Show Answers" },
  "Hiện hết": { vi: "Hiện hết", en: "Show all" },
  "Hiện lại card con": { vi: "Hiện lại card con", en: "Show Sub-cards" },
  "Hiện lại tất cả": { vi: "Hiện lại tất cả", en: "Show All" },
  "Hiện tất cả Card": { vi: "Hiện tất cả Card", en: "Show All Cards" },
  "Hiện tất cả Tab này": { vi: "Hiện tất cả Tab này", en: "Show All in Tab" },
  "Hiển thị câu hỏi:": { vi: "Hiển thị câu hỏi:", en: "Question display:" },
  "Hoàn thành": { vi: "Hoàn thành", en: "Done" },
  "Hoàn Thành Bảng Schulte!": { vi: "Hoàn Thành Bảng Schulte!", en: "Schulte Table Completed!" },
  "Hoàn thành cả 9 ô!": { vi: "Hoàn thành cả 9 ô!", en: "All 9 boxes solved!" },
  "Hoàn Thành Lượt Thử Thách!": { vi: "Hoàn Thành Lượt Thử Thách!", en: "Challenge Completed!" },
  "Hoàn thành thử thách 10 câu!": { vi: "Hoàn thành thử thách 10 câu!", en: "10-Problem Challenge Completed!" },
  "Hoàn thành thử thách 10 phép nhân với 11!": { vi: "Hoàn thành thử thách 10 phép nhân với 11!", en: "10-Problem Multiply by 11 Challenge Completed!" },
  "Hoàn thành thử thách 10 phép nhân!": { vi: "Hoàn thành thử thách 10 phép nhân!", en: "10-Problem Challenge Completed!" },
  "Hoàn Thành Thử Thách Cấp Độ Khó!": { vi: "Hoàn Thành Thử Thách Cấp Độ Khó!", en: "Difficulty Challenge Completed!" },
  "Hoàn Thành Thử Thách Schulte!": { vi: "Hoàn Thành Thử Thách Schulte!", en: "Schulte Challenge Completed!" },
  "Hoàn thành:": { vi: "Hoàn thành:", en: "Passed:" },
  "Hướng dẫn": { vi: "Hướng dẫn", en: "Guide" },
  "Hướng Dẫn": { vi: "Hướng Dẫn", en: "Visual Guide" },
  "Hướng dẫn nhân với 1 chữ số chi tiết": { vi: "Hướng dẫn nhân với 1 chữ số chi tiết", en: "Multiply with 1-digit visual guide" },
  "Hướng Dẫn Nhân Với 99": { vi: "Hướng Dẫn Nhân Với 99", en: "Multiply by 99 Visual Guide" },
  "Hướng dẫn nhân với số 11 chi tiết": { vi: "Hướng dẫn nhân với số 11 chi tiết", en: "Multiply by 11 visual guide" },
  "Hướng dẫn phản xạ tính nhẩm hàng ngày": { vi: "Hướng dẫn phản xạ tính nhẩm hàng ngày", en: "Daily mental math reflex visual guide" },
  "Hướng dẫn phép chia chi tiết": { vi: "Hướng dẫn phép chia chi tiết", en: "Division visual guide" },
  "Hướng dẫn phép cộng chi tiết": { vi: "Hướng dẫn phép cộng chi tiết", en: "Addition visual guide" },
  "Hướng dẫn phép trừ chi tiết": { vi: "Hướng dẫn phép trừ chi tiết", en: "Subtraction visual guide" },
  "Hướng dẫn tính nhẩm căn bậc 2 chi tiết": { vi: "Hướng dẫn tính nhẩm căn bậc 2 chi tiết", en: "Square root mental math visual guide" },
  "Hướng dẫn tính nhẩm chi tiết": { vi: "Hướng dẫn tính nhẩm chi tiết", en: "Mental math visual guide" },
  "Hướng dẫn tính nhẩm lũy thừa chi tiết": { vi: "Hướng dẫn tính nhẩm lũy thừa chi tiết", en: "Exponent mental math visual guide" },
  "Hướng dẫn tính nhẩm phần trăm chi tiết": { vi: "Hướng dẫn tính nhẩm phần trăm chi tiết", en: "Percentage mental math visual guide" },
  "Hướng Dẫn Trực Quan": { vi: "Hướng Dẫn Trực Quan", en: "Visual Guide" },
  "Kết quả": { vi: "Kết quả", en: "Result" },
  "Kết Quả": { vi: "Kết Quả", en: "Answer" },
  "Kết quả [Đáp án]": { vi: "Kết quả", en: "Answer" },
  "Kết quả [Gửi]": { vi: "Kết quả", en: "Submit Answer" },
  "Kết quả:": { vi: "Kết quả:", en: "Result:" },
  "Kết quả: Bật": { vi: "Kết quả: Bật", en: "Result: ON" },
  "Kết quả: Tắt": { vi: "Kết quả: Tắt", en: "Result: OFF" },
  "Không nghe thấy tiếng nói. Bạn hãy bấm lại nút Voice và nói to rõ hơn.": { vi: "Không nghe thấy tiếng nói. Bạn hãy bấm lại nút Voice và nói to rõ hơn.", en: "No speech detected. Please click Voice and speak louder." },
  "Không thể kích hoạt Micro. Vui lòng kiểm tra quyền truy cập Micro trên trình duyệt.": { vi: "Không thể kích hoạt Micro. Vui lòng kiểm tra quyền truy cập Micro trên trình duyệt.", en: "Could not activate microphone. Please check your browser microphone permissions." },
  "Không tìm thấy thiết bị thu âm (Micro). Vui lòng kiểm tra Micro của bạn.": { vi: "Không tìm thấy thiết bị thu âm (Micro). Vui lòng kiểm tra Micro của bạn.", en: "No microphone found on your device. Please verify your microphone." },
  "Kiểm tra": { vi: "Kiểm tra", en: "Check" },
  "Kỷ lục": { vi: "Kỷ lục", en: "Best" },
  "Kỷ lục cá nhân mới!": { vi: "Kỷ lục cá nhân mới!", en: "New Personal Best!" },
  "Kỷ lục chuỗi": { vi: "Kỷ lục chuỗi", en: "Best" },
  "Làm lại từ đầu": { vi: "Làm lại từ đầu", en: "Reset Challenge" },
  "Lấy số ban đầu trừ đi 1": { vi: "Lấy số ban đầu trừ đi 1", en: "Subtract 1 from the number" },
  "Liên Hệ Chính Thức": { vi: "Liên Hệ Chính Thức", en: "Official Contact" },
  "Loa: Bật": { vi: "Loa: Bật", en: "Voice: ON" },
  "Loa: Tắt": { vi: "Loa: Tắt", en: "Voice: OFF" },
  "Lũy thừa": { vi: "Lũy thừa", en: "Exponents" },
  "Lũy thừa — Challenge": { vi: "Lũy thừa — Challenge", en: "Exponents — Challenge" },
  "Lũy thừa — Difficult Level Challenge": { vi: "Lũy thừa — Difficult Level Challenge", en: "Exponents — Difficult Level Challenge" },
  "Lũy thừa — Luyện tập": { vi: "Lũy thừa — Luyện tập", en: "Exponents — Practice" },
  "Lũy thừa — Thử thách": { vi: "Lũy thừa — Thử thách", en: "Exponents — Challenge" },
  "Lũy thừa — Thử thách khó": { vi: "Lũy thừa — Thử thách khó", en: "Exponents — Difficult Challenge" },
  "Luyện tập": { vi: "Luyện tập", en: "Training" },
  "Luyện tập (Practice)": { vi: "Luyện tập (Practice)", en: "Practice Pages" },
  "Luyện tập ngay →": { vi: "Luyện tập ngay →", en: "Start Training →" },
  "Luyện tập phản xạ mắt & tập trung": { vi: "Luyện tập phản xạ mắt & tập trung", en: "Visual focus & speed grid training" },
  "Luyện tập: Nhân với 1 chữ số": { vi: "Luyện tập: Nhân với 1 chữ số", en: "Training: Multiply by 1-Digit" },
  "Luyện tập: Nhân với số 11": { vi: "Luyện tập: Nhân với số 11", en: "Training: Multiply by 11" },
  "Luyện tập: Nhân với số 99": { vi: "Luyện tập: Nhân với số 99", en: "Training: Multiply by 99" },
  "Lưu trang này": { vi: "Lưu trang này", en: "Save Page" },
  "Lưu ý: Card cha đang ẩn nên các card con cũng không hiển thị ở màn hình chính.": { vi: "Lưu ý: Card cha đang ẩn nên các card con cũng không hiển thị ở màn hình chính.", en: "Note: Parent card is hidden, so sub-cards are hidden from the main screen." },
  "Mặc định": { vi: "Mặc định", en: "Reset" },
  "Mặc định hệ thống": { vi: "Mặc định hệ thống", en: "System default" },
  "Mẫu chọn nhanh:": { vi: "Mẫu chọn nhanh:", en: "Quick presets:" },
  "Mẫu có số 0 đầu": { vi: "Mẫu có số 0 đầu", en: "Leading-Zero Tail" },
  "Mẫu nhanh 1": { vi: "Mẫu nhanh 1", en: "Quick Case 1" },
  "Memory Palace": { vi: "Memory Palace", en: "Memory Palace" },
  "Mẹo: (9 − 6) = 3, (10 − 8) = 2": { vi: "Mẹo: (9 − 6) = 3, (10 − 8) = 2", en: "Tip: (9 − 6) = 3, (10 − 8) = 2" },
  "Mở rộng card con": { vi: "Mở rộng card con", en: "Expand sub-cards" },
  "Mở Rộng Siêu Tốc: N × 100 − N": { vi: "Mở Rộng Siêu Tốc: N × 100 − N", en: "Multi-Digit Extension: N × 100 − N" },
  "Mở trong Gmail (Open in Gmail)": { vi: "Mở trong Gmail (Open in Gmail)", en: "Open in Gmail" },
  "Mục tiêu hôm nay:": { vi: "Mục tiêu hôm nay:", en: "Today's Goal:" },
  "Nâng cao": { vi: "Nâng cao", en: "Hard" },
  "ngày": { vi: "ngày", en: "days" },
  "Nghe lại thông báo kết quả": { vi: "Nghe lại thông báo kết quả", en: "Replay voice announcement" },
  "Nhân 2 chữ số — Challenge": { vi: "Nhân 2 chữ số — Challenge", en: "2-Digit Multiplication — Challenge" },
  "Nhân 2 chữ số — Difficult Level Challenge": { vi: "Nhân 2 chữ số — Difficult Level Challenge", en: "2-Digit Multiplication — Difficult Level Challenge" },
  "Nhân 2 chữ số — Luyện tập": { vi: "Nhân 2 chữ số — Luyện tập", en: "2-Digit Multiplication — Practice" },
  "Nhân 2 chữ số — Thử thách": { vi: "Nhân 2 chữ số — Thử thách", en: "2-Digit Multiplication — Challenge" },
  "Nhân 2 chữ số — Thử thách khó": { vi: "Nhân 2 chữ số — Thử thách khó", en: "2-Digit Multiplication — Difficult Challenge" },
  "Nhân với 1 chữ số": { vi: "Nhân với 1 chữ số", en: "Multiply by 1-Digit" },
  "Nhân với 1 chữ số — Challenge": { vi: "Nhân với 1 chữ số — Challenge", en: "Multiply 1-Digit — Challenge" },
  "Nhân với 1 chữ số — Difficult Level Challenge": { vi: "Nhân với 1 chữ số — Difficult Level Challenge", en: "Multiply 1-Digit — Difficult Level Challenge" },
  "Nhân với 1 chữ số — Luyện tập": { vi: "Nhân với 1 chữ số — Luyện tập", en: "Multiply 1-Digit — Practice" },
  "Nhân với 1 chữ số — Thử thách": { vi: "Nhân với 1 chữ số — Thử thách", en: "Multiply 1-Digit — Challenge" },
  "Nhân với 1 chữ số — Thử thách khó": { vi: "Nhân với 1 chữ số — Thử thách khó", en: "Multiply 1-Digit — Difficult Challenge" },
  "Nhân với 1 chữ số [Thẻ]": { vi: "Nhân với 1 chữ số", en: "Multiply with 1 Digit" },
  "Nhân với 11 — Challenge": { vi: "Nhân với 11 — Challenge", en: "Multiply by 11 — Challenge" },
  "Nhân với 11 — Difficult Level Challenge": { vi: "Nhân với 11 — Difficult Level Challenge", en: "Multiply by 11 — Difficult Level Challenge" },
  "Nhân với 11 — Luyện tập": { vi: "Nhân với 11 — Luyện tập", en: "Multiply by 11 — Practice" },
  "Nhân với 11 — Thử thách": { vi: "Nhân với 11 — Thử thách", en: "Multiply by 11 — Challenge" },
  "Nhân với 11 — Thử thách khó": { vi: "Nhân với 11 — Thử thách khó", en: "Multiply by 11 — Difficult Challenge" },
  "Nhân với 99 — Challenge": { vi: "Nhân với 99 — Challenge", en: "Multiply by 99 — Challenge" },
  "Nhân với 99 — Difficult Level Challenge": { vi: "Nhân với 99 — Difficult Level Challenge", en: "Multiply by 99 — Difficult Level Challenge" },
  "Nhân với 99 — Luyện tập": { vi: "Nhân với 99 — Luyện tập", en: "Multiply by 99 — Practice" },
  "Nhân với 99 — Thử thách": { vi: "Nhân với 99 — Thử thách", en: "Multiply by 99 — Challenge" },
  "Nhân với 99 — Thử thách khó": { vi: "Nhân với 99 — Thử thách khó", en: "Multiply by 99 — Difficult Challenge" },
  "Nhân với số 11": { vi: "Nhân với số 11", en: "Multiply by 11" },
  "Nhân với số 99": { vi: "Nhân với số 99", en: "Multiply by 99" },
  "Nhân với số đích danh": { vi: "Nhân với số đích danh", en: "Exact custom multiplier" },
  "Nhân với số tùy chọn:": { vi: "Nhân với số tùy chọn:", en: "Custom multiplier:" },
  "Nhân với:": { vi: "Nhân với:", en: "Multiply by:" },
  "Nhập bằng phím số hoặc giọng nói...": { vi: "Nhập bằng phím số hoặc giọng nói...", en: "Tap keypad or speak answer..." },
  "Nhập bội số gốc của kết quả căn (VD: 1 = bất kỳ, 5 = chia hết cho 5...)": { vi: "Nhập bội số gốc của kết quả căn (VD: 1 = bất kỳ, 5 = chia hết cho 5...)", en: "Enter root factor (e.g. 1 = any, 5 = divisible by 5...)" },
  "Nhập các số vào Vòng 1, 2, 3!": { vi: "Nhập các số vào Vòng 1, 2, 3!", en: "Enter numbers for Rings 1, 2, 3!" },
  "Nhập chủ đề thư...": { vi: "Nhập chủ đề thư...", en: "Enter email subject..." },
  "Nhập đáp án bạn vừa ghi nhớ...": { vi: "Nhập đáp án bạn vừa ghi nhớ...", en: "Enter recalled answer..." },
  "Nhập độ dài chữ số (từ 1 đến 100)": { vi: "Nhập độ dài chữ số (từ 1 đến 100)", en: "Enter digit length (1 to 100)" },
  "Nhập độ dài chữ số của kết quả căn (từ 1 đến 50)": { vi: "Nhập độ dài chữ số của kết quả căn (từ 1 đến 50)", en: "Enter root digit length (1 to 50)" },
  "Nhập độ dài chữ số của số chia (từ 1 đến 100)": { vi: "Nhập độ dài chữ số của số chia (từ 1 đến 100)", en: "Enter divisor digit length (1 to 100)" },
  "Nhập độ dài chữ số của số cộng (từ 1 đến 100)": { vi: "Nhập độ dài chữ số của số cộng (từ 1 đến 100)", en: "Enter addend digit length (1 to 100)" },
  "Nhập độ dài chữ số của số mũ (1 hoặc 2)": { vi: "Nhập độ dài chữ số của số mũ (1 hoặc 2)", en: "Enter exponent digit length (1 or 2)" },
  "Nhập độ dài chữ số của số nhân (từ 1 đến 100)": { vi: "Nhập độ dài chữ số của số nhân (từ 1 đến 100)", en: "Enter multiplier digit length (1 to 100)" },
  "Nhập độ dài chữ số của số trừ (từ 1 đến 100)": { vi: "Nhập độ dài chữ số của số trừ (từ 1 đến 100)", en: "Enter subtrahend digit length (1 to 100)" },
  "Nhập độ dài chữ số của tỷ lệ % (từ 1 đến 3)": { vi: "Nhập độ dài chữ số của tỷ lệ % (từ 1 đến 3)", en: "Enter percentage digit length (1 to 3)" },
  "Nhập kết quả hoặc bấm phím số bên dưới...": { vi: "Nhập kết quả hoặc bấm phím số bên dưới...", en: "Type answer or tap numeric keys below..." },
  "Nhập kết quả hoặc bấm phím số...": { vi: "Nhập kết quả hoặc bấm phím số...", en: "Type answer or tap numeric keys..." },
  "Nhập nội dung câu hỏi, góp ý hoặc liên hệ của bạn tại đây...": { vi: "Nhập nội dung câu hỏi, góp ý hoặc liên hệ của bạn tại đây...", en: "Type your message, questions, or comments here..." },
  "Nhập số % (VD: 25)...": { vi: "Nhập số % (VD: 25)...", en: "Enter % number (e.g. 25)..." },
  "Nhập số chia đích danh tùy chọn (VD: 5, 12, 25, 99...)": { vi: "Nhập số chia đích danh tùy chọn (VD: 5, 12, 25, 99...)", en: "Enter exact custom divisor (e.g. 5, 12, 25, 99...)" },
  "Nhập số cộng đích danh tùy chọn (VD: 25, 99, 999...)": { vi: "Nhập số cộng đích danh tùy chọn (VD: 25, 99, 999...)", en: "Enter exact custom addend (e.g. 25, 99, 999...)" },
  "Nhập số giây để thêm (vd: 15 hoặc 3, 5, 9)...": { vi: "Nhập số giây để thêm (vd: 15 hoặc 3, 5, 9)...", en: "Add seconds (e.g. 15 or 3, 5, 9)..." },
  "Nhập số giây giới hạn (giây)": { vi: "Nhập số giây giới hạn (giây)", en: "Enter time limit in seconds" },
  "Nhập số giây trả lời (mặc định 10s)": { vi: "Nhập số giây trả lời (mặc định 10s)", en: "Enter answer time limit in seconds (default 10s)" },
  "Nhập số giây tùy ý (0.5 – 60):": { vi: "Nhập số giây tùy ý (0.5 – 60):", en: "Custom seconds (0.5 – 60):" },
  "Nhập số mũ đích danh tùy chọn (VD: 2, 3, 4... tối đa giới hạn kết quả 240 chữ số)": { vi: "Nhập số mũ đích danh tùy chọn (VD: 2, 3, 4... tối đa giới hạn kết quả 240 chữ số)", en: "Enter exact exponent (e.g. 2, 3, 4...)" },
  "Nhập số nhân đích danh tùy chọn (VD: 7, 11, 99, 125...)": { vi: "Nhập số nhân đích danh tùy chọn (VD: 7, 11, 99, 125...)", en: "Enter exact custom multiplier (e.g. 7, 11, 99, 125...)" },
  "Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 125...)": { vi: "Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 125...)", en: "Enter exact custom multiplier (e.g. 7, 12, 99, 125...)" },
  "Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 999...)": { vi: "Nhập số nhân đích danh tùy chọn (VD: 7, 12, 99, 999...)", en: "Enter exact custom multiplier (e.g. 7, 12, 99, 999...)" },
  "Nhập số trừ đích danh tùy chọn (VD: 19, 99, 125...)": { vi: "Nhập số trừ đích danh tùy chọn (VD: 19, 99, 125...)", en: "Enter exact custom subtrahend (e.g. 19, 99, 125...)" },
  "Nhập tỷ lệ phần trăm đích danh tùy chọn (VD: 15, 25, 125...)": { vi: "Nhập tỷ lệ phần trăm đích danh tùy chọn (VD: 15, 25, 125...)", en: "Enter exact percentage (e.g. 15, 25, 125...)" },
  "Nhìn vào tâm bảng và bấm hoặc dùng giọng nói đọc số tìm được": { vi: "Nhìn vào tâm bảng và bấm hoặc dùng giọng nói đọc số tìm được", en: "Fixate on the center and tap or use Voice to answer found numbers" },
  "Nhịp:": { vi: "Nhịp:", en: "Pace:" },
  "Nhóm 3 chuyên đề tỷ lệ %": { vi: "Nhóm 3 chuyên đề tỷ lệ %", en: "3 percentage modules" },
  "Nhóm 4 chuyên đề nhân nhanh": { vi: "Nhóm 4 chuyên đề nhân nhanh", en: "4 speed multiplication modules" },
  "Nội dung phần này hiện đang để trống và sẽ được thiết kế, bổ sung sau theo kế hoạch của bạn.": { vi: "Nội dung phần này hiện đang để trống và sẽ được thiết kế, bổ sung sau theo kế hoạch của bạn.", en: "This section is currently empty and will be designed and added later according to your plan." },
  "Nội Dung Thư": { vi: "Nội Dung Thư", en: "Message Content" },
  "Nội dung thư:": { vi: "Nội dung thư:", en: "Message Content:" },
  "Nộp bài & Kiểm tra": { vi: "Nộp bài & Kiểm tra", en: "Submit & Check" },
  "Phạm vi áp dụng toàn bộ:": { vi: "Phạm vi áp dụng toàn bộ:", en: "Apply globally to:" },
  "Phản hồi / Góp ý về MY BRAIN ACADEMY": { vi: "Phản hồi / Góp ý về MY BRAIN ACADEMY", en: "Inquiry / Feedback regarding MY BRAIN ACADEMY" },
  "Phản xạ hàng ngày": { vi: "Phản xạ hàng ngày", en: "Daily Reflex" },
  "Phản xạ hàng ngày — Challenge": { vi: "Phản xạ hàng ngày — Challenge", en: "Daily Mental Math Reflex — Challenge" },
  "Phản xạ hàng ngày — Difficult Level Challenge": { vi: "Phản xạ hàng ngày — Difficult Level Challenge", en: "Daily Mental Math Reflex — Difficult Level Challenge" },
  "Phản xạ hàng ngày — Luyện tập": { vi: "Phản xạ hàng ngày — Luyện tập", en: "Daily Mental Math Reflex — Practice" },
  "Phản xạ hàng ngày — Thử thách": { vi: "Phản xạ hàng ngày — Thử thách", en: "Daily Mental Math Reflex — Challenge" },
  "Phản xạ hàng ngày — Thử thách khó": { vi: "Phản xạ hàng ngày — Thử thách khó", en: "Daily Mental Math Reflex — Difficult Challenge" },
  "Phản xạ nhanh": { vi: "Phản xạ nhanh", en: "Quick Reflex" },
  "Phát âm câu hỏi": { vi: "Phát âm câu hỏi", en: "Pronounce question" },
  "Phép chia": { vi: "Phép chia", en: "Division" },
  "Phép chia — Challenge": { vi: "Phép chia — Challenge", en: "Division — Challenge" },
  "Phép chia — Difficult Level Challenge": { vi: "Phép chia — Difficult Level Challenge", en: "Division — Difficult Level Challenge" },
  "Phép chia — Luyện tập": { vi: "Phép chia — Luyện tập", en: "Division — Practice" },
  "Phép chia — Thử thách": { vi: "Phép chia — Thử thách", en: "Division — Challenge" },
  "Phép chia — Thử thách khó": { vi: "Phép chia — Thử thách khó", en: "Division — Difficult Challenge" },
  "Phép cộng": { vi: "Phép cộng", en: "Addition" },
  "Phép cộng — Challenge": { vi: "Phép cộng — Challenge", en: "Addition — Challenge" },
  "Phép cộng — Difficult Level Challenge": { vi: "Phép cộng — Difficult Level Challenge", en: "Addition — Difficult Level Challenge" },
  "Phép cộng — Luyện tập": { vi: "Phép cộng — Luyện tập", en: "Addition — Practice" },
  "Phép cộng — Thử thách": { vi: "Phép cộng — Thử thách", en: "Addition — Challenge" },
  "Phép cộng — Thử thách khó": { vi: "Phép cộng — Thử thách khó", en: "Addition — Difficult Challenge" },
  "Phép nhân": { vi: "Phép nhân", en: "Multiplication" },
  "Phép nhân 2 chữ số": { vi: "Phép nhân 2 chữ số", en: "2-Digit Multiplication" },
  "Phép tính +/-": { vi: "Phép tính +/-", en: "Operations +/-" },
  "Phép tính bật:": { vi: "Phép tính bật:", en: "Active ops:" },
  "Phép trừ": { vi: "Phép trừ", en: "Subtraction" },
  "Phép trừ — Challenge": { vi: "Phép trừ — Challenge", en: "Subtraction — Challenge" },
  "Phép trừ — Difficult Level Challenge": { vi: "Phép trừ — Difficult Level Challenge", en: "Subtraction — Difficult Level Challenge" },
  "Phép trừ — Luyện tập": { vi: "Phép trừ — Luyện tập", en: "Subtraction — Practice" },
  "Phép trừ — Thử thách": { vi: "Phép trừ — Thử thách", en: "Subtraction — Challenge" },
  "Phép trừ — Thử thách khó": { vi: "Phép trừ — Thử thách khó", en: "Subtraction — Difficult Challenge" },
  "Phóng to (+)": { vi: "Phóng to (+)", en: "Zoom In (+)" },
  "Phóng to ảnh": { vi: "Phóng to ảnh", en: "Zoom image" },
  "Phóng to toàn màn hình": { vi: "Phóng to toàn màn hình", en: "Fullscreen view" },
  "Quan sát": { vi: "Quan sát", en: "Observe" },
  "Quay lại": { vi: "Quay lại", en: "Back" },
  "Quay lại Luyện tập": { vi: "Quay lại Luyện tập", en: "Back to Practice" },
  "Quay lại Luyện tập [Hướng dẫn]": { vi: "Quay lại Luyện tập", en: "Back to Training" },
  "Quay lại Luyện tập Căn bậc 2": { vi: "Quay lại Luyện tập Căn bậc 2", en: "Back to Square Root Practice" },
  "Quay lại Luyện tập Lũy thừa": { vi: "Quay lại Luyện tập Lũy thừa", en: "Back to Exponents Practice" },
  "Quay lại Luyện tập Nhân 1 chữ số": { vi: "Quay lại Luyện tập Nhân 1 chữ số", en: "Back to Practice" },
  "Quay lại Luyện tập Nhân 11": { vi: "Quay lại Luyện tập Nhân 11", en: "Back to Practice" },
  "Quay lại Luyện tập Nhân 99": { vi: "Quay lại Luyện tập Nhân 99", en: "Back to Practice" },
  "Quay lại Luyện tập Phản xạ hàng ngày": { vi: "Quay lại Luyện tập Phản xạ hàng ngày", en: "Back to Daily Reflex Practice" },
  "Quay lại Luyện tập Phép chia": { vi: "Quay lại Luyện tập Phép chia", en: "Back to Division Practice" },
  "Quay lại Luyện tập Phép cộng": { vi: "Quay lại Luyện tập Phép cộng", en: "Back to Addition Practice" },
  "Quay lại Luyện tập Phép trừ": { vi: "Quay lại Luyện tập Phép trừ", en: "Back to Subtraction Practice" },
  "Quay về trang Luyện tập (Training)": { vi: "Quay về trang Luyện tập (Training)", en: "Back to Training page" },
  "Quay về trang Luyện tập Nhân với 11": { vi: "Quay về trang Luyện tập Nhân với 11", en: "Back to Multiply by 11 Practice" },
  "Quay về trang Luyện tập Nhân với 99": { vi: "Quay về trang Luyện tập Nhân với 99", en: "Back to Multiply by 99 Practice" },
  "Quy tắc 1 • Số 2 chữ số × 99": { vi: "Quy tắc 1 • Số 2 chữ số × 99", en: "Rule 1 • 2-Digit Number × 99" },
  "Quy tắc 2 • Số 3 đến 10 chữ số × 99": { vi: "Quy tắc 2 • Số 3 đến 10 chữ số × 99", en: "Rule 2 • 3 to 10-Digit × 99" },
  "Quyền Micro bị chặn. Vui lòng cấp quyền để trả lời bằng giọng nói.": { vi: "Quyền Micro bị chặn. Vui lòng cấp quyền để trả lời bằng giọng nói.", en: "Microphone blocked. Please allow access." },
  "Quyền Micro bị từ chối. Vui lòng bấm vào biểu tượng Micro/Ổ khóa trên thanh địa chỉ trình duyệt để Bật Micro (Allow).": { vi: "Quyền Micro bị từ chối. Vui lòng bấm vào biểu tượng Micro/Ổ khóa trên thanh địa chỉ trình duyệt để Bật Micro (Allow).", en: "Microphone access denied. Please click the lock or mic icon in the browser address bar to Allow." },
  "Rèn luyện não bộ": { vi: "Rèn luyện não bộ", en: "Brain Training" },
  "Rèn luyện phản xạ tính nhẩm hàng ngày": { vi: "Rèn luyện phản xạ tính nhẩm hàng ngày", en: "Daily Mental Math Reflex" },
  "Riêng lẻ từng Page": { vi: "Riêng lẻ từng Page", en: "Per Individual Page" },
  "Sai": { vi: "Sai", en: "Incorrect" },
  "Sao chép nháp": { vi: "Sao chép nháp", en: "Copy Draft" },
  "Sao chép nội dung": { vi: "Sao chép nội dung", en: "Copy Draft Text" },
  "Sao chép toàn bộ bản nháp": { vi: "Sao chép toàn bộ bản nháp", en: "Copy entire email draft to clipboard" },
  "Sau bao nhiêu giây đổi qua câu hỏi khác:": { vi: "Sau bao nhiêu giây đổi qua câu hỏi khác:", en: "Switch to next question after (seconds):" },
  "Sẵn sàng": { vi: "Sẵn sàng", en: "Ready" },
  "Sẵn Sàng Gửi Qua Gmail!": { vi: "Sẵn Sàng Gửi Qua Gmail!", en: "Gmail Composer Ready!" },
  "Sẵn sàng tính giờ 9 ô": { vi: "Sẵn sàng tính giờ 9 ô", en: "Ready for 9-box timer" },
  "Soạn thư khác": { vi: "Soạn thư khác", en: "Send another" },
  "số": { vi: "số", en: "num" },
  "số [Số nhiều]": { vi: "số", en: "nums" },
  "Số % đích danh": { vi: "Số % đích danh", en: "Exact %" },
  "Số cần tìm": { vi: "Số cần tìm", en: "Target" },
  "Số cần tìm:": { vi: "Số cần tìm:", en: "Target:" },
  "Số đích danh": { vi: "Số đích danh", en: "Exact Number" },
  "Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)": { vi: "Số lượng số trong dãy (từ 2 đến 100, giống các cuộc thi Siêu trí tuệ)", en: "Count of numbers in sequence (2 to 100)" },
  "Số mới": { vi: "Số mới", en: "New Number" },
  "Số mũ tùy chọn:": { vi: "Số mũ tùy chọn:", en: "Custom exponent:" },
  "Số mũ:": { vi: "Số mũ:", en: "Power:" },
  "Số tròn chục": { vi: "Số tròn chục", en: "Round Tens" },
  "Tải Guide": { vi: "Tải Guide", en: "Download Guide" },
  "Tải hướng dẫn định dạng PDF": { vi: "Tải hướng dẫn định dạng PDF", en: "Download Guide (PDF)" },
  "Tải PDF": { vi: "Tải PDF", en: "PDF" },
  "Tăng / Giảm %": { vi: "Tăng / Giảm %", en: "% Increase & Decrease" },
  "Tăng +% nối tiếp": { vi: "Tăng +% nối tiếp", en: "Compound +%" },
  "Tâm điểm": { vi: "Tâm điểm", en: "Center Dot" },
  "Tắt": { vi: "Tắt", en: "Off" },
  "Tất cả Card trong Tab này đang ẩn": { vi: "Tất cả Card trong Tab này đang ẩn", en: "All Cards in this Tab are Hidden" },
  "Tất cả Tab": { vi: "Tất cả Tab", en: "All Tabs" },
  "Thay đổi được tự động lưu và áp dụng ngay lập tức.": { vi: "Thay đổi được tự động lưu và áp dụng ngay lập tức.", en: "Changes are saved and applied immediately." },
  "Thẻ Hành trình ký ức Loci": { vi: "Thẻ Hành trình ký ức Loci", en: "Memory Palace card" },
  "Theo cấu hình toàn bộ": { vi: "Theo cấu hình toàn bộ", en: "Inherited from global" },
  "Theo cấu hình toàn Tab": { vi: "Theo cấu hình toàn Tab", en: "Inherited from Tab" },
  "Thêm": { vi: "Thêm", en: "Add" },
  "Thiết lập lại thử thách": { vi: "Thiết lập lại thử thách", en: "Reset challenge" },
  "Thời gian": { vi: "Thời gian", en: "Time" },
  "Thời gian giới hạn (giây)": { vi: "Thời gian giới hạn (giây)", en: "Limit (seconds)" },
  "Thời gian mặc định khi mở trang (Xem trước thanh Timer):": { vi: "Thời gian mặc định khi mở trang (Xem trước thanh Timer):", en: "Default selected Timer (Live preview):" },
  "Thời gian trả lời (giây)": { vi: "Thời gian trả lời (giây)", en: "Answer time limit (seconds)" },
  "Thời gian:": { vi: "Thời gian:", en: "Timer:" },
  "Thời gian: [Giới hạn]": { vi: "Thời gian:", en: "Limit:" },
  "Thủ công": { vi: "Thủ công", en: "Manual" },
  "Thủ công (Không tự chuyển)": { vi: "Thủ công (Không tự chuyển)", en: "Manual (No Auto)" },
  "Thu gọn card con": { vi: "Thu gọn card con", en: "Collapse sub-cards" },
  "Thu nhỏ (-)": { vi: "Thu nhỏ (-)", en: "Zoom Out (-)" },
  "Thử lại": { vi: "Thử lại", en: "Retry" },
  "Thử thách": { vi: "Thử thách", en: "Challenge" },
  "Thử thách (Challenge)": { vi: "Thử thách (Challenge)", en: "Challenge Pages" },
  "Thử Thách Bảng Schulte": { vi: "Thử Thách Bảng Schulte", en: "Schulte Table Challenge" },
  "Thử Thách Căn Bậc 2": { vi: "Thử Thách Căn Bậc 2", en: "Square Root Challenge" },
  "Thử thách cấp độ khó": { vi: "Thử thách cấp độ khó", en: "Difficult Level Challenge" },
  "Thử Thách Cấp Độ Khó": { vi: "Thử Thách Cấp Độ Khó", en: "Difficult Level Challenge" },
  "Thử Thách Cấp Độ Khó — Bảng Schulte": { vi: "Thử Thách Cấp Độ Khó — Bảng Schulte", en: "Schulte Table — Difficulty Level Challenge" },
  "Thử thách cấp độ khó (Difficult Challenge)": { vi: "Thử thách cấp độ khó (Difficult Challenge)", en: "Difficult Level Challenge" },
  "Thử Thách Cấp Độ Khó [Schulte]": { vi: "Thử Thách Cấp Độ Khó", en: "Difficulty Level Challenge" },
  "Thử thách cấp độ khó Bảng Schulte": { vi: "Thử thách cấp độ khó Bảng Schulte", en: "Schulte Table Difficulty Level Challenge" },
  "Thử Thách Lại": { vi: "Thử Thách Lại", en: "Try Again" },
  "Thử Thách Lũy Thừa": { vi: "Thử Thách Lũy Thừa", en: "Exponents Challenge" },
  "Thử Thách Nhân 1 Chữ Số": { vi: "Thử Thách Nhân 1 Chữ Số", en: "1-Digit Challenge" },
  "Thử thách Nhân 1 chữ số (2s - 12s)": { vi: "Thử thách Nhân 1 chữ số (2s - 12s)", en: "1-Digit Challenge (2s - 12s)" },
  "Thử thách nhân 1 chữ số từ 2s đến 12s": { vi: "Thử thách nhân 1 chữ số từ 2s đến 12s", en: "Multiply 1-digit challenge in 2s to 12s" },
  "Thử Thách Nhân 11": { vi: "Thử Thách Nhân 11", en: "Multiply by 11 Challenge" },
  "Thử thách Nhân 11 (2s - 12s)": { vi: "Thử thách Nhân 11 (2s - 12s)", en: "Multiply by 11 Challenge (2s - 12s)" },
  "Thử Thách Nhân 11 [Ngắn]": { vi: "Thử Thách Nhân 11", en: "Multiply 11 Challenge" },
  "Thử thách nhân 11 từ 2s đến 12s": { vi: "Thử thách nhân 11 từ 2s đến 12s", en: "Multiply 11 Challenge in 2s to 12s" },
  "Thử Thách Nhân 99": { vi: "Thử Thách Nhân 99", en: "Multiply by 99 Challenge" },
  "Thử thách Nhân 99 (2s - 12s)": { vi: "Thử thách Nhân 99 (2s - 12s)", en: "Multiply by 99 Challenge (2s - 12s)" },
  "Thử Thách Nhân 99 [Ngắn]": { vi: "Thử Thách Nhân 99", en: "Multiply 99 Challenge" },
  "Thử Thách Nhân Với 1 Chữ Số": { vi: "Thử Thách Nhân Với 1 Chữ Số", en: "1-Digit Multiplication Challenge" },
  "Thử thách Nhân với 1 chữ số (2s - 12s)": { vi: "Thử thách Nhân với 1 chữ số (2s - 12s)", en: "Multiply by 1-Digit Challenge (2s - 12s)" },
  "Thử thách Nhân với 11 (2s - 12s)": { vi: "Thử thách Nhân với 11 (2s - 12s)", en: "Multiply by 11 Challenge (2s - 12s)" },
  "Thử Thách Nhân Với Số 11": { vi: "Thử Thách Nhân Với Số 11", en: "Multiply by 11 Challenge" },
  "Thử Thách Nhân Với Số 99": { vi: "Thử Thách Nhân Với Số 99", en: "Multiply by 99 Challenge" },
  "Thử Thách Phản Xạ": { vi: "Thử Thách Phản Xạ", en: "Daily Reflex Challenge" },
  "Thử Thách Phản Xạ Hàng Ngày": { vi: "Thử Thách Phản Xạ Hàng Ngày", en: "Daily Reflex Challenge" },
  "Thử thách phản xạ tính nhẩm siêu tốc nhân với 11 từ 2s đến 12s": { vi: "Thử thách phản xạ tính nhẩm siêu tốc nhân với 11 từ 2s đến 12s", en: "Speed mental calculation challenge multiplying by 11 within 2s to 12s" },
  "Thử thách phản xạ tính nhẩm siêu tốc nhân với 99 từ 2s đến 12s": { vi: "Thử thách phản xạ tính nhẩm siêu tốc nhân với 99 từ 2s đến 12s", en: "Speed mental calculation challenge multiplying by 99 within 2s to 12s" },
  "Thử thách phản xạ tính nhẩm siêu tốc từ 2s đến 12s": { vi: "Thử thách phản xạ tính nhẩm siêu tốc từ 2s đến 12s", en: "Speed mental calculation challenge within 2s to 12s" },
  "Thử Thách Phép Chia": { vi: "Thử Thách Phép Chia", en: "Division Challenge" },
  "Thử Thách Phép Cộng": { vi: "Thử Thách Phép Cộng", en: "Addition Challenge" },
  "Thử Thách Phép Trừ": { vi: "Thử Thách Phép Trừ", en: "Subtraction Challenge" },
  "Thử Thách Siêu Tốc": { vi: "Thử Thách Siêu Tốc", en: "Speed Challenge" },
  "Thử Thách Tính Nhẩm": { vi: "Thử Thách Tính Nhẩm", en: "Mental Math Challenge" },
  "Thử thách Tính nhẩm (2s - 12s)": { vi: "Thử thách Tính nhẩm (2s - 12s)", en: "Mental Math Challenge (2s - 12s)" },
  "Thử thách tính nhẩm tốc độ cao": { vi: "Thử thách tính nhẩm tốc độ cao", en: "Mental Math Challenge" },
  "Thử thách tính nhẩm từ 2s đến 12s": { vi: "Thử thách tính nhẩm từ 2s đến 12s", en: "Mental Math Challenge in 2s to 12s" },
  "Thử Thách Tốc Độ": { vi: "Thử Thách Tốc Độ", en: "Speed Challenge" },
  "Thử thách tốc độ Bảng Schulte": { vi: "Thử thách tốc độ Bảng Schulte", en: "Schulte Table Speed Challenge" },
  "Thử Thách Tỷ Lệ %": { vi: "Thử Thách Tỷ Lệ %", en: "Percentage Challenge" },
  "Tiến độ / Lỗi": { vi: "Tiến độ / Lỗi", en: "Progress / Err" },
  "Tiến trình thử thách": { vi: "Tiến trình thử thách", en: "Challenge Progress" },
  "Tiêu chuẩn": { vi: "Tiêu chuẩn", en: "Standard" },
  "Tím": { vi: "Tím", en: "Purple" },
  "Tìm tỷ lệ & Số gốc": { vi: "Tìm tỷ lệ & Số gốc", en: "Find Rate & Whole" },
  "Tính % của một số": { vi: "Tính % của một số", en: "% of a Number" },
  "Tính nhẩm": { vi: "Tính nhẩm", en: "Mental Math" },
  "Tính Nhẩm": { vi: "Tính Nhẩm", en: "Mental Math" },
  "Tọa độ": { vi: "Tọa độ", en: "Coordinates" },
  "Toàn Tab Mental Math": { vi: "Toàn Tab Mental Math", en: "All Mental Math" },
  "Tốc độ TB:": { vi: "Tốc độ TB:", en: "Avg pace:" },
  "Tốc độ:": { vi: "Tốc độ:", en: "Speed:" },
  "Trả lời": { vi: "Trả lời", en: "Answer" },
  "Trả lời ": { vi: "Trả lời ", en: "Voice" },
  "Trả lời [Giọng nói]": { vi: "Trả lời", en: "Voice" },
  "Trả lời bằng giọng nói": { vi: "Trả lời bằng giọng nói", en: "Answer by voice" },
  "Trả lời kết quả số tìm được bằng giọng nói": { vi: "Trả lời kết quả số tìm được bằng giọng nói", en: "Answer the found number by voice" },
  "Trả lời liên tiếp bằng giọng nói": { vi: "Trả lời liên tiếp bằng giọng nói", en: "Answer sequentially by voice" },
  "Trả lời ngay": { vi: "Trả lời ngay", en: "Answer Now" },
  "Trả lời:": { vi: "Trả lời:", en: "Answer:" },
  "Trình duyệt chưa cho phép quyền Micro. Bạn vui lòng bấm vào biểu tượng 🔒 hoặc 🎙️ trên thanh địa chỉ trình duyệt để Bật/Cho phép Micro (Allow).": { vi: "Trình duyệt chưa cho phép quyền Micro. Bạn vui lòng bấm vào biểu tượng 🔒 hoặc 🎙️ trên thanh địa chỉ trình duyệt để Bật/Cho phép Micro (Allow).", en: "Microphone permission denied. Please click the lock/microphone icon in the address bar and select Allow." },
  "Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.": { vi: "Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.", en: "Web Speech Recognition not supported in this browser." },
  "Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.": { vi: "Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.", en: "Voice recognition is not supported in this browser." },
  "Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.": { vi: "Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.", en: "Browser does not support Web Speech API. Please use Chrome or Edge." },
  "Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge.": { vi: "Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge.", en: "Browser does not support Web Speech API. Please use Chrome/Edge." },
  "Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge.": { vi: "Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge.", en: "Your browser does not support Web Speech Recognition. Please use Google Chrome or Microsoft Edge." },
  "Trống (Sẽ thiết kế sau)": { vi: "Trống (Sẽ thiết kế sau)", en: "Empty (Will be designed later)" },
  "trừ": { vi: "trừ", en: "minus" },
  "Trừ cho số tùy chọn:": { vi: "Trừ cho số tùy chọn:", en: "Custom subtrahend:" },
  "Tùy chỉnh các mốc giây & thời gian mặc định cho toàn Tab hoặc từng page": { vi: "Tùy chỉnh các mốc giây & thời gian mặc định cho toàn Tab hoặc từng page", en: "Customize timer presets & default seconds globally or per page" },
  "Tùy chỉnh chi tiết": { vi: "Tùy chỉnh chi tiết", en: "Customize Cards" },
  "Tùy chỉnh chi tiết [Ngắn]": { vi: "Tùy chỉnh chi tiết", en: "Customize" },
  "Tùy chỉnh chi tiết từng card con:": { vi: "Tùy chỉnh chi tiết từng card con:", en: "Customize individual sub-cards:" },
  "Tùy chỉnh đổi câu (Giây)": { vi: "Tùy chỉnh đổi câu (Giây)", en: "Auto-Switch Delay" },
  "Tùy chỉnh đổi câu hỏi — Mental Math": { vi: "Tùy chỉnh đổi câu hỏi — Mental Math", en: "Auto-Switch Question — Mental Math" },
  "Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)": { vi: "Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ hoặc từng Page)", en: "Customize auto-switch delay globally or per page" },
  "Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ Mental Math hoặc theo từng Page)": { vi: "Tùy chỉnh sau bao nhiêu giây đổi qua câu hỏi khác (Toàn bộ Mental Math hoặc theo từng Page)", en: "Customize auto-switch delay to next question (Globally or per Page)" },
  "Tùy chọn (Chữ số & Căn số)": { vi: "Tùy chọn (Chữ số & Căn số)", en: "Custom (Digits & Root)" },
  "Tùy chọn (Chữ số & Số chia)": { vi: "Tùy chọn (Chữ số & Số chia)", en: "Custom (Digits & Divisor)" },
  "Tùy chọn (Chữ số & Số cộng)": { vi: "Tùy chọn (Chữ số & Số cộng)", en: "Custom (Digits & Addend)" },
  "Tùy chọn (Chữ số & Số nhân)": { vi: "Tùy chọn (Chữ số & Số nhân)", en: "Custom (Digits & Multiplier)" },
  "Tùy chọn (Chữ số & Số trừ)": { vi: "Tùy chọn (Chữ số & Số trừ)", en: "Custom (Digits & Subtrahend)" },
  "Tùy chọn (Cơ số & Số mũ)": { vi: "Tùy chọn (Cơ số & Số mũ)", en: "Custom (Base & Exponent)" },
  "Tùy chọn (Dãy số)": { vi: "Tùy chọn (Dãy số)", en: "Custom (Number Sequence)" },
  "Tùy chọn (Số gốc & Tỷ lệ %)": { vi: "Tùy chọn (Số gốc & Tỷ lệ %)", en: "Custom (Base & %)" },
  "Tùy chọn độ dài chữ số của số gốc và tỷ lệ %": { vi: "Tùy chọn độ dài chữ số của số gốc và tỷ lệ %", en: "Custom base digit length and percentage" },
  "Tùy chọn độ dài chữ số trong căn hoặc độ dài kết quả căn": { vi: "Tùy chọn độ dài chữ số trong căn hoặc độ dài kết quả căn", en: "Custom radicand or root digit length" },
  "Tùy chọn độ dài chữ số và nhân với số tùy ý": { vi: "Tùy chọn độ dài chữ số và nhân với số tùy ý", en: "Custom digit length and multiplier" },
  "Tùy chọn độ dài chữ số và số chia tùy ý": { vi: "Tùy chọn độ dài chữ số và số chia tùy ý", en: "Custom digit length and divisor" },
  "Tùy chọn độ dài chữ số và số cộng tùy ý": { vi: "Tùy chọn độ dài chữ số và số cộng tùy ý", en: "Custom digit length and addend" },
  "Tùy chọn độ dài chữ số và số trừ tùy ý": { vi: "Tùy chọn độ dài chữ số và số trừ tùy ý", en: "Custom digit length and subtrahend" },
  "Tùy chọn độ dài cơ số và số mũ tùy ý": { vi: "Tùy chọn độ dài cơ số và số mũ tùy ý", en: "Custom base digit length and exponent" },
  "Tuyệt Chiêu Ghép Cặp: (N − 1) | (100 − N)": { vi: "Tuyệt Chiêu Ghép Cặp: (N − 1) | (100 − N)", en: "Split-Pair Formula: (N − 1) | (100 − N)" },
  "Tự do": { vi: "Tự do", en: "Free" },
  "Tự động mở trình soạn thư Gmail trực tiếp (Không dùng Outlook)": { vi: "Tự động mở trình soạn thư Gmail trực tiếp (Không dùng Outlook)", en: "Directly opens Gmail Web Composer (No Outlook)" },
  "Tự nộp bài...": { vi: "Tự nộp bài...", en: "Submitting..." },
  "Từ số": { vi: "Từ số", en: "From" },
  "Tỷ lệ %": { vi: "Tỷ lệ %", en: "Percentage" },
  "Tỷ lệ % (Tăng / Giảm %) — Challenge": { vi: "Tỷ lệ % (Tăng / Giảm %) — Challenge", en: "Percentage (% Increase & Decrease) — Challenge" },
  "Tỷ lệ % (Tăng / Giảm %) — Difficult Level Challenge": { vi: "Tỷ lệ % (Tăng / Giảm %) — Difficult Level Challenge", en: "Percentage (% Increase & Decrease) — Difficult Level Challenge" },
  "Tỷ lệ % (Tăng / Giảm %) — Luyện tập": { vi: "Tỷ lệ % (Tăng / Giảm %) — Luyện tập", en: "Percentage (% Increase & Decrease) — Practice" },
  "Tỷ lệ % (Tăng / Giảm %) — Thử thách": { vi: "Tỷ lệ % (Tăng / Giảm %) — Thử thách", en: "Percentage (% Increase & Decrease) — Challenge" },
  "Tỷ lệ % (Tăng / Giảm %) — Thử thách khó": { vi: "Tỷ lệ % (Tăng / Giảm %) — Thử thách khó", en: "Percentage (% Increase & Decrease) — Difficult Challenge" },
  "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Challenge": { vi: "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Challenge", en: "Percentage (Find Rate & Whole) — Challenge" },
  "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Difficult Level Challenge": { vi: "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Difficult Level Challenge", en: "Percentage (Find Rate & Whole) — Difficult Level Challenge" },
  "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Luyện tập": { vi: "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Luyện tập", en: "Percentage (Find Rate & Whole) — Practice" },
  "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách": { vi: "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách", en: "Percentage (Find Rate & Whole) — Challenge" },
  "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách khó": { vi: "Tỷ lệ % (Tìm tỷ lệ & Số gốc) — Thử thách khó", en: "Percentage (Find Rate & Whole) — Difficult Challenge" },
  "Tỷ lệ % (Tính % của một số) — Challenge": { vi: "Tỷ lệ % (Tính % của một số) — Challenge", en: "Percentage (% of a Number) — Challenge" },
  "Tỷ lệ % (Tính % của một số) — Difficult Level Challenge": { vi: "Tỷ lệ % (Tính % của một số) — Difficult Level Challenge", en: "Percentage (% of a Number) — Difficult Level Challenge" },
  "Tỷ lệ % (Tính % của số) — Luyện tập": { vi: "Tỷ lệ % (Tính % của số) — Luyện tập", en: "Percentage (% of a Number) — Practice" },
  "Tỷ lệ % (Tính % của số) — Thử thách": { vi: "Tỷ lệ % (Tính % của số) — Thử thách", en: "Percentage (% of a Number) — Challenge" },
  "Tỷ lệ % (Tính % của số) — Thử thách khó": { vi: "Tỷ lệ % (Tính % của số) — Thử thách khó", en: "Percentage (% of a Number) — Difficult Challenge" },
  "Tỷ lệ % tùy chọn:": { vi: "Tỷ lệ % tùy chọn:", en: "Custom %:" },
  "Vàng": { vi: "Vàng", en: "Yellow" },
  "Về Brain Training": { vi: "Về Brain Training", en: "Brain Training" },
  "Về Luyện Tập": { vi: "Về Luyện Tập", en: "Practice Page" },
  "Về trang Luyện tập": { vi: "Về trang Luyện tập", en: "Go to Training page" },
  "Về trang Luyện tập Nhân với 11": { vi: "Về trang Luyện tập Nhân với 11", en: "Go to Multiply by 11 Practice" },
  "Về trang Luyện tập Nhân với 99": { vi: "Về trang Luyện tập Nhân với 99", en: "Go to Multiply by 99 Practice" },
  "VI": { vi: "VI", en: "EN" },
  "Ví dụ kinh điển: 68 × 99": { vi: "Ví dụ kinh điển: 68 × 99", en: "Classic Example: 68 × 99" },
  "Vuốt 2 ngón tay để zoom • Chạm 2 lần để zoom nhanh • Kéo để di chuyển": { vi: "Vuốt 2 ngón tay để zoom • Chạm 2 lần để zoom nhanh • Kéo để di chuyển", en: "Pinch with 2 fingers to zoom • Double-tap to quick zoom • Drag to pan" },
  "Vuốt ngang để chuyển bước • Vuốt 2 ngón để zoom": { vi: "Vuốt ngang để chuyển bước • Vuốt 2 ngón để zoom", en: "Swipe to switch steps • Pinch to zoom" },
  "Vuốt ngang hoặc bấm mũi tên để chuyển bước": { vi: "Vuốt ngang hoặc bấm mũi tên để chuyển bước", en: "Swipe or click arrows to switch steps" },
  "Vuốt zoom ảnh": { vi: "Vuốt zoom ảnh", en: "Pinch to zoom" },
  "Xanh": { vi: "Xanh", en: "Green" },
  "Xem hướng dẫn trực quan": { vi: "Xem hướng dẫn trực quan", en: "Visual Guide" },
  "Xem hướng dẫn trực quan (Visual Guide)": { vi: "Xem hướng dẫn trực quan (Visual Guide)", en: "Visual Guide" },
  "Xem kết quả thử thách": { vi: "Xem kết quả thử thách", en: "View Results" },
  "Xem Tổng Kết": { vi: "Xem Tổng Kết", en: "View Results" },
  "Xóa": { vi: "Xóa", en: "Clear" },
  "Xóa [Ngắn]": { vi: "Xóa", en: "Clr" },
  "Hiện chưa có Tab nào được bật hiển thị": { vi: "Hiện chưa có Tab nào được bật hiển thị", en: "No Tabs are currently enabled" },
  "Vui lòng bật lại ít nhất một Tab trong cấu hình quản trị.": { vi: "Vui lòng bật lại ít nhất một Tab trong cấu hình quản trị.", en: "Please enable at least one Tab in the configuration." },
  "Xóa 1 ký tự": { vi: "Xóa 1 ký tự", en: "Backspace" },
  "Xóa 1 số": { vi: "Xóa 1 số", en: "Backspace" },
  "Xóa ô nhập": { vi: "Xóa ô nhập", en: "Clear" },
  "Xóa toàn bộ": { vi: "Xóa toàn bộ", en: "Clear all" },
  "Xong": { vi: "Xong", en: "Done" },
  "Xuất sắc! 🌟": { vi: "Xuất sắc! 🌟", en: "Great! 🌟" },
  "Bật/tắt dãy số kết hợp cả phép chia (÷) và phép nhân (×) luôn chia hết": { vi: "Bật/tắt dãy số kết hợp cả phép chia (÷) và phép nhân (×) luôn chia hết", en: "Toggle random sequence mixing exact division (÷) and multiplication (×)" },
  "Bật/tắt dãy số ngẫu nhiên kết hợp cả phép nhân (×) và phép chia hết (÷)": { vi: "Bật/tắt dãy số ngẫu nhiên kết hợp cả phép nhân (×) và phép chia hết (÷)", en: "Toggle random sequence mixing multiplication (×) and exact division (÷)" },
  "Bật/tắt dãy tính kết hợp cả tăng (+%) và giảm (−%) luôn cho số nguyên đẹp": { vi: "Bật/tắt dãy tính kết hợp cả tăng (+%) và giảm (−%) luôn cho số nguyên đẹp", en: "Toggle random sequence mixing percentage increases (+%) and decreases (−%) with clean integers" },
  "Nhập độ dài chữ số của toán hạng thứ 2 (từ 1 đến 100)": { vi: "Nhập độ dài chữ số của toán hạng thứ 2 (từ 1 đến 100)", en: "Enter digit length for the 2nd operand (from 1 to 100)" },
  "Nhập số đích danh tùy chọn (VD: 19, 25, 99...)": { vi: "Nhập số đích danh tùy chọn (VD: 19, 25, 99...)", en: "Enter custom exact number (e.g. 19, 25, 99...)" },
  "Phép tính +/- %": { vi: "Phép tính +/- %", en: "Operations +/- %" },
  "Phép tính ×/÷": { vi: "Phép tính ×/÷", en: "Operations ×/÷" },
  "Phép tính ÷/×": { vi: "Phép tính ÷/×", en: "Operations ÷/×" },
  "Số thứ 2 tùy chọn:": { vi: "Số thứ 2 tùy chọn:", en: "Custom 2nd operand:" },
  "Tùy chọn (Chữ số & Phép tính)": { vi: "Tùy chọn (Chữ số & Phép tính)", en: "Custom (Digits & Operations)" },
  "Tùy chọn dãy số nhân liên tiếp giống các cuộc thi Siêu trí tuệ": { vi: "Tùy chọn dãy số nhân liên tiếp giống các cuộc thi Siêu trí tuệ", en: "Super-Brain sequential multiplication challenge" },
  "Tùy chọn độ dài chữ số, phép tính và số đích danh tùy ý": { vi: "Tùy chọn độ dài chữ số, phép tính và số đích danh tùy ý", en: "Custom digit length, operation, and second operand" },
  "Xem nhanh hướng dẫn toàn bộ Web App": { vi: "Xem nhanh hướng dẫn toàn bộ Web App", en: "Quick guide for the entire Web App" },
};

export function translateText(
  language: Language,
  key: string,
  fallbackEn?: string
): string {
  const entry = PHRASE_TRANSLATIONS[key];
  if (entry) {
    return entry[language] ?? entry.vi;
  }
  return language === 'vi' ? key : (fallbackEn ?? key);
}

export function formatTranslation(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
  fallbackEn?: string
): string {
  let text = translateText(language, key, fallbackEn);
  if (!params) return text;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    text = text.replaceAll(`{${paramKey}}`, String(paramValue));
  }
  return text;
}

export function getPhraseEntry(
  key: string,
  fallbackEn?: string
): PhraseTranslation {
  const entry = PHRASE_TRANSLATIONS[key];
  if (entry) return entry;
  return { vi: key, en: fallbackEn ?? key };
}

export function biLabel(
  key: string,
  fallbackEn?: string
): { labelVi: string; labelEn: string } {
  const entry = getPhraseEntry(key, fallbackEn);
  return { labelVi: entry.vi, labelEn: entry.en };
}

export function biDesc(
  key: string,
  fallbackEn?: string
): { descVi: string; descEn: string } {
  const entry = getPhraseEntry(key, fallbackEn);
  return { descVi: entry.vi, descEn: entry.en };
}

// ============================================================================
// 3. CONTEXT & HOOK NGÔN NGỮ (IP Auto-Detection + LocalStorage Override)
// ============================================================================
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isVi: boolean;
  countryCode: string | null;
  ipAddress: string | null;
  isDetecting: boolean;
  t: Translations;
  tr: (key: string, fallbackEn?: string) => string;
  tf: (
    key: string,
    params?: Record<string, string | number>,
    fallbackEn?: string
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user has previously set a manual override
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_user_lang') as Language | null;
      if (saved === 'vi' || saved === 'en') return saved;
      // Default to Vietnamese if browser is Vietnamese, otherwise start with English while IP is detected
      const browserLang = navigator.language?.toLowerCase() || '';
      return browserLang.startsWith('vi') ? 'vi' : 'en';
    }
    return 'vi';
  });

  const [countryCode, setCountryCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_detected_country');
    }
    return null;
  });

  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function detectCountryByIp() {
      setIsDetecting(true);
      const savedUserChoice = localStorage.getItem('app_user_lang');

      try {
        // Primary API: api.country.is (fast, free, CORS allowed)
        let detectedCountry = '';
        let detectedIp = '';

        try {
          const res = await fetch('https://api.country.is', { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            detectedCountry = data.country || '';
            detectedIp = data.ip || '';
          }
        } catch {
          // Fallback API: ipapi.co
          try {
            const resFallback = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
            if (resFallback.ok) {
              const dataFallback = await resFallback.json();
              detectedCountry = dataFallback.country_code || '';
              detectedIp = dataFallback.ip || '';
            }
          } catch {
            // Secondary fallback: ipwho.is
            const resWho = await fetch('https://ipwho.is/');
            if (resWho.ok) {
              const dataWho = await resWho.json();
              detectedCountry = dataWho.country_code || '';
              detectedIp = dataWho.ip || '';
            }
          }
        }

        if (isMounted) {
          if (detectedCountry) {
            setCountryCode(detectedCountry);
            setIpAddress(detectedIp);
            localStorage.setItem('app_detected_country', detectedCountry);

            // If user has not manually locked their choice:
            // Vietnam IP -> Vietnamese, Other Countries -> English
            if (!savedUserChoice) {
              if (detectedCountry.toUpperCase() === 'VN') {
                setLanguageState('vi');
              } else {
                setLanguageState('en');
              }
            }
          } else {
            // Fallback via navigator.language if all IP APIs are blocked
            if (!savedUserChoice) {
              const isVi = navigator.language?.toLowerCase().startsWith('vi');
              setLanguageState(isVi ? 'vi' : 'en');
            }
          }
        }
      } catch (err) {
        console.warn('IP Geolocation detection error:', err);
      } finally {
        if (isMounted) {
          setIsDetecting(false);
        }
      }
    }

    detectCountryByIp();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('app_user_lang', newLang);
  };

  const t = translations[language] || translations.vi;
  const isVi = language === 'vi';
  const tr = (key: string, fallbackEn?: string) =>
    translateText(language, key, fallbackEn);
  const tf = (
    key: string,
    params?: Record<string, string | number>,
    fallbackEn?: string
  ) => formatTranslation(language, key, params, fallbackEn);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isVi,
        countryCode,
        ipAddress,
        isDetecting,
        t,
        tr,
        tf,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
