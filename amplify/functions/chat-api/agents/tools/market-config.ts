export interface TokenMeta {
  token_symbol: string;
  crypto_id: number;
  contract_address: string | null;
  decimals?: number;
}

export interface AssetMeta {
  symbol: string;
  name: string;
  logo: string | null;
  industry: string | null;
  tokens: TokenMeta[];
}

export const rwaAssetConfig: AssetMeta[] = [
  { symbol: "CRCL", name: "Circle Internet Group", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41268.png", industry: "Finance Services", tokens: [{ token_symbol: "CRCLX", crypto_id: 41268, contract_address: "0xfEbDEd1B0986a8ee107f5AB1a1c5a813491DeCEB" }] },
  { symbol: "SPCX", name: "SpaceX", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41610.png", industry: "Guided Missiles & Space Vehicles & Parts", tokens: [{ token_symbol: "SPCXx", crypto_id: 41610, contract_address: "0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072" }] },
  { symbol: "MSTR", name: "MicroStrategy", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37215.png", industry: "Finance Services", tokens: [{ token_symbol: "MSTRX", crypto_id: 37215, contract_address: "0xAE2f842EF90C0d5213259Ab82639D5BBF649b08E" }] },
  { symbol: "NVDA", name: "NVIDIA", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37270.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "NVDAX", crypto_id: 37270, contract_address: "0xc845b2894dBddd03858fd2D643B4eF725fE0849d" }] },
  { symbol: "MU", name: "Micron Technology", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41636.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "MUx", crypto_id: 41636, contract_address: "0xe2047ee3bddb5c99ae428ab83df63f8730698e30" }] },
  { symbol: "TSLA", name: "Tesla", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37227.png", industry: "Motor Vehicles & Passenger Car Bodies", tokens: [{ token_symbol: "TSLAX", crypto_id: 37227, contract_address: "0x8aD3c73F833d3F9A523aB01476625F269aEB7Cf0" }] },
  { symbol: "GOOGL", name: "Alphabet", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37121.png", industry: "Computer Programming & Data Processing", tokens: [{ token_symbol: "GOOGLX", crypto_id: 37121, contract_address: "0xe92f673Ca36C5E2Efd2DE7628f815f84807e803F" }] },
  { symbol: "INTC", name: "Intel", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37202.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "INTCX", crypto_id: 37202, contract_address: "0xf8A80D1cb9cFD70D03D655D9dF42339846F3B3C8" }] },
  { symbol: "COIN", name: "Coinbase", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37193.png", industry: "Finance Services", tokens: [{ token_symbol: "WCOINX", crypto_id: 37193, contract_address: "0x44c7ed7ffdf8465c9d27f60aec845eed3d49d56e" }] },
  { symbol: "MRVL", name: "Marvell Technology", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37213.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "WMRVLX", crypto_id: 37213, contract_address: "0xb4ee60b6b817ca7386422ef1a0f45eaddea13275" }] },
  { symbol: "AAPL", name: "Apple", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37269.png", industry: "Electronic Computers", tokens: [{ token_symbol: "WAAPLX", crypto_id: 37269, contract_address: "0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f" }] },
  { symbol: "META", name: "Meta Platforms", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37211.png", industry: "Computer Programming & Data Processing", tokens: [{ token_symbol: "WMETAX", crypto_id: 37211, contract_address: "0xe840946ffebcd66b7c4e95095effafadfa0d0e56" }] },
  { symbol: "HOOD", name: "Robinhood", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37200.png", industry: "Security Brokers & Dealers", tokens: [{ token_symbol: "WHOODX", crypto_id: 37200, contract_address: "0x59801175a9b2248f9bf4ba7f82e17045c4672ec8" }] },
  { symbol: "MSFT", name: "Microsoft", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37214.png", industry: "Prepackaged Software", tokens: [{ token_symbol: "WMSFTX", crypto_id: 37214, contract_address: "0x166fbe68274b6a47e025f4ba17388c539f1fa1d0" }] },
  { symbol: "AVGO", name: "Broadcom", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37129.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "WAVGOX", crypto_id: 37129, contract_address: "0xe89572bfe500ac7e8ecd8dc8119d274214e06f14" }] },
  { symbol: "AMZN", name: "Amazon", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37112.png", industry: "Retail-Catalog & Mail-Order Houses", tokens: [{ token_symbol: "WAMZNX", crypto_id: 37112, contract_address: "0x910cabde3eba7fc1ce64fd14bd680b9f60fa0f90" }] },
  { symbol: "AMD", name: "AMD", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41115.png", industry: "Semiconductors & Related Devices", tokens: [{ token_symbol: "wAMDx", crypto_id: 41115, contract_address: "0xee7ccb0d37a12862e7f92f6c92a93d9c2d304266" }] },
  { symbol: "ORCL", name: "Oracle", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37218.png", industry: "Prepackaged Software", tokens: [{ token_symbol: "WORCLX", crypto_id: 37218, contract_address: "0x1349456830ddc3d8599e4d6a63698883eca67ada" }] },
  { symbol: "GME", name: "GameStop", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37120.png", industry: "Computer & Software Stores", tokens: [{ token_symbol: "WGMEX", crypto_id: 37120, contract_address: "0x459d3ae62b86cc6125e06260dddfd3afed24a877" }] },
  { symbol: "BMNR", name: "BitMine Immersion", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41124.png", industry: "Finance Services", tokens: [{ token_symbol: "wBMNRx", crypto_id: 41124, contract_address: "0xdad5623b32c81aeaa75478fcfe934e9e97018c58" }] },
  { symbol: "PLTR", name: "Palantir", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37220.png", industry: "Prepackaged Software", tokens: [{ token_symbol: "WPLTRX", crypto_id: 37220, contract_address: "0x4a2df09536f62341c9f946427d16414c04e21342" }] },
  { symbol: "IREN", name: "IREN", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41291.png", industry: "Finance Services", tokens: [{ token_symbol: "IRENx", crypto_id: 41291, contract_address: "0xb3a16db475a9cb321fc8956aa2cb01385a022e75" }] },
  { symbol: "KO", name: "Coca-Cola", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37205.png", industry: "Beverages", tokens: [{ token_symbol: "WKOX", crypto_id: 37205, contract_address: "0xe4784b45415aac58b289f9373314261c788c91e8" }] },
  { symbol: "IBM", name: "IBM", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41431.png", industry: "Computer & Office Equipment", tokens: [{ token_symbol: "wIBMx", crypto_id: 41431, contract_address: "0xbf69d85055642a9c6450bdfde3c49baac50f8286" }] },
  { symbol: "MCD", name: "McDonald's", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37209.png", industry: "Retail-Eating Places", tokens: [{ token_symbol: "WMCDX", crypto_id: 37209, contract_address: "0xc6639026a3a862cd4fcbae3f67cb2d25a2959d37" }] },
  { symbol: "SMCI", name: "Super Micro", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41508.png", industry: "Electronic Computers", tokens: [{ token_symbol: "SMCIx", crypto_id: 41508, contract_address: "0xd89556e08fdc04e5a2d9344eb06568a043001166" }] },
  { symbol: "DELL", name: "Dell Technologies", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41142.png", industry: null, tokens: [{ token_symbol: "DELLx", crypto_id: 41142, contract_address: "0x04db4384013664baa627c1a3fa4ff0c50f37cfd3" }] },
  { symbol: "WMT", name: "Walmart", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37229.png", industry: "Retail-Variety Stores", tokens: [{ token_symbol: "WWMTX", crypto_id: 37229, contract_address: "0x3b4336e3958913984c2e36b8ed0e7c87a5bdee33" }] },
  { symbol: "RDDT", name: "Reddit", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41583.png", industry: "Computer Processing & Data Preparation", tokens: [{ token_symbol: "wRDDTx", crypto_id: 41583, contract_address: "0x9ed51b856159c7cf26c1ece673abd248f21bcc9e" }] },
  { symbol: "MRNA", name: "Moderna", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41483.png", industry: "Biological Products", tokens: [{ token_symbol: "wMRNAx", crypto_id: 41483, contract_address: "0xce0fbc16e820ab7fd6d2936f1533c2654ad49ae9" }] },
  { symbol: "NKE", name: "Nike", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/41576.png", industry: "Rubber & Plastics Footwear", tokens: [{ token_symbol: "wNKEx", crypto_id: 41576, contract_address: "0x8cdd7983f4b0a0e8694f22479fec092d9244f4bb" }] },
  { symbol: "MRK", name: "Merck", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/37212.png", industry: "Pharmaceutical Preparations", tokens: [{ token_symbol: "WMRKX", crypto_id: 37212, contract_address: "0x7d218d8a2ab4c1f03fdd7b655b4e724d48200050" }] },
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

const BASE_TOKENS = [
  { symbol: "USDG", decimals: 6, contract_address: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8" },
  { symbol: "USDT", decimals: 6, contract_address: "0x779ded0c9e1022225f8e0630b35a9b54be713736" },
  { symbol: "USDC", decimals: 6, contract_address: "0xb6ceceab302e2e4948951ee7843fc24e92933061" },
  { symbol: "ETH", decimals: 18, contract_address: "0xe7b000003a45145decf8a28fc755ad5ec5ea025a" },
  { symbol: "SOL", decimals: 9, contract_address: "0x505000008de8748dbd4422ff4687a4fc9beba15b" },
  { symbol: "OKB", decimals: 18, contract_address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
];

export const getAssetByInput = (input: string): AssetMeta | undefined => {
  const upper = input.toUpperCase();
  const rwa = rwaAssetConfig.find((a) =>
    a.symbol.toUpperCase() === upper ||
    a.tokens.some((t) => t.token_symbol.toUpperCase() === upper)
  );
  if (rwa) return rwa;
  const base = BASE_TOKENS.find((t) => t.symbol.toUpperCase() === upper);
  if (base) {
    return {
      symbol: base.symbol,
      name: base.symbol,
      logo: null,
      industry: null,
      tokens: [{ token_symbol: base.symbol, crypto_id: 0, contract_address: base.contract_address, decimals: base.decimals }],
    };
  }
  return undefined;
};
