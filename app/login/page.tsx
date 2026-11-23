"use client";

import React, { useState } from "react";
import { Layers, ArrowRight, ShieldCheck, Loader2, Sparkles, Lock } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setError(null);

    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: isSignUp ? name : undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("omni_view", "workspace");
      }
      window.location.href = "/?view=workspace";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetch("/api/auth/demo", { method: "POST" });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("omni_view", "workspace");
      }
      window.location.href = "/?view=workspace";
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("omni_view", "workspace");
      }
      window.location.href = "/?view=workspace";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-zinc-800 font-sans relative">
      {/* Subtle background ambient blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-zinc-800/20 to-zinc-700/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl p-7 sm:p-9 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center shadow-sm mb-3">
            <Layers className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {isSignUp ? "Create your OmniMesh account" : "Welcome back to OmniMesh"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            The multi-model developer console for OpenAI, Anthropic, Gemini & Groq
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-[#18181b] p-1 mb-6 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              !isSignUp
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isSignUp
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aaradhya Raghuvanshi"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              {!isSignUp && (
                <span className="text-[11px] text-zinc-500 hover:text-zinc-400 cursor-pointer">
                  Forgot?
                </span>
              )}
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 omni-btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <>
                <span>{isSignUp ? "Create Workspace Account" : "Sign In to Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[#121215] text-zinc-500 font-mono-telemetry text-[11px]">
              OR EVALUATE INSTANTLY
            </span>
          </div>
        </div>

        {/* Quick Demo Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Launch Instant Demo Workspace</span>
        </button>

        {/* Security badge footer */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Encrypted at rest with AES-256-GCM • Zero key telemetry</span>
        </div>
      </div>
    </div>
  );
}
