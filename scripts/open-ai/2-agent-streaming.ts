// Usage: npx tsx scripts/open-ai/2-agent-streaming.ts

import { Agent, run } from '@openai/agents'
import { getClient, PROVIDER_MODEL } from './provider'

async function main() {
  getClient()

  const agent = new Agent({
    name: 'Xray Agent',
    instructions: `
      You are Xray, an AI agent for tokenized stocks and pre-IPO on X Layer.
      Provide concise insights about tokens, market trends, and portfolio strategy.
    `,
    model: PROVIDER_MODEL,
  })

  console.log('--- Streaming response ---\n')

  const stream = await run(agent, 'Give me 3 insights about NVDAx tokenized stock.', { stream: true })

  for await (const event of stream) {
    if (event.type === 'raw_model_stream_event' && event.data.type === 'output_text_delta') {
      process.stdout.write(event.data.delta)
    }
  }

  await stream.completed
  console.log('\n\n--- Stream complete ---')
}

main().catch(console.error)
