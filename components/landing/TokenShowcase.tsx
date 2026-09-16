"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePrices } from "@/app/contexts/PriceContext";
import listData from "@/lib/data/rwa-v1-list.json";

type SortMetric = "market_cap" | "volume_24h" | "percent_24h";

const metrics: { key: SortMetric; label: string }[] = [
  { key: "market_cap", label: "By MCap" },
  { key: "volume_24h", label: "By Vol" },
  { key: "percent_24h", label: "By 24h%" },
];

const tokenMetaMap = new Map<string, { logo: string | null; name: string | null; symbol: string | null; slug: string; crypto_id: string }>();
for (const asset of (listData as any).assets) {
  for (const token of asset.tokens ?? []) {
    if (!tokenMetaMap.has(token.symbol)) {
      tokenMetaMap.set(token.symbol, {
        logo: token.logo ?? null,
        name: token.name ?? null,
        symbol: asset.symbol,
        slug: asset.slug,
        crypto_id: token.crypto_id,
      });
    }
  }
}

export default function TokenShowcase() {
  const { prices } = usePrices();
  const [metric, setMetric] = useState(0);
  const [page, setPage] = useState(0);

  const sorted = [...prices]
    .filter((p) => {
      const m = metrics[metric].key;
      return p[m] != null;
    })
    .sort((a, b) => {
      const m = metrics[metric].key as keyof typeof a;
      return (b[m] as number ?? 0) - (a[m] as number ?? 0);
    });

  const pageSize = 4;
  const totalPages = Math.ceil(sorted.length / pageSize);
  const currentTokens = sorted.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    const interval = setInterval(() => {
      setPage((p) => (p + 1) % Math.max(totalPages, 1));
    }, 15000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const cycleMetric = useCallback(() => {
    setMetric((m) => (m + 1) % metrics.length);
    setPage(0);
  }, []);

  return (
    <div className="flex items-center gap-6 mt-12">
      <button
        onClick={cycleMetric}
        className="shrink-0 text-left group"
      >
        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-0.5">Featured</p>
        <p className="text-[13px] font-semibold text-white/70 group-hover:text-white/90 transition-colors">
          {metrics[metric].label}
        </p>
      </button>

        <div className="flex-1 min-w-0 relative h-[120px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${metric}-${page}`}
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 absolute inset-0"
          >
              {currentTokens.map((price) => {
              const meta = tokenMetaMap.get(price.token_symbol);
              return (
                <Link
                  key={price.token_symbol}
                  href={`/dashboard/token/${meta?.slug}/${meta?.crypto_id}`}
                  className="min-w-0 bg-surface border border-border3 rounded-lg p-4 flex flex-col gap-3 hover:border-white/20 hover:shadow-2xl hover:glow-blue transition-all cursor-pointer"
                >
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
                      <div className="hidden md:flex my-auto gap-2">
                        <span className="text-[10px] text-white/50">
                          Vol ${(price.volume_24h / 1_000_000).toFixed(1)}M
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
