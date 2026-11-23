"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NeutralMessage } from "@/lib/context/types";
import { AVAILABLE_MODELS } from "@/lib/context/types";
import { Copy, Check, User, Bot, RotateCcw, Sparkles, Cpu, Zap } from "lucide-react";

interface MessageItemProps {
  message: NeutralMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

// Provider Logos
function OpenAILogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3428 7.897a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3428 7.897zm16.5963 3.8558L13.1038 8.384 15.1239 7.216a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4096-.6815zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813l-.0048 6.7227zm1.1448-1.916l2.5484-1.4704 2.5484 1.4704v2.9408l-2.5484 1.4704-2.5484-1.4704z" />
    </svg>
  );
}

function AnthropicLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.827 3.518h3.818L24 20.482h-3.818l-1.841-4.364H9.659l-1.841 4.364H4L13.827 3.518zm2.659 9.636l-2.318-5.5-2.318 5.5h4.636zM1.818 20.482L5.636 11.4l1.909 4.545-2.182 4.537H1.818z" />
    </svg>
  );
}

function GeminiLogo({ className = "w-4 h-4" }: { className?: string }) {
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
    // Fallback guess when provider is missing (gpt-oss is Groq-hosted here)
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

  // Model display name
  const modelDisplayName = modelDef?.name || message.model || "AI Assistant";

  // Model & Provider Visual Styles
  const getVisualStyles = () => {
    switch (provider) {
      case "auto":
        return {
          leftBorder: "border-l-[4px] border-l-cyan-500",
          cardBg: "bg-[#091319]/90 hover:bg-[#0c1820]/95 border-cyan-500/15",
          badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          logo: <Sparkles className="w-3.5 h-3.5" />,
          providerLabel: "SMART ROUTER",
        };
      case "openai":
        return {
          leftBorder: "border-l-[4px] border-l-emerald-500",
          cardBg: "bg-[#0b1114]/90 hover:bg-[#0d1419]/95 border-emerald-500/15",
          badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          logo: <OpenAILogo className="w-3.5 h-3.5" />,
          providerLabel: "OPENAI",
        };
      case "anthropic":
        return {
          leftBorder: "border-l-[4px] border-l-amber-500",
          cardBg: "bg-[#14100c]/90 hover:bg-[#19140f]/95 border-amber-500/15",
          badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          logo: <AnthropicLogo className="w-3.5 h-3.5" />,
          providerLabel: "ANTHROPIC",
        };
      case "gemini":
        return {
          leftBorder: "border-l-[4px] border-l-blue-500",
          cardBg: "bg-[#0c1017]/90 hover:bg-[#0e131d]/95 border-blue-500/15",
          badgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          iconBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          logo: <GeminiLogo className="w-3.5 h-3.5" />,
          providerLabel: "GEMINI",
        };
      case "groq":
        return {
          leftBorder: "border-l-[4px] border-l-orange-500",
          cardBg: "bg-[#140e0a]/90 hover:bg-[#18110c]/95 border-orange-500/15",
          badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          iconBg: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          logo: <Zap className="w-3.5 h-3.5" />,
          providerLabel: "GROQ",
        };
      case "mock":
        return {
          leftBorder: "border-l-[4px] border-l-purple-500",
          cardBg: "bg-[#120d18]/90 hover:bg-[#16101f]/95 border-purple-500/15",
          badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          iconBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          logo: <Sparkles className="w-3.5 h-3.5" />,
          providerLabel: "SIMULATOR",
        };
      default:
        return {
          leftBorder: "border-l-[4px] border-l-indigo-500",
          cardBg: "bg-[#0e1017]/90 hover:bg-[#11131c]/95 border-indigo-500/15",
          badgeBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
          iconBg: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
          logo: <Bot className="w-3.5 h-3.5" />,
          providerLabel: (message.provider || "AI").toUpperCase(),
        };
    }
  };

  const visuals = getVisualStyles();

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
      className={`group w-full py-4 px-4 md:px-6 rounded-2xl transition-all shadow-md ${isUser
          ? "bg-[#161a26]/75 border border-gray-800/80 ml-auto max-w-3xl"
          : `${visuals.cardBg} ${visuals.leftBorder} border border-gray-800/50 w-full`
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-gray-800/40">
        <div className="flex items-center gap-2.5">
          {isUser ? (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm ${visuals.iconBg}`}
              title={`${visuals.providerLabel} model`}
            >
              {visuals.logo}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-100">
                {isUser ? "You" : modelDisplayName}
              </span>

              {!isUser && (
                <>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-semibold border ${visuals.badgeBg}`}
                  >
                    {visuals.providerLabel}
                  </span>

                  {modelDef?.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/60 font-mono">
                      {modelDef.badge}
                    </span>
                  )}

                  {message.routingReason && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Smart: {message.routedCategory || "Auto"}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Metrics */}
        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          {message.tokens ? (
            <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
              {message.tokens} tokens
            </span>
          ) : null}

          {!isStreaming && (
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {!isUser && !isStreaming && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Smart Route Reasoning Notice */}
      {!isUser && message.routingReason && (
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-cyan-200">Smart Router: </span>
            <span className="text-gray-300 text-[11px]">{message.routingReason}</span>
          </div>
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
                <div className="relative my-2 rounded-lg overflow-hidden border border-gray-800 bg-[#090b10]">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#141722] text-[11px] font-mono text-gray-400 border-b border-gray-800">
                    <span>{match ? match[1] : "code"}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
                      className="hover:text-gray-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-xs text-gray-200">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code className="bg-gray-800/80 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props}>
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
