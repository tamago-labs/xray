'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();

interface Props {
  open: boolean;
  onClose: () => void;
  portfolioId: string | null;
  onAdded: () => void;
}

interface SelectableToken {
  symbol: string;
  name: string;
  logo: string | null;
  isBase: boolean;
}

export default function AddSimulatedTokenModal({ open, onClose, portfolioId, onAdded }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectableToken | null>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allTokens = useMemo(() => {
    const list: SelectableToken[] = BASE_TOKENS.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      logo: t.logo,
      isBase: true,
    }));
    for (const asset of (rwaList as any).assets ?? []) {
      for (const token of asset.tokens ?? []) {
        if (token.symbol && token.contractAddress?.xlayer) {
          list.push({
            symbol: token.symbol,
            name: token.name ?? asset.name,
            logo: token.logo ?? null,
            isBase: false,
          });
        }
      }
    }
    return list;
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allTokens.slice(0, 50);
    const q = search.toLowerCase();
    return allTokens.filter(
      (t) => t.symbol?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [allTokens, search]);

  const cmcIdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const asset of (rwaList as any).assets ?? []) {
      for (const token of asset.tokens ?? []) {
        if (token.symbol && token.crypto_id && !map.has(token.symbol)) {
          map.set(token.symbol, token.crypto_id);
        }
      }
    }
    return map;
  }, []);

  const handleSave = async () => {
    if (!portfolioId || !selected) return;
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await dataClient.models.PortfolioToken.create({
        portfolioId,
        symbol: selected.symbol,
        name: selected.name,
        cmcId: cmcIdMap.get(selected.symbol) ?? 0,
        customValue: value,
      });
      onAdded();
      setSelected(null);
      setAmount('');
      onClose();
    } catch {
      setError('Failed to add token');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-surface border border-border3/50 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border3/30">
              <h3 className="text-[14px] font-semibold">Add Token to Portfolio</h3>
              <button onClick={onClose} className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selected ? (
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  {selected.logo ? (
                    <img src={selected.logo} alt="" className="w-9 h-9 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                      {selected.symbol?.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="text-[14px] font-medium text-white/90">{selected.symbol}</p>
                    <p className="text-[11px] text-white/40">{selected.name}</p>
                  </div>
                  <button
                    onClick={() => { setSelected(null); setAmount(''); }}
                    className="ml-auto text-[11px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <label className="block text-[12px] text-white/40 mb-1.5">Amount</label>
                <input
                  autoFocus
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
                  placeholder={`e.g. 10.5 ${selected.symbol}`}
                  className="w-full bg-white/[0.03] border border-border3/40 rounded-lg px-3 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
                />
                {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => void handleSave()}
                    disabled={saving || !amount}
                    className="flex-1 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Adding…' : 'Add to Portfolio'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-white/50 text-[13px] hover:text-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search token…"
                      className="w-full bg-white/[0.03] border border-border3/40 rounded-lg pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto px-2 pb-2">
                  {filtered.length === 0 ? (
                    <p className="text-[12px] text-white/30 px-4 py-6 text-center">No tokens found.</p>
                  ) : (
                    filtered.map((t) => (
                      <button
                        key={`${t.isBase ? 'base' : 'rwa'}-${t.symbol}`}
                        onClick={() => setSelected(t)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                      >
                        {t.logo ? (
                          <img src={t.logo} alt="" className="w-7 h-7 rounded-full shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/40 shrink-0">
                            {t.symbol?.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-white/80">{t.symbol}</p>
                          <p className="text-[11px] text-white/40 truncate">{t.name}</p>
                        </div>
                        {t.isBase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 shrink-0">Base</span>
                        )}
                        <Plus className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
