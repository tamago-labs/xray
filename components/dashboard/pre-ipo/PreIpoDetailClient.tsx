'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getAssetBySlug } from '@/lib/pre-ipo/contracts';
import preIpoData from '@/lib/data/pre-ipo-list.json';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { usePreIpoContract } from '@/hooks/usePreIpoContract';
import { useWallet } from '@/components/app/WalletContext';
import FundPanel from '@/components/pre-ipo/FundPanel';
import TradePanel from '@/components/pre-ipo/TradePanel';
import PositionsTable from '@/components/pre-ipo/PositionCard';
import PriceChart from '@/components/pre-ipo/PriceChart';
import MarketStats from '@/components/pre-ipo/MarketStats';

const client = generateClient<Schema>();
const READONLY_PROVIDER = new ethers.JsonRpcProvider('https://testrpc.xlayer.tech');

  interface Snapshot {
    createdAt?: string;
    markPrice: number;
    markValuation: number;
    impliedValuation: number;
  }

export default function PreIpoDetailClient({ slug }: { slug: string }) {
  const asset = getAssetBySlug(slug);
  const { address, provider, signer, isConnected } = useWallet();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [txPending, setTxPending] = useState(false);

  const {
    fetchState,
    fetchExecutionPrice,
    deposit,
    withdraw,
    openPosition,
    closePosition,
    loading: contractLoading,
    error: contractError,
  } = usePreIpoContract(asset?.perpetual ?? '', address ?? null);

  const [state, setState] = useState<{
    position: { collateral: bigint; side: number; size: bigint; entryValue: bigint; socialLoss: bigint; fundingLoss: bigint } | null;
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
  } | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      if (!asset) return;
      try {
        const { data } = await client.models.PreIpoSnapshot.list({
          filter: { symbol: { eq: asset.symbol } },
          limit: 1000,
        });
        setSnapshots(data.map((s) => ({
          createdAt: s.createdAt ?? undefined,
          markPrice: s.markPrice,
          markValuation: s.markValuation,
          impliedValuation: s.impliedValuation,
        })));
      } catch (err) {
        console.error('[PreIpoDetail] fetch error:', err);
      }
    };
    fetchSnapshots();
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    const load = async () => {
      const s = await fetchState(provider || READONLY_PROVIDER);
      setState(s);
    };
    load();
  }, [provider, asset, fetchState]);

  const handleClosePosition = async () => {
    if (!signer) return;
    setTxPending(true);
    try {
      await closePosition(signer);
    } catch (err) {
      console.error('[PreIpoDetail] close error:', err);
    } finally {
      setTxPending(false);
    }
  };

  if (!asset) {
    return (
      <div className="h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center px-6">
        <p className="text-white/40">Market not found</p>
        <Link href="/dashboard/pre-ipo" className="text-accent text-sm mt-2 hover:underline">
          Back to Markets
        </Link>
      </div>
    );
  }

  const hasPosition = state?.position && state.position.size > BigInt(0);
  const latestSnapshot = snapshots[snapshots.length - 1];
  const dbMarkPrice = latestSnapshot?.markPrice ?? 0;
  const tokenPrice = state?.tokenPrice ?? 0;
  const displayPremium = dbMarkPrice > 0 && tokenPrice > 0
    ? ((tokenPrice - dbMarkPrice) / dbMarkPrice) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={asset.image}
          alt={asset.name}
          className="w-14 h-14 rounded-2xl object-contain bg-white/5 p-2"
        />
        <div>
          <h1 className="font-display text-2xl font-semibold text-white/90">
            {asset.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[13px] text-white/40">{asset.symbol}</span>
            {asset.website && (
              <a
                href={asset.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-accent hover:underline"
              >
                {asset.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {asset.industry && (
              <span className="text-[12px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                {asset.industry}
              </span>
            )}
            {asset.employees && (
              <span className="text-[12px] text-white/30">{asset.employees} employees</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Mark Price</p>
          <p className="text-[18px] font-semibold text-white/90">
            {dbMarkPrice > 0
              ? `$${dbMarkPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Token Price</p>
          <p className="text-[18px] font-semibold text-white/90">
            {state?.tokenPrice && state.tokenPrice > 0
              ? `$${state.tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">24h Change</p>
          <p className={`text-[18px] font-semibold ${
            snapshots.length >= 2
              ? ((snapshots[snapshots.length - 1].markPrice - snapshots[0].markPrice) / snapshots[0].markPrice) * 100 >= 0
                ? 'text-accent2'
                : 'text-warn2'
              : 'text-white/40'
          }`}>
            {snapshots.length >= 2
              ? `${((snapshots[snapshots.length - 1].markPrice - snapshots[0].markPrice) / snapshots[0].markPrice) * 100 >= 0 ? '+' : ''}${(((snapshots[snapshots.length - 1].markPrice - snapshots[0].markPrice) / snapshots[0].markPrice) * 100).toFixed(2)}%`
              : '—'}
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Premium</p>
          <p className={`text-[18px] font-semibold ${
            !state ? 'text-white/20' :
            displayPremium > 0 ? 'text-warn2' : displayPremium < 0 ? 'text-accent2' : 'text-white/40'
          }`}>
            {!state ? '...' : `${displayPremium > 0 ? '+' : ''}${displayPremium.toFixed(4)}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-4">
          <FundPanel
            collateralDecimals={state?.collateralDecimals ?? 6}
            collateralSymbol={state?.collateralSymbol ?? 'USDC'}
            hasPosition={!!hasPosition}
            onDeposit={deposit}
            onWithdraw={withdraw}
            onSuccess={() => fetchState(provider || READONLY_PROVIDER).then(setState)}
            loading={contractLoading}
            status={state?.status ?? 0}
            deposits={state?.deposits ?? BigInt(0)}
          />

          <TradePanel
            markPrice={dbMarkPrice}
            collateralSymbol={state?.collateralSymbol ?? 'USDC'}
            initialMarginRate={state?.initialMarginRate ?? BigInt(0)}
            onOpenPosition={openPosition}
            getExecutionPrice={(side, size) => fetchExecutionPrice(provider || READONLY_PROVIDER, side, size)}
            hasPosition={!!hasPosition}
            loading={contractLoading}
            status={state?.status ?? 0}
          />

          <MarketStats
            equity={state?.equity ?? BigInt(0)}
            deposits={state?.deposits ?? BigInt(0)}
            maintenanceMargin={state?.maintenanceMargin ?? BigInt(0)}
            poolMargin={state?.poolMargin ?? BigInt(0)}
            poolPosition={state?.poolPosition ?? BigInt(0)}
            markPrice={dbMarkPrice}
            markValuation={latestSnapshot?.markValuation ?? 0}
            impliedValuation={latestSnapshot?.impliedValuation ?? 0}
            collateralSymbol={state?.collateralSymbol ?? 'USDC'}
            hasPosition={!!hasPosition}
            positionSize={state?.position?.size ?? BigInt(0)}
            maintenanceMarginRate={Number(state?.maintenanceMarginRate ?? 0) / 1e18}
          />
        </div>
        <div className="col-span-3 space-y-4">
          {isConnected ? (
            <PositionsTable
              position={state?.position ?? null}
              markPrice={dbMarkPrice}
              loading={!state}
              onClosePosition={handleClosePosition}
              txPending={txPending}
            />
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <p className="text-[13px] text-white/40 text-center py-4">Connect wallet to view your positions</p>
            </div>
          )}

          <PriceChart symbol={asset.symbol} data={snapshots} interval="1h" />

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <h3 className="text-[15px] font-semibold text-white/90 mb-3">About {asset.name}</h3>
            <div className="text-[13px] text-white/50 leading-relaxed max-h-64 overflow-y-auto pr-2 prose prose-invert prose-sm">
              <ReactMarkdown>{asset.description}</ReactMarkdown>
            </div>
          </div>
          {/*{asset.website && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <a
                href={asset.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-accent hover:underline flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Website
              </a>
            </div>
          )}*/}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[15px] font-semibold text-white/90 mb-4">Other Pre-IPO Markets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {preIpoData.assets
            .filter((a) => a.slug !== slug)
            .map((other) => {
              return (
                <Link
                  key={other.slug}
                  href={`/dashboard/pre-ipo/${other.slug}`}
                  className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={other.image}
                      alt={other.name}
                      className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/80 truncate">{other.name}</p>
                      <p className="text-[11px] text-white/40">{other.symbol}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
