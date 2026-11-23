import { describe, it, expect } from "vitest";
import { estimateTokens, countHistoryTokens, truncateHistory } from "../lib/context/tokens";
import { NeutralMessage } from "../lib/context/types";

describe("Cross-Model Context & Token Estimation", () => {
  it("should estimate tokens based on text length", () => {
    const text = "Hello, world! This is a test of the OmniMesh token counter.";
    const count = estimateTokens(text);
    expect(count).toBeGreaterThan(5);
    expect(count).toBeLessThan(30);
  });

  it("should preserve system prompt and recent turns during truncation", () => {
    const history: NeutralMessage[] = [
      { role: "system", content: "You are an expert AI assistant." },
      { role: "user", content: "Message 1 " + "word ".repeat(50) },
      { role: "assistant", content: "Response 1 " + "word ".repeat(50) },
      { role: "user", content: "Message 2 " + "word ".repeat(50) },
      { role: "assistant", content: "Response 2 " + "word ".repeat(50) },
      { role: "user", content: "Latest question" },
    ];

    const budget = 120; // Tight token budget
    const { messages, truncated, removedCount } = truncateHistory(history, budget);

    expect(truncated).toBe(true);
    expect(removedCount).toBeGreaterThan(0);
    // System prompt preserved
    expect(messages[0].role).toBe("system");
    // Latest user question preserved
    expect(messages[messages.length - 1].content).toBe("Latest question");
  });

  it("should not truncate if history is well within budget", () => {
    const history: NeutralMessage[] = [
      { role: "user", content: "Short query" },
      { role: "assistant", content: "Short response" },
    ];

    const { messages, truncated } = truncateHistory(history, 4000);
    expect(truncated).toBe(false);
    expect(messages.length).toBe(2);
  });
});
