import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Invoice } from "@/lib/invoice";

const ORANGE = rgb(1, 0.6, 0);
const DARK = rgb(0.059, 0.09, 0.165);
const MUTED = rgb(0.4, 0.45, 0.53);
const LINE = rgb(0.886, 0.886, 0.886);
const CREAM = rgb(1, 0.953, 0.859);

let logoPng: Buffer | null = null;
async function logo() {
  if (!logoPng) logoPng = await sharp(fs.readFileSync(path.join(process.cwd(), "public", "logo.svg")), { density: 300 }).resize({ height: 160 }).png().toBuffer();
  return logoPng;
}

// Standard PDF fonts only cover Latin-1, so anything outside it is replaced.
const clean = (s: unknown) => String(s ?? "").replace(/₹/g, "Rs. ").replace(/[^\x20-\x7E -ÿ–—‘’“”•]/g, "?");
const rs = (n: number) => `${n < 0 ? "- " : ""}Rs. ${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
const date = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-");

export async function generateInvoicePdf(inv: Invoice): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595, H = 842, M = 40;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H;

  const text = (s: string, x: number, yy: number, o: { size?: number; font?: PDFFont; color?: any; right?: boolean; max?: number } = {}) => {
    const font = o.font || regular, size = o.size || 10;
    let t = clean(s);
    if (o.max) while (t.length > 3 && font.widthOfTextAtSize(t, size) > o.max) t = t.slice(0, -2);
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: o.right ? x - w : x, y: yy, size, font, color: o.color || DARK });
  };
  const rule = (yy: number) => page.drawLine({ start: { x: M, y: yy }, end: { x: W - M, y: yy }, thickness: 0.7, color: LINE });
  const ensure = (need: number) => {
    if (y - need < 70) {
      page = doc.addPage([W, H]);
      y = H - 50;
    }
  };

  // Header band with the company logo
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: CREAM });
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 4, color: ORANGE });
  const img = await doc.embedPng(await logo());
  const lh = 52, lw = (img.width / img.height) * lh;
  page.drawImage(img, { x: M, y: H - 74, width: lw, height: lh });
  text("INVOICE", W - M, H - 44, { size: 24, font: bold, right: true });
  text(inv.number, W - M, H - 62, { size: 10, color: MUTED, right: true });
  text(`Issued ${date(inv.issuedAt)}`, W - M, H - 76, { size: 9, color: MUTED, right: true });
  y = H - 128;

  // Status pill
  const st = { paid: ["PAID", rgb(0.02, 0.59, 0.41)], partial: ["PARTLY PAID", rgb(0.85, 0.47, 0.02)], pending: ["PAYMENT PENDING", rgb(0.85, 0.47, 0.02)], cancelled: ["CANCELLED", rgb(0.86, 0.15, 0.15)] }[inv.status] as [string, any];
  const sw = bold.widthOfTextAtSize(st[0], 9) + 18;
  page.drawRectangle({ x: W - M - sw, y: y - 6, width: sw, height: 20, color: st[1] });
  text(st[0], W - M - sw + 9, y, { size: 9, font: bold, color: rgb(1, 1, 1) });

  // Billed to / trip
  text("BILLED TO", M, y + 6, { size: 8, font: bold, color: MUTED });
  text(inv.customer.name, M, y - 10, { size: 12, font: bold });
  text(inv.customer.email, M, y - 24, { size: 9, color: MUTED });
  text(`+91 ${inv.customer.phone}`, M, y - 36, { size: 9, color: MUTED });
  y -= 62;
  rule(y);
  y -= 22;

  text("TOUR", M, y, { size: 8, font: bold, color: MUTED });
  text(inv.tour.title, M, y - 15, { size: 12, font: bold, max: W - 2 * M });
  text(`${date(inv.tour.start)}${inv.tour.end ? " - " + date(inv.tour.end) : ""}${inv.tour.city ? "   |   Starts from " + inv.tour.city : ""}`, M, y - 30, { size: 9, color: MUTED });
  text(`Booking reference: ${inv.bookingRef}`, M, y - 43, { size: 9, color: MUTED });
  y -= 66;

  // Travellers
  text("TRAVELLERS", M, y, { size: 8, font: bold, color: MUTED });
  y -= 14;
  for (const [i, t] of inv.travellers.entries()) {
    ensure(18);
    text(`${i + 1}. ${t.name}`, M, y, { size: 10 });
    text(`${t.age ? "Age " + t.age : ""}${t.age && t.phone ? "  |  " : ""}${t.phone ? "+91 " + t.phone : ""}`, M + 250, y, { size: 9, color: MUTED });
    text(t.room, W - M, y, { size: 9, color: MUTED, right: true });
    y -= 16;
  }
  y -= 8;

  // Charges
  ensure(40 + inv.lines.length * 24);
  page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 22, color: DARK });
  text("DESCRIPTION", M + 10, y, { size: 8, font: bold, color: rgb(1, 1, 1) });
  text("AMOUNT", W - M - 10, y, { size: 8, font: bold, color: rgb(1, 1, 1), right: true });
  y -= 24;
  for (const l of inv.lines) {
    text(l.label, M + 10, y, { size: 10, font: bold });
    if (l.detail) text(l.detail, M + 10, y - 12, { size: 8.5, color: MUTED });
    text(rs(l.amount), W - M - 10, y, { size: 10, right: true, color: l.amount < 0 ? rgb(0.76, 0.25, 0.05) : DARK });
    y -= l.detail ? 28 : 18;
    rule(y + 8);
  }
  y -= 4;

  // Totals box
  const bx = W - M - 220;
  page.drawRectangle({ x: bx, y: y - 62, width: 220, height: 70, color: CREAM, borderColor: ORANGE, borderWidth: 1 });
  text("Total", bx + 12, y - 12, { size: 11, font: bold });
  text(rs(inv.total), W - M - 12, y - 12, { size: 11, font: bold, right: true });
  text("Paid", bx + 12, y - 30, { size: 10, color: MUTED });
  text(rs(inv.paid), W - M - 12, y - 30, { size: 10, right: true, color: rgb(0.02, 0.59, 0.41) });
  text("Balance due", bx + 12, y - 48, { size: 10, font: bold });
  text(rs(inv.balance), W - M - 12, y - 48, { size: 10, font: bold, right: true });
  y -= 92;

  // Payment schedule
  if (inv.payments.length) {
    ensure(30 + inv.payments.length * 18);
    text("PAYMENTS", M, y, { size: 8, font: bold, color: MUTED });
    y -= 15;
    for (const p of inv.payments) {
      text(p.label, M, y, { size: 10 });
      text(p.status === "paid" ? `Paid on ${date(p.date)}` : `Due ${date(p.due)}`, M + 250, y, { size: 9, color: p.status === "paid" ? rgb(0.02, 0.59, 0.41) : MUTED });
      text(rs(p.amount), W - M, y, { size: 10, right: true });
      y -= 17;
    }
    y -= 6;
  }
  if (inv.specialRequests) {
    ensure(40);
    text("SPECIAL REQUESTS", M, y, { size: 8, font: bold, color: MUTED });
    text(inv.specialRequests, M, y - 14, { size: 9, max: W - 2 * M });
    y -= 34;
  }
  if (inv.partner?.name) {
    ensure(36);
    text("BOOKED BY YOUR LOCAL PARTNER", M, y, { size: 8, font: bold, color: MUTED });
    text(`${inv.partner.name}${inv.partner.phone ? "  |  +91 " + inv.partner.phone : ""}${inv.partner.email ? "  |  " + inv.partner.email : ""}`, M, y - 14, { size: 9 });
  }

  // Footer on every page
  for (const p of doc.getPages()) {
    p.drawLine({ start: { x: M, y: 50 }, end: { x: W - M, y: 50 }, thickness: 0.7, color: LINE });
    p.drawText("EpicJourneys  |  epicjourneys.in", { x: M, y: 34, size: 8.5, font: bold, color: DARK });
    p.drawText("This is a computer-generated invoice and does not require a signature.", { x: M, y: 22, size: 8, font: regular, color: MUTED });
  }
  return Buffer.from(await doc.save());
}
