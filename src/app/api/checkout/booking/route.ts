import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { loadOwnedBooking } from "@/lib/checkout-server";
import { razorpayConfigured } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const ref = new URL(req.url).searchParams.get("ref") || "";
    const found = await loadOwnedBooking(req, ref);
    if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
    const tourDoc: any = await Tour.findById(found.booking.tourId).select("title slug coverImage durationDays durationNights departures").lean();
    // The starting address attached to this booking's date (live from the city's address book).
    let startAddress: any = null;
    const dep = tourDoc?.departures?.find((d: any) => String(d._id) === String(found.booking.departureId));
    if (dep?.addressId) {
      if (!User) {}
      const city: any = await Destination.findById(dep.cityId).select("name addresses partnerId").populate("partnerId", "phone secondaryPhone").lean();
      const a = city?.addresses?.find((x: any) => String(x._id) === String(dep.addressId));
      if (a) {
        // Empty contact numbers on the address fall back to the city partner's numbers.
        const partner = city.partnerId;
        startAddress = {
          ...a,
          mobile: a.mobile || partner?.phone || "",
          secondaryMobile: a.secondaryMobile || partner?.secondaryPhone || "",
          city: city.name,
        };
      }
    }
    const { departures: _omit, ...tour } = tourDoc || {};
    return NextResponse.json({
      success: true,
      data: { ...found.booking.toObject(), tour, startAddress },
      gatewayConfigured: razorpayConfigured(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
