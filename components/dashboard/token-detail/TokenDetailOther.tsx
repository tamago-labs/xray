"use client";

import Link from "next/link";
import type { Token, Asset } from "@/lib/types/token";
import type { PriceData } from "@/app/contexts/PriceContext";
import { formatPrice } from "@/lib/utils/format";

export default function TokenDetailOther({
  asset,
  otherTokens,
  prices,
}: {
  asset: Asset;
  otherTokens: Token[];
  prices: PriceData[];
}) {
  if (otherTokens.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-white/70 mb-3">Other {asset.symbol} Tokens</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {otherTokens.map((ot) => {
          const otPrice = prices.find((p) => p.token_symbol === ot.symbol);
          return (
            <Link
              key={ot.crypto_id}
              href={`/dashboard/token/${asset.slug}/${ot.crypto_id}`}
              className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {ot.logo ? (
                <img src={ot.logo} alt="" className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                  {ot.symbol.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80">{ot.symbol}</p>
                <p className="text-xs text-white/40 truncate">{ot.issuer_name === "Backed Assets" ? "xStock" : "Ondo"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white/70">{formatPrice(otPrice?.price ?? null)}</p>
                {otPrice?.percent_24h != null && (
                  <p className={`text-xs ${otPrice.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {otPrice.percent_24h >= 0 ? "+" : ""}{otPrice.percent_24h.toFixed(2)}%
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
