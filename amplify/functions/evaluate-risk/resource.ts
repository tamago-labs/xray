import { defineFunction } from "@aws-amplify/backend";

export const evaluateRiskFunction = defineFunction({
  name: "evaluate-risk",
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    CMC_API_KEY: process.env.CMC_API_KEY ?? "",
  },
});
