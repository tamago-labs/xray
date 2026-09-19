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
    answer: 'Simply tell Xray what you are looking for. Our multi-agent system researches the market, analyzes tokenized stocks, scans news, and explains opportunities in plain language. You can also compare assets, assess portfolio risk, and prepare trades through OKX DEX Router.',
  },
  {
    question: 'What are tokenized stocks (xStocks)?',
    answer: 'Tokenized stocks are blockchain-based tokens that represent real-world equity shares. They offer 24/7 trading, global access, and fractional ownership. Xray focuses on tokenized stocks available on X Layer, backed by real-time data and liquidity from OKX.',
  },
  {
    question: 'How does the credit system work?',
    answer: 'Each AI interaction consumes credits based on response length. New users receive free credits to get started. Additional credits can be purchased through the platform. Complex queries that use multiple agents or tools may consume more credits.',
  },
  {
    question: 'How do I get started?',
    answer: 'Connect your wallet, tell Xray what you are looking for, and let the agents do the research. No sign-up forms, no lengthy onboarding. Your wallet is your identity, and your chat history is stored on-chain for full transparency.',
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
