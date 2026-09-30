import rwaList from "./rwa-v1-list.json";

export interface TokenMeta {
  symbol: string;
  name: string;
  stockSymbol?: string;
  stockName?: string;
  slug: string;
  crypto_id?: number;
  type: "tokenized";
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  exchange?: string;
  tags?: string[];
  issuer_name?: string;
  issuer_id?: string;
  volume_24h?: number;
  market_cap?: number;
}

interface IssuerRisk {
  level: "Low" | "Low-Moderate" | "Moderate" | "Moderate-High" | "High";
  custody: string;
  description: string;
}

const ISSUER_RISK_TABLE: Record<string, IssuerRisk> = {
  "Backed Assets": {
    level: "Low",
    custody: "Custodied (regulated, segregated)",
    description:
      "Backed Assets (JE) Limited issues xStocks as tracker certificates under a Liechtenstein FMA-approved prospectus. Assets are held 1:1 in segregated accounts with regulated custodians (Alpaca + Swiss banks), with an independent Security Agent and bankruptcy-remote SPV structure.",
  },
  "Ondo Assets": {
    level: "Low",
    custody: "Custodied (regulated + overcollateralized)",
    description:
      "Ondo Global Markets (BVI) Limited issues structured notes fully backed 1:1 (plus buffer) by underlying securities held at regulated US broker-dealers. Features bankruptcy-remote SPV, independent Security Agent (Ankura), and daily attestations.",
  },
  "Robinhood": {
    level: "Low-Moderate",
    custody: "Custodied (regulated broker)",
    description:
      "Robinhood Assets (Jersey) Limited issues tokenized debt securities backed 1:1 by underlying equities held with a US licensed custodian. Independent security agent is appointed for insolvency scenarios. Parent is a regulated broker, but the issuer itself operates with limited supervision.",
  },
  "Backpack": {
    level: "Moderate",
    custody: "Custodied (hybrid / broker-dealer)",
    description:
      "Backpack offers a hybrid model combining traditional brokerage holdings with on-chain tokens. Some products allow redemption into real securities entitlements; overall structure is less mature and more platform-dependent than pure SPV issuers.",
  },
  "Hyperliquid Assets": {
    level: "Moderate",
    custody: "Custodied (exchange / platform)",
    description:
      "Tokens issued or distributed via Hyperliquid infrastructure. Custody and legal structure are platform-dependent and generally carry higher exchange/counterparty risk than dedicated regulated SPVs.",
  },
  "bStocks": {
    level: "Moderate",
    custody: "Custodied (exchange-affiliated)",
    description:
      "Issued by BTech Holdings Limited (Binance group affiliate) under an ADGM-approved prospectus. Backed 1:1 by shares held with a regulated custodian and features daily Proof of Collateral. Carries exchange-group counterparty and regulatory risk.",
  },
  "Reality": {
    level: "Moderate",
    custody: "Custodied (broker-dealer)",
    description:
      "Reality (Bitget-related) tokens are backed 1:1 by shares held with a FINRA-registered, SIPC-protected US broker-dealer. Provides economic exposure with independent proof-of-asset reporting, but remains platform-dependent.",
  },
  "PreStocks Assets": {
    level: "Moderate-High",
    custody: "Attested / SPV (pre-IPO)",
    description:
      "PreStocks tokens provide economic exposure to private/pre-IPO companies via SPV structures. Carry elevated risks from limited liquidity, valuation uncertainty, lock-up periods, and lack of public-market transparency.",
  },
  "Tessera Assets": {
    level: "Moderate",
    custody: "Custodied (platform)",
    description:
      "Tessera Assets issues tokenized stocks through its platform. Structure is less transparent than major regulated SPV issuers and carries standard platform and custody counterparty risk.",
  },
  "Republic": {
    level: "Moderate",
    custody: "Custodied (regulated crowdfunding)",
    description:
      "Republic issues tokenized securities primarily for private/pre-IPO companies through its regulated crowdfunding platform. Suitable for private-market exposure but subject to higher illiquidity and valuation risk.",
  },
};

export function getIssuerRisk(issuerName?: string): IssuerRisk | null {
  if (!issuerName) return null;
  return ISSUER_RISK_TABLE[issuerName] ?? null;
}

const tokenIndex = new Map<string, TokenMeta>();

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.symbol && !tokenIndex.has(token.symbol.toUpperCase())) {
      const meta: TokenMeta = {
        symbol: token.symbol,
        name: token.name ?? asset.name,
        stockSymbol: asset.symbol,
        stockName: asset.name,
        slug: asset.slug ?? "",
        crypto_id: token.crypto_id,
        type: "tokenized",
        sector: asset.industry,
        industry: asset.industry,
        description: token.description ?? asset.description,
        website: token.website ?? asset.website,
        exchange: asset.exchange,
        tags: token.tags ?? asset.tags,
        issuer_name: token.issuer_name ?? asset.issuer_name,
        issuer_id: token.issuer_id ?? asset.issuer_id,
        volume_24h: token.volume_24h,
        market_cap: token.market_cap,
      };
      tokenIndex.set(token.symbol.toUpperCase(), meta);
    }
  }
}

export function getTokenMeta(symbol: string): TokenMeta | undefined {
  return tokenIndex.get(symbol.toUpperCase());
}
