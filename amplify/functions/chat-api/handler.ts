import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { streamifyResponse, ResponseStream } from "lambda-stream";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { run } from "@openai/agents";
import { env } from "$amplify/env/chat-api";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { PROVIDER_BASE_URL, PROVIDER_MODEL } from "./provider";
import { createTriageAgent } from "./agents/triage";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

const CREDIT_RATE = 0.01;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function chatStreamHandler(
  event: APIGatewayProxyEventV2,
  responseStream: ResponseStream
): Promise<void> {
  const metadata = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "X-Accel-Buffering": "no",
    },
  };

  responseStream.setContentType(metadata.headers["Content-Type"]);

  let body: any;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    responseStream.write(`data: ${JSON.stringify({ error: "Invalid JSON" })}\n\n`);
    responseStream.end();
    return;
  }

  const { message, sessionName, sessionId, walletAddress } = body;

  if (!walletAddress) {
    responseStream.write(`data: ${JSON.stringify({ error: "walletAddress is required" })}\n\n`);
    responseStream.end();
    return;
  }

  // Mode 1: Create empty session — returns session ID immediately
  if (!sessionId) {
    try {
      const { data: newSession, errors } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: JSON.stringify([]),
        walletAddress,
      });
      if (errors) {
        console.error('[create session] errors:', JSON.stringify(errors));
      }
      console.log('[create session] newSession:', JSON.stringify(newSession));
      responseStream.write(`data: ${JSON.stringify({ sessionId: newSession?.id ?? null })}\n\n`);
    } catch (error) {
      console.error('[create session] exception:', error);
      responseStream.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create session" })}\n\n`);
    }
    responseStream.end();
    return;
  }

  // Mode 2: Stream chat
  if (!message || typeof message !== "string") {
    responseStream.write(`data: ${JSON.stringify({ error: "Message is required" })}\n\n`);
    responseStream.end();
    return;
  }

  try {
    let sessionItems: any[] = [];
    let currentSessionId = sessionId;

    if (currentSessionId) {
      const { data: sessions } = await dataClient.models.AgentSession.get({ id: currentSessionId });
      if (sessions) {
        sessionItems = JSON.parse(sessions.items as string) ?? [];
      }
    }

    if (!currentSessionId) {
      const { data: newSession } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: JSON.stringify([]),
        walletAddress,
      });
      currentSessionId = newSession?.id ?? undefined;
    }

    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });

    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(client);
    setTracingDisabled(true);

    const historyMessages = sessionItems.map((item: any) => {
      const role = item.role ?? "user";
      let content = item.content ?? "";
      if (typeof content === "string") {
        const contentType = role === "assistant" ? "output_text" : "input_text";
        content = [{ type: contentType, text: content }];
      }
      return { type: item.type ?? "message", role, content };
    });

    const allMessages = [
      ...historyMessages,
      { type: "message" as const, role: "user" as const, content: [{ type: "input_text" as const, text: message }] },
    ];

    const triageAgent = createTriageAgent(walletAddress);
    const stream = await run(triageAgent, allMessages as any, { stream: true, maxTurns: 20 });

    const STREAM_TIMEOUT_MS = 250000;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Stream timeout")), STREAM_TIMEOUT_MS)
    );

    const newTrades: any[] = [];

    try {
      await Promise.race([
        (async () => {
          for await (const event of stream) {
            try {
              if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
                responseStream.write(`data: ${JSON.stringify({ chunk: event.data.delta })}\n\n`);
              }
              if (event.type === "agent_updated_stream_event") {
                responseStream.write(`data: ${JSON.stringify({ agent: event.agent.name })}\n\n`);
              }
              if (event.type === "run_item_stream_event") {
                const item = event.item as any;
                const itemType = item.type ?? "";
                const rawType = item.rawItem?.type ?? "";
                const toolName = item.rawItem?.name ?? item.name ?? "";
                console.log("[stream] itemType:", itemType, "rawType:", rawType, "toolName:", toolName, "rawKeys:", item.rawItem ? Object.keys(item.rawItem).join(",") : "none", "keys:", Object.keys(item).join(","));
                if (toolName.includes("prepare_trade") || itemType.includes("prepare_trade")) {
                  if (rawType === "function_call_output" || itemType === "tool_call_output_item") {
                    try {
                      const raw = item.rawItem?.output ?? item.output ?? item.rawItem?.result ?? item.result;
                      if (raw != null) {
                        const output = typeof raw === "string" ? raw : JSON.stringify(raw);
                        const parsed = JSON.parse(output);
                        if (!parsed.error) {
                          const trade = { ...parsed, status: "pending", createdAt: new Date().toISOString() };
                          newTrades.push(trade);
                          responseStream.write(`data: ${JSON.stringify({ trade })}\n\n`);
                          console.log("[stream] trade sent");
                        }
                      } else {
                        console.log("[stream] trade output is null, rawItem:", JSON.stringify(item.rawItem)?.slice(0, 300));
                      }
                    } catch (e) {
                      console.log("[stream] trade parse error:", e);
                    }
                  }
                }
              }
            } catch (eventErr) {
              console.error("[stream] event error:", eventErr);
            }
          }
        })(),
        timeoutPromise,
      ]);
    } catch (streamErr) {
      console.error("[stream] error or timeout:", streamErr);
      const msg = streamErr instanceof Error && streamErr.message.includes("Max turns")
        ? "This request was too complex. Try breaking it into smaller questions."
        : "Stream interrupted";
      responseStream.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    }

    const finalItems = allMessages.concat(
      [{ type: "message", role: "assistant", content: [{ type: "output_text", text: stream.finalOutput ?? "" }] }]
    );

    if (currentSessionId) {
      await dataClient.models.AgentSession.update({
        id: currentSessionId,
        items: JSON.stringify(finalItems),
      });
    }

    if (currentSessionId && newTrades.length > 0) {
      try {
        const { data: session } = await dataClient.models.AgentSession.get({ id: currentSessionId });
        const existingTransactions = session?.transactions ? JSON.parse(session.transactions as string) : [];
        const updatedTransactions = [...existingTransactions, ...newTrades];
        await dataClient.models.AgentSession.update({
          id: currentSessionId,
          transactions: JSON.stringify(updatedTransactions),
        });
      } catch (tradeErr) {
        console.error("[trades] failed to save:", tradeErr);
      }
    }

    const inputTokens = estimateTokens(message);
    const outputTokens = estimateTokens(stream.finalOutput ?? '');
    const creditsUsed = (inputTokens + outputTokens) * CREDIT_RATE;
    console.log(`[credits] inputTokens=${inputTokens} outputTokens=${outputTokens} creditsUsed=${creditsUsed}`);

    try {
      const { data: profiles } = await dataClient.models.UserProfile.list({
        filter: { walletAddress: { eq: walletAddress } },
      });
      const profile = profiles?.[0];
      if (profile) {
        const newCredits = Math.max(0, (profile.credits ?? 0) - creditsUsed);
        await dataClient.models.UserProfile.update({
          id: profile.id,
          credits: newCredits,
        });
        console.log(`[credits] deducted ${creditsUsed} from ${profile.id}, new balance: ${newCredits}`);
      }
    } catch (creditErr) {
      console.error('[credits] failed to deduct:', creditErr);
    }

    responseStream.write(`data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`);
  } catch (error) {
    console.error("Chat error:", error);
    responseStream.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`);
  } finally {
    console.log("[stream] closing response stream");
    responseStream.end();
  }
}

export const handler = streamifyResponse(chatStreamHandler);
