"use client";

import { useMemo } from "react";
import listData from "@/lib/data/rwa-v1-list.json";
import { usePrices } from "@/app/contexts/PriceContext";

interface PriceData {
  token_symbol: string;
  price: number | null;
  percent_1h: number | null;
  percent_24h: number | null;
  market_cap: number | null;
  volume_24h: number | null;
}

const tokenMetaMap = new Map<string, { logo: string | null; name: string | null; issuer: string | null }>();
for (const asset of (listData as any).assets) {
  for (const token of asset.tokens ?? []) {
    if (!tokenMetaMap.has(token.symbol)) {
      tokenMetaMap.set(token.symbol, {
        logo: token.logo ?? null,
        name: token.name ?? null,
        issuer: token.issuer_name ?? null,
      });
    }
  }
}

const issuerColor: Record<string, string> = {
  "Backed Assets": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Ondo Assets": "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

function TokenCard({ price }: { price: PriceData }) {
  const meta = tokenMetaMap.get(price.token_symbol);
  const issuerClass = issuerColor[meta?.issuer ?? ""] ?? "text-white/50 bg-white/5 border-white/10";

  return (
    <div className="min-w-[200px] bg-surface border border-border3 rounded-xl p-4 flex flex-col gap-3 hover:border-accent/20 hover:shadow-2xl hover:glow-blue transition-all">
      <div className="flex items-center gap-2.5">
        {meta?.logo ? (
          <img src={meta.logo} alt={price.token_symbol} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
            {price.token_symbol?.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white/90 truncate">{price.token_symbol}</p>
          <p className="text-[10px] text-white/50 truncate">{meta?.name ?? price.token_symbol}</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-white/80">
            {price.price != null ? `$${price.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </span>
          {price.percent_24h != null && (
            <span className={`text-[11px] font-medium ${price.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {price.percent_24h >= 0 ? "+" : ""}{price.percent_24h.toFixed(2)}%
            </span>
          )}
        </div>
        {price.volume_24h != null && (
          <div className="flex my-auto gap-2">
             <span className="text-[10px] text-white/50">
            Vol ${(price.volume_24h / 1_000_000).toFixed(1)}M
          </span>
          </div> 
        )}
      </div>
    </div>
  );
}

export default function TokenTicker() {
  const { prices: rawPrices } = usePrices();

  const topPrices = useMemo(() =>
    [...rawPrices]
      .filter((p) => p.market_cap != null)
      .sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
      .slice(0, 20),
    [rawPrices]
  );

  if (topPrices.length === 0) return null;

  return (
    <div className="relative mt-12 overflow-hidden -mx-6 md:-mx-[calc((100vw-100%)/2)]">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 px-6 animate-[scroll_60s_linear_infinite] hover:[animation-play-state:paused] w-max">
          {[...topPrices, ...topPrices].map((price, i) => (
            <TokenCard key={`${price.token_symbol}-${i}`} price={price} />
          ))}
        </div>
    </div>
  );
}
