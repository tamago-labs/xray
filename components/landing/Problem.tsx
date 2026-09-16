'use client';

import Section from './Section';

export default function Problem() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Left — 40% */}
          <div className="md:col-span-2">
            <Section>
              <p className="text-[13px] text-accent uppercase tracking-wider mb-6">The Problem</p>
            </Section>
            <Section>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                More tokenized stocks.<br />More decisions.
              </h2>
            </Section>
          </div>

          {/* Right — 60% */}
          <div className="md:col-span-3">
            <Section>
              <p className="text-[15px] text-white/50 leading-relaxed">
                Tokenized stocks are bringing equities onchain, but having more markets and more information doesn't make investing easier. Investors still have to research what is moving, understand why, and figure out what actually fits their goals and risk appetite.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-lg md:text-xl font-display font-semibold text-white/80 leading-snug">
                The challenge isn&apos;t access. It&apos;s knowing what to choose.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-[15px] text-white/50 leading-relaxed">
                Zivic brings AI-powered market research, personalized recommendations, and onchain trading into one place — helping users go from <span className="text-accent font-semibold">what should I buy?</span> to <span className="text-accent font-semibold">let&apos;s trade it.</span>
              </p>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}
