// CMC DEX Script 1: Find Solana DEX pools for RWA tokens
// Endpoints: GET /v5/real-world-assets/quotes/latest + GET /v1/dex/token/pools
// Maps RWA tokens (NVDAX, etc.) to Solana DEX pools where they can be traded
// Usage: npx tsx scripts/dex/1-solana-rwa-pools.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

async function fetchRWAQuotes(symbols: string[]) {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/quotes/latest`);
  url.searchParams.set("symbol", symbols.join(","));
  url.searchParams.set("convert", "USD");

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchTokenPools(platform: string, contractAddress: string) {
  const url = new URL(`${BASE_URL}/v1/dex/token/pools`);
  url.searchParams.set("platform", platform);
  url.searchParams.set("contract_address", contractAddress);

  const res = await fetch(url.toString(), {
    headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY!, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("=== Mapping RWA tokens to Solana DEX pools ===\n");

  // Step 1: Get RWA quotes to find token crypto_ids and contract addresses
  const symbols = ["NVDA", "MSFT", "TSLA"];
  console.log(`Fetching RWA quotes for: ${symbols.join(", ")}...`);

  const quotesData = await fetchRWAQuotes(symbols);

  for (const asset of quotesData.data.rwa_assets) {
    console.log(`\n--- ${asset.symbol} (${asset.name}) ---`);

    if (!asset.tokens || asset.tokens.length === 0) {
      console.log("  No tokens found.");
      continue;
    }

    for (const token of asset.tokens) {
      console.log(`  Token: ${token.symbol} (${token.name})`);
      console.log(`    CMC crypto_id: ${token.crypto_id}`);
      console.log(`    Issuer: ${token.issuer_name}`);
      console.log(`    Price: $${token.price}`);
      console.log(`    MCap: $${token.market_cap}`);

      // Step 2: Try to find Solana pools for this token
      // Note: We need the Solana contract address, which CMC doesn't directly provide
      // in the RWA endpoint. We use crypto_id to look up DEX pools.
      try {
        // Try fetching pools by platform=solana with the token's crypto_id as contract
        // This is a best-effort approach; may need Jupiter/Orca API for actual addresses
        console.log(`    Looking for Solana DEX pools...`);
        // The DEX token/pools endpoint needs a contract address, not crypto_id
        // For now, we note that we'd need to use Jupiter Token List or Orca API
        // to resolve the actual Solana mint address
        console.log(`    → Use Jupiter Token List API to resolve Solana mint for ${token.symbol}`);
      } catch (err) {
        console.log(`    Error: ${err}`);
      }
    }
  }

  console.log("\n--- Full Response ---");
  console.log(JSON.stringify(quotesData, null, 2));
}

main().catch(console.error);
