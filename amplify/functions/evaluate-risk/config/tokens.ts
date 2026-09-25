import rwaList from "./rwa-v1-list.json";

export interface TokenMeta {
  symbol: string;
  name: string;
  slug: string;
  crypto_id?: number;
  sector?: string;
  industry?: string;
  issuer_name?: string;
  issuer_id?: string;
  contractAddress?: string;
}

interface IssuerRisk {
  level: "Low" | "Low-Moderate" | "Moderate" | "Moderate-High" | "High";
  custody: string;
  description: string;
}

const ISSUER_RISK_TABLE: Record<string, IssuerRisk> = {
  "Backed Assets": {
    level: "Low",
    custody: "Custodied (regulated)",
    description: "Backed Finance is a regulated issuer with transparent custody and redemption rights.",
  },
};

export function getIssuerRisk(issuerName?: string): IssuerRisk | null {
  if (!issuerName) return null;
  return ISSUER_RISK_TABLE[issuerName] ?? null;
}

const tokenIndex = new Map<string, TokenMeta>();
const cryptoIdIndex = new Map<number, TokenMeta>();

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    const meta: TokenMeta = {
      symbol: token.symbol,
      name: token.name,
      slug: asset.slug,
      crypto_id: token.crypto_id,
      sector: asset.industry ?? asset.sector,
      industry: asset.industry,
      issuer_name: token.issuer_name ?? asset.issuer_name,
      issuer_id: token.issuer_id,
      contractAddress: token.contractAddress,
    };
    tokenIndex.set(token.symbol.toUpperCase(), meta);
    tokenIndex.set(token.symbol, meta);
    if (token.crypto_id) {
      cryptoIdIndex.set(token.crypto_id, meta);
    }
  }
}

export function getTokenMeta(symbol: string): TokenMeta | null {
  return tokenIndex.get(symbol) ?? tokenIndex.get(symbol.toUpperCase()) ?? null;
}

export function toTicker(symbol: string): string {
  const meta = getTokenMeta(symbol);
  if (meta?.slug) return meta.slug.toUpperCase();
  return symbol.replace(/^(w|x)/i, "").replace(/x$/i, "").toUpperCase();
}

export function getCryptoId(symbol: string): number | null {
  const meta = getTokenMeta(symbol);
  return meta?.crypto_id ?? null;
}

export function getRwaContext(): TokenMeta[] {
  return Array.from(new Set(tokenIndex.values()));
}
