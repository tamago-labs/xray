import { defineFunction } from "@aws-amplify/backend";

export const ohlcvFetcherFunction = defineFunction({
  name: "ohlcv-fetcher",
  timeoutSeconds: 60,
  memoryMB: 256,
  environment: {
    CMC_API_KEY: process.env.CMC_API_KEY ?? "",
  },
});
