"use client";

import React, { useState, useRef, useEffect } from "react";
import { useOmniStore } from "@/lib/store/useOmniStore";
import { MessageItem } from "./MessageItem";
import { ModelSelector } from "./ModelSelector";
import { Send, Square, Download, Sparkles, AlertCircle, ArrowRight, Radio } from "lucide-react";
import { NeutralMessage, AVAILABLE_MODELS } from "@/lib/context/types";

export function ChatArea() {
  const {
    activeModel,
    setActiveModel,
    messages,
    setMessages,
    addMessage,
    updateMessageContent,
    updateMessage,
    isStreaming,
    setIsStreaming,
    activeConversationId,
    setActiveConversationId,
    setConversations,
    conversations,
  } = useOmniStore();

  const [input, setInput] = useState("");
  const [streamingNotice, setStreamingNotice] = useState<string | null>(null);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleSend = async (forcedPrompt?: string) => {
    const promptToSend = (forcedPrompt || input).trim();
    if (!promptToSend || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStreamingNotice(null);
    setStreamingError(null);

    const userMessage: NeutralMessage = {
      role: "user",
      content: promptToSend,
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Placeholder for streaming assistant response
    const assistantIndex = newMessages.length;
    const assistantMessage: NeutralMessage = {
      role: "assistant",
      content: "",
      model: activeModel,
      createdAt: new Date(),
    };
    addMessage(assistantMessage);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          model: activeModel,
          prompt: promptToSend,
          history: messages,
          saveToDb: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}: Failed to stream response`);
      }

      const returnedConvId = res.headers.get("X-Conversation-Id");
      if (returnedConvId && !activeConversationId) {
        setActiveConversationId(returnedConvId);
        // Refresh conversations list
        fetch("/api/conversations")
          .then((r) => r.json())
          .then((d) => d.conversations && setConversations(d.conversations))
          .catch(() => {});
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

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
                setStreamingError(data.error);
                accumulated += `\n\n> ⚠️ **Error:** ${data.error}`;
                updateMessageContent(assistantIndex, accumulated);
              } else if (data.routing) {
                updateMessage(assistantIndex, {
                  model: data.routing.model,
                  provider: data.routing.provider,
                  routingReason: data.routing.reason,
                  routedCategory: data.routing.categoryLabel,
                });
              } else if (data.notice) {
                setStreamingNotice(data.notice);
              } else if (data.text) {
                accumulated += data.text;
                updateMessageContent(assistantIndex, accumulated);
              } else if (data.done) {
                updateMessage(assistantIndex, {
                  model: data.model || undefined,
                  provider: data.provider || undefined,
                  tokens: data.tokens ? data.tokens.completion : undefined,
                  routingReason: data.routingReason || undefined,
                  routedCategory: data.routedCategory || undefined,
                  isSimulated: data.isSimulated || undefined,
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
        console.log("Stream stopped by user");
      } else {
        const message = err instanceof Error ? err.message : "Failed to generate response";
        setStreamingError(message);
        updateMessageContent(
          assistantIndex,
          `\n\n> ⚠️ **Error:** ${message}\n>\n> *Tip: Make sure you have added your API key in the Vault or select a Simulator model.*`
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleExport = (format: "markdown" | "json") => {
    let content = "";
    const filename = `conversation-${activeConversationId || "export"}.${format === "markdown" ? "md" : "json"}`;

    if (format === "markdown") {
      content = `# OmniMesh Conversation Export\n\nModel: ${activeModel}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
      messages.forEach((m) => {
        content += `### ${m.role === "user" ? "You" : m.model || "Assistant"}\n\n${m.content}\n\n---\n\n`;
      });
    } else {
      content = JSON.stringify({ activeModel, exportedAt: new Date().toISOString(), messages }, null, 2);
    }

    const blob = new Blob([content], { type: format === "markdown" ? "text/markdown" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Model-switch accent mapping
  const getAccentColor = (provider?: string | null, model?: string | null) => {
    const p = provider?.toLowerCase() || "";
    const m = model?.toLowerCase() || "";
    if (p.includes("groq") || m.includes("llama") || m.includes("mixtral") || m.includes("oss")) {
      return "text-[#ff6a1f]";
    }
    if (p.includes("openai") || m.includes("gpt")) return "text-[#10ec90]";
    if (p.includes("anthropic") || m.includes("claude")) return "text-[#f5b544]";
    if (p.includes("gemini")) return "text-[#6ef2b8]";
    if (p.includes("auto") || m.includes("smart")) return "text-[#10ec90]";
    return "text-[#a6a09b]";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-[#fafafa] relative overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-[#09090b]/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <ModelSelector selectedModel={activeModel} onSelectModel={setActiveModel} />
          {streamingNotice && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-mono-telemetry">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{streamingNotice}</span>
            </div>
          )}
        </div>

        {/* Right Status & Export */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono-telemetry text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>CONTEXT ACTIVE</span>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport("markdown")}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export as Markdown"
              >
                <Download className="w-3 h-3 text-zinc-400" />
                <span className="hidden sm:inline">Export MD</span>
              </button>
              <button
                onClick={() => handleExport("json")}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export as JSON"
              >
                <Download className="w-3 h-3 text-zinc-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
            {/* Center Brand Icon */}
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-sm mb-4">
              <Sparkles className="w-7 h-7 text-zinc-200" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Multi-Model AI Workspace</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
              How can OmniMesh help you today?
            </h2>
            <p className="text-xs text-zinc-400 mb-8 max-w-md leading-relaxed">
              Preserve conversation context seamlessly across GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Groq LPU models.
            </p>

            {/* Quick Action Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {[
                { title: "TypeScript Rate Limiter", desc: "Build Redis sliding window limiter", prompt: "Write a production-ready TypeScript sliding-window rate limiter using Redis." },
                { title: "Quantum Computing Logic", desc: "Deep dive into qubit superposition", prompt: "Explain quantum superposition and entanglement in simple yet technical terms." },
                { title: "Multi-Model Architecture", desc: "Compare GPT-4o vs Claude 3.5 reasoning", prompt: "Compare OpenAI GPT-4o and Anthropic Claude 3.5 Sonnet architectural trade-offs." },
                { title: "SQL Optimization", desc: "Analyze slow query execution plan", prompt: "How do I diagnose and optimize a slow PostgreSQL index scan with high join volume?" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(item.prompt)}
                  className="p-3.5 rounded-xl bg-[#121215] hover:bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                      {item.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isAssistant = msg.role === "assistant";
            const prevAssistantMsg = isAssistant
              ? [...messages.slice(0, index)].reverse().find((m) => m.role === "assistant" && m.model)
              : null;
            const modelChanged =
              isAssistant &&
              prevAssistantMsg &&
              prevAssistantMsg.model &&
              msg.model &&
              prevAssistantMsg.model !== msg.model;

            const prevDef = prevAssistantMsg?.model
              ? AVAILABLE_MODELS.find((m) => m.id === prevAssistantMsg.model)
              : null;
            const currentDef = msg.model
              ? AVAILABLE_MODELS.find((m) => m.id === msg.model)
              : null;

            const prevName = prevDef?.name || prevAssistantMsg?.model || "Previous Model";
            const currentName = currentDef?.name || msg.model || "Active Model";

            return (
              <React.Fragment key={index}>
                {/* Clean Model Switch Divider */}
                {modelChanged && (
                  <div className="my-4 flex items-center justify-center">
                    <div className="px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs font-mono-telemetry text-zinc-400 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Switched:</span>
                      <span className="font-semibold text-zinc-200">{prevName}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                      <span className="font-semibold text-zinc-100">{currentName}</span>
                      <span className="text-[10px] text-zinc-500 border-l border-zinc-800 pl-2">
                        Context Preserved
                      </span>
                    </div>
                  </div>
                )}
                <MessageItem
                  message={msg}
                  isStreaming={isStreaming && index === messages.length - 1 && msg.role === "assistant"}
                  onRegenerate={
                    index === messages.length - 1 && msg.role === "assistant"
                      ? () => {
                          const lastUser = [...messages].reverse().find((m) => m.role === "user");
                          if (lastUser) handleSend(lastUser.content);
                        }
                      : undefined
                  }
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Console Bar */}
      <div className="p-4 md:p-5 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl bg-[#121215] border border-zinc-800 focus-within:border-zinc-600 transition-colors shadow-xl">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${activeModel}... (Enter to send, Shift+Enter for newline)`}
              className="w-full bg-transparent px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-48 font-sans"
            />

            <div className="flex items-center justify-between px-3.5 py-2 border-t border-zinc-800/80 bg-zinc-900/40 rounded-b-xl">
              <div className="flex items-center gap-2 text-xs font-mono-telemetry text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active: {activeModel}</span>
              </div>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="omni-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 text-center mt-2">
            OmniMesh preserves full conversation context across models • Keys encrypted at rest with AES-256-GCM
          </p>
        </div>
      </div>
    </div>
  );
}
