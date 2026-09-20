'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Check, X } from 'lucide-react';
import { useWallet } from '../app/WalletContext';
import { BASE_TOKENS_TESTNET } from '@/lib/tokens/base-tokens';
import { ethers } from 'ethers';

const MINT_ABI = ['function mint(address, uint256) returns (bool)'];

interface FaucetModalProps {
  open: boolean;
  onClose: () => void;
}

export function FaucetModal({ open, onClose }: FaucetModalProps) {
  const { address, chainId, signer, provider } = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const usdcToken = BASE_TOKENS_TESTNET.find((t) => t.symbol === 'USDC');
  const isTestnet = chainId === 1952;

  const handleClaim = async () => {
    if (!address || !usdcToken) return;
    setClaiming(true);
    try {
      let s = signer;
      if (!s && provider) s = await provider.getSigner();
      if (!s) throw new Error('No signer');
      const c = new ethers.Contract(usdcToken.address, MINT_ABI, s);
      const amount = ethers.parseUnits('1000', usdcToken.decimals);
      const tx = await c.mint(address, amount);
      await tx.wait();
      setClaimed(true);
    } catch (err) {
      console.error('[FaucetModal] claim failed:', err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-surface border border-border3/50 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-accent" />
                <h3 className="text-[16px] font-display font-semibold">Testnet Faucet</h3>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isTestnet ? (
              <p className="text-[13px] text-white/50">
                Please switch to X Layer testnet to claim testnet tokens.
              </p>
            ) : claimed ? (
              <div className="flex items-center gap-2 text-accent2">
                <Check className="w-4 h-4" />
                <span className="text-[13px]">1000 USDC sent to your wallet!</span>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-white/50 mb-4">
                  Claim 1000 testnet USDC to your connected wallet. No real funds required.
                </p>
                <button
                  onClick={handleClaim}
                  disabled={claiming || !address}
                  className="w-full py-3 rounded-lg bg-accent text-white text-[14px] font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {claiming ? 'Claiming...' : 'Claim 1000 USDC'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
