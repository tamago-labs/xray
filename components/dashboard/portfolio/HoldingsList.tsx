'use client';

import { useState } from 'react';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { usePrices } from '@/app/contexts/PriceContext';
import { RWA_TOKENS, loadRwaConfig, useRwaBalances } from '@/hooks/useRwaBalances';
import { Plus } from 'lucide-react';
import TokenSelectionModal from './TokenSelectionModal';

export default function HoldingsList() {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances, loading } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { getPrice, getChange24h, loading: pricesLoading } = useBaseTokenPrices();
  const { prices } = usePrices();
  const { balances: rwaBalances, loading: rwaLoading } = useRwaBalances(address ?? undefined, chainId ?? undefined);
  const rwaConfig = loadRwaConfig();
  const [modalOpen, setModalOpen] = useState(false);

  const isMainnet = chainId === 196;
  const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  const rwaHoldings = RWA_TOKENS.filter((t) => rwaConfig.trackedSymbols.includes(t.symbol)).map((token) => {
    let balance: number;
    if (rwaConfig.useMockValue) {
      balance = rwaConfig.mockValues[token.symbol] ?? 0;
    } else if (isMainnet) {
      balance = parseFloat(rwaBalances[token.symbol] ?? '0');
    } else {
      balance = 0;
    }
    const priceData = rwaPriceMap.get(token.symbol);
    const price = priceData?.price ?? 0;
    return {
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      balance,
      value: balance * price,
      price,
      change: priceData?.percent_24h ?? 0,
      isRwa: true,
    };
  });

  const baseHoldings = tokens.map((token) => {
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
    };
  });

  const allHoldings = [...baseHoldings, ...rwaHoldings];
  const holdings = address ? allHoldings.filter((h) => h.balance > 0) : allHoldings;

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
              <div key={h.symbol} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                <img src={h.logo} alt={h.name} className="w-8 h-8 rounded-full" />
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
