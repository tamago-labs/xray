import { defineFunction } from "@aws-amplify/backend";

export const riskReviewFunction = defineFunction({
  name: "risk-review",
  timeoutSeconds: 300,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  },
});
