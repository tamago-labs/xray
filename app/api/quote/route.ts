import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/quote";

function sign(timestamp: string, method: string, requestPath: string): string {
  const prehash = timestamp + method + requestPath;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const fromTokenAddress = params.get("fromTokenAddress");
  const toTokenAddress = params.get("toTokenAddress");
  const amount = params.get("amount");

  if (!fromTokenAddress || !toTokenAddress || !amount) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("chainIndex", "196");
    url.searchParams.set("amount", amount);
    url.searchParams.set("fromTokenAddress", fromTokenAddress);
    url.searchParams.set("toTokenAddress", toTokenAddress);

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

    return NextResponse.json({ quote: json.data[0] });
  } catch (err) {
    console.error("Quote fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
