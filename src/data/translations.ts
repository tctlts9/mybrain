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
  mobileMentalMath: string;
  mobileLociJourney: string;

  // Mental Math Content
  mentalMathTitle: string;
  mentalMathDesc: string;
  mentalMathChallenge: string;
  cardMultiply2Title: string;
  cardMultiply2Desc: string;
  cardMultiply2Tag: string;
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
    tabLociJourney: 'Ký Ức Loci',
    mobileMentalMath: 'Tính Nhẩm',
    mobileLociJourney: 'Ký Ức Loci',

    // Content
    mentalMathTitle: 'Tính Nhẩm',
    mentalMathDesc: 'Học viện huấn luyện não bộ, rèn luyện kỹ năng tính nhẩm siêu trí tuệ và phương pháp tư duy số học Super Brain.',
    mentalMathChallenge: 'Thử Thách Tính Nhẩm',
    cardMultiply2Title: 'Phép nhân 2 chữ số',
    cardMultiply2Desc: 'Rèn luyện phản xạ tính nhẩm tích 2 chữ số với 2 chữ số nhanh chóng, chính xác không cần dùng giấy bút hay máy tính.',
    cardMultiply2Tag: 'Cơ bản & Nâng cao',
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
    footerQuoteLine2: 'Tôi hy vọng các em có thể xây dựng cho mình kỹ năng cần thiết nhất',
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
    tabLociJourney: 'Loci Memory',
    mobileMentalMath: 'Mental Math',
    mobileLociJourney: 'Loci Memory',

    // Content
    mentalMathTitle: 'Mental Math',
    mentalMathDesc: 'Brain training academy for advanced cognitive arithmetic, lightning-speed calculation, and brain agility development.',
    mentalMathChallenge: 'Mental Math Challenge',
    cardMultiply2Title: '2-Digit Multiplication',
    cardMultiply2Desc: 'Master mental calculation reflexes for multiplying 2-digit numbers with speed and precision without a calculator.',
    cardMultiply2Tag: 'Core & Intermediate',
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
