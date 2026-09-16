// Fetch all stock RWAs with tokens from CMC and save to lib/data/rwa-stocks.json
// Run: npx tsx scripts/fetch-all.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { join } from "path";

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

interface RWAAsset {
  name: string;
  symbol: string;
  slug: string;
  rwa_id: number;
  asset_type: string;
  rwa_rank: number;
  has_tokens: boolean;
  first_historical_data: string;
  last_historical_data: string;
}

async function fetchAllStockRWAs(): Promise<RWAAsset[]> {
  const assets: RWAAsset[] = [];
  let start = 1;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${BASE_URL}/v5/real-world-assets/map`);
    url.searchParams.set("asset_type", "stock");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("start", String(start));
    url.searchParams.set("sort", "rwa_rank");

    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY!,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`HTTP ${res.status}: ${await res.text()}`);
      process.exit(1);
    }

    const data = await res.json();
    const rwaAssets: RWAAsset[] = data.data.rwa_assets;

    const withTokens = rwaAssets.filter((a) => a.has_tokens);
    assets.push(...withTokens);

    hasMore = data.data.has_more;
    start += limit;

    console.log(`  Fetched ${rwaAssets.length} (${withTokens.length} with tokens) — total so far: ${assets.length}`);
  }

  return assets;
}

async function main() {
  console.log("Fetching all stock RWAs with tokens from CMC...\n");

  const assets = await fetchAllStockRWAs();

  console.log(`\nDone! Total stocks with tokens: ${assets.length}`);

  const output = {
    fetched_at: new Date().toISOString(),
    count: assets.length,
    assets,
  };

  const outPath = join(process.cwd(), "lib", "data", "rwa-stocks.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`Saved to: ${outPath}`);
}

main().catch(console.error);
