import { ProviderAdapter } from "./types";
import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { GeminiAdapter } from "./gemini";
import { GroqAdapter } from "./groq";
import { MockAdapter } from "./mock";
import { AVAILABLE_MODELS, ModelDefinition } from "../context/types";

const adapters: Record<string, ProviderAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  groq: new GroqAdapter(),
  mock: new MockAdapter(),
};

export function getProviderAdapter(providerId: string): ProviderAdapter {
  const adapter = adapters[providerId.toLowerCase()];
  if (!adapter) {
    throw new Error(`Unknown provider adapter: ${providerId}`);
  }
  return adapter;
}

export function findModel(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export { AVAILABLE_MODELS };
export type { ProviderAdapter };

