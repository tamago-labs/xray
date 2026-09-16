"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Token, Asset } from "@/lib/types/token";
import { ArrowDown, ArrowRight } from "lucide-react";

type Tab = "Buy" | "Sell";

export default function SwapPanel({ token, asset }: { token: Token; asset: Asset }) {
  const [tab, setTab] = useState<Tab>("Buy");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex gap-1 mb-4">
        {(["Buy", "Sell"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative ${
              tab === t
                ? "text-white"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-zenblue/25 via-accent/15 to-accent2/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[11px] text-white/40">{tab === "Buy" ? "You pay" : "You sell"}</div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <input
            type="text"
            value={tab === "Buy" ? fromAmount : toAmount}
            onChange={(e) => tab === "Buy" ? setFromAmount(e.target.value) : setToAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
          />
          <div className="flex items-center gap-1.5 shrink-0 bg-white/[0.06] px-2 py-1 rounded-lg">
            {tab === "Buy" ? (
              <>
                <div className="w-4 h-4 rounded-full bg-purple-500/30" />
                <span className="text-[12px] font-medium text-white/70">SOL</span>
              </>
            ) : token.logo ? (
              <img src={token.logo} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            {tab === "Sell" && <span className="text-[12px] font-medium text-white/70">{token.symbol}</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-center my-2">
        <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <ArrowDown className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] text-white/40">{tab === "Buy" ? "You receive" : "You get"}</div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <input
            type="text"
            value={tab === "Buy" ? toAmount : fromAmount}
            onChange={(e) => tab === "Buy" ? setToAmount(e.target.value) : setFromAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
          />
          <div className="flex items-center gap-1.5 shrink-0 bg-white/[0.06] px-2 py-1 rounded-lg">
            {tab === "Buy" ? (
              <>
                {token.logo ? (
                  <img src={token.logo} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <span className="text-[12px] font-medium text-white/70">{token.symbol}</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-purple-500/30" />
                <span className="text-[12px] font-medium text-white/70">SOL</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[11px] mb-3">
          <span className="text-white/30">Price</span>
          <span className="text-white/50">
            1 SOL ≈ 0.0028 {token.symbol}
          </span>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2">
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
