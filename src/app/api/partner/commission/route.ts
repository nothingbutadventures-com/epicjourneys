import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { commissionRows } from "@/lib/commission";

// The signed-in partner's commission: rate, totals, month by month, and every booking behind it.
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "partner") return NextResponse.json({ error: "Partner login required." }, { status: 403 });
    await connectToDatabase();
    const me: any = await User.findById(auth.userId).select("commissionPercent").lean();
    const percent = me?.commissionPercent ?? 5;

    const bookings = await Booking.find({ commissionPartnerId: auth.userId }).sort({ createdAt: -1 }).lean();
    const rows = commissionRows(bookings, percent);

    const months = new Map<string, { month: string; earned: number; pending: number; bookings: number; sales: number }>();
    bookings.forEach((b: any, i) => {
      if (b.status === "cancelled") return;
      const key = new Date(b.createdAt).toISOString().slice(0, 7);
      const m = months.get(key) || { month: key, earned: 0, pending: 0, bookings: 0, sales: 0 };
      m.earned += rows[i].earned;
      m.pending += rows[i].pending;
      m.bookings += 1;
      m.sales += rows[i].paid;
      months.set(key, m);
    });

    const counted = rows.filter((r) => r.status !== "cancelled");
    return NextResponse.json({
      success: true,
      data: {
        percent,
        totals: {
          earned: counted.reduce((n, r) => n + r.earned, 0),
          pending: counted.reduce((n, r) => n + r.pending, 0),
          bookings: counted.length,
          sales: counted.reduce((n, r) => n + r.paid, 0),
        },
        months: [...months.values()].sort((a, b) => b.month.localeCompare(a.month)),
        rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
