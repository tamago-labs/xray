"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface PriceData {
  token_symbol: string;
  price: number | null;
  percent_1h: number | null;
  percent_24h: number | null;
  percent_7d: number | null;
  percent_30d: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
}

interface PriceContextValue {
  prices: PriceData[];
  loading: boolean;
}

const PriceContext = createContext<PriceContextValue>({ prices: [], loading: true });

export function PriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchPrices() {
      try {
        const allRecords: any[] = [];
        let cursor: string | null = null;

        do {
          const result: any = await client.models.PriceSnapshot.list({
            nextToken: cursor,
            limit: 100,
          });
          allRecords.push(...result.data);
          cursor = result.nextToken;
        } while (cursor);

        const latestBySymbol = new Map();
        for (const item of allRecords) {
          if (!item.token_symbol) continue;
          const existing = latestBySymbol.get(item.token_symbol);
          if (!existing || (item.createdAt && item.createdAt > existing.createdAt)) {
            latestBySymbol.set(item.token_symbol, item);
          }
        }

        setPrices(Array.from(latestBySymbol.values()).map((item) => ({
          token_symbol: item.token_symbol,
          price: item.price,
          percent_1h: item.percent_1h,
          percent_24h: item.percent_24h,
          percent_7d: item.percent_7d,
          percent_30d: item.percent_30d,
          market_cap: item.market_cap,
          volume_24h: item.volume_24h,
          circulating_supply: item.circulating_supply,
          total_supply: item.total_supply,
        })));
      } catch (err) {
        console.error("Failed to fetch prices:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, []);

  return (
    <PriceContext.Provider value={{ prices, loading }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrices() {
  return useContext(PriceContext);
}
