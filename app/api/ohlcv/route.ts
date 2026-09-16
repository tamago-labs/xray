import { NextResponse } from "next/server";

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cryptoId = searchParams.get("crypto_id");
  const timeStart = searchParams.get("time_start");
  const timeEnd = searchParams.get("time_end");
  const interval = searchParams.get("interval");


  if (!cryptoId) {
    return NextResponse.json({ error: "crypto_id required" }, { status: 400 });
  }

  if (!CMC_API_KEY) {
    return NextResponse.json({ error: "CMC_API_KEY not configured" }, { status: 500 });
  }

  const url = new URL(`${BASE_URL}/v2/cryptocurrency/ohlcv/historical`);
  url.searchParams.set("id", cryptoId);
  url.searchParams.set("convert", "USD");

  if (timeStart) url.searchParams.set("time_start", timeStart);
  if (timeEnd) url.searchParams.set("time_end", timeEnd);
  if (interval) url.searchParams.set("interval", interval);

  console.log("[OHLCV API] Fetching:", url.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `CMC HTTP ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    console.log("[OHLCV API] CMC response keys:", Object.keys(data));
    console.log("[OHLCV API] crypto_id:", cryptoId, "data.data keys:", data.data ? Object.keys(data.data) : "no data");

    const cryptoData = data.data?.id ? data.data : (data.data?.[cryptoId] ?? data.data?.[Number(cryptoId)]);

    if (!cryptoData?.quotes) {
      console.log("[OHLCV API] No quotes found");
      return NextResponse.json({ data: [] });
    }
    console.log("[OHLCV API] Found", cryptoData.quotes.length, "quotes");

    const candles = cryptoData.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.time_open).getTime() / 1000),
      open: q.quote?.USD?.open ?? 0,
      high: q.quote?.USD?.high ?? 0,
      low: q.quote?.USD?.low ?? 0,
      close: q.quote?.USD?.close ?? 0,
      volume: q.quote?.USD?.volume ?? 0,
    }));

    return NextResponse.json({ data: candles });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch OHLCV" }, { status: 500 });
  }
}
