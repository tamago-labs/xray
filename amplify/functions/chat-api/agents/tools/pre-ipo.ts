import { tool } from "@openai/agents";
import { z } from "zod";

const mockPreIpoMarkets = [
  { symbol: "xSPX", name: "SpaceX", markPrice: 168.50, valuation: 180000000000, poolTvl: 2400000, utilization: 62, change24h: 3.2, sector: "Aerospace" },
  { symbol: "xOAI", name: "OpenAI", markPrice: 245.00, valuation: 150000000000, poolTvl: 1800000, utilization: 45, change24h: 5.7, sector: "AI" },
  { symbol: "xSTRP", name: "Stripe", markPrice: 82.30, valuation: 65000000000, poolTvl: 3100000, utilization: 71, change24h: -1.4, sector: "Fintech" },
  { symbol: "xDAT", name: "Databricks", markPrice: 38.90, valuation: 43000000000, poolTvl: 950000, utilization: 34, change24h: 0.9, sector: "Data" },
  { symbol: "xKOT", name: "Kraken", markPrice: 15.20, valuation: 12000000000, poolTvl: 520000, utilization: 28, change24h: -0.6, sector: "Crypto" },
  { symbol: "xFIG", name: "Figma", markPrice: 52.75, valuation: 14000000000, poolTvl: 780000, utilization: 41, change24h: 2.1, sector: "Technology" },
];

export const getPreIpoMarkets = tool({
  name: "get_pre_ipo_markets",
  description: "List all available pre-IPO perpetual markets with mark price, pool TVL, utilization, and 24h change.",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(mockPreIpoMarkets);
  },
});

export const getPreIpoMarketDetails = tool({
  name: "get_pre_ipo_market_details",
  description: "Get detailed info for a specific pre-IPO market including mark price, pool TVL, utilization, and available liquidity.",
  parameters: z.object({
    symbol: z.string().describe("Pre-IPO token symbol (e.g., xSPX)"),
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    const market = mockPreIpoMarkets.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase());
    if (!market) return JSON.stringify({ error: `Market ${symbol} not found` });
    return JSON.stringify({
      ...market,
      high24h: market.markPrice * 1.04,
      low24h: market.markPrice * 0.96,
      availableLiquidity: market.poolTvl * (1 - market.utilization / 100),
      fundingRate: (Math.random() * 0.1 - 0.05).toFixed(4),
      maxLeverage: 5,
      maintenanceMargin: "5%",
    });
  },
});
