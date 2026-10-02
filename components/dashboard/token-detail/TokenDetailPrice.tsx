"use client";

import type { Token } from "@/lib/types/token";
import PriceChart from "../PriceChart";

export default function TokenDetailPrice({ token }: { token: Token }) {
  const hasXLayer = !!(token.contractAddress as any)?.xlayer;
  if (hasXLayer) return null;
  return <PriceChart token={token} />;
}
