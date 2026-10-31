import crypto from "crypto";

// AES-256-GCM encryption for secrets stored in the database (payment gateway keys etc.).
// The key comes from INTEGRATIONS_ENCRYPTION_KEY, falling back to JWT_SECRET so it works without extra setup.
// Set a dedicated INTEGRATIONS_ENCRYPTION_KEY in production: changing it later makes saved secrets unreadable.

const source = () => process.env.INTEGRATIONS_ENCRYPTION_KEY || process.env.JWT_SECRET || "";

function key() {
  const s = source();
  if (!s) throw new Error("Set INTEGRATIONS_ENCRYPTION_KEY (or JWT_SECRET) so secrets can be encrypted.");
  return crypto.scryptSync(s, "epicjourneys-integrations-v1", 32);
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

/** Returns "" when the value can't be decrypted (wrong key or tampered data). */
export function decryptSecret(enc?: string): string {
  if (!enc) return "";
  try {
    const [v, iv, tag, data] = enc.split(":");
    if (v !== "v1") return "";
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
