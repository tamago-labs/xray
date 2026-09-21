'use client';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { PERPETUAL_ABI, ERC20_ABI, AMM_ABI, ORACLE_ABI, SIDE } from '@/lib/pre-ipo/contracts';

export interface Position {
  collateral: bigint;
  side: number;
  size: bigint;
  entryValue: bigint;
  socialLoss: bigint;
  fundingLoss: bigint;
}

export interface PreIpoContractState {
  position: Position | null;
  equity: bigint;
  deposits: bigint;
  collateralDecimals: number;
  collateralSymbol: string;
  isLiquidatable: boolean;
  status: number;
  initialMarginRate: bigint;
  maintenanceMarginRate: bigint;
  maintenanceMargin: bigint;
  poolMargin: bigint;
  poolPosition: bigint;
  oraclePrice: bigint;
  tokenPrice: number;
  premiumPercent: number;
  loading: boolean;
}

export function usePreIpoContract(perpetualAddress: string, userAddress: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(
    (address: string, abi: readonly string[], signerOrProvider: ethers.Signer | ethers.Provider) => {
      return new ethers.Contract(address, abi, signerOrProvider);
    },
    []
  );

  const fetchState = useCallback(
    async (provider: ethers.Provider): Promise<PreIpoContractState> => {
      const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, provider);

      const collateralTokenAddr = await perpetual.collateralToken();
      const ammAddr = await perpetual.amm();
      const collateral = getContract(collateralTokenAddr, ERC20_ABI, provider);
      const amm = getContract(ammAddr, AMM_ABI, provider);

      const [status, initialMarginRate, maintenanceMarginRate, collateralDecimals, collateralSymbol, poolBalances, oracleAddr] =
        await Promise.all([
          perpetual.getStatus(),
          perpetual.initialMarginRate(),
          perpetual.maintenanceMarginRate(),
          collateral.decimals(),
          collateral.symbol(),
          amm.getPoolBalances(),
          perpetual.oracle(),
        ]);

      const oracle = getContract(oracleAddr, ORACLE_ABI, provider);
      const oraclePrice = await oracle.getPrice();

      let tokenPrice = 0;
      try {
        const price1Unit = await amm.getBuyPrice(BigInt(1e18));
        const rawPrice = Number(price1Unit);
        tokenPrice = rawPrice > 0 && rawPrice < 1e12
          ? rawPrice / 1e6
          : rawPrice / 1e18;
      } catch { /* use 0 */ }

      let premiumPercent = 0;
      const oraclePriceNum = Number(oraclePrice) / 1e18;
      if (oraclePriceNum > 0 && tokenPrice > 0) {
        premiumPercent = ((tokenPrice - oraclePriceNum) / oraclePriceNum) * 100;
      }

      if (!userAddress) {
        return {
          position: null,
          equity: BigInt(0),
          deposits: BigInt(0),
          collateralDecimals: Number(collateralDecimals),
          collateralSymbol,
          isLiquidatable: false,
          status: Number(status),
          initialMarginRate,
          maintenanceMarginRate,
          maintenanceMargin: BigInt(0),
          poolMargin: poolBalances.margin,
          poolPosition: poolBalances.position,
          oraclePrice,
          tokenPrice,
          premiumPercent,
          loading: false,
        };
      }

      const [position, equity, deposits, isLiquidatable, maintenanceMargin] =
        await Promise.all([
          perpetual.getPosition(userAddress),
          perpetual.getEquity(userAddress),
          perpetual.getDeposits(userAddress),
          perpetual.isLiquidatable(userAddress),
          perpetual.getMaintenanceMargin(userAddress),
        ]);

      return {
        position: {
          collateral: position.collateral,
          side: Number(position.side),
          size: position.size,
          entryValue: position.entryValue,
          socialLoss: position.socialLoss,
          fundingLoss: position.fundingLoss,
        },
        equity,
        deposits,
        collateralDecimals: Number(collateralDecimals),
        collateralSymbol,
        isLiquidatable,
        status: Number(status),
        initialMarginRate,
        maintenanceMarginRate,
        maintenanceMargin,
        poolMargin: poolBalances.margin,
        poolPosition: poolBalances.position,
        oraclePrice,
        tokenPrice,
        premiumPercent,
        loading: false,
      };
    },
    [perpetualAddress, userAddress, getContract]
  );

  const fetchExecutionPrice = useCallback(
    async (provider: ethers.Provider, side: 'long' | 'short', size: bigint): Promise<number> => {
      const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, provider);
      const ammAddr = await perpetual.amm();
      const amm = getContract(ammAddr, AMM_ABI, provider);

      let price: bigint;
      if (side === 'long') {
        price = await amm.getBuyPrice(size);
      } else {
        price = await amm.getSellPrice(size);
      }

      const rawPrice = Number(price);
      return rawPrice > 0 && rawPrice < 1e12
        ? rawPrice / 1e6
        : rawPrice / 1e18;
    },
    [perpetualAddress, getContract]
  );

  const deposit = useCallback(
    async (signer: ethers.Signer, amount: bigint) => {
      setLoading(true);
      setError(null);
      try {
        const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, signer);
        const collateralTokenAddr = await perpetual.collateralToken();
        const collateral = getContract(collateralTokenAddr, ERC20_ABI, signer);

        const allowance = await collateral.allowance(await signer.getAddress(), perpetualAddress);
        if (allowance < amount) {
          const approveTx = await collateral.approve(perpetualAddress, amount);
          await approveTx.wait();
        }

        const tx = await perpetual.deposit(amount);
        await tx.wait();
        return tx.hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Deposit failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [perpetualAddress, getContract]
  );

  const withdraw = useCallback(
    async (signer: ethers.Signer, amount: bigint) => {
      setLoading(true);
      setError(null);
      try {
        const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, signer);
        const tx = await perpetual.withdraw(amount);
        await tx.wait();
        return tx.hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Withdraw failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [perpetualAddress, getContract]
  );

  const openPosition = useCallback(
    async (signer: ethers.Signer, side: 'long' | 'short', size: bigint) => {
      setLoading(true);
      setError(null);
      try {
        const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, signer);
        const sideValue = side === 'long' ? SIDE.LONG : SIDE.SHORT;
        const tx = await perpetual.openPosition(sideValue, size);
        await tx.wait();
        return tx.hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Open position failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [perpetualAddress, getContract]
  );

  const closePosition = useCallback(
    async (signer: ethers.Signer) => {
      setLoading(true);
      setError(null);
      try {
        const perpetual = getContract(perpetualAddress, PERPETUAL_ABI, signer);
        const tx = await perpetual.closePosition();
        await tx.wait();
        return tx.hash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Close position failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [perpetualAddress, getContract]
  );

  return {
    fetchState,
    fetchExecutionPrice,
    deposit,
    withdraw,
    openPosition,
    closePosition,
    loading,
    error,
  };
}
