"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Token, Asset } from "@/lib/types/token";
import { ArrowRight, ChevronDown, X, Loader2, RefreshCw } from "lucide-react";
import { BASE_TOKENS, type BaseToken } from "@/lib/tokens/base-tokens";
import { formatTokenAmount } from "@/lib/utils/format";
import RouteVisualization from "./RouteVisualization";

type Tab = "Buy" | "Sell";

interface DexRouter {
  dexProtocol: { dexName: string; percent: string };
  fromToken: { tokenSymbol: string; tokenContractAddress: string; decimal: string; tokenUnitPrice: string };
  toToken: { tokenSymbol: string; tokenContractAddress: string; decimal: string; tokenUnitPrice: string };
  fromTokenIndex: string;
  toTokenIndex: string;
}

interface Quote {
  fromToken: { tokenSymbol: string; tokenContractAddress: string; decimal: string; tokenUnitPrice: string };
  toToken: { tokenSymbol: string; tokenContractAddress: string; decimal: string; tokenUnitPrice: string };
  fromTokenAmount: string;
  toTokenAmount: string;
  priceImpactPercent: string;
  estimateGasFee: string;
  tradeFee: string;
  router: string;
  dexRouterList: DexRouter[];
  quoteId: string;
  swapMode: string;
}

export default function SwapPanel({ token, asset }: { token: Token; asset: Asset }) {
  const [tab, setTab] = useState<Tab>("Buy");
  const [fromAmount, setFromAmount] = useState("");
  const [baseToken, setBaseToken] = useState<BaseToken>(BASE_TOKENS[5]);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amountEdited, setAmountEdited] = useState(false);

  async function fetchQuote(amount: string) {
    setLoading(true);
    setError("");
    setAmountEdited(false);

    const decimals = tab === "Buy" ? baseToken.decimals : token.decimals ?? 18;
    const rawAmount = (Number(amount) * Math.pow(10, decimals)).toString();

    const fromAddr = tab === "Buy" ? baseToken.address : (token.contractAddress ?? "");
    const toAddr = tab === "Buy" ? (token.contractAddress ?? "") : baseToken.address;

    try {
      const params = new URLSearchParams({
        fromTokenAddress: fromAddr,
        toTokenAddress: toAddr,
        amount: rawAmount,
      });
      const res = await fetch(`/api/quote?${params}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setQuote(null);
      } else {
        setQuote(json.quote);
      }
    } catch {
      setError("Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }

  function handleGetQuote() {
    setQuoteAmount(fromAmount);
    setQuoteModalOpen(true);
    fetchQuote(fromAmount);
  }

  function handleAmountChange(value: string) {
    setQuoteAmount(value);
    setAmountEdited(true);
  }

  function handleRefetch() {
    fetchQuote(quoteAmount);
  }

  function handleSwap() {
    console.log("Swap:", quote?.quoteId, quoteAmount);
  }

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
                className="absolute inset-0 rounded-lg bg-accent"
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
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
          />
          <button
            onClick={() => tab === "Buy" && setTokenModalOpen(true)}
            className="flex items-center gap-1.5 shrink-0 bg-white/[0.06] px-2 py-1 rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            {tab === "Buy" ? (
              <>
                <img src={baseToken.logo} alt={baseToken.symbol} className="w-4 h-4 rounded-full" />
                <span className="text-[12px] font-medium text-white/70">{baseToken.symbol}</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </>
            ) : (
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
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center text-[11px] mb-3">
          <span className="text-white/50 flex items-center gap-1.5">
            Best price via{" "}
            <img src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png" alt="OKX" className="w-3.5 h-3.5 rounded-full inline-block" />{" "}
            OKX DEX Router
          </span>
        </div>
        <button
          onClick={handleGetQuote}
          disabled={!fromAmount || Number(fromAmount) <= 0}
          className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Get Quote <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Token Selector Modal */}
      <AnimatePresence>
        {tokenModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setTokenModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-surface border border-border3 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border3">
                <span className="text-sm font-medium text-white/80">Select token</span>
                <button
                  onClick={() => setTokenModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {BASE_TOKENS.map((bt) => (
                  <button
                    key={bt.symbol}
                    onClick={() => {
                      setBaseToken(bt);
                      setTokenModalOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      baseToken.symbol === bt.symbol
                        ? "bg-accent/10 border border-accent/20"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <img src={bt.logo} alt={bt.symbol} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/90">{bt.symbol}</p>
                      <p className="text-[11px] text-white/40 truncate">{bt.name}</p>
                    </div>
                    {baseToken.symbol === bt.symbol && (
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Modal */}
      <AnimatePresence>
        {quoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setQuoteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-surface border border-border3 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border3">
                <span className="text-sm font-medium text-white/80">Swap Quote</span>
                <button
                  onClick={() => setQuoteModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Amount Input */}
                <div>
                  <div className="text-[11px] text-white/40 mb-1.5">Amount</div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                    <input
                      type="text"
                      value={quoteAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <img
                        src={tab === "Buy" ? baseToken.logo : (token.logo ?? "")}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-[12px] font-medium text-white/70">
                        {tab === "Buy" ? baseToken.symbol : token.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <span className="text-[12px] text-white/40">Fetching best route…</span>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div className="text-center py-4">
                    <p className="text-[13px] text-red-400">{error}</p>
                    <button
                      onClick={() => fetchQuote(quoteAmount)}
                      className="mt-2 text-[12px] text-accent hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Quote Result */}
                {quote && !loading && !error && (
                  <>
                    {/* You Pay / You Receive */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                        <span className="text-[11px] text-white/40">You pay</span>
                        <span className="text-sm font-medium text-white/90">
                          {formatTokenAmount(quote.fromTokenAmount, Number(quote.fromToken.decimal))} {quote.fromToken.tokenSymbol}
                          {quote.fromToken.tokenUnitPrice && (
                            <span className="text-[11px] text-white/30 ml-1.5">
                              (~${(Number(quote.fromTokenAmount) / Math.pow(10, Number(quote.fromToken.decimal)) * Number(quote.fromToken.tokenUnitPrice)).toFixed(2)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                        <span className="text-[11px] text-white/40">You receive</span>
                        <span className="text-sm font-medium text-white/90">
                          {formatTokenAmount(quote.toTokenAmount, Number(quote.toToken.decimal))} {quote.toToken.tokenSymbol}
                          {quote.toToken.tokenUnitPrice && (
                            <span className="text-[11px] text-white/30 ml-1.5">
                              (~${(Number(quote.toTokenAmount) / Math.pow(10, Number(quote.toToken.decimal)) * Number(quote.toToken.tokenUnitPrice)).toFixed(2)})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-white/30">Price Impact</span>
                        <span className="text-white/50">{quote.priceImpactPercent}%</span>
                      </div>
                      {/* <div className="flex justify-between">
                        <span className="text-white/30">Est. Gas Fee</span>
                        <span className="text-white/50">{quote.estimateGasFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/30">Trade Fee</span>
                        <span className="text-white/50">${quote.tradeFee}</span>
                      </div> */}
                    </div>

                    {/* DEX Route */}
                    <div>
                      <div className="text-[11px] text-white/30 mb-1.5">Route</div>
                      <RouteVisualization quote={quote} />
                    </div>

                    {/* Action Button */}
                    {amountEdited ? (
                      <button
                        onClick={handleRefetch}
                        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Refetch Quote
                      </button>
                    ) : (
                      <button
                        onClick={handleSwap}
                        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                      >
                        Swap <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
