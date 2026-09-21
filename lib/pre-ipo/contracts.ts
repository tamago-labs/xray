import preIpoData from '@/lib/data/pre-ipo-list.json';

export const PERPETUAL_ABI = [
  'function openPosition(uint8 side, uint256 size)',
  'function closePosition()',
  'function settlePosition()',
  'function deposit(uint256 amount)',
  'function withdraw(uint256 amount)',
  'function getPosition(address trader) view returns (tuple(uint256 collateral, uint8 side, uint256 size, uint256 entryValue, int256 socialLoss, int256 fundingLoss))',
  'function getUnrealizedPnL(address trader) view returns (int256)',
  'function getEquity(address trader) view returns (uint256)',
  'function getDeposits(address trader) view returns (uint256)',
  'function getNotionalValue(address trader) view returns (uint256)',
  'function getMaintenanceMargin(address trader) view returns (uint256)',
  'function getMarginRatio(address trader) view returns (uint256)',
  'function getMarkPrice() view returns (uint256)',
  'function getPoolBalances() view returns (uint256 margin, uint256 position)',
  'function getPremium() view returns (int256)',
  'function collateralToken() view returns (address)',
  'function collateralDecimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function amm() view returns (address)',
  'function oracle() view returns (address)',
  'function isLiquidatable(address trader) view returns (bool)',
  'function liquidate(address trader)',
  'function initialMarginRate() view returns (uint256)',
  'function maintenanceMarginRate() view returns (uint256)',
  'function getStatus() view returns (uint8)',
  'function status() view returns (uint8)',
  'event PositionOpened(address indexed trader, uint8 side, uint256 size, uint256 avgPrice)',
  'event PositionClosed(address indexed trader, int256 pnl)',
  'event Deposited(address indexed trader, uint256 amount)',
  'event Withdrawn(address indexed trader, uint256 amount)',
  'event Liquidated(address indexed trader, address indexed liquidator, uint256 penalty)',
  'event Settled(uint256 settlementPrice)',
] as const;

export const AMM_ABI = [
  'function getBuyPrice(uint256 size) view returns (uint256)',
  'function getSellPrice(uint256 size) view returns (uint256)',
  'function getPoolBalances() view returns (uint256 margin, uint256 position)',
  'function getPremium() view returns (int256)',
  'function marginRate() view returns (uint256)',
  'function netPosition() view returns (int256)',
] as const;

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

export const ORACLE_ABI = [
  'function getPrice() view returns (uint256)',
] as const;

export interface PreIpoAsset {
  name: string;
  symbol: string;
  slug: string;
  website: string;
  industry: string;
  founded: number;
  employees: string;
  description: string;
  image: string;
  oracle: string;
  perpetual: string;
}

export const PRE_IPO_ASSETS: PreIpoAsset[] = preIpoData.assets;

export function getAssetBySlug(slug: string): PreIpoAsset | undefined {
  return PRE_IPO_ASSETS.find((a) => a.slug === slug);
}

export function getAssetBySymbol(symbol: string): PreIpoAsset | undefined {
  return PRE_IPO_ASSETS.find((a) => a.symbol === symbol);
}

export const SIDE = {
  LONG: 1,
  SHORT: 2,
} as const;

export const STATUS = {
  NORMAL: 0,
  EMERGENCY: 1,
  SETTLED: 2,
} as const;
