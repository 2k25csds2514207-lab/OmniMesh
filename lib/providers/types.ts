import { NeutralMessage } from "../context/types";

export interface StreamChunk {
  text: string;
  done?: boolean;
  error?: string;
  tokens?: {
    prompt: number;
    completion: number;
  };
}

export interface ProviderAdapter {
  id: "openai" | "anthropic" | "gemini" | "groq" | "mock";
  name: string;
  toProviderMessages(history: NeutralMessage[]): unknown;
  stream(params: {
    apiKey: string;
    model: string;
    history: NeutralMessage[];
    signal?: AbortSignal;
  }): AsyncIterable<StreamChunk>;
}

