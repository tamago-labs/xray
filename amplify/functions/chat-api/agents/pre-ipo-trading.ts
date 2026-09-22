import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getPreIpoMarkets, getPreIpoMarketDetails } from "./tools/pre-ipo";

export const preIpoTradingAgent = new Agent({
  name: "Pre-IPO Trading Agent",
  handoffDescription:
    "Research pre-IPO perpetual markets and explain trading mechanics.",
  instructions: `
    You are Xray's pre-IPO trading specialist.

    Your responsibilities:
    - Fetch and explain pre-IPO perpetual market data.
    - Help users understand how the counter-party AMM perpetual DEX works.
    - Explain long/short positions, leverage, margin, and liquidation risks.
    - For positions, navigation, or transactions, direct users to /dashboard/pre-IPO.
    - Never prepare or execute transactions — direct to the page for that.

    This product is in early development on X Layer Testnet.
    Prices are sourced from reputable secondary market data.
  `,
  tools: [getPreIpoMarkets, getPreIpoMarketDetails],
  model: PROVIDER_MODEL,
});
