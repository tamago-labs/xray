'use client';

import { useMemo } from 'react';

interface AccountStatsProps {
  equity: bigint;
  deposits: bigint;
  marginRatio: bigint;
  maintenanceMargin: bigint;
  unrealizedPnL: bigint;
  hasPosition: boolean;
}

export default function AccountStats({
  equity,
  deposits,
  marginRatio,
  maintenanceMargin,
  unrealizedPnL,
  hasPosition,
}: AccountStatsProps) {
  const equityNum = Number(equity) / 1e18;
  const depositsNum = Number(deposits) / 1e18;
  const pnlNum = Number(unrealizedPnL) / 1e18;
  const maintMarginNum = Number(maintenanceMargin) / 1e18;

  const marginRatioPercent = hasPosition ? Number(marginRatio) / 1e18 : 0;

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
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Unrealized PnL</span>
          <span className={`font-medium ${pnlNum >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {pnlNum >= 0 ? '+' : ''}${pnlNum.toFixed(2)}
          </span>
        </div>
        {hasPosition && (
          <>
            <div className="border-t border-white/[0.06] pt-2.5" />
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Margin Ratio</span>
              <span className={`font-medium ${riskLevel.color}`}>
                {(marginRatioPercent * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Risk Level</span>
              <span className={`font-medium ${riskLevel.color}`}>
                {riskLevel.label}
              </span>
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
    </div>
  );
}
