// Usage: npx tsx scripts/open-ai/3-agent-with-tools.ts

import { Agent, run, tool } from '@openai/agents'
import { z } from 'zod'
import { getClient, PROVIDER_MODEL } from './provider'

// --- Mock tools ---

function findKey(map: Record<string, unknown>, input: string): string | undefined {
  const lower = input.toLowerCase()
  return Object.keys(map).find((k) => k.toLowerCase() === lower)
}

const getTokenPrice = tool({
  name: 'get_token_price',
  description: 'Get the current price of a tokenized stock on X Layer.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol (e.g., "NVDAx", "TSLAx")'),
  }),
  async execute({ symbol }) {
    const prices: Record<string, number> = {
      'NVDAx': 245.50,
      'TSLAx': 178.30,
      'AAPLx': 198.75,
      'MSFTx': 420.10,
    }
    const key = findKey(prices, symbol)
    const price = key ? prices[key] : undefined
    return price != null ? `${symbol}: $${price} USDC` : `Price for ${symbol} not found.`
  },
})

const getMarketCap = tool({
  name: 'get_market_cap',
  description: 'Get the market cap of a tokenized stock.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol'),
  }),
  async execute({ symbol }) {
    const caps: Record<string, string> = {
      'NVDAx': '$598B',
      'TSLAx': '$568B',
      'AAPLx': '$3.1T',
      'MSFTx': '$3.2T',
    }
    const key = findKey(caps, symbol)
    return key ? `${symbol} market cap: ${caps[key]}` : `Market cap for ${symbol} not found.`
  },
})

const getRiskScore = tool({
  name: 'get_risk_score',
  description: 'Get the risk score (1-10) of a tokenized stock.',
  parameters: z.object({
    symbol: z.string().describe('Token symbol'),
  }),
  async execute({ symbol }) {
    const scores: Record<string, number> = {
      'NVDAx': 7,
      'TSLAx': 8,
      'AAPLx': 3,
      'MSFTx': 2,
    }
    const key = findKey(scores, symbol)
    const score = key ? scores[key] : undefined
    return score != null ? `${symbol} risk score: ${score}/10` : `Risk data for ${symbol} not found.`
  },
})

async function main() {
  getClient()

  const agent = new Agent({
    name: 'Xray Agent',
    instructions: `
      You are Xray, an AI agent for tokenized stocks and pre-IPO on X Layer.
      Use your tools to help users research tokens, check prices, market caps, and risk scores.
      Always verify data using tools before responding.
    `,
    model: PROVIDER_MODEL,
    tools: [getTokenPrice, getMarketCap, getRiskScore],
  })

  console.log('--- Test 1: Token price ---')
  const r1 = await run(agent, 'What is the current price of NVDAx?')
  console.log(r1.finalOutput)

  console.log('\n--- Test 2: Market cap ---')
  const r2 = await run(agent, 'What is the market cap of AAPLx?')
  console.log(r2.finalOutput)

  console.log('\n--- Test 3: Risk score ---')
  const r3 = await run(agent, 'How risky is TSLAx?')
  console.log(r3.finalOutput)
}

main().catch(console.error)
