"use client";

import React, { useState, useEffect } from "react";
import { useOmniStore } from "@/lib/store/useOmniStore";
import {
  Plus,
  MessageSquare,
  Columns,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  Search,
  LogOut,
  User,
  Layers,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  onOpenVault: () => void;
  onOpenLanding?: () => void;
}

export function Sidebar({ onOpenVault, onOpenLanding }: SidebarProps) {
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    setMessages,
    mode,
    setMode,
    setIsLoadingConversation,
  } = useOmniStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    // Fetch conversations list
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations) {
          setConversations(data.conversations);
        }
      })
      .catch((err) => console.error("Failed to load conversations:", err));

    // Fetch user info
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [setConversations]);

  const handleSelectConversation = async (id: string) => {
    if (activeConversationId === id && mode === "chat") return;
    setActiveConversationId(id);
    setMode("chat");
    setIsLoadingConversation(true);

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation.messages || []);
      }
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setMode("chat");
  };

  const handleRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (res.ok) {
        setConversations(
          conversations.map((c) => (c.id === id ? { ...c, title: editingTitle.trim() } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations(conversations.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("omni_view");
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 md:w-72 h-full bg-[#111114] border-r border-[#27272a] flex flex-col select-none shrink-0 relative z-20">
      {/* Brand Header */}
      <div
        onClick={onOpenLanding}
        className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]/60 cursor-pointer hover:bg-zinc-900/60 transition-colors"
        title="View OmniMesh Overview"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
            <Layers className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">OmniMesh</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-zinc-500 font-mono-telemetry">Multi-Model Console</p>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400" />
      </div>

      {/* Main Navigation Actions */}
      <div className="p-3 space-y-1.5 border-b border-[#27272a]">
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-semibold text-xs transition-all shadow-sm group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-300 group-hover:scale-110 transition-transform" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] font-mono-telemetry text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
            ⌘N
          </span>
        </button>

        {/* Split View */}
        <button
          onClick={() => setMode("split")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            mode === "split"
              ? "bg-zinc-800/90 border-zinc-700 text-zinc-100 shadow-sm"
              : "bg-transparent hover:bg-zinc-900/60 border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-indigo-400" />
            <span>Split Comparison</span>
          </div>
          <span className="text-[9px] font-mono-telemetry px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            BENCHMARK
          </span>
        </button>

        {/* API Key Vault */}
        <button
          onClick={onOpenVault}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-transparent hover:bg-zinc-900/60 border border-transparent text-zinc-400 hover:text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>API Key Vault</span>
          </div>
          <span className="text-[9px] font-mono-telemetry px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            AES-256
          </span>
        </button>
      </div>

      {/* Conversation Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Conversations History List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-mono-telemetry uppercase tracking-wider text-zinc-500">
          Recent Chats
        </div>

        {filteredConversations.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-6">
            {searchQuery ? "No matching chats" : "No previous conversations"}
          </p>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id && mode === "chat";
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/80 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-zinc-200" : "text-zinc-500"}`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(conv.id, e as any);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="bg-zinc-900 text-zinc-100 border border-zinc-600 px-2 py-0.5 rounded text-xs w-full focus:outline-none"
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <button
                      onClick={(e) => handleRename(conv.id, e)}
                      className="p-1 hover:text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        className="p-1 hover:text-zinc-200"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#27272a] bg-[#09090b]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {currentUser?.name || "OmniMesh Operator"}
            </p>
            <p className="text-[10px] text-zinc-500 truncate font-mono-telemetry">
              {currentUser?.email || "active session"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
