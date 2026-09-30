'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { usePrices } from '@/app/contexts/PriceContext';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { useRwaBalances } from '@/hooks/useRwaBalances';
import { useTrackedTokens } from '@/hooks/useTrackedTokens';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();

interface PortfolioInfo {
  id: string;
  name: string;
}

interface PortfolioStatsProps {
  profileId: string | null;
  portfolios: PortfolioInfo[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string | null) => void;
  onCreatePortfolio: (name: string) => Promise<void>;
  onDeletePortfolio: (id: string) => Promise<void>;
  refreshKey: number;
}

export default function PortfolioStats({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onDeletePortfolio,
  refreshKey,
}: PortfolioStatsProps) {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const { prices } = usePrices();
  const { tracked } = useTrackedTokens(address ?? undefined);
  const trackedSymbols = tracked.map((t) => t.symbol);
  const { balances: rwaBalances } = useRwaBalances(address ?? undefined, chainId ?? undefined, trackedSymbols);
  const isMainnet = chainId === 196;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [simTokens, setSimTokens] = useState<Array<{ symbol: string; name: string; customValue: number }>>([]);

  const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  useEffect(() => {
    if (!selectedPortfolioId) { setSimTokens([]); return; }
    void (async () => {
      try {
        const { data } = await dataClient.models.PortfolioToken.list({
          filter: { portfolioId: { eq: selectedPortfolioId } },
        });
        setSimTokens((data ?? []).map((t) => ({ symbol: t.symbol, name: t.name ?? t.symbol, customValue: t.customValue ?? 0 })));
      } catch { setSimTokens([]); }
    })();
  }, [selectedPortfolioId, refreshKey]);

  const baseValue = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const rwaValue = tracked.reduce((sum, token) => {
    const balance = isMainnet ? parseFloat(rwaBalances[token.symbol] ?? '0') : 0;
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.price ?? 0);
  }, 0);

  const simValue = simTokens.reduce((sum, t) => {
    const rwaPrice = rwaPriceMap.get(t.symbol)?.price;
    const basePrice = rwaPrice == null ? getPrice(t.symbol) : null;
    const price = rwaPrice ?? basePrice ?? 0;
    return sum + t.customValue * price;
  }, 0);

  const totalValue = selectedPortfolioId ? simValue : baseValue + rwaValue;

  const baseChangeSum = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getChange24h(token.symbol);
  }, 0);

  const rwaChangeSum = tracked.reduce((sum, token) => {
    const balance = isMainnet ? parseFloat(rwaBalances[token.symbol] ?? '0') : 0;
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.percent_24h ?? 0);
  }, 0);

  const portfolioChange = (baseValue + rwaValue) > 0 ? (baseChangeSum + rwaChangeSum) / (baseValue + rwaValue) : 0;

  const sectorMap = new Map<string, number>();
  for (const t of tracked) {
    const priceData = rwaPriceMap.get(t.symbol);
    if (priceData) {
      const balance = isMainnet ? parseFloat(rwaBalances[t.symbol] ?? '0') : 0;
      const value = balance * (priceData?.price ?? 0);
      if (value > 0) {
        sectorMap.set(t.industry, (sectorMap.get(t.industry) ?? 0) + value);
      }
    }
  }
  const rwaTotalForSectors = Array.from(sectorMap.values()).reduce((a, b) => a + b, 0);
  const sectors = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, pct: rwaTotalForSectors > 0 ? Math.round((value / rwaTotalForSectors) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  // Simulated portfolio sector breakdown
  const industryMap = new Map<string, string>();
  for (const asset of (rwaList as any).assets ?? []) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol && asset.industry && !industryMap.has(token.symbol)) {
        industryMap.set(token.symbol, asset.industry);
      }
    }
  }
  const simSectorMap = new Map<string, number>();
  for (const t of simTokens) {
    const priceData = rwaPriceMap.get(t.symbol);
    const price = priceData?.price ?? 0;
    const value = t.customValue * price;
    if (value > 0) {
      const industry = industryMap.get(t.symbol) ?? 'Other';
      simSectorMap.set(industry, (simSectorMap.get(industry) ?? 0) + value);
    }
  }
  const simTotalForSectors = Array.from(simSectorMap.values()).reduce((a, b) => a + b, 0);
  const simSectors = Array.from(simSectorMap.entries())
    .map(([name, value]) => ({ name, pct: simTotalForSectors > 0 ? Math.round((value / simTotalForSectors) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreatePortfolio(newName.trim());
    setNewName('');
    setCreateMode(false);
  };

  return (
    <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-border3/50 hover:border-white/10 transition-colors"
        >
          <span className="text-[13px] font-medium text-white/80 truncate">
            {selectedPortfolio ? selectedPortfolio.name : 'Connected Wallet'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border3/50 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { onSelectPortfolio(null); setDropdownOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${!selectedPortfolioId ? 'bg-accent/10 text-accent' : 'text-white/60 hover:bg-white/[0.03]'}`}
            >
              Connected Wallet
            </button>
            {portfolios.map((p) => (
              <div key={p.id} className="flex items-center">
                <button
                  onClick={() => { onSelectPortfolio(p.id); setDropdownOpen(false); }}
                  className={`flex-1 text-left px-3 py-2 text-[12px] transition-colors ${selectedPortfolioId === p.id ? 'bg-accent/10 text-accent' : 'text-white/60 hover:bg-white/[0.03]'}`}
                >
                  {p.name}
                </button>
                <button
                  onClick={() => { void onDeletePortfolio(p.id); }}
                  className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                  title="Delete portfolio"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="border-t border-border3/30 p-2">
              {createMode ? (
                <div className="flex gap-1">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Portfolio name"
                    className="flex-1 px-2 py-1 bg-white/[0.03] border border-border3/50 rounded text-[12px] text-white/80 placeholder:text-white/25 outline-none focus:border-accent/50"
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                  />
                  <button onClick={handleCreate} className="px-2 py-1 bg-accent text-white text-[11px] rounded hover:bg-accent/80 transition-colors">
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreateMode(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-white/50 hover:text-white/70 transition-colors"
                >
                  <Plus className="w-3 h-3" /> New Portfolio
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
        <p className="text-[24px] font-display font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        {selectedPortfolioId && simTokens.length > 0 && (() => {
          const simChangeSum = simTokens.reduce((sum, t) => {
            const priceData = rwaPriceMap.get(t.symbol);
            const price = priceData?.price ?? 0;
            const value = t.customValue * price;
            return sum + value * (priceData?.percent_24h ?? 0);
          }, 0);
          const simChange = simValue > 0 ? simChangeSum / simValue : 0;
          return (
            <p className={`text-[13px] mt-1 ${simChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
              {simChange >= 0 ? '+' : ''}{simChange.toFixed(2)}% today
            </p>
          );
        })()}
        {!selectedPortfolioId && (
          <p className={`text-[13px] mt-1 ${portfolioChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% today
          </p>
        )}
      </div>
      {!selectedPortfolioId && sectors.length > 0 && (
        <div className="mt-auto">
          <p className="text-[12px] text-white/40 mb-3">Sector Exposure</p>
          <div className="space-y-3">
            {sectors.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-white/60 truncate max-w-[160px]" title={s.name}>{s.name}</span>
                  <span className="text-[12px] font-medium text-white/80 shrink-0 ml-2">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedPortfolioId && simSectors.length > 0 && (
        <div className="mt-auto">
          <p className="text-[12px] text-white/40 mb-3">Sector Exposure</p>
          <div className="space-y-3">
            {simSectors.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-white/60 truncate max-w-[160px]" title={s.name}>{s.name}</span>
                  <span className="text-[12px] font-medium text-white/80 shrink-0 ml-2">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
