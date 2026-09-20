import type { EventBridgeHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/pre-ipo-tracker";

const PRESTOCKS_API = "https://prestocks.com/api/prestocks";

interface PreStock {
  symbol: string;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
}

export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async (event) => {
  console.log("Pre-IPO tracker started:", JSON.stringify(event.time));

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);

  const client = generateClient<Schema>();

  const res = await fetch(PRESTOCKS_API, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    return;
  }

  const data = (await res.json()) as PreStock[];
  console.log(`Fetched ${data.length} pre-IPO tokens`);

  let saved = 0;
  const errors: string[] = [];

  for (const item of data) {
    try {
      await client.models.PreIpoSnapshot.create({
        symbol: item.symbol,
        markPrice: item.markPrice,
        markValuation: item.markValuation,
        impliedValuation: item.impliedValuation,
      });
      saved++;
    } catch (err) {
      console.error(`Error saving ${item.symbol}: ${err}`);
      errors.push(item.symbol);
    }
  }

  console.log(`Done. Saved: ${saved}, Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Failed: ${errors.join(", ")}`);
  }
};
