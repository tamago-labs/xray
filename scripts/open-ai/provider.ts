// Xray AI Agent Provider Config
// Uses OpenAI-compatible endpoint via the OpenAI SDK and wires it into the Agents SDK.
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import { setDefaultOpenAIClient, setTracingDisabled } from '@openai/agents'

export const PROVIDER_BASE_URL = 'https://api.longcat.ai/openai/v1'
export const PROVIDER_MODEL = 'LongCat-2.0'

let _client: OpenAI | null = null

export function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set in environment')
    }
    _client = new OpenAI({ apiKey, baseURL: PROVIDER_BASE_URL })
    setDefaultOpenAIClient(_client)
    setTracingDisabled(true)
  }
  return _client
}
