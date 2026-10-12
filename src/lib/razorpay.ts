import crypto from "crypto";

const keyId = () => process.env.RAZORPAY_KEY_ID?.trim() || "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET?.trim() || "";

/** When the keys are empty, checkout falls back to the on-screen payment simulator. */
export const razorpayConfigured = () => Boolean(keyId() && keySecret());
export const razorpayKeyId = keyId;

export async function createRazorpayOrder(opts: { amountInr: number; receipt: string; notes?: Record<string, string> }) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(opts.amountInr * 100), // paise
      currency: "INR",
      receipt: opts.receipt.slice(0, 40),
      notes: opts.notes || {},
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || "Could not create the Razorpay order");
  return data as { id: string; amount: number; currency: string };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
