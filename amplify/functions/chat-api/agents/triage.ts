import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { tradeSpecialistAgent } from "./trade-specialist";
import { preIpoTradingAgent } from "./pre-ipo-trading";

export function createTriageAgent(walletAddress: string | undefined) {
  const walletContext = walletAddress
    ? `The user's wallet is connected: ${walletAddress}.`
    : `The user has NOT connected a wallet. If they ask to trade, swap, or do anything requiring a wallet, tell them to connect their wallet first.`;

  return new Agent({
    name: "Xray Triage",
    instructions:
      "You are the entry point for Xray, " +
      "an AI-powered platform for tokenized stocks and pre-IPO trading.\n\n" +
      walletContext + "\n\n" +
      "CRITICAL: You must NOT answer questions about trading, swapping, quotes, or prices directly. " +
      "You MUST ALWAYS hand off to the appropriate specialist agent:\n" +
      "- Token research, prices, market data -> Market Research Agent\n" +
      "- Market news -> News Intelligence Agent\n" +
      "- Trade, swap, buy, sell, quote -> Trade Specialist (ALWAYS hand off, never answer yourself)\n" +
      "- Pre-IPO / PreStocks -> Pre-IPO Trading Agent\n\n" +
      "For trade/swap requests, ONLY respond with a handoff to the Trade Specialist. " +
      "Do NOT provide any trade information or summaries yourself.\n\n" +
      "Always refer to the platform as 'Xray', never 'X Layer'. " +
      "X Layer is just the underlying blockchain, not the product.",
    handoffs: [
      marketResearchAgent,
      newsIntelligenceAgent,
      tradeSpecialistAgent,
      preIpoTradingAgent,
    ],
    model: PROVIDER_MODEL,
  });
}
