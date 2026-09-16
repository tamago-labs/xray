'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, MessageSquare, Boxes, Wallet, Star, BellRing } from 'lucide-react';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('opacity-100', 'translate-y-0');
            e.target.classList.remove('opacity-0', 'translate-y-6');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    el.querySelectorAll('.reveal').forEach((child) => io.observe(child));
  }, []);
  return ref;
}



function SpecializedDiagram() {
  return (
    <div className="relative mx-auto h-48 w-full max-w-xs">
      <svg viewBox="0 0 300 180" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M90 45 C 130 45, 150 90, 150 90" stroke="#2A2A35" strokeWidth="1.5" />
        <path d="M210 45 C 170 45, 150 90, 150 90" stroke="#2A2A35" strokeWidth="1.5" />
        <path d="M150 145 C 150 120, 150 100, 150 95" stroke="#2A2A35" strokeWidth="1.5" />
      </svg>
      <span className="absolute left-0 top-6 inline-flex items-center gap-1.5 rounded-full border border-zenblue/40 bg-white/[0.03] px-3 py-1.5 text-[10px] text-zenblue">
        <Bitcoin className="w-3 h-3" /> Onchain Data
      </span>
      <span className="absolute right-0 top-6 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white/[0.03] px-3 py-1.5 text-[10px] text-accent">
        <MessageSquare className="w-3 h-3" /> RWA Feeds
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white/[0.03] px-3 py-1.5 text-[10px] text-accent">
        <Boxes className="w-3 h-3" /> Market Data
      </span>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-zenblue to-accent flex items-center justify-center shadow-lg shadow-accent/20">
        <MessageSquare className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

function IntegratedDiagram() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-xs rounded-full bg-gradient-to-r from-accent to-zenblue p-[1px]">
        <div className="flex items-center gap-2.5 rounded-full bg-surface px-4 py-3">
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="text-sm text-white/40">Ask Zivic AI</span>
          <span className="ml-auto rounded-md border border-border3 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/30">Shift + /</span>
        </div>
      </div>
    </div>
  );
}

function PersonalizedDiagram() {
  return (
    <div className="relative mx-auto h-48 w-full max-w-xs">
      <svg viewBox="0 0 300 180" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M80 50 C 120 50, 140 90, 150 90" stroke="#2A2A35" strokeWidth="1.5" />
        <path d="M220 140 C 180 140, 160 110, 155 100" stroke="#2A2A35" strokeWidth="1.5" />
      </svg>
      <span className="absolute left-0 top-8 inline-flex items-center gap-1.5 rounded-full border border-zenblue/40 bg-white/[0.03] px-3 py-1.5 text-[10px] text-zenblue">
        <Wallet className="w-3 h-3" /> Your Portfolio
      </span>
      <span className="absolute bottom-6 right-0 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white/[0.03] px-3 py-1.5 text-[10px] text-accent">
        <Star className="w-3 h-3" /> Your Watchlist
      </span>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-zenblue to-accent flex items-center justify-center shadow-lg shadow-accent/20">
        <MessageSquare className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

export default function Differentiator() {
  const ref = useReveal();

  const cards = [
    {
      title: 'Exclusive',
      text: 'Built solely for tokenized stocks. Direct feeds from onchain data deliver richer, more up-to-date answers than generic AI tools.',
      diagram: <SpecializedDiagram />,
      textLeft: true,
    },
    {
      title: 'Integrated',
      text: 'Zivic AI lives on your dashboard. Ask a question while you analyze xStocks without changing tabs.',
      diagram: <IntegratedDiagram />,
      textLeft: false,
    },
    {
      title: 'Personalized',
      text: 'Uses your portfolio and watchlists to customize answers based on the assets and themes you care about.',
      diagram: <PersonalizedDiagram />,
      textLeft: true,
    },
    {
      title: 'Affordable',
      text: 'Mid-range frontier models with adaptive observability cut costs by 90% vs top-tier AI.',
      diagram: <IntegratedDiagram />,
      textLeft: false,
    },
  ];

  return (
    <section className="border-t border-border3/50 py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[13px] text-accent uppercase tracking-wider text-center mb-6"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl md:text-4xl font-bold text-center tracking-tight"
        >
          What makes Zivic AI different
        </motion.h2>

        <div className="mt-14 space-y-0">
          {cards.map((card, i) => (
            <div key={card.title}> 
              <div className={`reveal opacity-0 translate-y-6 transition-all duration-500 ease-out rounded-2xl border border-border3/50 bg-white/[0.02] p-6 md:p-8 ${card.textLeft ? 'border-l-2 border-l-accent' : 'border-r-2 border-r-accent'}`}>
                <div className={`grid items-center gap-8 md:grid-cols-2 ${!card.textLeft ? 'md:[&>:first-child]:order-2' : ''}`}>
                  <div className={!card.textLeft ? 'md:text-right' : ''}>
                    <h3 className="text-xl md:text-2xl font-bold">{card.title}</h3>
                    <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed text-white/45">{card.text}</p>
                  </div>
                  {card.diagram}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
