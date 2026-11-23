export type MessageRole = "user" | "assistant" | "system";

export interface NeutralMessage {
  id?: string;
  role: MessageRole;
  content: string;
  model?: string | null;
  provider?: string | null;
  tokens?: number | null;
  createdAt?: string | Date;
  routingReason?: string | null;
  routedCategory?: string | null;
  isSimulated?: boolean;
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "gemini" | "groq" | "mock" | "auto";
  contextWindow: number; // in tokens
  maxOutputTokens: number;
  description: string;
  badge?: string;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // Autonomous Smart Router
  {
    id: "smart-router",
    name: "Smart Router (Auto)",
    provider: "auto",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    description: "Analyzes prompt intent & available keys to automatically route to the optimal model",
    badge: "Auto Dispatch",
  },
  // OpenAI
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    description: "Flagship multimodal intelligence from OpenAI",
    badge: "OpenAI Flagship",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    description: "Fast, cost-efficient small model for everyday tasks",
    badge: "Fast & Light",
  },
  // Anthropic
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: "Industry-leading reasoning, coding, and nuance",
    badge: "Anthropic Benchmark",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    description: "Ultra-fast response times for lightweight tasks",
    badge: "Ultra Fast",
  },
  // Google Gemini
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Extreme 1M token context window for massive documents",
    badge: "1M Context",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "gemini",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "High speed, high throughput multimodal model",
    badge: "High Speed",
  },
  // Groq (LPU Ultra-Fast Inference)
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B (Groq)",
    provider: "groq",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    description: "OpenAI's open-weight 120B model with reasoning, running on Groq at ~500 tokens/sec.",
    badge: "Ultra Fast",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B (Groq)",
    provider: "groq",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    description: "Compact open-weight 20B reasoning model on Groq at ~1000 tokens/sec.",
    badge: "Instant Speed",
  },

  {
    id: "allam-2-7b",
    name: "ALLaM 2 7B (Groq)",
    provider: "groq",
    contextWindow: 4096,
    maxOutputTokens: 2048,
    description: "Compact Arabic and English model on Groq.",
    badge: "Light",
  },
  // Mock / Demo (Zero Key Required for Instant Testing)
  {
    id: "mock-gpt-4o",
    name: "GPT-4o (Simulator)",
    provider: "mock",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    description: "Instant response simulator - no API key needed",
    badge: "Demo Mode",
  },
  {
    id: "mock-claude-3-5",
    name: "Claude 3.5 Sonnet (Simulator)",
    provider: "mock",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: "Detailed analysis simulator - no API key needed",
    badge: "Demo Mode",
  },
  {
    id: "mock-gemini-pro",
    name: "Gemini 1.5 Pro (Simulator)",
    provider: "mock",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: "Comprehensive structure simulator - no API key needed",
    badge: "Demo Mode",
  },
];

