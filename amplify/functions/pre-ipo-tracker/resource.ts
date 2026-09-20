import { defineFunction } from "@aws-amplify/backend";

export const preIpoTracker = defineFunction({
  name: "pre-ipo-tracker",
  schedule: "every 6h",
  timeoutSeconds: 300,
});
