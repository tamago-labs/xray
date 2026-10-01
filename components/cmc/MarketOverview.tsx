'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, BarChart2, DollarSign } from 'lucide-react';

interface GlobalMetrics {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  defi_volume_24h: number;
  stablecoin_volume_24h: number;
  active_cryptocurrencies: number;
}

function formatLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MarketOverview() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cmc/global-metrics')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.quote?.USD) {
          const usd = res.data.quote.USD;
          setMetrics({
            total_market_cap: usd.total_market_cap,
            total_volume_24h: usd.total_volume_24h,
            btc_dominance: res.data.btc_dominance,
            eth_dominance: res.data.eth_dominance,
            defi_volume_24h: usd.defi_volume_24h ?? 0,
            stablecoin_volume_24h: usd.stablecoin_volume_24h ?? 0,
            active_cryptocurrencies: res.data.active_cryptocurrencies ?? 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
    <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border3/50 rounded-xl p-4 h-[80px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    { label: 'Total Market Cap', value: formatLarge(metrics.total_market_cap), icon: DollarSign, color: 'text-accent' },
    { label: '24h Volume', value: formatLarge(metrics.total_volume_24h), icon: BarChart2, color: 'text-zenblue' },
    { label: 'BTC Dominance', value: `${metrics.btc_dominance.toFixed(1)}%`, icon: TrendingUp, color: 'text-warn2' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface border border-border3/50 rounded-xl p-4">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">{s.label}</span>
          <p className="text-[16px] font-semibold text-white/90">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
