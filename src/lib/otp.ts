import crypto from "crypto";
import nodemailer from "nodemailer";

const SECRET = process.env.JWT_SECRET || "epicjourneys_jwt_secret_token_key_secured_2026";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, otp: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${email}:${otp}`).digest("hex");
}

export function otpMatches(email: string, otp: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtp(email, otp));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function normalizePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured");
    }
    console.log(`\n[DEV] Gmail not configured. Verification OTP for ${to}: ${otp}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s/g, "") },
  });

  await transporter.sendMail({
    from: `"EpicJourneys" <${GMAIL_USER}>`,
    to,
    subject: `${otp} is your EpicJourneys verification code`,
    text: `Hi ${name},\n\nYour EpicJourneys verification code is ${otp}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
      <h2 style="margin:0 0 12px;color:#0f172a">Verify your email</h2>
      <p style="color:#475569">Hi ${name.replace(/[<>&"]/g, "")}, use this code to finish creating your EpicJourneys account:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:800;background:#f1f5f9;border-radius:10px;padding:16px;text-align:center;color:#0f172a">${otp}</div>
      <p style="color:#64748b;font-size:13px">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
    </div>`,
  });
}
