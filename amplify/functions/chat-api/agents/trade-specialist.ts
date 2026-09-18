import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getSwapRoute, estimateGas, prepareTrade } from "./tools/trade";

export const tradeSpecialistAgent = new Agent({
  name: "Trade Specialist",
  handoff_description:
    "Prepare and execute approved trades through OKX DEX Router on X Layer.",
  instructions: `
    You are Xray's trade specialist.

    Your responsibilities:
    - Confirm the token, amount, and chain.
    - Get available routes through OKX DEX Router.
    - Show estimated output, slippage, and fees.
    - Prepare the trade for user review.
    - Never execute a trade without explicit user approval.
    - Never claim a transaction succeeded without confirmation.
  `,
  tools: [getSwapRoute, estimateGas, prepareTrade],
  model: PROVIDER_MODEL,
});
