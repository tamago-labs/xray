import type { Token, Asset } from "@/lib/types/token";
import { Clock, Sparkles, Package } from "lucide-react";

export default function TokenDetailHeader({ token, asset }: { token: Token; asset: Asset }) {
  const show247 = (token as any).trade_247;
  const showXPoints = (token as any).earn_xpoints;
  const isWrapped = token.name?.toLowerCase().includes("wrapped");

  return (
    <div className="flex items-start gap-4">
      {token.logo ? (
        <img src={token.logo} alt="" className="w-14 h-14 rounded-2xl" />
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-bold text-white/40">
          {token.symbol.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-display font-bold text-white/95">{asset.name} ({asset.symbol})</h1>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {show247 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zenblue text-[11px] font-semibold text-white cursor-default" title="Trade 24/7 — no market hours, no restrictions">
                <Clock className="w-3 h-3" />
                24/7
              </span>
            )}
          {showXPoints && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent2 text-[11px] font-semibold text-white cursor-default" title="Earn xPoints from xStocks by holding ths token">
              <Sparkles className="w-3 h-3" />
              xPoints
            </span>
          )}
          {isWrapped && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zenblue text-[11px] font-semibold text-white cursor-default" title="This is xStocks wrapped token use it for temporary holding or for DeFI">
              <Package className="w-3 h-3" />
              Wrapped
            </span>
          )}
          </div>
        </div>
        <p className="text-sm text-white/40 mt-1">
          {asset.website ? (
            <a href={asset.website} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              {asset.website}
            </a>
          ) : (
            asset.name
          )}
          {asset.industry && <span className="text-white/30"> · {asset.industry}</span>}
          {asset.employees && <span className="text-white/30"> · {asset.employees.toLocaleString()} employees</span>}
          {asset.exchange && <span className="text-white/30"> · {asset.exchange}</span>}
        </p>
      </div>
    </div>
  );
}
