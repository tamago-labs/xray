'use client';

import { useState, useRef, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Plus, X, Lightbulb } from 'lucide-react';

import { useWallet } from '@/components/app/WalletContext';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { usePrices } from '@/app/contexts/PriceContext';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useRwaBalances } from '@/hooks/useRwaBalances';
import { useTrackedTokens } from '@/hooks/useTrackedTokens';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();
const MIN_CREDITS = 1;

const presetPrompts = [
  "What are the hidden risks in my portfolio?",
  "Which of my holdings are most at risk?",
  "What would a balanced version of my portfolio look like?",
];



interface DemoToken {
  symbol: string;
  name: string;
  amount: number;
  logo: string | null;
}

interface DemoPortfolio {
  name: string;
  tokens: DemoToken[];
}

const logoMap = new Map<string, string | null>();
for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.symbol && token.contractAddress?.xlayer && !logoMap.has(token.symbol)) {
      logoMap.set(token.symbol, token.logo ?? null);
    }
  }
}
for (const bt of [...BASE_TOKENS, ...BASE_TOKENS_TESTNET]) {
  if (!logoMap.has(bt.symbol)) {
    logoMap.set(bt.symbol, bt.logo);
  }
}
const getLogo = (symbol: string) => logoMap.get(symbol) ?? null;



function NewChatInner() {
  const router = useRouter();
  const { isConnected, address, chainId } = useWallet();
  const [input, setInput] = useState('What are the hidden risks in my portfolio?');

  const [sending, setSending] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [ideasOpen, setIdeasOpen] = useState(false);
  const ideasRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [attached, setAttached] = useState<DemoPortfolio | null>(null);
  const [expandedWallet, setExpandedWallet] = useState(false);
  const [userPortfolios, setUserPortfolios] = useState<{ id: string; name: string; tokens: DemoToken[] }[]>([]);
  const { prices, loading: rwaLoading } = usePrices();
  const { prices: basePrices, loading: baseLoading } = useBaseTokenPrices();
  const loading = rwaLoading || baseLoading;
  const { balances: walletBalances } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { tracked } = useTrackedTokens(address ?? undefined);
  const trackedSymbols = tracked.map((t) => t.symbol);
  const { balances: rwaBalances } = useRwaBalances(address ?? undefined, chainId ?? undefined, trackedSymbols);

  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!address) { setCredits(null); return; }
    dataClient.models.UserProfile.list({
      filter: { walletAddress: { eq: address } },
    }).then((res) => {
      setCredits(res.data?.[0]?.credits ?? null);
    }).catch(() => setCredits(null));
  }, [address]);



  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
      if (ideasRef.current && !ideasRef.current.contains(e.target as Node)) {
        setIdeasOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadUserPortfolios = useCallback(async () => {
    if (!address) { setUserPortfolios([]); return; }
    try {
      const { data: profiles } = await dataClient.models.UserProfile.list({
        filter: { walletAddress: { eq: address } },
      });
      if (!profiles.length) { setUserPortfolios([]); return; }
      const { data: portfolios } = await dataClient.models.Portfolio.list({
        filter: { userProfileId: { eq: profiles[0].id } },
      });
      const portfoliosWithTokens = await Promise.all(
        (portfolios ?? []).map(async (p) => {
          const { data: tokens } = await dataClient.models.PortfolioToken.list({
            filter: { portfolioId: { eq: p.id } },
          });
          return {
            id: p.id,
            name: p.name,
            tokens: (tokens ?? []).map((t) => {
              const meta = logoMap.get(t.symbol);
              return {
                symbol: t.symbol,
                name: t.name ?? t.symbol,
                amount: t.customValue ?? 0,
                logo: meta ?? null,
              };
            }),
          };
        })
      );
      setUserPortfolios(portfoliosWithTokens);
    } catch {
      setUserPortfolios([]);
    }
  }, [address]);

  const walletTokens = useMemo(() => {
    const result: DemoToken[] = [];
    const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
    for (const token of tokens) {
      const balance = parseFloat(walletBalances[token.symbol] ?? '0');
      if (balance > 0) {
        result.push({ symbol: token.symbol, name: token.name, amount: balance, logo: token.logo ?? null });
      }
    }
    for (const t of tracked) {
      const balance = parseFloat(rwaBalances[t.symbol] ?? '0');
      if (balance > 0) {
        const logo = t.logo ?? logoMap.get(t.symbol) ?? null;
        result.push({ symbol: t.symbol, name: t.name, amount: balance, logo });
      }
    }
    return result;
  }, [chainId, walletBalances, tracked, rwaBalances]);

  useEffect(() => {
    if (popoverOpen && isConnected) {
      void loadUserPortfolios();
    }
  }, [popoverOpen, isConnected, loadUserPortfolios]);

  const handleSend = async () => {
    if (!input.trim() || !isConnected || !address || sending || !attached) return;
    if (credits !== null && credits < MIN_CREDITS) {
      setError(`Insufficient credits. You have ${credits.toFixed(2)} credits.`);
      return;
    }
    setSending(true);
    try {
      const { data: profiles } = await dataClient.models.UserProfile.list({
        filter: { walletAddress: { eq: address } },
      });
      const profileId = profiles[0].id;

      const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p.price ?? 0]));
      const holdings = attached.tokens.map((t) => {
        const rwaPrice = rwaPriceMap.get(t.symbol);
        const price = rwaPrice != null ? rwaPrice : basePrices[t.symbol]?.price ?? 0;
        return { symbol: t.symbol, name: t.name, balance: t.amount, price };
      });

      const { data, errors } = await dataClient.queries.riskReview({
        userProfileId: profileId,
        prompt: input.trim(),
        holdings: JSON.stringify(holdings),
      });
      if (errors?.length) console.error('[handleSend] riskReview errors:', errors);
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.questions?.length) {
        sessionStorage.setItem('xray-review', JSON.stringify({
          prompt: input.trim(),
          userProfileId: profileId,
          portfolioName: attached.name,
          holdings,
          questions: result.questions,
        }));
        router.push('/dashboard/review');
      } else {
        console.error('[handleSend] no questions returned');
      }
    } catch (err) {
      console.error('[handleSend] failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      {/* Content */}
      <div className="relative z-1 h-full flex flex-col items-center justify-center px-6 max-w-3xl mx-auto">
        {/* Example prompt */}
        <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-8">
          &ldquo;What&apos;s the real story behind your assets?&rdquo;
        </p>

        {/* Input with glow */}
        <div className="w-full bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Xray anything about your assets…"
            rows={1}
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[60px] p-4"
          />
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Portfolio attach */}
              <div ref={popoverRef} className="relative shrink-0">
                {attached ? (
                  <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-accent/15 border border-accent/30 text-[11px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                    <span className="font-medium">{attached.name}</span>
                    <button
                      onClick={() => setAttached(null)}
                      className="ml-0.5 text-white/40 hover:text-white transition-colors"
                      title="Remove portfolio"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50 flex items-center justify-center transition-colors"
                    title="Attach portfolio"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}

                {popoverOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                    {isConnected ? (
                      <div className="max-h-48 overflow-y-auto">
                        <button
                          onClick={() => {
                            setAttached({ name: 'Connected Wallet', tokens: walletTokens });
                            setPopoverOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors border-b border-border3/20 ${
                            attached?.name === 'Connected Wallet' ? 'bg-accent/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium text-white/80">Connected Wallet</span>
                            <span className="text-[10px] text-white/35">{walletTokens.length} tokens</span>
                          </div>
                          {walletTokens.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {walletTokens.slice(0, 4).map((t) => (
                                <span key={t.symbol} className="flex items-center gap-1 text-[10px] text-white/45">
                                  {t.logo && <img src={t.logo} alt="" className="w-3 h-3 rounded-full" />}
                                  {t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.symbol}
                                </span>
                              ))}
                              {walletTokens.length > 4 && (
                                <span className="text-[10px] text-white/30">+{walletTokens.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </button>
                        {userPortfolios.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setAttached(p);
                              setPopoverOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors border-b border-border3/20 last:border-b-0 ${
                              attached?.name === p.name ? 'bg-accent/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-medium text-white/80">{p.name}</span>
                              <span className="text-[10px] text-white/35">{p.tokens.length} tokens</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.tokens.slice(0, 4).map((t) => (
                                <span key={t.symbol} className="flex items-center gap-1 text-[10px] text-white/45">
                                  {t.logo && <img src={t.logo} alt="" className="w-3 h-3 rounded-full" />}
                                  {t.amount} {t.symbol}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                        {userPortfolios.length === 0 && walletTokens.length === 0 && (
                          <div className="px-3 py-1.5 text-[10px] text-white/30">
                            No simulated portfolios
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-2 py-3 text-[11px] text-white/35 text-center">
                        Connect your wallet to use your portfolio
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ideas button */}
              <div ref={ideasRef} className="relative shrink-0">
                <button
                  onClick={() => setIdeasOpen(!ideasOpen)}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.1] border border-border3/50 flex items-center justify-center transition-colors"
                  title="Need ideas?"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>

                {ideasOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-border3/40 text-[11px] font-medium text-white/40">
                      Try a prompt
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {presetPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(prompt);
                            setIdeasOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[12px] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-colors border-b border-border3/20 last:border-b-0"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                  </div>
                )}
              </div>

            </div>

            {!isConnected ? (
              <span className="text-[13px] text-white/40 shrink-0">Connect wallet to chat</span>
            ) : (
              <button
                onClick={handleSend}
                disabled={loading || sending || !attached || (credits !== null && credits < MIN_CREDITS)}
                className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0 disabled:opacity-50"
              >
                {loading || sending ? (
                  <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            )}
          </div>
          {error && (
            <p className="text-[11px] text-red-400 mt-2 px-1">{error}</p>
          )}
        </div>

        {/* How to use */}
        <div className="w-full mt-8 pt-6 border-t border-border3/30">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">1</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Select Portfolio</p>
              <p className="text-[11px] text-white/30 leading-snug">Use real holdings or simulate one</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">2</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Ask Your Question</p>
              <p className="text-[11px] text-white/30 leading-snug">Ask about risks or anything on your mind</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">3</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Review & Chat</p>
              <p className="text-[11px] text-white/30 leading-snug">Review results, then chat further about risks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewChat() {
  return (
    <Suspense fallback={null}>
      <NewChatInner />
    </Suspense>
  );
}
