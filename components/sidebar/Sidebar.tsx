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
  Sparkles,
  ChevronRight,
  Shield,
} from "lucide-react";

interface SidebarProps {
  onOpenVault: () => void;
}

export function Sidebar({ onOpenVault }: SidebarProps) {
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
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 md:w-72 h-full bg-[#0d0f17] border-r border-gray-800/80 flex flex-col select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-[#10131e]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-100 tracking-wide">OmniMesh</h1>
            <p className="text-[10px] text-gray-400 font-mono">Multi-Model AI Workspace</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Actions */}
      <div className="p-3 space-y-1.5 border-b border-gray-800/60">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] opacity-70 font-mono">⌘N</span>
        </button>

        <button
          onClick={() => setMode("split")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            mode === "split"
              ? "bg-purple-600/20 border-purple-500/40 text-purple-200"
              : "bg-[#131622] hover:bg-[#181c2b] border-gray-800 text-gray-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-purple-400" />
            <span>Split View Comparison</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
            Parallel
          </span>
        </button>

        <button
          onClick={onOpenVault}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#131622] hover:bg-[#181c2b] border border-gray-800 text-gray-300 font-semibold text-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>API Key Vault</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Encrypted
          </span>
        </button>
      </div>

      {/* Conversation Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#121520] border border-gray-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Conversations History List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          History
        </div>

        {filteredConversations.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">
            {searchQuery ? "No matching chats" : "No past conversations"}
          </p>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id && mode === "chat";
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#181d2c] border border-gray-700/80 text-gray-100 font-medium shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#131622] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
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
                      className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-xs w-full focus:outline-none"
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
                        className="p-1 hover:text-gray-200"
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

      {/* User Profile / Status Footer */}
      <div className="p-3 border-t border-gray-800/80 bg-[#10131e]/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">
              {currentUser?.name || "OmniMesh User"}
            </p>
            <p className="text-[10px] text-gray-500 truncate font-mono">
              {currentUser?.email || "active session"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
