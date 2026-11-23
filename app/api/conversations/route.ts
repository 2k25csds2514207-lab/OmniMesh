import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const title = body?.title || "New Chat";

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title,
      },
    });

    return NextResponse.json({ conversation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

