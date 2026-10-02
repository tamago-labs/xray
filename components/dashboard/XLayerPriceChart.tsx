"use client";

import { useEffect, useState, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import type { Token, Asset } from "@/lib/types/token";
import { usePrices } from "@/app/contexts/PriceContext";

interface PricePoint {
  time: number;
  price: number;
}

interface TokenPriceData {
  symbol: string;
  logo: string | null;
  color: string;
  dashed?: boolean;
  data: PricePoint[];
}

type Timeframe = "7D" | "30D" | "90D";

const timeframes: { key: Timeframe; label: string; count: string; interval: string }[] = [
  { key: "7D", label: "7D", count: "168", interval: "1h" },
  { key: "30D", label: "30D", count: "180", interval: "4h" },
  { key: "90D", label: "90D", count: "90", interval: "1d" },
];

const COLORS = ["#6C5CE7", "#00D2A0", "#3B82F6", "#FF6B6B"];

function interpolateValue(data: PricePoint[], target: number): number {
  if (data.length === 0) return 0;
  if (target <= data[0].time) return data[0].price;
  if (target >= data[data.length - 1].time) return data[data.length - 1].price;
  for (let i = 0; i < data.length - 1; i++) {
    if (target >= data[i].time && target <= data[i + 1].time) {
      const ratio = (target - data[i].time) / (data[i + 1].time - data[i].time);
      return data[i].price + ratio * (data[i + 1].price - data[i].price);
    }
  }
  return data[data.length - 1].price;
}

export default function XLayerPriceChart({ token, asset }: { token: Token; asset: Asset }) {
  const { fetchStockPriceHistory } = usePrices();
  const [timeframe, setTimeframe] = useState<Timeframe>("30D");
  const [priceData, setPriceData] = useState<TokenPriceData[]>([]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const tokensToFetch = useMemo(() => {
    const list: { symbol: string; cryptoId: string; logo: string | null }[] = [];
    const isWrapped = token.name?.toLowerCase().includes("wrapped");
    const seen = new Set<string>();

    const addToken = (t: any) => {
      if (t && !seen.has(t.crypto_id)) {
        seen.add(t.crypto_id);
        list.push({ symbol: t.symbol, cryptoId: t.crypto_id, logo: t.logo ?? null });
      }
    };

    addToken(token);

    if (isWrapped) {
      const mainToken = asset.tokens?.find(
        (t: any) => t.symbol === token.symbol.replace(/^w/i, "") && (t.contractAddress as any)?.xlayer
      );
      addToken(mainToken);
    } else {
      const wrapped = asset.tokens?.find(
        (t: any) => (t.contractAddress as any)?.xlayer && t.name?.toLowerCase().includes("wrapped") && t.symbol.replace(/^w/i, "").toUpperCase() === token.symbol.toUpperCase()
      );
      addToken(wrapped);
    }

    return list;
  }, [token, asset.tokens]);

  useEffect(() => {
    const tf = timeframes.find((t) => t.key === timeframe)!;
    setLoading(true);

    const fetchPromises = tokensToFetch.map(async (t, i) => {
      const res = await fetch(
        `/api/cmc-price-history?crypto_id=${t.cryptoId}&interval=${tf.interval}&count=${tf.count}`
      );
      const json = await res.json();
      return {
        symbol: t.symbol,
        logo: t.logo,
        color: COLORS[i % COLORS.length],
        data: json.data ?? [],
      } as TokenPriceData;
    });

    if (asset.symbol) {
      fetchPromises.push(
        (async () => {
          const data = await fetchStockPriceHistory(asset.symbol);
          return {
            symbol: asset.symbol,
            logo: token.logo ?? null,
            color: "#FFFFFF",
            dashed: true,
            data,
          } as TokenPriceData;
        })()
      );
    }

    Promise.all(fetchPromises).then((results) => {
      const allSeries = results.map((r) => r.dashed ? { ...r, color: "#FFFFFF" } : r);
      setPriceData(allSeries);
      const initialEnabled: Record<string, boolean> = {};
      allSeries.forEach((r) => {
        initialEnabled[r.symbol] = r.symbol === token.symbol;
      });
      setEnabled(initialEnabled);
      setLoading(false);
    });
  }, [timeframe, tokensToFetch, asset.symbol, fetchStockPriceHistory]);

  const chartData = useMemo(() => {
    const enabledData = priceData.filter((d) => enabled[d.symbol]);
    if (enabledData.length === 0) return [];

    const stockSeries = enabledData.find((d) => d.dashed);
    const tokenSeries = enabledData.filter((d) => !d.dashed);

    const hasTokens = tokenSeries.length > 0;
    const hasStock = !!stockSeries && stockSeries.data.length > 0;

    if (!hasTokens && !hasStock) return [];

    const timeMap = new Map<number, Record<string, number>>();

    if (hasTokens) {
      let earliest = Infinity;
      let latest = -Infinity;
      tokenSeries.forEach((series) => {
        series.data.forEach((p) => {
          if (p.time < earliest) earliest = p.time;
          if (p.time > latest) latest = p.time;
        });
      });

      tokenSeries.forEach((series) => {
        series.data.forEach((point) => {
          if (!timeMap.has(point.time)) {
            timeMap.set(point.time, { time: point.time });
          }
          timeMap.get(point.time)![series.symbol] = point.price;
        });
      });

      if (hasStock) {
        const sorted = [...stockSeries.data].sort((a, b) => a.time - b.time);
        timeMap.forEach((point, time) => {
          if (time >= earliest && time <= latest) {
            point[stockSeries.symbol] = interpolateValue(sorted, time);
          }
        });
      }
    } else if (hasStock) {
      stockSeries.data.forEach((point) => {
        timeMap.set(point.time, { time: point.time, [stockSeries.symbol]: point.price });
      });
    }

    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [priceData, enabled]);

  const premiumData = useMemo(() => {
    const wrapped = priceData.find((d) => !d.dashed && d.symbol.toUpperCase().startsWith("W"));
    const stock = priceData.find((d) => d.dashed);
    if (!wrapped || !stock || wrapped.data.length === 0 || stock.data.length === 0) return [];

    const sortedStock = [...stock.data].sort((a, b) => a.time - b.time);
    const wrappedMap = new Map<number, number>();
    wrapped.data.forEach((p) => wrappedMap.set(p.time, p.price));

    const result: { time: number; premium: number }[] = [];
    wrappedMap.forEach((wrappedPrice, time) => {
      const stockPrice = interpolateValue(sortedStock, time);
      if (stockPrice > 0) {
        const premium = ((wrappedPrice - stockPrice) / stockPrice) * 100;
        result.push({ time, premium: parseFloat(premium.toFixed(2)) });
      }
    });

    return result.sort((a, b) => a.time - b.time);
  }, [priceData]);

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {priceData.map((series) => (
            <button
              key={series.symbol}
              onClick={() => setEnabled((prev) => ({ ...prev, [series.symbol]: !prev[series.symbol] }))}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                enabled[series.symbol]
                  ? "bg-white/[0.06] text-white/80"
                  : "text-white/25 hover:text-white/40"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: enabled[series.symbol] ? series.color : "rgba(255,255,255,0.15)" }}
              />
              {series.logo && <img src={series.logo} alt="" className="w-3.5 h-3.5 rounded-full" />}
              {series.symbol}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                timeframe === tf.key
                  ? "bg-white/[0.08] text-white/80"
                  : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <span className="text-xs text-white/30">Loading chart...</span>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                {priceData.map((series) => (
                  <linearGradient key={series.symbol} id={`grad-${series.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={series.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#141419",
                  border: "1px solid #2A2A35",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                labelFormatter={(label: number) => new Date(label * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              />
              {priceData
                .filter((d) => enabled[d.symbol])
                .map((series) => (
                  <Area
                    key={series.symbol}
                    type="monotone"
                    dataKey={series.symbol}
                    stroke={series.color}
                    fill={`url(#grad-${series.symbol})`}
                    strokeWidth={2}
                    strokeDasharray={series.dashed ? "5 5" : undefined}
                    dot={false}
                    connectNulls
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
          {premiumData.length > 0 && (
            <div className="mt-2 border-t border-white/[0.04] pt-2">
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={premiumData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip
                    contentStyle={{ background: "#141419", border: "1px solid #2A2A35", borderRadius: 6, fontSize: 10 }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                    itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                    formatter={(value: number) => [`${value > 0 ? "+" : ""}${value.toFixed(2)}%`, "Premium"]}
                    labelFormatter={(label: number) => new Date(label * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <Bar dataKey="premium" radius={[2, 2, 0, 0]}>
                    {premiumData.map((entry, index) => (
                      <Cell key={index} fill={entry.premium >= 0 ? "rgba(255,107,107,0.7)" : "rgba(0,210,160,0.7)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-[10px] text-white/20 text-center mt-1">Premium / Discount</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
