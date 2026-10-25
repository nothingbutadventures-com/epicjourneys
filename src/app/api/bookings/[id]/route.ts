import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { partnerLocation } from "@/lib/location-access";
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
    if (auth.role === "partner" && String(booking.locationId || "") !== String((await partnerLocation(auth.userId)) || "none")) {
      return NextResponse.json(
        { error: "You cannot modify bookings that do not belong to you." },
        { status: 403 }
      );
    }

    if (body.status) {
      if (!["confirmed", "pending", "cancelled"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      booking.status = body.status;
      if (body.status !== "pending") booking.holdExpiresAt = null;
    }

    // Admin: record an instalment collected outside the gateway (cash / bank transfer).
    if (body.markInstallmentPaid !== undefined) {
      if (auth.role !== "admin") {
        return NextResponse.json({ error: "Only admins can record payments." }, { status: 403 });
      }
      const inst = booking.installments.find((i: any) => i.index === Number(body.markInstallmentPaid));
      if (!inst) return NextResponse.json({ error: "Instalment not found" }, { status: 404 });
      if (inst.status === "paid") return NextResponse.json({ error: "Instalment is already paid" }, { status: 400 });
      inst.status = "paid";
      inst.offline = true;
      inst.paidAt = new Date();
      booking.amountPaidInr = booking.installments
        .filter((i: any) => i.status === "paid")
        .reduce((sum: number, i: any) => sum + i.amountInr, 0);
      booking.paymentStatus = booking.amountPaidInr >= booking.totalAmountInr ? "paid" : "partial";
      if (booking.status === "pending") {
        booking.status = "confirmed";
        booking.holdExpiresAt = null;
      }
      booking.markModified("installments");
    }

    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
