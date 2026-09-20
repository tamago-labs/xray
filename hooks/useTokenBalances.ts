'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';

const RPC_URLS: Record<number, string> = {
  196: 'https://rpc.xlayer.tech',
  1952: 'https://testrpc.xlayer.tech',
};

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

export function useTokenBalances(address: string | undefined, chainId: number | undefined) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !chainId) {
      setBalances({});
      return;
    }

    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      setError('Unsupported chain');
      return;
    }

    const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const result: Record<string, string> = {};

        for (const token of tokens) {
          try {
            if (token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
              const balance = await provider.getBalance(address);
              result[token.symbol] = ethers.formatUnits(balance, token.decimals);
            } else {
              const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
              const balance = await contract.balanceOf(address);
              result[token.symbol] = ethers.formatUnits(balance, token.decimals);
            }
          } catch (err) {
            console.error(`Failed to fetch balance for ${token.symbol}:`, err);
            result[token.symbol] = '0';
          }
        }

        setBalances(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address, chainId]);

  return { balances, loading, error };
}
