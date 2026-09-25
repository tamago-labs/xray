'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import rwaList from '@/lib/data/rwa-v1-list.json';

export const RWA_TOKENS: { symbol: string; name: string; contractAddress: string; decimals: number; logo: string; industry: string }[] =
  (rwaList as any).assets.map((a: any) => ({
    symbol: a.tokens[0].symbol,
    name: a.tokens[0].name,
    contractAddress: a.tokens[0].contractAddress,
    decimals: a.tokens[0].decimals,
    logo: a.tokens[0].logo,
    industry: a.industry ?? 'Other',
  }));

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];



const STORAGE_KEY = 'xray_rwa_portfolio';

export interface RwaPortfolioConfig {
  trackedSymbols: string[];
  useMockValue: boolean;
  mockValues: Record<string, number>;
}

export function loadRwaConfig(): RwaPortfolioConfig {
  if (typeof window === 'undefined') return { trackedSymbols: [], useMockValue: true, mockValues: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { trackedSymbols: [], useMockValue: true, mockValues: {} };
}

export function saveRwaConfig(config: RwaPortfolioConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useRwaBalances(address: string | undefined, chainId: number | undefined) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const config = loadRwaConfig();
  const tracked = RWA_TOKENS.filter((t) => config.trackedSymbols.includes(t.symbol));

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
