import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSearch,
  History,
  Layers3,
  Loader2,
  Settings,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@mui/material';
import Logo from './components/Logo';
import supabase, { supabaseConfig } from './supabase';

type ActiveView = 'home' | 'compare' | 'analyzing' | 'results' | 'history' | 'terms';
type Language = 'en' | 'ko' | 'ja' | 'zh';
type AuthMode = 'login' | 'signup';
type AnalysisStage = 'uploading' | 'cache' | 'extracting' | 'comparing' | 'finalizing';
type UserSession = {
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'email';
  emailVerified: boolean;
};
type AccountTab = 'profile' | 'history';
type ProfileSettings = {
  displayName: string;
  company: string;
  role: string;
  phone: string;
};
type EmailSignupMetadata = {
  displayName?: string;
  company?: string;
  password: string;
};
type CreateComparisonJobResponse = {
  jobId: string;
  guestAccessToken: string;
  expiresAt: string;
  analysis?: QuoteAnalysis;
  cacheHit?: boolean;
};
type QuoteAnalysisItem = {
  item_label: string;
  item_label_i18n?: Partial<Record<Language, string>>;
  cells?: Array<{
    vendorSide: 'A' | 'B' | 'C' | 'D' | 'E';
    value: string;
    rawTerm: string;
    included: boolean;
    pricingBasis?: string;
  }>;
  quote_a_value?: string;
  quote_b_value?: string;
  delta_value: string;
  delta_i18n?: Partial<Record<Language, string>>;
  delta_status?: 'lower_in_a' | 'lower_in_b' | 'same' | 'only_in_a' | 'only_in_b' | 'different_basis';
  status: 'matched' | 'only_in_a' | 'only_in_b' | 'different_basis';
  insight: string;
  insight_i18n?: Partial<Record<Language, string>>;
};
type QuoteAnalysisVendor = {
  side: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  filename: string;
};
type QuoteAnalysis = {
  title: string;
  title_i18n?: Partial<Record<Language, string>>;
  summary: string;
  summary_i18n?: Partial<Record<Language, string>>;
  recommendedQuote: string;
  recommendation_i18n?: Partial<Record<Language, string>>;
  estimatedSavings: number;
  coverageGaps: number;
  matchedLowerCount: number;
  matchedCount: number;
  vendors?: QuoteAnalysisVendor[];
  items: QuoteAnalysisItem[];
  insights: string[];
  insights_i18n?: Partial<Record<Language, string[]>>;
  risks?: string[];
  risks_i18n?: Partial<Record<Language, string[]>>;
};

const authStorageKey = 'quotewise.user';
const profileStorageKey = 'quotewise.profile';
const supabaseClient = supabase;

const languages: Array<{ code: Language; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh', label: '简体中文', short: 'ZH' },
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'ja', label: '日本語', short: 'JA' },
];

const orderedLanguages: Array<{ code: Language; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'zh', label: '简体中文', short: 'ZH' },
];

const copy = {
  en: {
    home: 'Home',
    compare: 'Compare',
    history: 'History',
    eyebrow: 'Procurement intelligence',
    headline: ['Multiple quotations.', 'One clear decision.'],
    lead: 'QuoteWise reads 2 to 5 supplier PDFs, aligns line items across vendors, and surfaces the differences that actually move the needle.',
    start: 'Start a comparison',
    viewHistory: 'View history',
    previewHeaders: ['Item', 'Quote A', 'Quote B', 'Delta'],
    recommendation: 'Recommendation',
    recommendationValue: 'Quote B saves $190',
    compareTitle: 'Upload supplier quotations',
    compareCopy: 'Add 2 to 5 supplier PDF quotes and QuoteWise will prepare them for line-by-line comparison.',
    uploadFirst: 'Upload first quotation',
    uploadSecond: 'Upload second quotation',
    uploadHelp: 'Choose a PDF file or drag it here.',
    uploadMultipleTitle: 'Upload quotation PDFs',
    uploadMultipleHelp: 'Choose 2 to 5 PDF files.',
    uploadedFilesTitle: 'Uploaded files',
    uploadedFilesEmpty: 'Click to upload files or drag and drop them here.',
    selectedFirst: 'Quotation 1',
    selectedSecond: 'Quotation 2',
    analyze: 'Start comparison analysis',
    analyzingTitle: 'Analyzing your quotations',
    analyzingCopy: 'QuoteWise is aligning items, checking price gaps, and preparing a decision-ready summary.',
    results: 'Results',
    resultsTitle: 'Quote B is the stronger choice',
    resultsCopy: 'Quote B is lower overall and wins on setup cost and support pricing. Quote A is only cheaper on the display line.',
    totalSavings: 'Estimated savings',
    matchedLineDelta: 'Matched line-item delta',
    matchedLinesLower: 'matched lines are lower',
    coverageItemsHelper: 'Items appear in only one quote',
    recommendedVendor: 'Recommended quote',
    matchedItems: 'Matched items',
    coverageGaps: 'Coverage gaps',
    keyInsights: 'Key insights',
    quoteA: 'Quote A',
    quoteB: 'Quote B',
    delta: 'Delta',
    differentBasis: 'Different basis',
    onlyInA: 'Only in A',
    onlyInB: 'Only in B',
    summary: 'Summary',
    newComparison: 'New comparison',
    reportTitle: 'Detailed analysis report',
    reportCopy: 'Download a PDF-ready report with the recommendation, item comparison, coverage gaps, and pricing-basis notes.',
    reportDownload: 'Download PDF',
    reportPreparedBy: 'Prepared by QuoteWise',
    pdfError: 'Only PDF files can be uploaded.',
    login: 'Log in',
    account: 'Account',
    loginTitle: 'Continue with Google',
    loginCopy: 'Sign in with Google to save and revisit your quotation comparisons.',
    logout: 'Log out',
    loggedInAs: 'Logged in as',
    profileTab: 'Profile',
    accountHistoryTab: 'History',
    accountInfo: 'Account information',
    emailAddress: 'Email address',
    signInMethod: 'Sign-in method',
    accountStatus: 'Account status',
    accountStatusActive: 'Active',
    accountStatusUnverified: 'Email verification required',
    personalInfo: 'Personal details',
    displayName: 'Display name',
    company: 'Company',
    role: 'Role',
    phone: 'Phone',
    profileSavedLocally: 'Saved locally for now. Supabase profile storage comes next.',
    historyPreviewTitle: 'Comparison history',
    historyPreviewCopy: 'Saved comparison reports will appear here after the history database is connected.',
    historyPreviewEmpty: 'No saved comparisons yet.',
    googleLoginUnavailable: 'Add Supabase settings and enable the Google provider to use Google login.',
    googleLoginLoading: 'Loading Google sign-in...',
    googleLoginError: 'Google login could not be completed. Please try again.',
    emailLoginTitle: 'Or use email',
    emailLabel: 'Email',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    confirmPasswordLabel: 'Confirm password',
    passwordMismatch: 'Passwords do not match.',
    emailLoginSubmit: 'Log in with email',
    emailSignupSubmit: 'Create account',
    emailAuthUnavailable: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable email login.',
    emailAuthSuccess: 'Check your email to confirm your account.',
    emailVerificationRequired: 'Please verify your email to use history and PDF downloads.',
    emailAuthError: 'Email authentication failed. Please check your information and try again.',
    historyTitle: 'History is coming soon',
    historyCopy: 'Your previous comparison reports will appear here once project storage is connected.',
    insightItems: [
      'Quote B saves $190 across matched line items.',
      'The display line is the only item where Quote A is cheaper.',
      'Cable management appears only in Quote A.',
      'Priority delivery appears only in Quote B and should be checked before approval.',
      'Raw material freight uses a different pricing basis and needs normalization before final comparison.',
    ],
    features: [
      {
        title: 'Considered extraction',
        copy: 'We parse vendor, items, quantities, unit prices, totals, delivery and payment terms, even when each quote uses different wording.',
      },
      {
        title: 'Side-by-side, line by line',
        copy: 'Items are matched across both documents. Variances are highlighted so you can see at a glance where each vendor wins.',
      },
      {
        title: 'Insights, not noise',
        copy: 'Beyond the table, a brief executive summary calls out the meaningful differences in price, terms and risk.',
      },
    ],
  },
  ko: {
    home: '홈',
    compare: '비교',
    history: '기록',
    eyebrow: '구매 의사결정 인텔리전스',
    headline: ['여러 개의 견적서.', '하나의 명확한 결정.'],
    lead: 'QuoteWise는 공급업체 PDF를 2개에서 최대 5개까지 읽고, 벤더별 항목을 맞춰 비교하며, 실제 의사결정에 영향을 주는 차이를 선명하게 보여줍니다.',
    start: '비교 시작하기',
    viewHistory: '기록 보기',
    previewHeaders: ['항목', '견적 A', '견적 B', '차이'],
    recommendation: '추천',
    recommendationValue: '견적 B로 $190 절감',
    compareTitle: '공급업체 견적서를 업로드하세요',
    compareCopy: 'PDF 견적서를 2개에서 최대 5개까지 올리면 QuoteWise가 항목별 비교를 준비합니다.',
    uploadFirst: '첫 번째 견적서 업로드',
    uploadSecond: '두 번째 견적서 업로드',
    uploadHelp: 'PDF 파일을 선택하거나 여기에 끌어다 놓으세요.',
    uploadMultipleTitle: '견적서 PDF 업로드',
    uploadMultipleHelp: 'PDF 파일을 2개에서 최대 5개까지 선택하세요.',
    uploadedFilesTitle: '업로드한 파일',
    uploadedFilesEmpty: '파일을 클릭해서 업로드하거나 여기로 드래그 앤 드롭하세요.',
    selectedFirst: '견적서 1',
    selectedSecond: '견적서 2',
    analyze: '비교 분석 시작하기',
    analyzingTitle: '견적서를 분석하고 있습니다',
    analyzingCopy: 'QuoteWise가 항목을 맞추고, 가격 차이를 확인하며, 의사결정용 요약을 준비하고 있습니다.',
    results: '결과',
    resultsTitle: '견적 B가 더 유리합니다',
    resultsCopy: '견적 B는 전체 비용이 더 낮고 설치비와 지원 비용에서 우세합니다. 견적 A는 디스플레이 항목에서만 더 저렴합니다.',
    totalSavings: '예상 절감액',
    matchedLineDelta: '매칭 항목 기준 차이',
    matchedLinesLower: '개 매칭 항목에서 더 낮습니다',
    coverageItemsHelper: '한 견적서에만 있는 항목입니다',
    recommendedVendor: '추천 견적',
    matchedItems: '매칭된 항목',
    coverageGaps: '포함 범위 차이',
    keyInsights: '핵심 인사이트',
    quoteA: '견적 A',
    quoteB: '견적 B',
    delta: '차이',
    differentBasis: '기준 다름',
    onlyInA: 'A에만 있음',
    onlyInB: 'B에만 있음',
    summary: '요약',
    newComparison: '새 비교 시작',
    reportTitle: '상세 분석 리포트',
    reportCopy: '추천 결과, 항목별 비교, 포함 범위 차이, 비용 산정 기준 차이를 PDF 리포트로 저장하세요.',
    reportDownload: 'PDF 다운로드',
    reportPreparedBy: 'QuoteWise 분석 리포트',
    pdfError: 'PDF 파일만 업로드할 수 있습니다.',
    login: '로그인',
    account: '계정',
    loginTitle: 'Google로 계속하기',
    loginCopy: '다음 MVP 단계에서 비교 기록을 이어갈 수 있도록 Google 계정으로 로그인하세요.',
    logout: '로그아웃',
    loggedInAs: '로그인 계정',
    googleLoginUnavailable: 'Google 로그인을 사용하려면 Supabase 설정과 Google provider를 활성화하세요.',
    googleLoginLoading: 'Google 로그인을 불러오는 중입니다...',
    googleLoginError: 'Google 로그인을 완료할 수 없습니다. 다시 시도하세요.',
    emailLoginTitle: '또는 이메일 사용',
    emailLabel: '이메일',
    emailPlaceholder: 'you@company.com',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '6자 이상',
    confirmPasswordLabel: '비밀번호 확인',
    passwordMismatch: '비밀번호가 일치하지 않습니다.',
    emailLoginSubmit: '이메일로 로그인',
    emailSignupSubmit: '계정 만들기',
    emailAuthUnavailable: '이메일 로그인을 사용하려면 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가하세요.',
    emailAuthSuccess: '계정 확인을 위해 이메일을 확인하세요.',
    emailVerificationRequired: '히스토리와 PDF 다운로드를 사용하려면 이메일 인증을 완료해 주세요.',
    emailAuthError: '이메일 인증에 실패했습니다. 입력 정보를 확인하고 다시 시도하세요.',
    historyTitle: '기록 기능은 준비 중입니다',
    historyCopy: '프로젝트 저장 기능이 연결되면 이전 비교 리포트가 이곳에 표시됩니다.',
    insightItems: [
      '매칭된 항목 기준으로 견적 B가 $190 절감됩니다.',
      '디스플레이 항목만 견적 A가 더 저렴합니다.',
      '케이블 정리 키트는 견적 A에만 포함되어 있습니다.',
      '우선 배송은 견적 B에만 포함되어 있어 승인 전 확인이 필요합니다.',
      '원자재 운송비는 산정 기준이 달라 최종 비교 전에 기준 정규화가 필요합니다.',
    ],
    features: [
      {
        title: '정교한 항목 추출',
        copy: '공급업체, 항목, 수량, 단가, 총액, 납기와 결제 조건까지 견적서 표현이 달라도 핵심 정보를 추출합니다.',
      },
      {
        title: '항목별 나란히 비교',
        copy: '두 문서의 유사 항목을 매칭하고 차이를 강조해 어떤 공급업체가 유리한지 빠르게 파악할 수 있습니다.',
      },
      {
        title: '소음이 아닌 인사이트',
        copy: '표를 넘어 가격, 조건, 리스크에서 의미 있는 차이를 짧은 요약으로 보여줍니다.',
      },
    ],
  },
  ja: {
    home: 'ホーム',
    compare: '比較',
    history: '履歴',
    eyebrow: '購買インテリジェンス',
    headline: ['複数の見積書。', 'ひとつの明確な判断。'],
    lead: 'QuoteWiseは2〜5件の仕入先PDFを読み取り、ベンダー間の明細をそろえて、意思決定に本当に効く差分を可視化します。',
    start: '比較を開始',
    viewHistory: '履歴を見る',
    previewHeaders: ['項目', '見積 A', '見積 B', '差分'],
    recommendation: '推奨',
    recommendationValue: '見積 Bで$190削減',
    compareTitle: '仕入先見積書をアップロード',
    compareCopy: '2〜5件のPDF見積書を追加すると、QuoteWiseが明細ごとの比較を準備します。',
    uploadFirst: '1つ目の見積書をアップロード',
    uploadSecond: '2つ目の見積書をアップロード',
    uploadHelp: 'PDFファイルを選択するか、ここにドラッグしてください。',
    uploadMultipleTitle: '見積書PDFをアップロード',
    uploadMultipleHelp: 'PDFファイルを2〜5件選択してください。',
    uploadedFilesTitle: 'アップロード済みファイル',
    uploadedFilesEmpty: 'クリックしてアップロードするか、ここにドラッグ＆ドロップしてください。',
    selectedFirst: '見積書 1',
    selectedSecond: '見積書 2',
    analyze: '比較分析を開始',
    analyzingTitle: '見積書を分析しています',
    analyzingCopy: 'QuoteWiseが明細を照合し、価格差を確認し、判断しやすい要約を準備しています。',
    results: '結果',
    resultsTitle: '見積 Bがより有利です',
    resultsCopy: '見積 Bは全体コストが低く、設置費とサポート費で優位です。見積 Aが安いのはディスプレイ項目のみです。',
    totalSavings: '推定削減額',
    matchedLineDelta: '一致明細の差額',
    matchedLinesLower: '件の一致明細でより低価格です',
    coverageItemsHelper: '一方の見積書にのみ含まれる項目です',
    recommendedVendor: '推奨見積',
    matchedItems: '照合済み項目',
    coverageGaps: '含まれる範囲の差',
    keyInsights: '主なインサイト',
    quoteA: '見積 A',
    quoteB: '見積 B',
    delta: '差分',
    differentBasis: '基準が異なる',
    onlyInA: 'Aのみ',
    onlyInB: 'Bのみ',
    summary: '要約',
    newComparison: '新しい比較',
    reportTitle: '詳細分析レポート',
    reportCopy: '推奨結果、項目別比較、含まれる範囲の差、価格算定基準の違いをPDFレポートとして保存できます。',
    reportDownload: 'PDFをダウンロード',
    reportPreparedBy: 'QuoteWise分析レポート',
    pdfError: 'PDFファイルのみアップロードできます。',
    login: 'ログイン',
    account: 'アカウント',
    loginTitle: 'Googleで続行',
    loginCopy: '次のMVP段階で比較履歴を利用できるよう、Googleアカウントでログインしてください。',
    logout: 'ログアウト',
    loggedInAs: 'ログイン中',
    googleLoginUnavailable: 'Googleログインを有効にするには Supabase 設定と Google provider を有効にしてください。',
    googleLoginLoading: 'Googleログインを読み込み中...',
    googleLoginError: 'Googleログインを完了できませんでした。もう一度お試しください。',
    emailLoginTitle: 'またはメールを使用',
    emailLabel: 'メール',
    emailPlaceholder: 'you@company.com',
    passwordLabel: 'パスワード',
    passwordPlaceholder: '6文字以上',
    confirmPasswordLabel: 'パスワード確認',
    passwordMismatch: 'パスワードが一致しません。',
    emailLoginSubmit: 'メールでログイン',
    emailSignupSubmit: 'アカウント作成',
    emailAuthUnavailable: 'メールログインを有効にするには VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を追加してください。',
    emailAuthSuccess: 'アカウント確認のためメールをご確認ください。',
    emailVerificationRequired: '履歴とPDFダウンロードを使用するには、メール認証を完了してください。',
    emailAuthError: 'メール認証に失敗しました。入力内容を確認してもう一度お試しください。',
    historyTitle: '履歴機能は準備中です',
    historyCopy: 'プロジェクト保存機能が接続されると、過去の比較レポートがここに表示されます。',
    insightItems: [
      '照合済み項目では、見積 Bにより$190削減できます。',
      'ディスプレイ項目のみ、見積 Aの方が安くなっています。',
      'ケーブル整理キットは見積 Aにのみ含まれています。',
      '優先配送は見積 Bにのみ含まれているため、承認前に確認が必要です。',
      '原材料の運送費は算定基準が異なるため、最終比較前に基準の正規化が必要です。',
    ],
    features: [
      {
        title: '丁寧な情報抽出',
        copy: '仕入先、項目、数量、単価、合計、納期、支払条件まで、見積書ごとに表現が違っても主要情報を抽出します。',
      },
      {
        title: '明細ごとの横並び比較',
        copy: '2つの文書の類似項目を自動で対応づけ、どちらのベンダーが有利かをひと目で確認できます。',
      },
      {
        title: 'ノイズではなく洞察',
        copy: '表だけでなく、価格・条件・リスクの意味ある差分を短い要約で示します。',
      },
    ],
  },
  zh: {
    home: '首页',
    compare: '比较',
    history: '历史',
    eyebrow: '采购智能',
    headline: ['多份报价。', '一个清晰决定。'],
    lead: 'QuoteWise 可读取 2 到 5 份供应商 PDF，对齐不同供应商的明细项目，并突出真正影响决策的差异。',
    start: '开始比较',
    viewHistory: '查看历史',
    previewHeaders: ['项目', '报价 A', '报价 B', '差异'],
    recommendation: '建议',
    recommendationValue: '选择报价 B 可节省 $190',
    compareTitle: '上传供应商报价',
    compareCopy: '添加 2 到 5 份供应商 PDF 报价，QuoteWise 会准备逐项比较。',
    uploadFirst: '上传第一份报价',
    uploadSecond: '上传第二份报价',
    uploadHelp: '选择 PDF 文件或拖放到这里。',
    uploadMultipleTitle: '上传报价 PDF',
    uploadMultipleHelp: '请选择 2 到 5 个 PDF 文件。',
    uploadedFilesTitle: '已上传文件',
    uploadedFilesEmpty: '点击上传文件，或将文件拖放到这里。',
    selectedFirst: '报价 1',
    selectedSecond: '报价 2',
    analyze: '开始比较分析',
    analyzingTitle: '正在分析报价',
    analyzingCopy: 'QuoteWise 正在对齐项目、检查价格差异，并准备可用于决策的摘要。',
    results: '结果',
    resultsTitle: '报价 B 更有优势',
    resultsCopy: '报价 B 总体成本更低，并且在安装费用和支持费用方面更有优势。报价 A 仅在显示器项目上更便宜。',
    totalSavings: '预计节省',
    matchedLineDelta: '匹配项目差额',
    matchedLinesLower: '个匹配项目价格更低',
    coverageItemsHelper: '仅出现在一份报价中的项目',
    recommendedVendor: '推荐报价',
    matchedItems: '匹配项目',
    coverageGaps: '范围差异',
    keyInsights: '关键洞察',
    quoteA: '报价 A',
    quoteB: '报价 B',
    delta: '差异',
    differentBasis: '计价基准不同',
    onlyInA: '仅 A 包含',
    onlyInB: '仅 B 包含',
    summary: '摘要',
    newComparison: '新建比较',
    reportTitle: '详细分析报告',
    reportCopy: '下载包含建议、项目比较、范围差异和计价基准说明的 PDF 报告。',
    reportDownload: '下载 PDF',
    reportPreparedBy: '由 QuoteWise 生成',
    pdfError: '只能上传 PDF 文件。',
    login: '登录',
    account: '账户',
    loginTitle: '继续使用 Google',
    loginCopy: '使用 Google 登录，以便保存并重新查看你的报价比较。',
    logout: '退出登录',
    loggedInAs: '当前登录账户',
    googleLoginUnavailable: '请添加 Supabase 设置并启用 Google Provider 后再使用 Google 登录。',
    googleLoginLoading: '正在加载 Google 登录...',
    googleLoginError: '无法完成 Google 登录。请重试。',
    emailLoginTitle: '或使用邮箱',
    emailLabel: '邮箱',
    emailPlaceholder: 'you@company.com',
    passwordLabel: '密码',
    passwordPlaceholder: '至少 6 个字符',
    confirmPasswordLabel: '确认密码',
    passwordMismatch: '两次输入的密码不一致。',
    emailLoginSubmit: '使用邮箱登录',
    emailSignupSubmit: '创建账户',
    emailAuthUnavailable: '请添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 以启用邮箱登录。',
    emailAuthSuccess: '请查看邮箱以确认你的账户。',
    emailVerificationRequired: '请先完成邮箱验证，才能使用历史记录和 PDF 下载。',
    emailAuthError: '邮箱认证失败。请检查信息后重试。',
    historyTitle: '历史功能即将推出',
    historyCopy: '连接项目存储后，你之前的比较报告会显示在这里。',
    insightItems: [
      '按匹配项目计算，报价 B 可节省 $190。',
      '显示器项目是报价 A 唯一更便宜的项目。',
      '线缆整理套件仅包含在报价 A 中。',
      '优先配送仅包含在报价 B 中，批准前需要确认。',
      '原材料运费使用不同计价基准，最终比较前需要标准化。',
    ],
    features: [
      {
        title: '审慎提取',
        copy: '我们解析供应商、项目、数量、单价、总价、交付和付款条款，即使不同报价使用不同表述。',
      },
      {
        title: '逐项并排比较',
        copy: '系统会匹配两份文件中的项目并突出差异，让你快速看出每家供应商的优势。',
      },
      {
        title: '洞察，而不是噪音',
        copy: '除了表格，系统还会用简短的执行摘要指出价格、条款和风险中的关键差异。',
      },
    ],
  },
} satisfies Record<Language, Record<string, unknown>>;

const accountLabels = {
  en: {
    profileTab: 'Profile',
    historyTab: 'History',
    accountInfo: 'Account information',
    emailAddress: 'Email address',
    signInMethod: 'Sign-in method',
    accountStatus: 'Account status',
    accountStatusActive: 'Active',
    personalInfo: 'Personal details',
    displayName: 'Display name',
    company: 'Company',
    role: 'Role',
    phone: 'Phone',
    profileSavedLocally: 'Saved locally for now. Supabase profile storage comes next.',
    historyPreviewTitle: 'Comparison history',
    historyPreviewCopy: 'Saved comparison reports will appear here after the history database is connected.',
    historyPreviewEmpty: 'No saved comparisons yet.',
    loginHeading: 'Login',
    createAccountHeading: 'Create account',
    createAccountCopy: 'Create a QuoteWise account to save profile details and prepare comparison history.',
    googleLoginSection: 'Continue with Google',
    backToLogin: 'Back to login',
    alreadyHaveAccount: 'Already have an account?',
    termsAgreement: 'I agree to the',
    termsLink: 'Terms of Service',
    termsAndPrivacy: 'and Privacy Policy.',
  },
  ko: {
    profileTab: '프로필',
    historyTab: '히스토리',
    accountInfo: '계정 정보',
    emailAddress: '이메일 주소',
    signInMethod: '로그인 방식',
    accountStatus: '계정 상태',
    accountStatusActive: '활성',
    accountStatusUnverified: '이메일 인증 필요',
    personalInfo: '개인정보',
    displayName: '표시 이름',
    company: '회사',
    role: '직무',
    phone: '연락처',
    profileSavedLocally: '현재는 로컬에 임시 저장됩니다. 다음 단계에서 Supabase 프로필 저장소와 연결합니다.',
    historyPreviewTitle: '비교 히스토리',
    historyPreviewCopy: '히스토리 데이터베이스를 연결하면 저장된 비교 리포트가 여기에 표시됩니다.',
    historyPreviewEmpty: '아직 저장된 비교 기록이 없습니다.',
    loginHeading: '로그인',
    createAccountHeading: '계정 만들기',
    createAccountCopy: '프로필 정보와 비교 히스토리를 저장할 수 있도록 QuoteWise 계정을 만드세요.',
    googleLoginSection: 'Google로 계속하기',
    backToLogin: '로그인으로 돌아가기',
    alreadyHaveAccount: '이미 계정이 있나요?',
    termsAgreement: '다음에 동의합니다:',
    termsLink: '이용약관',
    termsAndPrivacy: '및 개인정보 처리방침',
  },
  ja: {
    profileTab: 'プロフィール',
    historyTab: '履歴',
    accountInfo: 'アカウント情報',
    emailAddress: 'メールアドレス',
    signInMethod: 'ログイン方法',
    accountStatus: 'アカウント状態',
    accountStatusActive: '有効',
    accountStatusUnverified: 'メール認証が必要です',
    personalInfo: '個人情報',
    displayName: '表示名',
    company: '会社',
    role: '役割',
    phone: '電話番号',
    profileSavedLocally: '現在はローカルに一時保存されます。次の段階で Supabase のプロフィール保存に接続します。',
    historyPreviewTitle: '比較履歴',
    historyPreviewCopy: '履歴データベースを接続すると、保存済みの比較レポートがここに表示されます。',
    historyPreviewEmpty: '保存された比較はまだありません。',
    loginHeading: 'ログイン',
    createAccountHeading: 'アカウント作成',
    createAccountCopy: 'プロフィール情報と比較履歴を保存できる QuoteWise アカウントを作成します。',
    googleLoginSection: 'Googleで続行',
    backToLogin: 'ログインに戻る',
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？',
    termsAgreement: '以下に同意します:',
    termsLink: '利用規約',
    termsAndPrivacy: 'およびプライバシーポリシー',
  },
  zh: {
    profileTab: '资料',
    historyTab: '历史',
    accountInfo: '账户信息',
    emailAddress: '邮箱地址',
    signInMethod: '登录方式',
    accountStatus: '账户状态',
    accountStatusActive: '已启用',
    accountStatusUnverified: '需要邮箱验证',
    personalInfo: '个人信息',
    displayName: '显示名称',
    company: '公司',
    role: '职位',
    phone: '电话',
    profileSavedLocally: '当前暂时保存在本地。下一步会连接 Supabase 资料存储。',
    historyPreviewTitle: '比较历史',
    historyPreviewCopy: '连接历史数据库后，已保存的比较报告会显示在这里。',
    historyPreviewEmpty: '暂无保存的比较记录。',
    loginHeading: '登录',
    createAccountHeading: '创建账户',
    createAccountCopy: '创建 QuoteWise 账户，以保存资料并准备比较历史。',
    googleLoginSection: '继续使用 Google',
    backToLogin: '返回登录',
    alreadyHaveAccount: '已有账户？',
    termsAgreement: '我同意',
    termsLink: '服务条款',
    termsAndPrivacy: '和隐私政策。',
  },
} satisfies Record<Language, Record<string, string>>;

const previewRows = [
  { item: 'Workstation', quoteA: '$2,400', quoteB: '$2,280', delta: '-120', tone: 'text-emerald-600' },
  { item: 'Display 27"', quoteA: '$580', quoteB: '$620', delta: '+40', tone: 'text-rose-600' },
  { item: 'Onsite setup', quoteA: '$200', quoteB: '$150', delta: '-50', tone: 'text-emerald-600' },
  { item: '3-yr support', quoteA: '$720', quoteB: '$690', delta: '-30', tone: 'text-emerald-600' },
];

const featureIcons = [FileSearch, Layers3, Sparkles];

const resultRows = [
  {
    item: 'Workstation',
    quoteA: '$2,400',
    quoteB: '$2,280',
    delta: '-$120',
    note: 'Quote B is lower with equivalent workstation specs.',
    notes: {
      en: 'Quote B is lower with equivalent workstation specs.',
      ko: '동등한 워크스테이션 사양 기준으로 견적 B가 더 저렴합니다.',
      ja: '同等のワークステーション仕様では見積 Bの方が低価格です。',
      zh: '在同等工作站规格下，报价 B 更低。',
    },
    tone: 'text-emerald-600',
  },
  {
    item: 'Display 27"',
    quoteA: '$580',
    quoteB: '$620',
    delta: '+$40',
    note: 'Quote A is cheaper for the display line.',
    notes: {
      en: 'Quote A is cheaper for the display line.',
      ko: '디스플레이 항목은 견적 A가 더 저렴합니다.',
      ja: 'ディスプレイ項目は見積 Aの方が安価です。',
      zh: '显示器项目中，报价 A 更便宜。',
    },
    tone: 'text-rose-600',
  },
  {
    item: 'Onsite setup',
    quoteA: '$200',
    quoteB: '$150',
    delta: '-$50',
    note: 'Quote B reduces implementation cost.',
    notes: {
      en: 'Quote B reduces implementation cost.',
      ko: '견적 B가 설치/구현 비용을 낮춥니다.',
      ja: '見積 Bは導入コストを抑えます。',
      zh: '报价 B 降低了实施成本。',
    },
    tone: 'text-emerald-600',
  },
  {
    item: '3-yr support',
    quoteA: '$720',
    quoteB: '$690',
    delta: '-$30',
    note: 'Quote B offers lower support pricing.',
    notes: {
      en: 'Quote B offers lower support pricing.',
      ko: '견적 B의 지원 비용이 더 낮습니다.',
      ja: '見積 Bのサポート価格がより低くなっています。',
      zh: '报价 B 的支持费用更低。',
    },
    tone: 'text-emerald-600',
  },
  {
    item: 'Cable management kit',
    quoteA: '$180',
    quoteB: 'Not included',
    delta: 'Only in A',
    deltaKey: 'onlyInA',
    note: 'Quote A includes this installation accessory as a separate line item.',
    notes: {
      en: 'Quote A includes this installation accessory as a separate line item.',
      ko: '견적 A에는 이 설치 부속품이 별도 항목으로 포함되어 있습니다.',
      ja: '見積 Aにはこの設置付属品が別明細として含まれています。',
      zh: '报价 A 将该安装配件作为单独项目列出。',
    },
    tone: 'text-amber-600',
  },
  {
    item: 'Priority delivery',
    quoteA: 'Not included',
    quoteB: '$95',
    delta: 'Only in B',
    deltaKey: 'onlyInB',
    note: 'Quote B includes priority delivery as a separate charge.',
    notes: {
      en: 'Quote B includes priority delivery as a separate charge.',
      ko: '견적 B에는 우선 배송이 별도 비용으로 포함되어 있습니다.',
      ja: '見積 Bには優先配送が別料金として含まれています。',
      zh: '报价 B 将优先配送作为单独费用列出。',
    },
    tone: 'text-blue-600',
  },
  {
    item: 'Raw material freight',
    quoteA: '$12 / kg',
    quoteB: '$300 fixed',
    delta: 'basis',
    note: 'Quote A prices freight by weight, while Quote B uses a fixed freight charge.',
    notes: {
      en: 'Quote A prices freight by weight, while Quote B uses a fixed freight charge.',
      ko: '견적 A는 중량 기준 운송비이고, 견적 B는 고정 운송비입니다.',
      ja: '見積 Aは重量基準の運送費で、見積 Bは固定運送費です。',
      zh: '报价 A 按重量计算运费，而报价 B 使用固定运费。',
    },
    tone: 'text-slate-700',
    color: '#DB2777',
    basis: 'different',
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<AccountTab>('profile');
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    displayName: '',
    company: '',
    role: '',
    phone: '',
  });
  const [googleError, setGoogleError] = useState('');
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [emailAuthEmail, setEmailAuthEmail] = useState('');
  const [emailAuthPassword, setEmailAuthPassword] = useState('');
  const [emailAuthError, setEmailAuthError] = useState('');
  const [emailAuthMessage, setEmailAuthMessage] = useState('');
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [isComparisonUploadLoading, setIsComparisonUploadLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<QuoteAnalysis | null>(null);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('uploading');
  const file1 = uploadedFiles[0] || null;
  const file2 = uploadedFiles[1] || null;
  const t = copy[language];
  const accountText = accountLabels[language];

  useEffect(() => {
    if (!supabaseClient) {
      return undefined;
    }

    const cleanAuthUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    };

    const applySession = (session: Awaited<ReturnType<typeof supabaseClient.auth.getSession>>['data']['session']) => {
      if (session?.user.email) {
        const signedInUser = createSupabaseUserSession(session.user);
        setCurrentUser(signedInUser);
        window.localStorage.setItem(authStorageKey, JSON.stringify(signedInUser));
        setGoogleError('');
        setEmailAuthError('');
        setIsLoginOpen(false);
      }
    };

    void (async () => {
      const authParams = new URLSearchParams(window.location.search);
      const authCode = authParams.get('code');
      const authError = authParams.get('error_description') || authParams.get('error');

      if (authError) {
        setGoogleError(authError);
        setIsLoginOpen(true);
        cleanAuthUrl();
        return;
      }

      if (authCode) {
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(authCode);

        if (error) {
          setGoogleError(error.message || t.googleLoginError);
          setIsLoginOpen(true);
        } else {
          applySession(data.session);
        }

        cleanAuthUrl();
        return;
      }

      const { data } = await supabaseClient.auth.getSession();
      applySession(data.session);
    })();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [t.googleLoginError]);

  useEffect(() => {
    const savedUser = window.localStorage.getItem(authStorageKey);

    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as UserSession;
      if (parsedUser.provider === 'google' && parsedUser.name && parsedUser.email) {
        setCurrentUser({ ...parsedUser, emailVerified: parsedUser.emailVerified ?? true });
      } else {
        window.localStorage.removeItem(authStorageKey);
      }
    } catch {
      window.localStorage.removeItem(authStorageKey);
    }
  }, []);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(profileStorageKey);

    if (!savedProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as Partial<ProfileSettings>;
      setProfileSettings({
        displayName: parsedProfile.displayName || '',
        company: parsedProfile.company || '',
        role: parsedProfile.role || '',
        phone: parsedProfile.phone || '',
      });
    } catch {
      window.localStorage.removeItem(profileStorageKey);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAccountTab('profile');
      return;
    }

    setProfileSettings((previousProfile) => {
      if (previousProfile.displayName) {
        return previousProfile;
      }

      const nextProfile = {
        ...previousProfile,
        displayName: currentUser.name,
      };
      window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      return nextProfile;
    });
  }, [currentUser]);

  useEffect(() => {
    if (activeView !== 'analyzing') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setActiveView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [activeView]);

  const showCompare = () => {
    setErrorMessage('');
    setCurrentAnalysis(null);
    setActiveView('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHome = () => {
    setErrorMessage('');
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHistory = () => {
    if (!currentUser) {
      openLogin();
      return;
    }

    if (!currentUser.emailVerified) {
      setEmailAuthMessage(t.emailVerificationRequired);
      setIsLoginOpen(true);
      return;
    }

    setActiveView('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showTerms = () => {
    setIsLoginOpen(false);
    setActiveView('terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as Language;
    setLanguage(nextLanguage);
    setErrorMessage('');
    setGoogleError('');
    setEmailAuthError('');
    setEmailAuthMessage('');
  };

  const openLogin = () => {
    setGoogleError('');
    setEmailAuthError('');
    setEmailAuthMessage('');
    setAccountTab('profile');
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setGoogleError('');
    setEmailAuthError('');
    setEmailAuthMessage('');
  };

  const handleGoogleLogin = async () => {
    if (!supabaseClient) {
      setGoogleError(t.googleLoginUnavailable);
      return;
    }

    setIsGoogleAuthLoading(true);
    setGoogleError('');

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    setIsGoogleAuthLoading(false);

    if (error) {
      setGoogleError(error.message || t.googleLoginError);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseClient) {
      setEmailAuthError(t.emailAuthUnavailable);
      return;
    }

    setIsEmailAuthLoading(true);
    setEmailAuthError('');
    setEmailAuthMessage('');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailAuthEmail.trim(),
      password: emailAuthPassword,
    });

    setIsEmailAuthLoading(false);

    if (error || !data.user?.email) {
      setEmailAuthError(error?.message || t.emailAuthError);
      return;
    }

    setCurrentUser(createSupabaseUserSession(data.user));
    window.localStorage.removeItem(authStorageKey);
    setIsLoginOpen(false);
  };

  const handleEmailSignup = async (metadata: EmailSignupMetadata) => {
    if (!supabaseClient) {
      setEmailAuthError(t.emailAuthUnavailable);
      return;
    }

    setIsEmailAuthLoading(true);
    setEmailAuthError('');
    setEmailAuthMessage('');

    const { data, error } = await supabaseClient.auth.signUp({
      email: emailAuthEmail.trim(),
      password: metadata.password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        data: {
          full_name: metadata?.displayName?.trim() || undefined,
          company: metadata?.company?.trim() || undefined,
        },
      },
    });

    setIsEmailAuthLoading(false);

    if (error) {
      setEmailAuthError(error.message || t.emailAuthError);
      return;
    }

    if (data.user && data.session) {
      const signedUpUser = createSupabaseUserSession(data.user);

      if (signedUpUser.emailVerified) {
        setCurrentUser(signedUpUser);
        setIsLoginOpen(false);
        return;
      }

      setEmailAuthMessage(t.emailAuthSuccess);
      return;
    }

    setEmailAuthMessage(t.emailAuthSuccess);
  };

  const handleLogout = async () => {
    await supabaseClient?.auth.signOut();
    setCurrentUser(null);
    setAccountTab('profile');
    window.localStorage.removeItem(authStorageKey);
    setIsLoginOpen(false);
  };

  const handleProfileChange = (field: keyof ProfileSettings, value: string) => {
    setProfileSettings((previousProfile) => {
      const nextProfile = {
        ...previousProfile,
        [field]: value,
      };
      window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      return nextProfile;
    });
  };

  const addUploadedFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    const hasNonPdf = selectedFiles.some(
      (file) => file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'),
    );

    if (hasNonPdf) {
      setErrorMessage(t.pdfError);
      return;
    }

    setUploadedFiles((currentFiles) => {
      const nextFiles = [...currentFiles];

      selectedFiles.forEach((file) => {
        const alreadySelected = nextFiles.some(
          (selectedFile) =>
            selectedFile.name === file.name &&
            selectedFile.size === file.size &&
            selectedFile.lastModified === file.lastModified,
        );

        if (!alreadySelected && nextFiles.length < 5) {
          nextFiles.push(file);
        }
      });

      const reachedLimit = currentFiles.length + selectedFiles.length > 5;

      if (reachedLimit) {
        setErrorMessage('You can upload up to 5 PDF files.');
      } else {
        setErrorMessage('');
      }

      return nextFiles;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    addUploadedFiles(selectedFiles);
    event.target.value = '';
  };

  const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    addUploadedFiles(Array.from(event.dataTransfer.files || []));
  };

  const handleRemoveUploadedFile = (indexToRemove: number) => {
    setErrorMessage('');
    setUploadedFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length < 2 || uploadedFiles.length > 5 || isComparisonUploadLoading) {
      return;
    }

    if (!supabaseClient) {
      setErrorMessage('Supabase is not configured yet.');
      return;
    }

    setIsComparisonUploadLoading(true);
    setErrorMessage('');
    setAnalysisStage('uploading');
    setActiveView('analyzing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const stageTimers = [
      window.setTimeout(() => setAnalysisStage('cache'), 700),
      window.setTimeout(() => setAnalysisStage('extracting'), 1800),
      window.setTimeout(() => setAnalysisStage('comparing'), 5200),
      window.setTimeout(() => setAnalysisStage('finalizing'), 9800),
    ];

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append('quoteFiles', file);
    });
    formData.append('language', language);

    try {
      const { data, error } = await supabaseClient.functions.invoke<CreateComparisonJobResponse>(
        'create-comparison-job',
        {
          body: formData,
        },
      );

      if (error || !data?.jobId) {
        setErrorMessage(error?.message || 'Failed to upload quotation files.');
        setCurrentAnalysis(null);
        setActiveView('results');
        return;
      }

      setAnalysisStage(data.cacheHit ? 'cache' : 'finalizing');
      setCurrentAnalysis(data.analysis || null);
      console.log('Comparison job created:', data.jobId);
      setActiveView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload quotation files.');
      setCurrentAnalysis(null);
      setActiveView('results');
    } finally {
      stageTimers.forEach((timer) => window.clearTimeout(timer));
      setIsComparisonUploadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#10243f]">
      <header className="sticky top-0 z-20 border-b border-[#dbe5f1] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={showHome}
            className="flex cursor-pointer items-center border-0 bg-transparent p-0"
            aria-label="Go to QuoteWise home"
          >
            <Logo className="h-14 w-auto" />
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={showHome}
              className={`relative inline-flex h-10 cursor-pointer items-center border-0 bg-transparent px-0 text-sm font-bold tracking-[0.01em] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-[#2563eb] after:transition-all ${
                activeView === 'home'
                  ? 'text-[#1e3a5f] after:w-full'
                  : 'text-slate-500 after:w-0 hover:text-[#1e3a5f] hover:after:w-full'
              }`}
            >
              {t.home}
            </button>
            <button
              type="button"
              onClick={showCompare}
              className={`relative inline-flex h-10 cursor-pointer items-center border-0 bg-transparent px-0 text-sm font-bold tracking-[0.01em] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-[#2563eb] after:transition-all ${
                ['compare', 'analyzing', 'results'].includes(activeView)
                  ? 'text-[#1e3a5f] after:w-full'
                  : 'text-slate-500 after:w-0 hover:text-[#1e3a5f] hover:after:w-full'
              }`}
            >
              {t.compare}
            </button>
            <button
              type="button"
              onClick={showHistory}
              className={`relative inline-flex h-10 cursor-pointer items-center border-0 bg-transparent px-0 text-sm font-bold tracking-[0.01em] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-[#2563eb] after:transition-all ${
                activeView === 'history'
                  ? 'text-[#1e3a5f] after:w-full'
                  : 'text-slate-500 after:w-0 hover:text-[#1e3a5f] hover:after:w-full'
              }`}
            >
              {t.history}
            </button>
          </nav>

          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <label className="hidden items-center gap-2 sm:flex">
              <select
                value={language}
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="cursor-pointer rounded-md border border-transparent bg-transparent px-1 py-1 font-semibold text-slate-600 outline-none transition-colors hover:border-[#c8d7eb] focus:border-[#2563eb] focus:bg-white"
              >
                {orderedLanguages.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.short} · {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#c8d7eb] bg-white px-4 font-semibold text-[#10243f] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              <User className="h-4 w-4" />
              <span>{currentUser?.name || t.login}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeView === 'home' ? (
          <>
            <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr_0.95fr] md:px-8 md:py-24">
              <div>
                <div className="mb-8 inline-flex items-center rounded-full border border-[#bfd1e8] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#2563eb]">
                  {t.eyebrow}
                </div>
                <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] text-[#10243f] md:text-7xl">
                  {t.headline[0]}
                  <br />
                  {t.headline[1]}
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">{t.lead}</p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={showCompare}
                    endIcon={<ArrowRight className="h-5 w-5" />}
                    sx={{
                      px: 3,
                      py: 1.4,
                      backgroundColor: '#1e3a5f',
                      borderRadius: '10px',
                      boxShadow: '0 14px 30px rgba(30, 58, 95, 0.22)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#2563eb' },
                    }}
                  >
                    {t.start}
                  </Button>
                  <button
                    type="button"
                    onClick={showHistory}
                    className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent px-5 text-base font-semibold text-[#10243f] transition-colors hover:text-[#2563eb]"
                  >
                    {t.viewHistory}
                  </button>
                </div>
              </div>

              <ComparisonPreview
                headers={t.previewHeaders}
                recommendation={t.recommendation}
                recommendationValue={t.recommendationValue}
              />
            </section>

            <section className="border-t border-[#dbe5f1] bg-white/58">
              <div className="mx-auto grid max-w-7xl gap-6 px-5 py-16 md:grid-cols-3 md:px-8 md:py-20">
                {t.features.map((feature, index) => {
                  const Icon = featureIcons[index];
                  return (
                    <article
                      key={feature.title}
                      className="rounded-lg border border-[#dbe5f1] bg-white p-8 shadow-[0_18px_42px_rgba(15,35,65,0.06)]"
                    >
                      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full border border-[#c8d7eb] bg-[#f8fbff] text-[#2563eb]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mb-4 text-xl font-semibold text-[#10243f]">{feature.title}</h2>
                      <p className="text-sm leading-7 text-slate-600">{feature.copy}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {activeView === 'compare' ? (
          <UploadSection
            t={t}
            files={uploadedFiles}
            errorMessage={errorMessage}
            isUploading={isComparisonUploadLoading}
            onFileUpload={handleFileUpload}
            onFileDrop={handleFileDrop}
            onRemoveFile={handleRemoveUploadedFile}
            onAnalyze={handleAnalyze}
          />
        ) : null}

        {activeView === 'analyzing' ? <AnalyzingSection t={t} language={language} stage={analysisStage} /> : null}

        {activeView === 'results' ? (
          <ResultsSection
            t={t}
            language={language}
            files={uploadedFiles}
            analysis={currentAnalysis}
            errorMessage={errorMessage}
            currentUser={currentUser}
            onRequireVerifiedEmail={() => {
              if (!currentUser) {
                openLogin();
                return;
              }

              setEmailAuthMessage(t.emailVerificationRequired);
              setIsLoginOpen(true);
            }}
            onNewComparison={showCompare}
          />
        ) : null}

        {activeView === 'history' ? <HistorySection t={t} onStartComparison={showCompare} /> : null}

        {activeView === 'terms' ? <TermsSection language={language} onBack={showHome} /> : null}
      </main>

      {isLoginOpen ? (
        <LoginModal
          t={t}
          labels={accountText}
          currentUser={currentUser}
          activeTab={accountTab}
          profileSettings={profileSettings}
          isGoogleAuthAvailable={Boolean(supabaseClient)}
          isGoogleLoading={isGoogleAuthLoading}
          googleError={googleError}
          onGoogleLogin={handleGoogleLogin}
          isEmailAuthAvailable={Boolean(supabaseClient)}
          email={emailAuthEmail}
          password={emailAuthPassword}
          emailError={emailAuthError}
          emailMessage={emailAuthMessage}
          isEmailLoading={isEmailAuthLoading}
          onEmailChange={setEmailAuthEmail}
          onPasswordChange={setEmailAuthPassword}
          onEmailLogin={handleEmailLogin}
          onEmailSignup={handleEmailSignup}
          onTabChange={setAccountTab}
          onProfileChange={handleProfileChange}
          onTermsOpen={showTerms}
          onClose={closeLogin}
          onLogout={handleLogout}
        />
      ) : null}
    </div>
  );
}

function createSupabaseUserSession(user: {
  email?: string;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): UserSession {
  const email = user.email || '';
  const provider = user.app_metadata?.provider === 'google' ? 'google' : 'email';
  const name =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : email.split('@')[0] || email;
  const picture =
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === 'string'
        ? user.user_metadata.picture
        : undefined;

  return {
    name,
    email,
    picture,
    provider,
    emailVerified: provider === 'google' || Boolean(user.email_confirmed_at),
  };
}

function LoginModal({
  t,
  labels,
  currentUser,
  activeTab,
  profileSettings,
  isGoogleAuthAvailable,
  isGoogleLoading,
  googleError,
  onGoogleLogin,
  isEmailAuthAvailable,
  email,
  password,
  emailError,
  emailMessage,
  isEmailLoading,
  onEmailChange,
  onPasswordChange,
  onEmailLogin,
  onEmailSignup,
  onTabChange,
  onProfileChange,
  onTermsOpen,
  onClose,
  onLogout,
}: {
  t: (typeof copy)[Language];
  labels: (typeof accountLabels)[Language];
  currentUser: UserSession | null;
  activeTab: AccountTab;
  profileSettings: ProfileSettings;
  isGoogleAuthAvailable: boolean;
  isGoogleLoading: boolean;
  googleError: string;
  onGoogleLogin: () => void;
  isEmailAuthAvailable: boolean;
  email: string;
  password: string;
  emailError: string;
  emailMessage: string;
  isEmailLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onEmailSignup: (metadata: EmailSignupMetadata) => void;
  onTabChange: (tab: AccountTab) => void;
  onProfileChange: (field: keyof ProfileSettings, value: string) => void;
  onTermsOpen: () => void;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const isLoginDisabled = isGoogleLoading || isEmailLoading;
  const isSignupDisabled =
    !hasAcceptedTerms ||
    !signupName.trim() ||
    !email.trim() ||
    signupPassword.length < 6 ||
    signupPassword !== signupConfirmPassword ||
    isEmailLoading;
  const authHeading =
    currentUser ? t.account : authMode === 'signup' ? labels.createAccountHeading : labels.loginHeading;
  const authCopy = currentUser ? currentUser.email : authMode === 'signup' ? labels.createAccountCopy : t.loginCopy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243f]/40 px-5 backdrop-blur-sm">
      <div
        className={`w-full rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_28px_80px_rgba(15,35,65,0.22)] ${
          currentUser ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">{t.account}</p>
            <h2 className="text-2xl font-semibold text-[#10243f]">
              {authHeading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{authCopy}</p>
            {!currentUser && authMode === 'signup' ? (
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#dbe5f1] bg-[#f8fbff] px-3 py-3 text-[13px] leading-5 text-slate-600 sm:text-sm">
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(event) => setHasAcceptedTerms(event.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#c8d7eb] accent-[#2563eb]"
                />
                <span className="whitespace-nowrap">
                  {labels.termsAgreement}{' '}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onTermsOpen();
                    }}
                    className="cursor-pointer border-0 bg-transparent p-0 font-bold text-[#2563eb] hover:text-[#1e3a5f]"
                  >
                    {labels.termsLink}
                  </button>{' '}
                  {labels.termsAndPrivacy}
                </span>
              </label>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login dialog"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#dbe5f1] bg-white text-slate-500 transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {currentUser ? (
          <div className="mb-5">
            {!currentUser.emailVerified ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                {t.emailVerificationRequired}
              </p>
            ) : null}
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[#dbe5f1] bg-[#f8fbff] p-1">
              {(['profile', 'history'] as AccountTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${
                    activeTab === tab ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-slate-500 hover:text-[#2563eb]'
                  }`}
                >
                  {tab === 'profile' ? <Settings className="h-4 w-4" /> : <History className="h-4 w-4" />}
                  {tab === 'profile' ? labels.profileTab : labels.historyTab}
                </button>
              ))}
            </div>

            {activeTab === 'profile' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t.loggedInAs}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {currentUser.picture ? (
                      <img
                        src={currentUser.picture}
                        alt=""
                        className="h-12 w-12 rounded-full border border-[#dbe5f1] bg-white"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#10243f]">{profileSettings.displayName || currentUser.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[#dbe5f1] bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-[#10243f]">{labels.accountInfo}</p>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{labels.emailAddress}</dt>
                        <dd className="mt-1 font-semibold text-[#1e3a5f]">{currentUser.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{labels.signInMethod}</dt>
                        <dd className="mt-1 font-semibold capitalize text-[#1e3a5f]">{currentUser.provider}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{labels.accountStatus}</dt>
                        <dd
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            currentUser.emailVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {currentUser.emailVerified ? labels.accountStatusActive : labels.accountStatusUnverified}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-[#dbe5f1] bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-[#10243f]">{labels.personalInfo}</p>
                    <div className="space-y-3">
                      {([
                        ['displayName', labels.displayName],
                        ['company', labels.company],
                        ['role', labels.role],
                        ['phone', labels.phone],
                      ] as Array<[keyof ProfileSettings, string]>).map(([field, label]) => (
                        <label key={field} className="block">
                          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            {label}
                          </span>
                          <input
                            type="text"
                            value={profileSettings[field]}
                            onChange={(event) => onProfileChange(field, event.target.value)}
                            className="h-10 w-full rounded-lg border border-[#c8d7eb] bg-white px-3 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                          />
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{labels.profileSavedLocally}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#dbe5f1] bg-[#f8fbff] p-5">
                <p className="text-sm font-bold text-[#10243f]">{labels.historyPreviewTitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{labels.historyPreviewCopy}</p>
                <div className="mt-4 rounded-lg border border-dashed border-[#c8d7eb] bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
                  {labels.historyPreviewEmpty}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="space-y-4">
          {currentUser ? (
            <Button
              type="button"
              variant="outlined"
              onClick={onLogout}
              fullWidth
              sx={{
                py: 1.25,
                borderColor: '#c8d7eb',
                borderRadius: '10px',
                color: '#1e3a5f',
                cursor: 'pointer',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              {t.logout}
            </Button>
          ) : (
            <>
          {authMode === 'login' ? (
            <>
              {isGoogleAuthAvailable ? (
            <Button
              type="button"
              variant="outlined"
              fullWidth
              disabled={isLoginDisabled}
              onClick={onGoogleLogin}
              startIcon={<GoogleLogo />}
              sx={{
                py: 1.25,
                borderColor: '#c8d7eb',
                borderRadius: '10px',
                color: '#1e3a5f',
                cursor: isLoginDisabled ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              {isGoogleLoading ? t.googleLoginLoading : labels.googleLoginSection}
            </Button>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {t.googleLoginUnavailable}
            </p>
          )}

          {googleError ? <p className="text-sm font-semibold text-rose-600">{googleError}</p> : null}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#dbe5f1]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{t.emailLoginTitle}</span>
            <div className="h-px flex-1 bg-[#dbe5f1]" />
          </div>

          {isEmailAuthAvailable ? (
            <form onSubmit={onEmailLogin} className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">{t.emailLabel}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">{t.passwordLabel}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              {emailError ? <p className="text-sm font-semibold text-rose-600">{emailError}</p> : null}
              {emailMessage ? <p className="text-sm font-semibold text-emerald-600">{emailMessage}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoginDisabled}
                  sx={{
                    py: 1.15,
                    backgroundColor: '#1e3a5f',
                    borderRadius: '10px',
                    cursor: isLoginDisabled ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#2563eb' },
                    '&.Mui-disabled': {
                      backgroundColor: '#cbd5e1',
                      color: '#ffffff',
                    },
                  }}
                >
                  {t.emailLoginSubmit}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={isEmailLoading}
                  onClick={() => {
                    setAuthMode('signup');
                    setHasAcceptedTerms(false);
                    setSignupPassword('');
                    setSignupConfirmPassword('');
                  }}
                  sx={{
                    py: 1.15,
                    borderColor: '#c8d7eb',
                    borderRadius: '10px',
                    color: '#1e3a5f',
                    cursor: isEmailLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#2563eb',
                      backgroundColor: '#eff6ff',
                    },
                  }}
                >
                  {t.emailSignupSubmit}
                </Button>
              </div>
            </form>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {t.emailAuthUnavailable}
            </p>
          )}
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onEmailSignup({ displayName: signupName, company: signupCompany, password: signupPassword });
              }}
              className="space-y-3"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">
                  {labels.displayName} <span className="text-rose-600">*</span>
                </span>
                <input
                  type="text"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  placeholder="Jane Procurement"
                  required
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">{labels.company}</span>
                <input
                  type="text"
                  value={signupCompany}
                  onChange={(event) => setSignupCompany(event.target.value)}
                  placeholder="Company name"
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">
                  {t.emailLabel} <span className="text-rose-600">*</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">
                  {t.passwordLabel} <span className="text-rose-600">*</span>
                </span>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  required
                  minLength={6}
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#10243f]">
                  {t.confirmPasswordLabel} <span className="text-rose-600">*</span>
                </span>
                <input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(event) => setSignupConfirmPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  required
                  minLength={6}
                  className="h-11 w-full rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-medium text-[#10243f] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2563eb]"
                />
              </label>
              {signupConfirmPassword && signupPassword !== signupConfirmPassword ? (
                <p className="text-sm font-semibold text-rose-600">{t.passwordMismatch}</p>
              ) : null}
              {emailError ? <p className="text-sm font-semibold text-rose-600">{emailError}</p> : null}
              {emailMessage ? <p className="text-sm font-semibold text-emerald-600">{emailMessage}</p> : null}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSignupDisabled}
                sx={{
                  py: 1.15,
                  backgroundColor: '#1e3a5f',
                  borderRadius: '10px',
                  cursor: isSignupDisabled ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#2563eb' },
                  '&.Mui-disabled': {
                    backgroundColor: '#cbd5e1',
                    color: '#ffffff',
                  },
                }}
              >
                {t.emailSignupSubmit}
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span>{labels.alreadyHaveAccount}</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="cursor-pointer font-bold text-[#2563eb] hover:text-[#1e3a5f]"
                >
                  {labels.backToLogin}
                </button>
              </div>
            </form>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const termsSections = [
  {
    title: '1. Description of Service',
    body: [
      'QuoteWise is an AI-powered quote and proposal comparison platform designed to assist users in reviewing, analyzing, and comparing uploaded documents such as quotations, proposals, spreadsheets, and related procurement materials.',
      'The Service may provide:',
    ],
    bullets: [
      'automated comparison tables',
      'pricing analysis',
      'risk indicators',
      'missing item detection',
      'negotiation suggestions',
      'AI-generated summaries',
      'recommendation scores',
      'structured procurement insights',
    ],
    after: [
      'QuoteWise provides analysis and informational support only.',
      'All decisions, evaluations, negotiations, purchases, vendor selections, and business judgments remain solely the responsibility of the user.',
    ],
  },
  {
    title: '2. No Professional Advice',
    body: [
      'QuoteWise is not a legal, accounting, financial, procurement, consulting, or professional advisory service.',
      'The analysis generated by QuoteWise is:',
    ],
    bullets: ['automated', 'AI-generated', 'probabilistic in nature', 'intended for reference purposes only'],
    after: [
      'QuoteWise does not guarantee accuracy, completeness, vendor quality, pricing fairness, legal compliance, business suitability, or procurement outcomes.',
      'Users must independently review and verify all uploaded documents and generated analysis results before making any business or financial decisions.',
      'QuoteWise shall not be liable for any losses, damages, disputes, procurement outcomes, or decisions made based on the Service.',
    ],
  },
  {
    title: '3. Uploaded Files and User Content',
    body: [
      'Users may upload documents including but not limited to PDF files, spreadsheets, images, quotations, proposals, and procurement-related materials, collectively “Uploaded Content”.',
      'Users represent and warrant that:',
    ],
    bullets: [
      'they have the legal right to upload the content',
      'the upload does not violate any law or third-party rights',
      'the content does not contain unlawful or malicious material',
    ],
  },
  {
    title: '4. File Processing and Service Improvement',
    body: [
      'Uploaded Content may be processed, analyzed, temporarily stored, transformed, indexed, or otherwise used by QuoteWise for purposes including but not limited to generating analysis results, improving Service quality, improving AI analysis accuracy, debugging and error prevention, abuse prevention, system monitoring, feature development, analytics, operational maintenance, and internal research related to QuoteWise services.',
      'QuoteWise may retain generated analysis results, extracted text, structured metadata, anonymized or transformed data, and operational logs for service-related purposes.',
      'Where reasonably possible, QuoteWise may remove or anonymize personally identifiable information or company-identifiable information.',
    ],
  },
  {
    title: '5. File Storage Policy',
    body: [
      'QuoteWise does not guarantee permanent storage of Uploaded Content.',
      'Uploaded files may be temporarily cached, processed during analysis, periodically deleted, or removed without notice.',
      'Users are responsible for maintaining their own backups of uploaded documents.',
      'Users should avoid uploading highly confidential information, classified documents, regulated data, trade secrets, or information prohibited from third-party processing unless permitted by applicable law and internal company policies.',
    ],
  },
  {
    title: '6. AI-Generated Output Disclaimer',
    body: [
      'QuoteWise uses artificial intelligence and automated algorithms to analyze uploaded materials.',
      'AI-generated outputs may contain inaccuracies, omit information, incorrectly interpret documents, produce incomplete comparisons, fail to identify risks, or generate misleading or outdated conclusions.',
      'The Service is intended solely as a decision-support tool.',
      'QuoteWise analyzes documents using its algorithms and systems, but all final interpretation, evaluation, procurement decisions, and business judgments are made solely by the user.',
      'Users assume full responsibility for any actions taken based on the generated outputs.',
    ],
  },
  {
    title: '7. Payments and Credits',
    body: [
      'Certain features of the Service may require payment, credits, subscriptions, or usage fees.',
      'Unless otherwise required by applicable law, payments are non-refundable, credits may expire, promotional credits may have restrictions, and pricing may change without notice.',
      'QuoteWise reserves the right to limit, suspend, or revoke usage in cases of abuse, fraud, excessive automated usage, or policy violations.',
    ],
  },
  {
    title: '8. Intellectual Property',
    body: [
      'All rights, title, and interest in the Service, including software, interfaces, branding, designs, algorithms, analysis systems, and generated layouts, remain the exclusive property of QuoteWise or its licensors.',
      'Users retain ownership of their Uploaded Content.',
      'However, by using the Service, users grant QuoteWise a worldwide, non-exclusive, royalty-free license to process, analyze, store, transform, reproduce, and use Uploaded Content as reasonably necessary for operating, maintaining, improving, and developing the Service.',
    ],
  },
  {
    title: '9. Privacy and Security',
    body: [
      'QuoteWise takes commercially reasonable measures to protect user data and system security.',
      'However, no online service can guarantee absolute security.',
      'Users acknowledge and accept the risks associated with transmitting information over the internet.',
    ],
  },
  {
    title: '10. Prohibited Use',
    body: ['Users may not:'],
    bullets: [
      'upload unlawful or infringing material',
      'interfere with system operations',
      'reverse engineer the Service',
      'use automated scraping or abuse mechanisms',
      'upload malware or harmful code',
      'attempt unauthorized access to data or infrastructure',
    ],
    after: ['QuoteWise reserves the right to suspend or terminate access for violations.'],
  },
  {
    title: '11. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, QuoteWise shall not be liable for indirect damages, lost profits, procurement losses, vendor disputes, contract disputes, pricing discrepancies, business interruption, reliance on AI-generated outputs, or inaccurate or incomplete analysis.',
      'Use of the Service is at the user’s sole risk.',
    ],
  },
  {
    title: '12. Changes to Terms',
    body: [
      'QuoteWise may update these Terms at any time.',
      'Continued use of the Service after updated Terms become effective constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '13. Contact',
    body: ['For questions regarding these Terms: support@quotewise.ai'],
  },
];

type TermsSectionData = (typeof termsSections)[number];

const translatedTerms = {
  en: {
    back: 'Back to home',
    label: 'Legal',
    title: 'QuoteWise Terms of Service',
    updated: 'Last Updated: May 25, 2026',
    intro: [
      'Welcome to QuoteWise (“QuoteWise”, “we”, “our”, or “us”).',
      'These Terms of Service (“Terms”) govern your access to and use of the QuoteWise website, applications, AI analysis tools, and related services (collectively, the “Service”).',
      'By accessing or using the Service, you agree to these Terms.',
    ],
    sections: termsSections,
  },
  ko: {
    back: '홈으로 돌아가기',
    label: '법적 고지',
    title: 'QuoteWise 이용약관',
    updated: '최종 업데이트: 2026년 5월 25일',
    intro: [
      'QuoteWise(이하 “QuoteWise”, “당사”, “우리”)에 오신 것을 환영합니다.',
      '본 이용약관(이하 “약관”)은 QuoteWise 웹사이트, 애플리케이션, AI 분석 도구 및 관련 서비스(통칭 “서비스”)에 대한 접근과 이용에 적용됩니다.',
      '서비스에 접근하거나 서비스를 이용함으로써 귀하는 본 약관에 동의합니다.',
    ],
    sections: [
      {
        title: '1. 서비스 설명',
        body: [
          'QuoteWise는 사용자가 견적서, 제안서, 스프레드시트 및 기타 구매 관련 자료와 같은 업로드 문서를 검토, 분석, 비교할 수 있도록 지원하는 AI 기반 견적 및 제안 비교 플랫폼입니다.',
          '서비스는 자동 비교표, 가격 분석, 위험 지표, 누락 항목 탐지, 협상 제안, AI 생성 요약, 추천 점수 및 구조화된 구매 인사이트를 제공할 수 있습니다.',
          'QuoteWise는 분석 및 정보 제공 지원만을 제공합니다. 모든 의사결정, 평가, 협상, 구매, 공급업체 선정 및 사업적 판단은 전적으로 사용자 책임입니다.',
        ],
      },
      {
        title: '2. 전문 자문 아님',
        body: [
          'QuoteWise는 법률, 회계, 재무, 구매, 컨설팅 또는 기타 전문 자문 서비스가 아닙니다.',
          'QuoteWise의 분석은 자동화된 AI 생성 결과이며 확률적 성격을 가지고, 참고 목적으로만 제공됩니다.',
          'QuoteWise는 정확성, 완전성, 공급업체 품질, 가격의 공정성, 법적 준수, 사업 적합성 또는 구매 결과를 보장하지 않습니다. 사용자는 모든 문서와 분석 결과를 독립적으로 검토해야 합니다.',
        ],
      },
      {
        title: '3. 업로드 파일 및 사용자 콘텐츠',
        body: [
          '사용자는 PDF, 스프레드시트, 이미지, 견적서, 제안서 및 구매 관련 자료를 포함한 문서(통칭 “업로드 콘텐츠”)를 업로드할 수 있습니다.',
          '사용자는 콘텐츠를 업로드할 법적 권리가 있으며, 업로드가 법률 또는 제3자의 권리를 침해하지 않고, 불법적이거나 악성인 자료를 포함하지 않음을 진술하고 보증합니다.',
        ],
      },
      {
        title: '4. 파일 처리 및 서비스 개선',
        body: [
          '업로드 콘텐츠는 분석 결과 생성, 서비스 품질 개선, AI 분석 정확도 향상, 디버깅, 오류 방지, 남용 방지, 시스템 모니터링, 기능 개발, 분석, 운영 유지관리 및 QuoteWise 관련 내부 연구를 위해 처리, 분석, 임시 저장, 변환, 색인화 또는 기타 방식으로 사용될 수 있습니다.',
          'QuoteWise는 생성된 분석 결과, 추출 텍스트, 구조화된 메타데이터, 익명화 또는 변환된 데이터 및 운영 로그를 서비스 관련 목적으로 보관할 수 있습니다.',
        ],
      },
      {
        title: '5. 파일 저장 정책',
        body: [
          'QuoteWise는 업로드 콘텐츠의 영구 저장을 보장하지 않습니다. 업로드 파일은 임시 캐시, 분석 중 처리, 정기 삭제 또는 사전 통지 없는 제거의 대상이 될 수 있습니다.',
          '사용자는 업로드 문서의 백업을 직접 유지할 책임이 있으며, 법률과 회사 정책상 허용되지 않는 고도의 기밀 정보, 규제 데이터, 영업비밀 등을 업로드하지 않아야 합니다.',
        ],
      },
      {
        title: '6. AI 생성 결과 면책',
        body: [
          'QuoteWise는 인공지능 및 자동화 알고리즘을 사용하여 업로드 자료를 분석합니다. AI 생성 결과에는 부정확성, 정보 누락, 문서 오해석, 불완전한 비교, 위험 식별 실패 또는 오해의 소지가 있는 결론이 포함될 수 있습니다.',
          '서비스는 의사결정 지원 도구로만 제공됩니다. 최종 해석, 평가, 구매 결정 및 사업적 판단은 전적으로 사용자가 수행하며, 사용자는 생성 결과에 근거한 모든 조치에 책임을 집니다.',
        ],
      },
      {
        title: '7. 결제 및 크레딧',
        body: [
          '서비스의 일부 기능은 결제, 크레딧, 구독 또는 사용료가 필요할 수 있습니다. 관련 법률에서 달리 요구하지 않는 한 결제는 환불되지 않을 수 있고, 크레딧은 만료될 수 있으며, 가격은 사전 통지 없이 변경될 수 있습니다.',
          'QuoteWise는 남용, 사기, 과도한 자동 사용 또는 정책 위반이 있는 경우 사용을 제한, 정지 또는 취소할 권리를 보유합니다.',
        ],
      },
      {
        title: '8. 지식재산권',
        body: [
          '서비스에 대한 모든 권리, 소유권 및 이익은 소프트웨어, 인터페이스, 브랜딩, 디자인, 알고리즘, 분석 시스템 및 생성 레이아웃을 포함하여 QuoteWise 또는 그 라이선스 제공자에게 귀속됩니다.',
          '사용자는 업로드 콘텐츠에 대한 소유권을 유지하지만, 서비스 운영, 유지관리, 개선 및 개발에 필요한 범위에서 QuoteWise가 업로드 콘텐츠를 처리, 분석, 저장, 변환, 복제 및 사용할 수 있는 전 세계적, 비독점적, 무상 라이선스를 부여합니다.',
        ],
      },
      {
        title: '9. 개인정보 및 보안',
        body: [
          'QuoteWise는 사용자 데이터와 시스템 보안을 보호하기 위해 상업적으로 합리적인 조치를 취합니다. 그러나 어떠한 온라인 서비스도 절대적인 보안을 보장할 수 없습니다.',
          '사용자는 인터넷을 통한 정보 전송과 관련된 위험을 인정하고 수락합니다.',
        ],
      },
      {
        title: '10. 금지된 사용',
        body: [
          '사용자는 불법 또는 권리 침해 자료 업로드, 시스템 운영 방해, 서비스 리버스 엔지니어링, 자동 스크래핑 또는 남용 메커니즘 사용, 악성코드 업로드, 데이터 또는 인프라에 대한 무단 접근 시도를 할 수 없습니다.',
          'QuoteWise는 위반 시 접근을 정지하거나 종료할 권리를 보유합니다.',
        ],
      },
      {
        title: '11. 책임 제한',
        body: [
          '법률이 허용하는 최대 범위 내에서 QuoteWise는 간접 손해, 이익 손실, 구매 손실, 공급업체 분쟁, 계약 분쟁, 가격 불일치, 사업 중단, AI 생성 결과에 대한 의존 또는 부정확하거나 불완전한 분석에 대해 책임을 지지 않습니다.',
          '서비스 이용은 전적으로 사용자의 책임하에 이루어집니다.',
        ],
      },
      {
        title: '12. 약관 변경',
        body: ['QuoteWise는 언제든지 본 약관을 업데이트할 수 있습니다. 개정 약관이 효력을 발생한 후 서비스를 계속 이용하는 것은 개정 약관에 동의하는 것으로 간주됩니다.'],
      },
      {
        title: '13. 연락처',
        body: ['본 약관에 관한 문의: support@quotewise.ai'],
      },
    ],
  },
  ja: {
    back: 'ホームに戻る',
    label: '法的情報',
    title: 'QuoteWise 利用規約',
    updated: '最終更新日: 2026年5月25日',
    intro: [
      'QuoteWise（以下「QuoteWise」、「当社」、「私たち」）へようこそ。',
      '本利用規約（以下「本規約」）は、QuoteWise のウェブサイト、アプリケーション、AI分析ツール、および関連サービス（総称して「本サービス」）へのアクセスおよび利用に適用されます。',
      '本サービスにアクセスまたは利用することにより、ユーザーは本規約に同意したものとみなされます。',
    ],
    sections: [
      {
        title: '1. サービスの説明',
        body: [
          'QuoteWise は、見積書、提案書、スプレッドシート、その他調達関連資料などのアップロード文書を確認、分析、比較するための AI 搭載型の見積・提案比較プラットフォームです。',
          '本サービスは、自動比較表、価格分析、リスク指標、不足項目の検出、交渉提案、AI生成要約、推奨スコア、構造化された調達インサイトを提供する場合があります。',
          'QuoteWise は分析および情報提供の支援のみを行います。すべての意思決定、評価、交渉、購入、ベンダー選定、および事業判断はユーザー自身の責任で行われます。',
        ],
      },
      {
        title: '2. 専門的助言ではないこと',
        body: [
          'QuoteWise は、法律、会計、財務、調達、コンサルティング、その他の専門的助言サービスではありません。',
          'QuoteWise が生成する分析は、自動化された AI 生成結果であり、確率的性質を有し、参考目的に限って提供されます。',
          'QuoteWise は、正確性、完全性、ベンダー品質、価格の公正性、法令遵守、事業適合性、または調達結果を保証しません。ユーザーは文書および分析結果を独自に確認する必要があります。',
        ],
      },
      {
        title: '3. アップロードファイルおよびユーザーコンテンツ',
        body: [
          'ユーザーは、PDF、スプレッドシート、画像、見積書、提案書、調達関連資料を含む文書（総称して「アップロードコンテンツ」）をアップロードできます。',
          'ユーザーは、コンテンツをアップロードする法的権利を有し、アップロードが法令または第三者の権利を侵害せず、違法または悪意のある素材を含まないことを表明し保証します。',
        ],
      },
      {
        title: '4. ファイル処理およびサービス改善',
        body: [
          'アップロードコンテンツは、分析結果の生成、サービス品質の改善、AI分析精度の向上、デバッグ、エラー防止、不正利用防止、システム監視、機能開発、分析、運用保守、および QuoteWise 関連の内部研究のために処理、分析、一時保存、変換、索引化、またはその他の方法で使用される場合があります。',
          'QuoteWise は、生成された分析結果、抽出テキスト、構造化メタデータ、匿名化または変換されたデータ、運用ログをサービス関連の目的で保持する場合があります。',
        ],
      },
      {
        title: '5. ファイル保存ポリシー',
        body: [
          'QuoteWise はアップロードコンテンツの永続的な保存を保証しません。アップロードファイルは、一時キャッシュ、分析中の処理、定期削除、または通知なしの削除の対象となる場合があります。',
          'ユーザーはアップロード文書のバックアップを自ら保持する責任があります。適用法令および社内ポリシーで許可されていない機密情報、規制対象データ、営業秘密などをアップロードしないでください。',
        ],
      },
      {
        title: '6. AI生成出力に関する免責',
        body: [
          'QuoteWise は、人工知能および自動化アルゴリズムを使用してアップロード資料を分析します。AI生成出力には、不正確さ、情報の欠落、文書の誤解釈、不完全な比較、リスク識別の失敗、誤解を招く結論が含まれる場合があります。',
          '本サービスは意思決定支援ツールとしてのみ提供されます。最終的な解釈、評価、調達判断、および事業判断はユーザー自身が行い、生成結果に基づく行為について全責任を負います。',
        ],
      },
      {
        title: '7. 支払いおよびクレジット',
        body: [
          '本サービスの一部機能には、支払い、クレジット、サブスクリプション、または利用料金が必要となる場合があります。適用法令で別途要求される場合を除き、支払いは返金不可となる場合があり、クレジットは失効することがあり、価格は通知なく変更される場合があります。',
          'QuoteWise は、不正利用、詐欺、過度な自動利用、またはポリシー違反がある場合、利用を制限、停止、または取り消す権利を留保します。',
        ],
      },
      {
        title: '8. 知的財産',
        body: [
          '本サービスに関するすべての権利、権原および利益は、ソフトウェア、インターフェース、ブランド、デザイン、アルゴリズム、分析システム、生成レイアウトを含め、QuoteWise またはそのライセンサーに帰属します。',
          'ユーザーはアップロードコンテンツの所有権を保持しますが、本サービスの運営、保守、改善、開発に合理的に必要な範囲で、QuoteWise がアップロードコンテンツを処理、分析、保存、変換、複製、使用するための全世界的、非独占的、無償のライセンスを付与します。',
        ],
      },
      {
        title: '9. プライバシーおよびセキュリティ',
        body: [
          'QuoteWise は、ユーザーデータおよびシステムセキュリティを保護するため、商業的に合理的な措置を講じます。ただし、いかなるオンラインサービスも絶対的な安全性を保証することはできません。',
          'ユーザーは、インターネットを通じた情報送信に伴うリスクを認識し、受け入れるものとします。',
        ],
      },
      {
        title: '10. 禁止事項',
        body: [
          'ユーザーは、違法または権利侵害コンテンツのアップロード、システム運用の妨害、本サービスのリバースエンジニアリング、自動スクレイピングまたは不正利用メカニズムの使用、マルウェアのアップロード、データまたはインフラへの不正アクセスの試みを行ってはなりません。',
          'QuoteWise は、違反があった場合、アクセスを停止または終了する権利を留保します。',
        ],
      },
      {
        title: '11. 責任の制限',
        body: [
          '法律で認められる最大限の範囲において、QuoteWise は、間接損害、逸失利益、調達上の損失、ベンダー紛争、契約紛争、価格差異、事業中断、AI生成出力への依存、不正確または不完全な分析について責任を負いません。',
          '本サービスの利用はユーザー自身の責任で行われます。',
        ],
      },
      {
        title: '12. 規約の変更',
        body: ['QuoteWise はいつでも本規約を更新することができます。更新後の規約が有効となった後も本サービスを継続して利用する場合、改定後の規約に同意したものとみなされます。'],
      },
      {
        title: '13. お問い合わせ',
        body: ['本規約に関するお問い合わせ: support@quotewise.ai'],
      },
    ],
  },
  zh: {
    back: '返回首页',
    label: '法律信息',
    title: 'QuoteWise 服务条款',
    updated: '最后更新：2026年5月25日',
    intro: [
      '欢迎使用 QuoteWise（以下简称“QuoteWise”、“我们”或“本公司”）。',
      '本服务条款（以下简称“条款”）适用于你访问和使用 QuoteWise 网站、应用、AI 分析工具及相关服务（统称“服务”）。',
      '访问或使用本服务即表示你同意本条款。',
    ],
    sections: [
      {
        title: '1. 服务说明',
        body: [
          'QuoteWise 是一个由 AI 驱动的报价和方案比较平台，旨在帮助用户审阅、分析和比较上传的报价、方案、电子表格及其他采购相关资料。',
          '本服务可能提供自动比较表、价格分析、风险指标、缺失项目检测、谈判建议、AI 生成摘要、推荐评分和结构化采购洞察。',
          'QuoteWise 仅提供分析和信息支持。所有决策、评估、谈判、采购、供应商选择和商业判断均由用户自行负责。',
        ],
      },
      {
        title: '2. 非专业建议',
        body: [
          'QuoteWise 不是法律、会计、财务、采购、咨询或其他专业顾问服务。',
          'QuoteWise 生成的分析是自动化、AI 生成且具有概率性质的结果，仅供参考。',
          'QuoteWise 不保证准确性、完整性、供应商质量、价格公平性、法律合规性、商业适用性或采购结果。用户在作出任何商业或财务决定前，必须自行审阅和核实所有文件与分析结果。',
        ],
      },
      {
        title: '3. 上传文件和用户内容',
        body: [
          '用户可以上传 PDF、电子表格、图片、报价单、方案及采购相关资料（统称“上传内容”）。',
          '用户声明并保证其拥有上传内容的合法权利，上传行为不违反任何法律或第三方权利，且内容不包含违法或恶意材料。',
        ],
      },
      {
        title: '4. 文件处理和服务改进',
        body: [
          '上传内容可能会被 QuoteWise 用于生成分析结果、改进服务质量、提高 AI 分析准确性、调试和防错、防止滥用、系统监控、功能开发、分析、运营维护以及与 QuoteWise 服务相关的内部研究。',
          'QuoteWise 可能为服务相关目的保留生成的分析结果、提取文本、结构化元数据、匿名化或转换后的数据以及运营日志。',
        ],
      },
      {
        title: '5. 文件存储政策',
        body: [
          'QuoteWise 不保证永久存储上传内容。上传文件可能会被临时缓存、在分析期间处理、定期删除或不经通知移除。',
          '用户应自行保存上传文件的备份。除非适用法律和公司内部政策允许，否则不应上传高度机密信息、受监管数据、商业秘密或禁止第三方处理的信息。',
        ],
      },
      {
        title: '6. AI 生成结果免责声明',
        body: [
          'QuoteWise 使用人工智能和自动化算法分析上传资料。AI 生成结果可能包含不准确、遗漏、误读、不完整比较、未识别风险或具有误导性的结论。',
          '本服务仅作为决策支持工具。最终解释、评估、采购决策和商业判断均由用户自行作出，用户对基于生成结果采取的任何行动承担全部责任。',
        ],
      },
      {
        title: '7. 付款和积分',
        body: [
          '本服务的某些功能可能需要付款、积分、订阅或使用费用。除适用法律另有要求外，付款可能不可退款，积分可能过期，促销积分可能受限制，价格可能不经通知而变更。',
          'QuoteWise 保留在滥用、欺诈、过度自动化使用或违反政策时限制、暂停或撤销使用权限的权利。',
        ],
      },
      {
        title: '8. 知识产权',
        body: [
          '本服务中的软件、界面、品牌、设计、算法、分析系统和生成布局等所有权利、所有权和权益均归 QuoteWise 或其许可方所有。',
          '用户保留其上传内容的所有权。但用户使用本服务即授予 QuoteWise 一项全球性、非独占、免版税许可，以便在运营、维护、改进和开发服务所合理需要的范围内处理、分析、存储、转换、复制和使用上传内容。',
        ],
      },
      {
        title: '9. 隐私和安全',
        body: [
          'QuoteWise 会采取商业上合理的措施保护用户数据和系统安全。但任何在线服务都无法保证绝对安全。',
          '用户理解并接受通过互联网传输信息所带来的风险。',
        ],
      },
      {
        title: '10. 禁止使用',
        body: [
          '用户不得上传违法或侵权材料、干扰系统运行、逆向工程本服务、使用自动抓取或滥用机制、上传恶意代码，或尝试未经授权访问数据或基础设施。',
          'QuoteWise 保留在发生违规时暂停或终止访问权限的权利。',
        ],
      },
      {
        title: '11. 责任限制',
        body: [
          '在法律允许的最大范围内，QuoteWise 不对间接损害、利润损失、采购损失、供应商争议、合同争议、价格差异、业务中断、对 AI 生成结果的依赖或不准确/不完整分析承担责任。',
          '用户自行承担使用本服务的风险。',
        ],
      },
      {
        title: '12. 条款变更',
        body: ['QuoteWise 可随时更新本条款。更新后的条款生效后继续使用本服务，即视为接受修订后的条款。'],
      },
      {
        title: '13. 联系方式',
        body: ['如对本条款有疑问，请联系：support@quotewise.ai'],
      },
    ],
  },
} satisfies Record<Language, { back: string; label: string; title: string; updated: string; intro: string[]; sections: TermsSectionData[] }>;

function TermsSection({ language, onBack }: { language: Language; onBack: () => void }) {
  const termsCopy = translatedTerms[language];
  return (
    <section className="bg-[#f8fbff] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#c8d7eb] bg-white px-4 text-sm font-bold text-[#1e3a5f] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
        >
          {termsCopy.back}
        </button>

        <article className="rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_24px_70px_rgba(15,35,65,0.08)] md:p-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">{termsCopy.label}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#10243f] md:text-5xl">
            {termsCopy.title}
          </h1>
          <p className="mt-4 text-sm font-semibold text-slate-500">{termsCopy.updated}</p>

          <div className="mt-8 space-y-4 border-b border-[#e7edf5] pb-8 text-base leading-8 text-slate-600">
            {termsCopy.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="hidden">
            <p>Welcome to QuoteWise (“QuoteWise”, “we”, “our”, or “us”).</p>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of the QuoteWise website, applications,
              AI analysis tools, and related services (collectively, the “Service”).
            </p>
            <p>By accessing or using the Service, you agree to these Terms.</p>
          </div>

          <div className="mt-8 space-y-10">
            {termsCopy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-[#10243f]">{section.title}</h2>
                <div className="mt-4 space-y-3 text-base leading-8 text-slate-600">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="list-disc space-y-2 pl-6">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.after?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ComparisonPreview({
  headers,
  recommendation,
  recommendationValue,
}: {
  headers: string[];
  recommendation: string;
  recommendationValue: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d6e1ef] bg-white/92 p-6 shadow-[0_28px_70px_rgba(15,35,65,0.13)]">
      <div className="mb-6 flex items-center justify-between border-b border-[#e7edf5] pb-5">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
          <Sparkles className="h-4 w-4 text-[#2563eb]" />
          QuoteWise
        </div>
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
        </div>
      </div>

      <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.4fr] gap-4 text-sm">
        <div className="font-semibold text-slate-500">{headers[0]}</div>
        <div className="text-right font-semibold text-slate-500">{headers[1]}</div>
        <div className="text-right font-semibold text-slate-500">{headers[2]}</div>
        <div className="text-right font-semibold text-slate-500">{headers[3]}</div>

        {previewRows.map((row) => (
          <div key={row.item} className="contents">
            <div className="py-2 font-semibold text-[#10243f]">{row.item}</div>
            <div className="py-2 text-right font-medium text-slate-700">{row.quoteA}</div>
            <div className="py-2 text-right font-medium text-slate-700">{row.quoteB}</div>
            <div className={`py-2 text-right font-bold ${row.tone}`}>{row.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-[#e7edf5] pt-5">
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{recommendation}</span>
        <span className="rounded-full border border-[#b8c9df] bg-[#f8fbff] px-4 py-2 text-sm font-bold text-[#1e3a5f]">
          {recommendationValue}
        </span>
      </div>
    </div>
  );
}

function UploadSection({
  t,
  files,
  errorMessage,
  isUploading,
  onFileUpload,
  onFileDrop,
  onRemoveFile,
  onAnalyze,
}: {
  t: (typeof copy)[Language];
  files: File[];
  errorMessage: string;
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onRemoveFile: (index: number) => void;
  onAnalyze: () => void | Promise<void>;
}) {
  const canAnalyze = files.length >= 2 && files.length <= 5 && !isUploading;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.compare}</p>
        <h2 className="text-4xl font-semibold text-[#10243f]">{t.compareTitle}</h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">{t.compareCopy}</p>
      </div>

      <div>
        <UploadCard
          id="quote-files-upload"
          files={files}
          title={t.uploadMultipleTitle}
          help={t.uploadMultipleHelp}
          onChange={onFileUpload}
          onDrop={onFileDrop}
          onRemoveFile={onRemoveFile}
          emptyLabel={t.uploadedFilesEmpty}
        />
      </div>

      {errorMessage ? (
        <p className="mt-6 text-center text-sm font-semibold text-destructive">{errorMessage}</p>
      ) : null}

      <div className="mt-8 text-center">
        <Button
          variant="contained"
          size="large"
          disabled={!canAnalyze}
          onClick={onAnalyze}
          endIcon={isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          sx={{
            px: 4,
            py: 1.5,
            backgroundColor: '#1e3a5f',
            borderRadius: '10px',
            boxShadow: '0 14px 30px rgba(30, 58, 95, 0.2)',
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#2563eb' },
            '&.Mui-disabled': {
              backgroundColor: '#cbd5e1',
              color: '#ffffff',
            },
          }}
        >
          {isUploading ? t.analyzingTitle : t.analyze}
        </Button>
      </div>
    </section>
  );
}

function UploadCard({
  id,
  title,
  files,
  help,
  onChange,
  onDrop,
  onRemoveFile,
  emptyLabel,
}: {
  id: string;
  files: File[];
  title: string;
  help: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onRemoveFile: (index: number) => void;
  emptyLabel: string;
}) {
  return (
    <div className="relative">
      <input type="file" accept="application/pdf" multiple onChange={onChange} className="hidden" id={id} />
      <label
        htmlFor={id}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`block min-h-[220px] cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all hover:border-[#2563eb] hover:bg-white ${
          files.length
            ? 'border-[#2563eb] bg-white shadow-[0_18px_46px_rgba(37,99,235,0.12)]'
            : 'border-[#cbd7e6] bg-white/70'
        }`}
      >
        <div className="flex min-h-[150px] flex-col items-center justify-center gap-4">
          <Upload className={`h-12 w-12 ${files.length ? 'text-[#2563eb]' : 'text-slate-400'}`} />
          <div>
            <p className="mb-1 font-semibold text-[#10243f]">{files.length ? `${files.length} / 5 PDF files` : title}</p>
            <p className="text-sm text-slate-500">{files.length ? help : emptyLabel}</p>
          </div>

          {files.length ? (
            <ul className="mt-2 grid w-full gap-3 text-left md:grid-cols-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-[#e7edf5] bg-[#f8fbff] px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2563eb]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#10243f]">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRemoveFile(index);
                    }}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#c8d7eb] bg-white text-slate-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </label>
    </div>
  );
}

const analysisStageLabels: Record<
  Language,
  Record<AnalysisStage, { title: string; copy: string }>
> = {
  en: {
    uploading: { title: 'Uploading files', copy: 'Securely preparing your quotation PDFs.' },
    cache: { title: 'Checking previous analyses', copy: 'QuoteWise looks for an existing result for this exact file set.' },
    extracting: { title: 'Reading quotation details', copy: 'AI extracts vendors, line items, prices, terms, and hidden-cost notes.' },
    comparing: { title: 'Comparing normalized items', copy: 'Equivalent terms are aligned and pricing-basis differences are detected.' },
    finalizing: { title: 'Preparing results', copy: 'The summary, insights, and report-ready table are being assembled.' },
  },
  ko: {
    uploading: { title: '파일 업로드 중', copy: '견적서 PDF를 안전하게 준비하고 있습니다.' },
    cache: { title: '기존 분석 확인 중', copy: '동일한 파일 조합의 분석 결과가 있는지 확인합니다.' },
    extracting: { title: '견적 정보 읽는 중', copy: 'AI가 업체명, 항목, 금액, 조건, 숨겨진 비용을 추출합니다.' },
    comparing: { title: '정규화 항목 비교 중', copy: '동일 의미의 항목을 맞추고 계산 기준 차이를 탐지합니다.' },
    finalizing: { title: '결과 정리 중', copy: '요약, 핵심 인사이트, 리포트용 표를 준비하고 있습니다.' },
  },
  ja: {
    uploading: { title: 'ファイルをアップロード中', copy: '見積PDFを安全に準備しています。' },
    cache: { title: '過去の分析を確認中', copy: '同じファイル構成の分析結果があるか確認しています。' },
    extracting: { title: '見積情報を読み取り中', copy: 'AIが会社名、項目、価格、条件、隠れた費用を抽出します。' },
    comparing: { title: '正規化した項目を比較中', copy: '同等の項目を揃え、計算基準の違いを検出します。' },
    finalizing: { title: '結果を準備中', copy: '要約、インサイト、レポート用テーブルを作成しています。' },
  },
  zh: {
    uploading: { title: '正在上传文件', copy: '正在安全准备报价 PDF。' },
    cache: { title: '正在检查已有分析', copy: 'QuoteWise 会查找这组文件是否已有结果。' },
    extracting: { title: '正在读取报价信息', copy: 'AI 正在提取供应商、项目、价格、条款和隐藏成本。' },
    comparing: { title: '正在比较标准化项目', copy: '系统正在对齐等价项目并识别计价基准差异。' },
    finalizing: { title: '正在整理结果', copy: '正在生成摘要、关键洞察和报告表格。' },
  },
};

const analysisStageOrder: AnalysisStage[] = ['uploading', 'cache', 'extracting', 'comparing', 'finalizing'];

function AnalyzingSection({
  t,
  language,
  stage,
}: {
  t: (typeof copy)[Language];
  language: Language;
  stage: AnalysisStage;
}) {
  const labels = analysisStageLabels[language];
  const activeIndex = analysisStageOrder.indexOf(stage);
  const activeLabel = labels[stage];

  return (
    <section className="mx-auto flex min-h-[520px] max-w-7xl items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-2xl rounded-2xl border border-[#dbe5f1] bg-white p-8 shadow-[0_22px_54px_rgba(15,35,65,0.08)] md:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div className="text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.compare}</p>
          <h2 className="text-3xl font-semibold text-[#10243f]">{activeLabel.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{activeLabel.copy}</p>
        </div>
        <div className="mt-8 space-y-3">
          {analysisStageOrder.map((step, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  isActive
                    ? 'border-[#93b4df] bg-[#eff6ff]'
                    : isDone
                      ? 'border-[#c8d7eb] bg-white'
                      : 'border-[#e7edf5] bg-[#f8fbff]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-600'
                      : isActive
                        ? 'bg-[#2563eb] text-white'
                        : 'bg-white text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#10243f]">{labels[step].title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{labels[step].copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ResultsSection({
  t,
  language,
  files,
  analysis,
  errorMessage,
  currentUser,
  onRequireVerifiedEmail,
  onNewComparison,
}: {
  t: (typeof copy)[Language];
  language: Language;
  files: File[];
  analysis: QuoteAnalysis | null;
  errorMessage: string;
  currentUser: UserSession | null;
  onRequireVerifiedEmail: () => void;
  onNewComparison: () => void;
}) {
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [isExcelLanguageOpen, setIsExcelLanguageOpen] = useState(false);
  const [isPdfLanguageOpen, setIsPdfLanguageOpen] = useState(false);
  const vendors =
    analysis?.vendors?.length
      ? analysis.vendors
      : [];
  const rows = analysis?.items?.length ? analysis.items : [];
  const hasAnalysis = Boolean(analysis);
  const hasRows = rows.length > 0;
  const noDataText = getNoDataText(language);
  const errorText = getErrorText(language);
  const title = errorMessage
    ? errorText
    : hasAnalysis
      ? getLocalizedText(analysis?.title_i18n, language, analysis?.title || noDataText)
      : noDataText;
  const summary = errorMessage
    ? errorMessage
    : hasAnalysis
      ? getLocalizedText(analysis?.summary_i18n, language, analysis?.summary || noDataText)
      : noDataText;
  const insights = analysis
    ? [
        ...getLocalizedList(analysis.insights_i18n, language, analysis.insights),
        ...getLocalizedList(analysis.risks_i18n, language, analysis.risks || []),
      ]
    : [];
  const estimatedSavings = analysis ? `$${Math.round(analysis.estimatedSavings).toLocaleString('en-US')}` : '-';
  const recommendedQuote = analysis?.recommendedQuote || '-';
  const recommendationValue = analysis
    ? getLocalizedText(analysis.recommendation_i18n, language, buildRecommendationText(language, recommendedQuote, estimatedSavings))
    : t.recommendationValue;
  const matchedHelper = analysis
    ? `${analysis.matchedLowerCount} / ${analysis.matchedCount} ${t.matchedLinesLower}`
    : noDataText;
  const coverageHelper = t.coverageItemsHelper;
  const handleOpenReportPreview = () => {
    if (!currentUser?.emailVerified) {
      onRequireVerifiedEmail();
      return;
    }

    setIsReportPreviewOpen(true);
  };

  const handleRequestPdfDownload = () => {
    if (!currentUser?.emailVerified) {
      onRequireVerifiedEmail();
      return;
    }

    setIsPdfLanguageOpen(true);
  };

  const handleDownloadPdf = async (pdfLanguage: Language) => {
    try {
      await downloadAnalysisReport(copy[pdfLanguage], pdfLanguage, files, analysis);
      setIsPdfLanguageOpen(false);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : 'Failed to generate PDF');
    }
  };

  const handleRequestExcelDownload = () => {
    if (!currentUser?.emailVerified) {
      onRequireVerifiedEmail();
      return;
    }

    setIsExcelLanguageOpen(true);
  };

  const handleDownloadExcel = (excelLanguage: Language) => {
    downloadSummaryExcel(copy[excelLanguage], excelLanguage, files, analysis);
    setIsExcelLanguageOpen(false);
  };

  return (
    <>
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.results}</p>
          <h2 className="max-w-3xl text-4xl font-semibold text-[#10243f]">{title}</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{summary}</p>
        </div>
        <Button
          variant="outlined"
          size="large"
          onClick={onNewComparison}
          sx={{
            alignSelf: { xs: 'flex-start', md: 'auto' },
            borderColor: '#b8c9df',
            borderRadius: '10px',
            color: '#1e3a5f',
            cursor: 'pointer',
            fontWeight: 700,
            px: 2.5,
            py: 1.2,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#2563eb',
              backgroundColor: '#eff6ff',
            },
          }}
        >
          {t.newComparison}
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label={t.totalSavings} value={estimatedSavings} helper={t.matchedLineDelta} />
        <MetricCard label={t.recommendedVendor} value={recommendedQuote} helper={matchedHelper} />
        <MetricCard label={t.coverageGaps} value={String(analysis?.coverageGaps ?? 2)} helper={coverageHelper} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
          <div className="border-b border-[#e7edf5] px-6 py-5">
            <h3 className="text-lg font-semibold text-[#10243f]">{t.summary}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {files.length
                ? files.map((file) => file.name).join(' vs ')
                : `${t.selectedFirst} vs ${t.selectedSecond}`}
            </p>
          </div>

          <div
            className="grid gap-4 border-b border-[#eef3f8] px-6 py-4 text-sm font-bold text-slate-500"
            style={{ gridTemplateColumns: `minmax(180px,1.15fr) repeat(${Math.max(vendors.length, 1)}, minmax(120px,0.8fr)) minmax(110px,0.6fr)` }}
          >
            <div>{t.previewHeaders[0]}</div>
            {vendors.length ? (
              vendors.map((vendor) => (
                <div key={vendor.side} className="text-right">
                  {vendor.name}
                </div>
              ))
            ) : (
              <div className="text-right">{noDataText}</div>
            )}
            <div className="text-right">{t.delta}</div>
          </div>

          {errorMessage ? (
            <EmptyResultRow message={errorText} detail={errorMessage} />
          ) : !hasRows ? (
            <EmptyResultRow message={noDataText} />
          ) : (
            rows.map((row) => (
              <div
                key={`${row.item_label}-${row.delta_value}`}
                className="grid gap-4 border-b border-[#eef3f8] px-6 py-4 last:border-b-0"
                style={{ gridTemplateColumns: `minmax(180px,1.15fr) repeat(${vendors.length}, minmax(120px,0.8fr)) minmax(110px,0.6fr)` }}
              >
                <div>
                  <p className="font-semibold text-[#10243f]">{getLocalizedText(row.item_label_i18n, language, row.item_label)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{getLocalizedText(row.insight_i18n, language, row.insight)}</p>
                </div>
                {vendors.map((vendor) => {
                  const cell = row.cells?.find((item) => item.vendorSide === vendor.side);

                  return (
                    <QuoteValue
                      key={vendor.side}
                      value={cell?.included === false ? '-' : cell?.value || '-'}
                      rawTerm={cell?.rawTerm}
                    />
                  );
                })}
                <DeltaValue
                  value={getDeltaDisplayValue(row, language, t)}
                  tone={getAnalysisTone(row.status, row.delta_value, row.delta_status)}
                  color={row.status === 'different_basis' || row.delta_status === 'different_basis' ? '#DB2777' : undefined}
                  stacked={(row.status === 'different_basis' || row.delta_status === 'different_basis') && language === 'en'}
                />
              </div>
            ))
          )}
        </div>

        <aside className="rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
          <h3 className="text-lg font-semibold text-[#10243f]">{t.keyInsights}</h3>
          <div className="mt-5 space-y-4">
            {errorMessage ? (
              <p className="text-sm leading-6 text-rose-600">{errorText}</p>
            ) : insights.length ? (
              insights.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-500">{noDataText}</p>
            )}
          </div>
          <div className="mt-7 rounded-xl border border-[#b8c9df] bg-[#f8fbff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t.recommendation}</p>
            <p className="mt-2 text-lg font-bold text-[#1e3a5f]">{recommendationValue}</p>
          </div>

          <div className="mt-5 rounded-xl border border-[#dbe5f1] bg-white p-5">
            <h3 className="text-base font-semibold text-[#10243f]">{t.reportTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.reportCopy}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {getReportPageLabel(language, 6)}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="contained"
                fullWidth
                onClick={handleOpenReportPreview}
                startIcon={<Download className="h-4 w-4" />}
                sx={{
                  py: 1.25,
                  backgroundColor: '#1e3a5f',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&.Mui-disabled': {
                    backgroundColor: '#cbd5e1',
                    color: '#ffffff',
                  },
                  '&:hover': { backgroundColor: '#2563eb' },
                }}
              >
                {t.reportDownload}
              </Button>
              <Button
                type="button"
                variant="contained"
                fullWidth
                onClick={handleRequestExcelDownload}
                startIcon={<Download className="h-4 w-4" />}
                sx={{
                  py: 1.25,
                  backgroundColor: '#047857',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#059669' },
                }}
              >
                {getExcelDownloadText(language)}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </section>
    {isReportPreviewOpen ? (
      <ReportPreviewModal
        t={t}
        language={language}
        files={files}
        analysis={analysis}
        onClose={() => setIsReportPreviewOpen(false)}
        onDownload={handleRequestPdfDownload}
        onDownloadExcel={handleRequestExcelDownload}
      />
    ) : null}
    {isPdfLanguageOpen ? (
      <ExportLanguageModal
        currentLanguage={language}
        exportType="pdf"
        onClose={() => setIsPdfLanguageOpen(false)}
        onSelect={handleDownloadPdf}
      />
    ) : null}
    {isExcelLanguageOpen ? (
      <ExportLanguageModal
        currentLanguage={language}
        exportType="excel"
        onClose={() => setIsExcelLanguageOpen(false)}
        onSelect={handleDownloadExcel}
      />
    ) : null}
    </>
  );
}

function ReportPreviewModal({
  t,
  language,
  files,
  analysis,
  onClose,
  onDownload,
  onDownloadExcel,
}: {
  t: (typeof copy)[Language];
  language: Language;
  files: File[];
  analysis: QuoteAnalysis | null;
  onClose: () => void;
  onDownload: () => void;
  onDownloadExcel: () => void;
}) {
  const report = getReportModel(t, language, files, analysis);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243f]/45 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_28px_70px_rgba(15,35,65,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e7edf5] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">QuoteWise</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10243f]">{t.reportTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{getReportPageLabel(language, 6)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe5f1] text-slate-500 transition hover:border-[#2563eb] hover:text-[#1e3a5f]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-190px)] overflow-y-auto bg-[#f4f8fd] px-5 py-5">
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>{getFullReportPreviewText(language)}</span>
              <span>{report.quotePair}</span>
            </div>
            <h3 className="mt-5 text-3xl font-semibold leading-tight text-[#10243f]">{report.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{report.summary}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <ReportPreviewMetric label={t.totalSavings} value={report.estimatedSavings} />
              <ReportPreviewMetric label={t.recommendedVendor} value={report.recommendedQuote} />
              <ReportPreviewMetric label={t.coverageGaps} value={report.coverageGaps} />
            </div>

            <div className="mt-6">
              <h4 className="text-base font-semibold text-[#10243f]">{t.summary}</h4>
              {report.rows.length ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-[#e7edf5]">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-[#f8fbff] text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="min-w-48 px-4 py-3 text-left">{t.previewHeaders[0]}</th>
                        {report.vendors.map((vendor) => (
                          <th key={vendor} className="min-w-32 px-4 py-3 text-right">
                            {vendor}
                          </th>
                        ))}
                        <th className="min-w-28 px-4 py-3 text-right">{t.delta}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row) => (
                        <tr key={row.itemLabel} className="border-t border-[#eef3f8]">
                          <td className="px-4 py-4 align-top">
                            <p className="font-semibold text-[#10243f]">{row.itemLabel}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{row.insight}</p>
                          </td>
                          {row.cells.map((cell) => (
                            <td key={`${row.itemLabel}-${cell.vendor}`} className="px-4 py-4 text-right align-top font-semibold text-slate-700">
                              <p>{cell.value}</p>
                              {cell.rawTerm ? <p className="mt-1 text-xs font-medium text-slate-400">{cell.rawTerm}</p> : null}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right align-top font-bold text-[#1e3a5f]">{row.delta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-[#e7edf5] px-4 py-5 text-center text-sm font-semibold text-slate-500">
                  {getNoDataText(language)}
                </p>
              )}
            </div>

            <div className="mt-8">
              <h4 className="text-base font-semibold text-[#10243f]">{t.keyInsights}</h4>
              {report.insights.length ? (
                <div className="mt-3 space-y-3">
                  {report.insights.map((insight) => (
                    <div key={insight} className="rounded-xl border border-[#e7edf5] bg-[#f8fbff] px-4 py-3 text-sm leading-6 text-slate-600">
                      {insight}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-[#e7edf5] px-4 py-5 text-center text-sm font-semibold text-slate-500">
                  {getNoDataText(language)}
                </p>
              )}
            </div>

            <div className="mt-8 rounded-xl border border-[#b8c9df] bg-[#f8fbff] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t.recommendation}</p>
              <p className="mt-2 text-lg font-bold text-[#1e3a5f]">{report.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e7edf5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-500">{getReportPreviewNotice(language)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="contained"
              onClick={onDownload}
              startIcon={<Download className="h-4 w-4" />}
              sx={{
                backgroundColor: '#1e3a5f',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                px: 2.5,
                py: 1.15,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#2563eb' },
              }}
            >
              {t.reportDownload}
            </Button>
            <Button
              type="button"
              variant="contained"
              onClick={onDownloadExcel}
              startIcon={<Download className="h-4 w-4" />}
              sx={{
                backgroundColor: '#047857',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                px: 2.5,
                py: 1.15,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#059669' },
              }}
            >
              {getExcelDownloadText(language)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e7edf5] bg-[#f8fbff] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#10243f]">{value}</p>
    </div>
  );
}

function ExportLanguageModal({
  currentLanguage,
  exportType,
  onClose,
  onSelect,
}: {
  currentLanguage: Language;
  exportType: 'pdf' | 'excel';
  onClose: () => void;
  onSelect: (language: Language) => void;
}) {
  const title = exportType === 'pdf' ? getPdfLanguageTitle(currentLanguage) : getExcelLanguageTitle(currentLanguage);
  const body = exportType === 'pdf' ? getPdfLanguageCopy(currentLanguage) : getExcelLanguageCopy(currentLanguage);
  const eyebrow = exportType === 'pdf' ? 'PDF' : 'Excel';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#10243f]/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#dbe5f1] bg-white p-6 shadow-[0_28px_70px_rgba(15,35,65,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10243f]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe5f1] text-slate-500 transition hover:border-[#2563eb] hover:text-[#1e3a5f]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {orderedLanguages.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => onSelect(option.code)}
              className="flex items-center justify-between rounded-xl border border-[#dbe5f1] bg-white px-4 py-3 text-left transition hover:border-[#2563eb] hover:bg-[#f8fbff]"
            >
              <span>
                <span className="block text-sm font-bold text-[#10243f]">{getLanguageNativeLabel(option.code)}</span>
                <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{option.short}</span>
              </span>
              {option.code === currentLanguage ? (
                <span className="rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-bold text-[#2563eb]">
                  {getCurrentLanguageText(currentLanguage)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuoteValue({ value, rawTerm }: { value: string; rawTerm?: string }) {
  if (value === 'Not included' || value === '-') {
    return (
      <div className="text-right">
        <p className="text-lg font-semibold text-amber-600">-</p>
        {rawTerm ? <p className="mt-1 text-xs font-medium text-slate-400">{rawTerm}</p> : null}
      </div>
    );
  }

  return (
    <div className="text-right">
      <p className="font-semibold text-slate-700">{value}</p>
      {rawTerm ? <p className="mt-1 text-xs font-medium text-slate-400">{rawTerm}</p> : null}
    </div>
  );
}

function EmptyResultRow({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="border-b border-[#eef3f8] px-6 py-10 text-center last:border-b-0">
      <p className="text-base font-semibold text-[#10243f]">{message}</p>
      {detail ? <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{detail}</p> : null}
    </div>
  );
}

function getLocalizedText(values: Partial<Record<Language, string>> | undefined, language: Language, fallback: string) {
  return values?.[language] || values?.en || fallback;
}

function getLocalizedList(values: Partial<Record<Language, string[]>> | undefined, language: Language, fallback: string[]) {
  return values?.[language]?.length ? values[language] : values?.en?.length ? values.en : fallback;
}

function buildRecommendationText(language: Language, recommendedQuote: string, estimatedSavings: string) {
  if (language === 'ko') {
    return `${recommendedQuote} 선택 시 ${estimatedSavings} 절감`;
  }

  if (language === 'ja') {
    return `${recommendedQuote}で${estimatedSavings}削減`;
  }

  if (language === 'zh') {
    return `选择 ${recommendedQuote} 可节省 ${estimatedSavings}`;
  }

  return `${recommendedQuote} saves ${estimatedSavings}`;
}

function getNoDataText(language: Language) {
  if (language === 'ko') {
    return '데이터 없음';
  }

  if (language === 'ja') {
    return 'データなし';
  }

  if (language === 'zh') {
    return '无数据';
  }

  return 'No data';
}

function getErrorText(language: Language) {
  if (language === 'ko') {
    return '오류';
  }

  if (language === 'ja') {
    return 'エラー';
  }

  if (language === 'zh') {
    return '错误';
  }

  return 'Error';
}

function getDeltaDisplayValue(row: QuoteAnalysisItem, language: Language, t: (typeof copy)[Language]) {
  const localizedDelta = getLocalizedText(row.delta_i18n, language, '');

  if (localizedDelta) {
    return localizedDelta;
  }

  if (row.delta_status === 'same') {
    return language === 'ko' ? '차이 없음' : language === 'ja' ? '差分なし' : language === 'zh' ? '无差异' : 'No difference';
  }

  if (row.delta_status === 'only_in_a' || row.status === 'only_in_a') {
    return t.onlyInA;
  }

  if (row.delta_status === 'only_in_b' || row.status === 'only_in_b') {
    return t.onlyInB;
  }

  if (row.delta_status === 'different_basis' || row.status === 'different_basis') {
    return t.differentBasis;
  }

  return row.delta_value;
}

function getAnalysisTone(status: QuoteAnalysisItem['status'], deltaValue: string, deltaStatus?: QuoteAnalysisItem['delta_status']) {
  if (status === 'only_in_a') {
    return 'text-amber-600';
  }

  if (status === 'only_in_b') {
    return 'text-blue-600';
  }

  if (status === 'different_basis') {
    return 'text-slate-700';
  }

  if (deltaStatus === 'different_basis') {
    return 'text-slate-700';
  }

  if (deltaStatus === 'lower_in_b') {
    return 'text-emerald-600';
  }

  if (deltaStatus === 'lower_in_a') {
    return 'text-rose-600';
  }

  if (deltaStatus === 'same') {
    return 'text-slate-500';
  }

  return deltaValue.startsWith('-') ? 'text-emerald-600' : deltaValue.startsWith('+') ? 'text-rose-600' : 'text-slate-600';
}

type ReportModel = {
  title: string;
  summary: string;
  quotePair: string;
  estimatedSavings: string;
  recommendedQuote: string;
  coverageGaps: string;
  recommendation: string;
  vendors: string[];
  rows: Array<{
    itemLabel: string;
    insight: string;
    delta: string;
    cells: Array<{ vendor: string; value: string; rawTerm?: string }>;
  }>;
  insights: string[];
};

function getReportModel(t: (typeof copy)[Language], language: Language, files: File[], analysis: QuoteAnalysis | null): ReportModel {
  const noDataText = getNoDataText(language);
  const vendors = analysis?.vendors?.length
    ? analysis.vendors
    : analysis?.items?.some((row) => row.quote_a_value || row.quote_b_value)
      ? [
          { side: 'A' as const, name: t.quoteA, filename: files[0]?.name || t.selectedFirst },
          { side: 'B' as const, name: t.quoteB, filename: files[1]?.name || t.selectedSecond },
        ]
      : [];
  const quotePair = files.length
    ? files.map((file) => file.name).join(' vs ')
    : vendors.length
      ? vendors.map((vendor) => vendor.filename || vendor.name).join(' vs ')
      : `${t.selectedFirst} vs ${t.selectedSecond}`;
  const estimatedSavings = analysis ? `$${Math.round(analysis.estimatedSavings).toLocaleString('en-US')}` : '-';
  const recommendedQuote = analysis?.recommendedQuote || '-';

  return {
    title: analysis
      ? getLocalizedText(analysis.title_i18n, language, analysis.title || noDataText)
      : noDataText,
    summary: analysis
      ? getLocalizedText(analysis.summary_i18n, language, analysis.summary || noDataText)
      : noDataText,
    quotePair,
    estimatedSavings,
    recommendedQuote,
    coverageGaps: analysis ? String(analysis.coverageGaps) : '-',
    recommendation: analysis
      ? getLocalizedText(analysis.recommendation_i18n, language, buildRecommendationText(language, recommendedQuote, estimatedSavings))
      : noDataText,
    vendors: vendors.map((vendor) => vendor.name),
    rows: (analysis?.items || []).map((row) => ({
      itemLabel: getLocalizedText(row.item_label_i18n, language, row.item_label),
      insight: getLocalizedText(row.insight_i18n, language, row.insight),
      delta: getDeltaDisplayValue(row, language, t),
      cells: vendors.map((vendor) => {
        const cell = row.cells?.find((item) => item.vendorSide === vendor.side);
        const legacyValue = vendor.side === 'A' ? row.quote_a_value : vendor.side === 'B' ? row.quote_b_value : undefined;

        return {
          vendor: vendor.name,
          value: cell?.included === false ? '-' : cell?.value || legacyValue || '-',
          rawTerm: cell?.rawTerm,
        };
      }),
    })),
    insights: analysis
      ? [
          ...getLocalizedList(analysis.insights_i18n, language, analysis.insights),
          ...getLocalizedList(analysis.risks_i18n, language, analysis.risks || []),
        ]
      : [],
  };
}

function getReportPageLabel(language: Language, pages: number) {
  if (language === 'ko') return `총 ${pages}페이지 리포트`;
  if (language === 'ja') return `全${pages}ページのレポート`;
  if (language === 'zh') return `共 ${pages} 页报告`;
  return `${pages}-page report`;
}

function getFullReportPreviewText(language: Language) {
  if (language === 'ko') return '전체 리포트 미리보기';
  if (language === 'ja') return 'レポート全体のプレビュー';
  if (language === 'zh') return '完整报告预览';
  return 'Full report preview';
}

function getReportPreviewNotice(language: Language) {
  if (language === 'ko') return 'MVP 단계에서는 브라우저 인쇄 기능으로 PDF를 저장합니다.';
  if (language === 'ja') return 'MVP段階ではブラウザの印刷機能でPDFを保存します。';
  if (language === 'zh') return 'MVP 阶段使用浏览器打印功能保存 PDF。';
  return 'For the MVP, PDF export uses your browser print dialog.';
}

function getExcelDownloadText(language: Language) {
  if (language === 'ko') return 'Excel 다운로드';
  if (language === 'ja') return 'Excelをダウンロード';
  if (language === 'zh') return '下载 Excel';
  return 'Download Excel';
}

function getExcelLanguageTitle(language: Language) {
  if (language === 'ko') return 'Excel 언어 선택';
  if (language === 'ja') return 'Excelの言語を選択';
  if (language === 'zh') return '选择 Excel 语言';
  return 'Choose Excel language';
}

function getExcelLanguageCopy(language: Language) {
  if (language === 'ko') return 'Summary와 Key insights를 어떤 언어로 다운로드할지 선택하세요.';
  if (language === 'ja') return 'Summary と Key insights をダウンロードする言語を選択してください。';
  if (language === 'zh') return '请选择 Summary 和 Key insights 的下载语言。';
  return 'Choose the language for the Summary and Key insights export.';
}

function getPdfLanguageTitle(language: Language) {
  if (language === 'ko') return 'PDF 언어 선택';
  if (language === 'ja') return 'PDFの言語を選択';
  if (language === 'zh') return '选择 PDF 语言';
  return 'Choose PDF language';
}

function getPdfLanguageCopy(language: Language) {
  if (language === 'ko') return '상세 분석 리포트를 어떤 언어로 저장할지 선택하세요.';
  if (language === 'ja') return '詳細分析レポートを保存する言語を選択してください。';
  if (language === 'zh') return '请选择详细分析报告的保存语言。';
  return 'Choose the language for the detailed analysis report.';
}

function getCurrentLanguageText(language: Language) {
  if (language === 'ko') return '현재';
  if (language === 'ja') return '現在';
  if (language === 'zh') return '当前';
  return 'Current';
}

function getLanguageNativeLabel(language: Language) {
  if (language === 'ko') return '한국어';
  if (language === 'ja') return '日本語';
  if (language === 'zh') return '中文';
  return 'English';
}

function downloadSummaryExcel(t: (typeof copy)[Language], language: Language, files: File[], analysis: QuoteAnalysis | null) {
  const report = getReportModel(t, language, files, analysis);
  const vendorHeaders = report.vendors.map((vendor) => `<th>${escapeHtml(vendor)}</th>`).join('');
  const rows = report.rows.length
    ? report.rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.itemLabel)}</td>
              ${row.cells.map((cell) => `<td>${escapeHtml(cell.value)}</td>`).join('')}
              <td>${escapeHtml(row.delta)}</td>
            </tr>
          `,
        )
        .join('')
    : `
        <tr>
          <td colspan="${report.vendors.length + 2}">${escapeHtml(getNoDataText(language))}</td>
        </tr>
      `;
  const insightRows = report.insights.length
    ? report.insights
        .map(
          (insight) => `
            <tr>
              <td colspan="${report.vendors.length + 2}">${escapeHtml(insight)}</td>
            </tr>
          `,
        )
        .join('')
    : `
        <tr>
          <td colspan="${report.vendors.length + 2}">${escapeHtml(getNoDataText(language))}</td>
        </tr>
      `;
  const workbook = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #d9e2ef; padding: 8px 10px; mso-number-format:"\\@"; }
          th { background: #eaf2ff; color: #10243f; font-weight: 700; }
          .title { font-size: 18px; font-weight: 700; color: #10243f; }
        </style>
      </head>
      <body>
        <table>
          <tr><td class="title" colspan="${report.vendors.length + 2}">${escapeHtml(t.summary)}</td></tr>
          <tr></tr>
          <tr>
            <th>${escapeHtml(t.previewHeaders[0])}</th>
            ${vendorHeaders}
            <th>${escapeHtml(t.delta)}</th>
          </tr>
          ${rows}
          <tr></tr>
          <tr><td class="title" colspan="${report.vendors.length + 2}">${escapeHtml(t.keyInsights)}</td></tr>
          ${insightRows}
        </table>
      </body>
    </html>
  `;
  const blob = new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${sanitizeFilename(report.title || 'quotewise-summary')}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadAnalysisReport(t: (typeof copy)[Language], language: Language, files: File[], analysis: QuoteAnalysis | null) {
  const report = getReportModel(t, language, files, analysis);
  const response = await fetch(`${supabaseConfig.supabaseUrl}/functions/v1/generate-report-pdf`, {
    method: 'POST',
    headers: {
      apikey: supabaseConfig.supabaseKey,
      Authorization: `Bearer ${supabaseConfig.supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      labels: {
        summary: t.summary,
        totalSavings: t.totalSavings,
        recommendedVendor: t.recommendedVendor,
        coverageGaps: t.coverageGaps,
        item: t.previewHeaders[0],
        delta: t.delta,
        keyInsights: t.keyInsights,
        recommendation: t.recommendation,
        preparedBy: t.reportPreparedBy,
      },
      report,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate PDF');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${sanitizeFilename(report.title || 'quotewise-analysis-report')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  return cleaned || 'quotewise-summary';
}

function getDeltaValue(row: (typeof resultRows)[number], t: (typeof copy)[Language]) {
  if ('basis' in row && row.basis === 'different') {
    return t.differentBasis;
  }

  if ('deltaKey' in row) {
    return row.deltaKey === 'onlyInA' ? t.onlyInA : t.onlyInB;
  }

  return row.delta;
}

function DeltaValue({
  value,
  tone,
  color,
  stacked = false,
}: {
  value: string;
  tone: string;
  color?: string;
  stacked?: boolean;
}) {
  const style = color ? { color } : undefined;

  if (stacked) {
    const [firstWord, ...restWords] = value.split(' ');
    const secondLine = restWords.join(' ');

    return (
      <div className={`flex justify-end text-right text-sm font-bold leading-5 ${tone}`} style={style}>
        <span className="inline-flex flex-col items-end">
          <span>{firstWord}</span>
          {secondLine ? <span>{secondLine}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <div className={`text-right text-sm font-bold ${tone}`} style={style}>
      {value}
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_18px_42px_rgba(15,35,65,0.05)]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#10243f]">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function HistorySection({ t, onStartComparison }: { t: (typeof copy)[Language]; onStartComparison: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="rounded-2xl border border-[#dbe5f1] bg-white p-10 shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <History className="h-5 w-5" />
        </div>
        <h2 className="text-3xl font-semibold text-[#10243f]">{t.historyTitle}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t.historyCopy}</p>
        <Button
          variant="contained"
          size="large"
          onClick={onStartComparison}
          endIcon={<ArrowRight className="h-5 w-5" />}
          sx={{
            mt: 4,
            px: 3,
            py: 1.4,
            backgroundColor: '#1e3a5f',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#2563eb' },
          }}
        >
          {t.start}
        </Button>
      </div>
    </section>
  );
}
