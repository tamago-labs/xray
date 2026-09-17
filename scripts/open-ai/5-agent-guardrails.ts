// Usage: npx tsx scripts/open-ai/5-agent-guardrails.ts

import { Agent, run, tool } from '@openai/agents'
import { z } from 'zod'
import { getClient, PROVIDER_MODEL } from './provider'

const executeSwap = tool({
  name: 'execute_swap',
  description: 'Execute a token swap via OKX DEX on X Layer.',
  parameters: z.object({
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.number(),
    slippage: z.number().default(0.5),
  }),
  needsApproval: true,
  async execute({ fromToken, toToken, amount, slippage }) {
    return `Swap executed: ${amount} ${fromToken} -> ${toToken} (slippage: ${slippage}%)`
  },
})

const agent = new Agent({
  name: 'Xray Swap Agent',
  instructions: `
    You help users swap tokenized stocks via OKX DEX on X Layer.
    IMPORTANT: You MUST call the execute_swap tool to execute any swap.
    Do NOT just confirm in text — actually call the tool.
    The tool will pause for approval before executing.
  `,
  model: PROVIDER_MODEL,
  tools: [executeSwap],
})

async function main() {
  getClient()

  console.log('--- Starting swap request ---')
  let result = await run(agent, 'Swap 100 USDC for NVDAx with 0.5% slippage')

  if (result.interruptions?.length) {
    console.log('\n--- Approval Required ---')
    for (const interruption of result.interruptions) {
      console.log('Tool call pending approval:', interruption)
    }

    const state = result.state
    for (const interruption of result.interruptions) {
      state.approve(interruption)
    }

    console.log('\n--- Resuming after approval ---')
    result = await run(agent, state)
  }

  console.log('\n--- Final Result ---')
  console.log(result.finalOutput)
}

main().catch(console.error)
