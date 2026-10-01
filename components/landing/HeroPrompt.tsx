'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
import { usePrices } from '@/app/contexts/PriceContext';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import rwaList from '@/lib/data/rwa-v1-list.json';

interface DemoToken {
  symbol: string;
  name: string;
  logo: string | null;
}

interface DemoPortfolio {
  name: string;
  tokens: DemoToken[];
}

const DEMO_PORTFOLIOS: DemoPortfolio[] = (() => {
  const logoMap = new Map<string, string | null>();
  for (const asset of (rwaList as any).assets ?? []) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol && token.contractAddress?.xlayer && !logoMap.has(token.symbol)) {
        logoMap.set(token.symbol, token.logo ?? null);
      }
    }
  }
  const getLogo = (symbol: string) => logoMap.get(symbol) ?? null;

  return [
    {
      name: 'Tech Giants',
      tokens: [
        { symbol: 'TSLAX', name: 'Tesla', logo: getLogo('TSLAX') },
        { symbol: 'NVDAX', name: 'NVIDIA', logo: getLogo('NVDAX') },
        { symbol: 'GOOGLX', name: 'Google', logo: getLogo('GOOGLX') },
      ],
    },
    {
      name: 'Mixed Holdings',
      tokens: [
        { symbol: 'TSLAX', name: 'Tesla', logo: getLogo('TSLAX') },
        { symbol: 'MSTRX', name: 'MicroStrategy', logo: getLogo('MSTRX') },
        { symbol: 'CRCLX', name: 'Circle', logo: getLogo('CRCLX') },
        { symbol: 'SPCXx', name: 'SpaceX', logo: getLogo('SPCXx') },
      ],
    },
  ];
})();

export default function HeroPrompt() {
  const [inputValue, setInputValue] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [attached, setAttached] = useState<DemoPortfolio | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { loading: rwaLoading } = usePrices();
  const { loading: baseLoading } = useBaseTokenPrices();
  const loading = rwaLoading || baseLoading;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleAttachClick = () => {
    setPopoverOpen(!popoverOpen);
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
                    onClick={handleAttachClick}
                    className="w-9 h-9 rounded-lg bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50 flex items-center justify-center transition-colors"
                    title="Attach portfolio"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {popoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-96 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-border3/40 text-[11px] font-semibold tracking-wider text-white/40">
                      Choose a Demo Portfolio
                    </div>
                    {DEMO_PORTFOLIOS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setAttached(p);
                          setPopoverOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-border3/20 last:border-b-0 ${
                          attached?.name === p.name ? 'bg-accent/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-medium text-white/90">{p.name}</span>
                          <span className="text-[11px] text-white/40">{p.tokens.length} tokens</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.tokens.slice(0, 6).map((t) => (
                            <span key={t.symbol} className="flex items-center gap-1 text-[11px] text-white/50">
                              {t.logo && <img src={t.logo} alt="" className="w-3.5 h-3.5 rounded-full" />}
                              {t.symbol}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                disabled={loading}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  loading ? 'bg-accent/60 cursor-wait' : 'bg-accent hover:bg-accent/80'
                }`}
              >
                {loading ? (
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
