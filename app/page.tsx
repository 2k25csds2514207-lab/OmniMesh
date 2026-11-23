"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { SplitView } from "@/components/split/SplitView";
import { VaultModal } from "@/components/vault/VaultModal";
import { LandingPage } from "@/components/landing/LandingPage";
import { useOmniStore } from "@/lib/store/useOmniStore";

export default function Home() {
  const { mode, setMode } = useOmniStore();
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  // Default to landing page when visiting the main root link without params
  const [view, setView] = useState<"workspace" | "landing">("landing");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If incoming query param has ?view=workspace or session view is workspace, open workspace directly
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    const sessionView = typeof window !== "undefined" ? sessionStorage.getItem("omni_view") : null;
    if (viewParam === "workspace" || sessionView === "workspace") {
      setView("workspace");
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthenticated");
        return res.json();
      })
      .then((data) => {
        // Do NOT keep signed in with demo account on home page!
        if (data.user?.email === "developer@omnimesh.local") {
          fetch("/api/auth/logout", { method: "POST" });
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("omni_view");
          }
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!data.user);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handleEnterWorkspace = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omni_view", "workspace");
      window.history.pushState({}, "", "/?view=workspace");
    }
    setView("workspace");
  };

  const handleOpenLanding = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("omni_view");
      window.history.pushState({}, "", "/");
    }
    setView("landing");
  };

  if (view === "landing") {
    return (
      <main className="min-h-screen bg-[#09090b]">
        <LandingPage
          isAuthenticated={isAuthenticated}
          onEnterWorkspace={handleEnterWorkspace}
          onOpenVault={() => {
            if (!isAuthenticated) {
              window.location.href = "/login";
              return;
            }
            handleEnterWorkspace();
            setIsVaultOpen(true);
          }}
          onOpenSplit={() => {
            if (!isAuthenticated) {
              window.location.href = "/login";
              return;
            }
            handleEnterWorkspace();
            setMode("split");
          }}
        />
        <VaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
      {/* Collapsible/Responsive Left Sidebar */}
      <Sidebar
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenLanding={handleOpenLanding}
      />

      {/* Center Main Workspace: Chat or Split View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {mode === "chat" ? <ChatArea /> : <SplitView />}
      </div>

      {/* API Key Vault Modal */}
      <VaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </main>
  );
}
