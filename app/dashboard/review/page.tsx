'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, AlertTriangle, RotateCcw, ChevronRight, X, Save, Wallet } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/components/app/WalletContext';

const dataClient = generateClient<Schema>();

interface ReviewQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; value: string }>;
}

interface ReviewData {
  prompt: string;
  userProfileId: string;
  portfolioName: string;
  holdings: Array<{ symbol: string; name?: string; balance: number; price: number }>;
  questions: ReviewQuestion[];
}

interface AnalysisResult {
  overallScore: number;
  overallLabel: string;
  overallSummary: string;
  fundamentalsScore: number;
  fundamentalsExplanation: string;
  onchainScore: number;
  onchainExplanation: string;
  factorExplanations: {
    concentration: string;
    marketExposure: string;
    liquidity: string;
    issuer: string;
  };
  personalizationNote: string;
  hiddenRisks: string[];
  deterministicFactors: {
    concentration: number;
    marketExposure: number;
    liquidity: number;
    issuer: number;
  };
  portfolioStats: {
    totalValue: number;
    largestPct: number;
    top3Pct: number;
    topSectors: Array<{ sector: string; pct: number }>;
  };
}

type Phase = 'questions' | 'analyzing' | 'results' | 'error';

function scoreColor(score: number): string {
  if (score <= 30) return 'text-emerald-400';
  if (score <= 60) return 'text-yellow-400';
  if (score <= 80) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBarColor(score: number): string {
  if (score <= 30) return 'bg-emerald-400';
  if (score <= 60) return 'bg-yellow-400';
  if (score <= 80) return 'bg-orange-400';
  return 'bg-red-400';
}

function scoreHexColor(score: number): string {
  if (score <= 30) return '#34d399';
  if (score <= 60) return '#facc15';
  if (score <= 80) return '#fb923c';
  return '#f87171';
}

function ScoreDonut({ score, size = 150 }: { score: number; size?: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = scoreHexColor(score);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-white/30">/ 100</span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { address } = useWallet();
  const [connectedProfileId, setConnectedProfileId] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('questions');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [analyzingMsg, setAnalyzingMsg] = useState(0);
  const [selectedFactor, setSelectedFactor] = useState<{ name: string; score: number; explanation: string } | null>(null);

  const handleSave = async () => {
    if (!result || !data || saved) return;
    const targetProfileId = connectedProfileId || data.userProfileId;
    try {
      const enrichedAnswers: Record<string, { q: string; a: string }> = {};
      for (const q of data.questions) {
        enrichedAnswers[q.id] = { q: q.question, a: answers[q.id] ?? "" };
      }
      await dataClient.models.SavedReview.create({
        userProfileId: targetProfileId,
        portfolioName: data.portfolioName,
        prompt: data.prompt,
        holdings: JSON.stringify(data.holdings),
        answers: JSON.stringify(enrichedAnswers),
        report: JSON.stringify(result),
        overallScore: result.overallScore,
        overallLabel: result.overallLabel,
        chats: JSON.stringify([]),
      });
      setSaved(true);
    } catch (err) {
      console.error('[Review] save failed:', err);
    }
  };

  const handleNewReview = () => {
    sessionStorage.removeItem('xray-review');
    sessionStorage.removeItem('xray-review-answers');
    router.push('/dashboard');
  };

  useEffect(() => {
    const raw = sessionStorage.getItem('xray-review');
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        setData(null);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!address) { setConnectedProfileId(null); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({ filter: { walletAddress: { eq: address } } });
        if (profiles && profiles.length > 0) {
          setConnectedProfileId(profiles[0].id);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({ walletAddress: address, credits: 1000 });
          if (created) setConnectedProfileId(created.id);
        }
      } catch (err) { console.error('[Review] profile load failed:', err); }
    })();
  }, [address]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const msgs = ['Analyzing holdings…', 'Assessing fundamentals…', 'Evaluating concentration…', 'Checking issuer risk…', 'Synthesizing score…'];
    const timer = setInterval(() => setAnalyzingMsg((m) => (m + 1) % msgs.length), 2500);
    return () => clearInterval(timer);
  }, [phase]);

  const totalSteps = data?.questions.length ?? 0;
  const isLastStep = data ? currentStep === data.questions.length - 1 : false;
  const currentQuestion = data?.questions[currentStep];
  const currentAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;
  const allAnswered = data ? data.questions.every((q) => answers[q.id]) : false;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const runAnalysis = async () => {
    if (!allAnswered || !data?.userProfileId || !data.holdings?.length) return;
    setPhase('analyzing');
    try {
      const enrichedAnswers: Record<string, { q: string; a: string }> = {};
      for (const q of data.questions) {
        enrichedAnswers[q.id] = { q: q.question, a: answers[q.id] ?? "" };
      }
      const { data: resData, errors } = await dataClient.queries.riskReview({
        action: 'runAnalysis',
        userProfileId: data.userProfileId,
        prompt: data.prompt,
        holdings: JSON.stringify(data.holdings),
        answers: JSON.stringify(enrichedAnswers),
      });
      if (errors?.length) console.error('[Review] runAnalysis errors:', errors);
      const parsed = typeof resData === 'string' ? JSON.parse(resData) : resData;
      if (parsed?.overallScore != null) {
        setResult(parsed);
        setPhase('results');
      } else {
        console.error('[Review] no analysis returned');
        setPhase('error');
      }
    } catch (err) {
      console.error('[Review] runAnalysis failed:', err);
      setPhase('error');
    }
  };

  const handleNext = () => {
    if (!currentAnswered) return;
    if (isLastStep) {
      void runAnalysis();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  if (loaded && !data) {
    return (
      <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] text-white/50 mb-4">No review in progress</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 transition-colors"
          >
            Start a New Review
          </button>
        </div>
      </div>
    );
  }

  const analyzingMessages = ['Analyzing holdings…', 'Assessing fundamentals…', 'Evaluating concentration…', 'Checking issuer risk…', 'Synthesizing score…'];

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      <div className={`relative z-1 h-full overflow-y-auto flex flex-col items-center px-6 py-10 mx-auto w-full ${phase === 'results' ? 'w-full px-4 py-4' : 'max-w-2xl'}`}>
        <AnimatePresence mode="wait">
          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh]"
            >
              <div className="w-14 h-14 rounded-full border-2 border-accent/30 border-t-accent animate-spin mb-6" />
              <p className="text-[15px] text-white/60 font-medium mb-2">{analyzingMessages[analyzingMsg]}</p>
              <p className="text-[12px] text-white/30">{data?.portfolioName}</p>
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh]"
            >
              <div className="w-14 h-14 rounded-full bg-orange-400/10 border border-orange-400/30 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-[15px] text-white/70 font-medium mb-2">Analysis timed out</p>
              <p className="text-[12px] text-white/35 text-center mb-6 max-w-xs leading-relaxed">
                The analysis took too long to return. Give it another try — your answers are saved.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('questions')}
                  className="px-4 h-10 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Back to Questions
                </button>
                <button
                  onClick={() => void runAnalysis()}
                  className="flex items-center gap-2 px-5 h-10 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Analysis
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex items-stretch gap-4"
            >
              <div className="w-[340px] shrink-0 flex flex-col gap-4">
                <div className="bg-surface border border-border3 rounded-xl p-5">
                  <div className="flex items-center gap-5">
                    <ScoreDonut score={result.overallScore} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/40 mb-0.5">Portfolio Risk</p>
                      <p className={`text-[16px] font-semibold ${scoreColor(result.overallScore)}`}>
                        {result.overallLabel} Risk
                      </p>
                      <p className="text-[11px] text-white/30 mt-2">
                        ${result.portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[11px] text-white/30">{data?.portfolioName}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-white/55 leading-relaxed mt-4">{result.overallSummary}</p>
                  {result.personalizationNote && (
                    <p className="text-[11px] text-white/35 leading-relaxed mt-2 italic">{result.personalizationNote}</p>
                  )}
                </div>

                <div className="bg-surface border border-border3 rounded-xl p-5 flex-1 min-h-0">
                  <p className="text-[12px] font-semibold text-white/70 mb-3">Analyzed Holdings</p>
                  <div className="space-y-2.5">
                    {data?.holdings
                      ?.filter((h) => h.balance > 0.00001 && h.price > 0)
                      .slice()
                      .sort((a, b) => b.balance * b.price - a.balance * a.price)
                      .map((h) => {
                        const value = h.balance * h.price;
                        const total = result.portfolioStats.totalValue || 1;
                        const pct = (value / total) * 100;
                        return (
                          <div key={h.symbol} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-white/85 truncate">{h.symbol}</p>
                              <p className="text-[10px] text-white/35">
                                {h.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[12px] text-white/80">
                                ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-white/35">{pct.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-4">
                <div className="bg-surface border border-border3 rounded-xl p-5">
                  <p className="text-[12px] font-semibold text-white/70 mb-3">Risk Factors</p>
                  <div className="space-y-1">
                    {[
                      { name: 'Concentration', score: result.deterministicFactors.concentration, explanation: result.factorExplanations.concentration },
                      { name: 'Market Exposure', score: result.deterministicFactors.marketExposure, explanation: result.factorExplanations.marketExposure },
                      { name: 'Liquidity', score: result.deterministicFactors.liquidity, explanation: result.factorExplanations.liquidity },
                      { name: 'Issuer Risk', score: result.deterministicFactors.issuer, explanation: result.factorExplanations.issuer },
                      { name: 'Fundamentals', score: result.fundamentalsScore, explanation: result.fundamentalsExplanation },
                      { name: 'On-chain Factors', score: result.onchainScore, explanation: result.onchainExplanation },
                    ].map((f, idx) => (
                      <motion.button
                        key={f.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => setSelectedFactor(f)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <span className="text-[12px] font-medium text-white/75 w-32 shrink-0 truncate">{f.name}</span>
                        <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.score}%` }}
                            transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                            className={`h-full rounded-full ${scoreBarColor(f.score)}`}
                          />
                        </div>
                        <span className={`text-[13px] font-semibold w-7 text-right shrink-0 ${scoreColor(f.score)}`}>{f.score}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface border border-border3/60 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-[12px] font-semibold text-white/70">Hidden Risks</span>
                  </div>
                  <ul className="space-y-2">
                    {result.hiddenRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[12px] text-white/55 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-3 mt-auto pb-1">
                  {!address ? (
                    <div className="flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-medium text-white/30 border border-border3/30">
                      <Wallet className="w-4 h-4" />
                      Connect wallet to save
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleSave()}
                      disabled={saved}
                      className={`flex items-center gap-2 px-4 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                        saved
                          ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
                          : 'bg-accent text-white hover:bg-accent/80'
                      }`}
                    >
                      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? 'Saved' : 'Save Review & Chat'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-6">
                Help us understand you better
              </p>

              {data && (
                <div className="flex items-center gap-2 mb-8">
                  {data.questions.map((q, idx) => (
                    <span
                      key={q.id}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep
                          ? 'w-6 bg-accent'
                          : idx < currentStep
                            ? 'w-1.5 bg-accent/50'
                            : 'w-1.5 bg-white/10'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-white/30 ml-2">
                    {currentStep + 1} / {totalSteps}
                  </span>
                </div>
              )}

              {!data || !currentQuestion ? (
                <div className="w-full bg-surface border border-border3/50 rounded-xl p-5 space-y-3 animate-pulse">
                  <div className="h-4 w-2/3 bg-white/[0.05] rounded" />
                  <div className="h-10 bg-white/[0.03] rounded-lg" />
                  <div className="h-10 bg-white/[0.03] rounded-lg" />
                </div>
              ) : (
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="bg-surface border border-border3 rounded-xl p-6"
                    >
                      <p className="text-[15px] font-medium text-white/85 mb-4">
                        {currentQuestion.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentQuestion.options.map((opt) => {
                          const selected = answers[currentQuestion.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleSelect(currentQuestion.id, opt.value)}
                              className={`flex items-center gap-2 px-3 py-3 rounded-lg border text-[13px] text-left transition-colors ${
                                selected
                                  ? 'bg-accent/15 border-accent/50 text-white'
                                  : 'bg-white/[0.02] border-border3/50 text-white/60 hover:text-white/80 hover:border-border3'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  selected ? 'border-accent bg-accent' : 'border-border3'
                                }`}
                              >
                                {selected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                      disabled={currentStep === 0}
                      className={`flex items-center gap-1.5 px-4 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                        currentStep > 0
                          ? 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                          : 'text-white/20 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!currentAnswered}
                      className={`flex items-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                        currentAnswered
                          ? 'bg-accent text-white hover:bg-accent/80'
                          : 'bg-white/[0.06] border border-border3/50 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {isLastStep ? 'Run Analysis' : 'Next'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedFactor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFactor(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-border3 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border3/50">
                <span className="text-[14px] font-semibold text-white/85">{selectedFactor.name}</span>
                <button
                  onClick={() => setSelectedFactor(null)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="flex items-center gap-4 mb-5">
                  <ScoreDonut score={selectedFactor.score} size={110} />
                  <div>
                    <p className="text-[11px] text-white/40 mb-0.5">Factor Score</p>
                    <p className={`text-[15px] font-semibold ${scoreColor(selectedFactor.score)}`}>
                      {selectedFactor.score}/100
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-white/65 leading-relaxed">{selectedFactor.explanation}</p>
                <div className="mt-5 pt-4 border-t border-border3/40">
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    Scores: 0-30 Low · 31-60 Moderate · 61-80 High · 81-100 Very High
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
