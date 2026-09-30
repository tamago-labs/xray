'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import rwaList from '@/lib/data/rwa-v1-list.json';

export const RWA_TOKENS: { symbol: string; name: string; contractAddress: string | null; decimals: number; logo: string; industry: string }[] =
  (rwaList as any).assets.flatMap((a: any) =>
    (a.tokens ?? [])
      .filter((t: any) => t.contractAddress?.xlayer)
      .map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        contractAddress: t.contractAddress?.xlayer ?? null,
        decimals: t.decimals ?? 18,
        logo: t.logo ?? '',
        industry: a.industry ?? 'Other',
      }))
  );

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

export function useRwaBalances(address: string | undefined, chainId: number | undefined, trackedSymbols: string[]) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const tracked = RWA_TOKENS.filter((t) => trackedSymbols.includes(t.symbol));

  const fetchBalances = useCallback(async () => {
    if (!address || chainId !== 196 || tracked.length === 0) {
      setBalances({});
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.xlayer.tech');
      const result: Record<string, string> = {};
      for (const token of tracked) {
        if (!token.contractAddress) {
          result[token.symbol] = '0';
          continue;
        }
        try {
          const contract = new ethers.Contract(token.contractAddress, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          result[token.symbol] = ethers.formatUnits(balance, token.decimals);
        } catch {
          result[token.symbol] = '0';
        }
      }
      setBalances(result);
    } finally {
      setLoading(false);
    }
  }, [address, chainId, tracked.map((t) => t.symbol).join(',')]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading };
}
