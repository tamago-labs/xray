'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SeasonData {
  value: number;
  date: string;
}

export default function AltcoinSeasonChart() {
  const [data, setData] = useState<SeasonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonLabel, setSeasonLabel] = useState('');

  useEffect(() => {
    fetch('/api/cmc/altcoin-season?timeframe=90d')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.points) {
          const items = res.data.points.map((d: any) => {
            const val = Number(d.altcoin_index);
            const ts = typeof d.timestamp === 'number' ? d.timestamp * 1000 : Date.parse(d.timestamp);
            return {
              value: val,
              date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
          });
          setData(items);

          const latest = items[items.length - 1];
          if (latest) {
            const v = latest.value;
            if (v >= 75) setSeasonLabel('Altcoin Season');
            else if (v >= 50) setSeasonLabel('Mixed / Balanced');
            else setSeasonLabel('Bitcoin Season');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5 flex items-center justify-center h-[280px]">
        <span className="text-xs text-white/30">Loading Altcoin Season...</span>
      </div>
    );
  }

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-white/85">Altcoin Season Index</h3>
          <span className="text-[11px] text-white/30">{seasonLabel}</span>
        </div>
        <div className="text-right">
          <span className="text-[18px] font-bold text-accent2">{currentValue}</span>
          <span className="text-[10px] text-white/30 ml-1">/100</span>
        </div>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="seasonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D2A0" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00D2A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} hide />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <ReferenceLine y={75} stroke="rgba(0,210,160,0.15)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: '#141419', border: '1px solid #2A2A35', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
              formatter={(v: any) => [v >= 75 ? `${v} 🔥 Alt Season` : v >= 50 ? `${v} Mixed` : `${v} BTC Season`, 'Index']}
            />
            <Area type="monotone" dataKey="value" stroke="#00D2A0" fill="url(#seasonGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-white/20">
        <span>BTC Season</span>
        <span>50</span>
        <span>Alt Season</span>
      </div>
    </div>
  );
}
