import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-api";
import type { Schema } from "../../../../data/resource";
import { getAssetMeta } from "./pre-ipo-config";

export const getPreIpoMarkets = tool({
  name: "get_pre_ipo_markets",
  description: "List all available pre-IPO perpetual markets with mark price, mark valuation, implied valuation, and 24h change.",
  parameters: z.object({}),
  execute: async () => {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const { data: snapshots } = await client.models.PreIpoSnapshot.list({
      filter: { markPrice: { gt: 0 } },
      limit: 1000,
    });

    if (!snapshots || snapshots.length === 0) {
      return JSON.stringify([]);
    }

    const bySymbol = new Map<string, typeof snapshots>();
    for (const s of snapshots) {
      if (!bySymbol.has(s.symbol)) bySymbol.set(s.symbol, []);
      bySymbol.get(s.symbol)!.push(s);
    }

    const markets = Array.from(bySymbol.entries()).map(([symbol, snaps]) => {
      const sorted = snaps.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
      const latest = sorted[sorted.length - 1];
      const first = sorted[0];
      const change24h = first.markPrice > 0
        ? Number(((latest.markPrice - first.markPrice) / first.markPrice * 100).toFixed(2))
        : 0;

      const meta = getAssetMeta(symbol);

      return {
        symbol,
        name: meta?.name ?? symbol,
        markPrice: latest.markPrice,
        markValuation: latest.markValuation,
        impliedValuation: latest.impliedValuation,
        change24h,
        industry: meta?.industry ?? "Technology",
      };
    });

    return JSON.stringify(markets);
  },
});
