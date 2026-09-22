export interface PreIpoAssetMeta {
  symbol: string;
  name: string;
  industry: string;
}

export const preIpoAssetConfig: PreIpoAssetMeta[] = [
  { symbol: "ANDURIL", name: "Anduril", industry: "Aerospace & Defense" },
  { symbol: "ANTHROPIC", name: "Anthropic", industry: "Artificial Intelligence" },
  { symbol: "KALSHI", name: "Kalshi", industry: "Financial Services" },
  { symbol: "NEURALINK", name: "Neuralink", industry: "Neurotechnology" },
  { symbol: "OPENAI", name: "OpenAI", industry: "Artificial Intelligence" },
];

export const getAssetMeta = (symbol: string): PreIpoAssetMeta | undefined =>
  preIpoAssetConfig.find((a) => a.symbol === symbol);
