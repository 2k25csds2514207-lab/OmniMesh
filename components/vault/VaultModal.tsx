"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  EyeOff,
  X,
  ExternalLink,
} from "lucide-react";

interface VaultKey {
  id: string;
  provider: string;
  last4: string;
  masked: string;
  label?: string | null;
  updatedAt: string;
}

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaultModal({ isOpen, onClose }: VaultModalProps) {
  const [keys, setKeys] = useState<VaultKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProvider, setAddingProvider] = useState<string>("openai");
  const [inputKey, setInputKey] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatingProvider, setValidatingProvider] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ provider: string; valid: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
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
      setErrorMessage(null);
      setValidationResult(null);
    }
  }, [isOpen]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim() || isSubmitting) return;

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
      const msg = err instanceof Error ? err.message : "Error saving key";
      setErrorMessage(msg);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e111a] border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">API Key Vault</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted at rest with AES-256-GCM. Decrypted server-side only.</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Keys List */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Stored Provider Keys
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-500 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading vault keys...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500 bg-[#0a0c12]">
                No API keys stored yet. Add your OpenAI, Anthropic, or Gemini key below to unlock live models, or use
                the Simulator models with zero keys required.
              </div>
            ) : (
              <div className="space-y-2.5">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3.5 rounded-xl bg-[#141824] border border-gray-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-gray-200">{k.provider}</span>
                          {k.label && <span className="text-xs text-gray-400">({k.label})</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs font-mono text-gray-400">{k.masked}</code>
                          <span title="Key encrypted and masked">
                            <EyeOff className="w-3 h-3 text-gray-500" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleValidateKey(k.provider)}
                        disabled={validatingProvider === k.provider}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-1.5"
                      >
                        {validatingProvider === k.provider ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => handleDeleteKey(k.provider)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
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
                className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${validationResult.valid
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
          <div className="p-4 rounded-xl bg-[#121622] border border-gray-800">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Add or Replace Provider Key
            </h3>

            <form onSubmit={handleSaveKey} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Provider</label>
                  <select
                    value={addingProvider}
                    onChange={(e) => setAddingProvider(e.target.value)}
                    className="w-full bg-[#181d2c] border border-gray-700 text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {supportedProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nickname (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal Account"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    className="w-full bg-[#181d2c] border border-gray-700 text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">API Key</label>
                  {supportedProviders.find((p) => p.id === addingProvider)?.docs && (
                    <a
                      href={supportedProviders.find((p) => p.id === addingProvider)?.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
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
                  className="w-full bg-[#181d2c] border border-gray-700 text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-md flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Encrypt & Save to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
