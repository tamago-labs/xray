import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

const { serverRuntimeConfig } = getConfig();

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const apiKey = serverRuntimeConfig.CMC_API_KEY || process.env.CMC_API_KEY || "";
  const cryptoId = request.nextUrl.searchParams.get("crypto_id");
  const interval = request.nextUrl.searchParams.get("interval") || "1d";
  const count = request.nextUrl.searchParams.get("count") || "90";

  if (!cryptoId) {
    return NextResponse.json({ error: "crypto_id required" }, { status: 400 });
  }

  const cacheKey = `${cryptoId}-${interval}-${count}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const url = new URL("https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical");
    url.searchParams.set("id", cryptoId);
    url.searchParams.set("convert", "USD");
    url.searchParams.set("interval", interval);
    url.searchParams.set("count", count);
    url.searchParams.set("aux", "price");

    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `CMC HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const tokenData = json.data?.[cryptoId] ?? json.data?.[Number(cryptoId)];

    if (!tokenData?.quotes) {
      setCache(cacheKey, { data: [] });
      return NextResponse.json({ data: [] });
    }

    const prices = tokenData.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.timestamp).getTime() / 1000),
      price: q.quote?.USD?.price ?? 0,
    }));

    const result = { data: prices };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cmc-price-history] error:", err);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
