import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Integration from "@/models/Integration";
import { getAuthFromRequest } from "@/lib/auth";

const deny = () => NextResponse.json({ error: "Admin access required." }, { status: 403 });
const clampPercent = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

const PROVIDER = "partner-commission";

function commissionFor(booking: any, globalPercent: number) {
  const percent = booking.platformCommissionPercent ?? globalPercent;
  const total = Number(booking.totalAmountInr) || 0;
  const paid = Math.min(total, Number(booking.amountPaidInr) || 0);
  const commissionPaid = Math.round((paid * percent) / 100);
  const commissionPending = booking.status === "confirmed"
    ? Math.round(((total - paid) * percent) / 100)
    : 0;
  return { percent, total, paid, commissionPaid, commissionPending };
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") return deny();
    await connectToDatabase();
    const config: any = await Integration.findOne({ provider: PROVIDER }).select("partnerCommissionPercent").lean();
    const globalPercent = Number(config?.partnerCommissionPercent) || 0;

    const { searchParams } = new URL(req.url);
    const tourId = searchParams.get("tourId");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const tourFilter: any = { createdByPartner: true };
    if (tourId) tourFilter._id = tourId;
    if (search) tourFilter.title = { $regex: search, $options: "i" };

    const tours = await Tour.find(tourFilter)
      .select("title slug destinationId partnerId basePriceInr priceInr createdAt")
      .populate("destinationId", "name state")
      .populate("partnerId", "name email companyName")
      .sort({ createdAt: -1 })
      .lean();

    const tourIds = tours.map((tour) => tour._id);
    const bookingFilter: any = { tourId: { $in: tourIds } };
    if (status && status !== "all") bookingFilter.status = status;
    const bookings = await Booking.find(bookingFilter).sort({ createdAt: -1 }).lean();
    const tourMap = new Map(tours.map((tour: any) => [String(tour._id), tour]));

    const rows = bookings.map((booking: any) => {
      const tour: any = tourMap.get(String(booking.tourId));
      const amounts = commissionFor(booking, globalPercent);
      return {
        bookingId: String(booking._id),
        bookingRef: booking.bookingRef,
        tourId: String(booking.tourId),
        tour: tour?.title || booking.tourTitle,
        partner: tour?.partnerId?.name || "Unassigned",
        customer: booking.customerName,
        travelDate: booking.travelDate,
        status: booking.status,
        total: amounts.total,
        paid: amounts.paid,
        percent: amounts.percent,
        commissionPaid: amounts.commissionPaid,
        commissionPending: amounts.commissionPending,
        partnerPaid: amounts.paid - amounts.commissionPaid,
      };
    });

    const tourSummaries = tours.map((tour: any) => {
      const tourRows = rows.filter((row) => row.tourId === String(tour._id));
      return {
        tourId: String(tour._id),
        title: tour.title,
        destination: tour.destinationId?.name || "—",
        partner: tour.partnerId?.name || "Unassigned",
        percent: globalPercent,
        bookings: tourRows.filter((row) => row.status !== "cancelled").length,
        sales: tourRows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + row.paid, 0),
        commissionPaid: tourRows.reduce((sum, row) => sum + row.commissionPaid, 0),
        commissionPending: tourRows.reduce((sum, row) => sum + row.commissionPending, 0),
        partnerPaid: tourRows.reduce((sum, row) => sum + row.partnerPaid, 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        percent: globalPercent,
        tours: tourSummaries,
        rows,
        totals: {
          tours: tourSummaries.length,
          bookings: tourSummaries.reduce((sum, tour) => sum + tour.bookings, 0),
          sales: tourSummaries.reduce((sum, tour) => sum + tour.sales, 0),
          commissionPaid: tourSummaries.reduce((sum, tour) => sum + tour.commissionPaid, 0),
          commissionPending: tourSummaries.reduce((sum, tour) => sum + tour.commissionPending, 0),
          partnerPaid: tourSummaries.reduce((sum, tour) => sum + tour.partnerPaid, 0),
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/partner-commission error:", error);
    return NextResponse.json({ error: error.message || "Could not load commissions." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") return deny();
    const body = await req.json();
    const percent = clampPercent(body.percent);
    if (percent === null) return NextResponse.json({ error: "Commission must be between 0 and 100." }, { status: 400 });

    await connectToDatabase();
    const config = await Integration.findOneAndUpdate(
      { provider: PROVIDER },
      { $set: { partnerCommissionPercent: percent }, $setOnInsert: { provider: PROVIDER } },
      { new: true, upsert: true, projection: "partnerCommissionPercent" },
    ).lean();
    return NextResponse.json({ success: true, data: { percent: config?.partnerCommissionPercent ?? percent } });
  } catch (error: any) {
    console.error("PATCH /api/partner-commission error:", error);
    return NextResponse.json({ error: error.message || "Could not save commission." }, { status: 500 });
  }
}
