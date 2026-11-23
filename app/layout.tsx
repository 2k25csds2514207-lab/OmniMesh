import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniMesh — Multi-Model AI Orchestration Platform",
  description:
    "Unified multi-model AI workspace with autonomous Smart Router, client-side AES-256 API key vault, cross-model context preservation, and split view benchmark comparison.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa] antialiased selection:bg-zinc-800 selection:text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
