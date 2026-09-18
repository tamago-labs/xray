import { tool } from "@openai/agents";
import { z } from "zod";

export const getSwapRoute = tool({
  name: "get_swap_route",
  description: "Get the best swap route through OKX DEX Router for a given token pair and amount.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol"),
    tokenOut: z.string().describe("Output token symbol"),
    amount: z.number().describe("Amount of tokenIn to swap"),
  }),
  execute: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: number }) => {
    const mockRate = (Math.random() * 50 + 1).toFixed(4);
    const outputAmount = (amount * parseFloat(mockRate)).toFixed(2);
    return JSON.stringify({
      tokenIn,
      tokenOut,
      amountIn: amount,
      estimatedOutput: outputAmount,
      rate: mockRate,
      slippage: (Math.random() * 0.5).toFixed(2) + "%",
      priceImpact: (Math.random() * 1.5).toFixed(2) + "%",
      route: ["OKX DEX", "Uniswap V3", "Curve"],
      steps: [
        { protocol: "Uniswap V3", portion: "60%", fee: "0.3%" },
        { protocol: "Curve", portion: "40%", fee: "0.04%" },
      ],
    });
  },
});

export const estimateGas = tool({
  name: "estimate_gas",
  description: "Estimate gas cost for a trade on X Layer.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol"),
    tokenOut: z.string().describe("Output token symbol"),
    amount: z.number().describe("Input amount"),
  }),
  execute: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: number }) => {
    return JSON.stringify({
      chain: "X Layer",
      estimatedGas: Math.floor(Math.random() * 150000 + 80000),
      gasPrice: "0.001 Gwei",
      estimatedCostUSD: (Math.random() * 0.5 + 0.05).toFixed(4),
      estimatedTime: "< 3 seconds",
    });
  },
});

export const prepareTrade = tool({
  name: "prepare_trade",
  description: "Prepare a trade transaction for user review. Does NOT execute — returns payload for user approval.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol"),
    tokenOut: z.string().describe("Output token symbol"),
    amountIn: z.number().describe("Amount to swap"),
    slippageTolerance: z.number().optional().describe("Max slippage % (default 0.5)"),
    deadline: z.number().optional().describe("Transaction deadline in minutes (default 20)"),
  }),
  execute: async ({ tokenIn, tokenOut, amountIn, slippageTolerance = 0.5, deadline = 20 }: { tokenIn: string; tokenOut: string; amountIn: number; slippageTolerance?: number; deadline?: number }) => {
    return JSON.stringify({
      status: "pending_approval",
      summary: `Swap ${amountIn} ${tokenIn} for ${tokenOut}`,
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance: slippageTolerance + "%",
      deadline: deadline + " minutes",
      route: ["OKX DEX", "Uniswap V3"],
      requiresApproval: true,
      warning: "Please review all details carefully before confirming. This action cannot be undone.",
    });
  },
});
