import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { priceTracker } from "./functions/price-tracker/resource";

defineBackend({
  data,
  priceTracker,
});
