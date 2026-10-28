import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Booking from "@/models/Booking";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { loadLiveSpecials, specialForTour } from "@/lib/special-discounts";

const ymd = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const validDay = (s: string | null): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(`${s}T00:00:00Z`).getTime()));

/** Every departure overlapping [from, to] with its live seats and booking numbers, for the admin tours calendar. */
export async function GET(req: NextRequest) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!validDay(from) || !validDay(to) || to < from) return NextResponse.json({ error: "Choose a valid date range." }, { status: 400 });
    // Guard against huge ranges: the calendar never needs more than a few months.
    if (+new Date(`${to}T00:00:00Z`) - +new Date(`${from}T00:00:00Z`) > 190 * 86400000) return NextResponse.json({ error: "That range is too wide." }, { status: 400 });

    await connectToDatabase();
    if (!Destination || !User) {}
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T23:59:59.999Z`);

    const tours: any[] = await Tour.find({ departures: { $elemMatch: { startDate: { $lte: end }, endDate: { $gte: start } } } })
      .select("title slug coverImage state targetCity travelStyles durationDays priceInr basePriceInr isActive departures")
      .populate("departures.cityId", "name")
      .populate("departures.partnerId", "name")
      .lean();

    const inRange = (d: any) => new Date(d.startDate) <= end && new Date(d.endDate) >= start;
    const ids = tours.flatMap((t) => (t.departures || []).filter(inRange).map((d: any) => d._id));

    // Seats use the same rule as the storefront (cancelled bookings and expired unpaid holds don't count).
    const stats = ids.length
      ? await Booking.aggregate([
          {
            $match: {
              departureId: { $in: ids },
              status: { $ne: "cancelled" },
              $or: [{ status: { $ne: "pending" } }, { holdExpiresAt: { $exists: false } }, { holdExpiresAt: null }, { holdExpiresAt: { $gt: new Date() } }],
            },
          },
          { $group: { _id: "$departureId", travellers: { $sum: "$numberOfTravelers" }, bookings: { $sum: 1 }, total: { $sum: "$totalAmountInr" }, paid: { $sum: "$amountPaidInr" } } },
        ])
      : [];
    const statMap = new Map(stats.map((s) => [String(s._id), s]));
    const live = await loadLiveSpecials();

    const events = tours.flatMap((t) => {
      const special = specialForTour(t, live);
      return (t.departures || []).filter(inRange).map((d: any) => {
        const s = statMap.get(String(d._id));
        const booked = s?.travellers || 0;
        const price = d.price ?? t.priceInr;
        const discount = special ? special.percentage : d.discountPercentage || 0;
        return {
          id: String(d._id),
          tourId: String(t._id),
          title: t.title,
          slug: t.slug,
          coverImage: t.coverImage,
          state: t.state,
          targetCity: t.targetCity || "",
          travelStyles: t.travelStyles || [],
          tourActive: t.isActive !== false,
          kind: d.launchId ? "launched" : "base",
          cityName: d.cityId?.name || "",
          partnerName: d.partnerId?.name || "",
          start: ymd(d.startDate),
          end: ymd(d.endDate),
          seats: d.seats,
          booked,
          available: Math.max(0, d.seats - booked),
          bookings: s?.bookings || 0,
          price,
          storedDiscount: d.discountPercentage || 0,
          discount,
          specialOffer: special ? { name: special.name, percentage: special.percentage } : null,
          unitPrice: Math.round(price * (1 - discount / 100)),
          revenue: s?.total || 0,
          paid: s?.paid || 0,
        };
      });
    });
    events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
    // Every tour (not just those in range) so the calendar can focus on a single tour.
    const tourOptions = (await Tour.find({}).select("title").sort({ title: 1 }).lean<any[]>()).map((t) => ({ id: String(t._id), title: t.title }));
    return NextResponse.json({ success: true, data: events, tours: tourOptions });
  } catch (error: any) {
    console.error("GET /api/tours-calendar error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
