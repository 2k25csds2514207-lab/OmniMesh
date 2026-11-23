import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, signToken } from "@/lib/auth/session";
import { encryptApiKey } from "@/lib/vault/crypto";

export async function POST() {
  try {
    const demoEmail = "developer@omnimesh.local";

    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      const passwordHash = await hashPassword("demo-password-1234");
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash,
          name: "OmniMesh Operator",
        },
      });
    }

    // Pre-populate sample evaluation keys for demo user if they don't have keys yet
    const existingKeysCount = await prisma.apiKey.count({ where: { userId: user.id } });
    if (existingKeysCount === 0) {
      const sampleKeys = [
        { provider: "openai", key: "sample-openai-eval-key-2026", label: "OpenAI Demo Sandbox" },
        { provider: "anthropic", key: "sample-anthropic-eval-key-2026", label: "Claude Demo Sandbox" },
        { provider: "gemini", key: "sample-gemini-eval-key-2026", label: "Gemini Demo Sandbox" },
        { provider: "groq", key: "sample-groq-eval-key-2026", label: "Groq Demo Sandbox" },
      ];
      for (const item of sampleKeys) {
        const encrypted = encryptApiKey(item.key);
        await prisma.apiKey.create({
          data: {
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
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });

    res.cookies.set("omnimesh_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to launch demo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
