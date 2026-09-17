// Usage: npx tsx scripts/open-ai/4-agent-handoffs.ts

import { Agent, run } from '@openai/agents'
import { getClient, PROVIDER_MODEL } from './provider'

const researchAgent = new Agent({
  name: 'Token Researcher',
  handoff_description: 'Handles token research, market analysis, and risk assessment.',
  instructions: `
    You research tokenized stocks and pre-IPO tokens on X Layer.
    Analyze price, market cap, risk, and provide insights.
  `,
  model: PROVIDER_MODEL,
})

const portfolioAgent = new Agent({
  name: 'Portfolio Advisor',
  handoff_description: 'Handles portfolio allocation, risk appetite, and diversification advice.',
  instructions: `
    You help users build and manage tokenized stock portfolios based on risk appetite.
    Recommend diversification strategies across xStocks and pre-IPO tokens.
  `,
  model: PROVIDER_MODEL,
})

const swapAgent = new Agent({
  name: 'Swap Specialist',
  handoff_description: 'Handles token swap execution via OKX DEX on X Layer.',
  instructions: `
    You help users swap tokens via OKX DEX on X Layer.
    Confirm token amounts, slippage, and route before executing swaps.
    Never execute without explicit user approval.
  `,
  model: PROVIDER_MODEL,
})

const triageAgent = new Agent({
  name: 'Xray Triage',
  instructions: `
    You are the entry point for Xray, an AI dashboard for tokenized stocks on X Layer.
    Route the user to the right specialist:
    - Token research/analysis questions -> Token Researcher
    - Portfolio/diversification questions -> Portfolio Advisor
    - Swap/trade questions -> Swap Specialist
  `,
  handoffs: [researchAgent, portfolioAgent, swapAgent],
  model: PROVIDER_MODEL,
})

async function main() {
  getClient()

  console.log('--- Test 1: Token research ---')
  const r1 = await run(triageAgent, 'Tell me about NVDAx price and risk')
  console.log('Handled by:', r1.lastAgent?.name)
  console.log(r1.finalOutput)

  console.log('\n--- Test 2: Portfolio advice ---')
  const r2 = await run(triageAgent, 'I have moderate risk appetite. What should I hold?')
  console.log('Handled by:', r2.lastAgent?.name)
  console.log(r2.finalOutput)

  console.log('\n--- Test 3: Swap routing ---')
  const r3 = await run(triageAgent, 'I want to swap 100 USDC for NVDAx')
  console.log('Handled by:', r3.lastAgent?.name)
  console.log(r3.finalOutput)
}

main().catch(console.error)
