import listData from "./data/rwa-v1-list.json";

export interface TokenDisplay {
  symbol: string;
  name: string;
  slug: string;
  rwa_rank: number;
  token_symbol: string;
  token_name: string;
  logo: string | null;
  issuer_name: string;
  website: string | null;
  crypto_id: number;
}

export function getTopTokens(limit = 20): TokenDisplay[] {
  const { assets } = listData as any;

  const sorted = [...assets].sort((a: any, b: any) => a.rwa_rank - b.rwa_rank);

  const tokens: TokenDisplay[] = [];
  for (const asset of sorted) {
    for (const token of asset.tokens ?? []) {
      tokens.push({
        symbol: asset.symbol,
        name: asset.name,
        slug: asset.slug,
        rwa_rank: asset.rwa_rank,
        token_symbol: token.symbol,
        token_name: token.name,
        logo: token.logo ?? null,
        issuer_name: token.issuer_name,
        website: token.website ?? null,
        crypto_id: Number(token.crypto_id),
      });
      if (tokens.length >= limit) return tokens;
    }
  }

  return tokens;
}
