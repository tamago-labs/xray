'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getAssetBySlug, PRE_IPO_ASSETS } from '@/lib/pre-ipo/contracts';
import preIpoData from '@/lib/data/pre-ipo-list.json';
import ReactMarkdown from 'react-markdown';
import { usePreIpoContract } from '@/hooks/usePreIpoContract';
import { useWallet } from '@/components/app/WalletContext';
import TradePanel from '@/components/pre-ipo/TradePanel';
import PositionCard from '@/components/pre-ipo/PositionCard';
import PriceChart from '@/components/pre-ipo/PriceChart';

const client = generateClient<Schema>();

interface Snapshot {
  createdAt?: string;
  markPrice: number;
}

export default function PreIpoDetailClient({ slug }: { slug: string }) {
  const asset = getAssetBySlug(slug);
  const { address, provider, signer } = useWallet();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [depositInput, setDepositInput] = useState('');

  const {
    fetchState,
    deposit,
    openPosition,
    closePosition,
    loading: contractLoading,
    error: contractError,
  } = usePreIpoContract(asset?.perpetual ?? '', address ?? null);

  const handleDeposit = async () => {
    if (!depositInput || !signer) return;
    try {
      const amount = ethers.parseUnits(depositInput, state?.collateralDecimals ?? 6);
      await deposit(signer, amount);
      setDepositInput('');
    } catch (err) {
      console.error('[PreIpoDetail] deposit error:', err);
    }
  };

  const [state, setState] = useState<{
    position: { collateral: bigint; side: number; size: bigint; entryValue: bigint; socialLoss: bigint; fundingLoss: bigint } | null;
    unrealizedPnL: bigint;
    equity: bigint;
    deposits: bigint;
    markPrice: bigint;
    impliedValuation?: bigint;
    collateralDecimals: number;
    collateralSymbol: string;
    isLiquidatable: boolean;
    status: number;
    initialMarginRate: bigint;
    maintenanceMarginRate: bigint;
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
        })));
      } catch (err) {
        console.error('[PreIpoDetail] fetch error:', err);
      }
    };
    fetchSnapshots();
  }, [asset]);

  useEffect(() => {
    if (!provider || !asset) return;
    const load = async () => {
      const s = await fetchState(provider);
      setState(s);
    };
    load();
  }, [provider, asset, fetchState]);

  if (!asset) {
    return (
      <div className="h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center px-6">
        <p className="text-white/40">Market not found</p>
      </div>
    );
  }

  const hasPosition = state?.position && state.position.size > BigInt(0);

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
            {state && (
              <span className="text-[13px] text-white/60">
                ${Number(state.markPrice) / 1e18 > 0
                  ? (Number(state.markPrice) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border3/50 rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Mark Price</p>
          <p className="text-[18px] font-semibold text-white/90">
            {state?.markPrice && state.markPrice > BigInt(0)
              ? `$${(Number(state.markPrice) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </p>
        </div>
        <div className="bg-surface border border-border3/50 rounded-xl p-4">
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
        <div className="bg-surface border border-border3/50 rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Implied Valuation</p>
          <p className="text-[18px] font-semibold text-white/90">
            {state?.impliedValuation && state.impliedValuation > BigInt(0)
              ? `$${(Number(state.impliedValuation) / 1e9).toFixed(2)}B`
              : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-6">
          <PositionCard
            position={state?.position ?? null}
            unrealizedPnL={state?.unrealizedPnL ?? BigInt(0)}
            markPrice={state?.markPrice ?? BigInt(0)}
            entryPrice={state?.position ? Number(state.position.entryValue) / 1e18 : null}
            loading={contractLoading || !state}
          />

          <div className="bg-surface border border-border3/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Deposited</span>
              <span className="text-white/70">
                {state?.deposits && state.deposits > BigInt(0)
                  ? `$${(Number(state.deposits) / 1e6).toFixed(2)}`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Market Status</span>
              <span className={`font-medium ${
                (state?.status ?? 0) === 0 ? 'text-accent2' : (state?.status ?? 0) === 1 ? 'text-warn2' : 'text-white/40'
              }`}>
                {(state?.status ?? 0) === 0 ? 'Active' : (state?.status ?? 0) === 1 ? 'Emergency' : 'Settled'}
              </span>
            </div>
            <div className="pt-2 border-t border-border3/30">
              <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-2">
                Deposit Margin ({state?.collateralSymbol ?? 'USDC'})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-white/5 border border-border3/50 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-accent/50"
                />
                <button
                  onClick={handleDeposit}
                  disabled={!depositInput || contractLoading}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-[13px] font-medium hover:bg-white/15 disabled:opacity-40 transition-colors"
                >
                  {contractLoading ? '...' : 'Deposit'}
                </button>
              </div>
            </div>
          </div>

          <TradePanel
            perpetualAddress={asset.perpetual}
            collateralAddress=""
            markPrice={state?.markPrice ?? BigInt(0)}
            collateralDecimals={state?.collateralDecimals ?? 6}
            collateralSymbol={state?.collateralSymbol ?? 'USDC'}
            initialMarginRate={state?.initialMarginRate ?? BigInt(0)}
            hasPosition={!!hasPosition}
            onDeposit={deposit}
            onOpenPosition={openPosition}
            onClosePosition={closePosition}
            loading={contractLoading}
            status={state?.status ?? 0}
            position={state?.position ?? null}
            unrealizedPnL={state?.unrealizedPnL ?? BigInt(0)}
            deposits={state?.deposits ?? BigInt(0)}
          />
        </div>
        <div className="col-span-3 space-y-6">
          <PriceChart symbol={asset.symbol} data={snapshots} interval="1h" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <h3 className="text-[15px] font-semibold text-white/90 mb-3">About {asset.name}</h3>
            <div className="text-[13px] text-white/50 leading-relaxed max-h-64 overflow-y-auto pr-2 prose prose-invert prose-sm">
              <ReactMarkdown>{asset.description}</ReactMarkdown>
            </div>
          </div>
          {asset.website && (
            <div className="bg-surface border border-border3/50 rounded-xl p-4">
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
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[15px] font-semibold text-white/90 mb-4">Other Pre-IPO Markets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {preIpoData.assets
            .filter((a) => a.slug !== slug)
            .map((other) => {
              return (
                <a
                  key={other.slug}
                  href={`/dashboard/pre-ipo/${other.slug}`}
                  className="group bg-surface border border-border3/50 rounded-xl p-4 hover:border-accent/30 transition-all"
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
                </a>
              );
            })}
        </div>
      </div>
    </div>
  );
}
