"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoredKey {
  id: string;
  provider: string;
  last4: string;
  masked: string;
  label?: string;
  createdAt: string;
}

export function VaultModal({ isOpen, onClose }: VaultModalProps) {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingProvider, setAddingProvider] = useState("openai");
  const [inputKey, setInputKey] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeedingSample, setIsSeedingSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation state per provider
  const [validatingProvider, setValidatingProvider] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    provider: string;
    valid: boolean;
    message: string;
  } | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load vault keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setValidationResult(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleLoadSampleKeys = async () => {
    setIsSeedingSample(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vault/sample", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load sample keys");
      }
      await fetchKeys();
      setValidationResult({
        provider: "ALL PROVIDERS",
        valid: true,
        message: "Loaded 4 Sandbox Evaluation Keys (OpenAI, Anthropic, Gemini, Groq). Ready for testing!",
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load sample keys");
    } finally {
      setIsSeedingSample(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: addingProvider,
          apiKey: inputKey.trim(),
          label: inputLabel.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save key");
      }

      setInputKey("");
      setInputLabel("");
      await fetchKeys();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to remove your ${provider.toUpperCase()} key?`)) return;

    try {
      const res = await fetch(`/api/vault?provider=${provider}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  };

  const handleValidateKey = async (provider: string) => {
    setValidatingProvider(provider);
    setValidationResult(null);

    try {
      const res = await fetch("/api/vault/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();
      setValidationResult({
        provider,
        valid: data.valid,
        message: data.message || (data.valid ? "Key verified successfully!" : "Verification failed"),
      });
    } catch (err: unknown) {
      setValidationResult({
        provider,
        valid: false,
        message: err instanceof Error ? err.message : "Validation request failed",
      });
    } finally {
      setValidatingProvider(null);
    }
  };

  if (!isOpen) return null;

  const supportedProviders = [
    { id: "openai", name: "OpenAI", placeholder: "sk-proj-...", docs: "https://platform.openai.com/api-keys" },
    { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-...", docs: "https://console.anthropic.com/" },
    { id: "gemini", name: "Google Gemini", placeholder: "AIzaSy...", docs: "https://aistudio.google.com/app/apikey" },
    { id: "groq", name: "Groq", placeholder: "gsk_...", docs: "https://console.groq.com/keys" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
                Encrypted API Key Vault
              </h2>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono-telemetry">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256-GCM Zero-Knowledge Storage</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Keys List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[10px] font-mono-telemetry uppercase tracking-wider text-zinc-400">
                Configured Provider Credentials
              </h3>
              <button
                type="button"
                onClick={handleLoadSampleKeys}
                disabled={isSeedingSample || loading}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono-telemetry bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Populate test keys for all 4 providers (OpenAI, Anthropic, Gemini, Groq)"
              >
                {isSeedingSample ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                )}
                <span>Load Sample Demo Keys</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6 text-zinc-500 text-xs gap-2 font-mono-telemetry">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span>Querying encrypted vault...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-zinc-800 text-center space-y-3 bg-zinc-900/40">
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  No external API keys saved yet. Add your OpenAI, Anthropic, Gemini, or Groq key below, or pre-load sandbox evaluation keys for instant testing.
                </p>
                <button
                  type="button"
                  onClick={handleLoadSampleKeys}
                  disabled={isSeedingSample}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                >
                  {isSeedingSample ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Pre-load 4 Sandbox Demo Keys (OpenAI, Anthropic, Gemini, Groq)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3.5 rounded-xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-zinc-100 font-mono-telemetry tracking-wider">
                            {k.provider}
                          </span>
                          {k.label && <span className="text-xs text-zinc-400">({k.label})</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs font-mono-telemetry text-zinc-300">{k.masked}</code>
                          <span title="Key encrypted and masked">
                            <EyeOff className="w-3 h-3 text-zinc-500" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleValidateKey(k.provider)}
                        disabled={validatingProvider === k.provider}
                        className="px-2.5 py-1 rounded-md text-xs font-mono-telemetry bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {validatingProvider === k.provider ? (
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-300" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Ping</span>
                      </button>

                      <button
                        onClick={() => handleDeleteKey(k.provider)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {validationResult && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 font-mono-telemetry ${
                  validationResult.valid
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>
                  <strong>{validationResult.provider.toUpperCase()}:</strong> {validationResult.message}
                </span>
              </div>
            )}
          </div>

          {/* Add / Update Key Form */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#18181b] border border-zinc-800">
            <h3 className="text-[10px] font-mono-telemetry uppercase tracking-wider text-zinc-400 mb-3">
              Add or Rotate Provider Credential
            </h3>

            <form onSubmit={handleSaveKey} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Provider
                  </label>
                  <select
                    value={addingProvider}
                    onChange={(e) => setAddingProvider(e.target.value)}
                    className="w-full bg-[#121215] border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 font-sans cursor-pointer"
                  >
                    {supportedProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Work Key"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-400">API Key</label>
                  {supportedProviders.find((p) => p.id === addingProvider)?.docs && (
                    <a
                      href={supportedProviders.find((p) => p.id === addingProvider)?.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-1 font-mono-telemetry"
                    >
                      <span>Get {addingProvider} key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={supportedProviders.find((p) => p.id === addingProvider)?.placeholder}
                  className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono-telemetry"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!inputKey.trim() || isSubmitting}
                  className="omni-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Encrypt & Store in Vault</span>
                </button>
              </div>
            </form>

            {/* Free Provider Keys Tip */}
            <div className="mt-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Need free keys for testing?</span>
              </div>
              <p>
                Click <strong>Load Sample Demo Keys</strong> above for simulated testing, or get free keys with no credit card required from{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Groq Cloud
                </a>{" "}
                and{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
