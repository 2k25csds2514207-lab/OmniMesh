import { NeutralMessage } from "../context/types";
import { ProviderAdapter, StreamChunk } from "./types";
import { estimateTokens } from "../context/tokens";

export class MockAdapter implements ProviderAdapter {
  id = "mock" as const;
  name = "OmniMesh Mock Simulator";

  toProviderMessages(history: NeutralMessage[]): NeutralMessage[] {
    return history;
  }

  async *stream(params: {
    apiKey: string;
    model: string;
    history: NeutralMessage[];
    signal?: AbortSignal;
  }): AsyncIterable<StreamChunk> {
    const lastUserMsg = [...params.history].reverse().find((m) => m.role === "user");
    const prompt = lastUserMsg?.content || "Hello";

    // Simulate different model personalities & perspectives
    let responseText = "";
    if (params.model.includes("gpt")) {
      responseText = `### [GPT-4o Simulation]\n\nHere is a structured, direct analysis of your prompt:\n\n> "${prompt}"\n\n#### Key Dimensions:\n1. **Core Concept**: Efficiently address requirements with precision and clarity.\n2. **Actionable Steps**:\n   - Step 1: Define baseline criteria and constraints.\n   - Step 2: Implement scalable primitives with unit test validation.\n   - Step 3: Continuously benchmark latency and resource utilization.\n\n\`\`\`ts\n// Sample GPT-4o implementation pattern\nfunction executePlan(input: string) {\n  console.log("Analyzing:", input);\n  return { success: true, timestamp: Date.now() };\n}\n\`\`\`\n\n*Simulated response streaming complete.*`;
    } else if (params.model.includes("claude")) {
      responseText = `### [Claude 3.5 Sonnet Simulation]\n\nI have carefully evaluated your inquiry regarding:\n\n> "${prompt}"\n\n#### Thoughtful Synthesis:\n- **Conceptual Depth**: Looking at the nuances, there is a distinct interplay between robustness and architectural simplicity.\n- **Recommended Approach**:\n  1. Prioritize type safety and boundary validation.\n  2. Ensure graceful degradation when external systems fail.\n  3. Maintain clean separation between presentation, state, and provider layers.\n\n\`\`\`python\n# Claude architectural recommendation\ndef analyze_context(history):\n    return [msg for msg in history if msg.is_valid()]\n\`\`\`\n\nFeel free to ask follow-up questions or request further refinement!`;
    } else {
      responseText = `### [Gemini 1.5 Pro Simulation]\n\nComprehensive breakdown for:\n\n> "${prompt}"\n\n#### Executive Overview:\n- **Multimodal & Long-Context Strength**: Ideal for processing massive documents, multi-file codebases, and rich context trees.\n- **Key Takeaways**:\n  * Fast multimodal token throughput.\n  * Deep cross-referencing capabilities across extended message histories.\n  * Seamless scalability across enterprise pipelines.\n\n\`\`\`json\n{\n  "model": "gemini-1.5-pro",\n  "status": "ready",\n  "contextTokens": 1000000\n}\n\`\`\`\n\nGenerated with simulated Gemini Pro latency profile.`;
    }

    // Stream out words with realistic delays
    const words = responseText.split(" ");
    let accumulated = "";

    for (let i = 0; i < words.length; i++) {
      if (params.signal?.aborted) {
        return;
      }
      const chunk = (i === 0 ? "" : " ") + words[i];
      accumulated += chunk;

      // Small jitter delay
      await new Promise((resolve) => setTimeout(resolve, 25));

      yield {
        text: chunk,
        done: false,
      };
    }

    const promptTokens = estimateTokens(prompt);
    const completionTokens = estimateTokens(accumulated);

    yield {
      text: "",
      done: true,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
      },
    };
  }
}

