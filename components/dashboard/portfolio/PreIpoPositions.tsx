'use client';

const preIpoPositions = [
  { name: 'OpenAI', symbol: 'OPENAI', status: 'Pre-IPO', score: 92 },
  { name: 'Anthropic', symbol: 'ANTHR', status: 'Pre-IPO', score: 88 },
  { name: 'xAI', symbol: 'XAI', status: 'Pre-IPO', score: 85 },
];

export default function PreIpoPositions() {
  return (
    <div className="border-t border-border3/50 mt-4 pt-4">
      <h3 className="text-[14px] font-semibold mb-4">Positions</h3>
      <div className="space-y-2">
        {preIpoPositions.map((p) => (
          <div key={p.symbol} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{p.symbol.slice(0, 2)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white/80">{p.name}</p>
              <p className="text-[11px] text-white/40">{p.symbol}</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-accent/30 bg-accent/5 text-accent ml-auto">{p.status}</span>
            <span className="text-[12px] font-mono text-accent2">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
