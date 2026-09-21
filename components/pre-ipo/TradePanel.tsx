'use client';

import { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useWallet } from '@/components/app/WalletContext';
import { SIDE } from '@/lib/pre-ipo/contracts';

interface TradePanelProps {
  markPrice: number;
  collateralSymbol: string;
  initialMarginRate: bigint;
  onOpenPosition: (signer: ethers.Signer, side: 'long' | 'short', size: bigint) => Promise<string>;
  getExecutionPrice: (side: 'long' | 'short', size: bigint) => Promise<number>;
  hasPosition: boolean;
  loading: boolean;
  status: number;
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5];

export default function TradePanel({
  markPrice,
  collateralSymbol,
  initialMarginRate,
  onOpenPosition,
  getExecutionPrice,
  hasPosition,
  loading,
  status,
}: TradePanelProps) {
  const [executionPrice, setExecutionPrice] = useState<number | null>(null);
  const [slippage, setSlippage] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const { isConnected, signer, isCorrectChain, switchChain } = useWallet();
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [sizeInput, setSizeInput] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const markPriceNum = markPrice;

  const marginRate = useMemo(() => {
    return Number(initialMarginRate) / 1e18;
  }, [initialMarginRate]);

  const sizeNum = parseFloat(sizeInput) || 0;
  const notionalValue = sizeNum * markPriceNum;
  const requiredMargin = notionalValue * marginRate;

  useEffect(() => {
    if (sizeNum > 0 && markPriceNum > 0) {
      setPriceLoading(true);
      const size = ethers.parseUnits(sizeInput, 18);
      getExecutionPrice(side, size)
        .then((price) => {
          setExecutionPrice(price);
          setSlippage(((price - markPriceNum) / markPriceNum) * 100);
        })
        .catch(() => {
          setExecutionPrice(null);
          setSlippage(null);
        })
        .finally(() => setPriceLoading(false));
    } else {
      setExecutionPrice(null);
      setSlippage(null);
    }
  }, [sizeInput, sizeNum, side, markPriceNum, getExecutionPrice]);

  const handleOpenPosition = async () => {
    if (!sizeInput || !signer) return;
    setTxPending(true);
    setTxError(null);
    try {
      const size = ethers.parseUnits(sizeInput, 18);
      await onOpenPosition(signer, side, size);
      setSizeInput('');
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Open position failed');
    } finally {
      setTxPending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-[13px] text-white/50 text-center py-8">Connect wallet to trade</p>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-[13px] text-white/50 text-center mb-3">Wrong network</p>
        <button
          onClick={() => switchChain(1952)}
          className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors"
        >
          Switch to X Layer Testnet
        </button>
      </div>
    );
  }

  if (status === 2) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-[13px] text-white/50 text-center py-4">Market settled — trading closed</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-4">
      <div className="flex gap-1">
        {(['long', 'short'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative ${
              side === s
                ? 'text-white'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            {side === s && (
              <motion.div
                layoutId="side-active-tab"
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{s === 'long' ? 'Long' : 'Short'}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="text-[11px] text-white/40 mb-2">Size (units)</div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <input
            type="text"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
          />
        </div>
      </div>

      <div>
        <div className="text-[11px] text-white/40 mb-2">Leverage</div>
        <div className="flex gap-1">
          {LEVERAGE_OPTIONS.map((lev) => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                leverage === lev
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/60'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      {hasPosition && (
        <div className="bg-warn2/10 border border-warn2/20 rounded-xl p-3">
          <p className="text-[12px] text-warn2/80">
            You have an open position. Close it before opening a new one.
          </p>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Mark Price</span>
          <span className="text-white/80">${markPriceNum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Notional</span>
          <span className="text-white/80">${notionalValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Required Margin</span>
          <span className="text-white/80">
            {requiredMargin.toFixed(2)} {collateralSymbol}
          </span>
        </div>
      </div>

      {priceLoading ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center gap-2 text-[12px] text-white/40">
            <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            Fetching price...
          </div>
        </div>
      ) : executionPrice !== null ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-white/40">Est. Price</span>
            <span className="text-white/80">${executionPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-white/40">Slippage</span>
            <span className={`font-medium ${Math.abs(slippage ?? 0) > 2 ? 'text-warn2' : Math.abs(slippage ?? 0) > 1 ? 'text-yellow-400' : 'text-accent2'}`}>
              {slippage !== null && slippage >= 0 ? '+' : ''}{slippage?.toFixed(4)}%
            </span>
          </div>
        </div>
      ) : null}

      <button
        onClick={handleOpenPosition}
        disabled={txPending || !sizeInput || sizeNum <= 0}
        className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {txPending ? 'Processing...' : `Open ${side === 'long' ? 'Long' : 'Short'}`}
      </button>

      {txError && (
        <p className="text-[11px] text-warn2/80 break-all">{txError}</p>
      )}
    </div>
  );
}
