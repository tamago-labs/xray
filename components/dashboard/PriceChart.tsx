"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CandlestickSeries, type UTCTimestamp } from "lightweight-charts";
import type { Token } from "@/lib/types/token";

type Timeframe = "1D" | "7D" | "30D" | "90D";

const timeframes: { key: Timeframe; label: string; hours: number; interval: string }[] = [
  { key: "7D", label: "7D", hours: 168, interval: "1h" },
  { key: "30D", label: "30D", hours: 720, interval: "4h" },
  { key: "90D", label: "90D", hours: 2160, interval: "1d" },
];

export default function PriceChart({ token }: { token: Token }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("30D");
  const [candles, setCandles] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const tf = timeframes.find((t) => t.key === timeframe)!;
    const end = new Date();
    const start = new Date(end.getTime() - tf.hours * 60 * 60 * 1000);
    const url = `/api/ohlcv?crypto_id=${token.crypto_id}&interval=${tf.interval}&time_start=${encodeURIComponent(start.toISOString())}&time_end=${encodeURIComponent(end.toISOString())}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setCandles(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCandles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [timeframe, token.crypto_id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !candles) return;

    el.innerHTML = "";

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.3)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      width: el.clientWidth || 600,
      height: 300,
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    if (candles.length > 0) {
      series.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      chart.applyOptions({ width: el.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-1 mb-3">
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
      {loading && candles === null ? (
        <div className="h-[300px] flex items-center justify-center">
          <span className="text-xs text-white/30">Loading chart...</span>
        </div>
      ) : (
        <div ref={containerRef} style={{ height: 300 }} />
      )}
    </div>
  );
}
