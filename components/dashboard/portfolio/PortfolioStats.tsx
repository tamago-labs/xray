'use client';

const portfolio = {
  totalValue: 12847.32,
  change24h: 3.42,
  change7d: 8.14,
  change30d: 15.67,
  riskScore: 68,
  themes: [
    { name: 'AI / Tech', pct: 70, color: '#6C5CE7' },
    { name: 'Finance', pct: 15, color: '#3B82F6' },
    { name: 'Consumer', pct: 15, color: '#00D2A0' },
  ],
};

export default function PortfolioStats() {
  return (
    <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-white/40 mb-1">Total Value</p>
        <p className="text-[24px] font-display font-bold">${portfolio.totalValue.toLocaleString()}</p>
        <p className="text-[13px] text-accent2 mt-1">+{portfolio.change24h}% today</p>
      </div>
      <div>
        <p className="text-[12px] text-white/40 mb-1">7d Change</p>
        <p className="text-[20px] font-display font-bold text-accent2">+{portfolio.change7d}%</p>
      </div>
      <div>
        <p className="text-[12px] text-white/40 mb-1">30d Change</p>
        <p className="text-[20px] font-display font-bold text-accent2">+{portfolio.change30d}%</p>
      </div>
      <div>
        <p className="text-[12px] text-white/40 mb-1">Risk Score</p>
        <p className="text-[20px] font-display font-bold">{portfolio.riskScore}<span className="text-[14px] text-white/30">/100</span></p>
        <p className="text-[12px] text-white/40 mt-0.5">Balanced</p>
      </div>
      <div className="mt-auto">
        <p className="text-[12px] text-white/40 mb-3">Theme Exposure</p>
        <div className="space-y-3">
          {portfolio.themes.map((theme) => (
            <div key={theme.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-white/60">{theme.name}</span>
                <span className="text-[12px] font-medium text-white/80">{theme.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${theme.pct}%`, backgroundColor: theme.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
