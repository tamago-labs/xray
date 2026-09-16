import type { Token } from "@/lib/types/token";
import type { PriceData } from "@/app/contexts/PriceContext";
import { formatNumber } from "@/lib/utils/format";
import StatCard from "../StatCard";

export default function TokenDetailStats({ token, price }: { token: Token; price: PriceData | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Issuer" value={token.issuer_name === "Backed Assets" ? "xStock" : "Ondo"} />
      <StatCard label="Market Cap" value={formatNumber(price?.market_cap ?? null, "$")} />
      <StatCard label="Volume (24h)" value={formatNumber(price?.volume_24h ?? null, "$")} />
    </div>
  );
}
