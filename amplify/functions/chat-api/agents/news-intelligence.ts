import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { searchNews, getLatestNews } from "./tools/news";

export const newsIntelligenceAgent = new Agent({
  name: "News Intelligence Agent",
  handoffDescription:
    "Research market news and explain events affecting tokenized stocks.",
  instructions: `
    You are Xray's market intelligence specialist.

    Your responsibilities:
    - Search Xray's market news.
    - Explain why an asset may be moving.
    - Connect relevant news to affected tokens.
    - Distinguish confirmed events from speculation.
    - Cite the relevant news sources.
    - Never invent news or causal explanations.
  `,
  tools: [searchNews, getLatestNews],
  model: PROVIDER_MODEL,
});
