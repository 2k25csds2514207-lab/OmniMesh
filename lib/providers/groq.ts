import { NeutralMessage } from "../context/types";
import { ProviderAdapter, StreamChunk } from "./types";
import { estimateTokens } from "../context/tokens";

export class GroqAdapter implements ProviderAdapter {
  id = "groq" as const;
  name = "Groq";

  toProviderMessages(history: NeutralMessage[]): Array<{ role: string; content: string }> {
    return history.map((msg) => ({
      role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));
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
        error: "Missing Groq API key. Please add your key in the Vault.",
      };
      return;
    }

    const messages = this.toProviderMessages(params.history);
    let promptTokens = 0;
    messages.forEach((m) => {
      promptTokens += estimateTokens(m.content) + 4;
    });

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model,
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
        error: `Network error connecting to Groq: ${msg}`,
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
        error: `Groq API Error (${res.status}): ${errorDetails}`,
      };
      return;
    }

    if (!res.body) {
      yield {
        text: "",
        done: true,
        error: "No response body returned from Groq.",
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
          if (trimmed === "data: [DONE]") {
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

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                completionText += delta;
                yield {
                  text: delta,
                  done: false,
                };
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
