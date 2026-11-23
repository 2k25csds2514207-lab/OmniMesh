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
  Sparkles,
  ArrowRight,
  RotateCcw,
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
            saveToDb: false, // In split comparison, don't persist all columns until adopted
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
            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.error) {
                  setColumnStream(modelId, {
                    error: data.error,
                    isStreaming: false,
                  });
                } else if (data.text) {
                  accumulated += data.text;
                  setColumnStream(modelId, {
                    text: accumulated,
                    isStreaming: true,
                    latencyMs: Date.now() - startTime,
                  });
                } else if (data.done) {
                  setColumnStream(modelId, {
                    text: accumulated,
                    isStreaming: false,
                    latencyMs: data.latencyMs || Date.now() - startTime,
                    tokens: data.tokens,
                  });
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          setColumnStream(modelId, { isStreaming: false });
        } else {
          const errMsg = err instanceof Error ? err.message : "Request failed";
          setColumnStream(modelId, {
            error: errMsg,
            isStreaming: false,
          });
        }
      }
    });

    await Promise.allSettled(promises);
    setIsRunning(false);
  };

  const handleStopAll = () => {
    Object.values(abortControllersRef.current).forEach((ctrl) => ctrl.abort());
    abortControllersRef.current = {};
    setIsRunning(false);
  };

  const handleAdoptResponse = (modelId: string, text: string) => {
    // Add user prompt and adopted assistant response to main conversation
    addMessage({ role: "user", content: prompt, createdAt: new Date() });
    addMessage({
      role: "assistant",
      content: text,
      model: modelId,
      createdAt: new Date(),
    });
    // Set active model to this adopted model and switch back to chat mode
    setActiveModel(modelId);
    setMode("chat");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090b11] overflow-hidden">
      {/* Header Controls */}
      <div className="h-14 border-b border-gray-800 px-6 flex items-center justify-between bg-[#0e111a]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-indigo-400" />
            <h1 className="text-sm font-bold text-gray-100">Multi-Model Split Comparison</h1>
          </div>
          <span className="text-xs text-gray-500 font-mono">({splitModels.length} models active)</span>
        </div>

        {/* Model selection tags */}
        <div className="flex items-center gap-2">
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
                  className="bg-[#141722] border border-gray-800 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div
        className={`flex-1 grid gap-3 p-4 overflow-y-auto ${
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
              className="flex flex-col h-full rounded-2xl bg-[#0f121d] border border-gray-800/80 overflow-hidden shadow-lg"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-800/80 bg-[#141824] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200">{modelDef?.name || modelId}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        modelDef?.provider === "groq"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : modelDef?.provider === "openai"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : modelDef?.provider === "anthropic"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : modelDef?.provider === "gemini"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-gray-800 text-gray-400"
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
                      className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics bar */}
              <div className="px-3 py-1.5 bg-[#0b0e16] border-b border-gray-800/40 flex items-center justify-between text-[11px] font-mono text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{state.latencyMs ? `${state.latencyMs} ms` : "--"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>
                    {state.tokens?.completion ? `${state.tokens.completion} tokens` : "--"}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-4 overflow-y-auto text-sm prose-custom">
                {state.error ? (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <div className="flex items-center gap-2 font-semibold mb-1.5 text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{modelDef?.provider ? `${modelDef.provider.toUpperCase()} Provider Error` : "Model Error"}</span>
                    </div>
                    <p className="font-mono text-[11px] bg-red-950/40 p-2 rounded border border-red-900/30 break-words">
                      {state.error}
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400">
                      Ensure your {modelDef?.provider?.toUpperCase() || "provider"} API key is configured in the Vault or use a Simulator model.
                    </p>
                  </div>
                ) : state.text ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
                    {state.isStreaming && <span className="cursor-blink" />}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 text-xs py-8">
                    <p>Waiting for prompt submission...</p>
                  </div>
                )}
              </div>

              {/* Column Footer: Adopt response button */}
              {state.text && !state.isStreaming && !state.error && (
                <div className="p-2.5 border-t border-gray-800 bg-[#121622]">
                  <button
                    onClick={() => handleAdoptResponse(modelId, state.text)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-500 text-xs font-semibold text-indigo-300 hover:text-white transition-all shadow-sm"
                  >
                    <span>Adopt This Response</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared Comparison Input Bar */}
      <div className="p-4 bg-[#0d1018] border-t border-gray-800">
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
            placeholder="Send one prompt to all models simultaneously to compare side-by-side..."
            className="flex-1 bg-[#141722] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          {isRunning ? (
            <button
              onClick={handleStopAll}
              className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleStartComparison}
              disabled={!prompt.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-all shadow-lg"
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
