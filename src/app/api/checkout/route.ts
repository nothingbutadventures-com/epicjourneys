import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { bookedSeatsByDeparture } from "@/lib/departures";
import { computeQuote, type RoomType } from "@/lib/pricing";
import { buildSchedule, depositOption } from "@/lib/deposit";
import { HOLD_MINUTES, requireAuth, startInstallmentPayment } from "@/lib/checkout-server";
import { resolvePartnerDiscount } from "@/lib/partner-discounts";

const clean = (v: unknown) => String(v ?? "").trim();

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Please log in to book." }, { status: 401 });

    await connectToDatabase();
    if (!Destination) {}
    const body = await req.json();

    const { tour: tourKey, departureId, strategy } = body;
    if (!tourKey || !departureId) return NextResponse.json({ error: "Tour and date are required." }, { status: 400 });
    if (strategy !== "full" && strategy !== "deposit") return NextResponse.json({ error: "Choose a payment option." }, { status: 400 });

    const tour = await Tour.findOne(
      mongoose.isValidObjectId(tourKey) ? { _id: tourKey } : { slug: tourKey }
    ).populate("departures.cityId", "name");
    if (!tour || !tour.isActive) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

    const departure: any = (tour.departures || []).find((d: any) => String(d._id) === String(departureId));
    if (!departure) return NextResponse.json({ error: "Selected date is not available for this tour." }, { status: 400 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(departure.startDate) < today) {
      return NextResponse.json({ error: "This departure has already started." }, { status: 400 });
    }

    // Validate travellers
    const raw = Array.isArray(body.travellers) ? body.travellers : [];
    if (raw.length < 1 || raw.length > 20) return NextResponse.json({ error: "Add between 1 and 20 travellers." }, { status: 400 });
    const singleOffered = (tour.singleRoomPriceInr || 0) > 0;
    const user = await User.findById(auth.userId).select("name email phone assignedDestination").lean<any>();
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });

    // A partner books on behalf of a customer: only departures from their own city, customer email required.
    const isPartner = auth.role === "partner";
    let customerEmail: string = user.email;
    if (isPartner) {
      if (!user.assignedDestination || String(departure.cityId?._id || departure.cityId) !== String(user.assignedDestination)) {
        return NextResponse.json({ error: "You can only book departures that start from your own location." }, { status: 403 });
      }
      customerEmail = clean(body.customer?.email).toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(customerEmail)) return NextResponse.json({ error: "Enter the customer's email address." }, { status: 400 });
      const clash: any = await User.findOne({ email: customerEmail }).select("role").lean();
      if (clash && clash.role !== "user") {
        return NextResponse.json({ error: "That email belongs to a staff account. Use the customer's own email." }, { status: 400 });
      }
    }

    const travellers: any[] = [];
    for (const [i, t] of raw.entries()) {
      const firstName = clean(t.firstName);
      const lastName = clean(t.lastName);
      const phone = clean(t.phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      const age = Math.floor(Number(t.age));
      if (!firstName || !lastName) return NextResponse.json({ error: `Traveller ${i + 1}: first and last name are required.` }, { status: 400 });
      if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: `Traveller ${i + 1}: enter a valid 10-digit mobile number.` }, { status: 400 });
      if (!(age >= 1 && age <= 100)) return NextResponse.json({ error: `Traveller ${i + 1}: enter a valid age.` }, { status: 400 });
      const roomType: RoomType = singleOffered && t.roomType === "single" ? "single" : "shared";
      travellers.push({ firstName, lastName, phone, age, roomType, ...(i === 0 ? { email: customerEmail } : {}) });
    }

    // Free up this user's earlier unpaid holds for the same date before counting seats.
    await Booking.deleteMany({
      ...(isPartner ? { partnerId: auth.userId, bookedByRole: "partner", customerEmail } : { userId: auth.userId }),
      tourId: tour._id,
      departureId: departure._id,
      status: "pending",
      amountPaidInr: 0,
    });

    const booked = (await bookedSeatsByDeparture(tour._id))[String(departure._id)] || 0;
    const left = departure.seats - booked;
    if (left < travellers.length) {
      return NextResponse.json(
        { error: left <= 0 ? "This date is sold out." : `Only ${left} seat${left === 1 ? "" : "s"} left on this date.` },
        { status: 409 }
      );
    }

    // Server-side pricing (never trust client totals)
    const quote = computeQuote({
      price: departure.price ?? tour.priceInr,
      discountPercentage: departure.discountPercentage || 0,
      singleRoomPrice: tour.singleRoomPriceInr || 0,
      rooms: travellers.map((t) => t.roomType),
    });

    // Partner discount sits on top of the tour's own discount and the room supplement, off the final total.
    let partnerOff = 0;
    let partnerDiscount: any = null;
    if (body.partnerDiscountId) {
      if (!isPartner) return NextResponse.json({ error: "Only partners can apply a partner discount." }, { status: 403 });
      const r: any = await resolvePartnerDiscount(auth.userId, body.partnerDiscountId, quote.total);
      if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
      partnerDiscount = r.discount;
      partnerOff = r.amountInr;
    }
    const payTotal = quote.total - partnerOff;

    const option = depositOption({
      total: payTotal,
      travellers: travellers.length,
      startDate: departure.startDate,
      cfg: { type: tour.depositType, value: tour.depositValue },
    });
    if (strategy === "deposit" && !option.available) {
      return NextResponse.json({ error: option.reason || "A deposit isn't available for this date. Please pay in full." }, { status: 400 });
    }
    const schedule = buildSchedule({ total: payTotal, strategy, deposit: option.deposit, startDate: departure.startDate });

    const primary = travellers[0];
    const bookingRef = `EJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const destination: any = tour.destinationId ? await Destination.findById(tour.destinationId).select("partnerId").lean() : null;

    const booking = await Booking.create({
      bookingRef,
      tourId: tour._id,
      tourTitle: tour.title,
      destinationId: tour.destinationId,
      departureId: departure._id,
      departureCity: departure.cityId?.name || "",
      travelDate: departure.startDate,
      travelEndDate: departure.endDate,
      customerName: `${primary.firstName} ${primary.lastName}`,
      customerEmail,
      customerPhone: primary.phone,
      specialRequests: clean(body.specialRequests).slice(0, 1000),
      ...(partnerDiscount ? { partnerDiscountId: partnerDiscount._id, partnerDiscountName: partnerDiscount.name, partnerDiscountInr: partnerOff } : {}),
      numberOfTravelers: travellers.length,
      pricePerPerson: quote.unitPrice,
      totalAmountInr: payTotal,
      roomSupplementInr: quote.roomSupplement,
      travellers,
      paymentStrategy: strategy,
      installments: schedule.map((s) => ({ index: s.index, label: s.label, amountInr: s.amountInr, dueDate: s.dueDate, status: "pending" })),
      paymentStatus: "pending",
      amountPaidInr: 0,
      status: "pending",
      bookedByRole: isPartner ? "partner" : "user",
      partnerId: isPartner ? auth.userId : destination?.partnerId || null,
      ...(isPartner ? {} : { userId: auth.userId }),
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    });

    // Re-check after writing so two simultaneous checkouts can't oversell a date.
    const total = (await bookedSeatsByDeparture(tour._id))[String(departure._id)] || 0;
    if (total > departure.seats) {
      await Booking.deleteOne({ _id: booking._id });
      return NextResponse.json({ error: "Sorry, those seats were just taken. Please try again." }, { status: 409 });
    }

    const payment = await startInstallmentPayment(booking, 0, auth);
    return NextResponse.json({ success: true, bookingRef, payment });
  } catch (error: any) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
