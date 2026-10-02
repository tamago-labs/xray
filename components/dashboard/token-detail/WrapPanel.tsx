"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Token, Asset } from "@/lib/types/token";
import { ArrowRight, X, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { useWallet } from "@/components/app/WalletContext";
import { formatUnits, parseUnits } from "ethers";

const ERC4626_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
  "function previewDeposit(uint256 assets) view returns (uint256 shares)",
  "function previewRedeem(uint256 shares) view returns (uint256 assets)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function asset() view returns (address)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

type WrapTab = "Wrap" | "Unwrap";

export default function WrapPanel({ token, asset }: { token: Token; asset: Asset }) {
  const { address, provider } = useWallet();
  const [tab, setTab] = useState<WrapTab>("Wrap");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [wrapStatus, setWrapStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState("");


  const isWrapped = token.name?.toLowerCase().includes("wrapped");
  const tokenXlayerAddr = (token.contractAddress as any)?.xlayer;
  const tokenDecimals = token.decimals ?? 18;

  // Find the counterpart token (underlying if wrapped, wrapped if not)
  const counterpartToken = asset.tokens?.find((t) => {
    if (isWrapped) {
      // Current is wrapped, find the non-wrapped version
      return t.symbol === token.symbol.replace(/^w/i, "") && (t.contractAddress as any)?.xlayer;
    } else {
      // Current is non-wrapped, find the wrapped version
      return t.symbol === `w${token.symbol}` && (t.contractAddress as any)?.xlayer;
    }
  });
  const counterpartAddr = (counterpartToken?.contractAddress as any)?.xlayer;
  const counterpartDecimals = counterpartToken?.decimals ?? 18;
  const counterpartSymbol = counterpartToken?.symbol ?? "";

  useEffect(() => {
    if (!address || !provider || !tokenXlayerAddr) { setBalance(null); return; }
    const addr = tab === "Wrap" ? counterpartAddr : tokenXlayerAddr;
    const decimals = tab === "Wrap" ? counterpartDecimals : tokenDecimals;
    if (!addr) { setBalance(null); return; }

    (async () => {
      try {
        const ethers = await import("ethers");
        const contract = new ethers.Contract(addr, ERC20_ABI, provider);
        const bal = await contract.balanceOf(address);
        setBalance(formatUnits(bal, decimals));
      } catch {
        setBalance(null);
      }
    })();
  }, [address, provider, tab, tokenXlayerAddr, counterpartAddr, tokenDecimals, counterpartDecimals]);



  async function handleWrap() {
    if (!amount || !provider || !address || !tokenXlayerAddr || !counterpartAddr) return;
    setLoading(true);
    setError("");
    setWrapStatus("processing");

    try {
      const ethers = await import("ethers");
      const signer = await provider.getSigner();

      // Approve underlying token spending
      const tokenContract = new ethers.Contract(counterpartAddr, ERC20_ABI, signer);
      const rawAmount = parseUnits(amount, counterpartDecimals);
      const approveTx = await tokenContract.approve(tokenXlayerAddr, rawAmount);
      await approveTx.wait();

      // Deposit into vault
      const vault = new ethers.Contract(tokenXlayerAddr, ERC4626_ABI, signer);
      const tx = await vault.deposit(rawAmount, address);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        setTxHash(receipt.hash);
        setWrapStatus("success");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      setError(err.message ?? "Wrap failed");
      setWrapStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnwrap() {
    if (!amount || !provider || !address || !tokenXlayerAddr) return;
    setLoading(true);
    setError("");
    setWrapStatus("processing");

    try {
      const ethers = await import("ethers");
      const signer = await provider.getSigner();
      const rawAmount = parseUnits(amount, tokenDecimals);

      // Redeem shares
      const vault = new ethers.Contract(tokenXlayerAddr, ERC4626_ABI, signer);
      const tx = await vault.redeem(rawAmount, address, address);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        setTxHash(receipt.hash);
        setWrapStatus("success");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      setError(err.message ?? "Unwrap failed");
      setWrapStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  function resetWrap() {
    setWrapStatus("idle");
    setTxHash("");
    setError("");
  }

  const inputToken = tab === "Wrap" ? counterpartToken : token;
  const inputSymbol = tab === "Wrap" ? counterpartSymbol : token.symbol;
  const inputLogo = tab === "Wrap" ? counterpartToken?.logo : token.logo;
  const outputSymbol = tab === "Wrap" ? token.symbol : counterpartSymbol;
  const inputBalance = balance;

  // Find main (non-wrapped) token for trade link
  const mainToken = isWrapped
    ? asset.tokens?.find((t) => t.symbol === token.symbol.replace(/^w/i, "") && (t.contractAddress as any)?.xlayer)
    : null;
  const mainTokenLink = mainToken
    ? `/dashboard/token/${asset.slug}/${mainToken.crypto_id}`
    : null;
  const mainTokenSymbol = mainToken?.symbol ?? token.symbol.replace(/^w/i, "");

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex gap-1 mb-4">
        {(["Wrap", "Unwrap"] as WrapTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative ${
              tab === t ? "text-white" : "text-white/30 hover:text-white/50"
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
        <div className="text-[11px] text-white/40">{tab === "Wrap" ? "You deposit" : "You unwrap"}</div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {inputLogo ? (
              <img src={inputLogo} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                {inputSymbol.slice(0, 2)}
              </div>
            )}
            <span className="text-[12px] font-medium text-white/70">{inputSymbol}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <div className="text-[11px] text-white/40 mb-3 flex items-center justify-between">
          <span>
            {inputBalance !== null ? (
              <>Balance: <span className="text-white/60">{Number(inputBalance).toFixed(4)} {inputSymbol}</span></>
            ) : (
              <span className="text-white/20">—</span>
            )}
          </span>
          {mainTokenLink && (
            <Link href={mainTokenLink} className="text-accent hover:underline">
              Trade {mainTokenSymbol} →
            </Link>
          )}
        </div>



        {error && (
          <div className="text-[12px] text-red-400 mb-3 text-center">{error}</div>
        )}

        {wrapStatus === "success" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
              <span>{tab === "Wrap" ? "Wrapped" : "Unwrapped"} successfully</span>
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
              onClick={() => { resetWrap(); setAmount(""); }}
              className="w-full py-2 rounded-xl bg-white/[0.06] text-[12px] text-white/60 hover:text-white/80 transition-colors"
            >
              Close
            </button>
          </div>
        ) : wrapStatus === "processing" ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white flex items-center justify-center gap-2 opacity-80"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
          </button>
        ) : (
          <button
            onClick={tab === "Wrap" ? handleWrap : handleUnwrap}
            disabled={!amount || Number(amount) <= 0 || loading || !provider}
            className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!provider ? "Connect Wallet" : tab} <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {wrapStatus === "failed" && error && (
          <div className="text-center mt-2">
            <button
              onClick={resetWrap}
              className="text-[11px] text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        <p className="text-[10px] text-white/20 text-center mt-3">
          You can also wrap and unwrap on the{" "}
          <a href="https://defi.xstocks.fi/wrap" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            xStocks DeFi Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
