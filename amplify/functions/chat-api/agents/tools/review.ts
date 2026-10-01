import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-api";
import type { Schema } from "../../../../data/resource";

export function createGetReviewDetailsTool(reviewId: string) {
  return tool({
    name: "get_review_details",
    description: "Get the full portfolio review details including factor breakdown, hidden risks, and user answers. Use when the user asks for deeper analysis, specific factor scores, or wants to revisit review findings.",
    parameters: z.object({}),
    execute: async () => {
      const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
      Amplify.configure(resourceConfig, libraryOptions);
      const client = generateClient<Schema>();

      const { data: review } = await client.models.SavedReview.get({ id: reviewId });
      if (!review) return JSON.stringify({ error: "Review not found" });

      const r = review as any;
      const report = JSON.parse(r.report as string);
      const holdings = JSON.parse(r.holdings as string);
      const answers = JSON.parse(r.answers as string);

      return JSON.stringify({
        overallScore: report.overallScore,
        overallLabel: report.overallLabel,
        overallSummary: report.overallSummary,
        fundamentalsScore: report.fundamentalsScore,
        fundamentalsExplanation: report.fundamentalsExplanation,
        onchainScore: report.onchainScore,
        onchainExplanation: report.onchainExplanation,
        deterministicFactors: report.deterministicFactors ?? {},
        factorExplanations: report.factorExplanations ?? {},
        hiddenRisks: report.hiddenRisks ?? [],
        portfolioStats: report.portfolioStats ?? {},
        personalizationNote: report.personalizationNote ?? '',
        holdings,
        answers,
      });
    },
  });
}
