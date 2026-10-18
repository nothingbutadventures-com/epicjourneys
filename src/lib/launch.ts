import mongoose from "mongoose";
import Tour from "@/models/Tour";
import TourLaunch from "@/models/TourLaunch";
import { bookedSeatsByDeparture } from "@/lib/departures";
import Destination from "@/models/Destination";
import { endDateFor, type DayInput } from "@/lib/launch-shared";

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const ymd = (v: unknown) => String(v ?? "").slice(0, 10);

export function sanitizeDays(input: unknown, label: string): { data?: DayInput[]; error?: string } {
  if (input === undefined || input === null) return { data: [] };
  if (!Array.isArray(input)) return { error: `${label} must be a list` };
  if (input.length > 10) return { error: `${label}: at most 10 days` };
  const out: DayInput[] = [];
  for (const [i, d] of (input as any[]).entries()) {
    const title = text(d.title, 120);
    const description = text(d.description, 2000);
    if (!title && !description) continue; // ignore empty rows
    if (!title) return { error: `${label} day ${i + 1}: enter a title` };
    const seen = new Set<string>();
    const destinations = (Array.isArray(d.destinations) ? d.destinations : [])
      .filter((x: any) => x?.destinationId && mongoose.isValidObjectId(x.destinationId) && !seen.has(String(x.destinationId)) && seen.add(String(x.destinationId)))
      .slice(0, 8)
      .map((x: any) => ({ destinationId: String(x.destinationId), name: text(x.name, 120) }));
    out.push({ title, description, meals: text(d.meals, 120), stay: text(d.stay, 160), destinations });
  }
  return { data: out };
}

export interface LaunchPatch {
  dates?: { startDate: Date; endDate: Date; seats: number; discountPercentage: number }[];
  startItinerary?: DayInput[];
  endItinerary?: DayInput[];
  addressId?: string | null;
  partnerNotes?: string;
  extraPriceInr?: number | null;
}

/**
 * Validates the editable launch fields. End dates are always derived from the tour's
 * itinerary length plus the start/end days, so nobody types them in.
 */
export function sanitizeLaunchPatch(
  body: any,
  ctx: { tour: any; city: any; current?: { startItinerary: DayInput[]; endItinerary: DayInput[] } },
  opts: { allowPastDates?: boolean; admin?: boolean } = {}
): { data?: LaunchPatch; error?: string } {
  const out: LaunchPatch = {};

  if (body.startItinerary !== undefined) {
    const r = sanitizeDays(body.startItinerary, "Start itinerary");
    if (r.error) return { error: r.error };
    out.startItinerary = r.data;
  }
  if (body.endItinerary !== undefined) {
    const r = sanitizeDays(body.endItinerary, "End itinerary");
    if (r.error) return { error: r.error };
    out.endItinerary = r.data;
  }
  if (body.partnerNotes !== undefined) out.partnerNotes = text(body.partnerNotes, 2000);

  if (body.addressId !== undefined) {
    if (!body.addressId) out.addressId = null;
    else {
      const ok = (ctx.city?.addresses || []).some((a: any) => String(a._id) === String(body.addressId));
      if (!ok) return { error: "The selected starting address doesn't belong to that city." };
      out.addressId = String(body.addressId);
    }
  }

  if (opts.admin && body.extraPriceInr !== undefined) {
    if (body.extraPriceInr === null || body.extraPriceInr === "") out.extraPriceInr = null;
    else {
      const n = Number(body.extraPriceInr);
      if (!(n >= 0) || n > 1000000) return { error: "Enter a valid extra price (0 or more)." };
      out.extraPriceInr = Math.round(n);
    }
  }

  if (body.dates !== undefined) {
    if (!Array.isArray(body.dates)) return { error: "Dates must be a list" };
    const startDays = (out.startItinerary ?? ctx.current?.startItinerary ?? []).length;
    const endDays = (out.endItinerary ?? ctx.current?.endItinerary ?? []).length;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const seen = new Set<string>();
    const dates: NonNullable<LaunchPatch["dates"]> = [];
    for (const [i, d] of (body.dates as any[]).entries()) {
      const n = i + 1;
      const start = ymd(d.startDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || isNaN(new Date(`${start}T00:00:00Z`).getTime())) return { error: `Date ${n}: enter a valid start date` };
      if (!opts.allowPastDates && new Date(`${start}T00:00:00Z`) < today) return { error: `Date ${n}: start date can't be in the past` };
      if (seen.has(start)) return { error: `Date ${n}: duplicate start date` };
      seen.add(start);
      const seats = Math.floor(Number(d.seats));
      if (!(seats >= 1 && seats <= 500)) return { error: `Date ${n}: travellers must be between 1 and 500` };
      const discount = Number(d.discountPercentage) || 0;
      if (discount < 0 || discount > 100) return { error: `Date ${n}: discount must be between 0 and 100` };
      dates.push({
        startDate: new Date(`${start}T00:00:00.000Z`),
        endDate: new Date(`${endDateFor(start, ctx.tour.durationDays, startDays, endDays)}T00:00:00.000Z`),
        seats,
        discountPercentage: opts.admin ? discount : 0,
      });
    }
    dates.sort((a, b) => +a.startDate - +b.startDate);
    out.dates = dates;
  } else if (out.startItinerary !== undefined || out.endItinerary !== undefined) {
    // Itinerary length changed without new dates: recompute end dates from the stored start dates.
    out.dates = undefined;
  }
  return { data: out };
}

/** Recomputes every stored end date after the start/end itinerary changed. */
export function refreshEndDates(launch: any, tour: any) {
  const s = launch.startItinerary?.length || 0;
  const e = launch.endItinerary?.length || 0;
  for (const d of launch.dates) {
    d.endDate = new Date(`${endDateFor(new Date(d.startDate).toISOString().slice(0, 10), tour.durationDays, s, e)}T00:00:00.000Z`);
  }
}

export function addMessage(launch: any, by: "partner" | "admin" | "system", name: string, kind: string, textValue = "") {
  launch.messages.push({ by, name, kind, text: textValue.slice(0, 6000), at: new Date() });
}

/** Keep the tour's headline price in step with its live dates. */
export function refreshTourDerived(tour: any) {
  const deps = tour.departures || [];
  if (deps.length) {
    tour.priceInr = Math.min(...deps.map((d: any) => d.price));
    tour.discountPercentage = Math.max(0, ...deps.map((d: any) => d.discountPercentage || 0));
  } else {
    tour.priceInr = tour.basePriceInr || tour.priceInr || 0;
    tour.discountPercentage = 0;
  }
}

/** Turns an approved launch into live Tour departures (one per date). */
export async function publishLaunch(launch: any): Promise<{ error?: string }> {
  const tour: any = await Tour.findById(launch.tourId);
  if (!tour) return { error: "The tour no longer exists." };
  if (launch.extraPriceInr === null || launch.extraPriceInr === undefined) return { error: "Set the extra price for this city before approving." };
  if (!launch.dates.length) return { error: "Add at least one date." };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const d of launch.dates) {
    if (new Date(d.startDate) < today) return { error: "A start date is already in the past. Update the dates first." };
    const clash = (tour.departures || []).some(
      (x: any) => String(x.cityId) === String(launch.cityId) && new Date(x.startDate).getTime() === new Date(d.startDate).getTime()
    );
    if (clash) return { error: `This tour already has a departure from that city on ${new Date(d.startDate).toISOString().slice(0, 10)}.` };
  }

  // Older tours were priced by their dates; adopt their current price as the base the first time.
  if (!(tour.basePriceInr > 0) && tour.priceInr > 0) tour.basePriceInr = tour.priceInr;
  const price = (tour.basePriceInr || 0) + launch.extraPriceInr;
  if (!(tour.basePriceInr > 0)) return { error: "The tour's base price is 0 — set a base price on the tour first." };

  const before = (tour.departures || []).length;
  for (const d of launch.dates) {
    tour.departures.push({
      cityId: launch.cityId,
      addressId: launch.addressId || null,
      startDate: d.startDate,
      endDate: d.endDate,
      seats: d.seats,
      price,
      extraPriceInr: launch.extraPriceInr,
      discountPercentage: d.discountPercentage || 0,
      startItinerary: launch.startItinerary,
      endItinerary: launch.endItinerary,
      launchId: launch._id,
      partnerId: launch.partnerId || null,
    });
  }
  refreshTourDerived(tour);
  await tour.save();
  launch.departureIds = tour.departures.slice(before).map((x: any) => x._id);
  return {};
}

/** Removes a launch's live dates (only when nothing is booked on them). */
export async function unpublishLaunch(launch: any): Promise<{ error?: string }> {
  const tour: any = await Tour.findById(launch.tourId);
  if (!tour) return {};
  const ids = new Set((launch.departureIds || []).map(String));
  const booked = await bookedSeatsByDeparture(tour._id);
  for (const id of ids) {
    if ((booked[id as string] || 0) > 0) return { error: "Some of these dates already have bookings, so they can't be taken offline." };
  }
  tour.departures = tour.departures.filter((d: any) => !ids.has(String(d._id)));
  refreshTourDerived(tour);
  await tour.save();
  launch.departureIds = [];
  return {};
}

export const isObjectId = (v: unknown) => mongoose.isValidObjectId(v);
export { TourLaunch };


const DAY_MS = 24 * 60 * 60 * 1000;
const isBase = (d: any) => !d.launchId;

/**
 * Applies the admin's basic-tour setup: start/end location plus its own dates (no partner).
 * Dates created through partner launches are never touched here.
 */
export async function applyBaseDepartures(
  tour: any,
  input: { baseStartCityId?: string | null; baseAddressId?: string | null; baseDepartures?: any[] }
): Promise<{ error?: string }> {
  if (input.baseStartCityId !== undefined) {
    if (!input.baseStartCityId) {
      tour.baseStartCityId = null;
      tour.baseAddressId = null;
    } else {
      const city: any = await Destination.findById(input.baseStartCityId).select("addresses").lean();
      if (!city) return { error: "The tour's start & end location wasn't found." };
      tour.baseStartCityId = input.baseStartCityId;
      if (input.baseAddressId !== undefined) {
        if (input.baseAddressId && !(city.addresses || []).some((a: any) => String(a._id) === String(input.baseAddressId))) {
          return { error: "The selected starting address doesn't belong to that location." };
        }
        tour.baseAddressId = input.baseAddressId || null;
      }
    }
  }

  if (input.baseDepartures === undefined) return {};
  if (!Array.isArray(input.baseDepartures)) return { error: "Dates must be a list" };
  const cityId = tour.baseStartCityId || tour.destinationId;
  if (input.baseDepartures.length && !cityId) return { error: "Choose the tour's start & end location first." };

  const booked = await bookedSeatsByDeparture(tour._id);
  const existing = (tour.departures || []).filter(isBase);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const seen = new Set<string>();
  const next: any[] = [];

  for (const [i, d] of input.baseDepartures.entries()) {
    const n = i + 1;
    const start = ymd(d.startDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || isNaN(new Date(`${start}T00:00:00Z`).getTime())) return { error: `Date ${n}: enter a valid start date` };
    if (seen.has(start)) return { error: `Date ${n}: duplicate start date` };
    seen.add(start);
    const seats = Math.floor(Number(d.seats));
    if (!(seats >= 1 && seats <= 500)) return { error: `Date ${n}: travellers must be between 1 and 500` };
    // Basic-tour dates always sell at the tour's base price; only the discount varies per date.
    const price = Math.round(tour.basePriceInr || 0);
    if (!(price > 0)) return { error: "Set the tour's base price first." };
    const discount = Number(d.discountPercentage) || 0;
    if (discount < 0 || discount > 100) return { error: `Date ${n}: discount must be between 0 and 100` };

    const prev = d._id ? existing.find((x: any) => String(x._id) === String(d._id)) : null;
    if (!prev && new Date(`${start}T00:00:00Z`) < today) return { error: `Date ${n}: start date can't be in the past` };
    if (prev && seats < (booked[String(prev._id)] || 0)) {
      return { error: `Date ${n}: already has ${booked[String(prev._id)]} travellers booked, so seats can't go below that.` };
    }
    const startDate = new Date(`${start}T00:00:00.000Z`);
    next.push({
      ...(prev ? { _id: prev._id } : {}),
      cityId,
      addressId: tour.baseAddressId || null,
      startDate,
      endDate: new Date(startDate.getTime() + (Math.max(1, tour.durationDays || 1) - 1) * DAY_MS),
      seats,
      price,
      extraPriceInr: null,
      discountPercentage: discount,
      startItinerary: [],
      endItinerary: [],
      launchId: null,
      partnerId: null,
    });
  }

  // A basic date that has bookings can't be dropped.
  const keep = new Set(next.filter((x) => x._id).map((x) => String(x._id)));
  for (const old of existing) {
    if (!keep.has(String(old._id)) && (booked[String(old._id)] || 0) > 0) {
      return { error: "A date that already has bookings can't be removed." };
    }
  }

  tour.departures = [...(tour.departures || []).filter((d: any) => !isBase(d)), ...next];
  refreshTourDerived(tour);
  return {};
}

/** Normalises each day's ordered cities (and upgrades the old single-city field). */
export function cleanItinerary(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.map((d: any, i: number) => {
    const raw: any[] = Array.isArray(d?.destinations) && d.destinations.length
      ? d.destinations
      : d?.destinationId ? [{ destinationId: d.destinationId, name: d.destinationName }] : [];
    const seen = new Set<string>();
    const destinations = raw
      .filter((x) => x?.destinationId && mongoose.isValidObjectId(x.destinationId) && !seen.has(String(x.destinationId)) && seen.add(String(x.destinationId)))
      .slice(0, 8)
      .map((x) => ({ destinationId: x.destinationId, name: String(x.name || "").slice(0, 120) }));
    return { ...d, day: Number(d?.day) || i + 1, destinations, destinationId: null, destinationName: "" };
  });
}


/** Partner notes for extra days: a short list of plain text ideas. */
export function sanitizeNotes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((n) => text(n, 1000)).filter(Boolean).slice(0, 10);
}

/** One readable message (start and end together, numbered) for the admin's thread. */
export function composePartnerMessage(startNotes: string[], endNotes: string[], notes: string) {
  const parts: string[] = [];
  if (startNotes.length) parts.push(`Before the tour (${startNotes.length} day${startNotes.length === 1 ? "" : "s"}):\n${startNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}`);
  if (endNotes.length) parts.push(`After the tour (${endNotes.length} day${endNotes.length === 1 ? "" : "s"}):\n${endNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}`);
  if (notes) parts.push(`Notes:\n${notes}`);
  return parts.join("\n\n");
}
