import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-api";
import type { Schema } from "../../../../data/resource";

async function getClient() {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);
  return generateClient<Schema>();
}

function parseRSS(xml: string): { title: string; link: string; pubDate: string; source: string }[] {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? "";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1]?.trim() ?? "";
    if (title) items.push({ title, link, pubDate, source });
  }
  return items;
}

async function fetchGoogleNewsRSS(query: string): Promise<{ title: string; link: string; pubDate: string; source: string }[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml).map((item) => ({ ...item, source: item.source || "Google News" }));
  } catch {
    return [];
  }
}

async function fetchYahooFinanceRSS(ticker: string): Promise<{ title: string; link: string; pubDate: string; source: string }[]> {
  try {
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml).map((item) => ({ ...item, source: item.source || "Yahoo Finance" }));
  } catch {
    return [];
  }
}

function deduplicate(items: { title: string; link: string; pubDate: string; source: string }[]): typeof items {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isTicker(query: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(query.trim());
}

export const searchNews = tool({
  name: "search_news",
  description: "Search market news by keyword, stock ticker, or topic. Combines results from DB, Google News RSS, and Yahoo Finance RSS.",
  parameters: z.object({
    query: z.string().describe("Search query (stock ticker, company name, or topic)"),
  }),
  execute: async ({ query }: { query: string }) => {
    const client = await getClient();

    const dbPromise = client.models.NewsArticle.list({ limit: 100 });
    const googlePromise = fetchGoogleNewsRSS(query);
    const yahooPromise = isTicker(query) ? fetchYahooFinanceRSS(query.trim()) : Promise.resolve([]);

    const [dbRes, googleItems, yahooItems] = await Promise.allSettled([dbPromise, googlePromise, yahooPromise]);

    const combined: { title: string; link: string; pubDate: string; source: string }[] = [];

    if (dbRes.status === "fulfilled" && dbRes.value.data) {
      for (const article of dbRes.value.data) {
        combined.push({
          title: article.title,
          link: article.url ?? "",
          pubDate: article.publishedAt ?? "",
          source: article.source,
        });
      }
    }

    if (googleItems.status === "fulfilled") combined.push(...googleItems.value);
    if (yahooItems.status === "fulfilled") combined.push(...yahooItems.value);

    const results = deduplicate(combined)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20);

    return JSON.stringify(results);
  },
});

export const getLatestNews = tool({
  name: "get_latest_news",
  description: "Get the latest market news feed from all sources.",
  parameters: z.object({
    limit: z.number().optional().describe("Number of articles to return (default 10)"),
  }),
  execute: async ({ limit = 10 }: { limit?: number }) => {
    const client = await getClient();

    const dbPromise = client.models.NewsArticle.list({ limit: 100 });
    const googlePromise = fetchGoogleNewsRSS("stock market OR crypto OR tokenized");

    const [dbRes, googleItems] = await Promise.allSettled([dbPromise, googlePromise]);

    const combined: { title: string; link: string; pubDate: string; source: string }[] = [];

    if (dbRes.status === "fulfilled" && dbRes.value.data) {
      for (const article of dbRes.value.data) {
        combined.push({
          title: article.title,
          link: article.url ?? "",
          pubDate: article.publishedAt ?? "",
          source: article.source,
        });
      }
    }

    if (googleItems.status === "fulfilled") combined.push(...googleItems.value);

    const results = deduplicate(combined)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);

    return JSON.stringify(results);
  },
});
