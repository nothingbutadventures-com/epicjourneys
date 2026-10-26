import SpecialDiscount from "@/models/SpecialDiscount";
import TravelStyle from "@/models/TravelStyle";

// The business runs on Indian time: a campaign "from 1 Nov to 7 Nov" covers those whole days in IST.
const IST = "+05:30";
export const istDayStart = (day: string) => new Date(`${day}T00:00:00.000${IST}`);
export const istDayEnd = (day: string) => new Date(`${day}T23:59:59.999${IST}`);
export const toIstDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export const validDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(istDayStart(s).getTime());

export type CampaignStatus = "off" | "scheduled" | "live" | "ended";
export function campaignStatus(c: { isActive: boolean; startDate: Date | string; endDate: Date | string }, now = new Date()): CampaignStatus {
  if (!c.isActive) return "off";
  if (new Date(c.endDate) < now) return "ended";
  if (new Date(c.startDate) > now) return "scheduled";
  return "live";
}

export interface LiveSpecial {
  id: string;
  name: string;
  travelStyle: string;
  percentage: number;
  endsAt: string;
}

/** Offers that are on and inside their dates right now, keyed by travel style. */
export async function loadLiveSpecials(now = new Date()): Promise<Map<string, LiveSpecial>> {
  const list: any[] = await SpecialDiscount.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).lean();
  const map = new Map<string, LiveSpecial>();
  for (const c of list) {
    const cur = map.get(c.travelStyle);
    if (!cur || c.percentage > cur.percentage) map.set(c.travelStyle, { id: String(c._id), name: c.name, travelStyle: c.travelStyle, percentage: c.percentage, endsAt: new Date(c.endDate).toISOString() });
  }
  return map;
}

/** The best live offer across a tour's travel styles (offers never stack). */
export function specialForTour(tour: { travelStyles?: string[] }, live: Map<string, LiveSpecial>): LiveSpecial | null {
  let best: LiveSpecial | null = null;
  for (const style of tour.travelStyles || []) {
    const s = live.get(style);
    if (s && (!best || s.percentage > best.percentage)) best = s;
  }
  return best;
}

/** The discount a customer actually gets on a date: a live offer wins over the date's own discount. */
export const effectiveDiscount = (departureDiscount: number | undefined, special: LiveSpecial | null) => (special ? special.percentage : departureDiscount || 0);

export async function liveSpecialForTour(tour: { travelStyles?: string[] }, now = new Date()) {
  return specialForTour(tour, await loadLiveSpecials(now));
}

/** Validates the form body and returns clean fields, or an error message. */
export async function cleanCampaign(body: any, excludeId?: string) {
  const travelStyle = String(body.travelStyle ?? "").trim();
  const percentage = Number(body.percentage);
  const name = String(body.name ?? "").trim().slice(0, 80);
  if (!travelStyle || !(await TravelStyle.exists({ name: travelStyle }))) return { error: "Choose one of your travel styles." };
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) return { error: "Enter a discount between 1% and 100%." };
  if (!validDay(body.startDay) || !validDay(body.endDay)) return { error: "Choose a start and end date." };
  const startDate = istDayStart(body.startDay);
  const endDate = istDayEnd(body.endDay);
  if (endDate < startDate) return { error: "The end date can't be before the start date." };
  const isActive = body.isActive !== false;

  // Two live offers on one travel style would be ambiguous, so their dates may not overlap.
  if (isActive) {
    const clash: any = await SpecialDiscount.findOne({ travelStyle, isActive: true, startDate: { $lte: endDate }, endDate: { $gte: startDate }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean();
    if (clash) return { error: `${travelStyle} already has an offer from ${toIstDay(clash.startDate)} to ${toIstDay(clash.endDate)}. Change those dates or switch that offer off first.`, status: 409 };
  }
  return { data: { name, travelStyle, percentage, startDate, endDate, isActive } };
}

