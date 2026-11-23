import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Guaranteed fallback for Supabase DB URL
const FALLBACK_DB_URL =
  "postgresql://postgres.lzgbkogxovjldynvadnu:Mishraaaru%40123@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

// Auto-populate process.env from .env if running Next.js process hasn't reloaded it
function ensureEnvLoaded() {
  const envPaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
          if (match) {
            const key = match[1];
            let val = match[2].trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        console.warn("Could not load env file:", envPath, err);
      }
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = FALLBACK_DB_URL;
  }
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

ensureEnvLoaded();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const activeDbUrl = process.env.DATABASE_URL || FALLBACK_DB_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
