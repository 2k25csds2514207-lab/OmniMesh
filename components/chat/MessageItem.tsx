"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NeutralMessage } from "@/lib/context/types";
import { AVAILABLE_MODELS } from "@/lib/context/types";
import { Copy, Check, User, Bot, RotateCcw, Sparkles, Cpu, Zap, AlertTriangle } from "lucide-react";

interface MessageItemProps {
  message: NeutralMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

// Provider Logos
function OpenAILogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3428 7.897a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3428 7.897zm16.5963 3.8558L13.1038 8.384 15.1239 7.216a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4096-.6815zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813l-.0048 6.7227zm1.1448-1.916l2.5484-1.4704 2.5484 1.4704v2.9408l-2.5484 1.4704-2.5484-1.4704z" />
    </svg>
  );
}

function AnthropicLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.827 3.518h3.818L24 20.482h-3.818l-1.841-4.364H9.659l-1.841 4.364H4L13.827 3.518zm2.659 9.636l-2.318-5.5-2.318 5.5h4.636zM1.818 20.482L5.636 11.4l1.909 4.545-2.182 4.537H1.818z" />
    </svg>
  );
}

function GeminiLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
    </svg>
  );
}

export function MessageItem({ message, isStreaming = false, onRegenerate }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  // Resolve model definition
  const modelDef = AVAILABLE_MODELS.find(
    (m) => m.id === message.model || m.name.toLowerCase() === message.model?.toLowerCase()
  );

  // Determine provider
  const rawProvider = (message.provider || modelDef?.provider || "").toLowerCase();
  const modelName = (message.model || "").toLowerCase();

  let provider = "mock";
  if (rawProvider.includes("groq")) {
    provider = "groq";
  } else if (rawProvider.includes("openai")) {
    provider = "openai";
  } else if (rawProvider.includes("anthropic")) {
    provider = "anthropic";
  } else if (rawProvider.includes("gemini")) {
    provider = "gemini";
  } else if (rawProvider.includes("mock")) {
    provider = "mock";
  } else if (modelName.includes("gpt-oss") || modelName.includes("llama") || modelName.includes("mixtral")) {
    provider = "groq";
  } else if (modelName.includes("gpt")) {
    provider = "openai";
  } else if (modelName.includes("claude")) {
    provider = "anthropic";
  } else if (modelName.includes("gemini")) {
    provider = "gemini";
  } else if (modelName.includes("mock")) {
    provider = "mock";
  }

  const modelDisplayName = modelDef?.name || message.model || "AI Assistant";

  const getVisualStyles = () => {
    switch (provider) {
      case "auto":
        return {
          leftBorder: "border-l-2 border-l-emerald-500",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          logo: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          providerLabel: "SMART ROUTER",
        };
      case "openai":
        return {
          leftBorder: "border-l-2 border-l-emerald-500",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          logo: <OpenAILogo className="w-3.5 h-3.5" />,
          providerLabel: "OPENAI",
        };
      case "anthropic":
        return {
          leftBorder: "border-l-2 border-l-amber-500",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          logo: <AnthropicLogo className="w-3.5 h-3.5" />,
          providerLabel: "ANTHROPIC",
        };
      case "gemini":
        return {
          leftBorder: "border-l-2 border-l-blue-500",
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          logo: <GeminiLogo className="w-3.5 h-3.5" />,
          providerLabel: "GEMINI",
        };
      case "groq":
        return {
          leftBorder: "border-l-2 border-l-orange-500",
          badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          iconBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          logo: <Zap className="w-3.5 h-3.5 text-orange-400" />,
          providerLabel: "GROQ",
        };
      case "mock":
        return {
          leftBorder: "border-l-2 border-l-zinc-600",
          badgeBg: "bg-zinc-800 text-zinc-400 border-zinc-700/60",
          iconBg: "bg-zinc-800 text-zinc-400 border-zinc-700/60",
          logo: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          providerLabel: "SIMULATOR",
        };
      default:
        return {
          leftBorder: "border-l-2 border-l-zinc-600",
          badgeBg: "bg-zinc-800 text-zinc-400 border-zinc-700",
          iconBg: "bg-zinc-800 text-zinc-400 border-zinc-700",
          logo: <Bot className="w-3.5 h-3.5" />,
          providerLabel: (message.provider || "AI").toUpperCase(),
        };
    }
  };

  const visuals = getVisualStyles();
  const isSimulated =
    !isUser &&
    (message.isSimulated ||
      provider === "mock" ||
      modelName.includes("mock") ||
      message.content.includes("Demo / Simulated Sandbox Response"));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={`group w-full py-4 px-4 md:px-5 rounded-xl transition-all shadow-sm ${
        isUser
          ? "bg-[#18181b] border border-zinc-800 ml-auto max-w-3xl"
          : `bg-[#121215] ${visuals.leftBorder} border border-zinc-800 w-full`
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          {isUser ? (
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-zinc-800 border border-zinc-700/80 text-zinc-300">
              <User className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center border shadow-xs ${visuals.iconBg}`}
              title={`${visuals.providerLabel} model`}
            >
              {visuals.logo}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-100">
                {isUser ? "You" : modelDisplayName}
              </span>

              {!isUser && (
                <>
                  <span
                    className={`text-[9px] uppercase font-mono-telemetry px-1.5 py-0.2 rounded font-semibold border ${visuals.badgeBg}`}
                  >
                    {visuals.providerLabel}
                  </span>

                  {isSimulated && (
                    <span className="text-[9px] uppercase font-mono-telemetry px-1.5 py-0.2 rounded font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      SIMULATED
                    </span>
                  )}

                  {modelDef?.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono-telemetry">
                      {modelDef.badge}
                    </span>
                  )}

                  {message.routingReason && (
                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-telemetry">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Smart: {message.routedCategory || "Auto"}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Metrics */}
        <div className="flex items-center gap-2 opacity-75 group-hover:opacity-100 transition-opacity">
          {message.tokens ? (
            <span className="text-[10px] font-mono-telemetry text-zinc-500 flex items-center gap-1">
              {message.tokens} tokens
            </span>
          ) : null}

          {!isStreaming && (
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {!isUser && !isStreaming && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Smart Route Reasoning Notice */}
      {!isUser && message.routingReason && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold font-mono-telemetry text-[11px]">SMART ROUTER: </span>
            <span className="text-zinc-300 text-[11px]">{message.routingReason}</span>
          </div>
        </div>
      )}

      {/* Demo / Simulated Response Banner */}
      {isSimulated && (
        <div className="mb-3.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 flex items-start sm:items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">Demo / Simulated Response:</strong> Sandbox evaluation preview for {modelDisplayName}. Live API key required for real-time model completions.
            </span>
          </div>
          <span className="shrink-0 text-[9px] font-mono-telemetry uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Sandbox
          </span>
        </div>
      )}

      {/* Content */}
      <div className="prose-custom text-sm overflow-x-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline ? (
                <div className="relative my-2.5 rounded-lg overflow-hidden border border-zinc-800 bg-[#0f0f12]">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#18181b] text-[11px] font-mono-telemetry text-zinc-400 border-b border-zinc-800">
                    <span>{match ? match[1] : "code"}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
                      className="hover:text-zinc-100 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-xs text-zinc-200">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 border border-zinc-700/60 font-mono-telemetry text-xs" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {isStreaming && <span className="cursor-blink" />}
      </div>
    </div>
  );
}
