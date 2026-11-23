import { NeutralMessage } from "../context/types";
import { ProviderAdapter, StreamChunk } from "./types";
import { estimateTokens } from "../context/tokens";

export class GeminiAdapter implements ProviderAdapter {
  id = "gemini" as const;
  name = "Google Gemini";

  toProviderMessages(history: NeutralMessage[]): {
    systemInstruction?: { parts: Array<{ text: string }> };
    contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
  } {
    let systemText = "";
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      if (msg.role === "system") {
        systemText = systemText ? `${systemText}\n${msg.content}` : msg.content;
      } else {
        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: msg.content || " " }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    return {
      systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
      contents,
    };
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
        error: "Missing Google Gemini API key. Please add your key in the Vault.",
      };
      return;
    }

    const { systemInstruction, contents } = this.toProviderMessages(params.history);
    const modelName = params.model.startsWith("gemini") ? params.model : "gemini-1.5-pro";

    let promptTokens = systemInstruction ? estimateTokens(systemInstruction.parts[0].text) : 0;
    contents.forEach((c) => {
      promptTokens += estimateTokens(c.parts[0].text) + 4;
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${params.apiKey}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction,
          contents,
        }),
        signal: params.signal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      yield {
        text: "",
        done: true,
        error: `Network error connecting to Gemini: ${msg}`,
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
        error: `Gemini API Error (${res.status}): ${errorDetails}`,
      };
      return;
    }

    if (!res.body) {
      yield {
        text: "",
        done: true,
        error: "No response body returned from Gemini.",
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
              const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                completionText += textChunk;
                yield {
                  text: textChunk,
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

