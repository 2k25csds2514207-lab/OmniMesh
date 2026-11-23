import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniMesh - Unified Multi-Model AI Workspace",
  description: "One login, every top AI model, encrypted API key vault, cross-model context preservation, and split view comparison.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-[#f3f4f6] antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
