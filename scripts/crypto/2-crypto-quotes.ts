// CMC Crypto Script 2: Latest quotes by crypto_id
// Endpoint: GET /v2/cryptocurrency/quotes/latest
// Returns price, volume, % changes, market cap, supply
// Usage: npx tsx scripts/crypto/2-crypto-quotes.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

// Known RWA token crypto_ids
const CRYPTO_IDS: Record<string, number> = {
  NVDAX: 36992,
};

async function fetchQuotes(id: number) {
  const url = new URL(`${BASE_URL}/v2/cryptocurrency/quotes/latest`);
  url.searchParams.set("id", String(id));
  url.searchParams.set("convert", "USD");

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== CMC Crypto Quotes ===\n");

  for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
    await sleep(300);

    try {
      const data = await fetchQuotes(id);
      const quote = data.data?.[String(id)];

      if (!quote) {
        console.log(`${symbol} (id=${id}): No data`);
        continue;
      }

      const usd = quote.quote?.USD;
      console.log(`${symbol} — ${quote.name}`);
      console.log(`  Price: $${usd?.price?.toLocaleString() ?? "N/A"}`);
      console.log(`  Market Cap: $${usd?.market_cap?.toLocaleString() ?? "N/A"}`);
      console.log(`  Volume 24h: $${usd?.volume_24h?.toLocaleString() ?? "N/A"}`);
      console.log(`  % 1h: ${usd?.percent_change_1h ?? "N/A"}%`);
      console.log(`  % 24h: ${usd?.percent_change_24h ?? "N/A"}%`);
      console.log(`  % 7d: ${usd?.percent_change_7d ?? "N/A"}%`);
      console.log(`  % 30d: ${usd?.percent_change_30d ?? "N/A"}%`);
      console.log(`  Circulating Supply: ${quote.circulating_supply?.toLocaleString() ?? "N/A"}`);
      console.log(`  Total Supply: ${quote.total_supply?.toLocaleString() ?? "N/A"}`);
      console.log(`  Max Supply: ${quote.max_supply?.toLocaleString() ?? "N/A"}`);
      console.log(`  Last Updated: ${usd?.last_updated}`);
      console.log("");
    } catch (err) {
      console.log(`${symbol} (id=${id}): Error - ${err}`);
    }
  }
}

main().catch(console.error);


// === CMC Crypto Quotes ===

// NVDAX — NVIDIA tokenized stock (xStock)
//   Price: $214.539
//   Market Cap: $38,445,013.187
//   Volume 24h: $5,801,198.008
//   % 1h: -0.13520495%
//   % 24h: -2.26414541%
//   % 7d: -7.30965887%
//   % 30d: -5.14244483%
//   Circulating Supply: 179,198.528
//   Total Supply: 1,023,548.484
//   Max Supply: N/A
//   Last Updated: 2026-09-13T13:39:04.000Z
