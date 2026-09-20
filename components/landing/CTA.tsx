import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Section from './Section';

export default function CTA() {
  return (
    <section className="py-24 grid-bg">
      <div className="max-w-2xl mx-auto px-6">
        <Section>
          <div className="relative p-4">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] bg-accent/10 blur-[100px] rounded-full" />
            </div>
            <div className="relative bg-surface rounded-2xl p-10 text-center z-10">
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Get in before the IPO
              </h2>
              <p className="mt-4 text-[15px] text-white/45">
                Your one-stop AI platform for tokenized stocks and pre-IPO markets. Trade tokens like OpenAI, Anthropic before they hit the market. Real pricing, settled on X Layer.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  href="/dashboard/pre-ipo"
                  className="inline-flex items-center gap-2 text-[15px] font-medium bg-accent text-white px-8 py-4 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  Trade <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/tamago-labs/xray"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[15px] font-medium text-white/60 border border-border3/50 px-6 py-4 rounded-lg hover:text-white hover:border-border3 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}
