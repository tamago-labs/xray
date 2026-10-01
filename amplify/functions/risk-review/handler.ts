import type { Schema } from "../../data/resource";
import { run, Agent } from "@openai/agents";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/risk-review";
import { PROVIDER_MODEL, PROVIDER_BASE_URL } from "./provider";
import { getTokenMeta, getIssuerRisk } from "./config/tokens";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

const CREDIT_RATE = 0.05;

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

interface Holding {
  symbol: string;
  name?: string;
  balance: number;
  price: number;
}

interface EnrichedHolding {
  symbol: string;
  name: string;
  stockSymbol: string;
  stockName: string;
  balance: number;
  price: number;
  value: number;
  valuePct: number;
  type: string;
  industry: string;
  issuer: string;
  issuerRiskLevel: string;
  liquidityTier: string;
  exchange: string;
}

// ─── Turn 1: Question generation ─────────────────────────────────────────────

const QUESTIONS_SYSTEM_PROMPT = `You are Xray's portfolio risk intake assistant. Before running a deep risk analysis, you ask a few clarifying questions to personalize the review.

Your questions must be:
- Relevant: derived from the actual portfolio composition and the user's prompt
- Concise: one short sentence each
- Multiple-choice: 2-4 options per question, each option a short label
- Personalized: reference specific holdings, sectors, concentration, or issuer risks when notable
- Use the pre-computed portfolio stats provided. Do NOT recalculate percentages.

Generate exactly 3-5 questions. Do NOT ask anything already answerable from the portfolio data.

You MUST respond with ONLY valid JSON matching the requested schema. No markdown, no extra text.`;

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        ),
      })
    )
    .min(3)
    .max(5),
});

// ─── Turn 2: Risk analysis ───────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are Xray's portfolio risk analysis engine. You produce a multi-factor risk score for tokenized equity portfolios.

You will receive:
- Pre-computed deterministic factor scores (concentration, market exposure, liquidity, issuer) — use these EXACT values, do NOT recalculate them
- Portfolio holdings with underlying stock info
- The user's questionnaire answers (personalization context)

Your job:
1. Assess Company Fundamentals (0-100) from the underlying stocks: valuation, earnings quality, growth, sector risk of each company
2. Assess On-chain Factors (0-100): token wrapper risk, chain risk, holder distribution concerns
3. Synthesize the final overall score (0-100) as a weighted composite of all 6 factors, adjusted by personalization (high risk tolerance + long horizon can lower the effective score slightly; low tolerance raises it). Stay within ±10 of the weighted average of the 6 factors.
4. Write a one-line explanation per factor referencing SPECIFIC holdings
5. List 2-4 hidden risks (issuer/custody, tracking error, redemption restrictions, regulatory, smart contract)

Score range: 0-30 Low, 31-60 Moderate, 61-80 High, 81-100 Very High.

You MUST respond with ONLY valid JSON matching the requested schema. No markdown, no extra text.`;

const analysisSchema = z.object({
  fundamentalsScore: z.number().min(0).max(100),
  fundamentalsExplanation: z.string(),
  onchainScore: z.number().min(0).max(100),
  onchainExplanation: z.string(),
  overallScore: z.number().min(0).max(100),
  overallLabel: z.enum(["Low", "Moderate", "High", "Very High"]),
  overallSummary: z.string(),
  factorExplanations: z.object({
    concentration: z.string(),
    marketExposure: z.string(),
    liquidity: z.string(),
    issuer: z.string(),
  }),
  personalizationNote: z.string(),
  hiddenRisks: z.array(z.string()).min(2).max(4),
});

// ─── Enrichment + deterministic scoring ──────────────────────────────────────

function enrichHoldings(holdings: Holding[]): { enriched: EnrichedHolding[]; totalValue: number } {
  const withMeta = holdings
    .filter((h) => h.balance > 0 && h.price > 0)
    .map((h) => {
      const meta = getTokenMeta(h.symbol);
      const issuerRisk = getIssuerRisk(meta?.issuer_name);
      const volume24h = meta?.volume_24h ?? 0;
      const liquidityTier = volume24h > 5000000 ? "High" : volume24h > 500000 ? "Moderate" : "Low";
      const value = h.balance * h.price;
      return {
        symbol: h.symbol,
        name: h.name ?? meta?.name ?? h.symbol,
        stockSymbol: meta?.stockSymbol ?? "",
        stockName: meta?.stockName ?? "",
        balance: h.balance,
        price: h.price,
        value,
        valuePct: 0,
        type: meta?.type === "base" ? "base" : "tokenized",
        industry: meta?.industry ?? (meta?.type === "base" ? "Crypto" : "Unknown"),
        issuer: meta?.issuer_name ?? "Unknown",
        issuerRiskLevel: issuerRisk?.level ?? "Unknown",
        liquidityTier,
        exchange: meta?.exchange ?? "",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const totalValue = withMeta.reduce((sum, h) => sum + h.value, 0);
  if (totalValue > 0) {
    for (const h of withMeta) {
      h.valuePct = (h.value / totalValue) * 100;
    }
  }

  return { enriched: withMeta, totalValue };
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function computeDeterministicFactors(enriched: EnrichedHolding[]) {
  const sorted = [...enriched].sort((a, b) => b.valuePct - a.valuePct);
  const largestPct = sorted[0]?.valuePct ?? 0;
  const top3Pct = sorted.slice(0, 3).reduce((sum, h) => sum + h.valuePct, 0);
  const hhi = enriched.reduce((sum, h) => sum + Math.pow(h.valuePct / 100, 2), 0);
  const concentrationScore = clampScore(largestPct * 0.4 + top3Pct * 0.3 + hhi * 100 * 0.3);

  const sectorMap = new Map<string, number>();
  for (const h of enriched) {
    if (h.industry && h.industry !== "Unknown") {
      sectorMap.set(h.industry, (sectorMap.get(h.industry) ?? 0) + h.valuePct);
    }
  }
  const sectors = Array.from(sectorMap.entries()).map(([sector, pct]) => ({ sector, pct })).sort((a, b) => b.pct - a.pct);
  const topSectorPct = sectors[0]?.pct ?? 0;
  const sectorHhi = sectors.reduce((sum, s) => sum + Math.pow(s.pct / 100, 2), 0);
  const marketExposureScore = clampScore(topSectorPct * 0.6 + sectorHhi * 100 * 0.4);

  const tierScore: Record<string, number> = { High: 20, Moderate: 55, Low: 85 };
  const totalPct = enriched.reduce((sum, h) => sum + h.valuePct, 0) || 1;
  const liquidityScore = clampScore(
    enriched.reduce((sum, h) => sum + (tierScore[h.liquidityTier] ?? 60) * (h.valuePct / totalPct), 0)
  );

  const issuerScoreMap: Record<string, number> = {
    Low: 15,
    "Low-Moderate": 35,
    Moderate: 55,
    "Moderate-High": 75,
    High: 90,
    Unknown: 60,
  };
  const issuerScore = clampScore(
    enriched.reduce((sum, h) => sum + (issuerScoreMap[h.issuerRiskLevel] ?? 60) * (h.valuePct / totalPct), 0)
  );

  return {
    concentrationScore,
    marketExposureScore,
    liquidityScore,
    issuerScore,
    stats: {
      largestPct,
      top3Pct,
      hhi,
      topSectors: sectors.slice(0, 5),
    },
  };
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function formatHolding(h: EnrichedHolding): string {
  return (
    "- " +
    h.symbol +
    (h.stockSymbol ? " (" + h.stockSymbol + " — " + h.stockName + (h.exchange ? ", " + h.exchange : "") + ")" : "") +
    ': value=$' +
    h.value.toFixed(2) +
    " (" +
    h.valuePct.toFixed(1) +
    '% of portfolio), industry="' +
    h.industry +
    '", issuer="' +
    h.issuer +
    '", issuerRisk="' +
    h.issuerRiskLevel +
    '", liquidityTier="' +
    h.liquidityTier +
    '"'
  );
}

function buildQuestionsPrompt(
  prompt: string,
  enriched: EnrichedHolding[],
  totalValue: number,
  stats: {
    largestPosition: { symbol: string; pct: number } | null;
    top2Pct: number;
    topSectors: Array<{ sector: string; pct: number }>;
  }
): string {
  const formatSector = (s: { sector: string; pct: number }) => "- " + s.sector + ": " + s.pct.toFixed(1) + "%";

  return `The user wants a portfolio risk review and asked: "${prompt}"

PORTFOLIO STATS (pre-computed, use these exact values, do NOT recalculate):
- Total value: $${totalValue.toFixed(2)}
- Largest position: ${stats.largestPosition ? stats.largestPosition.symbol + " at " + stats.largestPosition.pct.toFixed(1) + "%" : "N/A"}
- Top 2 positions combined: ${stats.top2Pct.toFixed(1)}%
- Sector exposure:
${stats.topSectors.map(formatSector).join("\n") || "N/A"}

HOLDINGS:
${enriched.map(formatHolding).join("\n") || "None"}

Generate 3-5 clarifying questions to personalize the risk analysis for this portfolio. Reference specific concentrations, sectors, or issuer risks when notable.`;
}

function buildAnalysisPrompt(
  prompt: string,
  enriched: EnrichedHolding[],
  totalValue: number,
  factors: ReturnType<typeof computeDeterministicFactors>,
  answers: Record<string, { q: string; a: string }>
): string {
  const formatSector = (s: { sector: string; pct: number }) => "- " + s.sector + ": " + s.pct.toFixed(1) + "%";
  const answerLines = Object.values(answers)
    .map((qa) => "- " + (qa.q || "Question") + " → " + qa.a)
    .join("\n");

  return `The user asked: "${prompt}"

PORTFOLIO STATS (pre-computed):
- Total value: $${totalValue.toFixed(2)}
- Largest position: ${factors.stats.largestPct.toFixed(1)}%
- Top 3 positions combined: ${factors.stats.top3Pct.toFixed(1)}%
- Sector exposure:
${factors.stats.topSectors.map(formatSector).join("\n") || "N/A"}

PRE-COMPUTED FACTOR SCORES (use these EXACT values, do NOT recalculate):
- Concentration: ${factors.concentrationScore}/100
- Market Exposure: ${factors.marketExposureScore}/100
- Liquidity: ${factors.liquidityScore}/100
- Issuer: ${factors.issuerScore}/100

HOLDINGS:
${enriched.map(formatHolding).join("\n") || "None"}

USER QUESTIONNAIRE ANSWERS (personalization context):
${answerLines || "None"}

Now assess Company Fundamentals and On-chain Factors, synthesize the overall score, and produce the risk breakdown.`;
}

// ─── Credits ─────────────────────────────────────────────────────────────────

async function deductCredits(userProfileId: string, inputText: string, outputObj: unknown): Promise<void> {
  try {
    const { data: profile } = await dataClient.models.UserProfile.get({ id: userProfileId });
    if (profile) {
      const inputTokens = Math.ceil(inputText.length / 4);
      const outputTokens = Math.ceil(JSON.stringify(outputObj ?? {}).length / 4);
      const creditsUsed = (inputTokens + outputTokens) * CREDIT_RATE;
      const newCredits = Math.max(0, (profile.credits ?? 0) - creditsUsed);
      await dataClient.models.UserProfile.update({
        id: profile.id,
        credits: newCredits,
      });
      console.log("[risk-review] credits deducted:", creditsUsed, "remaining:", newCredits);
    } else {
      console.log("[risk-review] profile not found:", userProfileId);
    }
  } catch (creditErr) {
    console.error("[risk-review] credits deduction failed:", creditErr);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const handler: Schema["riskReview"]["functionHandler"] = async (event) => {
  try {
    const {
      action = "generateQuestions",
      userProfileId,
      prompt: rawPrompt,
      holdings: rawHoldings,
      answers: rawAnswers,
    } = event.arguments as any;

    const prompt = typeof rawPrompt === "string" ? rawPrompt : "";
    const holdings: Holding[] = typeof rawHoldings === "string" ? JSON.parse(rawHoldings) : (rawHoldings ?? []);
    const answers: Record<string, { q: string; a: string }> =
      typeof rawAnswers === "string" ? JSON.parse(rawAnswers) : (rawAnswers ?? {});

    console.log("[risk-review] called with:", {
      action,
      userProfileId,
      prompt: prompt.slice(0, 60),
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
      answersCount: Object.keys(answers).length,
    });

    if (!userProfileId || !Array.isArray(holdings) || holdings.length === 0) {
      console.log("[risk-review] missing arguments, returning null");
      return null;
    }

    const { enriched, totalValue } = enrichHoldings(holdings);
    if (enriched.length === 0) {
      console.log("[risk-review] no valid holdings after filter, returning null");
      return null;
    }

    const OpenAI = (await import("openai")).default;
    const openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });
    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(openaiClient);
    setTracingDisabled(true);

    if (action === "runAnalysis") {
      if (!prompt || Object.keys(answers).length === 0) {
        console.log("[risk-review] runAnalysis missing prompt/answers, returning null");
        return null;
      }

      const factors = computeDeterministicFactors(enriched);
      console.log("[risk-review] deterministic factors:", {
        concentration: factors.concentrationScore,
        market: factors.marketExposureScore,
        liquidity: factors.liquidityScore,
        issuer: factors.issuerScore,
      });

      const userPrompt = buildAnalysisPrompt(prompt, enriched, totalValue, factors, answers);

      const agent = new Agent({
        name: "Risk Analyzer",
        model: PROVIDER_MODEL,
        instructions: ANALYSIS_SYSTEM_PROMPT,
        outputType: analysisSchema,
      });

      const result = await run(agent, [{ role: "user", content: userPrompt }], { maxTurns: 10 });
      const output = result.finalOutput as z.infer<typeof analysisSchema>;
      console.log("[risk-review] analysis generated:", {
        overallScore: output?.overallScore,
        overallLabel: output?.overallLabel,
      });

      await deductCredits(userProfileId, userPrompt, output);

      return {
        ...output,
        deterministicFactors: {
          concentration: factors.concentrationScore,
          marketExposure: factors.marketExposureScore,
          liquidity: factors.liquidityScore,
          issuer: factors.issuerScore,
        },
        portfolioStats: {
          totalValue,
          largestPct: factors.stats.largestPct,
          top3Pct: factors.stats.top3Pct,
          topSectors: factors.stats.topSectors,
        },
      };
    }

    // Default: generateQuestions
    if (!prompt) {
      console.log("[risk-review] missing prompt, returning null");
      return null;
    }

    const sorted = [...enriched].sort((a, b) => b.value - a.value);
    const largestPosition = sorted[0] ? { symbol: sorted[0].symbol, pct: sorted[0].valuePct } : null;
    const top2Pct = sorted.slice(0, 2).reduce((sum, h) => sum + h.valuePct, 0);

    const sectorMap = new Map<string, number>();
    for (const h of enriched) {
      if (h.industry && h.industry !== "Unknown") {
        sectorMap.set(h.industry, (sectorMap.get(h.industry) ?? 0) + h.valuePct);
      }
    }
    const topSectors = Array.from(sectorMap.entries())
      .map(([sector, pct]) => ({ sector, pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    const userPrompt = buildQuestionsPrompt(prompt, enriched, totalValue, { largestPosition, top2Pct, topSectors });

    const agent = new Agent({
      name: "Risk Intake",
      model: PROVIDER_MODEL,
      instructions: QUESTIONS_SYSTEM_PROMPT,
      outputType: questionsSchema,
    });

    const result = await run(agent, [{ role: "user", content: userPrompt }], { maxTurns: 10 });
    const output = result.finalOutput as z.infer<typeof questionsSchema>;
    console.log("[risk-review] questions generated:", output.questions?.length);

    await deductCredits(userProfileId, userPrompt, output);

    return output;
  } catch (err) {
    console.error("[risk-review] error:", err);
    if (err instanceof Error) {
      console.error("[risk-review] error message:", err.message);
    }
    return null;
  }
};
