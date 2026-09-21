'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/components/app/WalletContext';
import type { PreIpoAsset } from '@/lib/pre-ipo/contracts';
import { usePreIpoContract, type Position } from '@/hooks/usePreIpoContract';
import PriceChart from '@/components/pre-ipo/PriceChart';
import TradePanel from '@/components/pre-ipo/TradePanel';
import PositionCard from '@/components/pre-ipo/PositionCard';
import Link from 'next/link';

const client = generateClient<Schema>();

interface Snapshot {
  symbol: string;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
  createdAt?: string;
}

export default function PreIpoDetailClient({ asset }: { asset: PreIpoAsset }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [unrealizedPnL, setUnrealizedPnL] = useState(BigInt(0));
  const [deposits, setDeposits] = useState(BigInt(0));
  const [markPrice, setMarkPrice] = useState(BigInt(0));
  const [collateralDecimals, setCollateralDecimals] = useState(6);
  const [collateralSymbol, setCollateralSymbol] = useState('USDC');
  const [initialMarginRate, setInitialMarginRate] = useState(BigInt(0));
  const [maintenanceMarginRate, setMaintenanceMarginRate] = useState(BigInt(0));
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartInterval, setChartInterval] = useState<'1h' | '4h'>('4h');

  const { address, provider } = useWallet();

  const { fetchState, deposit, openPosition, closePosition, loading: txLoading } =
    usePreIpoContract(asset.perpetual, address);

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const { data } = await client.models.PreIpoSnapshot.list({
          filter: { symbol: { eq: asset.symbol } },
          limit: 500,
        });
        setSnapshots(
          data.map((s) => ({
            symbol: s.symbol,
            markPrice: s.markPrice,
            markValuation: s.markValuation,
            impliedValuation: s.impliedValuation,
            createdAt: s.createdAt,
          }))
        );
      } catch (err) {
        console.error('[PreIpoDetail] snapshot error:', err);
      }
    };

    loadSnapshots();
    const interval = setInterval(loadSnapshots, 60000);
    return () => clearInterval(interval);
  }, [asset.symbol]);

  const refreshState = useCallback(async () => {
    if (!provider || !address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const state = await fetchState(provider);
      setPosition(state.position);
      setUnrealizedPnL(state.unrealizedPnL);
      setDeposits(state.deposits);
      setMarkPrice(state.markPrice);
      setCollateralDecimals(state.collateralDecimals);
      setCollateralSymbol(state.collateralSymbol);
      setInitialMarginRate(state.initialMarginRate);
      setMaintenanceMarginRate(state.maintenanceMarginRate);
      setStatus(state.status);
    } catch (err) {
      console.error('[PreIpoDetail] state error:', err);
    } finally {
      setLoading(false);
    }
  }, [provider, address, fetchState]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const markPriceNum = Number(markPrice) / 1e18;
  const latestSnapshot = snapshots[snapshots.length - 1];
  const firstSnapshot = snapshots[0];
  const change24h =
    latestSnapshot && firstSnapshot && firstSnapshot.markPrice > 0
      ? ((latestSnapshot.markPrice - firstSnapshot.markPrice) / firstSnapshot.markPrice) * 100
      : 0;

  const entryPrice =
    position && position.entryValue > BigInt(0) && position.size > BigInt(0)
      ? Number(position.entryValue) / Number(position.size) / 1e18
      : null;

  return (
    <div className="h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <Link
          href="/dashboard/pre-ipo"
          className="text-[12px] text-white/40 hover:text-white/60 mb-4 inline-block"
        >
          Back to Markets
        </Link>

        <div className="flex items-start gap-4 mb-6">
          <img
            src={asset.image}
            alt={asset.name}
            className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1.5"
          />
          <div className="flex-1">
            <h1 className="font-display text-xl font-semibold text-white/90">{asset.name}</h1>
            <p className="text-[12px] text-white/40">{asset.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-white/90">
              ${markPriceNum > 0 ? markPriceNum.toFixed(2) : latestSnapshot?.markPrice.toFixed(2) ?? '—'}
            </p>
            <p className={`text-[13px] font-medium ${change24h >= 0 ? 'text-accent2' : 'text-warn2'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setChartInterval('1h')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  chartInterval === '1h'
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                1H
              </button>
              <button
                onClick={() => setChartInterval('4h')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  chartInterval === '4h'
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                4H
              </button>
            </div>

            <PriceChart symbol={asset.symbol} data={snapshots} interval={chartInterval} />

            <div className="bg-surface border border-border3/50 rounded-xl p-5">
              <h3 className="text-[13px] font-medium text-white/70 mb-3">Market Info</h3>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <span className="text-white/40 block">Implied Valuation</span>
                  <p className="text-white/80">
                    {latestSnapshot
                      ? `$${(latestSnapshot.impliedValuation / 1e9).toFixed(2)}B`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-white/40 block">Mark Valuation</span>
                  <p className="text-white/80">
                    {latestSnapshot
                      ? `$${(latestSnapshot.markValuation / 1e9).toFixed(2)}B`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-white/40 block">Industry</span>
                  <p className="text-white/80">{asset.industry}</p>
                </div>
                <div>
                  <span className="text-white/40 block">Founded</span>
                  <p className="text-white/80">{asset.founded}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border3/50 rounded-xl p-5">
              <h3 className="text-[13px] font-medium text-white/70 mb-3">Contract Addresses</h3>
              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-white/40">Oracle</span>
                  <span className="text-white/60">{asset.oracle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Perpetual</span>
                  <span className="text-white/60">{asset.perpetual}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <TradePanel
              perpetualAddress={asset.perpetual}
              collateralAddress={asset.perpetual}
              markPrice={markPrice}
              collateralDecimals={collateralDecimals}
              collateralSymbol={collateralSymbol}
              initialMarginRate={initialMarginRate}
              hasPosition={!!position && position.size > BigInt(0)}
              onDeposit={deposit}
              onOpenPosition={openPosition}
              onClosePosition={closePosition}
              loading={txLoading}
              status={status}
            />

            <PositionCard
              position={position}
              unrealizedPnL={unrealizedPnL}
              markPrice={markPrice}
              entryPrice={entryPrice}
              loading={loading}
            />

            <div className="bg-surface border border-border3/50 rounded-xl p-5">
              <div className="flex justify-between text-[12px]">
                <span className="text-white/40">Your Deposits</span>
                <span className="text-white/80">
                  ${(Number(deposits) / Math.pow(10, collateralDecimals)).toFixed(2)} {collateralSymbol}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

