import { NeutralMessage, AVAILABLE_MODELS } from "../context/types";
import { estimateTokens } from "../context/tokens";

export type RouteCategory = "coding" | "long_context" | "speed" | "reasoning";

export interface SmartRouteInput {
  prompt: string;
  history?: NeutralMessage[];
  availableProviders?: string[]; // e.g. ["openai", "anthropic", "gemini", "groq", "mock"]
}

export interface SmartRouteDecision {
  category: RouteCategory;
  categoryLabel: string;
  targetModel: string;
  provider: "openai" | "anthropic" | "gemini" | "groq" | "mock";
  modelName: string;
  reason: string;
  confidence: number;
  fallbackApplied: boolean;
  notes?: string;
}

interface ModelCandidate {
  modelId: string;
  provider: "openai" | "anthropic" | "gemini" | "groq" | "mock";
  name: string;
}

// Preference tiers per category
const ROUTING_PREFERENCES: Record<RouteCategory, ModelCandidate[]> = {
  coding: [
    { modelId: "claude-3-5-sonnet", provider: "anthropic", name: "Claude 3.5 Sonnet" },
    { modelId: "gpt-4o", provider: "openai", name: "GPT-4o" },
    { modelId: "openai/gpt-oss-120b", provider: "groq", name: "GPT-OSS 120B (Groq)" },
    { modelId: "mock-claude-3-5", provider: "mock", name: "Claude 3.5 Sonnet (Simulator)" },
  ],
  long_context: [
    { modelId: "gemini-1.5-pro", provider: "gemini", name: "Gemini 1.5 Pro (1M Context)" },
    { modelId: "claude-3-5-sonnet", provider: "anthropic", name: "Claude 3.5 Sonnet (200K Context)" },
    { modelId: "gpt-4o", provider: "openai", name: "GPT-4o (128K Context)" },
    { modelId: "mock-gemini-pro", provider: "mock", name: "Gemini 1.5 Pro (Simulator)" },
  ],
  speed: [
    { modelId: "openai/gpt-oss-120b", provider: "groq", name: "GPT-OSS 120B (Groq Ultra-Fast)" },
    { modelId: "gpt-4o-mini", provider: "openai", name: "GPT-4o Mini" },
    { modelId: "claude-3-haiku", provider: "anthropic", name: "Claude 3 Haiku" },
    { modelId: "mock-gpt-4o", provider: "mock", name: "GPT-4o (Simulator)" },
  ],
  reasoning: [
    { modelId: "gpt-4o", provider: "openai", name: "GPT-4o Flagship" },
    { modelId: "claude-3-5-sonnet", provider: "anthropic", name: "Claude 3.5 Sonnet" },
    { modelId: "gemini-3.8-flash", provider: "gemini", name: "Gemini 3.8 Pro" },
    { modelId: "mock-gpt-4o", provider: "mock", name: "GPT-4o (Simulator)" },
  ],
};

const CATEGORY_LABELS: Record<RouteCategory, string> = {
  coding: "Coding & Technical Intelligence",
  long_context: "High Context & Deep Analysis",
  speed: "Ultra-Fast Lookup & Summary",
  reasoning: "General Reasoning & Synthesis",
};

/**
 * Classifies prompt intent and conversation requirements.
 */
export function classifyIntent(prompt: string, history: NeutralMessage[] = []): {
  category: RouteCategory;
  confidence: number;
  signal: string;
} {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Calculate approximate token volume across history and prompt
  let totalTokens = estimateTokens(p);
  for (const h of history) {
    totalTokens += estimateTokens(h.content || "");
  }

  // 2. High Context / Document threshold (> 10,000 tokens or very long text)
  if (totalTokens > 10000 || p.length > 20000) {
    return {
      category: "long_context",
      confidence: 0.98,
      signal: `Token volume (${totalTokens.toLocaleString()} tokens) requires extreme context window.`,
    };
  }

  const longContextKeywords = /\b(document|pdf|thesis|research paper|entire text|summarize this book|transcription|massive|large dataset|csv data|log file|codebase)\b/i;
  if (longContextKeywords.test(lower) && totalTokens > 2500) {
    return {
      category: "long_context",
      confidence: 0.88,
      signal: "Long-form document analysis detected with high token requirements.",
    };
  }

  // 3. Code & Technical Signals
  const codeBlockPattern = /```[\s\S]*?```|`[^`]+`/;
  const codingKeywords = /\b(typescript|javascript|python|rust|golang|c\+\+|java|html|css|tailwind|react|nextjs|prisma|supabase|sql|docker|git|regex|function|class|const|let|def|import|return|interface|type|async|await|bug|debug|error|exception|stack trace|traceback|refactor|unit test|algorithm|endpoint|schema|api route|jwt|hash|crypto|compiler|syntax)\b/i;
  const codingSyntaxSymbols = /(=>|\{\s*\}|console\.log|SELECT\s+.*FROM|npm\s+(i|install|run)|git\s+(commit|push|pull))/i;

  if (codeBlockPattern.test(p) || codingKeywords.test(lower) || codingSyntaxSymbols.test(p)) {
    return {
      category: "coding",
      confidence: 0.95,
      signal: "Software engineering syntax, code logic, or debugging patterns detected.",
    };
  }

  // 4. Speed & Rapid Fact Lookup (< 120 chars, quick query)
  const speedKeywords = /\b(quick|brief|fast|in 1 sentence|in one sentence|bullet points|what is the capital|who is|define|definition of|synonym|antonym|translate|when was|how old is|where is)\b/i;
  const isShortQuestion = p.length < 120 && p.endsWith("?") && p.split(/\s+/).length <= 15;

  if (speedKeywords.test(lower) || isShortQuestion) {
    return {
      category: "speed",
      confidence: 0.9,
      signal: "Short, rapid lookup or concise query suited for sub-second inference.",
    };
  }

  // 5. Default: General reasoning, creativity, broad intelligence
  return {
    category: "reasoning",
    confidence: 0.85,
    signal: "General problem solving, analysis, or creative synthesis.",
  };
}

/**
 * Resolves the optimal model and provider based on classified intent
 * and actual available keys in the user's vault.
 */
export function resolveSmartRoute(input: SmartRouteInput): SmartRouteDecision {
  const { category, confidence, signal } = classifyIntent(input.prompt, input.history);
  const candidates = ROUTING_PREFERENCES[category];

  // Set of providers the user has keys for (always include mock)
  const activeProviders = new Set<string>(
    (input.availableProviders && input.availableProviders.length > 0)
      ? [...input.availableProviders.map((p) => p.toLowerCase()), "mock"]
      : ["mock"]
  );

  const primaryCandidate = candidates[0];
  let selectedCandidate = primaryCandidate;
  let fallbackApplied = false;

  // Check if primary candidate provider is available
  if (!activeProviders.has(primaryCandidate.provider)) {
    // Look for alternative candidate whose provider is available
    const availableCandidate = candidates.find((c) => activeProviders.has(c.provider));
    if (availableCandidate) {
      selectedCandidate = availableCandidate;
      fallbackApplied = true;
    } else {
      // If none of the candidates match available real keys, fall back to mock
      const mockCandidate = candidates.find((c) => c.provider === "mock") || candidates[candidates.length - 1];
      selectedCandidate = mockCandidate;
      fallbackApplied = true;
    }
  }

  // Build user-friendly explanation
  let reason = "";
  if (!fallbackApplied) {
    reason = `${signal} → Auto-routed to ${selectedCandidate.name} (${selectedCandidate.provider.toUpperCase()}) for optimal capability.`;
  } else if (selectedCandidate.provider === "mock") {
    reason = `${signal} → No active API keys in Vault; auto-routed to ${selectedCandidate.name} for instant zero-key testing.`;
  } else {
    reason = `${signal} → ${primaryCandidate.name} preferred, but key is missing. Auto-routed to available ${selectedCandidate.name}.`;
  }

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    targetModel: selectedCandidate.modelId,
    provider: selectedCandidate.provider,
    modelName: selectedCandidate.name,
    reason,
    confidence,
    fallbackApplied,
    notes: signal,
  };
}
