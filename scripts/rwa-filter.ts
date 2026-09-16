// CMC RWA: Filter active stocks by tokenized market cap
// Reads rwa-stocks.json, fetches quotes, filters by tokenized_market_cap > $50K
// Usage: npx tsx scripts/rwa-filter.ts

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";
const MIN_MARKET_CAP = 50_000;
const BATCH_SIZE = 25;

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

async function fetchQuotes(symbols: string[]): Promise<any[]> {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/quotes/latest`);
  url.searchParams.set("symbol", symbols.join(","));
  url.searchParams.set("convert", "USD");

  const res = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": CMC_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return data.data?.rwa_assets ?? [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const jsonPath = join(process.cwd(), "lib", "data", "rwa-stocks.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const { assets } = JSON.parse(raw);

  const allSymbols = assets.map((a: any) => a.symbol);
  console.log(`Total RWA stocks in rwa-stocks.json: ${allSymbols.length}`);
  console.log(`Filtering by tokenized_market_cap > $${MIN_MARKET_CAP.toLocaleString()}...\n`);

  const active: any[] = [];
  const inactive: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
    const batch = allSymbols.slice(i, i + BATCH_SIZE);
    const progress = Math.min(i + BATCH_SIZE, allSymbols.length);
    process.stdout.write(`  Fetching ${progress}/${allSymbols.length}...\r`);

    try {
      const quotes = await fetchQuotes(batch);
      const quoteMap = new Map(quotes.map((q: any) => [q.symbol, q]));

      for (const symbol of batch) {
        const asset = assets.find((a: any) => a.symbol === symbol);
        const quote = quoteMap.get(symbol);

        if (!quote) {
          errors.push(symbol);
          continue;
        }

        const mcap = quote.tokenized_market_cap ?? 0;
        if (mcap >= MIN_MARKET_CAP) {
          active.push({
            symbol,
            name: asset.name,
            slug: asset.slug,
            rwa_id: asset.rwa_id,
            rwa_rank: asset.rwa_rank,
            tokenized_market_cap: mcap,
            tokenized_volume_24h: quote.tokenized_volume_24h ?? 0,
            tokenized_price: quote.average_tokenized_price ?? null,
            tokens: quote.tokens?.map((t: any) => ({
              symbol: t.symbol,
              name: t.name,
              price: t.price,
              crypto_id: t.crypto_id,
              issuer_id: t.issuer_id,
              issuer_name: t.issuer_name,
              market_cap: t.market_cap,
              volume_24h: t.volume_24h,
            })) ?? [],
          });
        } else {
          inactive.push({ symbol, name: asset.name, tokenized_market_cap: mcap });
        }
      }
    } catch (err) {
      for (const s of batch) errors.push(s);
    }

    if (i + BATCH_SIZE < allSymbols.length) {
      await sleep(2500);
    }
  }

  active.sort((a, b) => b.tokenized_market_cap - a.tokenized_market_cap);

  console.log(`\n\nResults:`);
  console.log(`  Active   (MCap > $${MIN_MARKET_CAP.toLocaleString()}): ${active.length}`);
  console.log(`  Inactive (MCap < $${MIN_MARKET_CAP.toLocaleString()}): ${inactive.length}`);
  console.log(`  Errors   (no data):     ${errors.length}`);

  const outputPath = join(process.cwd(), "lib", "data", "rwa-active-stocks.json");
  writeFileSync(outputPath, JSON.stringify({
    fetched_at: new Date().toISOString(),
    min_market_cap: MIN_MARKET_CAP,
    count: active.length,
    assets: active,
  }, null, 2));

  console.log(`\nSaved to: ${outputPath}`);

  console.log(`\n--- Top 15 by Market Cap ---`);
  for (const a of active.slice(0, 15)) {
    console.log(`  ${a.symbol.padEnd(8)} $${Math.round(a.tokenized_market_cap).toLocaleString().padStart(12)}  ${a.name}`);
  }

  if (errors.length > 0) {
    console.log(`\n--- Errors (${errors.length}) ---`);
    console.log(`  ${errors.slice(0, 20).join(", ")}${errors.length > 20 ? "..." : ""}`);
  }
}

main().catch(console.error);
