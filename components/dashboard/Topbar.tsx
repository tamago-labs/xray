"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut, Check } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { CreditsModal } from "./CreditsModal";
import { WalletModal } from "../app/WalletModal";
import { useWallet } from "../app/WalletContext";
import { truncateAddress } from "@/lib/wallet";
import { X_LAYER } from "@/lib/chains";
import TokenStrip from "./TokenStrip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import listData from "@/lib/data/rwa-v1-list.json";
import { usePrices } from "@/app/contexts/PriceContext";

const tokenMetaMap = new Map<string, { logo: string | null; name: string; symbol: string; rwaRank: number | null }>();
for (const asset of (listData as any).assets) {
  for (const token of asset.tokens ?? []) {
    if (!tokenMetaMap.has(token.symbol)) {
      tokenMetaMap.set(token.symbol, {
        logo: token.logo ?? null,
        name: token.name,
        symbol: token.symbol,
        rwaRank: asset.rwa_rank ?? null,
      });
    }
  }
}

const dataClient = generateClient<Schema>();

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/portfolio": "Your AI-Powered Portfolio",
  "/dashboard/explore": "Explore Tokenized Stocks",
  "/dashboard/pre-ipo": "Pre-IPO Tokenized Stocks",
  "/dashboard/alerts": "Stay Notified",
};

export default function Topbar() {
  const pathname = usePathname();
  const { prices } = usePrices();
  const { isConnected, address, isCorrectChain, switchToXLayer, disconnect } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) { setCredits(null); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: address } },
        });
        setCredits(profiles[0]?.credits ?? null);
      } catch { setCredits(null); }
    })();
  }, [isConnected, address, creditsModalOpen]);

  const tokenMatch = pathname.match(/^\/dashboard\/token\/([^/]+)\/([^/]+)$/);
  const tokenSlug = tokenMatch?.[1];
  const tokenCryptoId = tokenMatch?.[2];
  const assetData = (listData as any).assets.find((a: any) => a.slug === tokenSlug);
  const tokenData = assetData?.tokens?.find((t: any) => String(t.crypto_id) === tokenCryptoId);
  const otherTokens = assetData?.tokens?.filter((t: any) => String(t.crypto_id) !== tokenCryptoId) ?? [];
  const tokenPrice = tokenData ? prices.find((p) => p.token_symbol === tokenData.symbol) : undefined;

  const tokenMeta = tokenData ? {
    logo: tokenData.logo ?? null,
    name: tokenData.name,
    symbol: tokenData.symbol,
    rwaRank: assetData?.rwa_rank ?? null,
    contractAddress: tokenData.contractAddress ?? null,
    assetSymbol: assetData?.symbol ?? null,
    assetSlug: assetData?.slug ?? null,
  } : null;

  return (
    <header className="h-14 border-b border-border3/50 bg-surface flex items-center justify-between px-6 pl-0 sticky top-0 z-10">
      {PAGE_TITLES[pathname] ? (
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-lg font-display font-semibold text-white/70 px-2 ml-5"
        >
          {PAGE_TITLES[pathname]}
        </motion.h1>
      ) : tokenMeta ? (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-3 px-2 ml-5 overflow-hidden"
        >
          {tokenMeta.logo ? (
            <img src={tokenMeta.logo} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/40">
              {tokenMeta.symbol?.slice(0, 2)}
            </div>
          )}
          <span className="text-sm font-semibold text-white/90 cursor-default" title={tokenMeta.name}>{tokenMeta.symbol}</span>
          {tokenMeta.rwaRank != null && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 cursor-default" title={`Ranked #${tokenMeta.rwaRank} by CoinMarketCap`}>
              #{tokenMeta.rwaRank}
            </span>
          )}
          {tokenPrice?.price != null && (
            <span className="text-sm font-semibold text-white/80 ml-2">
              ${tokenPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex items-center gap-3 text-[11px]">
            {tokenPrice?.percent_24h != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">24h</span>
                <span className={`font-medium ${tokenPrice.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_24h >= 0 ? "+" : ""}{tokenPrice.percent_24h.toFixed(2)}%
                </span>
              </span>
            )}
            {tokenPrice?.percent_7d != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">7d</span>
                <span className={`font-medium ${tokenPrice.percent_7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_7d >= 0 ? "+" : ""}{tokenPrice.percent_7d.toFixed(2)}%
                </span>
              </span>
            )}
            {tokenPrice?.percent_30d != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">30d</span>
                <span className={`font-medium ${tokenPrice.percent_30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_30d >= 0 ? "+" : ""}{tokenPrice.percent_30d.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
          {tokenMeta.contractAddress && (
            <a
              href={`https://web3.okx.com/explorer/x-layer/evm/address/${tokenMeta.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors ml-3"
              title={tokenMeta.contractAddress}
            >
              <span className="text-[11px] font-mono text-white/50">{tokenMeta.contractAddress.slice(0, 6)}...{tokenMeta.contractAddress.slice(-4)}</span>
              <ExternalLink className="w-3 h-3 text-white/30" />
            </a>
          )}
          {otherTokens.length > 0 && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/[0.06]">
              <span className="text-[10px] text-white/25 shrink-0">Other {tokenMeta.assetSymbol}</span>
              {otherTokens.map((ot: any) => {
                const otPrice = prices.find((p) => p.token_symbol === ot.symbol);
                return (
                  <Link
                    key={ot.crypto_id}
                    href={`/dashboard/token/${tokenMeta.assetSlug}/${ot.crypto_id}`}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-border3/30 shrink-0 hover:border-white/10 transition-colors"
                  >
                    {ot.logo ? (
                      <img src={ot.logo} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                        {ot.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-white/70">{ot.symbol}</span>
                    {otPrice?.price != null && (
                      <span className="text-[11px] font-semibold text-white/90">
                        ${otPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {otPrice?.percent_24h != null && (
                      <span className={`text-[10px] font-medium ${otPrice.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {otPrice.percent_24h >= 0 ? "+" : ""}{otPrice.percent_24h.toFixed(1)}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        <TokenStrip />
      )}

      <div className="flex items-center gap-3 relative shrink-0 ml-2">
        <button
          onClick={() => setCreditsModalOpen(true)}
          className="text-[13px] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-white/80 font-medium">{credits !== null ? credits.toLocaleString() : "—"}</span>
          <span className="text-white/30">credits</span>
        </button>

        {isConnected ? (
          <button onClick={() => setPopoverOpen((v) => !v)} className="relative flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCorrectChain ? "bg-gradient-to-br from-accent to-purple-500" : "bg-yellow-500/80"}`}>
              <span className="text-[10px] font-bold text-white/90">{address?.slice(2, 4).toUpperCase()}</span>
            </div>
            <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${popoverOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <button
            onClick={() => setWalletModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-accent text-white hover:bg-accent/80 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </button>
        )}

        <AnimatePresence>
          {popoverOpen && isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-border3/50 bg-surface shadow-2xl overflow-hidden z-20"
            >
              {!isCorrectChain && (
                <button
                  onClick={() => { void switchToXLayer(); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-yellow-400 hover:bg-yellow-500/5 transition-colors"
                >
                  <span>Switch to {X_LAYER.name}</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                <span>{truncateAddress(address!)}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/25" />}
              </button>
              <button
                onClick={() => { disconnect(); setPopoverOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors border-t border-border3/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <CreditsModal open={creditsModalOpen} onClose={() => setCreditsModalOpen(false)} />
    </header>
  );
}
