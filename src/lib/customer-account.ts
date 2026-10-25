import crypto from "crypto";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { button, esc, layout, send, siteUrl } from "@/lib/partner-mail";

const fmt = (d: unknown) => new Date(d as any).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

/** Readable random password (no look-alike characters), e.g. "Kf7m-Tq3x-Pw9d". */
function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const pick = () => chars[crypto.randomInt(chars.length)];
  return Array.from({ length: 3 }, () => Array.from({ length: 4 }, pick).join("")).join("-");
}

/**
 * Finds or creates the customer's account for a booking a partner made.
 * A new account gets a random password (returned once so it can be emailed); an existing
 * verified account keeps its password. Staff accounts are never reused.
 */
export async function ensureCustomerAccount(booking: any): Promise<{ userId: string; password?: string }> {
  const email = String(booking.customerEmail).toLowerCase().trim();
  const existing: any = await User.findOne({ email });
  if (existing && existing.role !== "user") throw new Error("This email belongs to a staff account.");

  // Same mailbox owner gets the new credentials, so an unverified leftover account can be reclaimed.
  if (existing && existing.emailVerified !== false) return { userId: String(existing._id) };

  const password = randomPassword();
  const fields = {
    name: booking.customerName,
    phone: booking.customerPhone,
    password: await hashPassword(password),
    emailVerified: true,
  };
  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: fields, $unset: { otpHash: 1, otpExpires: 1 } });
    return { userId: String(existing._id), password };
  }
  const created = await User.create({ ...fields, email, role: "user" });
  return { userId: String(created._id), password };
}

/** Booking confirmation + login details for a customer whose booking was made by a partner. */
export async function sendCustomerBookingEmail(booking: any, opts: { password?: string; partner?: { name?: string; phone?: string; email?: string } | null; ownAccount?: boolean; invoicePdf?: Buffer }) {
  const base = siteUrl();
  const loginUrl = `${base}/login`;
  const bookingUrl = `${base}/booking/${booking.bookingRef}`;
  const first = esc(String(booking.customerName || "").split(" ")[0]);
  const balance = Math.max(0, (booking.totalAmountInr || 0) - (booking.amountPaidInr || 0));
  const cell = (l: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;width:38%">${l}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${v}</td></tr>`;

  const credentials = opts.ownAccount
    ? `<p style="margin:24px 0 10px;font-weight:800;color:#0f172a">Manage your booking</p><p style="margin:0 0 20px">Log in to your EpicJourneys account any time to see this booking, pay any balance and download your invoice.</p>`
    : opts.password
    ? `<p style="margin:24px 0 10px;font-weight:800;color:#0f172a">Your EpicJourneys account</p>
<p style="margin:0 0 10px">We created an account so you can view and manage this booking. Log in with:</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF6E5;border:1px solid #FFD699;margin:0 0 6px"><tr><td style="padding:18px 20px">
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Email</div>
  <div style="font-size:16px;font-weight:700;color:#0f172a;margin:2px 0 14px">${esc(booking.customerEmail)}</div>
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Password</div>
  <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;font-family:Consolas,Menlo,monospace;letter-spacing:.04em">${esc(opts.password)}</div>
</td></tr></table>
<p style="margin:0 0 20px;font-size:12px;color:#94a3b8">Please keep this safe and don't share it.</p>`
    : `<p style="margin:24px 0 10px;font-weight:800;color:#0f172a">View your booking</p>
<p style="margin:0 0 20px">This booking has been added to your existing EpicJourneys account (<strong style="color:#0f172a">${esc(booking.customerEmail)}</strong>). Log in with your usual password to see it.</p>`;

  const travellers = (booking.travellers || [])
    .map((t: any, i: number) => `<tr><td style="padding:8px 12px;border:1px solid #E2E2E2;font-size:13px;color:#0f172a"><strong>${esc(t.firstName)} ${esc(t.lastName)}</strong>${i === 0 ? ' <span style="color:#8A5200;font-size:11px">· Primary</span>' : ""}<br/><span style="color:#64748b;font-size:12px">+91 ${esc(t.phone)} · Age ${esc(t.age)} · ${t.roomType === "single" ? "Single room" : "Shared room"}</span></td></tr>`)
    .join("");

  const schedule = (booking.installments || [])
    .map((i: any) => `<tr><td style="padding:6px 0;font-size:13px;color:#475569">${esc(i.label)} <span style="color:#94a3b8">· ${i.status === "paid" ? "Paid" : `Due ${fmt(i.dueDate)}`}</span></td><td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:${i.status === "paid" ? "#059669" : "#0f172a"}">${inr(i.amountInr)}</td></tr>`)
    .join("");

  const html = layout({
    preheader: `Your booking ${booking.bookingRef} is confirmed${opts.password ? " — your login details are inside" : ""}.`,
    badge: "Booking confirmed",
    title: "You're going on",
    highlight: booking.tourTitle,
    footer: "You received this email because a booking was made for you on EpicJourneys.",
    body: `<p style="margin:0 0 18px">Hi ${first}, great news — your trip has been booked${opts.partner?.name ? ` by our local partner <strong style="color:#0f172a">${esc(opts.partner.name)}</strong>` : ""}. Here's everything you need.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #E2E2E2;border-bottom:1px solid #E2E2E2;margin:0 0 20px">
${cell("Booking reference", esc(booking.bookingRef))}
${cell("Tour", esc(booking.tourTitle))}
${cell("Dates", `${fmt(booking.travelDate)}${booking.travelEndDate ? ` – ${fmt(booking.travelEndDate)}` : ""}`)}
${booking.departureCity ? cell("Starts from", esc(booking.departureCity)) : ""}
${cell("Travellers", String(booking.numberOfTravelers))}
${booking.specialRequests ? cell("Special requests", esc(booking.specialRequests)) : ""}
</table>
<p style="margin:0 0 8px;font-weight:800;color:#0f172a">Travellers</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px">${travellers}</table>
<p style="margin:0 0 8px;font-weight:800;color:#0f172a">Payment</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 6px">${schedule}
  ${booking.partnerDiscountInr > 0 ? `<tr><td style="padding:6px 0;font-size:13px;color:#c2410c">${esc(booking.partnerDiscountName || "Partner discount")} applied</td><td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#c2410c">− ${inr(booking.partnerDiscountInr)}</td></tr>` : ""}
  <tr><td style="padding:10px 0 0;border-top:1px solid #E2E2E2;font-weight:800;color:#0f172a">Total</td><td align="right" style="padding:10px 0 0;border-top:1px solid #E2E2E2;font-weight:800;color:#0f172a">${inr(booking.totalAmountInr)}</td></tr>
</table>
<p style="margin:0 0 4px;font-size:13px;color:#475569">Paid so far: <strong style="color:#059669">${inr(booking.amountPaidInr)}</strong>${balance > 0 ? ` · Balance: <strong style="color:#0f172a">${inr(balance)}</strong>` : " · Fully paid"}</p>
${credentials}
<p style="margin:0 0 24px">${button(opts.password ? loginUrl : bookingUrl, opts.password ? "Log in & view booking" : "View my booking")} &nbsp; <a href="${bookingUrl}/invoice" style="display:inline-block;border:2px solid #0f172a;color:#0f172a;font-weight:800;text-decoration:none;padding:11px 24px;font-size:15px">View invoice</a></p>${opts.invoicePdf ? '<p style="margin:0 0 20px;font-size:12px;color:#94a3b8">Your invoice is attached to this email as a PDF.</p>' : ""}
${opts.partner?.name ? `<p style="margin:0 0 6px;font-weight:800;color:#0f172a">Your local contact</p><p style="margin:0 0 16px">${esc(opts.partner.name)}${opts.partner.phone ? ` · +91 ${esc(opts.partner.phone)}` : ""}${opts.partner.email ? ` · ${esc(opts.partner.email)}` : ""}</p>` : ""}
<p style="margin:0">Pack your bags — we can't wait to see you on the road!</p>`,
  });

  const text = `Hi ${booking.customerName}, your booking ${booking.bookingRef} for ${booking.tourTitle} (${fmt(booking.travelDate)}) is confirmed.\nTotal ${inr(booking.totalAmountInr)}, paid ${inr(booking.amountPaidInr)}.\n${opts.password ? `\nLogin: ${loginUrl}\nEmail: ${booking.customerEmail}\nPassword: ${opts.password}\n` : `\nView booking: ${bookingUrl}\n`}`;
  await send(booking.customerEmail, `Booking confirmed: ${booking.tourTitle} (${booking.bookingRef})`, html, text, opts.invoicePdf ? [{ filename: `INV-${String(booking.bookingRef).replace(/^EJ-/, "")}.pdf`, content: opts.invoicePdf, contentType: "application/pdf" }] : undefined);
}
