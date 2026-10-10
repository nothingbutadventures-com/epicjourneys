import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Destination from "@/models/Destination";

export interface DepartureInput {
  _id?: string;
  cityId: string;
  startDate: string;
  endDate: string;
  seats: number;
  price: number;
  discountPercentage?: number;
}

/**
 * Validates and normalises departures submitted by the admin form.
 * Each departure has its own start/end city, dates, seats, price and discount.
 */
export async function sanitizeDepartures(
  input: unknown
): Promise<{ data?: any[]; cities?: Map<string, any>; error?: string }> {
  if (input === undefined || input === null) return { data: [], cities: new Map() };
  if (!Array.isArray(input)) return { error: "Departures must be a list" };

  const cityIds = [...new Set((input as DepartureInput[]).map((d) => String(d.cityId || "")))].filter(Boolean);
  if (cityIds.some((id) => !mongoose.isValidObjectId(id))) return { error: "Invalid start/end city" };
  const cityDocs = await Destination.find({ _id: { $in: cityIds } }).lean();
  const cities = new Map<string, any>(cityDocs.map((c: any) => [String(c._id), c]));

  const out: any[] = [];
  for (const [i, d] of (input as DepartureInput[]).entries()) {
    const n = i + 1;
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    const seats = Math.floor(Number(d.seats));
    const price = Number(d.price);
    const discount = Number(d.discountPercentage) || 0;

    if (!d.cityId || !cities.has(String(d.cityId))) return { error: `Date ${n}: select a start & end city` };
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: `Date ${n}: start and end dates are required` };
    if (end < start) return { error: `Date ${n}: end date cannot be before start date` };
    if (!(seats >= 1)) return { error: `Date ${n}: number of travellers must be at least 1` };
    if (!(price > 0)) return { error: `Date ${n}: enter a valid price` };
    if (discount < 0 || discount > 100) return { error: `Date ${n}: discount must be between 0 and 100` };
    const dup = out.find(
      (o) =>
        String(o.cityId) === String(d.cityId) &&
        o.startDate.getTime() === start.getTime() &&
        o.endDate.getTime() === end.getTime()
    );
    if (dup) return { error: `Date ${n}: duplicate of an earlier date for the same city` };

    out.push({
      ...(d._id ? { _id: d._id } : {}),
      cityId: d.cityId,
      startDate: start,
      endDate: end,
      seats,
      price,
      discountPercentage: discount,
    });
  }
  return { data: out, cities };
}

/** Tour-level fields that are derived from its departures (kept for cards and legacy code). */
export function deriveFromDepartures(deps: any[], cities: Map<string, any>) {
  if (!deps.length) return {};
  const first = cities.get(String(deps[0].cityId));
  return {
    priceInr: Math.min(...deps.map((d) => d.price)),
    discountPercentage: Math.max(...deps.map((d) => d.discountPercentage || 0)),
    startingPoint: first?.name,
    endingPoint: first?.name,
  };
}

/** Travellers booked per departure (pending + confirmed; cancelled bookings free their seats). */
export async function bookedSeatsByDeparture(tourId: string | mongoose.Types.ObjectId): Promise<Record<string, number>> {
  const rows = await Booking.aggregate([
    {
      $match: {
        tourId: new mongoose.Types.ObjectId(String(tourId)),
        departureId: { $exists: true, $ne: null },
        status: { $ne: "cancelled" },
      },
    },
    { $group: { _id: "$departureId", booked: { $sum: "$numberOfTravelers" } } },
  ]);
  const map: Record<string, number> = {};
  for (const r of rows) map[String(r._id)] = r.booked;
  return map;
}
