export interface Token {
  symbol: string;
  name: string;
  crypto_id: string;
  issuer_name: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  twitter?: string | null;
  discord?: string | null;
  tags?: string[] | null;
  date_added?: string | null;
  mint?: string | null;
  decimals?: number | null;
  verified?: boolean | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
}

export interface Asset {
  symbol: string;
  name: string;
  slug: string;
  rwa_id: number;
  description?: string | null;
  industry?: string | null;
  website?: string | null;
  employees?: number | null;
  exchange?: string | null;
  tokens: Token[];
}
