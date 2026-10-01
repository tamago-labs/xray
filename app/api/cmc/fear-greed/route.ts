import getConfig from "next/config";
import { NextRequest, NextResponse } from 'next/server';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: NextRequest) {
  const history = request.nextUrl.searchParams.get('history');
  const apiKey = serverRuntimeConfig.CMC_API_KEY || process.env.CMC_API_KEY || '';

  try {
    let url: string;
    if (history === 'true') {
      url = 'https://pro-api.coinmarketcap.com/v1/fear-and-greed/historical?limit=90';
    } else {
      url = 'https://pro-api.coinmarketcap.com/v1/fear-and-greed/latest';
    }

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Fear & Greed data' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[cmc fear-greed] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
