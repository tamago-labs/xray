import { NextRequest, NextResponse } from 'next/server';

const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('id');

  if (!ids) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
  }

  try {
    const url = new URL(CMC_API_URL);
    url.searchParams.set('id', ids);
    url.searchParams.set('convert', 'USD');
    const res = await fetch(url.toString(), {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || '',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({ error: 'Failed to fetch prices', detail: data }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[crypto-prices] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
