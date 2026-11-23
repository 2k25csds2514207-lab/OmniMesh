"use client";

import React, { useState, useRef } from "react";
import { useOmniStore } from "@/lib/store/useOmniStore";
import { AVAILABLE_MODELS } from "@/lib/context/types";
import {
  Columns,
  Play,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  Plus,
  Trash2,
  ArrowRight,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SplitView() {
  const {
    splitModels,
    setSplitModels,
    addSplitModel,
    removeSplitModel,
    columnStreams,
    setColumnStream,
    resetColumnStreams,
    setMode,
    setActiveModel,
    messages,
    addMessage,
    activeConversationId,
  } = useOmniStore();

  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const handleStartComparison = async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    resetColumnStreams();

    const currentPrompt = prompt.trim();
    abortControllersRef.current = {};

    // Initialize all columns in store
    splitModels.forEach((m) => {
      setColumnStream(m, {
        text: "",
        isStreaming: true,
        error: undefined,
        latencyMs: undefined,
        tokens: undefined,
      });
    });

    // Launch parallel streaming requests for each model concurrently
    const promises = splitModels.map(async (modelId) => {
      const abortController = new AbortController();
      abortControllersRef.current[modelId] = abortController;
      const startTime = Date.now();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversationId,
            model: modelId,
            prompt: currentPrompt,
            history: messages,
            saveToDb: false,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream available");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              if (data.error) {
                setColumnStream(modelId, { error: data.error, isStreaming: false });
              } else if (data.text) {
                accumulated += data.text;
                setColumnStream(modelId, { text: accumulated });
              } else if (data.done) {
                setColumnStream(modelId, {
                  latencyMs: data.latencyMs || Date.now() - startTime,
                  tokens: data.tokens,
                  isSimulated: data.isSimulated,
                  isStreaming: false,
                });
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          console.log(`Stream stopped for ${modelId}`);
        } else {
          setColumnStream(modelId, {
            error: err instanceof Error ? err.message : "Request failed",
            isStreaming: false,
          });
        }
      } finally {
        setColumnStream(modelId, { isStreaming: false });
      }
    });

    await Promise.allSettled(promises);
    setIsRunning(false);
  };

  const handleStopAll = () => {
    Object.values(abortControllersRef.current).forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current = {};
    setIsRunning(false);
  };

  const handleAdoptResponse = (modelId: string, text: string) => {
    addMessage({ role: "user", content: prompt, createdAt: new Date() });
    addMessage({
      role: "assistant",
      content: text,
      model: modelId,
      createdAt: new Date(),
    });
    setActiveModel(modelId);
    setMode("chat");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-[#fafafa] overflow-hidden relative font-sans">
      {/* Header Controls */}
      <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-[#09090b]/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-indigo-400" />
            <h1 className="text-xs font-bold text-zinc-100 tracking-tight uppercase font-mono-telemetry">
              Split View Benchmark
            </h1>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono-telemetry">
            ({splitModels.length} MODELS CONCURRENT)
          </span>
        </div>

        {/* Model selection tags */}
        <div className="flex items-center gap-2.5">
          {AVAILABLE_MODELS.filter((m) => !splitModels.includes(m.id)).length > 0 &&
            splitModels.length < 4 && (
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Add model to split view"
                  onChange={(e) => {
                    if (e.target.value) {
                      addSplitModel(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                  className="bg-[#18181b] border border-zinc-800 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 font-mono-telemetry cursor-pointer"
                >
                  <option value="" disabled>
                    + Add model to compare...
                  </option>
                  {AVAILABLE_MODELS.filter((m) => !splitModels.includes(m.id)).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>
            )}

          <button
            onClick={() => setMode("chat")}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div
        className={`flex-1 grid gap-4 p-4 md:p-6 overflow-y-auto relative z-10 ${
          splitModels.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : splitModels.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {splitModels.map((modelId) => {
          const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
          const state = columnStreams[modelId] || { text: "", isStreaming: false };

          return (
            <div
              key={modelId}
              className="flex flex-col h-full rounded-xl bg-[#121215] border border-zinc-800 overflow-hidden shadow-sm"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-800 bg-[#18181b] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">{modelDef?.name || modelId}</span>
                    <span
                      className={`text-[9px] uppercase font-mono-telemetry px-1.5 py-0.2 rounded border ${
                        modelDef?.provider === "groq"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : modelDef?.provider === "openai"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : modelDef?.provider === "anthropic"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : modelDef?.provider === "gemini"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                      }`}
                    >
                      {modelDef?.provider || "CUSTOM"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {splitModels.length > 2 && (
                    <button
                      onClick={() => removeSplitModel(modelId)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics bar */}
              <div className="px-3.5 py-1.5 bg-[#121215] border-b border-zinc-800/80 flex items-center justify-between text-[10px] font-mono-telemetry text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{state.latencyMs ? `${state.latencyMs} ms` : "--"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>
                      {state.tokens?.completion ? `${state.tokens.completion} tokens` : "--"}
                    </span>
                  </div>
                </div>

                {(state.isSimulated || state.text.includes("Demo / Simulated Sandbox Response") || modelDef?.provider === "mock") && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    SIMULATED
                  </span>
                )}
              </div>

              {/* Column Content */}
              <div className="flex-1 p-4 overflow-y-auto text-sm prose-custom">
                {state.text && (state.isSimulated || state.text.includes("Demo / Simulated Sandbox Response") || modelDef?.provider === "mock") && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Demo / Simulated Sandbox Output</span>
                  </div>
                )}
                {state.error ? (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <div className="flex items-center gap-2 font-semibold mb-1 text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{modelDef?.provider ? `${modelDef.provider.toUpperCase()} Provider Error` : "Model Error"}</span>
                    </div>
                    <p className="font-mono-telemetry text-[11px] bg-red-950/40 p-2 rounded border border-red-900/30 break-words">
                      {state.error}
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-400">
                      Ensure your {modelDef?.provider?.toUpperCase() || "provider"} API key is configured in the Vault or use a Simulator model.
                    </p>
                  </div>
                ) : state.text ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
                    {state.isStreaming && <span className="cursor-blink" />}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 font-mono-telemetry text-xs py-8">
                    <p>Awaiting prompt dispatch...</p>
                  </div>
                )}
              </div>

              {/* Column Footer: Adopt response button */}
              {state.text && !state.isStreaming && !state.error && (
                <div className="p-3 border-t border-zinc-800 bg-[#18181b]">
                  <button
                    onClick={() => handleAdoptResponse(modelId, state.text)}
                    className="omni-btn-primary w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <span>Adopt Response</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared Comparison Input Bar */}
      <div className="p-4 md:p-5 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent border-t border-zinc-800 relative z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleStartComparison();
              }
            }}
            placeholder="Dispatch prompt across all selected models simultaneously..."
            className="flex-1 bg-[#121215] border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
          />

          {isRunning ? (
            <button
              onClick={handleStopAll}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 transition-colors cursor-pointer"
            >
              Stop All
            </button>
          ) : (
            <button
              onClick={handleStartComparison}
              disabled={!prompt.trim()}
              className="omni-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Compare All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
