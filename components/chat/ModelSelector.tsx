"use client";

import React, { useState, useRef, useEffect } from "react";
import { AVAILABLE_MODELS } from "@/lib/context/types";
import { ChevronDown, Cpu, Sparkles, Zap, Check } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onSelectModel, className = "" }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "auto":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "openai":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "anthropic":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "gemini":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "groq":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "mock":
        return "text-zinc-400 bg-zinc-800 border-zinc-700/60";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const getModelIcon = (provider: string) => {
    switch (provider) {
      case "auto":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "groq":
        return <Zap className="w-4 h-4 text-orange-400" />;
      case "anthropic":
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case "gemini":
        return <Cpu className="w-4 h-4 text-blue-400" />;
      default:
        return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-zinc-800 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-100 shadow-sm cursor-pointer group"
      >
        <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono-telemetry uppercase tracking-wider font-semibold ${getProviderBadge(current.provider)}`}>
          {current.provider === "auto" ? "SMART" : current.provider}
        </span>
        <span className="font-semibold text-xs tracking-tight text-zinc-100">{current.name}</span>
        {current.badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono-telemetry">
            {current.badge}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl bg-[#121215] border border-zinc-800 shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl">
          <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <p className="text-[10px] font-mono-telemetry font-bold text-zinc-400 uppercase tracking-wider">
              Select Frontier Model
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Switching preserves full conversation context
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === current.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800/80 text-zinc-100 border-l-2 border-emerald-500"
                      : "hover:bg-zinc-800/40 text-zinc-300 border-l-2 border-transparent"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getModelIcon(model.provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold ${isSelected ? "text-emerald-400" : "text-zinc-100"}`}>
                        {model.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono-telemetry">
                        {model.provider === "auto" ? "AUTO" : `${(model.contextWindow / 1000).toFixed(0)}k ctx`}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{model.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-1 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
