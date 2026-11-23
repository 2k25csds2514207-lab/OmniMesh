"use client";

import React, { useState, useRef, useEffect } from "react";
import { useOmniStore } from "@/lib/store/useOmniStore";
import { MessageItem } from "./MessageItem";
import { ModelSelector } from "./ModelSelector";
import { Send, Square, Download, Share2, Plus, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
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

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || input).trim();
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
          .catch(() => { });
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
    let filename = `conversation-${activeConversationId || "export"}.${format === "markdown" ? "md" : "json"}`;

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c13] relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-gray-800/80 px-6 flex items-center justify-between bg-[#0e111a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <ModelSelector selectedModel={activeModel} onSelectModel={setActiveModel} />
          {streamingNotice && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{streamingNotice}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExport("markdown")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-gray-800 transition-colors flex items-center gap-1.5"
                title="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export MD</span>
              </button>
              <button
                onClick={() => handleExport("json")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-gray-800 transition-colors flex items-center gap-1.5"
                title="Export as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Welcome to OmniMesh</h2>
            <p className="text-sm text-gray-400 mb-6">
              Switch between GPT-4o, Claude 3.5 Sonnet, and Gemini anytime without losing your conversation history.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {[
                "Explain quantum computing in simple terms",
                "Write a TypeScript rate limiter using Redis",
                "Compare REST vs GraphQL architectures",
                "Debug this SQL join query performance issue",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="p-3 rounded-xl bg-[#121622] hover:bg-[#181d2e] border border-gray-800/80 hover:border-gray-700 text-xs text-gray-300 transition-all text-left"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Check if model changed compared to previous assistant message
            const isAssistant = msg.role === "assistant";
            const prevAssistantMsg = isAssistant
              ? [...messages.slice(0, index)].reverse().find((m) => m.role === "assistant" && m.model)
              : null;

            const showModelSwitchDivider =
              isAssistant &&
              prevAssistantMsg &&
              prevAssistantMsg.model &&
              msg.model &&
              prevAssistantMsg.model !== msg.model;

            const prevModelDef = showModelSwitchDivider
              ? AVAILABLE_MODELS.find(
                (m) =>
                  m.id === prevAssistantMsg?.model ||
                  m.name.toLowerCase() === prevAssistantMsg?.model?.toLowerCase()
              )
              : null;
            const currentModelDef = showModelSwitchDivider
              ? AVAILABLE_MODELS.find(
                (m) => m.id === msg.model || m.name.toLowerCase() === msg.model?.toLowerCase()
              )
              : null;

            const prevName = prevModelDef?.name || prevAssistantMsg?.model || "Previous Model";
            const currentName = currentModelDef?.name || msg.model || "New Model";

            const getAccentColor = (provider?: string | null, model?: string | null) => {
              const p = (provider || "").toLowerCase();
              const m = (model || "").toLowerCase();

              // Provider is the reliable signal
              if (p.includes("groq")) return "text-orange-400";
              if (p.includes("openai")) return "text-emerald-400";
              if (p.includes("anthropic")) return "text-amber-400";
              if (p.includes("gemini")) return "text-blue-400";
              if (p.includes("mock")) return "text-purple-400";

              // Fallback: guess from model name (gpt-oss is a Groq-hosted model, so check it first)
              if (m.includes("gpt-oss") || m.includes("llama") || m.includes("mixtral")) return "text-orange-400";
              if (m.includes("gpt")) return "text-emerald-400";
              if (m.includes("claude")) return "text-amber-400";
              if (m.includes("gemini")) return "text-blue-400";
              return "text-indigo-400";
            };

            return (
              <React.Fragment key={index}>
                {showModelSwitchDivider && (
                  <div className="flex items-center gap-3 my-5 select-none animate-fade-in">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111420] border border-gray-800 text-xs text-gray-400 shadow-md">
                      <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">
                        Model Switched:
                      </span>
                      <span
                        className={`font-semibold ${getAccentColor(
                          prevAssistantMsg?.provider ?? undefined,
                          prevAssistantMsg?.model ?? undefined
                        )}`}
                      >
                        {prevName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                      <span className={`font-semibold ${getAccentColor(msg.provider, msg.model)}`}>
                        {currentName}
                      </span>
                      <span className="text-[10px] text-gray-500 border-l border-gray-700/60 pl-2 ml-0.5">
                        Context Preserved
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
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

      {/* Input Box Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#0a0c13] via-[#0a0c13] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-[#121520] border border-gray-800 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-xl">
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
              className="w-full bg-transparent px-4 py-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none max-h-48"
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800/60 bg-[#0e111a]/50 rounded-b-2xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span>Model: {activeModel}</span>
              </div>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-xs font-semibold text-white transition-all shadow-md"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-2">
            OmniMesh preserves full conversation context across models. Keys are encrypted at rest with AES-256-GCM.
          </p>
        </div>
      </div>
    </div>
  );
}
