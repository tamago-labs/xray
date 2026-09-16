'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ChevronDown, Check, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { examplePrompts, getRandomPrompt } from '@/lib/prompts';

const experienceOptions = [
  { value: 'newcomer', label: 'Newcomer', desc: 'New to crypto. Plain language, more explanations.' },
  { value: 'regular', label: 'Regular', desc: 'Comfortable with basics. Balanced detail.' },
  { value: 'lite_degen', label: 'Lite Degen', desc: 'Familiar with DeFi. Technical but accessible.' },
  { value: 'full_degen', label: 'Full Degen', desc: 'Crypto native. Max degen, no hand-holding.' },
];

const writingStyleOptions = [
  { value: 'default', label: 'Default', desc: 'Balanced tone, clear and direct.' },
  { value: 'journalist', label: 'Journalist', desc: 'Fact-driven, neutral reporting style.' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative flow, explains the why.' },
  { value: 'ct_vibes', label: 'CT Vibes', desc: 'Crypto Twitter slang, memes, vibes.' },
  { value: 'concise', label: 'Concise', desc: 'Short and to the point. No fluff.' },
];

const sourceOptions = [
  { value: 'cmc', label: 'CMC Data', desc: 'CoinMarketCap price data' },
  { value: 'news', label: 'News Sites', desc: 'Crypto & financial news' },
  { value: 'exchange', label: 'Exchange Feeds', desc: 'CEX/DEX order book data' },
  { value: 'tradfi', label: 'TradFi Data', desc: 'Traditional market data' },
];

// ─── Single-select Dropdown ──────────────────────────────────────────────────

function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; desc: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border3/50 bg-white/[0.02] text-[13px] text-white/60 hover:text-white/80 hover:border-border3 transition-colors"
      >
        <span>{selected?.label ?? label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border3/50 bg-surface shadow-xl overflow-hidden z-20">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 transition-colors ${
                value === opt.value
                  ? 'bg-accent/5'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[13px] ${value === opt.value ? 'text-accent font-medium' : 'text-white/70'}`}>
                  {opt.label}
                </span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5 leading-snug">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select Toggle Dropdown ────────────────────────────────────────────

function ToggleDropdown({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; desc: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const count = values.length;
  const total = options.length;
  const display = count === total ? 'All sources' : `${count}/${total} sources`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border3/50 bg-white/[0.02] text-[13px] text-white/60 hover:text-white/80 hover:border-border3 transition-colors"
      >
        <span>{display}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border3/50 bg-surface shadow-xl overflow-hidden z-20">
          {options.map((opt) => {
            const active = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  active ? 'bg-accent' : 'border border-border3/50'
                }`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <span className={`text-[13px] ${active ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                    {opt.label}
                  </span>
                  <p className="text-[11px] text-white/25 truncate">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── New Chat Page ───────────────────────────────────────────────────────────

function NewChatInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const [input, setInput] = useState(initialPrompt ?? '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [experience, setExperience] = useState('regular');

  const [writingStyle, setWritingStyle] = useState('default');
  const [sources, setSources] = useState(['cmc', 'news', 'exchange', 'tradfi']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * examplePrompts.length));
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [input]);

  const handleBadgeClick = () => {
    setActiveIndex((prev) => getRandomPrompt(prev));
    setAnimKey((k) => k + 1);
  };

  const handlePromptClick = () => {
    setInput(examplePrompts[activeIndex].text);
  };

  const current = examplePrompts[activeIndex];

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 max-w-3xl mx-auto">
        {/* Example prompt */}
        <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-8">
          &ldquo;Ask Zivic anything about the market&rdquo;
        </p>

        {/* Input with glow */}
        <div className="w-full bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Zivic anything about the market…"
            rows={1}
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[60px] p-4"
          />
          <div className="flex items-center justify-between px-4 pb-4">
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
            <button className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Config */}
        <div className="w-full grid grid-cols-3 gap-3 mt-4">
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Crypto Experience</label>
            <Dropdown
              label="Crypto Experience"
              options={experienceOptions}
              value={experience}
              onChange={setExperience}
            />
          </div>
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Writing Style</label>
            <Dropdown
              label="Writing Style"
              options={writingStyleOptions}
              value={writingStyle}
              onChange={setWritingStyle}
            />
          </div>
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Sources</label>
            <ToggleDropdown
              label="Sources"
              options={sourceOptions}
              values={sources}
              onChange={setSources}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewChat() {
  return (
    <Suspense fallback={null}>
      <NewChatInner />
    </Suspense>
  );
}
