// CMC Crypto Script 1: Token metadata by crypto_id
// Endpoint: GET /v2/cryptocurrency/info
// Returns logo, description, website, social links, tags
// Usage: npx tsx scripts/crypto/1-crypto-info.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

// Known RWA token crypto_ids from CMC RWA quotes
const CRYPTO_IDS: Record<string, number> = {
  NVDAX: 36992,
};

async function fetchCryptoInfo(id: number) {
  const url = new URL(`${BASE_URL}/v2/cryptocurrency/info`);
  url.searchParams.set("id", String(id));

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== CMC Crypto Info ===\n");

  for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
    await sleep(300);

    try {
      const data = await fetchCryptoInfo(id);
      const info = data.data?.[String(id)];

      if (!info) {
        console.log(`${symbol} (id=${id}): No data`);
        continue;
      }

      console.log(`${symbol} — ${info.name}`);
      console.log(`  ID: ${info.id}`);
      console.log(`  Symbol: ${info.symbol}`);
      console.log(`  Category: ${info.category}`);
      console.log(`  Slug: ${info.slug}`);
      console.log(`  Logo: ${info.logo ?? "N/A"}`);
      console.log(`  Website: ${info.urls?.website?.[0] ?? "N/A"}`);
      console.log(`  Twitter: ${info.urls?.twitter?.[0] ?? "N/A"}`);
      console.log(`  Discord: ${info.urls?.chat?.[0] ?? "N/A"}`);
      console.log(`  Tags: ${info.tags?.slice(0, 8).join(", ") ?? "N/A"}`);
      console.log(`  Date Added: ${info.date_added}`);
      console.log(`  Description: ${(info.description ?? "").slice(0, 150)}...`);
      console.log("");
    } catch (err) {
      console.log(`${symbol} (id=${id}): Error - ${err}`);
    }
  }
}

main().catch(console.error);


// PS C:\projects\zivic> npx tsx scripts/crypto/1-crypto-info.ts
// ◇ injected env (3) from .env.local // tip: ⌘ suppress logs { quiet: true }
// === CMC Crypto Info ===

// NVDAX — NVIDIA tokenized stock (xStock)
//   ID: 36992
//   Symbol: NVDAX
//   Category: token
//   Slug: nvidia-tokenized-stock-xstock
//   Logo: https://s2.coinmarketcap.com/static/img/coins/64x64/36992.png
//   Website: https://assets.backed.fi/products/nvidia-xstock
//   Twitter: https://twitter.com/xStocksFi
//   Discord: https://t.me/xstocksfi
//   Tags: defi, ethereum-ecosystem, tokenized-stock, solana-ecosystem, arbitrum-ecosystem, bnb-chain-ecosystem, toncoin-ecosystem, x-layer-ecosystem
//   Date Added: 2025-07-01T07:20:20.000Z
//   Description: NVIDIA tokenized stock (xStock) (NVDAX) is a cryptocurrency and operates on the Solana platform. NVIDIA tokenized stock (xStock) has a current supply ...
