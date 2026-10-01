'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, X, ChevronRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { usePrices } from '@/app/contexts/PriceContext';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useRwaBalances } from '@/hooks/useRwaBalances';
import { useTrackedTokens } from '@/hooks/useTrackedTokens';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();

const DEMO_USER_PROFILE_ID = 'd543f3b6-247d-4ecc-be25-7c2a5486da1a';

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

const DEMO_PORTFOLIOS: DemoPortfolio[] = (() => {

  return [
    {
      name: 'High-Beta Growth',
      tokens: [
        { symbol: 'USDT', name: 'Tether', amount: 1000, logo: getLogo('USDT') },
        { symbol: 'TSLAX', name: 'Tesla', amount: 5, logo: getLogo('TSLAX') },
        { symbol: 'NVDAX', name: 'NVIDIA', amount: 12, logo: getLogo('NVDAX') },
        { symbol: 'GOOGLX', name: 'Google', amount: 8, logo: getLogo('GOOGLX') },
      ],
    },
    {
      name: 'Large Cap Focus',
      tokens: [
        { symbol: 'TSLAX', name: 'Tesla', amount: 3, logo: getLogo('TSLAX') },
        { symbol: 'MSTRX', name: 'MicroStrategy', amount: 20, logo: getLogo('MSTRX') },
        { symbol: 'CRCLX', name: 'Circle', amount: 150, logo: getLogo('CRCLX') },
        { symbol: 'SPCXx', name: 'SpaceX', amount: 2, logo: getLogo('SPCXx') },
      ],
    },
  ];
})();

export default function HeroPrompt() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('What are the hidden risks in my portfolio?');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [attached, setAttached] = useState<DemoPortfolio | null>(null);
  const [expandedDemo, setExpandedDemo] = useState(false);
  const [expandedWallet, setExpandedWallet] = useState(false);
  const [userPortfolios, setUserPortfolios] = useState<{ id: string; name: string; tokens: DemoToken[] }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { prices, loading: rwaLoading } = usePrices();
  const { prices: basePrices, loading: baseLoading } = useBaseTokenPrices();
  const loading = rwaLoading || baseLoading;
  const { address, isConnected, chainId } = useWallet();
  const { balances: walletBalances } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { tracked } = useTrackedTokens(address ?? undefined);
  const trackedSymbols = tracked.map((t) => t.symbol);
  const { balances: rwaBalances } = useRwaBalances(address ?? undefined, chainId ?? undefined, trackedSymbols);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setExpandedDemo(false);
        setExpandedWallet(false);
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

  const handleToggleWallet = () => {
    const next = !expandedWallet;
    setExpandedWallet(next);
    if (next && isConnected) {
      void loadUserPortfolios();
    }
  };

  useEffect(() => {
    if (popoverOpen && isConnected) {
      void loadUserPortfolios();
    }
  }, [popoverOpen, isConnected, loadUserPortfolios]);

  const handleSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt || !attached || submitting || loading) return;
    setSubmitting(true);
    try {
      let userProfileId: string | null = null;
      if (address) {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: address } },
        });
        if (profiles.length > 0) {
          userProfileId = profiles[0].id;
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress: address,
            credits: 1000,
          });
          if (created) userProfileId = created.id;
        }
      } else {
        const { data: created } = await dataClient.models.UserProfile.create({
          credits: 1000,
        });
        if (created) userProfileId = created.id;
      }

      const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p.price ?? 0]));
      const holdings = attached.tokens.map((t) => {
        const rwaPrice = rwaPriceMap.get(t.symbol);
        const price = rwaPrice != null ? rwaPrice : basePrices[t.symbol]?.price ?? 0;
        return { symbol: t.symbol, name: t.name, balance: t.amount, price };
      });
      console.log('[HeroPrompt] holdings:', holdings);

      const isDemo = attached.name === 'High-Beta Growth' || attached.name === 'Large Cap Focus';
      const profileId = isDemo ? DEMO_USER_PROFILE_ID : userProfileId!;

      const { data, errors } = await dataClient.queries.riskReview({
        userProfileId: profileId,
        prompt,
        holdings: JSON.stringify(holdings),
      });
      if (errors?.length) console.error('[HeroPrompt] riskReview errors:', errors);
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.questions?.length) {
        sessionStorage.setItem('xray-review', JSON.stringify({
          prompt,
          userProfileId: profileId,
          portfolioName: attached.name,
          holdings,
          questions: result.questions,
        }));
        router.push('/dashboard/review');
      } else {
        console.error('[HeroPrompt] no questions returned');
      }
    } catch (err) {
      console.error('[HeroPrompt] riskReview failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border3 bg-white/[0.02] rounded-t-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-[12px] text-white/60 font-medium">Xray AI</span>
        </div>

        <div className="p-5">
          <div className="bg-white/[0.03] border border-border3 rounded-xl p-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Xray anything about the market…"
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[32px]"
            />
            <div className="flex items-center justify-between mt-2">
              <div ref={popoverRef} className="relative">
                {attached ? (
                  <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-accent/15 border border-accent/30 text-[12px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                    <span className="font-medium">{attached.name}</span>
                    <span className="text-white/40">({attached.tokens.length} tokens)</span>
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
                    className="w-9 h-9 rounded-lg bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50 flex items-center justify-center transition-colors"
                    title="Attach portfolio"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {popoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                    <button
                      onClick={() => setExpandedDemo(!expandedDemo)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.04] transition-colors border-b border-border3/30"
                    >
                      <span>Demo Portfolio (No AI Credit Needed)</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-white/40 transition-transform ${expandedDemo ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedDemo && (
                      <div className="border-b border-border3/30">
                        {DEMO_PORTFOLIOS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setAttached(p);
                              setPopoverOpen(false);
                              setExpandedDemo(false);
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
                      </div>
                    )}

                    <button
                      onClick={handleToggleWallet}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.04] transition-colors"
                    >
                      <span>Your Portfolio</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-white/40 transition-transform ${expandedWallet ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedWallet && (
                      <div>
                         {isConnected ? (
                           <div className="max-h-40 overflow-y-auto">
                             <button
                               onClick={() => {
                                 setAttached({ name: 'Connected Wallet', tokens: walletTokens });
                                 setPopoverOpen(false);
                                 setExpandedWallet(false);
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
                                   setExpandedWallet(false);
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
                             {userPortfolios.length === 0 && (
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
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || submitting || !attached}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  loading || submitting || !attached ? 'bg-accent/60 cursor-wait' : 'bg-accent hover:bg-accent/80'
                }`}
              >
                {submitting || loading ? (
                  <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowRight className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
