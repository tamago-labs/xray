// CMC RWA Script 2: Fetch latest quotes for specific stocks
// Endpoint: GET /v5/real-world-assets/quotes/latest
// Returns tokenized prices, market cap, 24h volume, underlying tokens, TradFi markets
// Usage: npx tsx scripts/rwa/2-rwa-quotes.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_URL = "https://pro-api.coinmarketcap.com";

if (!CMC_API_KEY) {
  console.error("Error: CMC_API_KEY not set in .env.local");
  process.exit(1);
}

async function fetchLatestQuotes(symbols: string[]) {
  const url = new URL(`${BASE_URL}/v5/real-world-assets/quotes/latest`);
  url.searchParams.set("symbol", symbols.join(","));
  url.searchParams.set("convert", "USD");

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
  const symbols = ["NVDA", "MSFT", "AAPL", "TSLA", "AMZN"];
  console.log(`Fetching latest quotes for: ${symbols.join(", ")}...`);

  const data = await fetchLatestQuotes(symbols);
  const assets = data.data.rwa_assets;

  console.log(`\nReturned: ${assets.length} assets\n`);

  for (const asset of assets) {
    const quote = asset.quotes?.[0];
    console.log(`${asset.symbol} (${asset.name})`);
    console.log(`  Price: $${quote?.average_tokenized_price ?? "N/A"}`);
    console.log(`  MCap:  $${quote?.tokenized_market_cap ?? "N/A"}`);
    console.log(`  Vol24h: $${quote?.tokenized_volume_24h ?? "N/A"}`);
    console.log(`  Tokens: ${asset.tokens?.length ?? 0}`);
    if (asset.tokens) {
      for (const t of asset.tokens) {
        console.log(`    - ${t.symbol} (${t.name}) @ $${t.price} — ${t.issuer_name}`);
      }
    }
    console.log("");
  }

  console.log("--- Full Response ---");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);


// Fetching latest quotes for: NVDA, MSFT, AAPL, TSLA, AMZN...

// Returned: 5 assets

// NVDA (Nvidia Corp)
//   Price: $214.83570702854433
//   MCap:  $118106708.63449101
//   Vol24h: $78627201.1709571
//   Tokens: 8
//     - NVDAX (NVIDIA tokenized stock (xStock)) @ $214.94616992843805 — Backed Assets
//     - NVDA.D (NVIDIA tokenized stock (Dinari)) @ $null — Dinari Assets
//     - NVDAon (NVIDIA Tokenized Stock (Ondo)) @ $215.06388457298212 — Ondo Assets
//     - NVDA (NVIDIA (Derivatives)) @ $214.68847565508716 — NA (Derivatives)
//     - NVDAB (NVIDIA Tokenized bStocks) @ $214.6449799603517 — bStocks
//     - rNVDA (NVIDIA Tokenized Stock (Reality)) @ $217.66409760164126 — Reality
//     - NVDA (NVIDIA Tokenized Stock (Robinhood)) @ $214.96901766017834 — Robinhood
//     - WNVDAX (Wrapped NVIDIA Tokenized stock (xStock)) @ $215.02278257948575 — Backed Assets

// MSFT (Microsoft Corp)
//   Price: $493.2504276246093
//   MCap:  $22565536.635116134
//   Vol24h: $7012992.68378331
//   Tokens: 9
//     - MSFTX (Microsoft tokenized stock (xStock)) @ $495.551580232172 — Backed Assets
//     - MSFT.D (MSFT tokenized stock (Dinari)) @ $null — Dinari Assets
//     - MSFTon (Microsoft Tokenized Stock (Ondo)) @ $494.38603301896154 — Ondo Assets
//     - MSFT (Microsoft Corporation (Derivatives)) @ $490.89529388079103 — NA (Derivatives)
//     - MSFT (Microsoft Tokenized Stock (Hyperliquid)) @ $487.1809441311753 — Hyperliquid Assets
//     - MSFTB (Microsoft Tokenized bStocks) @ $490.5447033544567 — bStocks
//     - rMSFT (Microsoft Tokenized Stock (Reality)) @ $492.05580732219477 — Reality
//     - MSFT (Microsoft Tokenized Stock (Robinhood)) @ $491.9578049191844 — Robinhood
//     - WMSFTX (Wrapped Microsoft Tokenized stock (xStock)) @ $493.1355946264551 — Backed Assets

// AAPL (Apple Inc.)
//   Price: $331.533834883728
//   MCap:  $37040552.43884026
//   Vol24h: $19470009.93369406
//   Tokens: 9
//     - AAPLX (Apple tokenized stock (xStock)) @ $331.7692364882426 — Backed Assets
//     - AAPL.D (AAPL tokenized stock (Dinari)) @ $null — Dinari Assets
//     - AAPLon (Apple Tokenized Stock (Ondo)) @ $334.1534471735189 — Ondo Assets
//     - AAPL (Apple Inc (Derivatives)) @ $331.0931485343869 — NA (Derivatives)
//     - AAPL (Apple Tokenized Stock (Hyperliquid)) @ $320.61285797098753 — Hyperliquid Assets
//     - rAAPL (Apple Tokenized Stock (Reality)) @ $332.6487182543016 — Reality
//     - AAPL (Apple Tokenized Stock (Robinhood)) @ $331.2144269374925 — Robinhood
//     - AAPLB (Apple Tokenized bStocks) @ $330.6226393634627 — bStocks
//     - WAAPLX (Wrapped Apple Tokenized stock (xStock)) @ $333.1326862348015 — Backed Assets

// TSLA (Tesla, Inc.)
//   Price: $363.8298718892551
//   MCap:  $115417189.55489531
//   Vol24h: $20065867.3162123
//   Tokens: 9
//     - TSLAX (Tesla tokenized stock (xStock)) @ $363.5823478593992 — Backed Assets
//     - TSLA.D (TSLA tokenized stock (Dinari)) @ $null — Dinari Assets
//     - TSLAon (Tesla Tokenized Stock (Ondo)) @ $364.02140345199865 — Ondo Assets
//     - TSLA (Tesla (Derivatives)) @ $363.90571028611697 — NA (Derivatives)
//     - TSLA (Tesla Tokenized Stock (Hyperliquid)) @ $234.96740688966065 — Hyperliquid Assets
//     - TSLAB (Tesla Tokenized bStocks) @ $363.66866335656397 — bStocks
//     - rTSLA (Tesla Tokenized Stock (Reality)) @ $364.3162204909032 — Reality
//     - TSLA (Tesla Tokenized Stock (Robinhood)) @ $364.0981018381709 — Robinhood
//     - WTSLAX (Wrapped Tesla Tokenized stock (xStock)) @ $363.99530391430807 — Backed Assets

// AMZN (Amazon.com Inc)
//   Price: $254.44391603183195
//   MCap:  $19695503.472463317
//   Vol24h: $8538846.08715188
//   Tokens: 8
//     - AMZNX (Amazon tokenized stock (xStock)) @ $254.32431675617298 — Backed Assets
//     - AMZNon (Amazon Tokenized Stock (Ondo)) @ $254.57111263166394 — Ondo Assets
//     - AMZN (Amazon.com Inc (Derivatives)) @ $254.29323638623066 — NA (Derivatives)
//     - AMZN (Amazon Tokenized Stock (Hyperliquid)) @ $227.8245920827759 — Hyperliquid Assets
//     - rAMZN (Amazon Tokenized Stock (Reality)) @ $256.51876338247155 — Reality
//     - AMZN (Amazon Tokenized Stock (Robinhood)) @ $254.7209249502024 — Robinhood
//     - AMZNB (Amazon Tokenized bStocks) @ $254.20005381074975 — bStocks
//     - WAMZNX (Wrapped Amazon Tokenized stock (xStock)) @ $254.5372980850014 — Backed Assets

// --- Full Response ---
// {
//   "data": {
//     "rwa_assets": [
//       {
//         "name": "Nvidia Corp",
//         "symbol": "NVDA",
//         "slug": "nvidia",
//         "quotes": [
//           {
//             "symbol": "USD",
//             "crypto_id": 2781,
//             "average_tokenized_price": 214.83570702854433,
//             "tokenized_market_cap": 118106708.63449101,
//             "tokenized_volume_24h": 78627201.1709571,
//             "last_updated": "2026-09-13T12:04:05.000Z"
//           }
//         ],
//         "rwa_id": 2,
//         "asset_type": "stock",
//         "rwa_rank": 2,
//         "has_tokens": true,
//         "average_tokenized_price": 214.83570702854433,
//         "tokenized_market_cap": 118106708.63449101,
//         "tokenized_volume_24h": 78627201.1709571,
//         "last_updated": "2026-09-13T12:04:33.033Z",
//         "tokens": [
//           {
//             "symbol": "NVDAX",
//             "name": "NVIDIA tokenized stock (xStock)",
//             "price": 214.94616992843805,
//             "crypto_id": 36992,
//             "issuer_id": "6878977dcbbf471de3366e85",
//             "issuer_name": "Backed Assets",
//             "market_cap": 38518037.72,
//             "volume_24h": 6182390.61527722
//           },
//           {
//             "symbol": "NVDA.D",
//             "name": "NVIDIA tokenized stock (Dinari)",
//             "price": null,
//             "crypto_id": 28616,
//             "issuer_id": "688c6172abae9b5b9fb30359",
//             "issuer_name": "Dinari Assets",
//             "market_cap": null,
//             "volume_24h": null
//           },
//           {
//             "symbol": "NVDAon",
//             "name": "NVIDIA Tokenized Stock (Ondo)",
//             "price": 215.06388457298212,
//             "crypto_id": 38093,
//             "issuer_id": "688ca4ccabae9b5b9fb3167a",
//             "issuer_name": "Ondo Assets",
//             "market_cap": 35835720.73,
//             "volume_24h": 1519620.79926623
//           },
//           {
//             "symbol": "NVDA",
//             "name": "NVIDIA (Derivatives)",
//             "price": 214.68847565508716,
//             "crypto_id": 38153,
//             "issuer_id": "695e11f774b54210f3b95dc3",
//             "issuer_name": "NA (Derivatives)",
//             "market_cap": 0,
//             "volume_24h": 1231380.84175701
//           },
//           {
//             "symbol": "NVDAB",
//             "name": "NVIDIA Tokenized bStocks",
//             "price": 214.6449799603517,
//             "crypto_id": 40215,
//             "issuer_id": "6a2aed5097c45356b1a5f710",
//             "issuer_name": "bStocks",
//             "market_cap": 18290816.34,
//             "volume_24h": 20950824.22871919
//           },
//           {
//             "symbol": "rNVDA",
//             "name": "NVIDIA Tokenized Stock (Reality)",
//             "price": 217.66409760164126,
//             "crypto_id": 40605,
//             "issuer_id": "6a43600c282e7240b76c8bbb",
//             "issuer_name": "Reality",
//             "market_cap": 4265930.07,
//             "volume_24h": 362137.57770491
//           },
//           {
//             "symbol": "NVDA",
//             "name": "NVIDIA Tokenized Stock (Robinhood)",
//             "price": 214.96901766017834,
//             "crypto_id": 40685,
//             "issuer_id": "6a465832fbe3004b1a0ea2dd",
//             "issuer_name": "Robinhood",
//             "market_cap": 20615179.35,
//             "volume_24h": 48015449.04662964
//           },
//           {
//             "symbol": "WNVDAX",
//             "name": "Wrapped NVIDIA Tokenized stock (xStock)",
//             "price": 215.02278257948575,
//             "crypto_id": 37270,
//             "issuer_id": "6878977dcbbf471de3366e85",
//             "issuer_name": "Backed Assets",
//             "market_cap": 593815.35,
//             "volume_24h": 666771.27764163
//           }
//         ],
//         "tradfi_markets": [
//           {
//             "exchange": {
//               "slug": "binance",
//               "name": "Binance",
//               "exchange_id": 270
//             },
//             "ticker": "NVDA",
//             "market_url": "https://www.binance.com/en/stocks/EQ_NVDA"
//           }
//         ]
//       },
//       {
//         "name": "Microsoft Corp",
//         "symbol": "MSFT",
//         "slug": "microsoft",
//         "quotes": [
//           {
//             "symbol": "USD",
//             "crypto_id": 2781,
//             "average_tokenized_price": 493.2504276246093,
//             "tokenized_market_cap": 22565536.635116134,
//             "tokenized_volume_24h": 7012992.68378331,
//             "last_updated": "2026-09-13T12:04:05.000Z"
//           }
//         ],
//         "rwa_id": 7,
//         "asset_type": "stock",
//         "rwa_rank": 5,
//         "has_tokens": true,
//         "average_tokenized_price": 493.2504276246093,
//         "tokenized_market_cap": 22565536.635116134,
//         "tokenized_volume_24h": 7012992.68378331,
//         "last_updated": "2026-09-13T12:04:25.240Z",
//         "tokens": [
//           {
//             "symbol": "MSFTX",
//             "name": "Microsoft tokenized stock (xStock)",
//             "price": 495.551580232172,
//             "crypto_id": 37056,
//             "issuer_id": "6878977dcbbf471de3366e85",
//             "issuer_name": "Backed Assets",
//             "market_cap": 7163172.52,
//             "volume_24h": 2082132.61727095
//           },
//           {
//             "symbol": "MSFT.D",
//             "name": "MSFT tokenized stock (Dinari)",
//             "price": null,
//             "crypto_id": 28618,
//             "issuer_id": "688c6172abae9b5b9fb30359",
//             "issuer_name": "Dinari Assets",
//             "market_cap": null,
//             "volume_24h": null
//           },
//           {
//             "symbol": "MSFTon",
//             "name": "Microsoft Tokenized Stock (Ondo)",
//             "price": 494.38603301896154,
//             "crypto_id": 38086,
//             "issuer_id": "688ca4ccabae9b5b9fb3167a",
//             "issuer_name": "Ondo Assets",
//             "market_cap": 8122008.33,
//             "volume_24h": 2007616.05919242
//           },
//           {
//             "symbol": "MSFT",
//             "name": "Microsoft Corporation (Derivatives)",
//             "price": 490.89529388079103,
//             "crypto_id": 39495,
//             "issuer_id": "695e11f774b54210f3b95dc3",
//             "issuer_name": "NA (Derivatives)",
//             "market_cap": 0,
//             "volume_24h": 45482.6959867
//           },
//           {
//             "symbol": "MSFT",
//             "name": "Microsoft Tokenized Stock (Hyperliquid)",
//             "price": 487.1809441311753,
//             "crypto_id": 39616,
//             "issuer_id": "699ed38db54c9320b15928e3",
//             "issuer_name": "Hyperliquid Assets",
//             "market_cap": 0,
//             "volume_24h": 0
//           },
//           {
//             "symbol": "MSFTB",
//             "name": "Microsoft Tokenized bStocks",
//             "price": 490.5447033544567,
//             "crypto_id": 40589,
//             "issuer_id": "6a2aed5097c45356b1a5f710",
//             "issuer_name": "bStocks",
//             "market_cap": 2839495.68,
//             "volume_24h": 1411600.22526509
//           },
//           {
//             "symbol": "rMSFT",
//             "name": "Microsoft Tokenized Stock (Reality)",
//             "price": 492.05580732219477,
//             "crypto_id": 40609,
//             "issuer_id": "6a43600c282e7240b76c8bbb",
//             "issuer_name": "Reality",
//             "market_cap": 1368522.93,
//             "volume_24h": 14615.08477204
//           },
//           {
//             "symbol": "MSFT",
//             "name": "Microsoft Tokenized Stock (Robinhood)",
//             "price": 491.9578049191844,
//             "crypto_id": 40695,
//             "issuer_id": "6a465832fbe3004b1a0ea2dd",
//             "issuer_name": "Robinhood",
//             "market_cap": 2931962.14,
//             "volume_24h": 1446010.04540627
//           },
//           {
//             "symbol": "WMSFTX",
//             "name": "Wrapped Microsoft Tokenized stock (xStock)",
//             "price": 493.1355946264551,
//             "crypto_id": 37214,
//             "issuer_id": "6878977dcbbf471de3366e85",
//             "issuer_name": "Backed Assets",
//             "market_cap": 145518.8,
//             "volume_24h": 4154.8118151
//           }
//         ],
//         "tradfi_markets": [
//           {
//             "exchange": {
//               "slug": "binance",
//               "name": "Binance",
//               "exchange_id": 270
//             },
//             "ticker": "MSFT",
//             "market_url": "https://www.binance.com/en/stocks/EQ_MSFT"
//           }
//         ]
//       },