// Usage: npx tsx scripts/open-ai/7-agent-sessions.ts

import { Agent, MemorySession, run } from '@openai/agents'
import { getClient, PROVIDER_MODEL } from './provider'

async function main() {
  getClient()

  const agent = new Agent({
    name: 'Xray Agent',
    instructions: `
      You are Xray, an AI agent for tokenized stocks and pre-IPO on X Layer.
      Be concise and remember context from earlier in the conversation.
    `,
    model: PROVIDER_MODEL,
  })

  const session = new MemorySession()

  console.log('--- Turn 1 ---')
  const r1 = await run(agent, 'I want to invest in AI-related tokenized stocks.', { session })
  console.log(r1.finalOutput)

  console.log('\n--- Turn 2 (follows up on Turn 1) ---')
  const r2 = await run(agent, 'Which ones have the highest growth potential?', { session })
  console.log(r2.finalOutput)

  console.log('\n--- Turn 3 (refers to earlier context) ---')
  const r3 = await run(agent, 'What was the sector I mentioned earlier?', { session })
  console.log(r3.finalOutput)

  console.log('\n--- Turn 4 (multi-turn reasoning) ---')
  const r4 = await run(agent, 'List the tokens we discussed and their key metrics.', { session })
  console.log(r4.finalOutput)
}

main().catch(console.error)
