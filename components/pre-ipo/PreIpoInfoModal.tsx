'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PreIpoInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PreIpoInfoModal({ open, onClose }: PreIpoInfoModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-surface border border-border3 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border3">
              <span className="text-sm font-medium text-white/80">About Pre-IPO Trading</span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <p className="text-[13px] text-white/60 leading-relaxed">This feature is in early development on X Layer Testnet.</p>
            </div>

            <div className="p-5 space-y-4">

              <div className="space-y-2.5 text-[13px] text-white/60">
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>
                    If you would like to trade tokenized stocks on X Layer Mainnet, visit the{' '}
                    <Link href="/dashboard/explore" className="text-accent hover:underline inline-flex items-center gap-1" onClick={onClose}>
                      Explore page <ExternalLink className="w-3 h-3" />
                    </Link>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>
                    If you would like to research, prepare, or execute, chat with AI assistant.
                  </span>
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[13px] text-white/60 leading-relaxed">
                  Trade pre-IPO stocks with a counter-party AMM that takes the opposite side of every trade. Prices from reputable secondary market data sources.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
