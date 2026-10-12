import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import { loadOwnedBooking } from "@/lib/checkout-server";
import { razorpayConfigured } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const ref = new URL(req.url).searchParams.get("ref") || "";
    const found = await loadOwnedBooking(req, ref);
    if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
    const tour = await Tour.findById(found.booking.tourId).select("title slug coverImage durationDays durationNights").lean();
    return NextResponse.json({
      success: true,
      data: { ...found.booking.toObject(), tour },
      gatewayConfigured: razorpayConfigured(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
