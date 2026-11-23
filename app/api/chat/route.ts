import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { decryptApiKey } from "@/lib/vault/crypto";
import { getProviderAdapter, findModel } from "@/lib/providers";
import { NeutralMessage } from "@/lib/context/types";
import { truncateHistory, estimateTokens } from "@/lib/context/tokens";
import { resolveSmartRoute } from "@/lib/router/smartRouter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const {
      conversationId: incomingConvId,
      model = "gpt-4o",
      prompt,
      history = [],
      saveToDb = true,
    } = await req.json();

    if (!prompt && (!history || history.length === 0)) {
      return new Response(JSON.stringify({ error: "Prompt or message history is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query active keys for the user to support smart routing decisions & fallback
    const userKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: { provider: true },
    });
    const availableProviders = userKeys.map((k) => k.provider);

    let effectiveModel = model;
    let smartDecision: ReturnType<typeof resolveSmartRoute> | null = null;

    if (model === "smart-router") {
      smartDecision = resolveSmartRoute({
        prompt: prompt || "",
        history,
        availableProviders,
      });
      effectiveModel = smartDecision.targetModel;
    }

    const modelDef = findModel(effectiveModel);
    const provider = (modelDef?.provider === "auto" ? "mock" : modelDef?.provider) || "mock";
    const contextWindow = modelDef?.contextWindow || 128000;

    let decryptedKey = "";
    if (provider !== "mock") {
      const storedKey = await prisma.apiKey.findUnique({
        where: {
          userId_provider: {
            userId: user.id,
            provider,
          },
        },
      });

      if (!storedKey) {
        return new Response(
          JSON.stringify({
            error: `Missing API key for ${provider.toUpperCase()}. Please add your key in the Vault or use the Simulator models.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      decryptedKey = decryptApiKey(storedKey.encryptedKey, storedKey.iv, storedKey.authTag);
    }

    // Resolve or create conversation
    let conversationId = incomingConvId;
    if (saveToDb) {
      if (!conversationId) {
        const title = prompt ? prompt.slice(0, 30) + (prompt.length > 30 ? "..." : "") : "New Chat";
        const newConv = await prisma.conversation.create({
          data: {
            userId: user.id,
            title,
          },
        });
        conversationId = newConv.id;
      }

      // Persist user message if prompt given
      if (prompt) {
        await prisma.message.create({
          data: {
            conversationId,
            role: "user",
            content: prompt,
            model,
            provider,
            tokens: estimateTokens(prompt),
          },
        });
      }
    }

    // Build neutral history
    const fullHistory: NeutralMessage[] = [...history];
    if (prompt && (fullHistory.length === 0 || fullHistory[fullHistory.length - 1].content !== prompt)) {
      fullHistory.push({
        role: "user",
        content: prompt,
        model,
        provider,
      });
    }

    // Context preservation with token truncation if exceeding target model window
    const { messages: truncatedHistory, truncated, removedCount } = truncateHistory(fullHistory, contextWindow);

    const isSampleKey = decryptedKey.startsWith("sample-") || decryptedKey.startsWith("demo-");
    const isSimulated = isSampleKey || provider === "mock";
    const adapter = isSimulated ? getProviderAdapter("mock") : getProviderAdapter(provider);
    const encoder = new TextEncoder();
    const startTime = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedText = "";
        let finalTokens: { prompt: number; completion: number } | undefined = undefined;

        // If Smart Router was invoked, notify client of routing decision immediately
        if (smartDecision) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                routing: {
                  model: smartDecision.targetModel,
                  modelName: smartDecision.modelName,
                  provider: smartDecision.provider,
                  category: smartDecision.category,
                  categoryLabel: smartDecision.categoryLabel,
                  reason: smartDecision.reason,
                  fallbackApplied: smartDecision.fallbackApplied,
                },
              })}\n\n`
            )
          );
        }

        if (truncated) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                notice: `Note: History was truncated by ${removedCount} earlier messages to fit ${modelDef?.name || effectiveModel}'s context limit.`,
              })}\n\n`
            )
          );
        }

        try {
          for await (const chunk of adapter.stream({
            apiKey: decryptedKey,
            model: effectiveModel,
            history: truncatedHistory,
            signal: req.signal,
          })) {
            if (chunk.error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
              );
              break;
            }

            if (chunk.text) {
              accumulatedText += chunk.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
              );
            }

            if (chunk.done) {
              finalTokens = chunk.tokens;
            }
          }

          const latencyMs = Date.now() - startTime;
          const promptTokens = finalTokens?.prompt || estimateTokens(prompt || "");
          const completionTokens = finalTokens?.completion || estimateTokens(accumulatedText);

          // Save assistant response to DB
          if (saveToDb && conversationId && accumulatedText.trim()) {
            await prisma.message.create({
              data: {
                conversationId,
                role: "assistant",
                content: accumulatedText,
                model: effectiveModel,
                provider,
                tokens: completionTokens,
              },
            });
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId,
                model: effectiveModel,
                provider: isSimulated ? "mock" : provider,
                isSimulated,
                routingReason: smartDecision?.reason,
                routedCategory: smartDecision?.categoryLabel,
                latencyMs,
                tokens: {
                  prompt: promptTokens,
                  completion: completionTokens,
                },
              })}\n\n`
            )
          );
          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Stream processing error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg, done: true })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId || "",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error handling chat stream";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

