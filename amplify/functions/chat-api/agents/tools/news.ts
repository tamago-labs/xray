import { tool } from "@openai/agents";
import { z } from "zod";

const mockNews = [
  { id: 1, title: "Apple Reports Record Q4 Revenue on iPhone 17 Demand", source: "Bloomberg", timestamp: "2026-09-18T08:30:00Z", sentiment: "positive", affectedTokens: ["xAAPL", "xNVDA"], summary: "Apple beat revenue estimates by 12% driven by strong iPhone 17 Pro sales." },
  { id: 2, title: "Tesla FSD v14 Rollout Faces Regulatory Scrutiny", source: "Reuters", timestamp: "2026-09-17T14:22:00Z", sentiment: "neutral", affectedTokens: ["xTSLA"], summary: "NHTSA requests additional data before approving wider FSD deployment." },
  { id: 3, title: "Microsoft Azure AI Revenue Grows 45% YoY", source: "CNBC", timestamp: "2026-09-17T09:15:00Z", sentiment: "positive", affectedTokens: ["xMSFT"], summary: "Enterprise AI adoption drives Azure growth above expectations." },
  { id: 4, title: "Federal Reserve Signals Rate Cut in October", source: "WSJ", timestamp: "2026-09-18T11:00:00Z", sentiment: "positive", affectedTokens: ["xMSTR", "xCOIN"], summary: "Fed chair hints at 25bp cut amid cooling inflation data." },
  { id: 5, title: "NVIDIA Supply Constraints Limit H200 Shipments", source: "TechCrunch", timestamp: "2026-09-16T16:45:00Z", sentiment: "negative", affectedTokens: ["xNVDA", "xGOOG"], summary: "TSMC capacity shortage may delay next-gen GPU availability until Q1 2027." },
  { id: 6, title: "Amazon Expands Same-Day Delivery to 40 New Cities", source: "Bloomberg", timestamp: "2026-09-17T07:30:00Z", sentiment: "positive", affectedTokens: ["xAMZN"], summary: "Logistics investment pays off as delivery speeds improve customer retention." },
  { id: 7, title: "Bitcoin Surges Past $105K as ETF Inflows Hit Record", source: "CoinDesk", timestamp: "2026-09-18T06:00:00Z", sentiment: "positive", affectedTokens: ["xMSTR", "xCOIN"], summary: "Spot Bitcoin ETFs see $2.1B in daily inflows, pushing BTC to new all-time high." },
];

export const searchNews = tool({
  name: "search_news",
  description: "Search market news by keyword, token symbol, or topic. Returns articles with sentiment and affected tokens.",
  parameters: z.object({
    query: z.string().describe("Search query (token symbol, company name, or topic)"),
  }),
  execute: async ({ query }: { query: string }) => {
    const q = query.toLowerCase();
    const results = mockNews.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.affectedTokens.some((t) => t.toLowerCase().includes(q)) ||
        n.summary.toLowerCase().includes(q)
    );
    return JSON.stringify(results.length ? results : mockNews.slice(0, 3));
  },
});

export const getLatestNews = tool({
  name: "get_latest_news",
  description: "Get the latest market news feed.",
  parameters: z.object({
    limit: z.number().optional().describe("Number of articles to return (default 5)"),
  }),
  execute: async ({ limit = 5 }: { limit?: number }) => {
    return JSON.stringify(mockNews.slice(0, limit));
  },
});
