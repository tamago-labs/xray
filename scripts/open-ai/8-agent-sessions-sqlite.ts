// Usage: npx tsx scripts/open-ai/8-agent-sessions-sqlite.ts

import { Agent, SQLiteSession, run } from '@openai/agents'
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

  const session = new SQLiteSession('xray-conversation-123')

  console.log('--- Turn 1 ---')
  const r1 = await run(agent, 'I am interested in semiconductor and cloud stocks.', { session })
  console.log(r1.finalOutput)

  console.log('\n--- Turn 2 ---')
  const r2 = await run(agent, 'NVDAx is semiconductors, MSFTx is cloud.', { session })
  console.log(r2.finalOutput)

  console.log('\n--- Turn 3 (cross-turn reference) ---')
  const r3 = await run(agent, 'Which one is in semiconductors again?', { session })
  console.log(r3.finalOutput)

  console.log('\n--- Turn 4 (full context recall) ---')
  const r4 = await run(agent, 'List all the tokens I mentioned and their sectors.', { session })
  console.log(r4.finalOutput)

  console.log('\nSession persisted to SQLite. Restart and reuse the same session ID to continue.')
}

main().catch(console.error)
