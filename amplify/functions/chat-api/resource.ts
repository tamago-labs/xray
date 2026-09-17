import { defineFunction } from "@aws-amplify/backend";

export const chatApiFunction = defineFunction({
  name: "chat-api",
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  },
});
