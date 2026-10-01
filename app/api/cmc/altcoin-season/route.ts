import getConfig from "next/config";
import { NextRequest, NextResponse } from 'next/server';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: NextRequest) {
  const apiKey = serverRuntimeConfig.CMC_API_KEY || process.env.CMC_API_KEY || '';
  const timeframe = request.nextUrl.searchParams.get('timeframe') || '90d';

  try {
    const url = `https://pro-api.coinmarketcap.com/v1/altcoin-season-index/historical?timeframe=${timeframe}`;

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Altcoin Season Index' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[altcoin-season] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
