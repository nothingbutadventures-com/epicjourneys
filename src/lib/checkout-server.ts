import { NextRequest } from "next/server";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";

export const HOLD_MINUTES = 20;

export function requireAuth(req: NextRequest) {
  return getAuthFromRequest(req);
}

/** Loads a booking owned by the signed-in user (admins can open any booking). */
export async function loadOwnedBooking(req: NextRequest, ref: string) {
  const auth = getAuthFromRequest(req);
  if (!auth) return { error: "Please log in to continue.", status: 401 as const };
  const booking = await Booking.findOne({ bookingRef: ref });
  if (!booking) return { error: "Booking not found", status: 404 as const };
  if (auth.role !== "admin" && String(booking.userId) !== auth.userId) {
    return { error: "This booking belongs to another account.", status: 403 as const };
  }
  return { booking, auth };
}

/**
 * Starts payment for one instalment. With Razorpay keys configured this creates a real
 * Razorpay order; otherwise it tells the client to open the payment simulator.
 */
export async function startInstallmentPayment(booking: any, index: number, auth: { userId: string; email: string; name: string }) {
  const inst = booking.installments.find((i: any) => i.index === index);
  if (!inst) throw new Error("Instalment not found");

  const user = await User.findById(auth.userId).select("phone").lean<any>();
  const prefill = {
    name: auth.name,
    email: auth.email,
    contact: user?.phone || booking.customerPhone || "",
  };
  const base = {
    bookingRef: booking.bookingRef,
    index,
    label: inst.label,
    amountInr: inst.amountInr,
    tourTitle: booking.tourTitle,
    prefill,
  };

  if (!razorpayConfigured()) return { mode: "simulator" as const, ...base };

  const order = await createRazorpayOrder({
    amountInr: inst.amountInr,
    receipt: `${booking.bookingRef}-${index}`,
    notes: { bookingRef: booking.bookingRef, instalment: String(index) },
  });
  inst.razorpayOrderId = order.id;
  booking.markModified("installments");
  await booking.save();
  return {
    mode: "razorpay" as const,
    ...base,
    keyId: razorpayKeyId(),
    orderId: order.id,
    amountPaise: order.amount,
    currency: order.currency,
  };
}

export function serializeBooking(b: any) {
  const o = b.toObject ? b.toObject() : b;
  return o;
}
