import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "../db/prisma";

const JWT_SECRET = process.env.AUTH_SECRET || "omnimesh-fallback-auth-secret-key-32chars";
const COOKIE_NAME = "omnimesh_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently logged-in user from request cookies.
 * If no session exists, creates or retrieves a default demo user so
 * users can immediately test the workspace without friction.
 */
export async function getSessionUser(): Promise<{ id: string; email: string; name?: string | null } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true },
        });
        if (user) return user;
      }
    }

    // Auto-provision demo user for zero-barrier local experience
    const demoEmail = "developer@omnimesh.local";
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
      select: { id: true, email: true, name: true },
    });

    if (!demoUser) {
      const defaultHash = await hashPassword("omnimesh123");
      demoUser = await prisma.user.create({
        data: {
          email: demoEmail,
          name: "OmniMesh Developer",
          passwordHash: defaultHash,
        },
        select: { id: true, email: true, name: true },
      });
    }

    return demoUser;
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

