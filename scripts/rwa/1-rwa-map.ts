// CMC RWA Script 1: Fetch all stock RWA IDs
// Endpoint: GET /v5/real-world-assets/map
// Filters by asset_type=stock, sorted by rwa_rank
// Usage: npx tsx scripts/rwa/1-rwa-map.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

async function fetchRWAMap() {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/map`);
  url.searchParams.set("asset_type", "stock");
  url.searchParams.set("limit", "250");
  url.searchParams.set("sort", "rwa_rank");

  const res = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": CMC_API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  return data;
}

async function main() {
  console.log("Fetching RWA stock map...");
  const data = await fetchRWAMap();

  const allAssets = data.data.rwa_assets;
  const withTokens = allAssets.filter((a: { has_tokens: boolean }) => a.has_tokens);

  console.log(`\nTotal stocks: ${data.data.total_size}`);
  console.log(`Fetched: ${allAssets.length}`);
  console.log(`With tokens: ${withTokens.length}`);
  console.log(`Has more: ${data.data.has_more}`);

  console.log("\n--- Top 10 (with tokens) ---");
  for (const asset of withTokens.slice(0, 10)) {
    console.log(
      `  ${asset.rwa_rank}. ${asset.symbol} (${asset.name}) — rwa_id=${asset.rwa_id}`
    );
  }

  console.log("\n--- Full Response (with tokens only) ---");
  console.log(JSON.stringify({ ...data, data: { ...data.data, rwa_assets: withTokens } }, null, 2));
}

main().catch(console.error);
