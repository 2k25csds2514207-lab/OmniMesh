import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { encryptApiKey } from "@/lib/vault/crypto";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sampleKeys = [
      { provider: "openai", key: "sample-openai-eval-key-2026", label: "Sample OpenAI Sandbox" },
      { provider: "anthropic", key: "sample-anthropic-eval-key-2026", label: "Sample Claude Sandbox" },
      { provider: "gemini", key: "sample-gemini-eval-key-2026", label: "Sample Gemini Sandbox" },
      { provider: "groq", key: "sample-groq-eval-key-2026", label: "Sample Groq LPU Sandbox" },
    ];

    for (const item of sampleKeys) {
      const encrypted = encryptApiKey(item.key);
      await prisma.apiKey.upsert({
        where: {
          userId_provider: {
            userId: user.id,
            provider: item.provider,
          },
        },
        update: {
          encryptedKey: encrypted.encryptedKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          last4: encrypted.last4,
          label: item.label,
        },
        create: {
          userId: user.id,
          provider: item.provider,
          encryptedKey: encrypted.encryptedKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          last4: encrypted.last4,
          label: item.label,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sample evaluation keys loaded into vault successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load sample keys";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
