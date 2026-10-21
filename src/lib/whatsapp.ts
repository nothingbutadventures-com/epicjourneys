import crypto from "crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

/** Verify Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** WhatsApp sends digits only (country code included, e.g. 919876543210). */
export function toE164(waId: string): string {
  return `+${waId.replace(/\D/g, "")}`;
}

/** Regex matching the same number however it was typed (spaces, dashes, +91 or not). */
export function phoneRegex(waId: string): RegExp {
  const last10 = waId.replace(/\D/g, "").slice(-10).split("");
  return new RegExp(last10.join("\\D*") + "\\D*$");
}

/** Send a plain text reply (only works inside the 24h customer-service window). */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) console.error("WhatsApp send failed:", res.status, await res.text());
}
