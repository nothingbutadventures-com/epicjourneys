import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import Integration from "@/models/Integration";
import { decryptSecret } from "@/lib/secret-box";

export interface RazorpayCreds {
  keyId: string;
  keySecret: string;
  mode: "test" | "live";
  source: "admin" | "env";
}

let cache: { at: number; value: RazorpayCreds | null } | null = null;
const TTL_MS = 15_000;

/** Called after the admin saves, so the new keys apply immediately on this server instance. */
export const clearRazorpayCache = () => {
  cache = null;
};

/**
 * The keys checkout should use: the pair saved in Admin → Integrations for the active mode,
 * else the RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET env variables, else null (payment simulator).
 */
export async function getRazorpayCreds(): Promise<RazorpayCreds | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value: RazorpayCreds | null = null;
  try {
    await connectToDatabase();
    const doc: any = await Integration.findOne({ provider: "razorpay" }).lean();
    if (doc) {
      const mode: "test" | "live" = doc.mode === "live" ? "live" : "test";
      const pair = doc[mode] || {};
      const keySecret = decryptSecret(pair.secretEnc);
      if (pair.keyId && keySecret) value = { keyId: pair.keyId, keySecret, mode, source: "admin" };
    }
  } catch {
    // Database unreachable: fall through to the env variables.
  }
  if (!value) {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
    if (keyId && keySecret) value = { keyId, keySecret, mode: keyId.startsWith("rzp_live_") ? "live" : "test", source: "env" };
  }
  cache = { at: Date.now(), value };
  return value;
}

/** When no keys are available, checkout falls back to the on-screen payment simulator. */
export const razorpayConfigured = async () => Boolean(await getRazorpayCreds());

const basicAuth = (c: { keyId: string; keySecret: string }) => `Basic ${Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64")}`;

export async function createRazorpayOrder(opts: { amountInr: number; receipt: string; notes?: Record<string, string> }) {
  const creds = await getRazorpayCreds();
  if (!creds) throw new Error("Razorpay is not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: basicAuth(creds) },
    body: JSON.stringify({
      amount: Math.round(opts.amountInr * 100), // paise
      currency: "INR",
      receipt: opts.receipt.slice(0, 40),
      notes: opts.notes || {},
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || "Could not create the Razorpay order");
  return { ...(data as { id: string; amount: number; currency: string }), keyId: creds.keyId };
}

/** Checks a key pair against Razorpay without creating anything. */
export async function testRazorpayKeys(keyId: string, keySecret: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders?count=1", { headers: { Authorization: basicAuth({ keyId, keySecret }) } });
    if (res.ok) return { ok: true, message: "Razorpay accepted these keys." };
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data?.error?.description || `Razorpay rejected these keys (HTTP ${res.status}).` };
  } catch (e: any) {
    return { ok: false, message: `Couldn't reach Razorpay: ${e.message}` };
  }
}

export async function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const creds = await getRazorpayCreds();
  if (!creds) return false;
  const expected = crypto.createHmac("sha256", creds.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
