// Usage: npx tsx scripts/open-ai/9-agent-session-crud.ts
// https://openai.github.io/openai-agents-js/guides/sessions/

import { Agent, run } from '@openai/agents'
import { randomUUID } from '@openai/agents-core/_shims'
import { getLogger } from '@openai/agents-core'
import type { AgentInputItem, Session } from '@openai/agents-core'
import { getClient, PROVIDER_MODEL } from './provider'

function cloneAgentItem<T extends AgentInputItem>(item: T): T {
  return structuredClone(item)
}

class CustomSession implements Session {
  private readonly sessionId: string
  private readonly logger: ReturnType<typeof getLogger>
  private items: AgentInputItem[]

  constructor(options: { sessionId?: string; initialItems?: AgentInputItem[] } = {}) {
    this.sessionId = options.sessionId ?? randomUUID()
    this.items = options.initialItems ? options.initialItems.map(cloneAgentItem) : []
    this.logger = getLogger('xray:session')
  }

  async getSessionId(): Promise<string> {
    return this.sessionId
  }

  async getItems(limit?: number): Promise<AgentInputItem[]> {
    if (limit === undefined) return this.items.map(cloneAgentItem)
    if (limit <= 0) return []
    const start = Math.max(this.items.length - limit, 0)
    return this.items.slice(start).map(cloneAgentItem)
  }

  async addItems(items: AgentInputItem[]): Promise<void> {
    if (items.length === 0) return
    this.items = [...this.items, ...items.map(cloneAgentItem)]
  }

  async popItem(): Promise<AgentInputItem | undefined> {
    if (this.items.length === 0) return undefined
    const item = this.items[this.items.length - 1]
    this.items = this.items.slice(0, -1)
    return cloneAgentItem(item)
  }

  async clearSession(): Promise<void> {
    this.items = []
  }
}

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

  const session = new CustomSession({ sessionId: 'xray-session-123' })

  console.log('--- Turn 1 ---')
  const r1 = await run(agent, 'I want to track NVDAx and MSFTx.', { session })
  console.log(r1.finalOutput)

  console.log('\n--- Turn 2 ---')
  const r2 = await run(agent, 'Which one has a higher risk score?', { session })
  console.log(r2.finalOutput)

  const history = await session.getItems()
  console.log(`\n--- History: ${history.length} items ---`)

  const undone = await session.popItem()
  if (undone?.type === 'message') {
    console.log(`\n--- Popped last item (${undone.role}) ---`)
  }

  const afterPop = await session.getItems()
  console.log(`--- History now: ${afterPop.length} items ---`)

  await session.clearSession()
  const afterClear = await session.getItems()
  console.log(`--- History after clear: ${afterClear.length} items ---`)
}

main().catch(console.error)
