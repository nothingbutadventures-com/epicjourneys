import { button, esc, layout, send, siteUrl } from "@/lib/partner-mail";

const FOOTER = "You received this email because you applied for a role at EpicJourneys.";
const first = (name: string) => esc(String(name || "").split(" ")[0] || "there");
const note = (m?: string) =>
  m && m.trim()
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px"><tr><td style="background:#FFF6E5;border:1px solid #FFD699;border-left:4px solid #FF9900;padding:14px 16px;color:#0f172a;font-size:14px;white-space:pre-line">${esc(m.trim())}</td></tr></table>`
    : "";

export const adminInbox = () => process.env.CAREERS_EMAIL || process.env.GMAIL_USER || "";

export async function sendApplicationReceived(a: { to: string; name: string; jobTitle: string; general: boolean }) {
  const html = layout({
    preheader: `We've received your application${a.general ? "" : ` for ${a.jobTitle}`}.`,
    badge: "Application received",
    title: "Thanks for applying" + (a.general ? "" : " for"),
    highlight: a.general ? "to EpicJourneys" : a.jobTitle,
    footer: FOOTER,
    body: `<p style="margin:0 0 16px">Hi ${first(a.name)}, thank you for your interest in joining EpicJourneys. We've received your application and our team will review it carefully.</p>
<p style="margin:0 0 6px;font-weight:800;color:#0f172a">What happens next</p>
<ul style="margin:0 0 20px;padding-left:18px"><li>Our hiring team reviews every application, usually within 5–7 working days.</li><li>If your profile is a match, we'll reach out by email or phone to set up a conversation.</li><li>Either way, we'll let you know the outcome.</li></ul>
<p style="margin:0 0 24px">${button(`${siteUrl()}/careers`, "See other open roles")}</p>
<p style="margin:0">Good luck, and thank you for considering us!</p>`,
  });
  await send(a.to, `We received your application${a.general ? "" : ` for ${a.jobTitle}`}`, html, `Hi ${a.name}, we've received your application${a.general ? "" : ` for ${a.jobTitle}`}. We'll be in touch.`);
}

export async function sendNewApplicationAlert(a: { name: string; email: string; phone: string; jobTitle: string; experienceYears?: number; currentCompany?: string }) {
  const to = adminInbox();
  if (!to) return;
  const html = layout({
    preheader: `${a.name} applied for ${a.jobTitle}`,
    badge: "New application",
    title: "New applicant for",
    highlight: a.jobTitle,
    footer: "Careers notification for the EpicJourneys hiring team.",
    body: `<p style="margin:0 0 14px"><strong style="color:#0f172a">${esc(a.name)}</strong> just applied.</p>
<p style="margin:0 0 20px;font-size:14px">${esc(a.email)} · +91 ${esc(a.phone)}${a.experienceYears !== undefined ? ` · ${a.experienceYears} yrs experience` : ""}${a.currentCompany ? ` · ${esc(a.currentCompany)}` : ""}</p>
<p style="margin:0">${button(`${siteUrl()}/admin/career-applications`, "Review application")}</p>`,
  });
  await send(to, `New application: ${a.name} — ${a.jobTitle}`, html, `${a.name} applied for ${a.jobTitle}. Review: ${siteUrl()}/admin/career-applications`);
}

type Notify = "shortlisted" | "interview" | "offered" | "rejected";
export const NOTIFY_STATUSES: Notify[] = ["shortlisted", "interview", "offered", "rejected"];

export async function sendStatusEmail(a: { to: string; name: string; jobTitle: string; status: Notify; message?: string }) {
  const copy: Record<Notify, { badge: string; title: string; subject: string; body: string }> = {
    shortlisted: {
      badge: "Good news",
      title: "You're shortlisted for",
      subject: `You've been shortlisted — ${a.jobTitle}`,
      body: `<p style="margin:0 0 16px">Hi ${first(a.name)}, we enjoyed going through your profile and we'd like to move your application forward.</p><p style="margin:0 0 16px">A member of our team will contact you shortly with the next steps.</p>`,
    },
    interview: {
      badge: "Interview",
      title: "Let's talk about",
      subject: `Interview invitation — ${a.jobTitle}`,
      body: `<p style="margin:0 0 16px">Hi ${first(a.name)}, we'd love to speak with you about the ${esc(a.jobTitle)} role. Here are the details:</p>`,
    },
    offered: {
      badge: "Offer",
      title: "Congratulations! An offer for",
      subject: `Congratulations — offer for ${a.jobTitle}`,
      body: `<p style="margin:0 0 16px">Hi ${first(a.name)}, we're delighted to let you know that we'd like to offer you the ${esc(a.jobTitle)} position at EpicJourneys.</p>`,
    },
    rejected: {
      badge: "Application update",
      title: "Your application for",
      subject: `Update on your application — ${a.jobTitle}`,
      body: `<p style="margin:0 0 16px">Hi ${first(a.name)}, thank you for the time you put into applying for ${esc(a.jobTitle)} and for your interest in EpicJourneys.</p><p style="margin:0 0 16px">After careful consideration we've decided not to move forward with your application this time. This isn't a reflection of your abilities — we received many strong applications.</p><p style="margin:0 0 20px">We'd be glad to hear from you again when a role that fits opens up.</p>`,
    },
  };
  const c = copy[a.status];
  const html = layout({
    preheader: c.subject,
    badge: c.badge,
    title: c.title,
    highlight: a.status === "rejected" ? "EpicJourneys" : a.jobTitle,
    footer: FOOTER,
    body: `${c.body}${note(a.message)}<p style="margin:0 0 24px">${button(`${siteUrl()}/careers`, a.status === "rejected" ? "See open roles" : "Visit our careers page")}</p><p style="margin:0">Warm regards,<br/>The EpicJourneys Hiring Team</p>`,
  });
  await send(a.to, c.subject, html, `${c.subject}\n\nHi ${a.name},\n${a.message || ""}`);
}
