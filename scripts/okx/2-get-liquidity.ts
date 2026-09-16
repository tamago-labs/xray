// OKX DEX Script 2: Get all liquidity sources on X Layer
// Endpoint: GET /api/v6/dex/aggregator/get-liquidity
// Chain: X Layer (chainIndex=196)
// Usage: npx tsx scripts/okx/2-get-liquidity.ts

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

const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/get-liquidity";
const CHAIN_INDEX = "196";

interface LiquiditySource {
  id: string;
  name: string;
  logo: string;
}

interface ApiResponse {
  code: string;
  data: LiquiditySource[];
  msg: string;
}

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

async function main() {
  console.log(`=== OKX DEX: Liquidity Sources on X Layer (chainIndex=${CHAIN_INDEX}) ===\n`);

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

  const sources = json.data;
  console.log(`Total liquidity sources: ${sources.length}\n`);

  console.log(`${"ID".padEnd(6)} ${"Name".padEnd(25)} Logo`);
  console.log("─".repeat(100));

  for (const s of sources) {
    console.log(`${s.id.padEnd(6)} ${s.name.padEnd(25)} ${s.logo}`);
  }

  console.log("\n--- Raw Response (first 5) ---");
  console.log(JSON.stringify(sources.slice(0, 5), null, 2));
}

main().catch(console.error);


// === OKX DEX: Liquidity Sources on X Layer (chainIndex=196) ===

// Fetching: https://web3.okx.com/api/v6/dex/aggregator/get-liquidity?chainIndex=196

// Total liquidity sources: 46

// ID     Name                      Logo
// ────────────────────────────────────────────────────────────────────────────────────────────────────
// 34     Uniswap V2                https://static.okx.com/cdn/web3/dex/logo/uniswap_v2.png
// 6484   Community AMM (V2)        https://static.okx.com/cdn/web3/dex/logo/community_amm_v2.png
// 53     Uniswap V3                https://static.okx.com/cdn/web3/dex/logo/uniswap_v3.png
// 6534   Community AMM (V3)        https://static.okx.com/cdn/web3/dex/logo/community_amm_v3.png
// 93     LFGSwap                   https://static.okx.com/cdn/web3/dex/logo/lfgswap.png
// 169    QuickSwap V3              https://static.okx.com/cdn/web3/dex/logo/quickswap_v3.png
// 230    Aave V3                   https://static.okx.com/cdn/web3/dex/logo/aave_v3.png
// 194    iZUMi                     https://static.okx.com/cdn/web3/dex/logo/izumi.png
// 330    CurveNG                   https://static.okx.com/cdn/web3/dex/logo/curveng.png
// 318    DackieSwap V2             https://static.okx.com/cdn/web3/dex/logo/dackieswap_v2.png
// 350    DackieSwap V3             https://static.okx.com/cdn/web3/dex/logo/dackieswap_v3.png
// 317    X Layer Swap              https://static.okx.com/cdn/web3/dex/logo/x_layer_swap.png
// 294    DYOR swap                 https://static.okx.com/cdn/web3/dex/logo/dyor_swap.png
// 516    DYOR Fun                  https://static.okx.com/cdn/web3/dex/logo/dyor_fun.png
// 6685   DYOR Fun V2               https://static.okx.com/cdn/web3/dex/logo/dyor_fun_v2.png
// 6691   Ignix                     https://static.okx.com/cdn/web3/dex/logo/ignix.png
// 6696   XLaunch.fun               https://static.okx.com/cdn/web3/dex/logo/xlaunch_fun.png
// 321    Revoswap V2               https://static.okx.com/cdn/web3/dex/logo/revoswap_v2.png
// 322    Revoswap V3               https://static.okx.com/cdn/web3/dex/logo/revoswap_v3.png
// 340    StationDEX V3             https://static.okx.com/cdn/web3/dex/logo/stationdex_v3.png
// 325    PotatoSwap                https://static.okx.com/cdn/web3/dex/logo/potatoswap.png
// 406    Native V3                 https://static.okx.com/cdn/web3/dex/logo/native_v3.png
// 438    Uniswap V4                https://static.okx.com/cdn/web3/dex/logo/uniswap_v4.png
// 517    OkieSwap V2               https://static.okx.com/cdn/web3/dex/logo/okieswap_v2.png
// 518    OkieSwap V3               https://static.okx.com/cdn/web3/dex/logo/okieswap_v3.png
// 520    Oko swap                  https://static.okx.com/cdn/web3/dex/logo/oko_swap.png
// 526    flapdotsh                 https://static.okx.com/cdn/web3/dex/logo/flapdotsh.png
// 550    Xdock.meme                https://static.okx.com/cdn/web3/dex/logo/xdock_meme.png
// 549    Xdock                     https://static.okx.com/cdn/web3/dex/logo/xdock.png
// 580    DYOR swap V3              https://static.okx.com/cdn/web3/dex/logo/dyor_swap_v3.png
// 581    JaceSwap                  https://static.okx.com/cdn/web3/dex/logo/jaceswap.png
// 582    SlerfSwap                 https://static.okx.com/cdn/web3/dex/logo/slerfswap.png
// 579    DFSwap                    https://static.okx.com/cdn/web3/dex/logo/dfswap.png
// 586    Inswap                    https://static.okx.com/cdn/web3/dex/logo/inswap.png
// 591    PotatoSwap V3             https://static.okx.com/cdn/web3/dex/logo/potatoswap_v3.png
// 6483   OkieStableSwap            https://static.okx.com/cdn/web3/dex/logo/okiestableswap.png
// 6487   DFS Swap V3               https://static.okx.com/cdn/web3/dex/logo/dfs_swap_v3.png
// 6494   Uniswap V4 - Aegis V1.1 Hook https://static.okx.com/cdn/web3/dex/logo/uniswap_v4_aegis_v1_1_hook.png
// 6588   ElfomoFi                  https://static.okx.com/cdn/web3/dex/logo/elfomofi.png
// 6596   Uniswap V4 - Community Hook https://static.okx.com/cdn/web3/dex/logo/uniswap_v4_community_hook.png
// 6636   Printr                    https://static.okx.com/cdn/web3/dex/logo/printr.png
// 6642   Eulr                      https://static.okx.com/cdn/web3/dex/logo/eulr.png
// 6669   xStocks wrap V2           https://static.okx.com/cdn/web3/dex/logo/xstocks_wrap_v2.png
// 6652   Caliber propAMM           https://static.okx.com/cdn/web3/dex/logo/caliber_propamm.png
// 6658   BinaryFi                  https://static.okx.com/cdn/web3/dex/logo/binaryfi.png
// 6660   Centrifuge                https://static.okx.com/cdn/web3/dex/logo/centrifuge.png

// --- Raw Response (first 5) ---
// [
//   {
//     "id": "34",
//     "logo": "https://static.okx.com/cdn/web3/dex/logo/uniswap_v2.png",
//     "name": "Uniswap V2"
//   },
//   {
//     "id": "6484",
//     "logo": "https://static.okx.com/cdn/web3/dex/logo/community_amm_v2.png",
//     "name": "Community AMM (V2)"
//   },
//   {
//     "id": "53",
//     "logo": "https://static.okx.com/cdn/web3/dex/logo/uniswap_v3.png",
//     "name": "Uniswap V3"
//   },
//   {
//     "id": "6534",
//     "logo": "https://static.okx.com/cdn/web3/dex/logo/community_amm_v3.png",
//     "name": "Community AMM (V3)"
//   },
//   {
//     "id": "93",
//     "logo": "https://static.okx.com/cdn/web3/dex/logo/lfgswap.png",
//     "name": "LFGSwap"
//   }
// ]