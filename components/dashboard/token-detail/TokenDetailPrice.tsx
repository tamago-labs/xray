"use client";

import type { Token, Asset } from "@/lib/types/token";
import PriceChart from "../PriceChart";
import XLayerPriceChart from "../XLayerPriceChart";

export default function TokenDetailPrice({ token, asset }: { token: Token; asset: Asset }) {
  const hasXLayer = !!(token.contractAddress as any)?.xlayer;
  if (hasXLayer) {
    return <XLayerPriceChart token={token} asset={asset} />;
  }
  return <PriceChart token={token} />;
}
