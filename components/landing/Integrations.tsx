'use client';

import Section from './Section';

const stack = [
  {
    name: 'CoinMarketCap',
    role: 'Live RWA market data',
    detail: 'Prices, market cap, volume, performance, and tokenized-asset metadata for every xStock.',
    icon: '📊',
  },
  {
    name: 'X Layer',
    role: 'Tokenized-stock ecosystem',
    detail: 'Native connection to the X Layer blockchain environment. Onchain data where available.',
    icon: '⛓️',
  },
  {
    name: 'Zivic AI Engine',
    role: 'Personalization layer',
    detail: 'Understands natural-language goals, evaluates market signals, ranks assets, and generates explanations.',
    icon: '🧠',
  },
];

export default function Integrations() {
  return (
    <section className="border-t border-border3/50 py-24">
      <div className="max-w-4xl mx-auto px-6">
        <Section>
          <p className="text-[13px] text-accent uppercase tracking-wider text-center mb-4">Architecture</p>
        </Section>

        <Section>
          <h2 className="font-display text-3xl font-semibold text-center tracking-tight mb-4">
            Built on real data, not demos
          </h2>
          <p className="text-[14px] text-white/40 text-center max-w-lg mx-auto mb-12">
            Zivic combines live market data with AI personalization on a real blockchain environment.
          </p>
        </Section>

        <Section>
          <div className="border border-border3 rounded-xl divide-y divide-border3 overflow-hidden">
            {stack.map((item) => (
              <div key={item.name} className="p-5 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="text-2xl shrink-0 w-8 text-center">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-[15px] font-semibold">{item.name}</h3>
                    <span className="text-[12px] text-white/35">{item.role}</span>
                  </div>
                  <p className="text-[13px] text-white/45 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}
