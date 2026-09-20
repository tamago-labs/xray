export interface BaseToken {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logo: string;
  coinmarketcapId: number;
}

export const BASE_TOKENS: BaseToken[] = [
  { symbol: "USDG", name: "Global Dollar", decimals: 6, address: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/33793.png", coinmarketcapId: 33793 },
  { symbol: "USDT", name: "USD₮0", decimals: 6, address: "0x779ded0c9e1022225f8e0630b35a9b54be713736", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", coinmarketcapId: 825 },
  { symbol: "USDC", name: "USDC", decimals: 6, address: "0xb6ceceab302e2e4948951ee7843fc24e92933061", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", coinmarketcapId: 3408 },
  { symbol: "ETH", name: "Ethereum", decimals: 18, address: "0xe7b000003a45145decf8a28fc755ad5ec5ea025a", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", coinmarketcapId: 1027 },
  { symbol: "SOL", name: "Solana", decimals: 9, address: "0x505000008de8748dbd4422ff4687a4fc9beba15b", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", coinmarketcapId: 5426 },
  { symbol: "OKB", name: "X Layer", decimals: 18, address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png", coinmarketcapId: 3897 },
];

export const BASE_TOKENS_TESTNET: BaseToken[] = [
  { symbol: "USDC", name: "USDC", decimals: 6, address: "0x3eF520aA55f9d4C74479038C47F41B4037e2Ba6D", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", coinmarketcapId: 3408 },
  { symbol: "OKB", name: "X Layer", decimals: 18, address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png", coinmarketcapId: 3897 },
];

export function getBaseToken(symbol: string): BaseToken | undefined {
  return BASE_TOKENS.find((t) => t.symbol === symbol);
}
