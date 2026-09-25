'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, BarChart3 } from 'lucide-react';
import { RWA_TOKENS, loadRwaConfig, saveRwaConfig, type RwaPortfolioConfig } from '@/hooks/useRwaBalances';
import { usePrices } from '@/app/contexts/PriceContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TokenSelectionModal({ open, onClose }: Props) {
  const { prices } = usePrices();
  const [config, setConfig] = useState<RwaPortfolioConfig>({ trackedSymbols: [], useMockValue: true, mockValues: {} });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) setConfig(loadRwaConfig());
  }, [open]);

  const priceMap = new Map(prices.map((p) => [p.token_symbol, p]));

  const filtered = RWA_TOKENS.filter((t) =>
    search === '' ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (symbol: string) => {
    setConfig((prev) => {
      const tracked = prev.trackedSymbols.includes(symbol)
        ? prev.trackedSymbols.filter((s) => s !== symbol)
        : [...prev.trackedSymbols, symbol];
      const mockValues = { ...prev.mockValues };
      if (!tracked.includes(symbol)) delete mockValues[symbol];
      return { ...prev, trackedSymbols: tracked, mockValues };
    });
  };

  const setMock = (symbol: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      mockValues: { ...prev.mockValues, [symbol]: value },
    }));
  };

  const handleSave = () => {
    saveRwaConfig(config);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface border border-border3/50 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden pointer-events-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border3/50">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h2 className="text-[16px] font-semibold text-white/90">Track Tokenized Stocks</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/50 hover:text-white/80 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="px-6 py-3 border-b border-border3/50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-border3/50 rounded-lg text-[13px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[12px] text-white/60 cursor-pointer">
                    <input
                      type="radio"
                      name="balanceMode"
                      checked={!config.useMockValue}
                      onChange={() => setConfig((p) => ({ ...p, useMockValue: false }))}
                      className="accent-[var(--accent)]"
                    />
                    Real Balance
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-white/60 cursor-pointer">
                    <input
                      type="radio"
                      name="balanceMode"
                      checked={config.useMockValue}
                      onChange={() => setConfig((p) => ({ ...p, useMockValue: true }))}
                      className="accent-[var(--accent)]"
                    />
                    Custom Amount
                  </label>
                  <span className="text-[11px] text-white/30 ml-auto">
                    {config.trackedSymbols.length} selected
                  </span>
                </div>
              </div>

              {/* Token List */}
              <div className="flex-1 overflow-y-auto px-6 py-3">
                <div className="space-y-1">
                  {filtered.map((token) => {
                    const tracked = config.trackedSymbols.includes(token.symbol);
                    const priceData = priceMap.get(token.symbol);
                    const price = priceData?.price ?? 0;
                    const change24h = priceData?.percent_24h ?? 0;

                    return (
                      <div
                        key={token.symbol}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                          tracked ? 'bg-accent/10 border border-accent/30' : 'hover:bg-white/[0.02] border border-transparent'
                        }`}
                        onClick={() => toggle(token.symbol)}
                      >
                        <div className="w-5 h-5 rounded border border-border3/50 flex items-center justify-center shrink-0">
                          {tracked && <div className="w-3 h-3 rounded-sm bg-accent" />}
                        </div>
                        <img src={token.logo} alt={token.symbol} className="w-7 h-7 rounded-full shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-white/80">{token.symbol}</p>
                          <p className="text-[11px] text-white/40 truncate">{token.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-medium text-white/80">${price < 1 ? price.toFixed(4) : price.toFixed(2)}</p>
                          <p className={`text-[11px] ${change24h >= 0 ? 'text-accent2' : 'text-warn2'}`}>
                            {change24h >= 0 ? '+' : ''}{change24h?.toFixed(1)}%
                          </p>
                        </div>
                        {tracked && config.useMockValue && (
                          <input
                            type="number"
                            placeholder="0"
                            value={config.mockValues[token.symbol] ?? ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setMock(token.symbol, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white/[0.03] border border-border3/50 rounded text-[12px] text-white/80 text-right focus:outline-none focus:border-accent/50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border3/50">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-[13px] text-white/60 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  Save Selection
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
