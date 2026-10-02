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
  const apiKey = serverRuntimeConfig.MASSIVE_API_KEY || process.env.MASSIVE_API_KEY || "";
  const symbol = request.nextUrl.searchParams.get("symbol");
  const timespan = request.nextUrl.searchParams.get("timespan") || "day";
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");



  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "MASSIVE_API_KEY not configured" }, { status: 500 });
  }

  const cacheKey = `${symbol}-${timespan}-${from}-${to}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const now = new Date();
    const toDate = to || now.toISOString().split("T")[0];
    const fromDate = from || new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0];

    const url = `https://api.massive.com/v2/aggs/ticker/${symbol}/range/1/${timespan}/${fromDate}/${toDate}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Massive HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();

    if (!json.results) {
      setCache(cacheKey, { data: [] });
      return NextResponse.json({ data: [] });
    }

    const prices = json.results.map((bar: any) => ({
      time: Math.floor(bar.t / 1000),
      price: bar.c ?? 0,
    }));

    const result = { data: prices };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[stock-price-history] error:", err);
    return NextResponse.json({ error: "Failed to fetch stock price history" }, { status: 500 });
  }
}
