'use client';

import { useMemo } from 'react';
import type { Position } from '@/hooks/usePreIpoContract';

interface PositionsTableProps {
  position: Position | null;
  unrealizedPnL: bigint;
  markPrice: bigint;
  loading: boolean;
  onClosePosition: () => void;
  txPending: boolean;
}

export default function PositionsTable({
  position,
  unrealizedPnL,
  markPrice,
  loading,
  onClosePosition,
  txPending,
}: PositionsTableProps) {
  const pnlNum = useMemo(() => {
    const raw = Number(unrealizedPnL);
    const sign = raw >= 0 ? 1 : -1;
    const absValBigInt = raw >= 0 ? unrealizedPnL : -unrealizedPnL;
    const intPart = Number(absValBigInt / BigInt(1e18));
    const fracPart = Number(absValBigInt % BigInt(1e18)) / 1e18;
    return sign * (intPart + fracPart);
  }, [unrealizedPnL]);

  if (loading) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!position || position.size === BigInt(0)) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5">
        <p className="text-[13px] text-white/40 text-center py-4">No open positions</p>
      </div>
    );
  }

  const isLong = position.side === 1;
  const sizeNum = Number(position.size) / 1e18;
  const entryPrice = position.entryValue > BigInt(0) && position.size > BigInt(0)
    ? Number(position.entryValue) / Number(position.size) / 1e18
    : 0;
  const markPriceNum = Number(markPrice) / 1e18;
  const pnlIsPositive = pnlNum >= 0;

  const pnlPercent = entryPrice > 0
    ? isLong
      ? ((markPriceNum - entryPrice) / entryPrice) * 100
      : ((entryPrice - markPriceNum) / entryPrice) * 100
    : 0;

  return (
    <div className="bg-surface border border-border3/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border3/30">
        <h3 className="text-[13px] font-medium text-white/70">Your Positions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-white/30 border-b border-border3/20">
              <th className="text-left px-4 py-2 font-medium">Side</th>
              <th className="text-right px-4 py-2 font-medium">Size</th>
              <th className="text-right px-4 py-2 font-medium">Entry</th>
              <th className="text-right px-4 py-2 font-medium">Mark</th>
              <th className="text-right px-4 py-2 font-medium">PnL</th>
              <th className="text-right px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border3/10 hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isLong ? 'bg-accent2/15 text-accent2' : 'bg-warn2/15 text-warn2'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLong ? 'bg-accent2' : 'bg-warn2'}`} />
                  {isLong ? 'LONG' : 'SHORT'}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-white/80">{sizeNum.toFixed(4)}</td>
              <td className="px-4 py-3 text-right text-white/60">${entryPrice.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-white/60">${markPriceNum.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">
                <div className={`font-medium ${pnlIsPositive ? 'text-accent2' : 'text-warn2'}`}>
                  {pnlIsPositive ? '+' : ''}${pnlNum.toFixed(2)}
                </div>
                <div className={`text-[10px] ${pnlIsPositive ? 'text-accent2/60' : 'text-warn2/60'}`}>
                  {pnlIsPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={onClosePosition}
                  disabled={txPending}
                  className="px-3 py-1.5 rounded-md bg-warn2/10 text-warn2 text-[11px] font-medium hover:bg-warn2/20 disabled:opacity-40 transition-colors"
                >
                  {txPending ? '...' : 'Close'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
