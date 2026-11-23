"use client";

import React, { useState, useRef, useEffect } from "react";
import { AVAILABLE_MODELS } from "@/lib/context/types";
import { ChevronDown, Cpu, Sparkles, Zap, ShieldCheck } from "lucide-react";

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

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "auto":
        return "text-cyan-300 bg-cyan-500/15 border-cyan-500/30";
      case "openai":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "anthropic":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "gemini":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "groq":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "mock":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#141721] hover:bg-[#1a1f2e] border border-gray-800 transition-all text-sm font-medium text-gray-200 shadow-sm"
      >
        <span className={`px-1.5 py-0.5 rounded text-xs border font-mono uppercase tracking-wider ${getProviderColor(current.provider)}`}>
          {current.provider}
        </span>
        <span className="font-semibold">{current.name}</span>
        {current.badge && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {current.badge}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl bg-[#11141f] border border-gray-800 shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-md">
          <div className="px-3 py-2 border-b border-gray-800/80">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select AI Model</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Switching preserves your full conversation context</p>
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
                  className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                    isSelected ? "bg-indigo-600/15 border-l-2 border-indigo-500" : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="mt-0.5">
                    {model.provider === "auto" ? (
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    ) : model.provider === "mock" ? (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    ) : model.provider === "groq" ? (
                      <Zap className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Cpu className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-medium ${isSelected ? "text-indigo-300" : model.provider === "auto" ? "text-cyan-200" : "text-gray-200"}`}>
                        {model.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {model.provider === "auto" ? "AI Directed" : `${(model.contextWindow / 1000).toFixed(0)}k ctx`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{model.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
