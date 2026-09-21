'use client';

import { useMemo } from 'react';

function formatValuation(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

interface MarketStatsProps {
  equity: bigint;
  deposits: bigint;
  maintenanceMargin: bigint;
  poolMargin: bigint;
  poolPosition: bigint;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
  collateralSymbol: string;
  hasPosition: boolean;
  positionSize: bigint;
}

export default function MarketStats({
  equity,
  deposits,
  maintenanceMargin,
  poolMargin,
  poolPosition,
  markPrice,
  markValuation,
  impliedValuation,
  collateralSymbol,
  hasPosition,
  positionSize,
}: MarketStatsProps) {
  const collateralDecimals = 6;
  const decimals = Math.pow(10, collateralDecimals);
  const equityNum = Number(equity) / decimals;
  const depositsNum = Number(deposits) / decimals;
  const maintMarginNum = Number(maintenanceMargin) / decimals;
  const poolMarginNum = Number(poolMargin) / decimals;
  const poolPositionNum = Number(poolPosition) / 1e18;

  const sizeNum = Number(positionSize) / 1e18;
  const notionalValue = sizeNum * markPrice;
  const marginRatioPercent = hasPosition && notionalValue > 0
    ? equityNum / notionalValue
    : 0;

  const riskLevel = useMemo(() => {
    if (!hasPosition) return { label: 'None', color: 'text-white/30' };
    if (marginRatioPercent > 0.5) return { label: 'Low', color: 'text-accent2' };
    if (marginRatioPercent > 0.25) return { label: 'Medium', color: 'text-yellow-400' };
    if (marginRatioPercent > 0.15) return { label: 'High', color: 'text-orange-400' };
    return { label: 'Danger', color: 'text-warn2' };
  }, [hasPosition, marginRatioPercent]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <h3 className="text-[13px] font-medium text-white/70 mb-3">Account</h3>
      <div className="space-y-2.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Equity</span>
          <span className="text-white/80 font-medium">${equityNum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Deposits</span>
          <span className="text-white/60">${depositsNum.toFixed(2)}</span>
        </div>
        {hasPosition && (
          <>
            <div className="border-t border-white/[0.06] pt-2.5" />
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Your Margin Ratio</span>
              <span className={`font-medium ${riskLevel.color}`}>
                {(marginRatioPercent * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Risk</span>
              <span className={`font-medium ${riskLevel.color}`}>{riskLevel.label}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Liq. Threshold</span>
              <span className="text-white/60">${maintMarginNum.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    marginRatioPercent > 0.5 ? 'bg-accent2' :
                    marginRatioPercent > 0.25 ? 'bg-yellow-400' :
                    marginRatioPercent > 0.15 ? 'bg-orange-400' : 'bg-warn2'
                  }`}
                  style={{ width: `${Math.min(marginRatioPercent * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-white/[0.06] my-3" />

      <h3 className="text-[13px] font-medium text-white/70 mb-3">Pool</h3>
      <div className="space-y-2.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Liquidity</span>
          <span className="text-white/80 font-medium">
            ${poolMarginNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Net Position</span>
          <span className={`font-medium ${poolPositionNum >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {poolPositionNum >= 0 ? 'Short ' : 'Long '}{Math.abs(poolPositionNum).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Mark Valuation</span>
          <span className="text-white/60">{formatValuation(markValuation)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Implied Valuation</span>
          <span className="text-white/60">{formatValuation(impliedValuation)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Spread</span>
          <span className={`font-medium ${
            markValuation > 0 && impliedValuation > 0
              ? impliedValuation >= markValuation ? 'text-accent2' : 'text-warn2'
              : 'text-white/40'
          }`}>
            {markValuation > 0 && impliedValuation > 0
              ? `${impliedValuation >= markValuation ? '+' : ''}${(((impliedValuation - markValuation) / markValuation) * 100).toFixed(2)}%`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
