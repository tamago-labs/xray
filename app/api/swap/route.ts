import crypto from "crypto";
import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

const { serverRuntimeConfig } = getConfig();
const OKX_API_KEY = serverRuntimeConfig.OKX_API_KEY || process.env.OKX_API_KEY;
const OKX_SECRET_KEY = serverRuntimeConfig.OKX_SECRET_KEY || process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = serverRuntimeConfig.OKX_PASSPHRASE || process.env.OKX_PASSPHRASE;
const SWAP_URL = "https://web3.okx.com/api/v6/dex/aggregator/swap";

function sign(timestamp: string, method: string, requestPath: string): string {
  const prehash = timestamp + method + requestPath;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const fromTokenAddress = params.get("fromTokenAddress");
  const toTokenAddress = params.get("toTokenAddress");
  const amount = params.get("amount");
  const userWalletAddress = params.get("userWalletAddress");
  const slippagePercent = params.get("slippagePercent") || "0.5";

  if (!fromTokenAddress || !toTokenAddress || !amount || !userWalletAddress) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const url = new URL(SWAP_URL);
    url.searchParams.set("chainIndex", "196");
    url.searchParams.set("amount", amount);
    url.searchParams.set("fromTokenAddress", fromTokenAddress);
    url.searchParams.set("toTokenAddress", toTokenAddress);
    url.searchParams.set("userWalletAddress", userWalletAddress);
    url.searchParams.set("slippagePercent", slippagePercent);

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
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();

    if (json.code !== "0") {
      return NextResponse.json({ error: json.msg || "API error" }, { status: 400 });
    }

    return NextResponse.json({ swap: json.data[0] });
  } catch (err) {
    console.error("Swap fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch swap data" }, { status: 500 });
  }
}
