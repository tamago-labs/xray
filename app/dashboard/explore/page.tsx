"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { usePrices } from "@/app/contexts/PriceContext";
import listData from "@/lib/data/rwa-v1-list.json";

interface TokenRow {
  token_symbol: string;
  stock_symbol: string;
  name: string;
  slug: string;
  crypto_id: string;
  issuer: string;
  logo: string | null;
  industry: string | null;
  price: number | null;
  percent_24h: number | null;
  percent_7d: number | null;
  percent_30d: number | null;
  market_cap: number | null;
  volume_24h: number | null;
}

type SortKey = "token_symbol" | "stock_symbol" | "issuer" | "price" | "percent_24h" | "percent_7d" | "percent_30d" | "market_cap" | "volume_24h";
type SortDir = "asc" | "desc";

function usePageSize(rowHeight = 48, offset = 220) {
  const [size, setSize] = useState(20);
  
  useEffect(() => {
    function calc() {
      const available = window.innerHeight - offset;
      const rows = Math.floor(available / rowHeight);
      setSize(Math.max(15, rows));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [rowHeight, offset]);
  return size;
}

export default function Explore() {
  const router = useRouter();
  const { prices } = usePrices();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = usePageSize();

  const priceMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of prices) {
      if (!map.has(p.token_symbol)) {
        map.set(p.token_symbol, p);
      }
    }
    return map;
  }, [prices]);

  const rows: TokenRow[] = useMemo(() => {
    const result: TokenRow[] = [];
    for (const asset of (listData as any).assets) {
      for (const token of asset.tokens ?? []) {
        const price = priceMap.get(token.symbol);
        result.push({
          token_symbol: token.symbol,
          stock_symbol: asset.symbol,
          name: asset.name,
          slug: asset.slug,
          crypto_id: token.crypto_id,
          issuer: token.issuer_name === "Backed Assets" ? "xStock" : "Ondo",
          logo: token.logo ?? null,
          industry: asset.industry ?? null,
          price: price?.price ?? null,
          percent_24h: price?.percent_24h ?? null,
          percent_7d: price?.percent_7d ?? null,
          percent_30d: price?.percent_30d ?? null,
          market_cap: price?.market_cap ?? null,
          volume_24h: price?.volume_24h ?? null,
        });
      }
    }
    return result;
  }, [priceMap]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.token_symbol.toLowerCase().includes(q) ||
        r.stock_symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.issuer.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronUp className="w-3 h-3 text-white/10" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-accent" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ticker, or issuer…"
            className="w-full bg-surface border border-border3 rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-border3/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border3/50 text-[11px] text-white/30 font-medium uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium normal-case">
                  <button onClick={() => handleSort("token_symbol")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                    Token <SortIcon column="token_symbol" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium normal-case">
                  <button onClick={() => handleSort("stock_symbol")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                    Ticker <SortIcon column="stock_symbol" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => handleSort("issuer")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                    Issuer <SortIcon column="issuer" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("price")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    Price <SortIcon column="price" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("percent_24h")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    24h% <SortIcon column="percent_24h" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("percent_7d")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    7d% <SortIcon column="percent_7d" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("percent_30d")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    30d% <SortIcon column="percent_30d" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("market_cap")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    MCap <SortIcon column="market_cap" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button onClick={() => handleSort("volume_24h")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                    Volume <SortIcon column="volume_24h" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr key={row.token_symbol} className="border-b border-border3/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/token/${row.slug}/${row.crypto_id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {row.logo ? (
                        <img src={row.logo} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/40">
                          {row.token_symbol.slice(0, 2)}
                        </div>
                      )}
                      <span className="font-mono font-semibold text-white/90">{row.token_symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60 cursor-default" title={row.name}>{row.stock_symbol}</td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-white/50 font-medium">
                      {row.issuer}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white/70">
                    {row.price != null ? `$${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    row.percent_24h != null
                      ? row.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"
                      : "text-white/30"
                  }`}>
                    {row.percent_24h != null ? `${row.percent_24h >= 0 ? "+" : ""}${row.percent_24h.toFixed(2)}%` : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    row.percent_7d != null
                      ? row.percent_7d >= 0 ? "text-emerald-400" : "text-red-400"
                      : "text-white/30"
                  }`}>
                    {row.percent_7d != null ? `${row.percent_7d >= 0 ? "+" : ""}${row.percent_7d.toFixed(2)}%` : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    row.percent_30d != null
                      ? row.percent_30d >= 0 ? "text-emerald-400" : "text-red-400"
                      : "text-white/30"
                  }`}>
                    {row.percent_30d != null ? `${row.percent_30d >= 0 ? "+" : ""}${row.percent_30d.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-white/40">
                    {row.market_cap != null ? `$${(row.market_cap / 1_000_000).toFixed(1)}M` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-white/40">
                    {row.volume_24h != null ? `$${(row.volume_24h / 1_000_000).toFixed(1)}M` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border3/50">
            <p className="text-[12px] text-white/30">
              Page {page} of {totalPages} ({sorted.length} tokens)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[12px] text-white/50 px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
