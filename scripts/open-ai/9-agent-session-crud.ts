// Usage: npx tsx scripts/open-ai/9-agent-session-crud.ts
// https://openai.github.io/openai-agents-js/guides/sessions/

import { Agent, MemorySession, run } from '@openai/agents'
import { getClient, PROVIDER_MODEL } from './provider'

// Session CRUD: getItems, addItems, popItem, clearSession.
// Swap MemorySession for a DB-backed session later (e.g. AWS DynamoDB).

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

  // --- Turn 1 ---
  console.log('--- Turn 1 ---')
  const r1 = await run(agent, 'I want to track NVDAx and MSFTx.', { session })
  console.log(r1.finalOutput)

  // --- Turn 2 ---
  console.log('\n--- Turn 2 ---')
  const r2 = await run(agent, 'Which one has a higher risk score?', { session })
  console.log(r2.finalOutput)

  // --- Inspect history ---
  const history = await session.getItems()
  console.log(`\n--- History: ${history.length} items ---`)

  // --- Pop last item (undo) ---
  const undone = await session.popItem()
  if (undone?.type === 'message') {
    console.log(`\n--- Popped last item (${undone.role}) ---`)
  }

  // --- History after pop ---
  const afterPop = await session.getItems()
  console.log(`--- History now: ${afterPop.length} items ---`)

  // --- Clear session ---
  await session.clearSession()
  const afterClear = await session.getItems()
  console.log(`--- History after clear: ${afterClear.length} items ---`)
}

main().catch(console.error)
