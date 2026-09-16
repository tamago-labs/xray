// CMC Crypto Script 4: OHLCV historical data by crypto_id
// Endpoint: GET /v1/cryptocurrency/ohlcv/historical
// Returns candlestick data for charts
// Usage: npx tsx scripts/crypto/4-crypto-ohlcv.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

const CRYPTO_IDS: Record<string, number> = {
  NVDAX: 36992,
};

async function fetchOHLCV(id: number, timePeriod: string, count: number) {
  const url = new URL(`${BASE_URL}/v1/cryptocurrency/ohlcv/historical`);
  url.searchParams.set("id", String(id));
  url.searchParams.set("convert", "USD");
  url.searchParams.set("time_period", timePeriod);
  url.searchParams.set("count", String(count));

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== CMC Crypto OHLCV (Historical) ===\n");

  for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
    await sleep(500);
    console.log(`--- ${symbol} (id=${id}) ---`);

    try {
      const data = await fetchOHLCV(id, "daily", 30);
      const quotes = data.data?.quotes ?? [];

      console.log(`  Time Period: daily`);
      console.log(`  Candles returned: ${quotes.length}\n`);

      for (const q of quotes.slice(-7)) {
        const ohlcv = q.quote?.USD;
        console.log(`  ${q.time_open?.slice(0, 10) ?? "N/A"}`);
        console.log(`    O: $${ohlcv?.open?.toFixed(2)} H: $${ohlcv?.high?.toFixed(2)} L: $${ohlcv?.low?.toFixed(2)} C: $${ohlcv?.close?.toFixed(2)}`);
        console.log(`    Vol: $${ohlcv?.volume?.toLocaleString()}`);
      }
    } catch (err) {
      console.log(`  Error: ${err}`);
    }
  }

  console.log("\n--- Note ---");
  console.log("time_period: hourly, daily, weekly, monthly, yearly, 5m, 10m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 6h, 12h");
}

main().catch(console.error);

// === CMC Crypto OHLCV (Historical) ===

// --- NVDAX (id=36992) ---
//   Time Period: daily
//   Candles returned: 30

//   2026-09-06
//     O: $231.15 H: $231.77 L: $231.08 C: $231.20
//     Vol: $15,265,779.43
//   2026-09-07
//     O: $231.21 H: $233.17 L: $231.11 C: $231.69
//     Vol: $6,619,551.51
//   2026-09-08
//     O: $231.69 H: $233.33 L: $225.54 C: $225.61
//     Vol: $12,101,630.36
//   2026-09-09
//     O: $225.61 H: $226.56 L: $223.57 C: $223.69
//     Vol: $93,216,242.6
//   2026-09-10
//     O: $223.72 H: $223.76 L: $217.78 C: $218.22
//     Vol: $21,271,443.9
//   2026-09-11
//     O: $218.22 H: $222.01 L: $218.18 C: $218.51
//     Vol: $15,121,113.29
//   2026-09-12
//     O: $218.51 H: $219.66 L: $218.48 C: $218.76
//     Vol: $6,779,745.57

// --- Note ---
// time_period: hourly, daily, weekly, monthly, yearly, 5m, 10m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 6h, 12h