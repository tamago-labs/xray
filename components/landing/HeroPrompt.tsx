'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { examplePrompts, getRandomPrompt } from '@/lib/prompts';

export default function HeroPrompt() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * examplePrompts.length));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = getRandomPrompt(prev);
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleBadgeClick = () => {
    setActiveIndex((prev) => {
      const next = getRandomPrompt(prev);
      setAnimKey((k) => k + 1);
      return next;
    });
  };

  const handlePromptClick = () => {
    setInputValue(examplePrompts[activeIndex].text);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      router.push(`/dashboard?prompt=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const current = examplePrompts[activeIndex];

  return (
    <div className="flex flex-col">
    <div className="bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border3 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <span className="text-[12px] text-white/60 font-medium">Zivic AI</span>
      </div>

      <div className="p-5">
        <div className="bg-white/[0.03] border border-border3 rounded-xl p-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Zivic anything about the market…"
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border3/50">
          <button
            onClick={handlePromptClick}
            className="flex items-center gap-2 min-w-0 max-w-[70%]"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={`badge-${animKey}`}
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`shrink-0 inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${current.color}`}
                title="Click to change"
              >
                <span onClick={(e) => { e.stopPropagation(); handleBadgeClick(); }} className="cursor-pointer">
                  {current.badge}
                </span>
              </motion.span>
              <motion.span
                key={`text-${animKey}`}
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
                className="text-[13px] text-white/60 font-medium truncate"
                title={current.text}
              >
                {current.text}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            onClick={handleSubmit}
            className="h-9 px-4 rounded-lg bg-accent flex items-center justify-center gap-2 hover:bg-accent/80 transition-colors shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
            <span className="text-[13px] font-medium text-white">Ask Zivic</span>
          </button>
        </div>
      </div>
    </div>
    <p className="text-[12px] text-white/30 mt-3 text-center">
      Prompts are AI-generated. Rankings reflect what other traders find useful.
    </p>
    </div>
  );
}
