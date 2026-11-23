import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

/**
 * Derives a 32-byte key from VAULT_MASTER_KEY env var.
 * Falls back to a deterministic SHA-256 hash if the env var is arbitrary text or base64.
 */
function getMasterKey(): Buffer {
  const secret = process.env.VAULT_MASTER_KEY || "omnimesh-default-secret-master-key-must-be-32-bytes";
  try {
    const buf = Buffer.from(secret, "base64");
    if (buf.length === 32) return buf;
  } catch {
    // Fall through to hash derivation
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedData {
  encryptedKey: string; // hex or base64
  iv: string;           // hex
  authTag: string;      // hex
  last4: string;
}

/**
 * Encrypts an API key using AES-256-GCM.
 */
export function encryptApiKey(plainKey: string): EncryptedData {
  if (!plainKey || typeof plainKey !== "string") {
    throw new Error("Invalid API key provided for encryption");
  }

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  const trimmed = plainKey.trim();
  const last4 = trimmed.length > 4 ? trimmed.slice(-4) : trimmed;

  return {
    encryptedKey: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag,
    last4,
  };
}

/**
 * Decrypts an API key using AES-256-GCM.
 * Never logs or exposes decrypted data.
 */
export function decryptApiKey(encryptedKey: string, ivHex: string, authTagHex: string): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generates a masked display representation (e.g. sk-...a1b2).
 */
export function maskApiKey(provider: string, last4: string): string {
  const p = provider.toLowerCase();
  const prefix =
    p === "openai"
      ? "sk-..."
      : p === "anthropic"
      ? "sk-ant-..."
      : p === "groq"
      ? "gsk_..."
      : "...";
  return `${prefix}${last4}`;
}

