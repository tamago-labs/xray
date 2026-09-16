import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/get-liquidity";

let cachedLogos: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60;

function sign(timestamp: string, method: string, requestPath: string): string {
  const prehash = timestamp + method + requestPath;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

export async function GET(req: NextRequest) {
  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const now = Date.now();
  if (cachedLogos && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ logos: cachedLogos });
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("chainIndex", "196");

    const path = url.pathname + url.search;
    const timestamp = new Date().toISOString();
    const signature = sign(timestamp, "GET", path);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ logos: FALLBACK_LOGOS });
    }

    const json = await res.json();
    if (json.code !== "0") {
      return NextResponse.json({ logos: FALLBACK_LOGOS });
    }

    const logos: Record<string, string> = { ...FALLBACK_LOGOS };
    for (const source of json.data) {
      logos[source.name] = source.logo;
    }

    cachedLogos = logos;
    cacheTime = now;

    return NextResponse.json({ logos });
  } catch {
    return NextResponse.json({ logos: FALLBACK_LOGOS });
  }
}

const FALLBACK_LOGOS: Record<string, string> = {
  "Uniswap V2": "https://static.okx.com/cdn/web3/dex/logo/uniswap_v2.png",
  "Uniswap V3": "https://static.okx.com/cdn/web3/dex/logo/uniswap_v3.png",
  "Uniswap V4": "https://static.okx.com/cdn/web3/dex/logo/uniswap_v4.png",
  "JIT Router": "https://static.okx.com/cdn/web3/dex/logo/native.png",
  "X Layer Swap": "https://static.okx.com/cdn/web3/dex/logo/x_layer_swap.png",
  "OKX DEX": "https://static.okx.com/cdn/web3/dex/logo/native.png",
};
