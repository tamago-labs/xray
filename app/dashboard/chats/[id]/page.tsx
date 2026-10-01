'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Trash2, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import TradeBox, { TradeData } from '@/components/dashboard/chats/TradeBox';
import { useWallet } from '@/components/app/WalletContext';

const dataClient = generateClient<Schema>();
const MIN_CREDITS = 1;

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ReviewReport {
  overallScore: number;
  overallLabel: string;
  overallSummary: string;
  fundamentalsScore: number;
  fundamentalsExplanation: string;
  onchainScore: number;
  onchainExplanation: string;
  factorExplanations: { concentration: string; marketExposure: string; liquidity: string; issuer: string; };
  personalizationNote: string;
  hiddenRisks: string[];
  deterministicFactors: { concentration: number; marketExposure: number; liquidity: number; issuer: number; };
  portfolioStats?: { totalValue: number; largestPct: number; top3Pct: number; };
}

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

function ScoreDonut({ score, size = 90 }: { score: number; size?: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score <= 30 ? '#34d399' : score <= 60 ? '#facc15' : score <= 80 ? '#fb923c' : '#f87171';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
      </div>
    </div>
  );
}

export default function ChatSession() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { address, provider } = useWallet();
  const [review, setReview] = useState<{ portfolioName: string; report: ReviewReport; prompt: string; holdings: Array<{ symbol: string; name?: string; balance: number; price: number }>; answers: Record<string, { q: string; a: string }> } | null>(null);
  const [reviewDrawer, setReviewDrawer] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!address) { setCredits(null); return; }
    dataClient.models.UserProfile.list({ filter: { walletAddress: { eq: address } } }).then((res) => {
      setCredits(res.data?.[0]?.credits ?? null);
    }).catch(() => setCredits(null));
  }, [address]);

  useEffect(() => {
    dataClient.models.SavedReview.get({ id }).then((res) => {
      if (res.data?.report) {
        setReview({
          portfolioName: res.data.portfolioName,
          prompt: res.data.prompt,
          holdings: res.data.holdings ? JSON.parse(res.data.holdings as string) : [],
          answers: res.data.answers ? JSON.parse(res.data.answers as string) : {},
          report: JSON.parse(res.data.report as string) as ReviewReport,
        });
        const chats = res.data.chats ? JSON.parse(res.data.chats as string) : [];
        if (Array.isArray(chats) && chats.length > 0) setMessages(chats);
      }
    }).catch(() => {});
  }, [id]);

  const saveChats = async (updatedMessages: Message[]) => {
    try {
      await dataClient.models.SavedReview.update({
        id,
        chats: JSON.stringify(updatedMessages),
      });
    } catch (err) {
      console.error('[Chat] save chats failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    try {
      await dataClient.models.SavedReview.delete({ id });
      router.push('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (credits !== null && credits < MIN_CREDITS) {
      setError(`Insufficient credits. You have ${credits.toFixed(2)} credits.`);
      return;
    }
    const message = input.trim();
    setInput('');
    setError('');
    const updatedMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(updatedMessages);
    setLoading(true);
    setActiveAgent(null);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_CHAT_API_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, message }),
      });
      if (!res.ok) throw new Error('Request failed');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let aiContent = '';
      setMessages((prev) => [...prev, { role: 'ai', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.chunk) {
              aiContent += json.chunk;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], role: 'ai', content: aiContent };
                return next;
              });
            }
            if (json.agent) setActiveAgent(json.agent);
            if (json.error) setError(json.error);
            if (json.trade) setTrades((prev) => [...prev, json.trade as TradeData]);
          } catch {}
        }
      }
      const finalMessages = [...updatedMessages, { role: 'ai' as const, content: aiContent }];
      await saveChats(finalMessages);
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      setLoading(false);
      setActiveAgent(null);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex flex-col grid-bg overflow-hidden relative min-w-0">
        <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
        <div className="border-b border-border3/50 px-6 py-4 relative z-1 flex items-center justify-between">
          <h1 className="font-display text-lg font-semibold">Chat Further With AI</h1>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border3/50 bg-surface shadow-xl z-20 overflow-hidden">
                  <button onClick={handleDelete} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete review</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
          {messages.map((msg, i) => {
            if (msg.role === 'ai' && !msg.content) {
              return loading && i === messages.length - 1 ? (
                <div key="thinking" className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl px-4 py-3 text-[14px] bg-white/[0.03] border border-border3/50 text-white/40">
                    Thinking…
                  </div>
                </div>
              ) : null;
            }
            return (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-white/[0.03] border border-border3/50 text-white/80 prose prose-invert prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-black/30 prose-pre:border prose-pre:border-border3/50 prose-code:text-accent prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none'
                }`}>
                  {msg.role === 'ai' && activeAgent && i === messages.length - 1 && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-accent mb-2 block">
                      <span className="relative flex items-center justify-center w-3 h-3">
                        <span className="absolute w-2.5 h-2.5 rounded-full bg-accent/30 animate-ping" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent relative z-10" />
                      </span>
                      Using {activeAgent}
                    </span>
                  )}
                  {msg.role === 'ai' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {trades.filter((t) => t.status === 'pending' && t.tokenIn && t.tokenOut && t.estimatedOutput != null).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTrades((prev) => prev.map((t) => ({ ...t, status: 'cancelled' })))} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md rounded-2xl border border-border3/50 bg-surface p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-white/90">Confirm Trade</h3>
                  <button onClick={() => setTrades((prev) => prev.map((t) => ({ ...t, status: 'cancelled' })))} className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {trades.filter((t) => t.status === 'pending').map((trade, i) => (
                  <TradeBox key={i} trade={trade} provider={provider} address={address}
                    onExecuted={(sig) => setTrades((prev) => prev.map((t, j) => j === i ? { ...t, status: 'executed', signature: sig } : t))}
                    onError={setError}
                    onCancel={() => setTrades((prev) => prev.map((t, j) => j === i ? { ...t, status: 'cancelled' } : t))}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-border3/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message…" className="flex-1 bg-white/[0.03] border border-border3/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors" />
            <button onClick={handleSend} disabled={loading || (credits !== null && credits < MIN_CREDITS)} className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0 disabled:opacity-50">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        </div>
      </div>

      {review && (
        <div className="w-72 shrink-0 border-l border-border3/50 bg-surface overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border3/40">
            <div className="flex items-center gap-3">
              <ScoreDonut score={review.report.overallScore} size={64} />
              <div className="min-w-0">
                <p className={`text-[13px] font-semibold ${scoreColor(review.report.overallScore)}`}>{review.report.overallLabel} Risk</p>
                <p className="text-[10px] text-white/30 truncate">Portfolio: {review.portfolioName}</p>
              </div>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            <p className="text-[11px] text-white/50 leading-relaxed">{review.report.overallSummary}</p>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Holdings</p>
              <div className="space-y-1.5">
                {review.holdings?.filter(h => h.balance > 0.00001 && h.price > 0).sort((a, b) => b.balance * b.price - a.balance * a.price).map(h => {
                  const val = h.balance * h.price;
                  const total = review.report.portfolioStats?.totalValue || 1;
                  return (
                    <div key={h.symbol} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/60">{h.symbol}</span>
                      <span className="text-[11px] text-white/45">${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({(val / total * 100).toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setReviewDrawer(true)} className="flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 transition-colors text-left mt-auto">
              View factor breakdown
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {reviewDrawer && review && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewDrawer(false)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-surface border-l border-border3 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border3/50 shrink-0">
                <div className="flex items-center gap-3">
                  <ScoreDonut score={review.report.overallScore} size={48} />
                  <div>
                    <p className={`text-[14px] font-bold ${scoreColor(review.report.overallScore)}`}>{review.report.overallLabel} Risk</p>
                    <p className="text-[11px] text-white/40">Portfolio: {review.portfolioName}</p>
                  </div>
                </div>
                <button onClick={() => setReviewDrawer(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Summary</p>
                  <p className="text-[13px] text-white/65 leading-relaxed">{review.report.overallSummary}</p>
                  {review.report.personalizationNote && <p className="text-[12px] text-white/40 mt-2 italic">{review.report.personalizationNote}</p>}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Factor Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Concentration', score: review.report.deterministicFactors.concentration, explanation: review.report.factorExplanations.concentration },
                      { name: 'Market Exposure', score: review.report.deterministicFactors.marketExposure, explanation: review.report.factorExplanations.marketExposure },
                      { name: 'Liquidity', score: review.report.deterministicFactors.liquidity, explanation: review.report.factorExplanations.liquidity },
                      { name: 'Issuer Risk', score: review.report.deterministicFactors.issuer, explanation: review.report.factorExplanations.issuer },
                      { name: 'Fundamentals', score: review.report.fundamentalsScore, explanation: review.report.fundamentalsExplanation },
                      { name: 'On-chain Factors', score: review.report.onchainScore, explanation: review.report.onchainExplanation },
                    ].map(f => (
                      <div key={f.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-white/70">{f.name}</span>
                          <span className={`text-[12px] font-semibold ${scoreColor(f.score)}`}>{f.score}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-1">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 0.5 }} className={`h-full rounded-full ${scoreBarColor(f.score)}`} />
                        </div>
                        <p className="text-[11px] text-white/45 leading-relaxed">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Hidden Risks</p>
                  <ul className="space-y-2">
                    {review.report.hiddenRisks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-white/55 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Your Answers</p>
                  <div className="space-y-1.5">
                    {Object.values(review.answers).map((qa, i) => (
                      <div key={i} className="text-[11px] text-white/45 leading-relaxed">
                        <span className="text-white/55">{qa.q}</span> <span className="text-white/30">→</span> {qa.a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
