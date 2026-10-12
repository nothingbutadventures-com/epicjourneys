import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    await connectToDatabase();
    if (!Tour) {}
    const bookings = await Booking.find({ userId: auth.userId })
      .populate("tourId", "title slug coverImage durationDays durationNights")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
