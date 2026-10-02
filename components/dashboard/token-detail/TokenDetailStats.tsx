import type { Token, Asset } from "@/lib/types/token";
import { usePrices } from "@/app/contexts/PriceContext";
import { formatNumber } from "@/lib/utils/format";
import StatCard from "../StatCard";

export default function TokenDetailStats({ token, price, asset }: { token: Token; price: import("@/app/contexts/PriceContext").PriceData | undefined; asset: Asset }) {
  const { getStockPrice } = usePrices();
  const hasXLayer = !!(token.contractAddress as any)?.xlayer;
  const stockPrice = asset.symbol ? getStockPrice(asset.symbol) : null;
  const wrappedPrice = price?.price ?? null;

  if (hasXLayer) {
    const premium = wrappedPrice && stockPrice ? ((wrappedPrice - stockPrice) / stockPrice) * 100 : null;
    return (
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={`${token.symbol} Price`} value={formatNumber(wrappedPrice, "$")} />
        <StatCard label={`${asset.symbol} Price`} value={formatNumber(stockPrice, "$")} />
        <StatCard
          label="Premium"
          value={premium !== null ? `${premium >= 0 ? "+" : ""}${premium.toFixed(2)}%` : "—"}
          valueColor={premium !== null ? (premium >= 0 ? "text-red-400" : "text-emerald-400") : undefined}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Issuer" value={token.issuer_name ?? "—"} />
      <StatCard label="Market Cap" value={formatNumber(price?.market_cap ?? null, "$")} />
      <StatCard label="Volume (24h)" value={formatNumber(price?.volume_24h ?? null, "$")} />
    </div>
  );
}
