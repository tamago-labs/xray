import { defineFunction } from "@aws-amplify/backend";

export const priceTracker = defineFunction({
  name: "price-tracker",
  schedule: "every 12h",
  timeoutSeconds: 300,
  environment: {
    CMC_API_KEY: process.env.CMC_API_KEY ?? "",
  },
});
