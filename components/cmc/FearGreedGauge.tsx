'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

interface HistoricalItem {
  value: string;
  timestamp: string;
}

const getColor = (value: number): string => {
  if (value <= 24) return '#ef4444';
  if (value <= 44) return '#f97316';
  if (value <= 55) return '#eab308';
  if (value <= 74) return '#84cc16';
  return '#22c55e';
};

const getGradient = (value: number): [string, string] => {
  if (value <= 24) return ['#ef4444', '#991b1b'];
  if (value <= 44) return ['#f97316', '#9a3412'];
  if (value <= 55) return ['#eab308', '#854d0e'];
  if (value <= 74) return ['#84cc16', '#3f6212'];
  return ['#22c55e', '#166534'];
};

function GaugeArc({ value }: { value: number }) {
  const angle = (value / 100) * 180;
  const color = getColor(value);
  const [colorStart, colorEnd] = getGradient(value);

  const radius = 70;
  const cx = 80;
  const cy = 80;

  const arcStart = Math.PI;
  const arcEnd = Math.PI + (angle * Math.PI) / 180;
  const largeArcFlag = angle > 180 ? 1 : 0;

  const x1 = cx + radius * Math.cos(arcStart);
  const y1 = cy + radius * Math.sin(arcStart);
  const x2 = cx + radius * Math.cos(arcEnd);
  const y2 = cy + radius * Math.sin(arcEnd);

  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const fillPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  return (
    <svg viewBox="0 0 160 100" className="w-full">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorEnd} />
          <stop offset="100%" stopColor={colorStart} />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
      {value > 1 && (
        <path d={fillPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="Space Grotesk">
        {value}
      </text>
    </svg>
  );
}

export default function FearGreedGauge() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [history, setHistory] = useState<HistoricalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/cmc/fear-greed').then((r) => r.json()),
      fetch('/api/cmc/fear-greed?history=true').then((r) => r.json()),
    ]).then(([latest, hist]) => {
      if (latest.data) setData(latest.data);
      if (hist.data) {
        setHistory(
          hist.data.map((d: any) => ({
            value: Number(d.value),
            date: new Date(d.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }))
        );
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5 flex items-center justify-center h-[320px]">
        <span className="text-xs text-white/30">Loading Fear & Greed...</span>
      </div>
    );
  }

  const value = data ? Number(data.value) : 0;
  const label = data?.value_classification ?? 'Neutral';

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-white/85">Fear & Greed Index</h3>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">CMC</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 max-w-[180px]">
          <GaugeArc value={value} />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[12px] text-white/40">{label}</span>
        </div>
      </div>

      <div className="h-[80px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history.slice(-30)}>
            <defs>
              <linearGradient id="fgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip
              contentStyle={{ background: '#141419', border: '1px solid #2A2A35', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
              itemStyle={{ color: '#6C5CE7' }}
              formatter={(v: any) => [v, 'Index']}
            />
            <Area type="monotone" dataKey="value" stroke="#6C5CE7" fill="url(#fgGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
