'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
interface TokenPrice {
  price: number;
  change24h: number;
  change7d: number;
}

interface PriceContextValue {
  prices: Record<string, TokenPrice>;
  loading: boolean;
  getPrice: (symbol: string) => number;
  getChange24h: (symbol: string) => number;
}

const PriceContext = createContext<PriceContextValue>({
  prices: {},
  loading: true,
  getPrice: () => 0,
  getChange24h: () => 0,
});

export function BaseTokenPriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const allTokens = [...BASE_TOKENS, ...BASE_TOKENS_TESTNET];
    const ids = [...new Set(allTokens.map((t) => t.coinmarketcapId))].join(',');

    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/crypto-prices?id=${ids}&convert=USD`);
        const data = await res.json();

        const priceMap: Record<string, TokenPrice> = {};
        for (const token of allTokens) {
          const quote = data?.data?.[token.coinmarketcapId]?.quote?.USD;
          if (quote) {
            priceMap[token.symbol] = {
              price: quote.price ?? 0,
              change24h: quote.percent_change_24h ?? 0,
              change7d: quote.percent_change_7d ?? 0,
            };
          }
        }

        setPrices(priceMap);
      } catch (err) {
        console.error('[BaseTokenPriceProvider] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const getPrice = (symbol: string) => prices[symbol]?.price ?? 0;
  const getChange24h = (symbol: string) => prices[symbol]?.change24h ?? 0;

  return (
    <PriceContext.Provider value={{ prices, loading, getPrice, getChange24h }}>
      {children}
    </PriceContext.Provider>
  );
}

export function useBaseTokenPrices() {
  return useContext(PriceContext);
}
