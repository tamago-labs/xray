'use client';

import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';

const riskScore = 68;

const themes = [
  { name: 'AI / Tech', pct: 70, color: '#6C5CE7' },
  { name: 'Finance', pct: 15, color: '#3B82F6' },
  { name: 'Consumer', pct: 15, color: '#00D2A0' },
];

export default function PortfolioStats() {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances } = useTokenBalances(address, chainId);
  const { getPrice, getChange24h } = useBaseTokenPrices();

  const totalValue = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const portfolioChange = totalValue > 0
    ? tokens.reduce((sum, token) => {
        const balance = parseFloat(balances[token.symbol] ?? '0');
        return sum + balance * getChange24h(token.symbol);
      }, 0) / totalValue
    : 0;

  return (
    <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
        <p className="text-[24px] font-display font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <p className={`text-[13px] mt-1 ${portfolioChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
          {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% today
        </p>
      </div>
      <div>
        <p className="text-[12px] text-white/40 mb-1">Risk Score</p>
        <p className="text-[20px] font-display font-bold">{riskScore}<span className="text-[14px] text-white/30">/100</span></p>
        <p className="text-[12px] text-white/40 mt-0.5">Balanced</p>
      </div>
      <div className="mt-auto">
        <p className="text-[12px] text-white/40 mb-3">Theme Exposure</p>
        <div className="space-y-3">
          {themes.map((theme) => (
            <div key={theme.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-white/60">{theme.name}</span>
                <span className="text-[12px] font-medium text-white/80">{theme.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${theme.pct}%`, backgroundColor: theme.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
