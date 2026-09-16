import type { EventBridgeHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/price-tracker";
import listData from "./rwa-v1-list.json";

const CMC_API_KEY = env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";
const BATCH_SIZE = 25;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Token {
  symbol: string;
  name: string;
  price: number | null;
  crypto_id: string;
  issuer_id: string;
  issuer_name: string;
  market_cap: number | null;
  volume_24h: number | null;
}

interface ActiveAsset {
  symbol: string;
  name: string;
  slug: string;
  rwa_id: number;
  rwa_rank: number;
  tokens: Token[];
  website: string | null;
  industry: string | null;
  founded: string | null;
  employees: number | null;
  exchange: string | null;
  description: string | null;
}

async function fetchCryptoQuotes(cryptoIds: number[]): Promise<any[]> {
  const url = new URL(`${BASE_URL}/v2/cryptocurrency/quotes/latest`);
  url.searchParams.set("id", cryptoIds.join(","));
  url.searchParams.set("convert", "USD");

  const res = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": CMC_API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return Object.values(data.data ?? {});
}

export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async (event) => {
  console.log("Price tracker started:", JSON.stringify(event.time));

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);

  const client = generateClient<Schema>();

  const { assets } = listData as unknown as { assets: ActiveAsset[] };

  const allTokens: { token: Token; rwa_id: number }[] = [];
  for (const asset of assets) {
    for (const token of asset.tokens) {
      if (token.crypto_id) {
        allTokens.push({ token, rwa_id: asset.rwa_id });
      }
    }
  }

  console.log(`Tracking ${allTokens.length} tokens across ${assets.length} stocks...`);

  let saved = 0;
  const errors: string[] = [];

  for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
    const batch = allTokens.slice(i, i + BATCH_SIZE);
    const progress = Math.min(i + BATCH_SIZE, allTokens.length);
    console.log(`  ${progress}/${allTokens.length}`);

    try {
      const ids = batch.map((b) => Number(b.token.crypto_id));
      const quotes = await fetchCryptoQuotes(ids);
      const quoteMap = new Map<number, any>();
      for (const q of quotes) {
        quoteMap.set(q.id, q);
      }

      for (const { token, rwa_id } of batch) {
        const quote = quoteMap.get(Number(token.crypto_id));
        if (!quote) {
          errors.push(token.symbol);
          continue;
        }

        const usd = quote.quote?.USD;
        try {
          await client.models.PriceSnapshot.create({
            symbol: assets.find((a) => a.rwa_id === rwa_id)?.symbol ?? "",
            rwa_id,
            token_symbol: token.symbol,
            crypto_id: Number(token.crypto_id),
            price: usd?.price ?? null,
            market_cap: usd?.market_cap ?? null,
            volume_24h: usd?.volume_24h ?? null,
            percent_1h: usd?.percent_change_1h ?? null,
            percent_24h: usd?.percent_change_24h ?? null,
            percent_7d: usd?.percent_change_7d ?? null,
            percent_30d: usd?.percent_change_30d ?? null,
            circulating_supply: quote.circulating_supply ?? null,
            total_supply: quote.total_supply ?? null,
          });
          saved++;
        } catch (err) {
          console.error(`Error saving ${token.symbol}: ${err}`);
          errors.push(token.symbol);
        }
      }
    } catch (err) {
      console.error(`Batch error: ${err}`);
    }

    if (i + BATCH_SIZE < allTokens.length) {
      await sleep(2500);
    }
  }

  console.log(`Done. Saved: ${saved}, Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Failed: ${errors.join(", ")}`);
  }
};
