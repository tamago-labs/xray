'use client';

const alerts = [
  { type: 'ranking', time: '2m ago', text: 'METAx moved up to #4 in your ranking (+3 positions)', detail: 'Strong match for your AI preference with growing momentum.' },
  { type: 'price', time: '15m ago', text: 'NVDAx +5.2% in 24h', detail: 'Your top match is having a strong day.' },
  { type: 'news', time: '1h ago', text: 'New AI regulation proposal could impact tech xStocks', detail: 'Potential risk exposure increase for AI-heavy portfolio.' },
  { type: 'ranking', time: '3h ago', text: 'GOOGLx dropped to #3 (-1 position)', detail: 'Slightly weaker momentum compared to MSFTx this week.' },
  { type: 'system', time: '1d ago', text: 'Your weekly market summary is ready', detail: 'Review how your personalized ranking shifted over the past week.' },
];

const typeStyles: Record<string, { color: string; label: string }> = {
  ranking: { color: 'text-accent2', label: 'Ranking' },
  price: { color: 'text-zenblue', label: 'Price' },
  news: { color: 'text-zenpurple', label: 'News' },
  system: { color: 'text-white/40', label: 'System' },
};

export default function Alerts() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">Alerts</h2>
        <span className="text-[12px] text-white/30">{alerts.length} notifications</span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const style = typeStyles[alert.type];
          return (
            <div key={i} className="bg-surface border border-border3/50 rounded-xl p-4 hover:border-border3 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${style.color}`}>{style.label}</span>
                <span className="text-[11px] text-white/25 ml-auto">{alert.time}</span>
              </div>
              <p className="text-[14px] text-white/80">{alert.text}</p>
              <p className="text-[12px] text-white/40 mt-1">{alert.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
