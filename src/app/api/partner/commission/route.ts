import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Integration from "@/models/Integration";
import { getAuthFromRequest } from "@/lib/auth";

const PROVIDER = "partner-commission";

function amounts(booking: any, globalPercent: number) {
  const percent = booking.platformCommissionPercent ?? globalPercent;
  const total = Number(booking.totalAmountInr) || 0;
  const paid = Math.min(total, Number(booking.amountPaidInr) || 0);
  const commissionPaid = Math.round((paid * percent) / 100);
  const payoutPaid = paid - commissionPaid;
  const payoutPending = booking.status === "confirmed"
    ? Math.round(((total - paid) * (100 - percent)) / 100)
    : 0;
  return { percent, total, paid, commissionPaid, payoutPaid, payoutPending };
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "partner") return NextResponse.json({ error: "Partner login required." }, { status: 403 });
    await connectToDatabase();
    const config: any = await Integration.findOne({ provider: PROVIDER }).select("partnerCommissionPercent").lean();
    const globalPercent = Number(config?.partnerCommissionPercent) || 0;

    const tours = await Tour.find({ partnerId: auth.userId, createdByPartner: true })
      .select("title destinationId")
      .populate("destinationId", "name state")
      .lean();
    const tourIds = tours.map((tour) => tour._id);
    const bookings = await Booking.find({ tourId: { $in: tourIds } }).sort({ createdAt: -1 }).lean();
    const tourMap = new Map(tours.map((tour: any) => [String(tour._id), tour]));

    const rows = bookings.map((booking: any) => {
      const tour: any = tourMap.get(String(booking.tourId));
      const value = amounts(booking, globalPercent);
      return {
        bookingId: String(booking._id),
        bookingRef: booking.bookingRef,
        tourId: String(booking.tourId),
        customer: booking.customerName,
        tour: tour?.title || booking.tourTitle,
        destination: tour?.destinationId?.name || "—",
        travelDate: booking.travelDate,
        status: booking.status,
        total: value.total,
        paid: value.paid,
        percent: value.percent,
        platformCommission: value.commissionPaid,
        payoutPaid: value.payoutPaid,
        payoutPending: value.payoutPending,
      };
    });

    const summaries = tours.map((tour: any) => {
      const tourRows = rows.filter((row) => row.tourId === String(tour._id));
      return {
        tourId: String(tour._id),
        title: tour.title,
        destination: tour.destinationId?.name || "—",
        percent: globalPercent,
        bookings: tourRows.filter((row) => row.status !== "cancelled").length,
        paid: tourRows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + row.paid, 0),
        payoutPaid: tourRows.reduce((sum, row) => sum + row.payoutPaid, 0),
        payoutPending: tourRows.reduce((sum, row) => sum + row.payoutPending, 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        platformCommissionPercent: globalPercent,
        tours: summaries,
        rows,
        totals: {
          bookings: summaries.reduce((sum, tour) => sum + tour.bookings, 0),
          paid: summaries.reduce((sum, tour) => sum + tour.paid, 0),
          payoutPaid: summaries.reduce((sum, tour) => sum + tour.payoutPaid, 0),
          payoutPending: summaries.reduce((sum, tour) => sum + tour.payoutPending, 0),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not load partner payouts." }, { status: 500 });
  }
}
