import { describe, it, expect } from "vitest";
import { OpenAIAdapter } from "../lib/providers/openai";
import { AnthropicAdapter } from "../lib/providers/anthropic";
import { GeminiAdapter } from "../lib/providers/gemini";
import { GroqAdapter } from "../lib/providers/groq";
import { NeutralMessage } from "../lib/context/types";

describe("Provider Adapters Message Formatting", () => {
  const neutralHistory: NeutralMessage[] = [
    { role: "system", content: "You are helpful." },
    { role: "user", content: "Hello!" },
    { role: "assistant", content: "Hi there!" },
    { role: "user", content: "How does OmniMesh work?" },
  ];

  it("OpenAI adapter translates neutral history to OpenAI format", () => {
    const adapter = new OpenAIAdapter();
    const formatted = adapter.toProviderMessages(neutralHistory);

    expect(formatted).toEqual([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "How does OmniMesh work?" },
    ]);
  });

  it("Anthropic adapter extracts top-level system and alternates roles", () => {
    const adapter = new AnthropicAdapter();
    const { system, messages } = adapter.toProviderMessages(neutralHistory);

    expect(system).toBe("You are helpful.");
    expect(messages.length).toBe(3);
    expect(messages[0]).toEqual({ role: "user", content: "Hello!" });
    expect(messages[1]).toEqual({ role: "assistant", content: "Hi there!" });
    expect(messages[2]).toEqual({ role: "user", content: "How does OmniMesh work?" });
  });

  it("Gemini adapter formats systemInstruction and model turns", () => {
    const adapter = new GeminiAdapter();
    const { systemInstruction, contents } = adapter.toProviderMessages(neutralHistory);

    expect(systemInstruction?.parts[0].text).toBe("You are helpful.");
    expect(contents.length).toBe(3);
    expect(contents[0]).toEqual({ role: "user", parts: [{ text: "Hello!" }] });
    expect(contents[1]).toEqual({ role: "model", parts: [{ text: "Hi there!" }] });
    expect(contents[2]).toEqual({ role: "user", parts: [{ text: "How does OmniMesh work?" }] });
  });

  it("Groq adapter translates neutral history to OpenAI-compatible format", () => {
    const adapter = new GroqAdapter();
    const formatted = adapter.toProviderMessages(neutralHistory);

    expect(formatted).toEqual([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "How does OmniMesh work?" },
    ]);
  });
});
