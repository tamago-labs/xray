// Jupiter Token Lookup V2: Find Solana mint addresses for RWA/xStock tokens
// New API: https://api.jup.ag/tokens/v2/
// Endpoints: /strict (list), /search, /tag (e.g. tag=stocks)
// Usage: npx tsx scripts/dex/2-jupiter-token-lookup.ts

const JUP_BASE = "https://api.jup.ag/tokens/v2";

async function fetchStrictList() {
  const res = await fetch(`${JUP_BASE}/strict`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchByTag(tag: string) {
  const url = new URL(`${JUP_BASE}/tag`);
  url.searchParams.set("tag", tag);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchToken(query: string) {
  const url = new URL(`${JUP_BASE}/search`);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log("=== Jupiter V2 Token Lookup for RWA/xStock Tokens ===\n");

  // Method 1: Get all tokens tagged "stocks"
  console.log("--- Tag: stocks ---");
  try {
    const tagResult = await fetchByTag("stocks");
    const stocksTokens = Array.isArray(tagResult) ? tagResult : tagResult.data ?? tagResult.tokens ?? [];
    console.log(`Found ${stocksTokens.length} tokens tagged "stocks"\n`);

    for (const t of stocksTokens.slice(0, 20)) {
      console.log(`  ${t.symbol} — ${t.name}`);
      console.log(`    Mint: ${t.id}`);
      console.log(`    Decimals: ${t.decimals}`);
      console.log(`    Verified: ${t.isVerified}`);
      console.log(`    Price: $${t.usdPrice}`);
      console.log(`    Liquidity: $${t.liquidity}`);
      console.log("");
    }

    if (stocksTokens.length > 0) {
      const { writeFileSync } = await import("fs");
      const { join } = await import("path");
      const outPath = join(process.cwd(), "lib", "data", "jupiter-stocks.json");
      writeFileSync(outPath, JSON.stringify(stocksTokens, null, 2));
      console.log(`Saved full list to: ${outPath}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }

  // Method 2: Search for specific tokens
  console.log("\n--- Search: NVDA ---");
  try {
    const results = await searchToken("NVDA");
    for (const t of results.slice(0, 5)) {
      console.log(`  ${t.symbol} — ${t.name} (${t.id})`);
      console.log(`    Verified: ${t.isVerified}, Price: $${t.usdPrice}, Liq: $${t.liquidity}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

main().catch(console.error);


// PS C:\projects\zivic> npx tsx scripts/dex/2-jupiter-token-lookup.ts
// === Jupiter V2 Token Lookup for RWA/xStock Tokens ===

// --- Tag: stocks ---
// Found 0 tokens tagged "stocks"


// --- Search: NVDA ---
//   NVDAx — NVIDIA xStock (Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh)
//     Verified: true, Price: $214.54434739817083, Liq: $1853725.5305809933
//   NVDAon — NVIDIA (Ondo Tokenized) (gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo)
//     Verified: true, Price: $214.03978951285694, Liq: $491.5198583785967
//   NVDGE — NVDA Doge (Aigf5pKPyZW8nzxCrHEisE4tZMiUhFpKie8mYE7cmj6c)
//     Verified: undefined, Price: $0.00026495142871200245, Liq: $35470.77982423241
//   NVDA — NVDA (7mEB8LcjGAuREb6j74wgHJ62MLSYxvnLTRaVG7Rzpump)
//     Verified: undefined, Price: $0.0000050826799575978686, Liq: $6722.189561784381
//   Nvidia — NVDAChipPalantirJensonGPU6900 (Aza1JDLUB7kxDB2wZTAiHMpU42G8CGYTi6cAC4W4pump)
//     Verified: undefined, Price: $0.000002805353225141068, Liq: $2997.5059252390192

export {};