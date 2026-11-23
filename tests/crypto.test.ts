import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../lib/vault/crypto";

describe("Vault AES-256-GCM Encryption", () => {
  it("should encrypt and decrypt an OpenAI key successfully", () => {
    const rawKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptApiKey(rawKey);

    expect(encrypted.encryptedKey).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.last4).toBe("wxyz");
    expect(encrypted.encryptedKey).not.toContain(rawKey);

    const decrypted = decryptApiKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe(rawKey);
  });

  it("should produce different ciphertexts for the same key due to random IV", () => {
    const rawKey = "sk-ant-api03-test-key-content-12345";
    const enc1 = encryptApiKey(rawKey);
    const enc2 = encryptApiKey(rawKey);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.encryptedKey).not.toBe(enc2.encryptedKey);

    expect(decryptApiKey(enc1.encryptedKey, enc1.iv, enc1.authTag)).toBe(rawKey);
    expect(decryptApiKey(enc2.encryptedKey, enc2.iv, enc2.authTag)).toBe(rawKey);
  });

  it("should mask keys appropriately without revealing full key", () => {
    expect(maskApiKey("openai", "a1b2")).toBe("sk-...a1b2");
    expect(maskApiKey("anthropic", "9z8y")).toBe("sk-ant-...9z8y");
    expect(maskApiKey("gemini", "5544")).toBe("...5544");
    expect(maskApiKey("groq", "9876")).toBe("gsk_...9876");
  });
});
