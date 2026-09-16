/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s2.coinmarketcap.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "https://static.okx.com" }
    ],
  },
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CMC_API_KEY: process.env.CMC_API_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ["lightweight-charts"],
  },
}

module.exports = nextConfig;
