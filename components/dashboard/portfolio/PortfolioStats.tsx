'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/components/app/WalletContext';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useBaseTokenPrices } from '@/app/contexts/BaseTokenPriceProvider';
import { usePrices } from '@/app/contexts/PriceContext';
import { BASE_TOKENS, BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { RWA_TOKENS, loadRwaConfig, useRwaBalances } from '@/hooks/useRwaBalances';
import RiskDrawer from './RiskDrawer';
import RebalanceDrawer from './RebalanceDrawer';

const dataClient = generateClient<Schema>();

export default function PortfolioStats() {
  const { address, chainId } = useWallet();
  const tokens = chainId === 1952 ? BASE_TOKENS_TESTNET : BASE_TOKENS;
  const { balances } = useTokenBalances(address ?? undefined, chainId ?? undefined);
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const { prices } = usePrices();
  const { balances: rwaBalances } = useRwaBalances(address ?? undefined, chainId ?? undefined);
  const rwaConfig = loadRwaConfig();
  const isMainnet = chainId === 196;

  const [riskReport, setRiskReport] = useState<any>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rebalanceDrawerOpen, setRebalanceDrawerOpen] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const rwaPriceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  useEffect(() => {
    if (!address) return;
    dataClient.models.RiskEvaluation.get({ id: address }).then((res) => {
      if (res.data) {
        const report = typeof res.data.report === 'string' ? JSON.parse(res.data.report) : res.data.report;
        if (res.data.rebalanceSuggestions) {
          try {
            report.rebalanceSuggestions = typeof res.data.rebalanceSuggestions === 'string' ? JSON.parse(res.data.rebalanceSuggestions) : res.data.rebalanceSuggestions;
          } catch {}
        }
        setRiskReport(report);
      }
    }).catch(() => {});
  }, [address]);

  const handleEvaluate = async () => {
    if (!address) return;
    setRiskLoading(true);
    setEvalError(null);

    try {
      const holdings = [
        ...tokens.map((t) => ({
          symbol: t.symbol,
          balance: parseFloat(balances[t.symbol] ?? '0'),
          price: getPrice(t.symbol),
          change24h: getChange24h(t.symbol),
          type: 'base' as const,
        })),
        ...RWA_TOKENS.filter((t) => rwaConfig.trackedSymbols.includes(t.symbol)).map((t) => {
          let balance: number;
          if (rwaConfig.useMockValue) {
            balance = rwaConfig.mockValues[t.symbol] ?? 0;
          } else if (isMainnet) {
            balance = parseFloat(rwaBalances[t.symbol] ?? '0');
          } else {
            balance = 0;
          }
          const priceData = rwaPriceMap.get(t.symbol);
          return {
            symbol: t.symbol,
            balance,
            price: priceData?.price ?? 0,
            change24h: priceData?.percent_24h ?? 0,
            type: 'rwa' as const,
          };
        }),
      ].filter((h) => h.balance > 0);

      const portfolioValue = holdings.reduce((sum, h) => sum + h.balance * h.price, 0);

      dataClient.mutations.evaluateRisk({
        walletAddress: address,
        holdings: JSON.stringify(holdings),
        portfolioValue,
      }).catch(() => {});

      let dbRes;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        dbRes = await dataClient.models.RiskEvaluation.get({ id: address });
        if (dbRes.data?.report) {
          const parsed = typeof dbRes.data.report === 'string' ? JSON.parse(dbRes.data.report) : dbRes.data.report;
          if (parsed?.overallScore != null) break;
        }
      }

      if (dbRes?.data?.report) {
        const dbReport = typeof dbRes.data.report === 'string' ? JSON.parse(dbRes.data.report) : dbRes.data.report;
        if (dbRes.data.rebalanceSuggestions) {
          try {
            dbReport.rebalanceSuggestions = typeof dbRes.data.rebalanceSuggestions === 'string' ? JSON.parse(dbRes.data.rebalanceSuggestions) : dbRes.data.rebalanceSuggestions;
          } catch {}
        }
        setRiskReport({ ...dbReport, updatedAt: dbRes.data.updatedAt });
        setDrawerOpen(true);
      } else {
        setEvalError('Risk evaluation timed out. Please try again.');
        setDrawerOpen(true);
      }
    } catch (err) {
      console.error('[PortfolioStats] risk eval failed:', err);
      setEvalError(err instanceof Error ? err.message : 'Unknown error');
      setDrawerOpen(true);
    } finally {
      setRiskLoading(false);
    }
  };

  const baseValue = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const rwaValue = RWA_TOKENS.filter((t) => rwaConfig.trackedSymbols.includes(t.symbol)).reduce((sum, token) => {
    let balance: number;
    if (rwaConfig.useMockValue) {
      balance = rwaConfig.mockValues[token.symbol] ?? 0;
    } else if (isMainnet) {
      balance = parseFloat(rwaBalances[token.symbol] ?? '0');
    } else {
      balance = 0;
    }
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.price ?? 0);
  }, 0);

  const totalValue = baseValue + rwaValue;

  const baseChangeSum = tokens.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getChange24h(token.symbol);
  }, 0);

  const rwaChangeSum = RWA_TOKENS.filter((t) => rwaConfig.trackedSymbols.includes(t.symbol)).reduce((sum, token) => {
    let balance: number;
    if (rwaConfig.useMockValue) {
      balance = rwaConfig.mockValues[token.symbol] ?? 0;
    } else if (isMainnet) {
      balance = parseFloat(rwaBalances[token.symbol] ?? '0');
    } else {
      balance = 0;
    }
    const priceData = rwaPriceMap.get(token.symbol);
    return sum + balance * (priceData?.percent_24h ?? 0);
  }, 0);

  const portfolioChange = totalValue > 0 ? (baseChangeSum + rwaChangeSum) / totalValue : 0;

  const sectorMap = new Map<string, number>();
  for (const t of RWA_TOKENS.filter((t) => rwaConfig.trackedSymbols.includes(t.symbol))) {
    const priceData = rwaPriceMap.get(t.symbol);
    if (priceData && rwaConfig.trackedSymbols.includes(t.symbol)) {
      let balance: number;
      if (rwaConfig.useMockValue) {
        balance = rwaConfig.mockValues[t.symbol] ?? 0;
      } else if (isMainnet) {
        balance = parseFloat(rwaBalances[t.symbol] ?? '0');
      } else {
        balance = 0;
      }
      const value = balance * (priceData?.price ?? 0);
      if (value > 0) {
        const meta = (priceData as any)?.sector || 'Other';
        sectorMap.set(meta, (sectorMap.get(meta) ?? 0) + value);
      }
    }
  }
  const rwaTotalForSectors = Array.from(sectorMap.values()).reduce((a, b) => a + b, 0);
  const sectors = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, pct: rwaTotalForSectors > 0 ? Math.round((value / rwaTotalForSectors) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <>
      <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
          <p className="text-[24px] font-display font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className={`text-[13px] mt-1 ${portfolioChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
            {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% today
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] text-white/40">Risk Score</p>
            {!riskReport && (
              <button
                onClick={handleEvaluate}
                disabled={riskLoading}
                className={`text-[11px] font-medium text-white px-3 py-1.5 rounded-lg btn-gradient ${riskLoading ? 'loading-dots' : ''}`}
              >
                {riskLoading ? 'Evaluating' : 'Evaluate'}
              </button>
            )}
          </div>
          <p className="text-[20px] font-display font-bold">
            {riskReport ? riskReport.overallScore : '--'}<span className="text-[14px] text-white/30">/100</span>
          </p>
          {riskReport ? (
            <div className="space-y-1 mt-1">
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-[12px] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
              >
                View Risk Analysis <ArrowRight className="w-3 h-3" />
              </button>
              {riskReport?.rebalanceSuggestions && (
                <button
                  onClick={() => setRebalanceDrawerOpen(true)}
                  className="text-[12px] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
                >
                  Rebalance Suggestions <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-white/30 mt-1">
              Evaluate your portfolio to see risk insights.
            </p>
          )}
        </div>
        {sectors.length > 0 && (
          <div className="mt-auto">
            <p className="text-[12px] text-white/40 mb-3">Sector Exposure</p>
            <div className="space-y-3">
              {sectors.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-white/60 truncate max-w-[160px]" title={s.name}>{s.name}</span>
                    <span className="text-[12px] font-medium text-white/80 shrink-0 ml-2">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <RiskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        report={riskReport}
        loading={riskLoading}
        evalError={evalError}
        onEvaluate={handleEvaluate}
      />
      <RebalanceDrawer
        open={rebalanceDrawerOpen}
        onClose={() => setRebalanceDrawerOpen(false)}
        suggestions={riskReport?.rebalanceSuggestions ?? null}
      />
    </>
  );
}
