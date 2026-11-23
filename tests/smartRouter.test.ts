import { describe, it, expect } from "vitest";
import { classifyIntent, resolveSmartRoute } from "../lib/router/smartRouter";
import { findModel } from "../lib/providers";
import { AVAILABLE_MODELS } from "../lib/context/types";

describe("OmniMesh Autonomous Smart Router", () => {
  it("registers smart-router model in AVAILABLE_MODELS registry", () => {
    const model = findModel("smart-router");
    expect(model).toBeDefined();
    expect(model?.id).toBe("smart-router");
    expect(model?.provider).toBe("auto");
    expect(model?.name).toContain("Smart Router");
  });

  describe("Intent Classification", () => {
    it("classifies code and software engineering prompts as 'coding'", () => {
      const result1 = classifyIntent("Write a TypeScript rate limiter using Redis");
      expect(result1.category).toBe("coding");
      expect(result1.confidence).toBeGreaterThan(0.9);

      const result2 = classifyIntent("```python\ndef solve(x):\n    return x * 2\n```\nFix the bug here");
      expect(result2.category).toBe("coding");

      const result3 = classifyIntent("How do I write a Prisma query to find unique users and their posts?");
      expect(result3.category).toBe("coding");
    });

    it("classifies quick lookups and short questions as 'speed'", () => {
      const result1 = classifyIntent("What is the capital of France?");
      expect(result1.category).toBe("speed");

      const result2 = classifyIntent("quick bullet points of the Apollo 11 mission");
      expect(result2.category).toBe("speed");

      const result3 = classifyIntent("define idempotent in 1 sentence");
      expect(result3.category).toBe("speed");
    });

    it("classifies massive context and document analysis as 'long_context'", () => {
      // Simulate large document history
      const largeText = "word ".repeat(15000); // ~15,000 words / tokens
      const result = classifyIntent("Summarize the key findings from this paper", [
        { role: "user", content: largeText },
      ]);
      expect(result.category).toBe("long_context");
    });

    it("classifies broad philosophical and creative questions as 'reasoning'", () => {
      const result = classifyIntent(
        "Analyze the ethical and existential implications of conscious synthetic intelligence in society."
      );
      expect(result.category).toBe("reasoning");
    });
  });

  describe("Provider Matching and Smart Fallback", () => {
    it("routes to optimal primary model when all provider keys are available", () => {
      const allProviders = ["openai", "anthropic", "gemini", "groq", "mock"];

      // Coding -> Claude 3.5 Sonnet
      const codingRoute = resolveSmartRoute({
        prompt: "Write a Rust async worker pool",
        availableProviders: allProviders,
      });
      expect(codingRoute.targetModel).toBe("claude-3-5-sonnet");
      expect(codingRoute.provider).toBe("anthropic");
      expect(codingRoute.fallbackApplied).toBe(false);

      // Speed -> Groq
      const speedRoute = resolveSmartRoute({
        prompt: "What is the speed of light?",
        availableProviders: allProviders,
      });
      expect(speedRoute.provider).toBe("groq");
      expect(speedRoute.fallbackApplied).toBe(false);

      // Reasoning -> GPT-4o
      const reasoningRoute = resolveSmartRoute({
        prompt: "Brainstorm marketing strategies for a bootstrapped B2B SaaS startup",
        availableProviders: allProviders,
      });
      expect(reasoningRoute.targetModel).toBe("gpt-4o");
      expect(reasoningRoute.provider).toBe("openai");
      expect(reasoningRoute.fallbackApplied).toBe(false);
    });

    it("falls back gracefully when the preferred provider key is missing", () => {
      // User only has OpenAI and Groq keys (no Anthropic key)
      const partialProviders = ["openai", "groq"];

      const codingRoute = resolveSmartRoute({
        prompt: "Write a Python script with decorators and metaclasses",
        availableProviders: partialProviders,
      });

      // Anthropic preferred for coding, but missing -> falls back to OpenAI GPT-4o
      expect(codingRoute.provider).toBe("openai");
      expect(codingRoute.targetModel).toBe("gpt-4o");
      expect(codingRoute.fallbackApplied).toBe(true);
      expect(codingRoute.reason).toContain("missing");
    });

    it("falls back to zero-key Simulator models when no API keys are configured", () => {
      const emptyProviders: string[] = [];

      const route = resolveSmartRoute({
        prompt: "Fix this SQL syntax error: SELECT * FORM users",
        availableProviders: emptyProviders,
      });

      expect(route.provider).toBe("mock");
      expect(route.targetModel).toBe("mock-claude-3-5");
      expect(route.fallbackApplied).toBe(true);
      expect(route.reason).toContain("No active API keys in Vault");
    });
  });
});
