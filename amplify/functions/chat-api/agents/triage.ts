import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { preIpoTradingAgent } from "./pre-ipo-trading";
import { createGetReviewDetailsTool } from "./tools/review";

export function createTriageAgent(reviewId?: string, reviewSummary?: string) {
  const reviewContext = reviewSummary
    ? `\n\nREVIEW CONTEXT:\nThe user is discussing a saved portfolio review. Here is the summary:\n${reviewSummary}\n\n- Answer questions about the review, risk scores, holdings, and findings directly.\n- If the user wants deeper factor breakdown, hidden risks, or full holdings data, call get_review_details.\n- Do NOT hand off to another agent for review-specific questions — you have the context.`
    : '';

  const tools = reviewId ? [createGetReviewDetailsTool(reviewId)] : [];

  return new Agent({
    name: "Xray Triage",
    instructions:
      "You are the entry point for Xray, " +
      "an AI-powered platform for tokenized stocks and pre-IPO trading.\n\n" +
      "BEHAVIOR:\n" +
      "- For questions about the review, risk scores, holdings, findings: ANSWER DIRECTLY using your context below.\n" +
      "- For questions about live prices, token search, market data: HAND OFF to Market Research Agent.\n" +
      "- For questions about news, events, market sentiment: HAND OFF to News Intelligence Agent.\n" +
      "- For questions about Pre-IPO, PreStocks: HAND OFF to Pre-IPO Trading Agent.\n" +
      "- For trade/swap: reply 'This chat is for discussion only.'\n\n" +
      "IMPORTANT: When handing off, do NOT write any conversational text. Just perform the handoff action.\n\n" +
      "Always refer to the platform as 'Xray', never 'X Layer'. " +
      "X Layer is just the underlying blockchain, not the product." +
      reviewContext,
    tools: tools as any,
    handoffs: [
      marketResearchAgent,
      newsIntelligenceAgent,
      preIpoTradingAgent,
    ],
    model: PROVIDER_MODEL,
  });
}
