import type { Schema } from "../../data/resource";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/ohlcv-fetcher";

const { resourceConfig } = await getAmplifyDataClientConfig(env as any);

const CMC_API_KEY = env.CMC_API_KEY ?? "";
const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";

export const handler: Schema["ohlcvFetcher"]["functionHandler"] = async (event) => {
  try {
    const { cryptoId, interval, timeStart, timeEnd } = event.arguments as any;

    if (!cryptoId || !CMC_API_KEY) {
      return { data: [] };
    }

    const url = new URL(`${CMC_BASE_URL}/v2/cryptocurrency/ohlcv/historical`);
    url.searchParams.set("id", String(cryptoId));
    url.searchParams.set("convert", "USD");
    url.searchParams.set("time_start", timeStart);
    url.searchParams.set("time_end", timeEnd);
    url.searchParams.set("interval", interval);

    const res = await fetch(url.toString(), {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, Accept: "application/json" },
    });
    const json = await res.json();
    const cryptoData = json.data;
    if (!cryptoData?.quotes) return { data: [] };

    const candles = cryptoData.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.time_open).getTime() / 1000),
      open: q.quote?.USD?.open ?? 0,
      high: q.quote?.USD?.high ?? 0,
      low: q.quote?.USD?.low ?? 0,
      close: q.quote?.USD?.close ?? 0,
      volume: q.quote?.USD?.volume ?? 0,
    }));

    return { data: candles };
  } catch (err) {
    console.error("[ohlcv-fetcher] Error:", err);
    return { error: "Failed to fetch OHLCV" };
  }
};
