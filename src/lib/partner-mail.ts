import nodemailer from "nodemailer";
import PartnerRequest from "@/models/PartnerRequest";
import Destination from "@/models/Destination";
import { rebindLocationPartner } from "@/lib/location-access";

export const esc = (v: unknown) => String(v ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function siteUrl() {
  const raw = (process.env.NEXT_PUBLIC_APP_DOMAIN || "").trim().replace(/\/$/, "");
  if (!raw) return "http://localhost:3001";
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
}

export async function send(to: string, subject: string, html: string, text: string, attachments?: { filename: string; content: Buffer; contentType?: string }[]) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log(`\n[DEV] Gmail not configured. Email to ${to}: ${subject}\n`);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s/g, "") },
  });
  await transporter.sendMail({ from: `"EpicJourneys" <${GMAIL_USER}>`, to, subject, html, text, attachments });
}

/** Branded shell that matches the website: cream hero band, orange accent, dark slate text. */
export function layout(opts: { preheader: string; badge: string; title: string; highlight: string; body: string; footer?: string }) {
  const base = siteUrl();
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #E2E2E2">
  <tr><td style="background:#0f172a;padding:18px 28px"><a href="${base}" style="text-decoration:none;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Epic<span style="color:#FF9900">Journeys</span></a></td></tr>
  <tr><td style="background:#FFF3DB;border-bottom:1px solid #FFD699;padding:32px 28px">
    <div style="display:inline-block;background:#FF9900;color:#0f172a;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px">${esc(opts.badge)}</div>
    <h1 style="margin:14px 0 0;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-0.03em;color:#0f172a">${opts.title} <span style="background:#FF9900;padding:0 6px">${esc(opts.highlight)}</span></h1>
  </td></tr>
  <tr><td style="padding:28px;font-size:15px;line-height:1.65;color:#475569">${opts.body}</td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #E2E2E2;padding:18px 28px;font-size:12px;color:#94a3b8">
    ${opts.footer || "You received this email because you applied to become an EpicJourneys partner."}<br/>© ${new Date().getFullYear()} EpicJourneys · <a href="${base}" style="color:#94a3b8">${base.replace(/^https?:\/\//, "")}</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#FF9900;color:#0f172a;font-weight:800;text-decoration:none;padding:13px 28px;font-size:15px">${esc(label)}</a>`;

export async function sendApprovalEmail(p: { to: string; name: string; location: string; password?: string }) {
  const login = `${siteUrl()}/partner/login`;
  const first = esc(p.name.split(" ")[0]);
  const html = layout({
    preheader: `You're now the EpicJourneys partner for ${p.location}.`,
    badge: "Application approved",
    title: "Congratulations! You're our partner in",
    highlight: p.location,
    body: `<p style="margin:0 0 16px">Hi ${first}, great news — after reviewing your application, we're thrilled to welcome you as the official EpicJourneys partner for <strong style="color:#0f172a">${esc(p.location)}</strong>.</p>
<p style="margin:0 0 12px">Here are your partner portal login details:</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF6E5;border:1px solid #FFD699;margin:0 0 20px"><tr><td style="padding:18px 20px">
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Email</div>
  <div style="font-size:16px;font-weight:700;color:#0f172a;margin:2px 0 14px">${esc(p.to)}</div>
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Password</div>
  ${p.password ? `<div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;font-family:Consolas,Menlo,monospace;letter-spacing:.04em">${esc(p.password)}</div>` : `<div style="font-size:15px;color:#0f172a;margin-top:2px">Use your existing password</div>`}
</td></tr></table>
<p style="margin:0 0 24px">${button(login, "Log in to partner portal")}</p>
<p style="margin:0 0 6px;font-weight:800;color:#0f172a">What happens next</p>
<ul style="margin:0 0 16px;padding-left:18px"><li>Log in and review the tours and bookings for ${esc(p.location)}.</li><li>Be the local contact for travellers on departure days.</li><li>Keep your password safe and don't share it with anyone.</li></ul>
<p style="margin:0">Welcome aboard — we're excited to build epic journeys together!</p>`,
  });
  const text = `Congratulations ${p.name}! You're now the EpicJourneys partner for ${p.location}.\n\nLogin: ${login}\nEmail: ${p.to}\nPassword: ${p.password || "your existing password"}\n\nKeep your password safe.`;
  await send(p.to, `Congratulations! You're our partner for ${p.location}`, html, text);
}

export async function sendRejectionEmail(p: { to: string; name: string; location: string; open: { name: string; state: string }[] }) {
  const apply = `${siteUrl()}/become-a-partner`;
  const first = esc(p.name.split(" ")[0]);
  const list = p.open.length
    ? `<p style="margin:0 0 10px;font-weight:800;color:#0f172a">Locations still open for partners</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px">${p.open
        .slice(0, 12)
        .map((o) => `<tr><td style="padding:10px 14px;border:1px solid #E2E2E2;border-left:4px solid #FF9900"><strong style="color:#0f172a">${esc(o.name)}</strong> <span style="color:#94a3b8">· ${esc(o.state)}</span></td></tr><tr><td style="height:6px"></td></tr>`)
        .join("")}</table>
<p style="margin:0 0 24px">${button(apply, "Apply for another location")}</p>`
    : `<p style="margin:0 0 24px">No other locations are open right now, but new ones open regularly — keep an eye on our partner page.</p><p style="margin:0 0 24px">${button(apply, "View partner page")}</p>`;
  const html = layout({
    preheader: `An update on your application for ${p.location}.`,
    badge: "Application update",
    title: "Thank you for applying for",
    highlight: p.location,
    body: `<p style="margin:0 0 16px">Hi ${first}, thank you for your interest in becoming an EpicJourneys partner. We received several strong applications for <strong style="color:#0f172a">${esc(p.location)}</strong>, and we've decided to move ahead with another applicant for this location.</p>
<p style="margin:0 0 22px">This isn't a reflection of your abilities — we'd genuinely love to work with you in a different city.</p>${list}<p style="margin:0">Thank you again, and we hope to travel together soon.</p>`,
  });
  const text = `Hi ${p.name}, thank you for applying for ${p.location}. We've decided to move ahead with another applicant for this location. You're welcome to apply for another open location: ${apply}`;
  await send(p.to, `Update on your EpicJourneys partner application for ${p.location}`, html, text);
}

async function openLocations() {
  const d = await Destination.find({ openForPartner: true, isActive: true, partnerId: null }).select("name state").sort({ name: 1 }).lean();
  return d.map((x: any) => ({ name: x.name, state: x.state }));
}

/** A partner was assigned to a location: approve their request, reject every other applicant, and email everyone. */
export async function settleApplicants(opts: { destinationId: string; partnerId: string; email: string; name: string; password?: string; requestId?: string | null }) {
  try {
    const dest: any = await Destination.findById(opts.destinationId).select("name state");
    if (!dest) return;
    const location = `${dest.name}, ${dest.state}`;
    await Destination.findByIdAndUpdate(opts.destinationId, { openForPartner: false });
    // The new partner takes over the location's existing requests and launched departures.
    await rebindLocationPartner(opts.destinationId, opts.partnerId).catch((e) => console.error("rebind failed", e));

    const rx = (v: string) => new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const mine: any = {
      $or: [{ destinationId: opts.destinationId }, { city: rx(dest.name), state: rx(dest.state) }],
      status: "pending",
    };
    const pending = await PartnerRequest.find(mine);
    const winner = pending.find((r) => String(r._id) === opts.requestId || r.email === opts.email.toLowerCase());
    if (winner) await PartnerRequest.findByIdAndUpdate(winner._id, { status: "approved", partnerId: opts.partnerId, processedAt: new Date() });

    await sendApprovalEmail({ to: opts.email, name: opts.name, location, password: opts.password }).catch((e) => console.error("approval mail failed", e));

    const losers = pending.filter((r) => !winner || String(r._id) !== String(winner._id));
    if (!losers.length) return;
    const open = await openLocations();
    for (const r of losers) {
      await PartnerRequest.findByIdAndUpdate(r._id, { status: "rejected", processedAt: new Date() });
      await sendRejectionEmail({ to: r.email, name: r.name, location, open }).catch((e) => console.error("rejection mail failed", e));
    }
  } catch (e) {
    console.error("settleApplicants failed", e);
  }
}
