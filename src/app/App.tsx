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

const previewRows = [
  { item: 'Workstation', quoteA: '$2,400', quoteB: '$2,280', delta: '-120', tone: 'text-emerald-600' },
  { item: 'Display 27”', quoteA: '$580', quoteB: '$620', delta: '+40', tone: 'text-rose-600' },
  { item: 'Onsite setup', quoteA: '$200', quoteB: '$150', delta: '-50', tone: 'text-emerald-600' },
  { item: '3-yr support', quoteA: '$720', quoteB: '$690', delta: '-30', tone: 'text-emerald-600' },
];

const featureCards = [
  {
    icon: FileSearch,
    title: 'Considered extraction',
    copy: 'We parse vendor, items, quantities, unit prices, totals, delivery and payment terms, even when each quote uses different wording.',
  },
  {
    icon: Layers3,
    title: 'Side-by-side, line by line',
    copy: 'Items are matched across both documents. Variances are highlighted so you can see at a glance where each vendor wins.',
  },
  {
    icon: Sparkles,
    title: 'Insights, not noise',
    copy: 'Beyond the table, a brief executive summary calls out the meaningful differences in price, terms and risk.',
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const showCompare = () => {
    setErrorMessage('');
    setActiveView('compare');
  };

  const showHistory = () => {
    console.log('History view requested');
    setActiveView('history');
  };

  const handleFileUpload = (fileNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      setErrorMessage('PDF 파일만 업로드할 수 있습니다.');
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
      // TODO: 견적서 비교 분석 로직을 연결합니다.
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
              Compare
            </button>
            <button
              type="button"
              onClick={showHistory}
              className={`border-0 bg-transparent transition-colors hover:text-[#1e3a5f] ${
                activeView === 'history' ? 'text-[#1e3a5f]' : ''
              }`}
            >
              History
            </button>
          </nav>

          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <div className="hidden items-center gap-2 sm:flex">
              <Globe2 className="h-4 w-4" />
              <span>EN</span>
            </div>
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
                  Procurement intelligence
                </div>
                <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] text-[#10243f] md:text-7xl">
                  Two quotations.
                  <br />
                  One clear decision.
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                  QuoteWise reads your supplier PDFs, aligns line items across vendors, and surfaces
                  the differences that actually move the needle.
                </p>
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
                    Start a comparison
                  </Button>
                  <button
                    type="button"
                    onClick={showHistory}
                    className="inline-flex h-12 items-center justify-center rounded-lg border-0 bg-transparent px-5 text-base font-semibold text-[#10243f] transition-colors hover:text-[#2563eb]"
                  >
                    View history
                  </button>
                </div>
              </div>

              <ComparisonPreview />
            </section>

            <section className="border-t border-[#dbe5f1] bg-white/58">
              <div className="mx-auto grid max-w-7xl gap-6 px-5 py-16 md:grid-cols-3 md:px-8 md:py-20">
                {featureCards.map((feature) => {
                  const Icon = feature.icon;
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
            file1={file1}
            file2={file2}
            errorMessage={errorMessage}
            onFileUpload={handleFileUpload}
            onAnalyze={handleAnalyze}
          />
        ) : null}

        {activeView === 'history' ? <HistorySection onStartComparison={showCompare} /> : null}
      </main>
    </div>
  );
}

function ComparisonPreview() {
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
        <div className="font-semibold text-slate-500">Item</div>
        <div className="text-right font-semibold text-slate-500">Quote A</div>
        <div className="text-right font-semibold text-slate-500">Quote B</div>
        <div className="text-right font-semibold text-slate-500">Δ</div>

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
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
          Recommendation
        </span>
        <span className="rounded-full border border-[#b8c9df] bg-[#f8fbff] px-4 py-2 text-sm font-bold text-[#1e3a5f]">
          Quote B · save $190
        </span>
      </div>
    </div>
  );
}

function UploadSection({
  file1,
  file2,
  errorMessage,
  onFileUpload,
  onAnalyze,
}: {
  file1: File | null;
  file2: File | null;
  errorMessage: string;
  onFileUpload: (fileNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#2563eb]">Compare</p>
        <h2 className="text-4xl font-semibold text-[#10243f]">Upload two supplier quotations</h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Drop in two PDF quotes and QuoteWise will prepare them for line-by-line comparison.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard
          id="file1-upload"
          file={file1}
          title="첫 번째 견적서 업로드"
          selectedTitle="견적서 1"
          onChange={(event) => onFileUpload(1, event)}
        />
        <UploadCard
          id="file2-upload"
          file={file2}
          title="두 번째 견적서 업로드"
          selectedTitle="견적서 2"
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
          비교 분석 시작하기
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
  onChange,
}: {
  id: string;
  file: File | null;
  title: string;
  selectedTitle: string;
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
                <p className="text-sm text-slate-500">PDF 파일을 선택하거나 여기에 끌어다 놓으세요.</p>
              </div>
            </>
          )}
        </div>
      </label>
    </div>
  );
}

function HistorySection({ onStartComparison }: { onStartComparison: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="rounded-2xl border border-[#dbe5f1] bg-white p-10 shadow-[0_18px_42px_rgba(15,35,65,0.06)]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <History className="h-5 w-5" />
        </div>
        <h2 className="text-3xl font-semibold text-[#10243f]">History is coming soon</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Your previous comparison reports will appear here once project storage is connected.
        </p>
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
          Start a comparison
        </Button>
      </div>
    </section>
  );
}
