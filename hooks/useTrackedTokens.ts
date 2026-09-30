'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import rwaList from '@/lib/data/rwa-v1-list.json';
import { RWA_TOKENS } from './useRwaBalances';

const dataClient = generateClient<Schema>();

interface TrackedToken {
  symbol: string;
  name: string;
  logo: string | null;
  contractAddress: string | null;
}

export function useTrackedTokens(walletAddress: string | undefined) {
  const [tracked, setTracked] = useState<TrackedToken[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTracked = useCallback(async () => {
    if (!walletAddress) {
      setTracked([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await dataClient.models.TrackedToken.list({
        filter: { walletAddress: { eq: walletAddress } },
      });
      setTracked(
        (data ?? []).map((t) => ({
          symbol: t.symbol,
          name: t.name ?? t.symbol,
          logo: t.logo ?? null,
          contractAddress: t.contractAddress ? (t.contractAddress as any).xlayer ?? null : null,
        }))
      );
    } catch {
      setTracked([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  const addToken = useCallback(
    async (symbol: string) => {
      if (!walletAddress) return;
      const meta = RWA_TOKENS.find((t) => t.symbol === symbol);
      if (!meta) return;
      try {
        await dataClient.models.TrackedToken.create({
          walletAddress,
          symbol,
          name: meta.name,
          logo: meta.logo || null,
          contractAddress: meta.contractAddress ? { xlayer: meta.contractAddress } : null,
        });
        await fetchTracked();
      } catch {}
    },
    [walletAddress, fetchTracked]
  );

  const removeToken = useCallback(
    async (symbol: string) => {
      if (!walletAddress) return;
      try {
        const { data } = await dataClient.models.TrackedToken.list({
          filter: { walletAddress: { eq: walletAddress }, symbol: { eq: symbol } },
        });
        if (data?.[0]?.id) {
          await dataClient.models.TrackedToken.delete({ id: data[0].id });
          await fetchTracked();
        }
      } catch {}
    },
    [walletAddress, fetchTracked]
  );

  return { tracked, loading, addToken, removeToken, refetch: fetchTracked };
}
