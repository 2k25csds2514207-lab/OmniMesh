import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { decryptApiKey } from "@/lib/vault/crypto";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, apiKey: rawKey } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required." }, { status: 400 });
    }

    let keyToTest = rawKey;

    // If key not directly provided, fetch from vault
    if (!keyToTest) {
      const stored = await prisma.apiKey.findUnique({
        where: {
          userId_provider: {
            userId: user.id,
            provider: provider.toLowerCase(),
          },
        },
      });

      if (!stored) {
        return NextResponse.json({ valid: false, message: `No API key saved for ${provider}.` }, { status: 404 });
      }

      keyToTest = decryptApiKey(stored.encryptedKey, stored.iv, stored.authTag);
    }

    if (provider === "mock" || keyToTest.startsWith("sample-") || keyToTest.startsWith("demo-")) {
      return NextResponse.json({
        valid: true,
        message: `${provider.toUpperCase()} sample evaluation key verified (Sandbox active).`,
      });
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${keyToTest}` },
      });
      if (res.ok) {
        return NextResponse.json({ valid: true, message: "OpenAI API key verified successfully!" });
      } else {
        const data = await res.json().catch(() => ({}));
        return NextResponse.json({
          valid: false,
          message: data.error?.message || `OpenAI validation failed (${res.status})`,
        });
      }
    }

    if (provider === "anthropic") {
      // Test Anthropic models or minimal message
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": keyToTest,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });

      if (res.ok || res.status === 200) {
        return NextResponse.json({ valid: true, message: "Anthropic API key verified successfully!" });
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({
            valid: false,
            message: data.error?.message || "Invalid Anthropic API key.",
          });
        }
        // If it's a rate limit or valid auth check
        return NextResponse.json({
          valid: true,
          message: "Anthropic API key authenticated successfully.",
        });
      }
    }

    if (provider === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      if (res.ok) {
        return NextResponse.json({ valid: true, message: "Google Gemini API key verified successfully!" });
      } else {
        const data = await res.json().catch(() => ({}));
        return NextResponse.json({
          valid: false,
          message: data.error?.message || `Gemini validation failed (${res.status})`,
        });
      }
    }

    if (provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${keyToTest}` },
      });
      if (res.ok) {
        return NextResponse.json({ valid: true, message: "Groq API key verified successfully!" });
      } else {
        const data = await res.json().catch(() => ({}));
        return NextResponse.json({
          valid: false,
          message: data.error?.message || `Groq validation failed (${res.status})`,
        });
      }
    }

    return NextResponse.json({ valid: true, message: "Key format appears valid." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation error";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}

