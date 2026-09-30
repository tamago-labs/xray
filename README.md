# Xray

**Xray** brings AI, real-time market intelligence, and onchain execution together for **tokenized stocks and pre-IPO markets on X Layer**. The product helps users discover tokenized equities, understand market and portfolio risk, and move from analysis to execution without switching between multiple platforms.

Its intended users are **Web3 investors and traders** who want exposure to tokenized stocks or emerging pre-IPO markets. The platform combines:

* **AI Portfolio Risk Engine** — evaluates concentration, market, token, and liquidity risk and generates rebalance suggestions.
* **Multi-Agent AI** — routes questions to specialized agents for market research, news, trading, pre-IPO markets, and portfolio analysis.
* **Tokenized Stock Explorer** — tracks 41 tokenized stocks with live market data.
* **Pre-IPO Perpetual DEX** — enables leveraged synthetic exposure through a counter-party AMM.

The core integration combines **X Layer, CoinMarketCap Pro, and OKX DEX Router**. CoinMarketCap supplies market intelligence, OKX provides swap routing and execution, while Xray's AI layer interprets the data and turns it into portfolio insights and trading workflows.

<img width="1870" height="814" alt="Screenshot 2026-09-25 164352" src="https://github.com/user-attachments/assets/7d70b622-2372-47b6-a6ab-ec9a0cda3481" />

## Quick Links

* **YouTube Demo (3 min)** — https://youtu.be/xBjvcAR2jVE
* **Live Demo** — https://xray.tamagolabs.com/

## Highlighted Features

- **AI Chat with Multi-Agent System** — triage routing to 5 specialized agents: Market Research, News Intelligence, Trade Specialist, Pre-IPO Trading, and Triage. Each agent has dedicated tools for real market data, news, swap routing, and portfolio analysis.
- **Portfolio Risk Engine** — AI-powered risk evaluation across concentration, market risk, and token/liquidity dimensions. Produces a 0-100 risk score with actionable rebalance suggestions (reduce, add, diversify, hedge).
- **Rebalance Suggestions** — based on risk analysis context, AI recommends specific tokens to reduce or add with target allocation percentages, referencing concentration and sector exposure.
- **Portfolio Tracking** — connect your EVM wallet and track holdings across base tokens (USDT, USDC, ETH, SOL, OKB) and tokenized stocks (xStocks). Support for both real balances and custom amounts for analysis.
- **Pre-IPO Perpetual DEX** — trade synthetic exposure to pre-IPO companies (OpenAI, Anthropic, Anduril, Neuralink, Kalshi) with up to 10x leverage via a counter-party AMM with dynamic pricing and funding rates.
- **AI-Powered Swap Execution** — finds the best route on X Layer via OKX DEX Router. Review quotes (price, price impact, route) and execute swaps directly from the chat interface.
- **CoinMarketCap Pro Market Data** — real-time prices, market cap, volume, and RWA metadata for every tokenized stock on X Layer.

## System Overview

The system comprises 3 main components:

- **Next.js Frontend (App Router)** — The main interface where users access portfolio tracking, risk analysis, token exploration, pre-IPO discovery, AI chat, and swap execution. The dashboard reads on-chain wallet data via ethers.js and displays live market metrics from CoinMarketCap.
- **AWS Amplify Backend** — Handles data persistence, serverless compute, and scheduled data ingestion. DynamoDB stores price snapshots, pre-IPO valuations, risk evaluations, and user sessions. Lambda functions run scheduled trackers and AI-powered analysis agents.
- **Smart Contracts (Foundry)** — Pre-IPO Perpetual DEX deployed on X Layer Testnet. Includes Perpetual (main entry), PerpAMM (counter-party AMM), PriceOracle (multi-source), FundingCalculator (EMA premium), and LpShareToken (ERC20 pool shares).

## Frontend

The dashboard provides a comprehensive interface for tokenized equity and pre-IPO analysis:

- **Portfolio** — Connect your EVM wallet to view holdings across base tokens and tokenized stocks. See total portfolio value, 24h change, sector exposure, and AI-generated risk scores. Run risk evaluations to get concentration analysis and rebalancing suggestions. Toggle between real balance and custom amount mode for portfolio analysis.

- **Explore** — Browse all 41 tokenized stocks on X Layer with real-time price, market cap, volume, and percentage changes from CoinMarketCap data. Filter by sector, issuer, or metric.

- **Pre-IPO** — Discover pre-IPO perpetual markets with mark price, implied valuation, and 24h change. Each market includes a built-in trade widget for opening long/short positions with leverage.

- **Token Detail** — Deep dive into any tokenized stock with price chart, market stats, sector exposure, issuer info, and AI-generated insights.

- **Chat** — Multi-agent AI chat where you can ask about tokenized stocks, get personalized recommendations, find best trade routes, execute swaps, and analyze portfolio risk — all through conversational commands.

## Backend

Xray's backend uses **AWS Amplify Gen 2** with serverless functions, DynamoDB tables, and scheduled data ingestion.

### Data Models

- **PriceSnapshot** — Stores CoinMarketCap market data per tokenized stock (price, market_cap, volume_24h, percent changes, supply). Updated hourly by scheduled tracker.
- **PreIpoSnapshot** — Tracks pre-IPO market valuations (markPrice, markValuation, impliedValuation).
- **RiskEvaluation** — Persists AI-generated risk reports per wallet, including risk scores and rebalancing suggestions.
- **AgentSession** — Stores chat conversation history, transaction records, and tool outputs for the multi-agent AI chat system.
- **UserProfile** — Stores user preferences, AI credits balance, and experience level.
- **NewsArticle** — Aggregated news articles from Google News RSS and Yahoo Finance RSS with theme classification.

### Scheduled Trackers

- **Price Tracker** — Fetches market data from CoinMarketCap Pro for all configured tokenized stocks. Runs every hour.
- **Pre-IPO Tracker** — Pulls latest valuations for pre-IPO markets. Runs every hour.

### Lambda Functions

- **Chat API** — Main entry point for the multi-agent AI chat system. Manages SSE streaming, agent routing, tool execution, and credit deduction.
- **Evaluate Risk** — Runs the 2-turn AI risk analysis pipeline (Risk Evaluator + Rebalance Advisor). Returns comprehensive portfolio risk reports with actionable recommendations.

## Smart Contracts

Xray includes a dedicated **Pre-IPO Perpetual DEX** deployed on X Layer Testnet. The system uses a counter-party AMM model where the pool takes the opposite side of every trade, with dynamic pricing based on pool utilization and a funding rate mechanism to tether mark price to oracle spot price.

**Contracts:**
- **Perpetual** — Main entry point for deposits, trading, liquidation, and settlement
- **PerpAMM** — Counter-party AMM with dynamic pricing and LP management
- **PriceOracle** — Multi-source oracle (Fallback, Chainlink, Pyth) with 2-step commit
- **FundingCalculator** — EMA-based funding rate with dampener band
- **LpShareToken** — ERC20 LP shares for pool ownership

Full contract documentation, architecture diagrams, and trade lifecycle flows: [contracts/README.md](contracts/README.md)

## Deployment

Xray uses both **X Layer Mainnet** and **X Layer Testnet**, depending on the component.

The core AI-powered platform, tokenized-stock market data, portfolio analysis, and **OKX DEX Router** integration operate against the mainnet environment. The **Pre-IPO Perpetual DEX** is currently deployed on X Layer Testnet.

### Mainnet

- AI-powered portfolio risk analysis and multi-agent AI
- Tokenized-stock market data and portfolio tracking
- OKX DEX Router integration for onchain swap execution

### X Layer Testnet

The Pre-IPO Perpetual DEX is deployed on **X Layer Testnet (chain ID 1952)**:

| Contract | Address |
|----------|---------|
| PerpFactory | `0x5d03E2e40992194097989c4E73A31cb5a488d774` |
| Mock USDC | `0x3eF520aA55f9d4C74479038C47F41B4037e2Ba6D` |
| Oracle OpenAI | `0x4bea1aB3cC3D53Ca234cd5f73d3A0D1B13462Faa` |
| Perpetual OpenAI | `0xa4e651FC0909d8dffCBDb976a809F9fCdb5Bd2Ba` |
| Oracle ANTHROPIC | `0xBe23cF70D45a52be5c013b65B59442b3b7630473` |
| Perpetual ANTHROPIC | `0xD1AA8df2E2836E28796DB9b684B4EC2F82e4083E` |
| Oracle ANDURIL | `0x7758994494f0113B6926D4F3C17456c1670c51EC` |
| Perpetual ANDURIL | `0x285946aDE58B2265EBe206834dDF461e5BeE2e3d` |
| Oracle NEURALINK | `0xD9Dd71f9e94aC24FB9640f0e38EFBBd305F8Dca2` |
| Perpetual NEURALINK | `0x7dd76e01D574d54Fe64adCaaC32F838B434Aa615` |
| Oracle KALSHI | `0x82748563DF18176999A7278E349f88b7421A8573` |
| Perpetual KALSHI | `0xBD7a39619d12d4c6781c2fc211A78bE19d750DD4` |

## AI Agents

Xray uses a **multi-agent architecture** powered by the OpenAI Agents SDK. Agents communicate through a shared session memory, enabling context passing across analysis turns.

### Agent Architecture

- **Triage Agent** — Routes incoming user requests to the appropriate specialist agent based on intent detection.
- **Market Research Agent** — Researches tokenized stocks with real-time price data, sector analysis, and issuer metadata.
- **News Intelligence Agent** — Aggregates and summarizes news from Google News RSS and Yahoo Finance RSS with theme classification.
- **Trade Specialist** — Executes token swaps via OKX DEX Router. Supports fetching quotes, building swap instructions, and sending transactions on X Layer.
- **Pre-IPO Trading Agent** — Analyzes pre-IPO markets, valuations, and positions. Provides mark price tracking and settlement flow guidance.

### Agent Tools

- **market_data** — Fetches real-time price snapshots from DynamoDB
- **news_search** — Queries news articles and RSS feeds
- **get_swap_route / prepare_trade** — Gets OKX DEX quote and builds swap transaction
- **portfolio_analysis** — Queries holdings, risk evaluations, and generates portfolio insights

## Data Sources

Xray aggregates data from multiple sources to provide comprehensive tokenized equity coverage:

| Source | Data | Coverage |
|--------|------|----------|
| **CoinMarketCap Pro** | Price, market cap, volume, % changes, OHLCV, RWA endpoints | All tokenized stocks |
| **OKX DEX API** | Swap quotes, price impact, routing | All X Layer tokens |
| **PreStock API** | Mark prices, valuations, secondary market data | All pre-IPO tokens |
| **Google News RSS** | Latest financial and crypto news | Tokenized stock news |
| **Yahoo Finance RSS** | Market news and analysis | Broader market context |

## Getting Started

1. Install packages. This project is tested with Node.js >= 18.0.0.

```bash
npm install
```

2. Add `.env.local` file with required environment variables:

```bash
# CoinMarketCap Pro API
CMC_API_KEY=your_cmc_api_key

# OKX DEX Router
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase

# AI Provider
OPENAI_API_KEY=your_openai_api_key
```

3. Deploy Amplify backend:

```bash
npx ampx sandbox
```

4. Start development server:

```bash
npm run dev
```

## AI Credits

Xray uses an AI credits system to power on-demand analysis. New users receive free credits to get started — no purchase required. Credits are consumed when running AI-powered operations: risk evaluations consume based on input/output token usage across the 2-turn analysis pipeline, and each chat message in the multi-agent system consumes based on model token usage.

Xray is currently free for all users. As we scale, usage-based pricing will be introduced so you only pay for the AI analysis you actually use. All AI operations deduct credits at a fixed rate of **$0.05 per 1,000 tokens** (input + output).

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend:** AWS Amplify Gen 2, AWS Lambda, DynamoDB
- **AI:** OpenAI Agents SDK, multi-agent architecture with session memory
- **Blockchain:** ethers.js, OKX DEX Router, X Layer (EVM-compatible)
- **Smart Contracts:** Foundry, Solidity, OpenZeppelin
- **Data:** CoinMarketCap Pro, Google News RSS, Yahoo Finance RSS

## License

MIT
