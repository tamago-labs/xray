'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import listData from '@/lib/data/rwa-v1-list.json';

const BASE_TOKENS: Record<string, { contractAddress: string; decimals: number }> = {
  USDG: { contractAddress: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8", decimals: 6 },
  USDT: { contractAddress: "0x779ded0c9e1022225f8e0630b35a9b54be713736", decimals: 6 },
  USDC: { contractAddress: "0xb6ceceab302e2e4948951ee7843fc24e92933061", decimals: 6 },
  ETH: { contractAddress: "0xe7b000003a45145decf8a28fc755ad5ec5ea025a", decimals: 18 },
  SOL: { contractAddress: "0x505000008de8748dbd4422ff4687a4fc9beba15b", decimals: 9 },
  OKB: { contractAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
};

function getTokenBySymbol(symbol: string): { contractAddress: string; decimals: number } | null {
  const sym = symbol.toUpperCase();
  const base = BASE_TOKENS[sym];
  if (base) return base;
  for (const asset of (listData as any).assets) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol.toUpperCase() === sym) {
        return { contractAddress: token.contractAddress ?? '', decimals: token.decimals ?? 18 };
      }
    }
    if (asset.symbol.toUpperCase() === sym) {
      const firstToken = asset.tokens?.[0];
      return { contractAddress: firstToken?.contractAddress ?? '', decimals: firstToken?.decimals ?? 18 };
    }
  }
  return null;
}

export interface TradeData {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  estimatedOutput: number;
  price: number;
  priceImpact: string;
  route: string[];
  status?: string;
  createdAt?: string;
  signature?: string;
}

interface TradeBoxProps {
  trade: TradeData;
  onExecuted: (signature: string) => void;
  onError: (msg: string) => void;
  onCancel: () => void;
  provider: any;
  address: string | null;
}

export default function TradeBox({ trade, onExecuted, onError, onCancel, provider, address }: TradeBoxProps) {
  const [executing, setExecuting] = useState(false);

  const handleConfirm = async () => {
    console.log("[TradeBox] confirm clicked", { provider: !!provider, address, trade });
    if (!provider || !address) {
      onError('Wallet not connected');
      return;
    }
    setExecuting(true);

    try {
      const fromToken = getTokenBySymbol(trade.tokenIn);
      const toToken = getTokenBySymbol(trade.tokenOut);
      console.log("[TradeBox] tokens:", fromToken, toToken);

      if (!fromToken || !toToken) {
        onError('Unknown token');
        setExecuting(false);
        return;
      }

      const fromAddr = fromToken.contractAddress;
      const toAddr = toToken.contractAddress;
      const decimals = fromToken.decimals;
      const rawAmount = Math.round(trade.amountIn * Math.pow(10, decimals)).toString();

      const params = new URLSearchParams({
        fromTokenAddress: fromAddr,
        toTokenAddress: toAddr,
        amount: rawAmount,
        userWalletAddress: address,
        slippagePercent: '0.5',
      });

      console.log("[TradeBox] fetching swap", `/api/swap?${params}`);
      const res = await fetch(`/api/swap?${params}`);
      const json = await res.json();
      console.log("[TradeBox] swap response", json);

      if (!res.ok || json.error) {
        onError(json.error ?? 'Failed to get swap data');
        setExecuting(false);
        return;
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

      console.log("[TradeBox] sending tx");
      const tx = await signer.sendTransaction({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0x0',
        gasLimit: swapData.tx.gas ? BigInt(swapData.tx.gas) : undefined,
      });

      const receipt = await tx.wait();
      console.log("[TradeBox] receipt", receipt?.status);

      if (receipt?.status === 1) {
        onExecuted(receipt.hash);
      } else {
        onError('Transaction failed');
      }
    } catch (err: any) {
      console.error("[TradeBox] error:", err);
      onError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border3/50 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">Trade</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-[11px] text-white/40 mb-0.5">You pay</p>
          <p className="text-[14px] font-medium text-white/90">{trade.amountIn} {trade.tokenIn}</p>
        </div>
        <div className="text-white/30 text-lg">→</div>
        <div className="text-center">
          <p className="text-[11px] text-white/40 mb-0.5">You receive</p>
          <p className="text-[14px] font-medium text-white/90">
            {trade.estimatedOutput?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? "—"} {trade.tokenOut}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/40 mb-3">
        <span>
          Price: {trade.price != null && trade.price < 1 ? trade.price.toFixed(6) : trade.price?.toFixed(2) ?? "—"} {trade.tokenOut}/{trade.tokenIn}
        </span>
        <span>Impact: {trade.priceImpact ?? "—"}%</span>
      </div>
      {trade.status === 'executed' && trade.signature ? (
        <div className="flex items-center gap-2 text-[12px] text-green-400">
          <span>Confirmed</span>
          <a
            href={`https://web3.okx.com/explorer/x-layer/tx/${trade.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : trade.status === 'cancelled' ? (
        <p className="text-[12px] text-white/40">Cancelled</p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={executing}
            className="flex-1 h-8 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {executing ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Executing…</> : 'Confirm'}
          </button>
          <button
            onClick={onCancel}
            disabled={executing}
            className="flex-1 h-8 rounded-lg bg-white/[0.05] text-white/60 text-[12px] font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
