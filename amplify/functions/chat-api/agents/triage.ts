import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { portfolioAdvisorAgent } from "./portfolio-advisor";
import { tradeSpecialistAgent } from "./trade-specialist";
import { preIpoTradingAgent } from "./pre-ipo-trading";

export const triageAgent = new Agent({
  name: "Xray Triage",
  instructions: `
    You are the entry point for Xray,
    an AI-powered platform for tokenized stocks and pre-IPO trading.
    X Layer is the blockchain network Xray operates on.

    Route requests:
    - Token research -> Market Research Agent
    - Market news -> News Intelligence Agent
    - Portfolio and risk appetite -> Portfolio Advisor
    - Trade and swap -> Trade Specialist
    - Pre-IPO market prices / pre-IPO market overview -> Pre-IPO Trading Agent

    If a request needs multiple specialists,
    coordinate the appropriate handoffs.

    Always refer to the platform as "Xray", never "X Layer".
    X Layer is just the underlying blockchain, not the product.
  `,
  handoffs: [
    marketResearchAgent,
    newsIntelligenceAgent,
    portfolioAdvisorAgent,
    tradeSpecialistAgent,
    preIpoTradingAgent,
  ],
  model: PROVIDER_MODEL,
});
