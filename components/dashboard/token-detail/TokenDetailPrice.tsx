"use client";

import type { Token } from "@/lib/types/token";
import PriceChart from "../PriceChart";

export default function TokenDetailPrice({ token }: { token: Token }) {
  return <PriceChart token={token} />;
}
