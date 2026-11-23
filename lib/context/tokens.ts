import { NeutralMessage } from "./types";

/**
 * Fast, accurate token estimator (~4 chars per token average in English/code, + per-message overhead).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard heuristic: 1 token ≈ 4 characters or ~0.75 words
  const charBased = Math.ceil(text.length / 3.8);
  const words = text.trim().split(/\s+/).length;
  const wordBased = Math.ceil(words * 1.3);
  return Math.max(charBased, wordBased);
}

/**
 * Counts total estimated tokens in a conversation history, accounting for chat format framing.
 */
export function countHistoryTokens(messages: NeutralMessage[]): number {
  let count = 0;
  for (const msg of messages) {
    count += estimateTokens(msg.content) + 4; // role + delimiter tokens
  }
  return count;
}

/**
 * Truncates history to fit within a target model's context budget.
 * Always preserves the system message (if present) and the latest user turn.
 */
export function truncateHistory(
  messages: NeutralMessage[],
  maxTokens: number
): { messages: NeutralMessage[]; truncated: boolean; removedCount: number } {
  if (messages.length <= 1) {
    return { messages, truncated: false, removedCount: 0 };
  }

  const totalTokens = countHistoryTokens(messages);
  if (totalTokens <= maxTokens) {
    return { messages, truncated: false, removedCount: 0 };
  }

  // Separate system prompt if first message
  let systemPrompt: NeutralMessage | null = null;
  let conversationTurns: NeutralMessage[] = [...messages];

  if (messages[0].role === "system") {
    systemPrompt = messages[0];
    conversationTurns = messages.slice(1);
  }

  const systemTokens = systemPrompt ? estimateTokens(systemPrompt.content) + 4 : 0;
  const availableTokens = Math.max(1, maxTokens - systemTokens);

  // Keep turns from the end towards the beginning
  const keptTurns: NeutralMessage[] = [];
  let currentTokens = 0;
  let removedCount = 0;

  for (let i = conversationTurns.length - 1; i >= 0; i--) {
    const turn = conversationTurns[i];
    const turnTokens = estimateTokens(turn.content) + 4;

    if (keptTurns.length === 0 || currentTokens + turnTokens <= availableTokens) {
      keptTurns.unshift(turn);
      currentTokens += turnTokens;
    } else {
      removedCount++;
    }
  }

  const finalMessages = systemPrompt ? [systemPrompt, ...keptTurns] : keptTurns;

  return {
    messages: finalMessages,
    truncated: removedCount > 0,
    removedCount,
  };
}

