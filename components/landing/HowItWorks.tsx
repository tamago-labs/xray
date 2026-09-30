'use client';

import Section from './Section';

const steps = [
  {
    num: '01',
    title: 'Build Your Portfolio',
    description: (
      <>
        Connect your wallet to <span className="text-white/70 font-medium">analyze your real holdings</span>,
        or create a simulated portfolio to explore different strategies.
      </>
    ),
    example: null,
  },
  {
    num: '02',
    title: 'Tell Xray What You Need',
    description: (
      <>
        Ask a question or describe your goal. Xray learns your
        <span className="text-white/70 font-medium"> risk preferences and what you want to achieve</span>.
      </>
    ),
    example: null,
  },
  {
    num: '03',
    title: 'Uncover the Bigger Picture',
    description: (
      <>
        Xray combines your portfolio with market and asset data to
        <span className="text-white/70 font-medium"> uncover risks, compare assets, and surface opportunities</span>.
      </>
    ),
    example: null,
  },
  {
    num: '04',
    title: 'Chat Further & Take Action',
    description: (
      <>
        Review AI risk score and insights, <span className="text-white/70 font-medium">chat with AI to explore more</span>, then rebalance or trade via OKX DEX Router.
      </>
    ),
    example: null,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 grid-bg scroll-mt-14 relative overflow-hidden">
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -left-40 rounded-full blur-[100px] opacity-30 bg-accent pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] top-1/2 -translate-y-1/2 -right-32 rounded-full blur-[100px] opacity-30 bg-zenpurple pointer-events-none" />
      <div className="max-w-3xl mx-auto px-6">
        <Section>
          <p className="text-[13px] text-accent uppercase tracking-wider text-center mb-4">How it works</p>
        </Section>

        <Section>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center tracking-tight mb-12">
            See what's hidden
          </h2>
        </Section>

        <div className="max-w-lg mx-auto">
          <Section>
          <div className="relative pl-16">
            <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border3" />

            <div className="space-y-10">
              {steps.map((step) => (
                <div key={step.num} className="relative">
                  <div className="absolute -left-16 top-1 w-9 h-9 flex items-center justify-center">
                    <span className="text-[18px] font-mono text-accent">{step.num}</span>
                  </div>

                  <h3 className="text-[16px] font-semibold mb-1">{step.title}</h3>
                  <p className="text-[14px] text-white/45 leading-relaxed">{step.description}</p>
                  {step.example && (
                    <p className="mt-2 text-[13px] text-accent/70 italic">{step.example}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
        </div>

        
      </div>
    </section>
  );
}
