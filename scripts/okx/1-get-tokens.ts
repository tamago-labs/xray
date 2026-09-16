// OKX DEX Script 1: Get all tokens on X Layer
// Endpoint: GET /api/v6/dex/aggregator/all-tokens
// Chain: X Layer (chainIndex=196)
// Usage: npx tsx scripts/okx/1-get-tokens.ts

import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;

if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
  console.error("Error: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE required in .env.local");
  process.exit(1);
}

const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/all-tokens";
const CHAIN_INDEX = "196";

interface Token {
  decimals: string;
  tokenContractAddress: string;
  tokenLogoUrl: string;
  tokenName: string;
  tokenSymbol: string;
}

interface ApiResponse {
  code: string;
  data: Token[];
  msg: string;
}

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

async function main() {
  console.log(`=== OKX DEX: Tokens on X Layer (chainIndex=${CHAIN_INDEX}) ===\n`);

  const url = new URL(BASE_URL);
  url.searchParams.set("chainIndex", CHAIN_INDEX);

  const path = url.pathname + url.search;
  const timestamp = new Date().toISOString();
  const signature = sign(timestamp, "GET", path);

  console.log(`Fetching: ${url.toString()}\n`);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "OK-ACCESS-KEY": OKX_API_KEY!,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE!,
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const json = (await res.json()) as ApiResponse;

  if (json.code !== "0") {
    console.error(`API error: code=${json.code}, msg=${json.msg}`);
    process.exit(1);
  }

  const tokens = json.data;
  console.log(`Total tokens: ${tokens.length}\n`);

  console.log(
    `${"Symbol".padEnd(12)} ${"Name".padEnd(25)} ${"Decimals".padEnd(8)} Contract Address`
  );
  console.log("─".repeat(100));

  for (const t of tokens) {
    console.log(
      `${t.tokenSymbol.padEnd(12)} ${(t.tokenName ?? "").padEnd(25)} ${t.decimals.padEnd(8)} ${t.tokenContractAddress}`
    );
  }

  console.log("\n--- Raw Response (first 5) ---");
  console.log(JSON.stringify(tokens.slice(0, 5), null, 2));
}

main().catch(console.error);


// ◇ injected env (6) from .env.local // tip: ⌘ override existing { override: true }
// === OKX DEX: Tokens on X Layer (chainIndex=196) ===

// Fetching: https://web3.okx.com/api/v6/dex/aggregator/all-tokens?chainIndex=196

// Total tokens: 662

// Symbol       Name                      Decimals Contract Address
// ────────────────────────────────────────────────────────────────────────────────────────────────────
// USDG         Global Dollar             6        0x4ae46a509f6b1d9056937ba4500cb143933d2dc8
// USDT         USD₮0                     6        0x779ded0c9e1022225f8e0630b35a9b54be713736
// USDC         USDC                      6        0xb6ceceab302e2e4948951ee7843fc24e92933061
// ETH          Ethereum                  18       0xe7b000003a45145decf8a28fc755ad5ec5ea025a
// SOL          Solana                    9        0x505000008de8748dbd4422ff4687a4fc9beba15b
// OKB          X Layer                   18       0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
// AZNx         AstraZeneca xStock        18       0x5d642505fe1a28897eb3baba665f454755d8daa2
// ASMLx        ASML xStock               18       0xc0b417e7f83db438631eb5e096684dd742e5294f
// APPx         AppLovin xStock           18       0x50a1291f69d9d3853def8209cfb1af0b46927be1
// ACNx         Accenture xStock          18       0x03183ce31b1656b72a55fa6056e287f50c35bbeb
// ASTSx        AST SpaceMobile xStock    18       0x89b2607878ae19bab8020b8140ed550ef3e953bb