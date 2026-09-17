import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { streamifyResponse, ResponseStream } from "lambda-stream";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { Agent, run } from "@openai/agents";
import { env } from "$amplify/env/chat-api";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

const PROVIDER_BASE_URL = "https://api.longcat.ai/openai/v1";
const PROVIDER_MODEL = "LongCat-2.0";

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

  // Mode 1: Create session only (no message) — returns session ID immediately
  if (!message) {
    try {
      const { data: newSession } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: [],
        userProfileId: walletAddress,
      });
      responseStream.write(`data: ${JSON.stringify({ sessionId: newSession?.id })}\n\n`);
    } catch (error) {
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
        sessionItems = (sessions.items as any[]) ?? [];
      }
    }

    if (!currentSessionId) {
      const { data: newSession } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: [],
        userProfileId: walletAddress,
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

    const agent = new Agent({
      name: "Xray Agent",
      instructions: `
        You are Xray, an AI agent for tokenized stocks and pre-IPO on X Layer.
        Be concise and remember context from earlier in the conversation.
      `,
      model: PROVIDER_MODEL,
    });

    const historyMessages = sessionItems.map((item: any) => ({
      type: item.type ?? "message",
      role: item.role ?? "user",
      content: item.content ?? "",
    }));

    const allMessages = [
      ...historyMessages,
      { type: "message" as const, role: "user" as const, content: message },
    ];

    const stream = await run(agent, allMessages as any, { stream: true });

    for await (const event of stream) {
      if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
        responseStream.write(`data: ${JSON.stringify({ chunk: event.data.delta })}\n\n`);
      }
    }

    await stream.completed;

    const finalItems = allMessages.concat(
      [{ type: "message", role: "assistant", content: stream.finalOutput }]
    );

    if (currentSessionId) {
      await dataClient.models.AgentSession.update({
        id: currentSessionId,
        items: finalItems,
      });
    }

    responseStream.write(`data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`);
  } catch (error) {
    console.error("Chat error:", error);
    responseStream.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`);
  } finally {
    responseStream.end();
  }
}

export const handler = streamifyResponse(chatStreamHandler);
