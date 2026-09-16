import type { Token, Asset } from "@/lib/types/token";
import type { PriceData } from "@/app/contexts/PriceContext";
import CopyButton from "../CopyButton";
import { formatNumber } from "@/lib/utils/format";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

export default function TokenDetailInfo({ token, asset, price }: { token: Token; asset: Asset; price: PriceData | undefined }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white/70 mb-4">Token Details</h2>
      <div className="grid grid-cols-1 gap-4 text-sm">
        <div className="space-y-3">
          <DetailRow label="Full Name" value={token.name} />
          <DetailRow label="Symbol" value={token.symbol} />
          <DetailRow label="Issuer" value={token.issuer_name} />
        </div>
        <div className="space-y-3">
          <DetailRow label="Blockchain" value="Solana" />
          <DetailRow label="Decimals" value={token.decimals != null ? String(token.decimals) : "—"} />
          <DetailRow label="Circulating Supply" value={price?.circulating_supply != null ? price.circulating_supply.toLocaleString() : "—"} />
          <DetailRow label="Total Supply" value={price?.total_supply != null ? price.total_supply.toLocaleString() : "—"} />
          <DetailRow label="Market Cap" value={price?.market_cap != null ? formatNumber(price.market_cap, "$") : "—"} />
          <DetailRow label="Verified" value={token.verified ? "Yes" : "No"} />
          <DetailRow label="Date Added" value={token.date_added ? new Date(token.date_added).toLocaleDateString() : "—"} />
          <div className="flex items-center justify-between">
            <span className="text-white/40">Mint Address</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-white/70 text-xs">
                {token.mint ? `${token.mint.slice(0, 8)}...${token.mint.slice(-6)}` : "—"}
              </span>
              {token.mint && <CopyButton text={token.mint} />}
            </div>
          </div>
        </div>
      </div>

      {token.tags && token.tags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-1.5">
            {token.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
