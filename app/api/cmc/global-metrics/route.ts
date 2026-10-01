import getConfig from "next/config";
import { NextRequest, NextResponse } from 'next/server';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: NextRequest) {
  const apiKey = serverRuntimeConfig.CMC_API_KEY || process.env.CMC_API_KEY || '';

  try {
    const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest?convert=USD';

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch global metrics' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[cmc global-metrics] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
