import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { loadOwnedBooking } from "@/lib/checkout-server";
import { razorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";

/** Marks an instalment paid after a verified Razorpay payment (or a simulated one when keys are empty). */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { ref, index, razorpay, simulate } = await req.json();
    const found = await loadOwnedBooking(req, String(ref || ""));
    if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
    const { booking } = found;

    const i = Number(index);
    const inst = booking.installments.find((x: any) => x.index === i);
    if (!inst) return NextResponse.json({ error: "Instalment not found" }, { status: 404 });
    if (inst.status === "paid") return NextResponse.json({ success: true, alreadyPaid: true, bookingRef: booking.bookingRef });

    if (razorpayConfigured()) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpay || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || razorpay_order_id !== inst.razorpayOrderId) {
        return NextResponse.json({ error: "Payment details don't match this instalment." }, { status: 400 });
      }
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
      }
      inst.razorpayPaymentId = razorpay_payment_id;
    } else {
      // Test mode: only allowed while no Razorpay keys are configured.
      if (!simulate) return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 400 });
      inst.simulated = true;
    }

    inst.status = "paid";
    inst.paidAt = new Date();
    booking.amountPaidInr = booking.installments.filter((x: any) => x.status === "paid").reduce((s: number, x: any) => s + x.amountInr, 0);
    booking.paymentStatus = booking.amountPaidInr >= booking.totalAmountInr ? "paid" : "partial";
    if (booking.status === "pending") {
      booking.status = "confirmed";
      booking.holdExpiresAt = null;
    }
    booking.markModified("installments");
    await booking.save();

    return NextResponse.json({ success: true, bookingRef: booking.bookingRef, paymentStatus: booking.paymentStatus });
  } catch (error: any) {
    console.error("POST /api/checkout/confirm error:", error);
    return NextResponse.json({ error: error.message || "Could not confirm payment" }, { status: 500 });
  }
}
