"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { SplitView } from "@/components/split/SplitView";
import { VaultModal } from "@/components/vault/VaultModal";
import { useOmniStore } from "@/lib/store/useOmniStore";

export default function Home() {
  const { mode } = useOmniStore();
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#090a0f]">
      {/* Collapsible/Responsive Left Sidebar */}
      <Sidebar onOpenVault={() => setIsVaultOpen(true)} />

      {/* Center Main Workspace: Chat or Split View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {mode === "chat" ? <ChatArea /> : <SplitView />}
      </div>

      {/* API Key Vault Modal */}
      <VaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </main>
  );
}
