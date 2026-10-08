import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    if (!Tour || !Destination || !User) {}

    const booking = await Booking.findById(id)
      .populate("tourId", "title coverImage durationDays startingPoint")
      .populate("destinationId", "name state")
      .populate("partnerId", "name email phone");

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If partner, verify they have permission to update this booking
    if (auth.role === "partner" && booking.partnerId?.toString() !== auth.userId) {
      return NextResponse.json(
        { error: "You cannot modify bookings that do not belong to you." },
        { status: 403 }
      );
    }

    if (body.status) {
      booking.status = body.status;
    }

    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
