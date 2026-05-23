import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Globe2,
  History,
  Layers3,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import { Button } from '@mui/material';
import Logo from './components/Logo';

type ActiveView = 'home' | 'compare' | 'history';
type Language = 'en' | 'ko' | 'ja';

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
    pdfError: 'Only PDF files can be uploaded.',
    historyTitle: 'History is coming soon',
    historyCopy: 'Your previous comparison reports will appear here once project storage is connected.',
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
    pdfError: 'PDF 파일만 업로드할 수 있습니다.',
    historyTitle: '기록 기능은 준비 중입니다',
    historyCopy: '프로젝트 저장 기능이 연결되면 이전 비교 리포트가 이곳에 표시됩니다.',
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
    pdfError: 'PDFファイルのみアップロードできます。',
    historyTitle: '履歴機能は準備中です',
    historyCopy: 'プロジェクト保存機能が接続されると、過去の比較レポートがここに表示されます。',
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

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const t = copy[language];

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
  };

  const handleFileUpload = (fileNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
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
      // TODO: 견적서 비교 분석 로직에 연결합니다.
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#10243f]">
      <header className="sticky top-0 z-20 border-b border-[#dbe5f1] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center border-0 bg-transparent p-0"
            aria-label="Go to QuoteWise home"
          >
            <Logo className="h-10 w-auto" />
          </button>

          <nav className="hidden items-center gap-10 text-sm font-medium text-slate-500 md:flex">
            <button
              type="button"
              onClick={showCompare}
              className={`border-0 bg-transparent transition-colors hover:text-[#1e3a5f] ${
                activeView === 'compare' ? 'text-[#1e3a5f]' : ''
              }`}
            >
              {t.compare}
            </button>
            <button
              type="button"
              onClick={showHistory}
              className={`border-0 bg-transparent transition-colors hover:text-[#1e3a5f] ${
                activeView === 'history' ? 'text-[#1e3a5f]' : ''
              }`}
            >
              {t.history}
            </button>
          </nav>

          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <label className="hidden items-center gap-2 sm:flex">
              <Globe2 className="h-4 w-4" />
              <select
                value={language}
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="rounded-md border border-transparent bg-transparent px-1 py-1 font-semibold text-slate-600 outline-none transition-colors hover:border-[#c8d7eb] focus:border-[#2563eb] focus:bg-white"
              >
                {languages.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.short} · {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>종환 정</span>
            </div>
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
                    className="inline-flex h-12 items-center justify-center rounded-lg border-0 bg-transparent px-5 text-base font-semibold text-[#10243f] transition-colors hover:text-[#2563eb]"
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

        {activeView === 'history' ? <HistorySection t={t} onStartComparison={showCompare} /> : null}
      </main>
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
