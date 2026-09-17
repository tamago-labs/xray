"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { connectWallet as libConnectWallet, discoverWallets, switchChain as libSwitchChain, type Wallet } from "@/lib/wallet";
import { X_LAYER, SUPPORTED_CHAINS } from "@/lib/chains";

type WalletState = {
  wallet: Wallet | null;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnecting: boolean;
  error: string | null;
};

type WalletContextValue = WalletState & {
  isConnected: boolean;
  isCorrectChain: boolean;
  wallets: Wallet[];
  discover: () => Promise<Wallet[]>;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const LS_KEY = "xray:lastRdns";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnecting: false,
    error: null,
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const discover = useCallback(async () => {
    const found = await discoverWallets();
    setWallets(found);
    return found;
  }, []);

  const connect = useCallback(async (wallet: Wallet) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const res = await libConnectWallet(wallet);
      setState({
        wallet: res.wallet,
        address: res.address,
        chainId: res.chainId,
        provider: res.provider,
        signer: res.signer,
        isConnecting: false,
        error: null,
      });
      try {
        localStorage.setItem(LS_KEY, wallet.info.rdns);
      } catch {}
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, isConnecting: false, error: msg }));
      throw e;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      wallet: null,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnecting: false,
      error: null,
    });
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    if (!state.wallet) throw new Error("No wallet connected");
    await libSwitchChain(state.wallet.provider, chainId);
  }, [state.wallet]);

  useEffect(() => {
    discover();
  }, [discover]);

  useEffect(() => {
    if (state.wallet || state.isConnecting) return;
    if (wallets.length === 0) return;
    let rdns: string | null = null;
    try {
      rdns = localStorage.getItem(LS_KEY);
    } catch {}
    if (!rdns) return;
    const found = wallets.find((w) => w.info.rdns === rdns);
    if (found) {
      connect(found).catch(() => {});
    }
  }, [wallets, state.wallet, state.isConnecting, connect]);

  useEffect(() => {
    if (!state.wallet?.provider) return;
    const prov = state.wallet.provider as unknown as {
      on?: (e: string, h: (...a: unknown[]) => void) => void;
      removeListener?: (e: string, h: (...a: unknown[]) => void) => void;
    };
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        setState((s) => ({ ...s, address: accounts[0] }));
      }
    };
    const handleChainChanged = (...args: unknown[]) => {
      const chainHex = args[0] as string;
      const id = Number.parseInt(chainHex, 16);
      if (!Number.isNaN(id)) setState((s) => ({ ...s, chainId: id }));
    };
    const handleDisconnect = () => disconnect();

    prov.on?.("accountsChanged", handleAccountsChanged);
    prov.on?.("chainChanged", handleChainChanged);
    prov.on?.("disconnect", handleDisconnect);
    return () => {
      prov.removeListener?.("accountsChanged", handleAccountsChanged);
      prov.removeListener?.("chainChanged", handleChainChanged);
      prov.removeListener?.("disconnect", handleDisconnect);
    };
  }, [state.wallet, disconnect]);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      isConnected: !!state.address,
      isCorrectChain: SUPPORTED_CHAINS.some((c) => c.id === state.chainId),
      wallets,
      discover,
      connect,
      disconnect,
      switchChain,
    }),
    [state, wallets, discover, connect, disconnect, switchChain]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
