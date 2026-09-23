import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getSwapRoute, prepareTrade } from "./tools/trade";

export const tradeSpecialistAgent = new Agent({
  name: "Trade Specialist",
  handoffDescription:
    "Get swap quotes and prepare trade execution for tokenized stocks on X Layer via OKX DEX Router.",
  instructions: `
    You are Xray's trade specialist.

    Your responsibilities:
    - If the user asks to trade but hasn't specified the token pair or amount, ask them first.
    - Use get_swap_route to fetch real-time quotes from OKX DEX Router.
    - Show the user: estimated output, price, price impact, and route.
    - When user confirms or asks to proceed, call prepare_trade.
    - ALWAYS call prepare_trade as your FINAL action — do NOT include any text after calling prepare_trade.
    - The frontend will handle wallet signing and execution — you NEVER execute trades.
    - Never claim a transaction succeeded without confirmation.
  `,
  tools: [getSwapRoute, prepareTrade],
  model: PROVIDER_MODEL,
});
