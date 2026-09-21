'use client';

import { useMemo } from 'react';
import type { Position } from '@/hooks/usePreIpoContract';

interface PositionCardProps {
  position: Position | null;
  unrealizedPnL: bigint;
  markPrice: bigint;
  entryPrice: number | null;
  loading: boolean;
}

export default function PositionCard({
  position,
  unrealizedPnL,
  entryPrice,
  loading,
}: PositionCardProps) {
  const pnlNum = useMemo(() => {
    const raw = Number(unrealizedPnL);
    const sign = raw >= 0 ? 1 : -1;
    const absValBigInt = raw >= 0 ? unrealizedPnL : -unrealizedPnL;
    const intPart = Number(absValBigInt / BigInt(1e18));
    const fracPart = Number(absValBigInt % BigInt(1e18)) / 1e18;
    return sign * (intPart + fracPart);
  }, [unrealizedPnL]);

  const pnlPercent = useMemo(() => {
    if (!position || entryPrice === null || entryPrice === 0) return 0;
    const currentPrice = entryPrice + pnlNum / (Number(position.size) / 1e18);
    return ((currentPrice - entryPrice) / entryPrice) * 100;
  }, [position, entryPrice, pnlNum]);

  if (loading) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!position || position.size === BigInt(0)) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <p className="text-[13px] text-white/40 text-center py-4">No open position</p>
      </div>
    );
  }

  const isLong = position.side === 0;
  const sizeNum = Number(position.size) / 1e18;
  const collateralNum = Number(position.collateral) / 1e6;
  const pnlIsPositive = pnlNum >= 0;

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/70">Position</span>
        <span
          className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
            isLong ? 'bg-accent2/15 text-accent2' : 'bg-warn2/15 text-warn2'
          }`}
        >
          {isLong ? 'LONG' : 'SHORT'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Size</span>
          <span className="text-white/80">{sizeNum.toFixed(4)} units</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Entry Price</span>
          <span className="text-white/80">
            {entryPrice !== null ? `$${entryPrice.toFixed(2)}` : '—'}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Collateral</span>
          <span className="text-white/80">${collateralNum.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-border3/30 pt-3">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-white/40">Unrealized PnL</span>
          <span
            className={`text-[15px] font-semibold ${
              pnlIsPositive ? 'text-accent2' : 'text-warn2'
            }`}
          >
            {pnlIsPositive ? '+' : ''}${pnlNum.toFixed(2)}
          </span>
        </div>
        <div className="text-[11px] text-right mt-0.5">
          <span className={pnlIsPositive ? 'text-accent2/60' : 'text-warn2/60'}>
            {pnlIsPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

