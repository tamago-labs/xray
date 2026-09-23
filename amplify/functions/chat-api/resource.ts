import { defineFunction } from "@aws-amplify/backend";

export const chatApiFunction = defineFunction({
  name: "chat-api",
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    OKX_API_KEY: process.env.OKX_API_KEY ?? "",
    OKX_SECRET_KEY: process.env.OKX_SECRET_KEY ?? "",
    OKX_PASSPHRASE: process.env.OKX_PASSPHRASE ?? "",
  },
});
