'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Coins, BarChart3 } from 'lucide-react';

interface RiskReport {
  overallScore: number;
  overallLabel: string;
  overallDescription: string;
  concentration: {
    score: number;
    label: string;
    largestPosition: { symbol: string; percentage: number } | null;
    top2Percentage: number;
  };
  marketRisk: {
    score: number;
    label: string;
    equityVolatility: { score: number; label: string };
    sectorConcentration: { score: number; label: string };
    marketCorrelation: { score: number; label: string };
  };
  tokenRisk: {
    score: number;
    label: string;
    tokens: Array<{ symbol: string; liquidityTier: string; issuerRisk: string }>;
  };
  updatedAt?: string;
  rebalanceSuggestions?: Array<{ action: string; symbol: string; reason: string; suggestedAllocation: number }>;
}

interface RiskDrawerProps {
  open: boolean;
  onClose: () => void;
  report: RiskReport | null;
  loading: boolean;
  evalError?: string | null;
  onEvaluate?: () => void;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score <= 30 ? '#34d399' : score <= 60 ? '#fbbf24' : score <= 80 ? '#f87171' : '#ef4444';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/60">{label}</span>
        <span className="text-[12px] font-medium text-white/80">{score}/100</span>
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-accent" />
      <h4 className="text-[13px] font-semibold text-white/90">{title}</h4>
    </div>
  );
}

export default function RiskDrawer({ open, onClose, report, loading, evalError, onEvaluate }: RiskDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border3/50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-[18px] font-display font-bold text-white/90">Portfolio Risk Analysis</h2>
                  <p className="text-[12px] text-white/40 mt-0.5">Risk insights driven by real-time market data</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {report && (
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={onEvaluate}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-accent text-white hover:bg-accent/80 transition-colors"
                  >
                    Evaluate Again
                  </button>
                  {report?.updatedAt && (
                    <span className="text-[11px] text-white/30">
                      Updated {new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  <div className="h-8 w-full bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-20 w-full bg-white/[0.05] rounded-lg animate-pulse" />
                </div>
              )}

              {!loading && evalError && (
                <div className="bg-warn2/10 border border-warn2/30 rounded-xl p-4 mb-4">
                  <p className="text-[12px] text-warn2">{evalError}</p>
                </div>
              )}

              {!loading && report && (
                <div className="space-y-6">
                  <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-white/40">Overall Risk</span>
                      <span className={`text-[14px] font-semibold ${
                        report.overallScore <= 30 ? 'text-accent2' : report.overallScore <= 60 ? 'text-yellow-400' : 'text-warn2'
                      }`}>
                        {report.overallLabel}
                      </span>
                    </div>
                    <p className="text-[24px] font-display font-bold text-white/90 mb-1">
                      {report.overallScore}<span className="text-[14px] text-white/30">/100</span>
                    </p>
                    <p className="text-[12px] text-white/50 leading-relaxed">{report.overallDescription}</p>
                  </div>

                  <div>
                    <SectionTitle icon={BarChart3} title="Concentration" />
                    <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4 space-y-3">
                      <ScoreBar score={report.concentration.score} label="Portfolio concentration" />
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-white/40">Largest position</span>
                        <span className="text-white/70">
                          {report.concentration.largestPosition
                            ? `${report.concentration.largestPosition.symbol} · ${report.concentration.largestPosition.percentage}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-white/40">Top 2 positions</span>
                        <span className="text-white/70">{report.concentration.top2Percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon={TrendingUp} title="Market Risk" />
                    <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4 space-y-3">
                      <ScoreBar score={report.marketRisk?.equityVolatility?.score ?? 0} label="Equity volatility" />
                      <ScoreBar score={report.marketRisk?.sectorConcentration?.score ?? 0} label="Sector concentration" />
                      <ScoreBar score={report.marketRisk?.marketCorrelation?.score ?? 0} label="Market correlation" />
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon={Coins} title="Token / Liquidity Risk" />
                    <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                      <div className="space-y-3">
                        {report.tokenRisk.tokens.map((t) => (
                          <div key={t.symbol} className="flex items-center justify-between">
                            <span className="text-[13px] text-white/70">{t.symbol}</span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-white/40">
                                Liquidity: <span className="text-white/70">{t.liquidityTier}</span>
                              </span>
                              <span className="text-white/40">
                                Issuer: <span className="text-white/70">{t.issuerRisk}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
