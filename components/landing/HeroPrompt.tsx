'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Plus } from 'lucide-react';

export default function HeroPrompt() {
  const [inputValue, setInputValue] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border3 bg-white/[0.02] rounded-t-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-[12px] text-white/60 font-medium">Xray AI</span>
        </div>

        <div className="p-5">
          <div className="bg-white/[0.03] border border-border3 rounded-xl p-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Xray anything about the market…"
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[32px]"
            />
            <div className="flex items-center justify-between mt-2">
              <div ref={popoverRef} className="relative">
                <button
                  onClick={() => setPopoverOpen(!popoverOpen)}
                  className="w-9 h-9 rounded-lg bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50 flex items-center justify-center transition-colors"
                  title="Attach portfolio"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {popoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-border3/40 text-[11px] font-semibold tracking-wider text-white/40">
                      Choose a Demo Portfolio
                    </div>
                    <div className="px-3 py-4 text-[12px] text-white/40">
                      Connect your wallet or use a simulated portfolio in the app
                    </div>
                  </div>
                )}
              </div>
              <button className="w-9 h-9 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors shrink-0">
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
