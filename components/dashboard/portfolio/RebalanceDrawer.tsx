'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';

interface RebalanceSuggestion {
  action: 'reduce' | 'add' | 'diversify' | 'hedge';
  symbol: string;
  reason: string;
  suggestedAllocation: number;
}

interface RebalanceDrawerProps {
  open: boolean;
  onClose: () => void;
  suggestions: RebalanceSuggestion[] | null;
}

function actionColor(action: string) {
  switch (action) {
    case 'reduce': return 'text-warn2';
    case 'add': return 'text-accent2';
    case 'diversify': return 'text-blue-400';
    case 'hedge': return 'text-yellow-400';
    default: return 'text-white/70';
  }
}

export default function RebalanceDrawer({ open, onClose, suggestions }: RebalanceDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border3/50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[18px] font-display font-bold text-white/90">Rebalance Suggestions</h2>
                  <p className="text-[12px] text-white/40 mt-0.5">AI-powered recommendations to improve your portfolio risk</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {suggestions && suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((s, i) => (
                    <div key={i} className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4 text-accent" />
                          <span className="text-[14px] font-semibold text-white/90">{s.symbol}</span>
                        </div>
                        <span className={`text-[12px] font-medium uppercase ${actionColor(s.action)}`}>
                          {s.action}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/60 leading-relaxed mb-2">{s.reason}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/40">Suggested allocation:</span>
                        <span className="text-[11px] font-medium text-white/80">{s.suggestedAllocation}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                  <p className="text-[12px] text-white/50">
                    No rebalance suggestions available. Run a risk evaluation first.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
