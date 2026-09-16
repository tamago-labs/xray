export type ChainConfig = {
  id: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  color: string;
  icon: string;
};

export const X_LAYER: ChainConfig = {
  id: 196,
  name: "X Layer",
  shortName: "X Layer",
  rpcUrl: process.env.NEXT_PUBLIC_XLAYER_RPC_URL || "https://rpc.xlayer.tech",
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  color: "#275FEE",
  icon: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png",
};

export const SUPPORTED_CHAINS: ChainConfig[] = [X_LAYER];

export function getChainById(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === chainId);
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChainById(chainId);
  if (!chain) return `https://www.okx.com/web3/explorer/xlayer/address/${address}`;
  return `${chain.explorerUrl}/address/${address}`;
}

export function getAddChainParams(chain: ChainConfig) {
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    rpcUrls: [chain.rpcUrl],
    blockExplorerUrls: [chain.explorerUrl],
    nativeCurrency: chain.nativeCurrency,
  };
}
