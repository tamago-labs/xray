'use client';

import HeroPrompt from './HeroPrompt';
import TokenShowcase from './TokenShowcase';
import Section from './Section';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 relative grid-bg">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Section>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Everyone sees the same tokenized stocks<br />
              <span className="bg-gradient-to-r from-zenblue via-accent to-accent2 bg-clip-text text-transparent">
                Zivic makes it yours
              </span>
            </h1>
          </Section>

          <Section>
            <p className="mt-5 text-[15px] text-white/50 leading-relaxed">
              Zivic is a hyper-personalized AI dashboard for tokenized stocks on{' '}
              <a href="https://solana.com/" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">Solana</a>. Tell Zivic your goals and risk appetite — it ranks, filters, and explains the{' '}
              <a href="https://xstocks.fi/" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">xStocks</a>{' '}
              / <a href="https://ondo.finance/ondo-stocks" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">Ondo Stocks</a>{' '}
              that matter most to you.
            </p>
          </Section>

          <Section>
            <ul className="mt-6 space-y-2 text-[13px] text-white/35">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                Trading-ready on <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" alt="Solana" className="w-4 h-4 inline-block rounded-full" /> <span className="text-accent font-semibold">Solana Mainnet</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                Data supplied by <img src="data:image/webp;base64,UklGRpABAABXRUJQVlA4IIQBAACQCACdASocABwAPtEutFooIagoGAEAGglsAJ0yhHVmgr0u2A3AG8jbyMSqrxp/Q2/A/YAVxwJw+yloJ8smrpKqFYWRvVgPnY0CG+B4AAD+Ctjsye/cX1TUx/xyKUIg9Ud32p9rJksmCygByiPDZFVXIusKLNlU/ZYW654rHaxRl+81N+ap6z5/+JUP85O4X9LOTiHyYhIS+Uv0SbUMOlRY5nwz++/kUpwVj7HrZvaoS6CMjojqhvH70H0o2n+lj1mVb8fn4F//afX8GlQuLQ++sH/FV/wsDf0/sw7GHQkWO9SfjH5O7wBfAYag/NcAisPc06GbPrnCrictkX8eI2RAd6t4KuNhlUlp2SGRV1LTnkMrY8Weg17US9j97ZZMSCoqc37qX4VhuMeYDv/xXYCbiJwHo/7m/9tn1N/6Lxa0GzOaixvJugxQ1/fMJncLK31Qx0a/dRjeeaySYZCWqSBrAU4Gn9gwt+x/z/zSoUNDUfjex7f0/z6I3nYWKUpL+weT4AAA" alt="CoinMarketCap" className="w-4 h-4 inline-block rounded-full" /> <span className="text-accent font-semibold">CoinMarketCap Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                Frontier AI reasoning with <span className="w-4 h-4 rounded-full bg-white inline-flex items-center justify-center"><img src="https://openrouter.ai/images/icons/OpenAI.svg" alt="OpenAI" className="w-3 h-3" /></span> <span className="text-accent font-semibold">GPT-6 Astra</span>
              </li>
            </ul>
          </Section>
        </div>

        <HeroPrompt />
      </div>

      <TokenShowcase />
    </section>
  );
}
