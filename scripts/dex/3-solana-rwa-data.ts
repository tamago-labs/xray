// Solana RWA Token Data: Jupiter as primary source
// Maps RWA stock symbols to Solana mint addresses, prices, and liquidity
// Saves to lib/data/solana-rwa-tokens.json
// Usage: npx tsx scripts/dex/3-solana-rwa-data.ts

const JUP_BASE = "https://api.jup.ag/tokens/v2";

interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  verified: boolean;
  price: number;
  liquidity: number;
  fdv: number;
  mcap: number;
  tags: string[];
}

async function searchToken(query: string, retries = 3): Promise<TokenInfo[]> {
  for (let i = 0; i < retries; i++) {
    const url = new URL(`${JUP_BASE}/search`);
    url.searchParams.set("query", query);
    const res = await fetch(url.toString());
    if (res.ok) {
      const results = await res.json();
      return results.map(
        (t: {
          id: string;
          symbol: string;
          name: string;
          decimals: number;
          isVerified: boolean;
          usdPrice: number;
          liquidity: number;
          fdv: number;
          mcap: number;
          tags: string[];
        }) => ({
          symbol: t.symbol,
          name: t.name,
          mint: t.id,
          decimals: t.decimals,
          verified: t.isVerified,
          price: t.usdPrice,
          liquidity: t.liquidity,
          fdv: t.fdv,
          mcap: t.mcap,
          tags: t.tags ?? [],
        })
      );
    }
    if (res.status === 429) {
      await sleep(2000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const stockSymbols = [
    "NVDA", "MSFT", "AAPL", "TSLA", "AMZN",
    "GOOGL", "META", "BRKB", "AVGO", "ORCL",
    "NFLX", "CRM", "AMD", "INTC", "QCOM",
  ];

  console.log("=== Solana RWA Token Data from Jupiter ===\n");

  const allTokens: TokenInfo[] = [];
  const seen = new Set<string>();

  for (const sym of stockSymbols) {
    await sleep(500); // rate limit
    const results = await searchToken(sym);
    const matches = results.filter(
      (t: TokenInfo) =>
        t.verified &&
        t.symbol.toLowerCase().includes(sym.toLowerCase()) &&
        !seen.has(t.mint)
    );

    for (const token of matches.slice(0, 2)) {
      seen.add(token.mint);
      allTokens.push(token);
      console.log(`✓ ${token.symbol} — ${token.name}`);
      console.log(`  Mint: ${token.mint}`);
      console.log(`  Price: $${token.price ?? "N/A"} | Liq: $${(token.liquidity ?? 0).toLocaleString()}`);
      console.log(`  FDV: $${(token.fdv ?? 0).toLocaleString()} | MCap: $${(token.mcap ?? 0).toLocaleString()}`);
      console.log("");
    }
  }

  console.log(`Total tokens found: ${allTokens.length}`);

  // Save to file
  const { writeFileSync } = await import("fs");
  const { join } = await import("path");
  const outPath = join(process.cwd(), "lib", "data", "solana-rwa-tokens.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        fetched_at: new Date().toISOString(),
        source: "jupiter",
        count: allTokens.length,
        tokens: allTokens,
      },
      null,
      2
    )
  );
  console.log(`Saved to: ${outPath}`);
}

main().catch(console.error);


// PS C:\projects\zivic> npx tsx scripts/dex/3-solana-rwa-data.ts
// === Solana RWA Token Data from Jupiter ===

// ✓ NVDAx — NVIDIA xStock
//   Mint: Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh
//   Price: $214.42486502135006 | Liq: $1,850,769.611
//   FDV: $69,007,569.728 | MCap: $69,007,569.728

// ✓ NVDAon — NVIDIA (Ondo Tokenized)
//   Mint: gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo
//   Price: $214.03978951285694 | Liq: $491.52
//   FDV: $3,572,561.441 | MCap: $3,572,561.441

// ✓ MSFTx — Microsoft xStock
//   Mint: XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX
//   Price: $491.1052492787025 | Liq: $419,100.19
//   FDV: $51,856,261.1 | MCap: $51,856,261.1

// ✓ MSFTon — Microsoft (Ondo Tokenized)
//   Mint: FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo
//   Price: $493.75883517698776 | Liq: $118.469
//   FDV: $201,656.14 | MCap: $201,656.14

// ✓ AAPLx — Apple xStock
//   Mint: XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp
//   Price: $330.48617880032964 | Liq: $832,449.895
//   FDV: $50,982,875.947 | MCap: $50,982,875.947

// ✓ AAPLon — Apple (Ondo Tokenized)
//   Mint: 123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo
//   Price: $331.9967839081611 | Liq: $892.057
//   FDV: $121,668.722 | MCap: $121,668.722

// ✓ TSLAx — Tesla xStock
//   Mint: XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB
//   Price: $363.6957421196955 | Liq: $1,351,761.221
//   FDV: $83,518,101.233 | MCap: $83,518,101.233

// ✓ TSLAon — Tesla (Ondo Tokenized)
//   Mint: KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo
//   Price: $363.02371631248343 | Liq: $0.452
//   FDV: $144,306.291 | MCap: $144,306.291

// ✓ AMZNx — Amazon xStock
//   Mint: Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg
//   Price: $253.66171229759314 | Liq: $197,221.363
//   FDV: $43,704,776.38 | MCap: $43,704,776.38

// ✓ AMZNon — Amazon (Ondo Tokenized)
//   Mint: 14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo
//   Price: $253.86190816686403 | Liq: $183.069
//   FDV: $158,063.852 | MCap: $158,063.852

// ✓ META — MetaDAO
//   Mint: METAwkXcqyXKy1AtsSgJ8JiUHwGCafnZL38n3vYmeta
//   Price: $4.90493150191598 | Liq: $1,410,476.694
//   FDV: $111,266,855.968 | MCap: $111,266,855.968

// ✓ METAx — Meta xStock
//   Mint: Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu
//   Price: $640.8606851225494 | Liq: $204,367.555
//   FDV: $46,490,747.442 | MCap: $46,490,747.442

// ✓ AVGOx — Broadcom xStock
//   Mint: XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo
//   Price: $355.33304497989917 | Liq: $50,431.45
//   FDV: $16,275,533.441 | MCap: $16,275,533.441

// ✓ AVGOon — Broadcom (Ondo Tokenized)
//   Mint: 1FWZtdWN7y38BSXGzbs8D6Shk88oL9atDNgbVz9ondo
//   Price: $360.7770106098995 | Liq: $285.416
//   FDV: $69,349.415 | MCap: $69,349.415

// ✓ ORCLx — Oracle xStock
//   Mint: XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL
//   Price: $146.65780380948243 | Liq: $4,445.744
//   FDV: $13,391,172.684 | MCap: $13,391,172.684

// ✓ ORCLon — Oracle (Ondo Tokenized)
//   Mint: GmDADFpfwjfzZq9MfCafMDTS69MgVjtzD7Fd9a4ondo
//   Price: $151.34073330619162 | Liq: $0
//   FDV: $52,588.998 | MCap: $52,588.998

// ✓ NFLXx — Netflix xStock
//   Mint: XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL
//   Price: $75.78907161381132 | Liq: $9,370.015
//   FDV: $117,516,182.222 | MCap: $117,516,182.222

// ✓ NFLXon — Netflix (Ondo Tokenized)
//   Mint: g4KnPrxPLeeKkwvDmZFMtYQPM64eHeShbD55vK6ondo
//   Price: $77.64751980131317 | Liq: $0
//   FDV: $11,456.272 | MCap: $11,456.272

// ✓ AMDx — AMD xStock
//   Mint: XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF
//   Price: $508.84723049906086 | Liq: $13,383.845
//   FDV: $36,372,843.558 | MCap: $36,372,843.558

// ✓ AMDon — AMD (Ondo Tokenized)
//   Mint: 14diAn5z8kjrKwSC8WLqvBqqe5YmihJhjxRxd8Z6ondo
//   Price: $506.87725455622274 | Liq: $462.048
//   FDV: $107,773.512 | MCap: $107,773.512

// ✓ INTC — Intel - Backpack Securities
//   Mint: iNTCy1qTsUEZQe3DSocLz1ZXXai34Gdw8THQh5rxFaF
//   Price: $99.03292742701312 | Liq: $53,679.161
//   FDV: $451,077.502 | MCap: $451,077.502

// ✓ INTCx — Intel xStock
//   Mint: XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM
//   Price: $98.79317587453369 | Liq: $26,205.048
//   FDV: $41,132,736.009 | MCap: $41,132,736.009

// ✓ QCOMon — Qualcomm (Ondo Tokenized)
//   Mint: hrmX7MV5hifoaBVjnrdpz698yABxrbBNAcWtWo9ondo
//   Price: $182.44153706229514 | Liq: $98.221
//   FDV: $9,380.7 | MCap: $9,380.7

// ✓ QCOMx — Qualcomm xStock
//   Mint: XsUUG8bjFN2KvzLTpzavvEKdAjMAeLTZiTeAQJ9uhvB
//   Price: $178.77633722092278 | Liq: $0
//   FDV: $5,360,028.179 | MCap: $5,360,028.179

// Total tokens found: 24
// Saved to: C:\projects\zivic\lib\data\solana-rwa-tokens.json

export {};