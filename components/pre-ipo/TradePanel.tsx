'use client';

import { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/components/app/WalletContext';
import { SIDE } from '@/lib/pre-ipo/contracts';

interface TradePanelProps {
  perpetualAddress: string;
  collateralAddress: string;
  markPrice: bigint;
  collateralDecimals: number;
  collateralSymbol: string;
  initialMarginRate: bigint;
  hasPosition: boolean;
  onDeposit: (signer: ethers.Signer, amount: bigint) => Promise<string>;
  onOpenPosition: (signer: ethers.Signer, side: 'long' | 'short', size: bigint) => Promise<string>;
  onClosePosition: (signer: ethers.Signer) => Promise<string>;
  loading: boolean;
  status: number;
  position?: {
    collateral: bigint;
    side: number;
    size: bigint;
    entryValue: bigint;
  } | null;
  unrealizedPnL?: bigint;
  deposits?: bigint;
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10];

export default function TradePanel({
  markPrice,
  collateralDecimals,
  collateralSymbol,
  initialMarginRate,
  hasPosition,
  onDeposit,
  onOpenPosition,
  onClosePosition,
  loading,
  status,
  position,
  unrealizedPnL,
  deposits,
}: TradePanelProps) {
  const { isConnected, address, signer, isCorrectChain, switchChain } = useWallet();
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [sizeInput, setSizeInput] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [depositInput, setDepositInput] = useState('');
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const markPriceNum = useMemo(() => {
    return Number(markPrice) / 1e18;
  }, [markPrice]);

  const marginRate = useMemo(() => {
    return Number(initialMarginRate) / 1e18;
  }, [initialMarginRate]);

  const sizeNum = parseFloat(sizeInput) || 0;
  const notionalValue = sizeNum * markPriceNum;
  const requiredMargin = notionalValue * marginRate;

  const handleDeposit = async () => {
    if (!depositInput || !signer) return;
    setTxPending(true);
    setTxError(null);
    try {
      const amount = ethers.parseUnits(depositInput, collateralDecimals);
      await onDeposit(signer, amount);
      setDepositInput('');
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setTxPending(false);
    }
  };

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

  const handleClosePosition = async () => {
    if (!signer) return;
    setTxPending(true);
    setTxError(null);
    try {
      await onClosePosition(signer);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Close position failed');
    } finally {
      setTxPending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <p className="text-[13px] text-white/50 text-center py-8">Connect wallet to trade</p>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <p className="text-[13px] text-white/50 text-center mb-3">Wrong network</p>
        <button
          onClick={() => switchChain(1952)}
          className="w-full py-2.5 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors"
        >
          Switch to X Layer Testnet
        </button>
      </div>
    );
  }

  if (status === 2) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <p className="text-[13px] text-white/50 text-center py-4">Market settled — trading closed</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5 space-y-4">
      {hasPosition ? (
        <button
          onClick={handleClosePosition}
          disabled={txPending}
          className="w-full py-3 rounded-lg bg-warn2/20 text-warn2 text-[13px] font-medium hover:bg-warn2/30 disabled:opacity-40 transition-colors"
        >
          {txPending ? 'Processing...' : 'Close Position'}
        </button>
      ) : (
        <>
          <div className="flex gap-1">
            <button
              onClick={() => setSide('long')}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                side === 'long'
                  ? 'bg-accent2/20 text-accent2 border border-accent2/30'
                  : 'bg-white/5 text-white/50 hover:text-white/70'
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setSide('short')}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                side === 'short'
                  ? 'bg-warn2/20 text-warn2 border border-warn2/30'
                  : 'bg-white/5 text-white/50 hover:text-white/70'
              }`}
            >
              Short
            </button>
          </div>

          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-2">
              Size (units)
            </label>
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/5 border border-border3/50 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-2">
              Leverage
            </label>
            <div className="flex gap-1">
              {LEVERAGE_OPTIONS.map((lev) => (
                <button
                  key={lev}
                  onClick={() => setLeverage(lev)}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    leverage === lev
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-3 space-y-1.5">
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

          <button
            onClick={handleOpenPosition}
            disabled={txPending || !sizeInput || sizeNum <= 0}
            className={`w-full py-3 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40 ${
              side === 'long'
                ? 'bg-accent2/20 text-accent2 hover:bg-accent2/30'
                : 'bg-warn2/20 text-warn2 hover:bg-warn2/30'
            }`}
          >
            {txPending ? 'Processing...' : `Open ${side === 'long' ? 'Long' : 'Short'}`}
          </button>
        </>
      )}

      {txError && (
        <p className="text-[11px] text-warn2/80 break-all">{txError}</p>
      )}
    </div>
  );
}

