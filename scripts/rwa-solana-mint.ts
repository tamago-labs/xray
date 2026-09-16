// Solana Mint Enrichment: Attach mint address, decimals, verified from Jupiter
// Reads rwa-v1-list.json, searches Jupiter V2 per token symbol, attaches Solana data
// Usage: npx tsx scripts/rwa-solana-mint.ts

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const JUP_BASE = "https://api.jup.ag/tokens/v2";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface JupiterToken {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  isVerified: boolean;
  usdPrice: number;
  liquidity: number;
  fdv: number;
  mcap: number;
  tags: string[];
}

async function searchToken(query: string, retries = 3): Promise<JupiterToken[]> {
  for (let i = 0; i < retries; i++) {
    const url = new URL(`${JUP_BASE}/search`);
    url.searchParams.set("query", query);
    const res = await fetch(url.toString());
    if (res.ok) {
      const results = await res.json();
      return results as JupiterToken[];
    }
    if (res.status === 429) {
      await sleep(2000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} for query=${query}`);
  }
  return [];
}

async function main() {
  const filePath = join(process.cwd(), "lib", "data", "rwa-v1-list.json");
  const raw = readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  const assets = json.assets;

  const symbolSet = new Set<string>();
  for (const asset of assets) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol) {
        symbolSet.add(token.symbol);
      }
    }
  }

  const uniqueSymbols = [...symbolSet];
  console.log(`Found ${uniqueSymbols.length} unique token symbols to search...\n`);

  const mintMap = new Map<string, { mint: string; decimals: number; verified: boolean }>();
  let fetched = 0;
  const errors: string[] = [];

  for (const sym of uniqueSymbols) {
    fetched++;
    process.stdout.write(`  ${fetched}/${uniqueSymbols.length} (${sym})...\r`);

    try {
      const results = await searchToken(sym);
      const match = results.find((t) => t.symbol === sym);
      if (match) {
        mintMap.set(sym, {
          mint: match.id,
          decimals: match.decimals,
          verified: match.isVerified,
        });
      } else {
        errors.push(sym);
      }
    } catch (err) {
      console.error(`\nError searching ${sym}: ${err}`);
      errors.push(sym);
    }

    await sleep(500);
  }

  console.log(`\n\nFound mint data for ${mintMap.size} tokens. No match: ${errors.length}`);

  let enriched = 0;
  for (const asset of assets) {
    for (const token of asset.tokens ?? []) {
      const data = mintMap.get(token.symbol);
      if (data) {
        token.mint = data.mint;
        token.decimals = data.decimals;
        token.verified = data.verified;
        enriched++;
      } else {
        token.mint = null;
        token.decimals = null;
        token.verified = null;
      }
    }
  }

  console.log(`Enriched ${enriched} tokens with mint data.`);

  writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log(`Saved to: ${filePath}`);
}

main().catch(console.error);
