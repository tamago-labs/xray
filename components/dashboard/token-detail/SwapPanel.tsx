"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Token, Asset } from "@/lib/types/token";
import { ArrowRight, ChevronDown, X, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { BASE_TOKENS, type BaseToken } from "@/lib/tokens/base-tokens";
import { formatTokenAmount } from "@/lib/utils/format";
import RouteVisualization from "./RouteVisualization";
import { useWallet } from "@/components/app/WalletContext";
import { formatUnits } from "ethers";

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
  const { address, provider } = useWallet();
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
  const [balance, setBalance] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<"idle" | "swapping" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (!address || !provider) { setBalance(null); return; }
    const tokenAddr = tab === "Buy" ? baseToken.address : token.contractAddress;
    const decimals = tab === "Buy" ? baseToken.decimals : token.decimals ?? 18;
    if (!tokenAddr) { setBalance(null); return; }

    const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
    const isNative = tokenAddr === "0x0000000000000000000000000000000000000000" || tokenAddr === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    (async () => {
      try {
        if (isNative) {
          const bal = await provider.getBalance(address);
          setBalance(formatUnits(bal, decimals));
        } else {
          const contract = new (await import("ethers")).Contract(tokenAddr, erc20Abi, provider);
          const bal = await contract.balanceOf(address);
          setBalance(formatUnits(bal, decimals));
        }
      } catch {
        setBalance(null);
      }
    })();
  }, [address, provider, tab, baseToken.address, token.contractAddress]);

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

  function resetSwap() {
    setSwapStatus("idle");
    setTxHash("");
    setError("");
  }

  async function handleSwap() {
    if (!quote || !quoteAmount || !provider || !address) return;

    const decimals = tab === "Buy" ? baseToken.decimals : token.decimals ?? 18;
    const rawAmount = (Number(quoteAmount) * Math.pow(10, decimals)).toString();
    const fromAddr = tab === "Buy" ? baseToken.address : (token.contractAddress ?? "");
    const toAddr = tab === "Buy" ? (token.contractAddress ?? "") : baseToken.address;

    setSwapStatus("swapping");
    setTxHash("");
    setError("");

    try {
      const params = new URLSearchParams({
        fromTokenAddress: fromAddr,
        toTokenAddress: toAddr,
        amount: rawAmount,
        userWalletAddress: address,
        slippagePercent: "0.5",
      });
      const res = await fetch(`/api/swap?${params}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to get swap data");
      }

      const signer = await provider.getSigner();
      const swapData = json.swap;

      if (swapData.signatureData && swapData.signatureData.length > 0) {
        for (const sig of swapData.signatureData) {
          const approveTx = await signer.sendTransaction({
            to: sig.approveContract ?? swapData.tx.to,
            data: sig.approveTxCalldata ?? swapData.tx.data,
          });
          await approveTx.wait();
        }
      }

      const tx = await signer.sendTransaction({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || "0x0",
        gasLimit: swapData.tx.gas ? BigInt(swapData.tx.gas) : undefined,
      });

      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        setTxHash(receipt.hash);
        setSwapStatus("success");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("[swap] error:", err?.message);
      setError(err.message ?? "Swap failed");
      setSwapStatus("failed");
    }
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
          {tab === "Buy" ? (
            <button
              onClick={() => setTokenModalOpen(true)}
              className="flex items-center gap-1.5 shrink-0 bg-white/[0.06] px-2 py-1 rounded-lg hover:bg-white/[0.1] transition-colors"
            >
              <img src={baseToken.logo} alt={baseToken.symbol} className="w-4 h-4 rounded-full" />
              <span className="text-[12px] font-medium text-white/70">{baseToken.symbol}</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0 bg-white/[0.06] px-2 py-1 rounded-lg">
              {token.logo ? (
                <img src={token.logo} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              <span className="text-[12px] font-medium text-white/70">{token.symbol}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <div className="text-[11px] text-white/40 mb-3">
          {balance !== null ? (
            <span>Balance: <span className="text-white/60">{Number(balance).toFixed(4)} {tab === "Buy" ? baseToken.symbol : token.symbol}</span></span>
          ) : (
            <span className="text-white/20">—</span>
          )}
        </div>
        <button
          onClick={handleGetQuote}
          disabled={!fromAmount || Number(fromAmount) <= 0}
          className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Get Quote <ArrowRight className="w-4 h-4" />
        </button>
        <div className="text-[10px] text-white/25 text-center mt-2 flex items-center justify-center gap-1">
          Best price via{" "}
          <img src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png" alt="OKX" className="w-3 h-3 rounded-full" />{" "}
          OKX DEX Router
        </div>
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
                <span className="text-sm font-medium text-white/80">
                  {tab === "Buy" ? "Select token to pay" : "Select token to receive"}
                </span>
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
                            src={tab === "Buy" ? baseToken.logo : (token.logo || "")}
                            alt=""
                            className="w-4 h-4 rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
                        <span className="text-[11px] text-white/40">{tab === "Buy" ? "You pay" : "You sell"}</span>
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
                        <span className="text-[11px] text-white/40">{tab === "Buy" ? "You receive" : "You get"}</span>
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
                        {(() => {
                          const absImpact = Math.abs(Number(quote.priceImpactPercent));
                          let color = "#34d399";
                          if (absImpact > 3) color = "#f87171";
                          else if (absImpact > 1) color = "#facc15";
                          return <span style={{ color }}>{Math.abs(Number(quote.priceImpactPercent)).toFixed(2)}%</span>;
                        })()}
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
                    {swapStatus === "success" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[12px] text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                          <span>Swap confirmed</span>
                          <a
                            href={`https://web3.okx.com/explorer/x-layer/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <button
                          onClick={() => { setQuoteModalOpen(false); resetSwap(); }}
                          className="w-full py-2 rounded-xl bg-white/[0.06] text-[12px] text-white/60 hover:text-white/80 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    ) : swapStatus === "swapping" ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white flex items-center justify-center gap-2 opacity-80"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" /> Swapping…
                      </button>
                    ) : amountEdited ? (
                      <button
                        onClick={handleRefetch}
                        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Refetch Quote
                      </button>
                    ) : (
                      <button
                        onClick={handleSwap}
                        disabled={!provider}
                        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {!provider ? "Connect Wallet" : "Swap"} <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {swapStatus === "failed" && error && (
                      <div className="text-center mt-2">
                        <p className="text-[12px] text-red-400">{error}</p>
                        <button
                          onClick={resetSwap}
                          className="mt-1 text-[11px] text-accent hover:underline"
                        >
                          Try again
                        </button>
                      </div>
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
