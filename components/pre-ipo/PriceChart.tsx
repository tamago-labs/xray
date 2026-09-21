'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, AreaSeries, ColorType } from 'lightweight-charts';

interface Snapshot {
  createdAt?: string;
  markPrice: number;
}

interface PriceChartProps {
  symbol: string;
  data: Snapshot[];
  interval: '1h' | '4h';
}

export default function PriceChart({ data, interval }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(108, 92, 231, 0.3)' },
        horzLine: { color: 'rgba(108, 92, 231, 0.3)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
    });

    const series = chart.addSeries(AreaSeries, {
      topColor: 'rgba(108, 92, 231, 0.25)',
      bottomColor: 'rgba(108, 92, 231, 0.02)',
      lineColor: '#6C5CE7',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    const chartData = data
      .filter((d) => d.markPrice > 0)
      .map((d) => ({
        time: (new Date(d.createdAt!).getTime() / 1000) as UTCTimestamp,
        value: d.markPrice,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    series.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, interval]);

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium text-white/70">
          {interval === '4h' ? '4-Hour' : '1-Hour'} Mark Price
        </h3>
        <span className="text-[11px] text-white/30">{data.length} data points</span>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}

