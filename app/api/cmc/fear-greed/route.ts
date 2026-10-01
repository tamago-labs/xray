import getConfig from "next/config";
import { NextRequest, NextResponse } from 'next/server';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: NextRequest) {
  const history = request.nextUrl.searchParams.get('history');
  const apiKey = serverRuntimeConfig.CMC_API_KEY || process.env.CMC_API_KEY || '';
  const limit = request.nextUrl.searchParams.get('limit') || '90';

  try {
    let url: string;
    if (history === 'true') {
      url = `https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?limit=${limit}`;
    } else {
      url = 'https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest';
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
    console.error('[fear-greed] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
