"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Sparkles } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useWallet } from "../app/WalletContext";

const client = generateClient<Schema>();

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function CreditsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { isConnected, address } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && isConnected && address) {
      void fetchCredits();
    }
  }, [open, isConnected, address]);

  const fetchCredits = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { walletAddress: { eq: address } },
      });
      if (profiles.length > 0) {
        setCredits(profiles[0].credits ?? 0);
      } else {
        setCredits(null);
      }
    } catch {
      setCredits(null);
    }
    setLoading(false);
  };

  const handleRequest = async () => {
    if (!address) return;
    setRequesting(true);
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { walletAddress: { eq: address } },
      });
      if (profiles.length === 0) {
        await client.models.UserProfile.create({
          walletAddress: address,
          credits: 1000,
        });
        setCredits(1000);
      } else {
        await client.models.UserProfile.update({
          id: profiles[0].id,
          credits: (profiles[0].credits ?? 0) + 1000,
        });
        setCredits((profiles[0].credits ?? 0) + 1000);
      }
    } catch {
      // handle error
    }
    setRequesting(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4 rounded-2xl border border-border3/50 bg-surface p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold">Credits</h3>
              <p className="text-[13px] text-white/40 mt-1">
                We&apos;re free for now, new user got 1,000 credits
              </p>
            </div>

            {!isConnected || !address ? (
              <div className="text-center py-4">
                <p className="text-[13px] text-white/40">
                  Connect your wallet to request credits
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-4">
                <p className="text-[13px] text-white/40">Loading…</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border3/50 bg-white/[0.02] p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">
                    Current balance
                  </p>
                  <p className="text-2xl font-display font-bold text-white">
                    {credits !== null ? credits.toLocaleString() : "—"}
                  </p>
                  <p className="text-[12px] text-white/30 mt-0.5">credits</p>
                </div>

                <button
                  onClick={handleRequest}
                  disabled={requesting || credits !== null}
                  className="w-full rounded-xl bg-accent px-4 py-3 text-[13px] font-medium text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {requesting
                    ? "Requesting…"
                    : credits === null
                    ? "Request 1,000 Credits"
                    : "Credits already claimed"}
                </button>

                <p className="text-[11px] text-white/20 text-center">
                  One-time request per wallet. Credits never expire.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
