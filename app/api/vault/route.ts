import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { encryptApiKey, maskApiKey } from "@/lib/vault/crypto";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      last4: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const maskedKeys = keys.map((k) => ({
    ...k,
    masked: maskApiKey(k.provider, k.last4),
  }));

  return NextResponse.json({ keys: maskedKeys });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, apiKey, label } = await req.json();

    if (!provider || !apiKey || typeof provider !== "string" || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Provider and apiKey are required." }, { status: 400 });
    }

    const cleanProvider = provider.toLowerCase().trim();
    const cleanKey = apiKey.trim();

    if (cleanKey.length < 8) {
      return NextResponse.json({ error: "API key is too short to be valid." }, { status: 400 });
    }

    // Encrypt key with AES-256-GCM using server master key
    const encrypted = encryptApiKey(cleanKey);

    const saved = await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: cleanProvider,
        },
      },
      update: {
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        last4: encrypted.last4,
        label: label || null,
      },
      create: {
        userId: user.id,
        provider: cleanProvider,
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        last4: encrypted.last4,
        label: label || null,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: saved.id,
        provider: saved.provider,
        last4: saved.last4,
        label: saved.label,
        masked: maskApiKey(saved.provider, saved.last4),
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving key to vault";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const id = searchParams.get("id");

    if (id) {
      await prisma.apiKey.deleteMany({
        where: { id, userId: user.id },
      });
    } else if (provider) {
      await prisma.apiKey.deleteMany({
        where: { provider: provider.toLowerCase(), userId: user.id },
      });
    } else {
      return NextResponse.json({ error: "Provider or key ID is required." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

