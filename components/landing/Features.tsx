'use client';

import { motion } from 'framer-motion';
import Section from './Section';

const features = [
  {
    title: 'Zivic Personalized Score',
    desc: 'Each xStock gets a score based on YOUR profile: Goal Fit, Risk Fit, Growth, Momentum, Liquidity, Sector Fit. The score changes when your preferences change.',
    visual: 'score',
  },
  {
    title: 'Explain Every Recommendation',
    desc: '"Why is NVDAx #1?" Zivic explains each ranking based on your specific profile — not generic descriptions.',
    visual: 'explain',
  },
  {
    title: 'AI Chat Interaction',
    desc: 'Ask follow-ups naturally: "Show me lower-risk alternatives." "Build a diversified portfolio." Zivic updates your personalized view.',
    visual: 'chat',
  },
  {
    title: 'Portfolio Simulator',
    desc: '"Build a $10,000 portfolio focused on AI with balanced risk." Zivic generates a simulated allocation with full explanations.',
    visual: 'portfolio',
  },
  {
    title: 'Live CMC RWA Data',
    desc: 'Powered by CoinMarketCap — real-time prices, market cap, volume, and RWA metadata for every xStock on X Layer.',
    visual: 'data',
  },
  {
    title: 'X Layer Native',
    desc: 'Built for the X Layer tokenized-stock ecosystem. Onchain data where available, not just a mention in the interface.',
    visual: 'xlayer',
  },
];

function ScoreVisual() {
  return (
    <div className="bg-white/[0.03] border border-border3 rounded-lg p-4 space-y-2">
      {[
        { label: 'Goal Fit', value: 'Excellent', color: 'bg-accent2' },
        { label: 'Risk Fit', value: 'High', color: 'bg-accent' },
        { label: 'Theme Fit', value: 'AI / Technology', color: 'bg-zenblue' },
        { label: 'Liquidity', value: 'High', color: 'bg-accent2' },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color === 'bg-accent2' ? '#00D2A0' : row.color === 'bg-accent' ? '#6C5CE7' : '#3B82F6' }} />
          <span className="text-white/40 w-20">{row.label}</span>
          <span className="text-white/70 font-medium">{row.value}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-border3 mt-2">
        <span className="text-[20px] font-bold font-mono text-accent2">94</span>
        <span className="text-[12px] text-white/40">/100</span>
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="bg-white/[0.03] border border-border3 rounded-lg p-4 space-y-2">
      <div className="flex justify-end">
        <span className="text-[11px] bg-accent/20 text-accent2 px-3 py-1 rounded-full">Why is NVDAx above MSFTx?</span>
      </div>
      <div className="flex justify-start">
        <span className="text-[11px] bg-white/[0.05] text-white/60 px-3 py-1 rounded-full max-w-[80%]">NVDAx matches your AI + growth preference with stronger momentum.</span>
      </div>
    </div>
  );
}

function PortfolioVisual() {
  const items = [
    { ticker: 'NVDAx', pct: 25 },
    { ticker: 'MSFTx', pct: 25 },
    { ticker: 'GOOGLx', pct: 20 },
    { ticker: 'METAx', pct: 15 },
    { ticker: 'AAPLx', pct: 15 },
  ];
  return (
    <div className="bg-white/[0.03] border border-border3 rounded-lg p-4 space-y-2">
      {items.map((item) => (
        <div key={item.ticker} className="flex items-center gap-2 text-[12px]">
          <span className="font-mono text-white/60 w-14">{item.ticker}</span>
          <div className="flex-1 h-4 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-zenblue rounded-full" style={{ width: `${item.pct * 4}%` }} />
          </div>
          <span className="text-white/40 w-8 text-right">{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function DataVisual() {
  return (
    <div className="bg-white/[0.03] border border-border3 rounded-lg p-4 grid grid-cols-2 gap-3">
      {[
        { label: 'Price', value: '$87.42' },
        { label: 'Market Cap', value: '$2.14T' },
        { label: '24h Vol', value: '$42.8B' },
        { label: '7d Change', value: '+4.2%' },
      ].map((item) => (
        <div key={item.label}>
          <p className="text-[11px] text-white/30">{item.label}</p>
          <p className="text-[14px] text-white/70 font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

const visuals: Record<string, React.ReactNode> = {
  score: <ScoreVisual />,
  explain: <ScoreVisual />,
  chat: <ChatVisual />,
  portfolio: <PortfolioVisual />,
  data: <DataVisual />,
  xlayer: <DataVisual />,
};

export default function Features() {
  return (
    <section id="features" className="border-t border-border3/50 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <Section>
          <p className="text-[13px] text-accent uppercase tracking-wider text-center mb-4">Features</p>
        </Section>

        <Section>
          <h2 className="font-display text-3xl font-semibold text-center tracking-tight mb-12">
            Personalization is the product
          </h2>
        </Section>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white/[0.02] border border-border3/50 rounded-xl p-6 flex flex-col gap-4"
            >
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold mb-1">{f.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
              </div>
              {f.visual && visuals[f.visual]}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
