'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'What is Xray?',
    answer: 'Xray is your one-stop AI platform for tokenized stocks and pre-IPO markets on X Layer. It combines hyper-personalized AI agents with real-time market data to research, compare, and explain opportunities that fit your goals and risk appetite.',
  },
  {
    question: 'How does Xray work?',
    answer: 'Simply tell Xray what you are looking for. Our multi-agent system researches the market, analyzes tokenized stocks, scans news, and explains opportunities in plain language. You can also evaluate portfolio risk, get AI rebalance suggestions, and swap tokens through OKX DEX Router — all from the same chat interface.',
  },
  {
    question: 'What are tokenized stocks (xStocks)?',
    answer: 'Tokenized stocks are blockchain-based tokens that represent real-world equity shares. They offer 24/7 trading, global access, and fractional ownership. Xray focuses on tokenized stocks available on X Layer, backed by real-time data and liquidity from OKX.',
  },
  {
    question: 'What are Pre-IPO perpetuals?',
    answer: 'Pre-IPO perpetuals let you trade tokenized pre-IPO equity (like OpenAI, Anthropic, Stripe) with a counter-party AMM mechanism on X Layer. You can open long/short positions, manage collateral, and track mark prices in real-time.',
  },
  {
    question: 'How does portfolio risk analysis work?',
    answer: 'Xray evaluates your portfolio using two AI agents. The first analyzes concentration, market risk, and token liquidity. The second provides actionable rebalance suggestions — telling you exactly which tokens to reduce or add, with target allocations. Risk scores range from 0-100 based on your actual holdings and real-time market data from CoinMarketCap.',
  },
  {
    question: 'What are rebalance suggestions?',
    answer: 'After a risk evaluation, Xray generates specific recommendations to improve your portfolio\'s risk profile. Each suggestion includes an action (reduce, add, diversify, or hedge), the token involved, a reason based on your concentration and sector exposure, and a suggested target allocation percentage.',
  },
  {
    question: 'Can I swap tokens directly on Xray?',
    answer: 'Yes. Xray integrates with OKX DEX Router to find the best swap route on X Layer. You can review the quote (price, price impact, route) and execute the swap directly — including token approval and transaction broadcast — all from the chat interface or swap panel.',
  },
  {
    question: 'How does the credit system work?',
    answer: 'Each AI interaction consumes credits based on response length. New users receive free credits to get started. Additional credits can be purchased through the platform. Complex queries that use multiple agents or tools may consume more credits.',
  },

];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative z-10 py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-accent text-center mb-3">FAQ</p>
        <h2 className="text-3xl font-display font-bold text-center mb-12">Frequently Asked Questions</h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-border3/50 rounded-xl bg-surface overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[15px] font-display font-medium text-white/80">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-[14px] text-white/50 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
