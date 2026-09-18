import { tool } from "@openai/agents";
import { z } from "zod";

const mockTokens = [
  { symbol: "xAAPL", name: "xApple", price: 198.45, mcap: 3120000000, volume24h: 89000000, change24h: 2.3, sector: "Technology" },
  { symbol: "xTSLA", name: "xTesla", price: 248.12, mcap: 7890000000, volume24h: 156000000, change24h: -1.8, sector: "Automotive" },
  { symbol: "xMSFT", name: "xMicrosoft", price: 432.67, mcap: 3210000000, volume24h: 67000000, change24h: 1.1, sector: "Technology" },
  { symbol: "xGOOG", name: "xGoogle", price: 176.23, mcap: 2180000000, volume24h: 45000000, change24h: 0.8, sector: "Technology" },
  { symbol: "xAMZN", name: "xAmazon", price: 192.54, mcap: 2050000000, volume24h: 52000000, change24h: 1.5, sector: "E-Commerce" },
  { symbol: "xNVDA", name: "xNVIDIA", price: 875.30, mcap: 2150000000, volume24h: 234000000, change24h: 4.7, sector: "Technology" },
  { symbol: "xCOIN", name: "xCoinbase", price: 185.22, mcap: 450000000, volume24h: 31000000, change24h: -3.2, sector: "Crypto" },
  { symbol: "xMSTR", name: "xMicroStrategy", price: 412.88, mcap: 820000000, volume24h: 28000000, change24h: -2.1, sector: "Finance" },
];

export const searchTokens = tool({
  name: "search_tokens",
  description: "Search tokenized stocks by name or symbol. Returns matching tokens with price, market cap, and volume.",
  parameters: z.object({
    query: z.string().describe("Search query (name or symbol)"),
  }),
  execute: async ({ query }: { query: string }) => {
    const q = query.toLowerCase();
    const results = mockTokens.filter(
      (t) => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
    );
    return JSON.stringify(results.length ? results : mockTokens.slice(0, 3));
  },
});

export const getTokenDetails = tool({
  name: "get_token_details",
  description: "Get detailed information for a specific token including OHLCV data and fundamentals.",
  parameters: z.object({
    symbol: z.string().describe("Token symbol (e.g., xAAPL)"),
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    const token = mockTokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
    if (!token) return JSON.stringify({ error: `Token ${symbol} not found` });
    return JSON.stringify({
      ...token,
      high24h: token.price * 1.03,
      low24h: token.price * 0.97,
      open24h: token.price * (1 + token.change24h / 100),
      pe_ratio: Math.round(20 + Math.random() * 30),
      dividend_yield: (Math.random() * 2).toFixed(2) + "%",
      next_earnings: "2026-10-28",
    });
  },
});

export const getAllTokens = tool({
  name: "get_all_tokens",
  description: "Get all available tokenized stocks with price, market cap, and volume.",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify(mockTokens);
  },
});

export const getMarketOverview = tool({
  name: "get_market_overview",
  description: "Get overall market summary including total market cap, volume, trending, and top movers.",
  parameters: z.object({}),
  execute: async () => {
    const totalMcap = mockTokens.reduce((s, t) => s + t.mcap, 0);
    const totalVolume = mockTokens.reduce((s, t) => s + t.volume24h, 0);
    const sorted = [...mockTokens].sort((a, b) => b.change24h - a.change24h);
    return JSON.stringify({
      totalMarketCap: totalMcap,
      totalVolume24h: totalVolume,
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
      trending: [...mockTokens].sort((a, b) => b.volume24h - a.volume24h).slice(0, 3),
      btcDominance: "52.3%",
      fearGreedIndex: 68,
    });
  },
});

export const compareTokens = tool({
  name: "compare_tokens",
  description: "Compare multiple tokens side by side on price, market cap, volume, and fundamentals.",
  parameters: z.object({
    symbols: z.array(z.string()).describe("Array of token symbols to compare"),
  }),
  execute: async ({ symbols }: { symbols: string[] }) => {
    const results = symbols
      .map((s) => mockTokens.find((t) => t.symbol.toLowerCase() === s.toLowerCase()))
      .filter(Boolean);
    return JSON.stringify(results);
  },
});
