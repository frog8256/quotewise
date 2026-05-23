import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  History,
  Layers3,
  Loader2,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@mui/material';
import Logo from './components/Logo';

type ActiveView = 'home' | 'compare' | 'analyzing' | 'results' | 'history';
type Language = 'en' | 'ko' | 'ja';
type UserSession = {
  name: string;
  email: string;
  picture?: string;
  provider: 'google';
};

const authStorageKey = 'quotewise.user';
const googleScriptId = 'google-identity-services';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: 'popup' | 'redirect';
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'large' | 'medium' | 'small';
          type?: 'standard' | 'icon';
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
          width?: number;
        },
      ) => void;
      disableAutoSelect: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const languages: Array<{ code: Language; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'ja', label: '日本語', short: 'JA' },
];

const copy = {
  en: {
    compare: 'Compare',
    history: 'History',
    eyebrow: 'Procurement intelligence',
    headline: ['Two quotations.', 'One clear decision.'],
    lead: 'QuoteWise reads your supplier PDFs, aligns line items across vendors, and surfaces the differences that actually move the needle.',
    start: 'Start a comparison',
    viewHistory: 'View history',
    previewHeaders: ['Item', 'Quote A', 'Quote B', 'Delta'],
    recommendation: 'Recommendation',
    recommendationValue: 'Quote B saves $190',
    compareTitle: 'Upload two supplier quotations',
    compareCopy: 'Drop in two PDF quotes and QuoteWise will prepare them for line-by-line comparison.',
    uploadFirst: 'Upload first quotation',
    uploadSecond: 'Upload second quotation',
    uploadHelp: 'Choose a PDF file or drag it here.',
    selectedFirst: 'Quotation 1',
    selectedSecond: 'Quotation 2',
    analyze: 'Start comparison analysis',
    analyzingTitle: 'Analyzing your quotations',
    analyzingCopy: 'QuoteWise is aligning items, checking price gaps, and preparing a decision-ready summary.',
    results: 'Results',
    resultsTitle: 'Quote B is the stronger choice',
    resultsCopy: 'Quote B is lower overall and wins on setup cost and support pricing. Quote A is only cheaper on the display line.',
    totalSavings: 'Estimated savings',
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
    pdfError: 'Only PDF files can be uploaded.',
    login: 'Log in',
    account: 'Account',
    loginTitle: 'Continue with Google',
    loginCopy: 'Sign in with Google to save and revisit your quotation comparisons.',
    logout: 'Log out',
    loggedInAs: 'Logged in as',
    googleLoginUnavailable: 'Add VITE_GOOGLE_CLIENT_ID to enable Google login.',
    googleLoginLoading: 'Loading Google sign-in...',
    googleLoginError: 'Google login could not be completed. Please try again.',
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
    compare: '비교',
    history: '기록',
    eyebrow: '구매 의사결정 인텔리전스',
    headline: ['두 개의 견적서.', '하나의 명확한 결정.'],
    lead: 'QuoteWise는 공급업체 PDF를 읽고, 벤더별 항목을 맞춰 비교하며, 실제 의사결정에 영향을 주는 차이를 선명하게 보여줍니다.',
    start: '비교 시작하기',
    viewHistory: '기록 보기',
    previewHeaders: ['항목', '견적 A', '견적 B', '차이'],
    recommendation: '추천',
    recommendationValue: '견적 B로 $190 절감',
    compareTitle: '공급업체 견적서 두 개를 업로드하세요',
    compareCopy: 'PDF 견적서 두 개를 올리면 QuoteWise가 항목별 비교를 준비합니다.',
    uploadFirst: '첫 번째 견적서 업로드',
    uploadSecond: '두 번째 견적서 업로드',
    uploadHelp: 'PDF 파일을 선택하거나 여기에 끌어다 놓으세요.',
    selectedFirst: '견적서 1',
    selectedSecond: '견적서 2',
    analyze: '비교 분석 시작하기',
    analyzingTitle: '견적서를 분석하고 있습니다',
    analyzingCopy: 'QuoteWise가 항목을 맞추고, 가격 차이를 확인하며, 의사결정용 요약을 준비하고 있습니다.',
    results: '결과',
    resultsTitle: '견적 B가 더 유리합니다',
    resultsCopy: '견적 B는 전체 비용이 더 낮고 설치비와 지원 비용에서 우세합니다. 견적 A는 디스플레이 항목에서만 더 저렴합니다.',
    totalSavings: '예상 절감액',
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
    pdfError: 'PDF 파일만 업로드할 수 있습니다.',
    login: '로그인',
    account: '계정',
    loginTitle: 'Google로 계속하기',
    loginCopy: '다음 MVP 단계에서 비교 기록을 이어갈 수 있도록 Google 계정으로 로그인하세요.',
    logout: '로그아웃',
    loggedInAs: '로그인 계정',
    googleLoginUnavailable: 'Google 로그인을 사용하려면 VITE_GOOGLE_CLIENT_ID를 추가하세요.',
    googleLoginLoading: 'Google 로그인을 불러오는 중입니다...',
    googleLoginError: 'Google 로그인을 완료할 수 없습니다. 다시 시도하세요.',
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
    compare: '比較',
    history: '履歴',
    eyebrow: '購買インテリジェンス',
    headline: ['2つの見積書。', 'ひとつの明確な判断。'],
    lead: 'QuoteWiseは仕入先のPDFを読み取り、ベンダー間の明細をそろえて、意思決定に本当に効く差分を可視化します。',
    start: '比較を開始',
    viewHistory: '履歴を見る',
    previewHeaders: ['項目', '見積 A', '見積 B', '差分'],
    recommendation: '推奨',
    recommendationValue: '見積 Bで$190削減',
    compareTitle: '2つの仕入先見積書をアップロード',
    compareCopy: '2つのPDF見積書をアップロードすると、QuoteWiseが明細ごとの比較を準備します。',
    uploadFirst: '1つ目の見積書をアップロード',
    uploadSecond: '2つ目の見積書をアップロード',
    uploadHelp: 'PDFファイルを選択するか、ここにドラッグしてください。',
    selectedFirst: '見積書 1',
    selectedSecond: '見積書 2',
    analyze: '比較分析を開始',
    analyzingTitle: '見積書を分析しています',
    analyzingCopy: 'QuoteWiseが明細を照合し、価格差を確認し、判断しやすい要約を準備しています。',
    results: '結果',
    resultsTitle: '見積 Bがより有利です',
    resultsCopy: '見積 Bは全体コストが低く、設置費とサポート費で優位です。見積 Aが安いのはディスプレイ項目のみです。',
    totalSavings: '推定削減額',
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
    pdfError: 'PDFファイルのみアップロードできます。',
    login: 'ログイン',
    account: 'アカウント',
    loginTitle: 'Googleで続行',
    loginCopy: '次のMVP段階で比較履歴を利用できるよう、Googleアカウントでログインしてください。',
    logout: 'ログアウト',
    loggedInAs: 'ログイン中',
    googleLoginUnavailable: 'Googleログインを有効にするには VITE_GOOGLE_CLIENT_ID を追加してください。',
    googleLoginLoading: 'Googleログインを読み込み中...',
    googleLoginError: 'Googleログインを完了できませんでした。もう一度お試しください。',
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
} satisfies Record<Language, Record<string, unknown>>;

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
    tone: 'text-emerald-600',
  },
  {
    item: 'Display 27"',
    quoteA: '$580',
    quoteB: '$620',
    delta: '+$40',
    note: 'Quote A is cheaper for the display line.',
    tone: 'text-rose-600',
  },
  {
    item: 'Onsite setup',
    quoteA: '$200',
    quoteB: '$150',
    delta: '-$50',
    note: 'Quote B reduces implementation cost.',
    tone: 'text-emerald-600',
  },
  {
    item: '3-yr support',
    quoteA: '$720',
    quoteB: '$690',
    delta: '-$30',
    note: 'Quote B offers lower support pricing.',
    tone: 'text-emerald-600',
  },
  {
    item: 'Cable management kit',
    quoteA: '$180',
    quoteB: 'Not included',
    delta: 'Only in A',
    deltaKey: 'onlyInA',
    note: 'Quote A includes this installation accessory as a separate line item.',
    tone: 'text-amber-600',
  },
  {
    item: 'Priority delivery',
    quoteA: 'Not included',
    quoteB: '$95',
    delta: 'Only in B',
    deltaKey: 'onlyInB',
    note: 'Quote B includes priority delivery as a separate charge.',
    tone: 'text-blue-600',
  },
  {
    item: 'Raw material freight',
    quoteA: '$12 / kg',
    quoteB: '$300 fixed',
    delta: 'basis',
    note: 'Quote A prices freight by weight, while Quote B uses a fixed freight charge.',
    tone: 'text-slate-700',
    color: '#DB2777',
    basis: 'different',
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(Boolean(window.google));
  const [googleError, setGoogleError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const t = copy[language];

  useEffect(() => {
    const savedUser = window.localStorage.getItem(authStorageKey);

    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as UserSession;
      if (parsedUser.provider === 'google' && parsedUser.name && parsedUser.email) {
        setCurrentUser(parsedUser);
      } else {
        window.localStorage.removeItem(authStorageKey);
      }
    } catch {
      window.localStorage.removeItem(authStorageKey);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || window.google) {
      setIsGoogleReady(Boolean(window.google));
      return;
    }

    const existingScript = document.getElementById(googleScriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleReady(true);
    script.onerror = () => setGoogleError(t.googleLoginError);
    document.head.appendChild(script);
  }, [t.googleLoginError]);

  useEffect(() => {
    if (!isLoginOpen || !isGoogleReady || !googleClientId || !window.google || !googleButtonRef.current) {
      return;
    }

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      ux_mode: 'popup',
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: 'continue_with',
      width: 340,
    });
  }, [isLoginOpen, isGoogleReady]);

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
    setActiveView('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHistory = () => {
    console.log('History view requested');
    setActiveView('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as Language;
    setLanguage(nextLanguage);
    setErrorMessage('');
    setGoogleError('');
  };

  const openLogin = () => {
    setGoogleError('');
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setGoogleError('');
  };

  const handleGoogleCredential = (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setGoogleError(t.googleLoginError);
      return;
    }

    const profile = parseGoogleCredential(response.credential);

    if (!profile) {
      setGoogleError(t.googleLoginError);
      return;
    }

    const nextUser = {
      name: profile.name || profile.email,
      email: profile.email,
      picture: profile.picture,
      provider: 'google' as const,
    };
    setCurrentUser(nextUser);
    window.localStorage.setItem(authStorageKey, JSON.stringify(nextUser));
    setIsLoginOpen(false);
    setGoogleError('');
  };

  const handleLogout = () => {
    window.google?.accounts.id.disableAutoSelect();
    setCurrentUser(null);
    window.localStorage.removeItem(authStorageKey);
    setIsLoginOpen(false);
  };

  const handleFileUpload = (fileNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage(t.pdfError);
      event.target.value = '';
      return;
    }

    setErrorMessage('');
    if (fileNumber === 1) {
      setFile1(file);
    } else {
      setFile2(file);
    }
  };

  const handleAnalyze = () => {
    if (file1 && file2) {
      console.log('분석 시작:', file1.name, file2.name);
      setActiveView('analyzing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#10243f]">
      <header className="sticky top-0 z-20 border-b border-[#dbe5f1] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex cursor-pointer items-center border-0 bg-transparent p-0"
            aria-label="Go to QuoteWise home"
          >
            <Logo className="h-14 w-auto" />
          </button>

          <nav className="hidden items-center gap-9 md:flex">
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
                {languages.map((option) => (
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
            file1={file1}
            file2={file2}
            errorMessage={errorMessage}
            onFileUpload={handleFileUpload}
            onAnalyze={handleAnalyze}
          />
        ) : null}

        {activeView === 'analyzing' ? <AnalyzingSection t={t} /> : null}

        {activeView === 'results' ? (
          <ResultsSection t={t} language={language} file1={file1} file2={file2} onNewComparison={showCompare} />
        ) : null}

        {activeView === 'history' ? <HistorySection t={t} onStartComparison={showCompare} /> : null}
      </main>

      {isLoginOpen ? (
        <LoginModal
          t={t}
          currentUser={currentUser}
          googleClientId={googleClientId}
          isGoogleReady={isGoogleReady}
          googleError={googleError}
          googleButtonRef={googleButtonRef}
          onClose={closeLogin}
          onLogout={handleLogout}
        />
      ) : null}
    </div>
  );
}

function parseGoogleCredential(credential: string) {
  try {
    const payload = credential.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const profile = JSON.parse(decodedPayload) as { name?: string; email?: string; picture?: string };

    if (!profile.email) {
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

function LoginModal({
  t,
  currentUser,
  googleClientId,
  isGoogleReady,
  googleError,
  googleButtonRef,
  onClose,
  onLogout,
}: {
  t: (typeof copy)[Language];
  currentUser: UserSession | null;
  googleClientId?: string;
  isGoogleReady: boolean;
  googleError: string;
  googleButtonRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10243f]/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_28px_80px_rgba(15,35,65,0.22)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2563eb]">{t.account}</p>
            <h2 className="text-2xl font-semibold text-[#10243f]">{t.loginTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.loginCopy}</p>
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
          <div className="mb-5 rounded-xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t.loggedInAs}</p>
            <div className="mt-3 flex items-center gap-3">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt=""
                  className="h-10 w-10 rounded-full border border-[#dbe5f1] bg-white"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-semibold text-[#10243f]">{currentUser.name}</p>
                <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {googleClientId ? (
            <div className="min-h-11">
              {isGoogleReady ? (
                <div ref={googleButtonRef} className="flex justify-center" />
              ) : (
                <div className="rounded-lg border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3 text-center text-sm font-semibold text-slate-500">
                  {t.googleLoginLoading}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {t.googleLoginUnavailable}
            </p>
          )}

          {googleError ? <p className="text-sm font-semibold text-rose-600">{googleError}</p> : null}

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
          ) : null}
        </div>
      </div>
    </div>
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
  file1,
  file2,
  errorMessage,
  onFileUpload,
  onAnalyze,
}: {
  t: (typeof copy)[Language];
  file1: File | null;
  file2: File | null;
  errorMessage: string;
  onFileUpload: (fileNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.compare}</p>
        <h2 className="text-4xl font-semibold text-[#10243f]">{t.compareTitle}</h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">{t.compareCopy}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard
          id="file1-upload"
          file={file1}
          title={t.uploadFirst}
          selectedTitle={t.selectedFirst}
          help={t.uploadHelp}
          onChange={(event) => onFileUpload(1, event)}
        />
        <UploadCard
          id="file2-upload"
          file={file2}
          title={t.uploadSecond}
          selectedTitle={t.selectedSecond}
          help={t.uploadHelp}
          onChange={(event) => onFileUpload(2, event)}
        />
      </div>

      {errorMessage ? (
        <p className="mt-6 text-center text-sm font-semibold text-destructive">{errorMessage}</p>
      ) : null}

      <div className="mt-8 text-center">
        <Button
          variant="contained"
          size="large"
          disabled={!file1 || !file2}
          onClick={onAnalyze}
          endIcon={<ArrowRight className="h-5 w-5" />}
          sx={{
            px: 4,
            py: 1.5,
            backgroundColor: '#1e3a5f',
            borderRadius: '10px',
            boxShadow: '0 14px 30px rgba(30, 58, 95, 0.2)',
            cursor: file1 && file2 ? 'pointer' : 'not-allowed',
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
          {t.analyze}
        </Button>
      </div>
    </section>
  );
}

function UploadCard({
  id,
  file,
  title,
  selectedTitle,
  help,
  onChange,
}: {
  id: string;
  file: File | null;
  title: string;
  selectedTitle: string;
  help: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <input type="file" accept="application/pdf" onChange={onChange} className="hidden" id={id} />
      <label
        htmlFor={id}
        className={`block min-h-[220px] cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all hover:border-[#2563eb] hover:bg-white ${
          file ? 'border-[#2563eb] bg-white shadow-[0_18px_46px_rgba(37,99,235,0.12)]' : 'border-[#cbd7e6] bg-white/70'
        }`}
      >
        <div className="flex min-h-[150px] flex-col items-center justify-center gap-4">
          {file ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-[#2563eb]" />
              <div>
                <p className="mb-1 font-semibold text-[#10243f]">{selectedTitle}</p>
                <p className="text-sm text-slate-500">{file.name}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-slate-400" />
              <div>
                <p className="mb-1 font-semibold text-[#10243f]">{title}</p>
                <p className="text-sm text-slate-500">{help}</p>
              </div>
            </>
          )}
        </div>
      </label>
    </div>
  );
}

function AnalyzingSection({ t }: { t: (typeof copy)[Language] }) {
  return (
    <section className="mx-auto flex min-h-[520px] max-w-7xl items-center justify-center px-5 py-16 md:px-8">
      <div className="max-w-xl rounded-2xl border border-[#dbe5f1] bg-white p-10 text-center shadow-[0_22px_54px_rgba(15,35,65,0.08)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.compare}</p>
        <h2 className="text-3xl font-semibold text-[#10243f]">{t.analyzingTitle}</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">{t.analyzingCopy}</p>
      </div>
    </section>
  );
}

function ResultsSection({
  t,
  language,
  file1,
  file2,
  onNewComparison,
}: {
  t: (typeof copy)[Language];
  language: Language;
  file1: File | null;
  file2: File | null;
  onNewComparison: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">{t.results}</p>
          <h2 className="max-w-3xl text-4xl font-semibold text-[#10243f]">{t.resultsTitle}</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{t.resultsCopy}</p>
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
        <MetricCard label={t.totalSavings} value="$190" helper="7.1% lower than Quote A" />
        <MetricCard label={t.recommendedVendor} value={t.quoteB} helper="3 of 4 matched lines are lower" />
        <MetricCard label={t.coverageGaps} value="2" helper="Items appear in only one quote" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
          <div className="border-b border-[#e7edf5] px-6 py-5">
            <h3 className="text-lg font-semibold text-[#10243f]">{t.summary}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {file1?.name || t.selectedFirst} vs {file2?.name || t.selectedSecond}
            </p>
          </div>

          <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.5fr] gap-4 border-b border-[#eef3f8] px-6 py-4 text-sm font-bold text-slate-500">
            <div>{t.previewHeaders[0]}</div>
            <div className="text-right">{t.quoteA}</div>
            <div className="text-right">{t.quoteB}</div>
            <div className="text-right">{t.delta}</div>
          </div>

          {resultRows.map((row) => (
            <div
              key={row.item}
              className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.5fr] gap-4 border-b border-[#eef3f8] px-6 py-4 last:border-b-0"
            >
              <div>
                <p className="font-semibold text-[#10243f]">{row.item}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
              </div>
              <QuoteValue value={row.quoteA} />
              <QuoteValue value={row.quoteB} />
              <DeltaValue
                value={getDeltaValue(row, t)}
                tone={row.tone}
                color={'color' in row ? row.color : undefined}
                stacked={'basis' in row && row.basis === 'different' && language === 'en'}
              />
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
          <h3 className="text-lg font-semibold text-[#10243f]">{t.keyInsights}</h3>
          <div className="mt-5 space-y-4">
            {t.insightItems.map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-[#b8c9df] bg-[#f8fbff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t.recommendation}</p>
            <p className="mt-2 text-lg font-bold text-[#1e3a5f]">{t.recommendationValue}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function QuoteValue({ value }: { value: string }) {
  if (value === 'Not included') {
    return <div className="text-right text-lg font-semibold text-amber-600">-</div>;
  }

  return <div className="text-right font-semibold text-slate-700">{value}</div>;
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
