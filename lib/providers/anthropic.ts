import { NeutralMessage } from "../context/types";
import { ProviderAdapter, StreamChunk } from "./types";
import { estimateTokens } from "../context/tokens";

export class AnthropicAdapter implements ProviderAdapter {
  id = "anthropic" as const;
  name = "Anthropic";

  toProviderMessages(history: NeutralMessage[]): {
    system?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  } {
    let system: string | undefined = undefined;
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of history) {
      if (msg.role === "system") {
        system = system ? `${system}\n${msg.content}` : msg.content;
      } else {
        const role = msg.role === "assistant" ? "assistant" : "user";
        // Anthropic requires non-empty content and alternating roles
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += `\n\n${msg.content}`;
        } else {
          messages.push({ role, content: msg.content || " " });
        }
      }
    }

    if (messages.length === 0) {
      messages.push({ role: "user", content: "Hello" });
    }

    return { system, messages };
  }

  async *stream(params: {
    apiKey: string;
    model: string;
    history: NeutralMessage[];
    signal?: AbortSignal;
  }): AsyncIterable<StreamChunk> {
    if (!params.apiKey) {
      yield {
        text: "",
        done: true,
        error: "Missing Anthropic API key. Please add your key in the Vault.",
      };
      return;
    }

    const { system, messages } = this.toProviderMessages(params.history);
    let promptTokens = (system ? estimateTokens(system) : 0);
    messages.forEach((m) => {
      promptTokens += estimateTokens(m.content) + 4;
    });

    const modelMapping: Record<string, string> = {
      "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
      "claude-3-haiku": "claude-3-haiku-20240307",
    };
    const targetModel = modelMapping[params.model] || params.model;

    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": params.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          system,
          messages,
          stream: true,
        }),
        signal: params.signal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      yield {
        text: "",
        done: true,
        error: `Network error connecting to Anthropic: ${msg}`,
      };
      return;
    }

    if (!res.ok) {
      let errorDetails = "";
      try {
        const errorJson = await res.json();
        errorDetails = errorJson.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetails = `HTTP status ${res.status} ${res.statusText}`;
      }
      yield {
        text: "",
        done: true,
        error: `Anthropic API Error (${res.status}): ${errorDetails}`,
      };
      return;
    }

    if (!res.body) {
      yield {
        text: "",
        done: true,
        error: "No response body returned from Anthropic.",
      };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let completionText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "content_block_delta" && data.delta?.text) {
                completionText += data.delta.text;
                yield {
                  text: data.delta.text,
                  done: false,
                };
              } else if (data.type === "message_stop") {
                yield {
                  text: "",
                  done: true,
                  tokens: {
                    prompt: promptTokens,
                    completion: estimateTokens(completionText),
                  },
                };
                return;
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield {
      text: "",
      done: true,
      tokens: {
        prompt: promptTokens,
        completion: estimateTokens(completionText),
      },
    };
  }
}

