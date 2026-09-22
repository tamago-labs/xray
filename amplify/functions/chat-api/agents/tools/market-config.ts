export interface TokenMeta {
  token_symbol: string;
  crypto_id: number;
}

export interface AssetMeta {
  symbol: string;
  name: string;
  logo: string | null;
  industry: string | null;
  tokens: TokenMeta[];
}

export const rwaAssetConfig: AssetMeta[] = [
  { symbol: "CRCL", name: "Circle Internet Group", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41268.png", industry: "Finance Services", tokens: [{ token_symbol: "wCRCLx", crypto_id: 41268 }] },
  { symbol: "SPCX", name: "SpaceX", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41610.png", industry: "Aerospace", tokens: [{ token_symbol: "wSPCXx", crypto_id: 41610 }] },
  { symbol: "MSTR", name: "MicroStrategy", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37215.png", industry: "Finance Services", tokens: [{ token_symbol: "WMSTRX", crypto_id: 37215 }] },
  { symbol: "NVDA", name: "NVIDIA", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37270.png", industry: "Semiconductors", tokens: [{ token_symbol: "WNVDAX", crypto_id: 37270 }] },
  { symbol: "MU", name: "Micron Technology", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41636.png", industry: "Semiconductors", tokens: [{ token_symbol: "wMUx", crypto_id: 41636 }] },
  { symbol: "TSLA", name: "Tesla", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37227.png", industry: "Automotive", tokens: [{ token_symbol: "WTSLAX", crypto_id: 37227 }] },
  { symbol: "GOOGL", name: "Alphabet", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37121.png", industry: "Technology", tokens: [{ token_symbol: "WGOOGLX", crypto_id: 37121 }] },
  { symbol: "SNDK", name: "SanDisk", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41493.png", industry: null, tokens: [{ token_symbol: "wSNDKx", crypto_id: 41493 }] },
  { symbol: "INTC", name: "Intel", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37202.png", industry: "Semiconductors", tokens: [{ token_symbol: "WINTCX", crypto_id: 37202 }] },
  { symbol: "COIN", name: "Coinbase", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37193.png", industry: "Finance Services", tokens: [{ token_symbol: "WCOINX", crypto_id: 37193 }] },
  { symbol: "MRVL", name: "Marvell Technology", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37213.png", industry: "Semiconductors", tokens: [{ token_symbol: "WMRVLX", crypto_id: 37213 }] },
  { symbol: "AAPL", name: "Apple", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37269.png", industry: "Technology", tokens: [{ token_symbol: "WAAPLX", crypto_id: 37269 }] },
  { symbol: "SKHY", name: "SK Hynix", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41523.png", industry: null, tokens: [{ token_symbol: "wSKHYx", crypto_id: 41523 }] },
  { symbol: "META", name: "Meta Platforms", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37211.png", industry: "Technology", tokens: [{ token_symbol: "WMETAX", crypto_id: 37211 }] },
  { symbol: "HOOD", name: "Robinhood", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37200.png", industry: "Finance Services", tokens: [{ token_symbol: "WHOODX", crypto_id: 37200 }] },
  { symbol: "MSFT", name: "Microsoft", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37214.png", industry: "Technology", tokens: [{ token_symbol: "WMSFTX", crypto_id: 37214 }] },
  { symbol: "AVGO", name: "Broadcom", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37129.png", industry: "Semiconductors", tokens: [{ token_symbol: "WAVGOX", crypto_id: 37129 }] },
  { symbol: "AMZN", name: "Amazon", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37112.png", industry: "E-Commerce", tokens: [{ token_symbol: "WAMZNX", crypto_id: 37112 }] },
  { symbol: "AMD", name: "AMD", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41115.png", industry: "Semiconductors", tokens: [{ token_symbol: "wAMDx", crypto_id: 41115 }] },
  { symbol: "TSM", name: "Taiwan Semiconductor", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41688.png", industry: "Semiconductors", tokens: [{ token_symbol: "wTSMx", crypto_id: 41688 }] },
  { symbol: "ORCL", name: "Oracle", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37218.png", industry: "Technology", tokens: [{ token_symbol: "WORCLX", crypto_id: 37218 }] },
  { symbol: "GME", name: "GameStop", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37120.png", industry: "Retail", tokens: [{ token_symbol: "WGMEX", crypto_id: 37120 }] },
  { symbol: "BMNR", name: "BitMine Immersion", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41124.png", industry: "Finance Services", tokens: [{ token_symbol: "wBMNRx", crypto_id: 41124 }] },
  { symbol: "PLTR", name: "Palantir", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37220.png", industry: "Technology", tokens: [{ token_symbol: "WPLTRX", crypto_id: 37220 }] },
  { symbol: "ASML", name: "ASML", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41170.png", industry: "Semiconductors", tokens: [{ token_symbol: "wASMLx", crypto_id: 41170 }] },
  { symbol: "NBIS", name: "Nebius Group", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41481.png", industry: null, tokens: [{ token_symbol: "wNBISx", crypto_id: 41481 }] },
  { symbol: "IREN", name: "IREN", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41291.png", industry: "Finance Services", tokens: [{ token_symbol: "wIRENx", crypto_id: 41291 }] },
  { symbol: "KO", name: "Coca-Cola", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37205.png", industry: "Beverages", tokens: [{ token_symbol: "WKOX", crypto_id: 37205 }] },
  { symbol: "IBM", name: "IBM", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41431.png", industry: "Technology", tokens: [{ token_symbol: "wIBMx", crypto_id: 41431 }] },
  { symbol: "MCD", name: "McDonald's", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37209.png", industry: "Retail", tokens: [{ token_symbol: "WMCDX", crypto_id: 37209 }] },
  { symbol: "RKLB", name: "Rocket Lab", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41489.png", industry: "Aerospace", tokens: [{ token_symbol: "wRKLBx", crypto_id: 41489 }] },
  { symbol: "SMCI", name: "Super Micro", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41508.png", industry: "Technology", tokens: [{ token_symbol: "wSMCIx", crypto_id: 41508 }] },
  { symbol: "DELL", name: "Dell Technologies", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41142.png", industry: "Technology", tokens: [{ token_symbol: "wDELLx", crypto_id: 41142 }] },
  { symbol: "WMT", name: "Walmart", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37229.png", industry: "Retail", tokens: [{ token_symbol: "WWMTX", crypto_id: 37229 }] },
  { symbol: "RDDT", name: "Reddit", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41583.png", industry: "Technology", tokens: [{ token_symbol: "wRDDTx", crypto_id: 41583 }] },
  { symbol: "BRK.B", name: "Berkshire Hathaway", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37191.png", industry: "Finance Services", tokens: [{ token_symbol: "WBRK.BX", crypto_id: 37191 }] },
  { symbol: "CRWV", name: "Coreweave", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41257.png", industry: "Technology", tokens: [{ token_symbol: "wCRWVx", crypto_id: 41257 }] },
  { symbol: "MRNA", name: "Moderna", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41483.png", industry: "Biotechnology", tokens: [{ token_symbol: "wMRNAx", crypto_id: 41483 }] },
  { symbol: "NKE", name: "Nike", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41576.png", industry: "Retail", tokens: [{ token_symbol: "wNKEx", crypto_id: 41576 }] },
  { symbol: "MRK", name: "Merck", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37212.png", industry: "Pharmaceuticals", tokens: [{ token_symbol: "WMRKX", crypto_id: 37212 }] },
  { symbol: "ICE", name: "Intercontinental Exchange", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41456.png", industry: "Finance Services", tokens: [{ token_symbol: "wICEx", crypto_id: 41456 }] },
];

export const getAssetBySymbol = (symbol: string): AssetMeta | undefined =>
  rwaAssetConfig.find((a) => a.symbol.toUpperCase() === symbol.toUpperCase());

export const getAssetByTokenSymbol = (tokenSymbol: string): AssetMeta | undefined =>
  rwaAssetConfig.find((a) => a.tokens.some((t) => t.token_symbol.toLowerCase() === tokenSymbol.toLowerCase()));

export const searchAssets = (query: string): AssetMeta[] => {
  const q = query.toLowerCase();
  return rwaAssetConfig.filter(
    (a) =>
      a.symbol.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.tokens.some((t) => t.token_symbol.toLowerCase().includes(q))
  );
};

export const getAllTokenSymbols = (): string[] =>
  rwaAssetConfig.flatMap((a) => a.tokens.map((t) => t.token_symbol));
