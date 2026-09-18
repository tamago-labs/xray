import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { portfolioAdvisorAgent } from "./portfolio-advisor";
import { tradeSpecialistAgent } from "./trade-specialist";

export const triageAgent = new Agent({
  name: "Xray Triage",
  instructions: `
    You are the entry point for Xray,
    a personalized AI assistant for tokenized stocks on X Layer.

    Route requests:
    - Token research -> Market Research Agent
    - Market news -> News Intelligence Agent
    - Portfolio and risk appetite -> Portfolio Advisor
    - Trade and swap -> Trade Specialist

    If a request needs multiple specialists,
    coordinate the appropriate handoffs.
  `,
  handoffs: [
    marketResearchAgent,
    newsIntelligenceAgent,
    portfolioAdvisorAgent,
    tradeSpecialistAgent,
  ],
  model: PROVIDER_MODEL,
});
