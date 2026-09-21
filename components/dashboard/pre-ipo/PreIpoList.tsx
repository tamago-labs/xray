'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import preIpoData from '@/lib/data/pre-ipo-list.json';
import Link from 'next/link';

const client = generateClient<Schema>();

interface Snapshot {
  symbol: string;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
}

interface MarketData {
  symbol: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
  change24h: number;
}

export default function PreIpoList() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.toISOString();

        const { data } = await client.models.PreIpoSnapshot.list({
          filter: { markPrice: { gt: 0 } },
          limit: 1000,
        });

        const snapshotsBySymbol: Record<string, Snapshot[]> = {};
        for (const s of data) {
          if (!snapshotsBySymbol[s.symbol]) snapshotsBySymbol[s.symbol] = [];
          snapshotsBySymbol[s.symbol].push({
            symbol: s.symbol,
            markPrice: s.markPrice,
            markValuation: s.markValuation,
            impliedValuation: s.impliedValuation,
          });
        }

        const marketData: MarketData[] = preIpoData.assets.map((asset) => {
          const snapshots = snapshotsBySymbol[asset.symbol] ?? [];
          const latest = snapshots[snapshots.length - 1];
          const first = snapshots[0];

          const change24h = latest && first && first.markPrice > 0
            ? ((latest.markPrice - first.markPrice) / first.markPrice) * 100
            : 0;

          return {
            symbol: asset.symbol,
            name: asset.name,
            slug: asset.slug,
            image: asset.image,
            description: asset.description,
            markPrice: latest?.markPrice ?? 0,
            markValuation: latest?.markValuation ?? 0,
            impliedValuation: latest?.impliedValuation ?? 0,
            change24h,
          };
        });

        setMarkets(marketData);
      } catch (err) {
        console.error('[PreIpoList] fetch error:', err);
        setMarkets(preIpoData.assets.map((a) => ({
          symbol: a.symbol,
          name: a.name,
          slug: a.slug,
          image: a.image,
          description: a.description,
          markPrice: 0,
          markValuation: 0,
          impliedValuation: 0,
          change24h: 0,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <Link
          key={market.symbol}
          href={`/dashboard/pre-ipo/${market.slug}`}
          className="group bg-surface border border-border3/50 rounded-xl p-5 hover:border-accent/30 transition-all"
        >
          <div className="flex items-start gap-3 mb-4">
            <img
              src={market.image}
              alt={market.name}
              className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white/90 truncate">
                {market.name}
              </h3>
              <p className="text-[12px] text-white/40">{market.symbol}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Mark Price</span>
              <span className="text-[18px] font-semibold text-white/90">
                {market.markPrice > 0 ? `$${market.markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">24h Change</span>
              <span className={`text-[13px] font-medium ${market.change24h >= 0 ? 'text-accent2' : 'text-warn2'}`}>
                {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Implied Valuation</span>
              <span className="text-[13px] text-white/60">
                {market.impliedValuation > 0 ? `$${(market.impliedValuation / 1e9).toFixed(2)}B` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border3/30">
            <span className="text-[12px] text-accent group-hover:text-accent/80 transition-colors">
              Trade →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
