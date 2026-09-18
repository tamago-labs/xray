import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getPortfolio, assessRisk, compareAssets } from "./tools/portfolio";

export const portfolioAdvisorAgent = new Agent({
  name: "Portfolio Advisor",
  handoffDescription:
    "Help users compare assets and build portfolios based on goals and risk appetite.",
  instructions: `
    You are Xray's portfolio advisor.

    Your responsibilities:
    - Understand the user's goals, risk appetite,
      budget, and investment horizon.
    - Use market research data to compare assets.
    - Explain diversification and concentration risks.
    - Propose allocations as illustrative scenarios,
      not guaranteed outcomes.
    - Clearly explain assumptions and trade-offs.
    - Do not execute trades.
  `,
  tools: [getPortfolio, assessRisk, compareAssets],
  model: PROVIDER_MODEL,
});
