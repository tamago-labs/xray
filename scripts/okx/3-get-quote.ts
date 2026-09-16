// OKX DEX Script 3: Get swap quote on X Layer
// Endpoint: GET /api/v6/dex/aggregator/quote
// Chain: X Layer (chainIndex=196)
// Usage: npx tsx scripts/okx/3-get-quote.ts

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

const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/quote";
const CHAIN_INDEX = "196";

// OKB (native) → wSPCXx
const FROM_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const TO_TOKEN = "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072";
const FROM_DECIMALS = 18;
const TO_DECIMALS = 18;

interface DexProtocol {
  dexName: string;
  percent: string;
}

interface TokenInfo {
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenUnitPrice: string;
  decimal: string;
  isHoneyPot: boolean;
  taxRate: string;
}

interface DexRouter {
  dexProtocol: DexProtocol;
  fromToken: TokenInfo;
  fromTokenIndex: string;
  toToken: TokenInfo;
  toTokenIndex: string;
}

interface Quote {
  chainIndex: string;
  swapMode: string;
  fromToken: TokenInfo;
  fromTokenAmount: string;
  toToken: TokenInfo;
  toTokenAmount: string;
  router: string;
  dexRouterList: DexRouter[];
  priceImpactPercent: string;
  tradeFee: string;
  estimateGasFee: string;
}

interface ApiResponse {
  code: string;
  data: Quote[];
  msg: string;
}

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

function formatAmount(raw: string, decimals: number): string {
  const num = Number(raw) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function getQuote(amount: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set("chainIndex", CHAIN_INDEX);
  url.searchParams.set("amount", amount);
  url.searchParams.set("fromTokenAddress", FROM_TOKEN);
  url.searchParams.set("toTokenAddress", TO_TOKEN);

  const path = url.pathname + url.search;
  const timestamp = new Date().toISOString();
  const signature = sign(timestamp, "GET", path);

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

  return (await res.json()) as ApiResponse;
}

async function main() {
  const amounts = ["1", "10", "100"];

  for (const amt of amounts) {
    const amountRaw = (Number(amt) * Math.pow(10, FROM_DECIMALS)).toString();

    console.log(`\n${"═".repeat(70)}`);
    console.log(`Quote: ${amt} OKB → wSPCXx`);
    console.log(`${"═".repeat(70)}`);

    const json = await getQuote(amountRaw);

    if (json.code !== "0") {
      console.error(`API error: code=${json.code}, msg=${json.msg}`);
      continue;
    }

    const quote = json.data[0];
    if (!quote) {
      console.log("No quote available.");
      continue;
    }

    console.log(`\nSwap Mode: ${quote.swapMode}`);
    console.log(`Price Impact: ${quote.priceImpactPercent}%`);
    console.log(`Est. Gas Fee: ${quote.estimateGasFee}`);
    console.log(`Trade Fee: $${quote.tradeFee}`);

    console.log(`\nInput:  ${formatAmount(quote.fromTokenAmount, FROM_DECIMALS)} ${quote.fromToken.tokenSymbol}`);
    console.log(`Output: ${formatAmount(quote.toTokenAmount, TO_DECIMALS)} ${quote.toToken.tokenSymbol}`);

    if (quote.fromToken.tokenUnitPrice) {
      console.log(`\nOKB Price:  $${quote.fromToken.tokenUnitPrice}`);
    }
    if (quote.toToken.tokenUnitPrice) {
      console.log(`wSPCXx Price: $${quote.toToken.tokenUnitPrice}`);
    }

    console.log(`\nRoute: ${quote.router}`);

    console.log(`\nDEX Router Breakdown:`);
    console.log("─".repeat(60));

    const seen = new Map<string, number>();
    for (const step of quote.dexRouterList) {
      const key = `${step.dexProtocol.dexName}`;
      seen.set(key, (seen.get(key) ?? 0) + Number(step.dexProtocol.percent));
    }

    for (const [name, pct] of seen) {
      console.log(`  ${name}: ${pct}%`);
    }

    console.log("\nRaw Response:");
    console.log(JSON.stringify(quote, null, 2));
  }
}

main().catch(console.error);


// PS C:\projects\xray> npx tsx scripts/okx/3-get-quote.ts
// ◇ injected env (6) from .env.local // tip: ⌘ suppress logs { quiet: true }

// ══════════════════════════════════════════════════════════════════════
// Quote: 1 OKB → wSPCXx
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: -0.14%
// Est. Gas Fee: 540000
// Trade Fee: $0.000993060049653

// Input:  1 OKB
// Output: 0.765239 wSPCXx

// OKB Price:  $110.34
// wSPCXx Price: $143.99489740506656

// Route: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   JIT Router: 200%
//   Uniswap V3: 100%

// Raw Response:
// {
//   "chainIndex": "196",
//   "contextSlot": 70785500,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
//         "tokenSymbol": "WOKB",
//         "tokenUnitPrice": "110.34"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Uniswap V3",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "2",
//       "toToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//         "tokenSymbol": "wSPCXx",
//         "tokenUnitPrice": "143.99489740506656"
//       },
//       "toTokenIndex": "3"
//     }
//   ],
//   "estimateGasFee": "540000",
//   "fromToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
//     "tokenSymbol": "OKB",
//     "tokenUnitPrice": "110.34"
//   },
//   "fromTokenAmount": "1000000000000000000",
//   "mode": "dex",
//   "priceImpactPercent": "-0.14",
//   "quoteId": "3130495545398600004",
//   "router": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//     "tokenSymbol": "wSPCXx",
//     "tokenUnitPrice": "143.99489740506656"
//   },
//   "toTokenAmount": "765239277288162298",
//   "tradeFee": "0.000993060049653"
// }

// ══════════════════════════════════════════════════════════════════════
// Quote: 10 OKB → wSPCXx
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: -0.17%
// Est. Gas Fee: 648000
// Trade Fee: $0.0011916720595836

// Input:  10 OKB
// Output: 7.649702 wSPCXx

// OKB Price:  $110.34
// wSPCXx Price: $143.99489740506656

// Route: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   JIT Router: 192.51%
//   Uniswap V4: 7.49%
//   Uniswap V3: 100%

// Raw Response:
// {
//   "chainIndex": "196",
//   "contextSlot": 70785500,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
//         "tokenSymbol": "WOKB",
//         "tokenUnitPrice": "110.34"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Uniswap V4",
//         "percent": "7.49"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "92.51"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Uniswap V3",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "2",
//       "toToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//         "tokenSymbol": "wSPCXx",
//         "tokenUnitPrice": "143.99489740506656"
//       },
//       "toTokenIndex": "3"
//     }
//   ],
//   "estimateGasFee": "648000",
//   "fromToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
//     "tokenSymbol": "OKB",
//     "tokenUnitPrice": "110.34"
//   },
//   "fromTokenAmount": "10000000000000000000",
//   "mode": "dex",
//   "priceImpactPercent": "-0.17",
//   "quoteId": "3130295545400470004",
//   "router": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//     "tokenSymbol": "wSPCXx",
//     "tokenUnitPrice": "143.99489740506656"
//   },
//   "toTokenAmount": "7649701591919689763",
//   "tradeFee": "0.0011916720595836"
// }

// ══════════════════════════════════════════════════════════════════════
// Quote: 100 OKB → wSPCXx
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: -0.51%
// Est. Gas Fee: 540000
// Trade Fee: $0.000993060049653

// Input:  100 OKB
// Output: 76.233741 wSPCXx

// OKB Price:  $110.34
// wSPCXx Price: $143.99489740506656

// Route: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   JIT Router: 200%
//   Uniswap V3: 100%

// Raw Response:
// {
//   "chainIndex": "196",
//   "contextSlot": 70785500,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
//         "tokenSymbol": "WOKB",
//         "tokenUnitPrice": "110.34"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.9991"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Uniswap V3",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
//         "tokenSymbol": "USDG",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "2",
//       "toToken": {
//         "decimal": "18",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//         "tokenSymbol": "wSPCXx",
//         "tokenUnitPrice": "143.99489740506656"
//       },
//       "toTokenIndex": "3"
//     }
//   ],
//   "estimateGasFee": "540000",
//   "fromToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
//     "tokenSymbol": "OKB",
//     "tokenUnitPrice": "110.34"
//   },
//   "fromTokenAmount": "100000000000000000000",
//   "mode": "dex",
//   "priceImpactPercent": "-0.51",
//   "quoteId": "3120895545401610001",
//   "router": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee--0x779ded0c9e1022225f8e0630b35a9b54be713736--0x4ae46a509f6b1d9056937ba4500cb143933d2dc8--0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "18",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072",
//     "tokenSymbol": "wSPCXx",
//     "tokenUnitPrice": "143.99489740506656"
//   },
//   "toTokenAmount": "76233740967947634444",
//   "tradeFee": "0.000993060049653"
// }