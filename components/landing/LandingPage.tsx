"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Columns,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Lock,
  EyeOff,
  ChevronRight,
  Sliders,
  Terminal,
} from "lucide-react";

interface LandingPageProps {
  onEnterWorkspace: () => void;
  onOpenVault: () => void;
  onOpenSplit: () => void;
  isAuthenticated?: boolean | null;
}

export function LandingPage({
  onEnterWorkspace,
  onOpenVault,
  onOpenSplit,
  isAuthenticated,
}: LandingPageProps) {
  const [activeDemoTab, setActiveDemoTab] = useState<"code" | "speed" | "doc" | "reason">("code");

  const demoScenarios = {
    code: {
      category: "Code Generation & Debugging",
      prompt: "Write a high-throughput distributed rate limiter in TypeScript using Redis token bucket",
      routedModel: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      reason: "Classified as complex software architecture & code generation. Optimal coding benchmark score.",
      latency: "240ms",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    speed: {
      category: "Ultra-Low Latency Q&A",
      prompt: "Summarize the ACID properties of PostgreSQL transactions in 3 concise bullet points",
      routedModel: "Llama 3.3 70B (LPU)",
      provider: "Groq",
      reason: "Classified as quick factual inquiry with short context. Groq LPU delivers ~400 tokens/sec.",
      latency: "45ms",
      badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    doc: {
      category: "Long-Context Document Analysis",
      prompt: "Cross-reference the 80-page quarterly financial filings with our internal product roadmap",
      routedModel: "Gemini 1.5 Pro",
      provider: "Google",
      reason: "Classified as massive document ingestion. Gemini native 2,000,000 token context buffer.",
      latency: "380ms",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    reason: {
      category: "Multi-Step Strategic Reasoning",
      prompt: "Formulate a multi-regional cloud migration plan balancing CAPEX, OPEX, and compliance",
      routedModel: "GPT-4o",
      provider: "OpenAI",
      reason: "Classified as high-level multi-step reasoning. Balanced benchmark performance across domains.",
      latency: "290ms",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  };

  const currentScenario = demoScenarios[activeDemoTab];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] selection:bg-zinc-800 selection:text-zinc-100 flex flex-col font-sans">
      {/* 1. Clean Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
              <Layers className="w-5 h-5 text-zinc-100" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-100">OmniMesh</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-telemetry bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                v1.0
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
            <a href="#features" className="hover:text-zinc-100 transition-colors">
              Platform
            </a>
            <a href="#router" className="hover:text-zinc-100 transition-colors">
              Smart Router
            </a>
            <a href="#models" className="hover:text-zinc-100 transition-colors">
              Models
            </a>
            <a href="#security" className="hover:text-zinc-100 transition-colors">
              Security
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onEnterWorkspace}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Signed In</span>
              </button>
            ) : (
              <a
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </a>
            )}
            <button
              onClick={onEnterWorkspace}
              className="omni-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-zinc-800/30 to-zinc-700/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous Multi-Model AI Orchestration</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-100 leading-[1.08]">
            One platform. <br />
            <span className="text-zinc-400">Every frontier model.</span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
            Orchestrate OpenAI, Anthropic, Gemini, and Groq from a unified developer console.
            Intelligently route prompts by intent, benchmark responses in real-time split view,
            and preserve complete context with zero-knowledge encrypted key storage.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="w-full sm:w-auto omni-btn-primary px-7 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Open Developer Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSplit}
              className="w-full sm:w-auto omni-btn-secondary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Columns className="w-4 h-4 text-zinc-400" />
              <span>Side-by-Side Split View</span>
            </button>
          </div>

          {/* Metrics summary */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-zinc-800/80">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-100">4 Top Providers</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">OpenAI, Anthropic, Google, Groq</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-100">&lt; 50ms</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Autonomous Routing Overhead</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-100">AES-256-GCM</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Zero-Knowledge Vault</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-100">100%</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Context Preserved Across Switches</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Smart Router Live Demo */}
      <section id="router" className="py-16 px-4 sm:px-6 bg-[#0f0f12] border-y border-[#27272a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autonomous Dispatch Layer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              The Smart Router in Action
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Every prompt is parsed for semantic intent, complexity, and active API keys in your vault,
              instantly dispatching to the optimal provider.
            </p>
          </div>

          {/* Interactive Demo Surface */}
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Scenario Selector Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              {(
                [
                  { id: "code", label: "Coding & Architecture", icon: <Terminal className="w-3.5 h-3.5" /> },
                  { id: "speed", label: "Speed / Fact Check", icon: <Zap className="w-3.5 h-3.5" /> },
                  { id: "doc", label: "Massive Context", icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: "reason", label: "Strategic Reasoning", icon: <Cpu className="w-3.5 h-3.5" /> },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeDemoTab === tab.id
                      ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Simulated Prompt & Routing Result Deck */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left: User Prompt Ingestion */}
              <div className="md:col-span-6 bg-[#18181b] border border-zinc-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                  <span>INPUT PAYLOAD</span>
                  <span className="text-zinc-400">{currentScenario.category}</span>
                </div>
                <p className="text-sm text-zinc-200 font-mono-telemetry bg-[#121215] p-3 rounded-lg border border-zinc-800 leading-relaxed">
                  &quot;{currentScenario.prompt}&quot;
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Intent classification: 98% confidence score</span>
                </div>
              </div>

              {/* Center Transition */}
              <div className="hidden md:flex md:col-span-1 justify-center text-zinc-600">
                <ArrowRight className="w-5 h-5 text-zinc-400 animate-pulse" />
              </div>

              {/* Right: Smart Dispatch Output */}
              <div className="md:col-span-5 bg-[#18181b] border border-zinc-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-telemetry">
                  <span className="text-zinc-500">DISPATCH RESOLUTION</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AUTONOMOUS</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#121215] border border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase font-mono-telemetry">{currentScenario.provider}</p>
                    <p className="text-base font-bold text-zinc-100">{currentScenario.routedModel}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono-telemetry font-medium border ${currentScenario.badgeColor}`}>
                    {currentScenario.latency}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {currentScenario.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Enterprise Feature Bento Grid */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
              Built for High-Velocity AI Engineering
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-3">
              Everything required to evaluate, switch, and operate multi-model workflows without vendor lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Autonomous Smart Router</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Classifies prompts into specialized tiers: coding, speed, long documents, or deep reasoning.
                  Automatically checks your active vault keys and falls back gracefully.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>INTENT ENGINE</span>
                <span className="text-emerald-400 font-semibold">ACTIVE</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <Columns className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Side-by-Side Split View</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Run 2 to 4 models in parallel with real-time response streaming. Directly compare
                  output quality, execution latency, and token consumption to choose the winner.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>BENCHMARK MODE</span>
                <span className="text-indigo-400 font-semibold">UP TO 4 COLUMNS</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Client-Side Key Vault</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your provider keys are secured with AES-256-GCM authenticated encryption.
                  Decryption occurs strictly in-memory during streaming and is never exposed in logs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>ENCRYPTION</span>
                <span className="text-blue-400 font-semibold">AES-256-GCM</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Lossless Context Preservation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Switch from OpenAI to Anthropic to Google mid-session without losing your conversational history.
                  OmniMesh normalizes message structures and manages token budget limits automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>CONTEXT MANAGER</span>
                <span className="text-amber-400 font-semibold">TOKEN BUDGETED</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Groq LPU Acceleration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Native Groq adapter support for Llama 3.3 70B and Mixtral. Experience streaming
                  speeds exceeding 400 tokens per second for high-throughput operational tasks.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>INFERENCE ENGINE</span>
                <span className="text-orange-400 font-semibold">~400 TOKENS/SEC</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="omni-card p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-100 mb-4">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Zero-Key Simulator Models</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Test and evaluate OmniMesh out-of-the-box without entering external keys.
                  Built-in simulated models emulate full streaming, token metrics, and latency.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono-telemetry">
                <span>SIMULATOR</span>
                <span className="text-emerald-400 font-semibold">READY TO RUN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Supported Models Fleet Grid */}
      <section id="models" className="py-16 px-4 sm:px-6 bg-[#0f0f12] border-t border-[#27272a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-mono-telemetry text-zinc-500 uppercase tracking-wider">Fleet Coverage</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
                Integrated Model Ecosystem
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
              Seamlessly switch between closed and open-weight models with automatic parameter translation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                provider: "OpenAI",
                models: ["GPT-4o", "GPT-4o Mini"],
                desc: "Flagship multimodal intelligence & structured reasoning.",
                context: "128k context",
                border: "hover:border-emerald-500/50",
              },
              {
                provider: "Anthropic",
                models: ["Claude 3.5 Sonnet", "Claude 3.5 Haiku"],
                desc: "State-of-the-art coding, architecture, and agentic reasoning.",
                context: "200k context",
                border: "hover:border-amber-500/50",
              },
              {
                provider: "Google",
                models: ["Gemini 1.5 Pro", "Gemini 1.5 Flash"],
                desc: "Industry-leading long context window for multi-document analysis.",
                context: "2,000k context",
                border: "hover:border-blue-500/50",
              },
              {
                provider: "Groq LPU",
                models: ["Llama 3.3 70B", "Mixtral 8x7B"],
                desc: "Deterministic LPUs providing blazing instant inference.",
                context: "128k context",
                border: "hover:border-orange-500/50",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`bg-[#121215] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between transition-all ${card.border}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-zinc-200 uppercase font-mono-telemetry">
                      {card.provider}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-telemetry bg-zinc-800/80 px-2 py-0.5 rounded">
                      {card.context}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {card.models.map((m, idx) => (
                      <p key={idx} className="text-sm font-semibold text-zinc-100">
                        {m}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Enterprise Security & Cryptographic Architecture */}
      <section id="security" className="py-20 px-4 sm:px-6 bg-[#09090b] border-t border-[#27272a] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-Knowledge Security</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
              Enterprise-Grade Cryptographic Architecture
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
              Your API keys and corporate intelligence are protected by military-grade AES-256-GCM encryption with strict in-memory volatile execution.
            </p>
          </div>

          {/* 4 Security Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 mb-3.5">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">AES-256-GCM at Rest</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Keys are encrypted using 256-bit Galois/Counter Mode with randomized 16-byte initialization vectors and authenticated tags.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono-telemetry text-zinc-500">
                PROTOCOL // NIST SP 800-38D
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-3.5">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Volatile Decryption</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Decryption occurs strictly in-memory during streaming requests and is immediately purged upon stream termination. Never written to disk.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono-telemetry text-zinc-500">
                EXECUTION // EPHEMERAL RAM
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 mb-3.5">
                  <EyeOff className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Zero Plaintext Logs</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All error traces and audit trails mask keys to the trailing 4 characters. Prompts and completions are never logged or stored in plain text.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono-telemetry text-zinc-500">
                LOGGING // STRICT SANITIZATION
              </div>
            </div>

            <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-3.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Direct Provider BYOK</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Streaming calls route directly over TLS 1.3 to official OpenAI, Anthropic, Google, and Groq endpoints. No third-party data scraping.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono-telemetry text-zinc-500">
                TRANSPORT // TLS 1.3 BYOK
              </div>
            </div>
          </div>

          {/* Interactive Vault Architecture Box */}
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] font-mono-telemetry text-zinc-500 uppercase tracking-wider">
                  CRYPTOGRAPHIC FLOW VISUALIZER
                </span>
                <h3 className="text-lg font-bold text-zinc-100 mt-0.5">
                  How Your Keys Are Protected
                </h3>
              </div>
              <button
                onClick={onOpenVault}
                className="omni-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Key Vault</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-telemetry text-xs">
              <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-semibold text-zinc-200">1. Client Ingestion</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <p className="text-zinc-500 text-[11px] font-sans">
                  Raw API key is accepted via secure HTTPS payload and validated against provider format rules.
                </p>
                <div className="p-2 rounded bg-[#121215] text-[10px] text-zinc-400 border border-zinc-800/80">
                  input: &quot;sk-proj-987...210a&quot;
                </div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-semibold text-zinc-200">2. AES-256 Encryption</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-zinc-500 text-[11px] font-sans">
                  A random 16-byte IV is generated. Node crypto encrypts the string into ciphertext and computes a 16-byte auth tag.
                </p>
                <div className="p-2 rounded bg-[#121215] text-[10px] text-emerald-400 border border-zinc-800/80">
                  cipher: &quot;a7f92b...&quot; + iv + tag
                </div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-semibold text-zinc-200">3. Isolated Database</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <p className="text-zinc-500 text-[11px] font-sans">
                  Only the encrypted ciphertext, IV, auth tag, and masked preview are saved to Supabase PostgreSQL.
                </p>
                <div className="p-2 rounded bg-[#121215] text-[10px] text-zinc-400 border border-zinc-800/80">
                  display: &quot;sk-...210a&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Clean Call to Action */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
            Start Orchestrating Models in Seconds
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            No mandatory credit card. Launch the instant demo workspace or connect your keys in the encrypted vault.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="omni-btn-primary px-8 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg w-full sm:w-auto"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenVault}
              className="omni-btn-secondary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <KeyRound className="w-4 h-4 text-zinc-400" />
              <span>Configure Key Vault</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto border-t border-[#27272a] bg-[#09090b] py-8 px-4 sm:px-6 text-xs text-zinc-500 font-mono-telemetry">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-300">OmniMesh Platform</span>
            <span>— Multi-Model AI Orchestration</span>
          </div>
          <div className="flex items-center gap-6 text-zinc-400">
            <span>AES-256-GCM Encrypted</span>
            <span>Context Preserving</span>
            <span>Zero Server Logs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
