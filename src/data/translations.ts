export type Language = 'vi' | 'en';

export interface Translations {
  // Navigation & Header
  brandTitle: string;
  brandSubtitle: string;
  tabXauusd: string;
  tabPropfirm: string;
  tabBackcom: string;
  systemOnline: string;
  detectingLocation: string;
  detectedCountry: string;
  switchToVi: string;
  switchToEn: string;

  // Mobile Bottom Bar
  mobileXauusd: string;
  mobilePropfirm: string;
  mobileBackcom: string;

  // XAUUSD Tab
  xauusdTitle: string;
  xauusdDesc: string;
  xauusdCardReady: string;
  xauusdFeature1Title: string;
  xauusdFeature1Desc: string;
  xauusdFeature2Title: string;
  xauusdFeature2Desc: string;
  xauusdFeature3Title: string;
  xauusdFeature3Desc: string;

  // Prop Firm Tab
  propfirmTitle: string;
  propfirmDesc: string;
  propfirmCardReady: string;
  propfirmFeature1Title: string;
  propfirmFeature1Desc: string;
  propfirmFeature2Title: string;
  propfirmFeature2Desc: string;
  propfirmFeature3Title: string;
  propfirmFeature3Desc: string;

  // Backcom Tab
  backcomTitle: string;
  backcomDesc: string;
  backcomCardReady: string;
  backcomFeature1Title: string;
  backcomFeature1Desc: string;
  backcomFeature2Title: string;
  backcomFeature2Desc: string;
  backcomFeature3Title: string;
  backcomFeature3Desc: string;

  // Footer & Common Actions
  copyright: string;
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
    // Navigation & Header
    brandTitle: 'MY BRAIN',
    brandSubtitle: 'ACADEMY',
    tabXauusd: 'XAUUSD',
    tabPropfirm: 'Prop Firm',
    tabBackcom: 'Backcom',
    systemOnline: 'Hệ thống Trực tuyến',
    detectingLocation: 'Đang định vị IP...',
    detectedCountry: 'Vị trí',
    switchToVi: 'Tiếng Việt',
    switchToEn: 'English',

    // Mobile Bottom Bar
    mobileXauusd: 'XAUUSD',
    mobilePropfirm: 'Prop Firm',
    mobileBackcom: 'Backcom',

    // XAUUSD Tab
    xauusdTitle: 'Phân Tích XAUUSD & Thị Trường Vàng',
    xauusdDesc: 'Không gian làm việc chuyên sâu cho giao dịch Vàng (XAUUSD): Dữ liệu thị trường thời gian thực, phiên giao dịch (Á, Âu, Mỹ), lịch kinh tế và nhật ký lệnh.',
    xauusdCardReady: 'Phân hệ XAUUSD đã sẵn sàng. Bạn có thể thêm biểu đồ, công cụ đo lường và dữ liệu trực tiếp tại đây.',
    xauusdFeature1Title: 'Phiên Giao Dịch & Killzone',
    xauusdFeature1Desc: 'Theo dõi thời gian hoạt động và biến động của phiên Sydney, Tokyo, London và New York.',
    xauusdFeature2Title: 'Lịch Kinh Tế USD / Vàng',
    xauusdFeature2Desc: 'Cảnh báo tin tức vĩ mô tác động mạnh (CPI, NFP, FOMC, Lãi suất Fed).',
    xauusdFeature3Title: 'Nhật Ký & Quản Trị Lệnh',
    xauusdFeature3Desc: 'Ghi chép điểm vào lệnh (Entry), Stop Loss, Take Profit và tỷ lệ R:R chuẩn mực.',

    // Prop Firm Tab
    propfirmTitle: 'Giám Sát Tài Khoản Quỹ (Prop Firm)',
    propfirmDesc: 'Hệ thống quản trị rủi ro quỹ cấp vốn: Giám sát giới hạn sụt giảm ngày (Daily Loss), sụt giảm tối đa (Max Drawdown) và mục tiêu lợi nhuận thử thách.',
    propfirmCardReady: 'Phân hệ Prop Firm đã sẵn sàng. Bạn có thể theo dõi tài khoản FTMO, Funding Pips, FundedNext hoặc quỹ tự chọn tại đây.',
    propfirmFeature1Title: 'Bảo Vệ Daily Drawdown',
    propfirmFeature1Desc: 'Cảnh báo sớm khi tài khoản chạm ngưỡng sụt giảm 4% - 5% trong ngày.',
    propfirmFeature2Title: 'Theo Dõi Max Drawdown Trailing',
    propfirmFeature2Desc: 'Tính toán chính xác theo Balance hoặc Equity theo quy chế từng quỹ.',
    propfirmFeature3Title: 'Tiến Trình Đỗ Thử Thách',
    propfirmFeature3Desc: 'Đo lường phần trăm đạt mục tiêu Phase 1 (10%), Phase 2 (5%) và ngày giao dịch tối thiểu.',

    // Backcom Tab
    backcomTitle: 'Quản Lý Đối Soát Hoàn Phí (Backcom / Rebates)',
    backcomDesc: 'Công cụ tính toán và đối soát hoa hồng giao dịch tự động theo khối lượng Lot giao dịch của từng sàn môi giới đối tác.',
    backcomCardReady: 'Phân hệ Backcom đã sẵn sàng. Bạn có thể theo dõi doanh số, tỷ lệ hoàn trả $/Lot và lịch thanh toán hoa hồng tại đây.',
    backcomFeature1Title: 'Tỷ Lệ Hoàn Phí $/Lot',
    backcomFeature1Desc: 'Bảng tỷ lệ chiết khấu minh bạch cho Vàng, Forex và Crypto theo từng sàn.',
    backcomFeature2Title: 'Tính Toán Lợi Nhuận Ròng',
    backcomFeature2Desc: 'Tự động tính tiền hoàn trả dựa trên tổng số Lot đã giao dịch trong tuần/tháng.',
    backcomFeature3Title: 'Lịch Sử Thanh Toán',
    backcomFeature3Desc: 'Ghi nhận trạng thái đối soát: Đã thanh toán (Paid) hoặc Đang chờ xử lý (Pending).',

    // Footer & Common Actions
    copyright: 'Bản quyền © 2026 MY BRAIN ACADEMY',
    installApp: 'Cài Đặt App',
    youtube: 'Youtube',
    email: 'Email',
    buyCoffee: 'Ủng hộ cà phê',
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
    // Navigation & Header
    brandTitle: 'MY BRAIN',
    brandSubtitle: 'ACADEMY',
    tabXauusd: 'XAUUSD',
    tabPropfirm: 'Prop Firm',
    tabBackcom: 'Backcom',
    systemOnline: 'System Online',
    detectingLocation: 'Detecting IP...',
    detectedCountry: 'Location',
    switchToVi: 'Tiếng Việt',
    switchToEn: 'English',

    // Mobile Bottom Bar
    mobileXauusd: 'XAUUSD',
    mobilePropfirm: 'Prop Firm',
    mobileBackcom: 'Backcom',

    // XAUUSD Tab
    xauusdTitle: 'XAUUSD & Gold Market Analytics',
    xauusdDesc: 'Professional workspace for Gold (XAUUSD) trading: Real-time market metrics, trading sessions (Asia, London, New York), macroeconomic calendar, and trade journal.',
    xauusdCardReady: 'XAUUSD module is ready. You can add your charts, measurement indicators, and real-time data feeds here.',
    xauusdFeature1Title: 'Trading Sessions & Killzones',
    xauusdFeature1Desc: 'Monitor active market hours and volatility across Sydney, Tokyo, London, and New York.',
    xauusdFeature2Title: 'USD / Gold Economic Calendar',
    xauusdFeature2Desc: 'High-impact macroeconomic data alerts (CPI, NFP, FOMC, Fed Interest Rates).',
    xauusdFeature3Title: 'Trading Journal & Risk Tracking',
    xauusdFeature3Desc: 'Record entries, stop losses, take profits, and disciplined Risk-to-Reward ratios.',

    // Prop Firm Tab
    propfirmTitle: 'Prop Firm Account Oversight',
    propfirmDesc: 'Comprehensive risk management dashboard for proprietary trading firms: Monitor daily drawdown limit, maximum trailing drawdown, and challenge profit targets.',
    propfirmCardReady: 'Prop Firm module is ready. You can track FTMO, Funding Pips, FundedNext, or custom prop challenges here.',
    propfirmFeature1Title: 'Daily Drawdown Shield',
    propfirmFeature1Desc: 'Early warning indicators when daily account loss approaches 4% - 5%.',
    propfirmFeature2Title: 'Trailing Max Loss Tracking',
    propfirmFeature2Desc: 'Accurate calculations based on Balance or Equity per firm-specific rules.',
    propfirmFeature3Title: 'Challenge Passing Progress',
    propfirmFeature3Desc: 'Track milestone targets for Phase 1 (10%), Phase 2 (5%), and minimum required trading days.',

    // Backcom Tab
    backcomTitle: 'Commission Rebates (Backcom) Management',
    backcomDesc: 'Automated settlement tool for calculating and tracking broker trade rebates and cashback by lot volume.',
    backcomCardReady: 'Backcom module is ready. Track broker volume, rebate rates per lot, and payment history here.',
    backcomFeature1Title: 'Rebate Rates $/Lot',
    backcomFeature1Desc: 'Transparent cashback rates for Gold, Forex, and Crypto by partnered brokers.',
    backcomFeature2Title: 'Net Payout Calculations',
    backcomFeature2Desc: 'Automated cashback estimation based on total volume traded across weekly/monthly cycles.',
    backcomFeature3Title: 'Settlement Status Tracking',
    backcomFeature3Desc: 'Keep records organized with verified settlement statuses: Paid or Pending payout.',

    // Footer & Common Actions
    copyright: 'Copyright © 2026 MY BRAIN ACADEMY',
    installApp: 'Install App',
    youtube: 'Youtube',
    email: 'Email',
    buyCoffee: 'Buy coffee',
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
