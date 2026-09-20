'use client';

import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';

export default function HoldingsList() {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances, loading } = useTokenBalances(address, chainId);
  const { getPrice, getChange24h, loading: pricesLoading } = useBaseTokenPrices();

  const holdings = tokens.map((token) => {
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
    };
  });

  if (loading || pricesLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <h3 className="text-[14px] font-semibold mb-4">Holdings</h3>
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
    <div className="flex-1 min-h-0 overflow-y-auto">
      <h3 className="text-[14px] font-semibold mb-4">Holdings</h3>
      <div className="space-y-2">
        {holdings.map((h) => {
          const token = tokens.find((t) => t.symbol === h.symbol);
          if (!token) return null;
          return (
            <div key={h.symbol} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
              <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white/80">{token.name}</p>
                <p className="text-[11px] text-white/40">{h.balance.toLocaleString()} {token.symbol}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[13px] font-medium text-white/80">${h.value.toLocaleString()}</p>
                <p className="text-[11px] text-white/40">
                  <span className={h.change >= 0 ? 'text-accent2' : 'text-warn2'}>
                    {h.change >= 0 ? '+' : ''}{h.change.toFixed(1)}%
                  </span>
                  {' · '}${h.price.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
