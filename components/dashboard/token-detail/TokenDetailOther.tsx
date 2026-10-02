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

  const xLayerTokens = otherTokens.filter((t) => t.contractAddress && (t.contractAddress as any).xlayer);
  const otherChainTokens = otherTokens.filter((t) => !t.contractAddress || !(t.contractAddress as any).xlayer);

  const TokenCard = ({ token }: { token: Token }) => {
    const otPrice = prices.find((p) => p.token_symbol === token.symbol);
    return (
      <Link
        key={token.crypto_id}
        href={`/dashboard/token/${asset.slug}/${token.crypto_id}`}
        className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-colors"
      >
        {token.logo ? (
          <img src={token.logo} alt="" className="w-10 h-10 rounded-xl" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white/40">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{token.symbol}</p>
          <p className="text-xs text-white/40 truncate">{token.issuer_name}</p>
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
  };

  return (
    <div className="space-y-6">
      {xLayerTokens.length > 0 && (
        <div>
          <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Other {asset.symbol} on X Layer</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {xLayerTokens.map((ot) => (
              <TokenCard key={ot.crypto_id} token={ot} />
            ))}
          </div>
        </div>
      )}

      {otherChainTokens.length > 0 && (
        <div>
          <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">on All Chains</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {otherChainTokens.map((ot) => (
              <TokenCard key={ot.crypto_id} token={ot} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
