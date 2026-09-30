'use client';

import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { usePrices } from '@/app/contexts/PriceContext';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { useRwaBalances } from '@/hooks/useRwaBalances';
import { useTrackedTokens } from '@/hooks/useTrackedTokens';

export default function PortfolioStats() {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const { prices } = usePrices();
  const { tracked } = useTrackedTokens(address ?? undefined);
  const trackedSymbols = tracked.map((t) => t.symbol);
  const { balances: rwaBalances } = useRwaBalances(address ?? undefined, chainId ?? undefined, trackedSymbols);
  const isMainnet = chainId === 196;

  const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  const baseValue = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const rwaValue = tracked.reduce((sum, token) => {
    const balance = isMainnet ? parseFloat(rwaBalances[token.symbol] ?? '0') : 0;
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.price ?? 0);
  }, 0);

  const totalValue = baseValue + rwaValue;

  const baseChangeSum = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getChange24h(token.symbol);
  }, 0);

  const rwaChangeSum = tracked.reduce((sum, token) => {
    const balance = isMainnet ? parseFloat(rwaBalances[token.symbol] ?? '0') : 0;
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.percent_24h ?? 0);
  }, 0);

  const portfolioChange = totalValue > 0 ? (baseChangeSum + rwaChangeSum) / totalValue : 0;

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

  return (
    <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
        <p className="text-[24px] font-display font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <p className={`text-[13px] mt-1 ${portfolioChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
          {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% today
        </p>
      </div>
      {sectors.length > 0 && (
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
    </div>
  );
}
