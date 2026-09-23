import { tool } from "@openai/agents";
import { z } from "zod";
import crypto from "crypto";

const OKX_API_KEY = process.env.OKX_API_KEY ?? "";
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY ?? "";
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE ?? "";

function okxSign(timestamp: string, method: string, requestPath: string): string {
  const prehash = timestamp + method + requestPath;
  return crypto.createHmac("sha256", OKX_SECRET_KEY).update(prehash).digest("base64");
}

export const getSwapRoute = tool({
  name: "get_swap_route",
  description: "Get the best swap route through OKX DEX Router for a token pair and amount on X Layer.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol (e.g. USDC, TSLA)"),
    tokenOut: z.string().describe("Output token symbol (e.g. USDC, TSLA)"),
    amount: z.number().describe("Amount of tokenIn to swap"),
  }),
  execute: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: number }) => {
    try {
      const { getAssetByInput } = await import("./market-config");
      const fromAsset = getAssetByInput(tokenIn);
      const toAsset = getAssetByInput(tokenOut);

      const fromSymbol = tokenIn.toUpperCase();
      const toSymbol = tokenOut.toUpperCase();

      const fromAddr = fromAsset?.tokens[0]?.contract_address ?? tokenIn;
      const toAddr = toAsset?.tokens[0]?.contract_address ?? tokenOut;

      if (!fromAddr || !toAddr || fromAddr === tokenIn || toAddr === tokenOut) {
        return JSON.stringify({ error: `Unknown token: ${!fromAddr || fromAddr === tokenIn ? fromSymbol : toSymbol}` });
      }

      const fromDecimals = fromAsset?.tokens[0]?.decimals ?? 18;
      const toDecimals = toAsset?.tokens[0]?.decimals ?? 18;
      const rawAmount = Math.round(amount * Math.pow(10, fromDecimals)).toString();

      const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
      url.searchParams.set("chainIndex", "196");
      url.searchParams.set("amount", rawAmount);
      url.searchParams.set("fromTokenAddress", fromAddr);
      url.searchParams.set("toTokenAddress", toAddr);

      const path = url.pathname + url.search;
      const timestamp = new Date().toISOString();
      const signature = okxSign(timestamp, "GET", path);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "OK-ACCESS-KEY": OKX_API_KEY,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
          "OK-ACCESS-TIMESTAMP": timestamp,
        },
      });

      if (!res.ok) {
        return JSON.stringify({ error: `OKX API HTTP ${res.status}` });
      }

      const json = await res.json();
      if (json.code !== "0") {
        return JSON.stringify({ error: json.msg || "OKX API error" });
      }

      const quote = json.data?.[0];
      if (!quote) {
        return JSON.stringify({ error: "No quote available for this pair" });
      }

      const toAmount = Number(quote.toTokenAmount) / Math.pow(10, toDecimals);

      return JSON.stringify({
        tokenIn: fromSymbol,
        tokenOut: toSymbol,
        amountIn: amount,
        estimatedOutput: toAmount,
        price: toAmount / amount,
        priceImpact: quote.priceImpactPercent,
        route: quote.dexRouterList?.map((d: any) => d.dexProtocol?.dexName).filter(Boolean) ?? ["OKX DEX"],
        dexRouterList: quote.dexRouterList,
        quoteId: quote.quoteId,
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message ?? "Failed to get quote" });
    }
  },
});

export const prepareTrade = tool({
  name: "prepare_trade",
  description: "Prepare a trade summary for user review. Returns structured JSON for the frontend to execute. ALWAYS call this as your final action when user confirms a trade. Do NOT include any text after calling this tool.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol"),
    tokenOut: z.string().describe("Output token symbol"),
    amountIn: z.number().describe("Amount to swap"),
  }),
  execute: async ({ tokenIn, tokenOut, amountIn }: { tokenIn: string; tokenOut: string; amountIn: number }) => {
    try {
      const { getAssetByTokenSymbol } = await import("./market-config");
      const fromAsset = getAssetByTokenSymbol(tokenIn);
      const toAsset = getAssetByTokenSymbol(tokenOut);

      const fromSymbol = tokenIn.toUpperCase();
      const toSymbol = tokenOut.toUpperCase();

      const fromAddr = fromAsset?.tokens[0]?.token_symbol ?? tokenIn;
      const toAddr = toAsset?.tokens[0]?.token_symbol ?? tokenOut;

      if (!fromAddr || !toAddr) {
        return JSON.stringify({ error: `Unknown token: ${!fromAddr ? fromSymbol : toSymbol}` });
      }

      const fromDecimals = 18;
      const toDecimals = 18;
      const rawAmount = Math.round(amountIn * Math.pow(10, fromDecimals)).toString();

      const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
      url.searchParams.set("chainIndex", "196");
      url.searchParams.set("amount", rawAmount);
      url.searchParams.set("fromTokenAddress", fromAddr);
      url.searchParams.set("toTokenAddress", toAddr);

      const path = url.pathname + url.search;
      const timestamp = new Date().toISOString();
      const signature = okxSign(timestamp, "GET", path);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "OK-ACCESS-KEY": OKX_API_KEY,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
          "OK-ACCESS-TIMESTAMP": timestamp,
        },
      });

      if (!res.ok) {
        return JSON.stringify({ error: `OKX API HTTP ${res.status}` });
      }

      const json = await res.json();
      if (json.code !== "0") {
        return JSON.stringify({ error: json.msg || "OKX API error" });
      }

      const quote = json.data?.[0];
      if (!quote) {
        return JSON.stringify({ error: "No quote available for this pair" });
      }

      const toAmount = Number(quote.toTokenAmount) / Math.pow(10, toDecimals);

      return JSON.stringify({
        tokenIn: fromSymbol,
        tokenOut: toSymbol,
        amountIn,
        estimatedOutput: toAmount,
        price: toAmount / amountIn,
        priceImpact: quote.priceImpactPercent,
        route: quote.dexRouterList?.map((d: any) => d.dexProtocol?.dexName).filter(Boolean) ?? ["OKX DEX"],
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message ?? "Failed to prepare trade" });
    }
  },
});
