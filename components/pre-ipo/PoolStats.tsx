'use client';

interface PoolStatsProps {
  poolMargin: bigint;
  poolPosition: bigint;
  premium: bigint;
  collateralSymbol: string;
}

export default function PoolStats({
  poolMargin,
  poolPosition,
  premium,
  collateralSymbol,
}: PoolStatsProps) {
  const marginNum = Number(poolMargin) / 1e18;
  const positionNum = Number(poolPosition) / 1e18;
  const premiumNum = Number(premium) / 1e18;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <h3 className="text-[13px] font-medium text-white/70 mb-3">Pool</h3>
      <div className="space-y-2.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Pool Liquidity</span>
          <span className="text-white/80 font-medium">${marginNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {collateralSymbol}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Net Position</span>
          <span className={`font-medium ${positionNum >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {positionNum >= 0 ? 'Short ' : 'Long '}{Math.abs(positionNum).toFixed(2)} units
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-white/40">Premium</span>
          <span className={`font-medium ${premiumNum >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {premiumNum >= 0 ? '+' : ''}{(premiumNum * 100).toFixed(4)}%
          </span>
        </div>
      </div>
    </div>
  );
}
