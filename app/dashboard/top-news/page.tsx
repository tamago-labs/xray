'use client';

const news = [
  {
    title: 'xStock market surpasses $50B in total tokenized equities',
    source: 'CoinMarketCap',
    time: '2h ago',
    theme: 'Market',
    summary: 'Tokenized stocks on major L2s continue to grow as institutional interest increases.',
  },
  {
    title: 'NVIDIA announces new AI chip architecture — NVDAx surges',
    source: 'The Block',
    time: '4h ago',
    theme: 'AI / Tech',
    summary: 'Next-gen GPU announcement drives significant interest in AI-related tokenized stocks.',
  },
  {
    title: 'X Layer processes 1M+ tokenized stock transactions daily',
    source: 'X Layer',
    time: '6h ago',
    theme: 'X Layer',
    summary: 'Milestone reached as adoption of on-chain equities accelerates across DeFi protocols.',
  },
  {
    title: 'SEC signals clearer framework for tokenized securities',
    source: 'Bloomberg',
    time: '8h ago',
    theme: 'Regulation',
    summary: 'Potential regulatory clarity could open doors for broader tokenized stock offerings.',
  },
  {
    title: 'Microsoft expands AI integration across enterprise — MSFTx outlook',
    source: 'Reuters',
    time: '12h ago',
    theme: 'Technology',
    summary: 'New AI features in Microsoft 365 could drive enterprise adoption and revenue growth.',
  },
  {
    title: 'Top 5 trending xStocks this week based on HyperGO scores',
    source: 'Zivic',
    time: '1d ago',
    theme: 'Personalized',
    summary: 'AI, semiconductor, and cloud computing stocks dominate personalized rankings this week.',
  },
];

const themeColors: Record<string, string> = {
  'Market': 'text-zenblue bg-zenblue/10',
  'AI / Tech': 'text-accent bg-accent/10',
  'X Layer': 'text-accent2 bg-accent2/10',
  'Regulation': 'text-warn2 bg-warn2/10',
  'Technology': 'text-zenpurple bg-zenpurple/10',
  'Personalized': 'text-accent2 bg-accent2/10',
};

export default function TopNews() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">Top News</h2>
        <span className="text-[12px] text-white/30">Personalized to your themes</span>
      </div>

      <div className="space-y-3">
        {news.map((item, i) => (
          <article key={i} className="bg-surface border border-border3/50 rounded-xl p-5 hover:border-border3 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${themeColors[item.theme] || 'text-white/40 bg-white/5'}`}>
                {item.theme}
              </span>
              <span className="text-[11px] text-white/25">{item.source} · {item.time}</span>
            </div>
            <h3 className="text-[14px] font-semibold text-white/85 mb-1">{item.title}</h3>
            <p className="text-[13px] text-white/45 leading-relaxed">{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
