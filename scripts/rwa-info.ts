// CMC RWA: Enrich rwa-v1-list.json tokens with crypto info
// Reads rwa-v1-list.json, fetches /v2/cryptocurrency/info per crypto_id, attaches metadata
// Usage: npx tsx scripts/rwa-info.ts

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

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
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  twitter?: string | null;
  discord?: string | null;
  tags?: string[] | null;
  date_added?: string | null;
  slug?: string | null;
}

async function fetchCryptoInfo(cryptoId: string): Promise<any> {
  const url = new URL(`${BASE_URL}/v2/cryptocurrency/info`);
  url.searchParams.set("id", cryptoId);

  const res = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": CMC_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status} for id=${cryptoId}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  return data.data?.[cryptoId] ?? null;
}

async function main() {
  const filePath = join(process.cwd(), "lib", "data", "rwa-v1-list.json");
  const raw = readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  const assets = json.assets;

  const cryptoIdSet = new Set<string>();
  for (const asset of assets) {
    for (const token of asset.tokens ?? []) {
      if (token.crypto_id) {
        cryptoIdSet.add(String(token.crypto_id));
      }
    }
  }

  const uniqueIds = [...cryptoIdSet];
  console.log(`Found ${uniqueIds.length} unique crypto_ids to enrich...\n`);

  const infoMap = new Map<string, any>();
  let fetched = 0;
  const errors: string[] = [];

  for (const id of uniqueIds) {
    fetched++;
    process.stdout.write(`  ${fetched}/${uniqueIds.length} (id=${id})...\r`);

    try {
      const info = await fetchCryptoInfo(id);
      if (info) {
        infoMap.set(id, info);
      } else {
        errors.push(id);
      }
    } catch (err) {
      console.error(`\nError fetching id=${id}: ${err}`);
      errors.push(id);
    }

    await sleep(300);
  }

  console.log(`\n\nFetched info for ${infoMap.size} tokens. Errors: ${errors.length}`);

  let enriched = 0;
  for (const asset of assets) {
    for (const token of asset.tokens ?? []) {
      const info = infoMap.get(String(token.crypto_id));
      if (info) {
        token.logo = info.logo ?? null;
        token.description = info.description ?? null;
        token.website = info.urls?.website?.[0] ?? null;
        token.twitter = info.urls?.twitter?.[0] ?? null;
        token.discord = info.urls?.chat?.[0] ?? null;
        token.tags = info.tags ?? null;
        token.date_added = info.date_added ?? null;
        token.slug = info.slug ?? null;
        enriched++;
      }
    }
  }

  console.log(`Enriched ${enriched} tokens with metadata.`);

  writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log(`Saved to: ${filePath}`);
}

main().catch(console.error);

export {};
