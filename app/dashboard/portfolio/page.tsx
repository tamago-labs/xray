'use client';

const portfolio = {
  totalValue: 12847.32,
  change24h: 3.42,
  change7d: 8.14,
  change30d: 15.67,
  holdings: [
    { ticker: 'NVDAx', name: 'NVIDIA', allocation: 25, value: 3211.83, change: 5.2, score: 94 },
    { ticker: 'MSFTx', name: 'Microsoft', allocation: 25, value: 3211.83, change: 2.1, score: 89 },
    { ticker: 'GOOGLx', name: 'Alphabet', allocation: 20, value: 2569.46, change: -1.3, score: 86 },
    { ticker: 'METAx', name: 'Meta', allocation: 15, value: 1927.10, change: 4.8, score: 82 },
    { ticker: 'AAPLx', name: 'Apple', allocation: 15, value: 1927.10, change: 0.9, score: 78 },
  ],
  riskScore: 68,
  themes: [
    { name: 'AI / Tech', pct: 70, color: '#6C5CE7' },
    { name: 'Finance', pct: 15, color: '#3B82F6' },
    { name: 'Consumer', pct: 15, color: '#00D2A0' },
  ],
};

export default function Portfolio() {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border3/50 rounded-xl p-5">
          <p className="text-[12px] text-white/40 mb-1">Total Value</p>
          <p className="text-[24px] font-display font-bold">${portfolio.totalValue.toLocaleString()}</p>
          <p className="text-[13px] text-accent2 mt-1">+{portfolio.change24h}% today</p>
        </div>
        <div className="bg-surface border border-border3/50 rounded-xl p-5">
          <p className="text-[12px] text-white/40 mb-1">7d Change</p>
          <p className="text-[24px] font-display font-bold text-accent2">+{portfolio.change7d}%</p>
        </div>
        <div className="bg-surface border border-border3/50 rounded-xl p-5">
          <p className="text-[12px] text-white/40 mb-1">30d Change</p>
          <p className="text-[24px] font-display font-bold text-accent2">+{portfolio.change30d}%</p>
        </div>
        <div className="bg-surface border border-border3/50 rounded-xl p-5">
          <p className="text-[12px] text-white/40 mb-1">Risk Score</p>
          <p className="text-[24px] font-display font-bold">{portfolio.riskScore}<span className="text-[14px] text-white/30">/100</span></p>
          <p className="text-[13px] text-white/40 mt-1">Balanced</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Holdings table */}
        <div className="md:col-span-2 bg-surface border border-border3/50 rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">Holdings</h3>
          <div className="space-y-3">
            {portfolio.holdings.map((h) => (
              <div key={h.ticker} className="flex items-center gap-3">
                <span className="font-mono text-[13px] text-white/70 w-16">{h.ticker}</span>
                <div className="flex-1">
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-zenblue rounded-full"
                      style={{ width: `${h.allocation * 4}%` }}
                    />
                  </div>
                </div>
                <span className="text-[12px] text-white/40 w-12 text-right">{h.allocation}%</span>
                <span className="text-[13px] text-white/60 w-20 text-right">${h.value.toLocaleString()}</span>
                <span className={`text-[12px] w-14 text-right ${h.change >= 0 ? 'text-accent2' : 'text-warn2'}`}>
                  {h.change >= 0 ? '+' : ''}{h.change}%
                </span>
                <span className="text-[12px] font-mono text-accent2 w-10 text-right">{h.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme breakdown */}
        <div className="bg-surface border border-border3/50 rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">Theme Exposure</h3>
          <div className="space-y-4">
            {portfolio.themes.map((theme) => (
              <div key={theme.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-white/60">{theme.name}</span>
                  <span className="text-[12px] font-medium text-white/80">{theme.pct}%</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${theme.pct}%`, backgroundColor: theme.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border3/50">
            <h4 className="text-[12px] text-white/40 mb-2">Simulated Portfolio</h4>
            <p className="text-[11px] text-white/30 leading-relaxed">
              This is a simulated allocation based on your HyperGO preferences. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
