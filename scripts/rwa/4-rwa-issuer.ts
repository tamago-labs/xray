// CMC RWA Script 4: Fetch single issuer details (Backed Assets)
// Endpoint: GET /v5/real-world-assets/issuers
// Returns issuer info + linked tokens
// Usage: npx tsx scripts/rwa/4-rwa-issuer.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

const ISSUER_ID = "6878977dcbbf471de3366e85"; // Backed Assets

async function fetchIssuer(issuerId: string) {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/issuers`);
  url.searchParams.set("issuer_id", issuerId);
  url.searchParams.set("limit", "250");

  const res = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": CMC_API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  return res.json();
}

async function main() {
  console.log(`Fetching issuer: ${ISSUER_ID} (Backed Assets)...`);

  const data = await fetchIssuer(ISSUER_ID);
  const issuer = data.data;

  console.log(`\nName: ${issuer.name}`);
  console.log(`Website: ${issuer.website ?? "N/A"}`);
  console.log(`Total Tokens: ${issuer.num_tokens}`);
  console.log(`Returned: ${issuer.tokens?.length ?? 0}\n`);

  if (issuer.tokens) {
    for (const token of issuer.tokens.slice(0, 20)) {
      console.log(`  ${token.symbol} — ${token.name} (crypto_id=${token.crypto_id}, rwa_id=${token.rwa_id})`);
    }
    if (issuer.tokens.length > 20) {
      console.log(`  ... and ${issuer.tokens.length - 20} more`);
    }
  }

  console.log("\n--- Full Response ---");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);


// Fetching issuer: 6878977dcbbf471de3366e85 (Backed Assets)...

// Name: Backed Assets
// Website: https://assets.backed.fi/
// Total Tokens: 1176
// Returned: 250

//   COINX — Coinbase tokenized stock (xStock) (crypto_id=36989, rwa_id=82)
//   NVDAX — NVIDIA tokenized stock (xStock) (crypto_id=36992, rwa_id=2)
//   AAPLX — Apple tokenized stock (xStock) (crypto_id=36994, rwa_id=3)
//   MSTRX — MicroStrategy tokenized stock (xStock) (crypto_id=37003, rwa_id=114)
//   TSLAX — Tesla tokenized stock (xStock) (crypto_id=37004, rwa_id=14)
//   CRCLX — Circle tokenized stock (xStock) (crypto_id=37005, rwa_id=115)
//   SPYX — SP500 tokenized ETF (xStock) (crypto_id=37006, rwa_id=86)
//   ABTX — Abbott tokenized stock (xStock) (crypto_id=37010, rwa_id=112)
//   ABBVX — AbbVie tokenized stock (xStock) (crypto_id=37011, rwa_id=21)
//   ACNX — Accenture tokenized stock (xStock) (crypto_id=37012, rwa_id=136)
//   GOOGLX — Alphabet tokenized stock (xStock) (crypto_id=37013, rwa_id=4)
//   AMZNX — Amazon tokenized stock (xStock) (crypto_id=37014, rwa_id=6)
//   AMBRX — Amber tokenized stock (xStock) (crypto_id=37015, rwa_id=117)
//   APPX — AppLovin tokenized stock (xStock) (crypto_id=37017, rwa_id=108)
//   AZNX — AstraZeneca tokenized stock (xStock) (crypto_id=37018, rwa_id=40)
//   BACX — Bank of America tokenized stock (xStock) (crypto_id=37019, rwa_id=23)
//   BRK.BX — Berkshire Hathaway tokenized stock (xStock) (crypto_id=37020, rwa_id=15)
//   AVGOX — Broadcom tokenized stock (xStock) (crypto_id=37021, rwa_id=13)
//   CVXX — Chevron tokenized stock (xStock) (crypto_id=37022, rwa_id=51)
//   GMEX — Gamestop tokenized stock (xStock) (crypto_id=37023, rwa_id=116)
//   ... and 230 more

// --- Full Response ---
// {
//   "data": {
//     "name": "Backed Assets",
//     "website": "https://assets.backed.fi/",
//     "tokens": [
//       {
//         "name": "Coinbase tokenized stock (xStock)",
//         "symbol": "COINX",
//         "crypto_id": 36989,
//         "rwa_id": 82
//       },
//       {
//         "name": "NVIDIA tokenized stock (xStock)",
//         "symbol": "NVDAX",
//         "crypto_id": 36992,
//         "rwa_id": 2
//       },
//       {
//         "name": "Apple tokenized stock (xStock)",
//         "symbol": "AAPLX",
//         "crypto_id": 36994,
//         "rwa_id": 3
//       },
//       {
//         "name": "MicroStrategy tokenized stock (xStock)",
//         "symbol": "MSTRX",
//         "crypto_id": 37003,
//         "rwa_id": 114
//       },
//       {
//         "name": "Tesla tokenized stock (xStock)",
//         "symbol": "TSLAX",
//         "crypto_id": 37004,
//         "rwa_id": 14
//       },
//       {
//         "name": "Circle tokenized stock (xStock)",
//         "symbol": "CRCLX",
//         "crypto_id": 37005,
//         "rwa_id": 115
//       },
//       {
//         "name": "SP500 tokenized ETF (xStock)",
//         "symbol": "SPYX",
//         "crypto_id": 37006,
//         "rwa_id": 86
//       },
//       {
//         "name": "Abbott tokenized stock (xStock)",
//         "symbol": "ABTX",
//         "crypto_id": 37010,
//         "rwa_id": 112
//       },
//       {
//         "name": "AbbVie tokenized stock (xStock)",
//         "symbol": "ABBVX",
//         "crypto_id": 37011,
//         "rwa_id": 21
//       },
//       {
//         "name": "Accenture tokenized stock (xStock)",
//         "symbol": "ACNX",
//         "crypto_id": 37012,
//         "rwa_id": 136
//       },
//       {
//         "name": "Alphabet tokenized stock (xStock)",
//         "symbol": "GOOGLX",
//         "crypto_id": 37013,
//         "rwa_id": 4
//       },
//       {
//         "name": "Amazon tokenized stock (xStock)",
//         "symbol": "AMZNX",
//         "crypto_id": 37014,
//         "rwa_id": 6
//       },
//       {
//         "name": "Amber tokenized stock (xStock)",
//         "symbol": "AMBRX",
//         "crypto_id": 37015,
//         "rwa_id": 117
//       },
//       {
//         "name": "AppLovin tokenized stock (xStock)",
//         "symbol": "APPX",
//         "crypto_id": 37017,
//         "rwa_id": 108
//       },
//       {
//         "name": "AstraZeneca tokenized stock (xStock)",
//         "symbol": "AZNX",
//         "crypto_id": 37018,
//         "rwa_id": 40
//       },
//       {
//         "name": "Bank of America tokenized stock (xStock)",
//         "symbol": "BACX",
//         "crypto_id": 37019,
//         "rwa_id": 23
//       },
//       {
//         "name": "Berkshire Hathaway tokenized stock (xStock)",
//         "symbol": "BRK.BX",
//         "crypto_id": 37020,
//         "rwa_id": 15
//       },
//       {
//         "name": "Broadcom tokenized stock (xStock)",
//         "symbol": "AVGOX",
//         "crypto_id": 37021,
//         "rwa_id": 13
//       },
//       {
//         "name": "Chevron tokenized stock (xStock)",
//         "symbol": "CVXX",
//         "crypto_id": 37022,
//         "rwa_id": 51
//       },
//       {
//         "name": "Gamestop tokenized stock (xStock)",
//         "symbol": "GMEX",
//         "crypto_id": 37023,
//         "rwa_id": 116
//       },
//       {
//         "name": "Gold tokenized ETF (xStock)",
//         "symbol": "GLDX",
//         "crypto_id": 37024,
//         "rwa_id": 87
//       },
//       {
//         "name": "Goldman Sachs tokenized stock (xStock)",
//         "symbol": "GSX",
//         "crypto_id": 37025,
//         "rwa_id": 39
//       },
//       {
//         "name": "Home Depot tokenized stock (xStock)",
//         "symbol": "HDX",
//         "crypto_id": 37026,
//         "rwa_id": 36
//       },
//       {
//         "name": "Honeywell tokenized stock (xStock)",
//         "symbol": "HONX",
//         "crypto_id": 37027,
//         "rwa_id": null
//       },
//       {
//         "name": "Intel tokenized stock (xStock)",
//         "symbol": "INTCX",
//         "crypto_id": 37028,
//         "rwa_id": 20
//       },
//       {
//         "name": "International Business Machines tokenized stock (xStock)",
//         "symbol": "IBMX",
//         "crypto_id": 37029,
//         "rwa_id": 42
//       },
//       {
//         "name": "Johnson & Johnson tokenized stock (xStock)",
//         "symbol": "JNJX",
//         "crypto_id": 37030,
//         "rwa_id": 19
//       },
//       {
//         "name": "JPMorgan Chase tokenized stock (xStock)",
//         "symbol": "JPMX",
//         "crypto_id": 37031,
//         "rwa_id": 16
//       },
//       {
//         "name": "Cisco tokenized stock (xStock)",
//         "symbol": "CSCOX",
//         "crypto_id": 37032,
//         "rwa_id": 29
//       },
//       {
//         "name": "Coca-Cola tokenized stock (xStock)",
//         "symbol": "KOX",
//         "crypto_id": 37033,
//         "rwa_id": 34
//       },
//       {
//         "name": "Comcast tokenized stock (xStock)",
//         "symbol": "CMCSAX",
//         "crypto_id": 37034,
//         "rwa_id": 208
//       },
//       {
//         "name": "CrowdStrike tokenized stock (xStock)",
//         "symbol": "CRWDX",
//         "crypto_id": 37035,
//         "rwa_id": 102
//       },
//       {
//         "name": "Danaher tokenized stock (xStock)",
//         "symbol": "DHRX",
//         "crypto_id": 37036,
//         "rwa_id": 145
//       },
//       {
//         "name": "DFDV tokenized stock (xStock)",
//         "symbol": "DFDVx",
//         "crypto_id": 37037,
//         "rwa_id": 85
//       },
//       {
//         "name": "Eli Lilly tokenized stock (xStock)",
//         "symbol": "LLYX",
//         "crypto_id": 37038,
//         "rwa_id": 11
//       },
//       {
//         "name": "Exxon Mobil tokenized stock (xStock)",
//         "symbol": "XOMX",
//         "crypto_id": 37039,
//         "rwa_id": 27
//       },
//       {
//         "name": "Procter & Gamble tokenized stock (xStock)",
//         "symbol": "PGX",
//         "crypto_id": 37040,
//         "rwa_id": 50
//       },
//       {
//         "name": "Robinhood tokenized stock (xStock)",
//         "symbol": "HOODX",
//         "crypto_id": 37041,
//         "rwa_id": 84
//       },
//       {
//         "name": "Salesforce tokenized stock (xStock)",
//         "symbol": "CRMX",
//         "crypto_id": 37042,
//         "rwa_id": 198
//       },
//       {
//         "name": "Thermo Fisher tokenized stock (xStock)",
//         "symbol": "TMOX",
//         "crypto_id": 37043,
//         "rwa_id": 104
//       },
//       {
//         "name": "TQQQ tokenized ETF (xSto