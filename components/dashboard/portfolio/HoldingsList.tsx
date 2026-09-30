'use client';

import { useState, useEffect } from 'react';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { usePrices } from '@/app/contexts/PriceContext';
import { useRwaBalances } from '@/hooks/useRwaBalances';
import { useTrackedTokens } from '@/hooks/useTrackedTokens';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Plus, Trash2 } from 'lucide-react';
import TokenSelectionModal from './TokenSelectionModal';
import rwaList from '@/lib/data/rwa-v1-list.json';
import { RWA_TOKENS } from '@/hooks/useRwaBalances';

const dataClient = generateClient<Schema>();

interface HoldingsListProps {
  isSimulated: boolean;
  selectedPortfolioId: string | null;
  onAddSimulatedToken: () => void;
  refreshKey: number;
}

export default function HoldingsList({ isSimulated, selectedPortfolioId, onAddSimulatedToken, refreshKey }: HoldingsListProps) {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances, loading } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { getPrice, getChange24h, loading: pricesLoading } = useBaseTokenPrices();
  const { prices } = usePrices();
  const { tracked } = useTrackedTokens(address ?? undefined);
  const trackedSymbols = tracked.map((t) => t.symbol);
  const { balances: rwaBalances, loading: rwaLoading } = useRwaBalances(address ?? undefined, chainId ?? undefined, trackedSymbols);
  const [modalOpen, setModalOpen] = useState(false);

  const isMainnet = chainId === 196;
  const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  const rwaLogoMap = new Map<string, string | null>();
  for (const bt of BASE_TOKENS) {
    rwaLogoMap.set(bt.symbol, bt.logo ?? null);
  }
  for (const asset of (rwaList as any).assets ?? []) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol && !rwaLogoMap.has(token.symbol)) {
        rwaLogoMap.set(token.symbol, token.logo ?? null);
      }
    }
  }

  // Simulated tokens state
  const [simTokens, setSimTokens] = useState<Array<{ id: string; symbol: string; name: string; customValue: number; logo: string | null }>>([]);

  useEffect(() => {
    if (!isSimulated || !selectedPortfolioId) { setSimTokens([]); return; }
    void (async () => {
      try {
        const { data } = await dataClient.models.PortfolioToken.list({
          filter: { portfolioId: { eq: selectedPortfolioId } },
        });
        setSimTokens((data ?? []).map((t) => ({ id: t.id, symbol: t.symbol, name: t.name ?? t.symbol, customValue: t.customValue ?? 0, logo: rwaLogoMap.get(t.symbol) ?? null })));
      } catch { setSimTokens([]); }
    })();
  }, [isSimulated, selectedPortfolioId, refreshKey]);

  const handleRemoveSimToken = async (id: string) => {
    try {
      await dataClient.models.PortfolioToken.delete({ id });
      setSimTokens((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  // === Simulated portfolio view ===
  if (isSimulated) {
    const simPriceMap = new Map<string, { price: number; percent_24h: number }>();
    for (const p of prices) {
      if (!simPriceMap.has(p.token_symbol)) simPriceMap.set(p.token_symbol, { price: p.price ?? 0, percent_24h: p.percent_24h ?? 0 });
    }
    for (const bt of BASE_TOKENS) {
      if (!simPriceMap.has(bt.symbol)) simPriceMap.set(bt.symbol, { price: getPrice(bt.symbol), percent_24h: getChange24h(bt.symbol) });
    }
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold">Holdings</h3>
          <button
            onClick={onAddSimulatedToken}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border3/50 text-white/60 hover:border-accent/40 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Tokens
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-2">
            {simTokens.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[13px] text-white/40 mb-1">No tokens in this portfolio</p>
                <p className="text-[11px] text-white/25">Click "Add Tokens" to simulate holdings</p>
              </div>
            ) : (
              simTokens.map((t, idx) => {
                const priceData = simPriceMap.get(t.symbol);
                const price = priceData?.price ?? 0;
                const change = priceData?.percent_24h ?? 0;
                const value = t.customValue * price;
                return (
                  <div key={t.id ?? `sim-${t.symbol}-${idx}`} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                    {t.logo ? (
                      <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                        {t.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white/80">{t.symbol}</p>
                      <p className="text-[11px] text-white/40">{t.customValue.toLocaleString()} {t.symbol}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[13px] font-medium text-white/80">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className="text-[11px] text-white/40">
                        <span className={change >= 0 ? 'text-accent2' : 'text-warn2'}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                        {' · '}${price < 1 ? price.toFixed(4) : price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSimToken(t.id)}
                      className="p-1.5 rounded-md text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Remove token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // === Connected wallet view ===
  const rwaHoldings = tracked.map((token, idx) => {
    const balance = isMainnet ? parseFloat(rwaBalances[token.symbol] ?? '0') : 0;
    const priceData = rwaPriceMap.get(token.symbol);
    const price = priceData?.price ?? 0;
    const logo = token.logo ?? rwaLogoMap.get(token.symbol) ?? null;
    return {
      symbol: token.symbol,
      name: token.name,
      logo,
      balance,
      value: balance * price,
      price,
      change: priceData?.percent_24h ?? 0,
      isRwa: true,
      key: `rwa-${token.symbol}-${idx}`,
    };
  });

  const baseHoldings = tokens.map((token, idx) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    const price = getPrice(token.symbol);
    return {
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      balance,
      value: balance * price,
      price,
      change: getChange24h(token.symbol),
      isRwa: false,
      key: `base-${token.symbol}-${idx}`,
    };
  });

  const allHoldings = [...baseHoldings, ...rwaHoldings];
  const holdings = allHoldings.filter((h) => h.balance > 0 || trackedSymbols.includes(h.symbol));

  if (loading || pricesLoading || rwaLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold">Holdings</h3>
        </div>
        <div className="space-y-2">
          {tokens.map((token) => (
            <div key={token.symbol} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2 w-16 bg-white/[0.05] rounded animate-pulse" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2 w-14 bg-white/[0.05] rounded animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold">Holdings</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.03] border border-border3/50 text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Track Tokens
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-2">
          {holdings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[13px] text-white/40">No holdings yet</p>
              <p className="text-[11px] text-white/25 mt-1">Connect wallet or track tokens to see balances</p>
            </div>
          ) : (
            holdings.map((h) => (
              <div key={h.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                {h.logo ? (
                  <img src={h.logo} alt={h.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/40">
                    {h.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/80">{h.symbol}</p>
                  <p className="text-[11px] text-white/40">{h.balance.toLocaleString()} {h.symbol}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[13px] font-medium text-white/80">${h.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-white/40">
                    <span className={h.change >= 0 ? 'text-accent2' : 'text-warn2'}>
                      {h.change >= 0 ? '+' : ''}{h.change.toFixed(1)}%
                    </span>
                    {' · '}${h.price < 1 ? h.price.toFixed(4) : h.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <TokenSelectionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
