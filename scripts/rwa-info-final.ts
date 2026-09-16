// CMC RWA: Fetch info for active stocks, build final clean list
// Reads rwa-active-stocks.json, fetches metadata, outputs rwa-v1-list.json
// Usage: npx tsx scripts/rwa-info-final.ts

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";
const BATCH_SIZE = 25;

const ALLOWED_ISSUERS = new Set([
  "6878977dcbbf471de3366e85",
  "688ca4ccabae9b5b9fb3167a",
]);

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchInfo(symbols: string[]) {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/info`);
  url.searchParams.set("symbol", symbols.join(","));

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return data.data?.rwa_assets ?? [];
}

async function main() {
  const inputPath = join(process.cwd(), "lib", "data", "rwa-active-stocks.json");
  const raw = readFileSync(inputPath, "utf-8");
  const { assets } = JSON.parse(raw);

  const symbols = assets.map((a: any) => a.symbol);
  console.log(`Fetching info for ${symbols.length} active stocks...\n`);

  const infoMap = new Map<string, any>();

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const progress = Math.min(i + BATCH_SIZE, symbols.length);
    process.stdout.write(`  Fetching ${progress}/${symbols.length}...\r`);

    try {
      const info = await fetchInfo(batch);
      for (const item of info) {
        infoMap.set(item.symbol, item);
      }
    } catch (err) {
      console.error(`\nError fetching batch: ${err}`);
    }

    if (i + BATCH_SIZE < symbols.length) {
      await sleep(2500);
    }
  }

  const finalList = assets
    .map((asset: any) => {
      const info = infoMap.get(asset.symbol);
      const tokens = (asset.tokens ?? []).filter((t: any) =>
        ALLOWED_ISSUERS.has(t.issuer_id)
      );
      return {
        symbol: asset.symbol,
        name: asset.name,
        slug: asset.slug,
        rwa_id: asset.rwa_id,
        rwa_rank: asset.rwa_rank,
        tokens,
        website: info?.website ?? null,
        industry: info?.industry ?? null,
        founded: info?.founded ?? null,
        employees: info?.employees ?? null,
        exchange: info?.primary_exchange ?? null,
        description: info?.about?.description ?? null,
      };
    })
    .filter((asset: any) => asset.tokens.length > 0);

  const outputPath = join(process.cwd(), "lib", "data", "rwa-v1-list.json");
  writeFileSync(outputPath, JSON.stringify({
    fetched_at: new Date().toISOString(),
    count: finalList.length,
    assets: finalList,
  }, null, 2));

  console.log(`\n\nSaved ${finalList.length} stocks to: ${outputPath}`);

  console.log(`\n--- Sample (first 5) ---`);
  for (const a of finalList.slice(0, 5)) {
    console.log(`  ${a.symbol.padEnd(8)} ${a.name.padEnd(25)} ${a.exchange ?? "N/A"}`);
  }
}

main().catch(console.error);
