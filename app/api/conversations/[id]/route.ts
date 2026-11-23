import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updated = await prisma.conversation.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: { title: title.trim() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, title: title.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await prisma.conversation.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

