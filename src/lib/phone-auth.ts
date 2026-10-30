import crypto from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Customers sign in with their mobile number. Firebase sends and checks the SMS code in the browser and gives us
// a signed ID token; the server only trusts that token. When Firebase isn't configured (local development) a
// simulator prints the code in the server console instead, and it is switched off in production.

export const firebaseServerConfigured = () => Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
export const devSimulatorEnabled = () => !firebaseServerConfigured() && process.env.NODE_ENV !== "production";

/** 10-digit Indian mobile from "+919876543210", "9876543210" etc., or null. */
export function toLocalPhone(input: string): string | null {
  const digits = String(input || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

/** Verifies a Firebase ID token and returns the phone number it was issued for. */
export async function phoneFromFirebaseToken(idToken: string): Promise<string> {
  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  const decoded = await getAuth(app).verifyIdToken(idToken, true);
  const phone = toLocalPhone(decoded.phone_number || "");
  if (!phone) throw new Error("This sign-in isn't for an Indian mobile number.");
  return phone;
}

// ---- development simulator (no Firebase keys) ----
interface Pending { hash: string; expires: number; attempts: number; sentAt: number }
const g = globalThis as unknown as { __phoneCodes?: Map<string, Pending> };
const codes = (g.__phoneCodes ||= new Map());
const hash = (phone: string, code: string) => crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");

export function devSendCode(phone: string): { ok: true; code: string } | { ok: false; error: string } {
  const cur = codes.get(phone);
  if (cur && Date.now() - cur.sentAt < 20_000) return { ok: false, error: "Please wait a few seconds before asking for another code." };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  codes.set(phone, { hash: hash(phone, code), expires: Date.now() + 10 * 60_000, attempts: 0, sentAt: Date.now() });
  console.log(`\n[DEV] Firebase isn't configured. Login code for +91${phone}: ${code}\n`);
  return { ok: true, code };
}

export function devCheckCode(phone: string, code: string): { ok: true } | { ok: false; error: string } {
  const p = codes.get(phone);
  if (!p || p.expires < Date.now()) return { ok: false, error: "That code has expired. Ask for a new one." };
  if (p.attempts >= 5) return { ok: false, error: "Too many wrong attempts. Ask for a new code." };
  p.attempts += 1;
  if (hash(phone, code) !== p.hash) return { ok: false, error: "That code isn't right." };
  return { ok: true };
}
export const devConsumeCode = (phone: string) => codes.delete(phone);
