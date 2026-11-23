import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, signToken } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name || null,
      },
    });

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

