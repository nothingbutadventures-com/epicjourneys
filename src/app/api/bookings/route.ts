import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { bookedSeatsByDeparture } from "@/lib/departures";
import Discount from "@/models/Discount";
import mongoose from "mongoose";
import { partnerCanBook } from "@/lib/partner-booking";
import { effectiveDiscount, liveSpecialForTour } from "@/lib/special-discounts";
import { discountUsable, discountedUnitPrice, partnerDiscountAmount } from "@/lib/pricing";

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
      // Bookings belong to a location, so whoever manages the location sees all of its bookings.
      const partnerUser = await User.findById(auth.userId);
      const assignedDestId = partnerUser?.assignedDestination;
      filter = assignedDestId ? { locationId: assignedDestId } : { _id: null };
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    if (status && status !== "all") {
      filter.status = status;
    }

    const tourIdParam = searchParams.get("tourId");
    if (tourIdParam) filter.tourId = tourIdParam;

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
      departureId,
      numberOfTravelers,
      specialRequests,
      partnerDiscountId,
    } = body;

    if (
      !tourId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      (!travelDate && !departureId)
    ) {
      return NextResponse.json(
        {
          error:
            "Tour, customer name, email, phone, and travel date are required.",
        },
        { status: 400 }
      );
    }

    const tour = await Tour.findById(tourId)
      .populate("destinationId")
      .populate("departures.cityId", "name");
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

    // Partners can only book tours that start from their own location.
    if (isPartner) {
      const me: any = await User.findById(auth!.userId).select("assignedDestination").lean();
      const myCity = me?.assignedDestination ? String(me.assignedDestination) : "";
      const bookable = (tour.departures || []).some((d: any) => partnerCanBook(d, myCity));
      if (!bookable) {
        return NextResponse.json({ error: "This tour has no dates you can book." }, { status: 403 });
      }
    }

    // Location owner of this booking: the partner's city, or the city the departure was launched from.
    let locationId: any = tour.destinationId?._id || tour.destinationId;
    if (isPartner) locationId = (await User.findById(auth!.userId).select("assignedDestination").lean<any>())?.assignedDestination || locationId;

    const travelers = Math.max(1, Number(numberOfTravelers) || 1);

    // Public bookings must pick one of the tour's scheduled departures. Partner/admin
    // bookings made without a departure keep the legacy free-date behaviour.
    let departure: any = null;
    if (departureId) {
      departure = (tour.departures || []).find((d: any) => String(d._id) === String(departureId));
      if (!departure) {
        return NextResponse.json({ error: "Selected date is not available for this tour." }, { status: 400 });
      }
      if (isPartner) {
        const me: any = await User.findById(auth!.userId).select("assignedDestination").lean();
        if (!partnerCanBook(departure, me?.assignedDestination ? String(me.assignedDestination) : "")) {
          return NextResponse.json({ error: "You can't book that departure." }, { status: 403 });
        }
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(departure.startDate) < today) {
        return NextResponse.json({ error: "This departure has already started." }, { status: 400 });
      }
      const booked = (await bookedSeatsByDeparture(tour._id))[String(departure._id)] || 0;
      const left = departure.seats - booked;
      if (left < travelers) {
        return NextResponse.json(
          { error: left <= 0 ? "This date is sold out." : `Only ${left} seat${left === 1 ? "" : "s"} left on this date.` },
          { status: 409 }
        );
      }
    } else if (isPartner) {
      return NextResponse.json({ error: "Please choose a departure date for this booking." }, { status: 400 });
    } else if (!(auth && auth.role === "admin")) {
      return NextResponse.json({ error: "Please choose one of the available dates." }, { status: 400 });
    }

    const discount = departure ? effectiveDiscount(departure.discountPercentage, await liveSpecialForTour(tour)) : 0;
    const basePrice = departure ? departure.price ?? tour.priceInr : tour.priceInr;
    const pricePerPerson = discountedUnitPrice(basePrice, discount);
    const subtotal = travelers * pricePerPerson;

    // Partner discount stacks on top of the tour's own discount. Only the booking partner's
    // own attached, active and unexpired partner discounts are accepted.
    let partnerDiscount: any = null;
    let partnerDiscountInr = 0;
    if (partnerDiscountId) {
      if (!isPartner) {
        return NextResponse.json({ error: "Only partners can apply a partner discount." }, { status: 403 });
      }
      const owner: any = await User.findById(auth!.userId).select("partnerDiscountIds").lean();
      const attached = (owner?.partnerDiscountIds || []).map(String);
      if (!mongoose.isValidObjectId(partnerDiscountId) || !attached.includes(String(partnerDiscountId))) {
        return NextResponse.json({ error: "That discount isn't available to your account." }, { status: 400 });
      }
      partnerDiscount = await Discount.findOne({ _id: partnerDiscountId, kind: "partner" }).lean();
      if (!partnerDiscount || !discountUsable(partnerDiscount)) {
        return NextResponse.json({ error: "That discount is no longer active or has expired." }, { status: 400 });
      }
      partnerDiscountInr = partnerDiscountAmount(subtotal, partnerDiscount);
    }
    const totalAmountInr = subtotal - partnerDiscountInr;

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
      ...(departure
        ? {
            departureId: departure._id,
            travelEndDate: departure.endDate,
            departureCity: departure.cityId?.name || "",
          }
        : {}),
      travelDate: departure ? departure.startDate : new Date(travelDate),
      numberOfTravelers: travelers,
      pricePerPerson,
      totalAmountInr,
      ...(partnerDiscount
        ? { partnerDiscountId: partnerDiscount._id, partnerDiscountName: partnerDiscount.name, partnerDiscountInr }
        : {}),
      specialRequests: specialRequests || "",
      status: "confirmed",
      bookedByRole,
      partnerId,
      locationId,
    });

    // Re-check after writing so two simultaneous requests can't oversell a date.
    if (departure) {
      const total = (await bookedSeatsByDeparture(tour._id))[String(departure._id)] || 0;
      if (total > departure.seats) {
        await Booking.deleteOne({ _id: booking._id });
        return NextResponse.json({ error: "Sorry, those seats were just taken. Please try again." }, { status: 409 });
      }
    }

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
