import { tool } from "@openai/agents";
import { z } from "zod";

export const getPortfolio = tool({
  name: "get_portfolio",
  description: "Get the user's portfolio including holdings, allocation, and performance.",
  parameters: z.object({
    walletAddress: z.string().describe("User's wallet address"),
  }),
  execute: async ({ walletAddress }: { walletAddress: string }) => {
    return JSON.stringify({
      wallet: walletAddress,
      totalValue: 24567.89,
      totalPnL: 3245.67,
      pnlPercent: 15.2,
      holdings: [
        { symbol: "xAAPL", amount: 25, value: 4961.25, allocation: 20.2, pnl: 12.3 },
        { symbol: "xTSLA", amount: 15, value: 3721.80, allocation: 15.1, pnl: -4.2 },
        { symbol: "xNVDA", amount: 8, value: 7002.40, allocation: 28.5, pnl: 34.7 },
        { symbol: "xMSFT", amount: 12, value: 5192.04, allocation: 21.1, pnl: 8.9 },
        { symbol: "xCOIN", amount: 20, value: 3704.40, allocation: 15.1, pnl: -11.5 },
      ],
      riskScore: 72,
      diversificationScore: 65,
    });
  },
});

export const assessRisk = tool({
  name: "assess_risk",
  description: "Assess the user's risk profile based on their answers to risk questionnaire.",
  parameters: z.object({
    answers: z.object({
      experience: z.enum(["beginner", "intermediate", "advanced"]),
      horizon: z.enum(["short", "medium", "long"]),
      lossTolerance: z.enum(["low", "medium", "high"]),
      goal: z.enum(["income", "growth", "speculation"]),
    }),
  }),
  execute: async ({ answers }: { answers: any }) => {
    const scoreMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, short: 1, medium: 2, long: 3, low: 1, high: 3, income: 1, growth: 2, speculation: 3 };
    const total = (scoreMap[answers.experience] ?? 0) + (scoreMap[answers.horizon] ?? 0) + (scoreMap[answers.lossTolerance] ?? 0) + (scoreMap[answers.goal] ?? 0);
    const level = total <= 5 ? "Conservative" : total <= 9 ? "Moderate" : "Aggressive";
    return JSON.stringify({
      riskLevel: level,
      score: total,
      maxDrawdown: level === "Conservative" ? "10%" : level === "Moderate" ? "25%" : "40%",
      suggestedAllocation: level === "Conservative" ? { stablecoins: 40, blueChip: 40, growth: 20 } : level === "Moderate" ? { stablecoins: 20, blueChip: 40, growth: 40 } : { stablecoins: 10, blueChip: 30, growth: 60 },
    });
  },
});

export const compareAssets = tool({
  name: "compare_assets",
  description: "Compare multiple assets based on user criteria for portfolio construction.",
  parameters: z.object({
    symbols: z.array(z.string()).describe("Token symbols to compare"),
    criteria: z.enum(["risk", "return", "diversification", "all"]).describe("Comparison criteria"),
  }),
  execute: async ({ symbols, criteria }: { symbols: string[]; criteria: string }) => {
    return JSON.stringify({
      symbols,
      criteria,
      comparison: symbols.map((s) => ({
        symbol: s,
        riskScore: Math.floor(30 + Math.random() * 70),
        expectedReturn: (Math.random() * 40 - 10).toFixed(1) + "%",
        volatility: (Math.random() * 60 + 10).toFixed(1) + "%",
        correlation: Math.random().toFixed(2),
      })),
    });
  },
});
