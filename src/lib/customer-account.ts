import User from "@/models/User";
import { button, esc, layout, send, siteUrl } from "@/lib/partner-mail";

const fmt = (d: unknown) => new Date(d as any).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

/**
 * Finds or creates the customer's account for a booking a partner made. Customers sign in with their mobile
 * number (the primary traveller's), so the account is keyed by it: no password is created or emailed, and when
 * the customer first logs in with a code they land in this account with the booking already there.
 */
export async function ensureCustomerAccount(booking: any): Promise<{ userId: string }> {
  const phone = String(booking.customerPhone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("The primary traveller needs a valid mobile number.");
  const email = String(booking.customerEmail || "").toLowerCase().trim();

  const existing: any = await User.findOne({ phone, role: "user" }).sort({ createdAt: 1 });
  if (existing) {
    // Add the email if they had none and nobody else uses it.
    if (email && !existing.email && !(await User.exists({ email }))) await User.updateOne({ _id: existing._id }, { $set: { email, emailVerified: false } });
    return { userId: String(existing._id) };
  }
  const withEmail = email && !(await User.exists({ email }));
  const created = await User.create({ name: booking.customerName, phone, role: "user", ...(withEmail ? { email, emailVerified: false } : {}) });
  return { userId: String(created._id) };
}

/** Booking confirmation + login details for a customer whose booking was made by a partner. */
export async function sendCustomerBookingEmail(booking: any, opts: { partner?: { name?: string; phone?: string; email?: string } | null; ownAccount?: boolean; invoicePdf?: Buffer }) {
  const base = siteUrl();
  const loginUrl = `${base}/login`;
  const bookingUrl = `${base}/booking/${booking.bookingRef}`;
  const first = esc(String(booking.customerName || "").split(" ")[0]);
  const balance = Math.max(0, (booking.totalAmountInr || 0) - (booking.amountPaidInr || 0));
  const cell = (l: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;width:38%">${l}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${v}</td></tr>`;

  const phoneLine = booking.customerPhone ? `+91 ${esc(booking.customerPhone)}` : "your mobile number";
  const credentials = `<p style="margin:24px 0 10px;font-weight:800;color:#0f172a">Manage your booking</p>
<p style="margin:0 0 10px">${opts.ownAccount ? "Log in to your EpicJourneys account" : "We've set up an EpicJourneys account for you"} to see this booking, pay any balance and download your invoice. There's no password: just log in with your mobile number and we'll text you a one-time code.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF6E5;border:1px solid #FFD699;margin:0 0 20px"><tr><td style="padding:14px 20px">
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Log in with</div>
  <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;letter-spacing:.02em">${phoneLine}</div>
</td></tr></table>`;

  const travellers = (booking.travellers || [])
    .map((t: any, i: number) => `<tr><td style="padding:8px 12px;border:1px solid #E2E2E2;font-size:13px;color:#0f172a"><strong>${esc(t.firstName)} ${esc(t.lastName)}</strong>${i === 0 ? ' <span style="color:#8A5200;font-size:11px">· Primary</span>' : ""}<br/><span style="color:#64748b;font-size:12px">+91 ${esc(t.phone)} · Age ${esc(t.age)} · ${t.roomType === "single" ? "Single room" : "Shared room"}</span></td></tr>`)
    .join("");

  const schedule = (booking.installments || [])
    .map((i: any) => `<tr><td style="padding:6px 0;font-size:13px;color:#475569">${esc(i.label)} <span style="color:#94a3b8">· ${i.status === "paid" ? "Paid" : `Due ${fmt(i.dueDate)}`}</span></td><td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:${i.status === "paid" ? "#059669" : "#0f172a"}">${inr(i.amountInr)}</td></tr>`)
    .join("");

  const html = layout({
    preheader: `Your booking ${booking.bookingRef} is confirmed.`,
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
<p style="margin:0 0 24px">${button(loginUrl, "Log in & view booking")} &nbsp; <a href="${bookingUrl}/invoice" style="display:inline-block;border:2px solid #0f172a;color:#0f172a;font-weight:800;text-decoration:none;padding:11px 24px;font-size:15px">View invoice</a></p>${opts.invoicePdf ? '<p style="margin:0 0 20px;font-size:12px;color:#94a3b8">Your invoice is attached to this email as a PDF.</p>' : ""}
${opts.partner?.name ? `<p style="margin:0 0 6px;font-weight:800;color:#0f172a">Your local contact</p><p style="margin:0 0 16px">${esc(opts.partner.name)}${opts.partner.phone ? ` · +91 ${esc(opts.partner.phone)}` : ""}${opts.partner.email ? ` · ${esc(opts.partner.email)}` : ""}</p>` : ""}
<p style="margin:0">Pack your bags — we can't wait to see you on the road!</p>`,
  });

  const text = `Hi ${booking.customerName}, your booking ${booking.bookingRef} for ${booking.tourTitle} (${fmt(booking.travelDate)}) is confirmed.\nTotal ${inr(booking.totalAmountInr)}, paid ${inr(booking.amountPaidInr)}.\n\nLog in with your mobile number (${booking.customerPhone || ""}) at ${loginUrl} to see your booking: ${bookingUrl}\n`;
  await send(booking.customerEmail, `Booking confirmed: ${booking.tourTitle} (${booking.bookingRef})`, html, text, opts.invoicePdf ? [{ filename: `INV-${String(booking.bookingRef).replace(/^EJ-/, "")}.pdf`, content: opts.invoicePdf, contentType: "application/pdf" }] : undefined);
}
