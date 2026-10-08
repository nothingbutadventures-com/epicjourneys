import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    if (!Tour || !Destination || !User) {}

    let filter: any = {};

    if (auth.role === "partner") {
      // Partner sees bookings made by them, OR bookings for tours in their assigned destination
      const partnerUser = await User.findById(auth.userId);
      const assignedDestId = partnerUser?.assignedDestination;

      filter = {
        $or: [
          { partnerId: auth.userId },
          ...(assignedDestId ? [{ destinationId: assignedDestId }] : []),
        ],
      };
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    if (status && status !== "all") {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate("tourId", "title slug coverImage durationDays startingPoint priceInr")
      .populate("destinationId", "name state")
      .populate("partnerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      tourId,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      numberOfTravelers,
      specialRequests,
    } = body;

    if (
      !tourId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !travelDate
    ) {
      return NextResponse.json(
        {
          error:
            "Tour, customer name, email, phone, and travel date are required.",
        },
        { status: 400 }
      );
    }

    const tour = await Tour.findById(tourId).populate("destinationId");
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    // Check if the request is made by an authenticated partner or user
    const auth = getAuthFromRequest(req);
    const isPartner = auth && auth.role === "partner";
    const bookedByRole = isPartner ? "partner" : "user";

    // Partner attribution: if booked by partner, credit them directly.
    // Otherwise, check if destination has an assigned partner
    let partnerId = null;
    if (isPartner) {
      partnerId = auth.userId;
    } else if ((tour.destinationId as any)?.partnerId) {
      partnerId = (tour.destinationId as any).partnerId;
    }

    const travelers = Math.max(1, Number(numberOfTravelers) || 1);
    const totalAmountInr = travelers * tour.priceInr;

    // Generate readable reference
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingRef = `EJ-${new Date().getFullYear()}-${randomSuffix}`;

    const booking = await Booking.create({
      bookingRef,
      tourId: tour._id,
      tourTitle: tour.title,
      destinationId: tour.destinationId?._id || tour.destinationId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone.trim(),
      travelDate: new Date(travelDate),
      numberOfTravelers: travelers,
      pricePerPerson: tour.priceInr,
      totalAmountInr,
      specialRequests: specialRequests || "",
      status: "confirmed",
      bookedByRole,
      partnerId,
    });

    const populated = await Booking.findById(booking._id)
      .populate("tourId", "title coverImage durationDays startingPoint")
      .populate("destinationId", "name state")
      .populate("partnerId", "name email phone");

    return NextResponse.json({
      success: true,
      data: populated,
    });
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
