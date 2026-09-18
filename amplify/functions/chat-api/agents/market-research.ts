import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { searchTokens, getTokenDetails, getAllTokens, getMarketOverview, compareTokens } from "./tools/market";

export const marketResearchAgent = new Agent({
  name: "Market Research Agent",
  handoffDescription:
    "Research tokenized stocks and pre-IPO tokens using Xray market data.",
  instructions: `
    You are Xray's market research specialist.

    Your responsibilities:
    - Search Xray's tokenized stock database.
    - Analyze price, market cap, liquidity, and available fundamentals.
    - Compare assets using current data.
    - Clearly distinguish facts from analysis.
    - Never invent market data.
    - Explain risks and uncertainty.

    You may recommend assets for further consideration,
    but do not make guaranteed-return claims.
  `,
  tools: [searchTokens, getTokenDetails, getAllTokens, getMarketOverview, compareTokens],
  model: PROVIDER_MODEL,
});
