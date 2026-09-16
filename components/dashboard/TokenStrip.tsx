"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePrices } from "@/app/contexts/PriceContext";
import listData from "@/lib/data/rwa-v1-list.json";

type SortMetric = "market_cap" | "volume_24h" | "percent_24h";

const metrics: { key: SortMetric; label: string }[] = [
  { key: "market_cap", label: "MCap" },
  { key: "volume_24h", label: "Vol" },
  { key: "percent_24h", label: "24h%" },
];

const metricLabels: Record<SortMetric, string> = {
  market_cap: "Market Cap",
  volume_24h: "Volume",
  percent_24h: "24h%",
};

const metricColors: Record<SortMetric, string> = {
  market_cap: "bg-accent",
  volume_24h: "bg-emerald-400",
  percent_24h: "bg-purple-400",
};

const tokenMetaMap = new Map<string, { logo: string | null; name: string | null; slug: string; crypto_id: string }>();
for (const asset of (listData as any).assets) {
  for (const token of asset.tokens ?? []) {
    if (!tokenMetaMap.has(token.symbol)) {
      tokenMetaMap.set(token.symbol, {
        logo: token.logo ?? null,
        name: token.name ?? null,
        slug: asset.slug,
        crypto_id: token.crypto_id,
      });
    }
  }
}

export default function TokenStrip() {
  const { prices } = usePrices();
  const [metric, setMetric] = useState<SortMetric>("market_cap");
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const sorted = [...prices]
    .filter((p) => p[metric] != null)
    .sort((a, b) => {
      if (metric === "percent_24h") return (b.percent_24h ?? 0) - (a.percent_24h ?? 0);
      if (metric === "volume_24h") return (b.volume_24h ?? 0) - (a.volume_24h ?? 0);
      return (b.market_cap ?? 0) - (a.market_cap ?? 0);
    });

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [metric]);

  const scrollBy = useCallback((dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  }, []);

  if (!mounted) return <div className="flex-1" />;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 ml-2">
      <div className="relative shrink-0" ref={popoverRef}>
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className="flex items-center gap-1.5 pr-1 pl-2.5 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors group"
          title={metricLabels[metric]}
        >
          <span className={`w-2 h-2 rounded-full ${metricColors[metric]}`} />
          <ChevronDown className={`w-2.5 h-2.5 text-white/20 group-hover:text-white/40 transition-transform ${popoverOpen ? "rotate-180" : ""}`} />
        </button>
        {popoverOpen && (
          <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-border3/50 bg-surface shadow-xl z-20 min-w-[100px]">
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => { setMetric(m.key); setPopoverOpen(false); }}
                className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  metric === m.key ? "text-accent bg-accent/5" : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${metricColors[m.key]}`} />
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => scrollBy(-1)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.03] border border-border3/30 text-white/30 hover:text-white/60 hover:border-white/10 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
      </button>

      <div className="relative flex-1 min-w-0">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-dark to-transparent z-10 pointer-events-none" />
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto min-w-0 scrollbar-hide px-6"
        >
        {sorted.map((price) => {
          const meta = tokenMetaMap.get(price.token_symbol);
          return (
            <Link
              key={price.token_symbol}
              href={`/dashboard/token/${meta?.slug}/${meta?.crypto_id}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-border3/30 shrink-0 hover:border-white/10 cursor-pointer transition-colors"
            >
              {meta?.logo ? (
                <img src={meta.logo} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                  {price.token_symbol?.slice(0, 2)}
                </div>
              )}
              <span className="text-[11px] font-medium text-white/70">{price.token_symbol}</span>
              <span className="text-[11px] font-semibold text-white/90">
                {price.price != null ? `$${price.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </span>
              {price.percent_24h != null && (
                <span className={`text-[10px] font-medium ${price.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {price.percent_24h >= 0 ? "+" : ""}{price.percent_24h.toFixed(1)}%
                </span>
              )}
            </Link>
          );
        })}
        </div>
      </div>

      <button
        onClick={() => scrollBy(1)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.03] border border-border3/30 text-white/30 hover:text-white/60 hover:border-white/10 transition-colors"
      >
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
