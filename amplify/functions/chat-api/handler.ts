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

function buildReviewSummary(review: Record<string, any>): string {
  try {
    const report = JSON.parse(review.report as string);
    const holdings = JSON.parse(review.holdings as string);
    const topHoldings = holdings
      .filter((h: any) => h.balance > 0 && h.price > 0)
      .sort((a: any, b: any) => (b.balance * b.price) - (a.balance * a.price))
      .slice(0, 5)
      .map((h: any) => `${h.symbol} (${h.balance.toLocaleString()})`)
      .join(', ');
    const concentration = report.deterministicFactors?.concentration ?? 'N/A';
    const marketExposure = report.deterministicFactors?.marketExposure ?? 'N/A';
    const liquidity = report.deterministicFactors?.liquidity ?? 'N/A';
    const issuer = report.deterministicFactors?.issuer ?? 'N/A';
    return `Portfolio: ${review.portfolioName} | Score: ${report.overallScore} (${report.overallLabel}) | Top: ${topHoldings} | Factors: concentration=${concentration}, marketExposure=${marketExposure}, liquidity=${liquidity}, issuer=${issuer} | Summary: ${report.overallSummary ?? ''}`;
  } catch {
    return `Portfolio: ${review.portfolioName}`;
  }
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

  const { message, reviewId } = body;

  if (!reviewId) {
    responseStream.write(`data: ${JSON.stringify({ error: "reviewId is required" })}\n\n`);
    responseStream.end();
    return;
  }

  if (!message || typeof message !== "string") {
    responseStream.write(`data: ${JSON.stringify({ error: "Message is required" })}\n\n`);
    responseStream.end();
    return;
  }

  try {
    const { data: reviewRaw } = await dataClient.models.SavedReview.get({ id: reviewId });
    if (!reviewRaw) {
      responseStream.write(`data: ${JSON.stringify({ error: "Review not found" })}\n\n`);
      responseStream.end();
      return;
    }
    const review = reviewRaw as any;

    let chatItems: any[] = [];
    try {
      chatItems = JSON.parse(review.chats as string) ?? [];
    } catch {
      chatItems = [];
    }

    const OpenAI = (await import("openai")).default;
    const openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });

    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(openaiClient);
    setTracingDisabled(true);

    const historyMessages = chatItems.map((item: any) => {
      const rawRole = item.role ?? "user";
      const role = rawRole === "ai" ? "assistant" : rawRole;
      let content = item.content ?? "";
      if (typeof content === "string") {
        const contentType = role === "assistant" ? "output_text" : "input_text";
        content = [{ type: contentType, text: content }];
      }
      return { type: "message", role, content };
    });

    const allMessages = [
      ...historyMessages,
      { type: "message" as const, role: "user" as const, content: [{ type: "input_text" as const, text: message }] },
    ];
    const reviewSummary = buildReviewSummary(review);
    const triageAgent = createTriageAgent(reviewId, reviewSummary);
    const stream = await run(triageAgent, allMessages as any, { stream: true, maxTurns: 20 });

    const STREAM_TIMEOUT_MS = 250000;
    const NO_PROGRESS_TIMEOUT_MS = 45000;
    let lastEventTime = Date.now();

    const noProgressInterval = setInterval(() => {
      if (Date.now() - lastEventTime > NO_PROGRESS_TIMEOUT_MS) {
        console.error("[stream] no progress — aborting");
        responseStream.write(`data: ${JSON.stringify({ error: "Agent taking too long. Try a shorter message." })}\n\n`);
        responseStream.end();
        process.exit(1);
      }
    }, 5000);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Stream timeout")), STREAM_TIMEOUT_MS)
    );

    try {
      await Promise.race([
        (async () => {
          for await (const event of stream) {
            lastEventTime = Date.now();
            if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
              responseStream.write(`data: ${JSON.stringify({ chunk: event.data.delta })}\n\n`);
            }
            if (event.type === "agent_updated_stream_event") {
              responseStream.write(`data: ${JSON.stringify({ agent: event.agent.name })}\n\n`);
            }
          }
        })(),
        timeoutPromise,
      ]);
    } catch (streamErr) {
      clearInterval(noProgressInterval);
      let msg = "Stream interrupted. Try again.";
      if (streamErr instanceof Error) {
        if (streamErr.message.includes("Max turns")) {
          msg = "Agent took too many steps. Try rephrasing.";
        } else if (streamErr.message.includes("server_error") || streamErr.message.includes("Scheduler unavailable")) {
          msg = "AI provider temporarily unavailable. Please retry in a moment.";
        }
      }
      responseStream.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      clearInterval(noProgressInterval);
    }

    const streamFinalOutput = stream.finalOutput ?? '';

    const finalItems = [
      ...chatItems,
      { type: "message", role: "user", content: message },
      { type: "message", role: "assistant", content: streamFinalOutput || "I'm processing your request. Please try again." },
    ];

    await dataClient.models.SavedReview.update({
      id: reviewId,
      chats: JSON.stringify(finalItems),
    });

    const inputTokens = estimateTokens(message);
    const outputTokens = estimateTokens(streamFinalOutput);
    const creditsUsed = (inputTokens + outputTokens) * CREDIT_RATE;
    try {
      const profileId = review.userProfileId as string;
      if (profileId) {
        const { data: profile } = await dataClient.models.UserProfile.get({ id: profileId });
        if (profile) {
          const p = profile as any;
          const newCredits = Math.max(0, (p.credits ?? 0) - creditsUsed);
          await dataClient.models.UserProfile.update({
            id: p.id,
            credits: newCredits,
          });
        }
      }
    } catch (creditErr) {
      console.error('[credits] failed to deduct:', creditErr);
    }

    responseStream.write(`data: ${JSON.stringify({ done: true, reviewId })}\n\n`);
  } catch (error) {
    console.error("[chat] error:", error);
    responseStream.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`);
  } finally {
    responseStream.end();
  }
}

export const handler = streamifyResponse(chatStreamHandler);
