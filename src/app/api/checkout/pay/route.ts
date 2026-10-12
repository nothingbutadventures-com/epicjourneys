import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import { bookedSeatsByDeparture } from "@/lib/departures";
import { HOLD_MINUTES, loadOwnedBooking, startInstallmentPayment } from "@/lib/checkout-server";

/** (Re)starts payment for a specific instalment of an existing booking. */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { ref, index } = await req.json();
    const found = await loadOwnedBooking(req, String(ref || ""));
    if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
    const { booking, auth } = found;

    if (booking.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled." }, { status: 400 });
    const i = Number(index);
    const inst = booking.installments.find((x: any) => x.index === i);
    if (!inst) return NextResponse.json({ error: "Instalment not found" }, { status: 404 });
    if (inst.status === "paid") return NextResponse.json({ error: "This instalment is already paid." }, { status: 400 });
    if (booking.installments.some((x: any) => x.index < i && x.status !== "paid")) {
      return NextResponse.json({ error: "Please pay the earlier instalment first." }, { status: 400 });
    }

    // An unpaid hold that expired must win its seats back before taking payment.
    if (booking.status === "pending") {
      const expired = booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now();
      if (expired) {
        const tour = await Tour.findById(booking.tourId);
        const dep: any = tour?.departures.find((d: any) => String(d._id) === String(booking.departureId));
        const booked = dep ? (await bookedSeatsByDeparture(tour!._id))[String(dep._id)] || 0 : 0;
        if (!dep || dep.seats - booked < booking.numberOfTravelers) {
          return NextResponse.json({ error: "Your hold expired and those seats are gone. Please start a new booking." }, { status: 409 });
        }
      }
      booking.holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
      await booking.save();
    }

    const payment = await startInstallmentPayment(booking, i, auth);
    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("POST /api/checkout/pay error:", error);
    return NextResponse.json({ error: error.message || "Could not start payment" }, { status: 500 });
  }
}
