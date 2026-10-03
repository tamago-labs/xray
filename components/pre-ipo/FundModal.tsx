'use client';

import { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useWallet } from '@/components/app/WalletContext';

interface FundModalProps {
  open: boolean;
  onClose: () => void;
  collateralDecimals: number;
  collateralSymbol: string;
  hasPosition: boolean;
  deposits?: bigint;
  onDeposit: (signer: ethers.Signer, amount: bigint) => Promise<string>;
  onWithdraw: (signer: ethers.Signer, amount: bigint) => Promise<string>;
  onSuccess?: () => void;
}

export default function FundModal({
  open,
  onClose,
  collateralDecimals,
  collateralSymbol,
  hasPosition,
  deposits,
  onDeposit,
  onWithdraw,
  onSuccess,
}: FundModalProps) {
  const { isConnected, signer, isCorrectChain, switchChain } = useWallet();
  const [fundTab, setFundTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [fundInput, setFundInput] = useState('');
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFundInput('');
      setTxError(null);
      setFundTab('deposit');
    }
  }, [open]);

  const depositsNum = useMemo(() => {
    return deposits ? Number(deposits) / Math.pow(10, collateralDecimals) : 0;
  }, [deposits, collateralDecimals]);

  const handleFund = async () => {
    if (!fundInput || !signer) return;
    setTxPending(true);
    setTxError(null);
    try {
      const amount = ethers.parseUnits(fundInput, collateralDecimals);
      if (fundTab === 'deposit') {
        await onDeposit(signer, amount);
      } else {
        await onWithdraw(signer, amount);
      }
      setFundInput('');
      onSuccess?.();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : `${fundTab === 'deposit' ? 'Deposit' : 'Withdraw'} failed`);
    } finally {
      setTxPending(false);
    }
  };

  const tokenIcon = 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border border-border3 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border3/50">
              <h3 className="text-[15px] font-semibold text-white/90">Fund Account</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.1] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {!isConnected ? (
                <p className="text-[13px] text-white/50 text-center py-8">Connect wallet to deposit</p>
              ) : !isCorrectChain ? (
                <div className="text-center">
                  <p className="text-[13px] text-white/50 mb-3">Wrong network</p>
                  <button
                    onClick={() => switchChain(1952)}
                    className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors"
                  >
                    Switch to X Layer Testnet
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 mb-4">
                    {(['deposit', 'withdraw'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFundTab(t)}
                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative ${
                          fundTab === t
                            ? 'text-white'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        {fundTab === t && (
                          <motion.div
                            layoutId="fund-modal-tab"
                            className="absolute inset-0 rounded-lg bg-accent"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{t === 'deposit' ? 'Deposit' : 'Withdraw'}</span>
                      </button>
                    ))}
                  </div>

                  {fundTab === 'withdraw' && hasPosition ? (
                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                      <p className="text-[12px] text-yellow-400/80">
                        Cannot withdraw while position is open. Close your position first.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] text-white/40 mb-2">
                        {fundTab === 'deposit' ? 'You deposit' : 'You withdraw'}
                      </div>
                      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                        <input
                          type="text"
                          value={fundInput}
                          onChange={(e) => setFundInput(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-sm text-white/90 outline-none min-w-0"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <img src={tokenIcon} alt={collateralSymbol} className="w-4 h-4 rounded-full" />
                          <span className="text-[12px] font-medium text-white/70">{collateralSymbol}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-[11px] mb-3">
                          <span className="text-white/40">Deposited</span>
                          <span className="text-white/60">{depositsNum.toFixed(2)} {collateralSymbol}</span>
                        </div>
                        <button
                          onClick={handleFund}
                          disabled={txPending || !fundInput || Number(fundInput) <= 0}
                          className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {txPending ? 'Processing...' : fundTab === 'deposit' ? 'Deposit' : 'Withdraw'}
                        </button>
                      </div>
                    </>
                  )}

                  {txError && (
                    <p className="text-[11px] text-yellow-400/80 break-all mt-2">{txError}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
