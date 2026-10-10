import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateDistanceKm } from "@/lib/geo";
import { sanitizeDepartures, deriveFromDepartures, bookedSeatsByDeparture } from "@/lib/departures";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    if (!Destination) {}

    // Find by ID or by slug
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { slug: id };

    const tour = await Tour.findOne(query)
      .populate("destinationId", "name state coordinates coverImage description")
      .populate("departures.cityId", "name state coordinates");

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    let distanceKm: number | null = null;
    if (latStr && lngStr) {
      const uLat = parseFloat(latStr);
      const uLng = parseFloat(lngStr);
      const destCoords = (tour.destinationId as any)?.coordinates;
      if (destCoords?.lat !== undefined && destCoords?.lng !== undefined) {
        distanceKm = calculateDistanceKm(uLat, uLng, destCoords.lat, destCoords.lng);
      }
    }

    // Upcoming departures with live availability
    const booked = await bookedSeatsByDeparture(tour._id);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // raw=true (admin edit form) returns every departure, including past ones
    const raw = searchParams.get("raw") === "true";
    const departures = (tour.departures || [])
      .filter((d: any) => raw || new Date(d.startDate) >= startOfToday)
      .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate))
      .map((d: any) => {
        const bookedSeats = booked[String(d._id)] || 0;
        return {
          _id: d._id,
          cityId: d.cityId?._id ? String(d.cityId._id) : d.cityId ? String(d.cityId) : null,
          cityName: d.cityId?.name || tour.startingPoint,
          price: d.price ?? tour.priceInr,
          startDate: d.startDate,
          endDate: d.endDate,
          seats: d.seats,
          discountPercentage: d.discountPercentage || 0,
          booked: bookedSeats,
          available: Math.max(0, d.seats - bookedSeats),
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        ...tour.toObject(),
        departures,
        distanceKm,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();

    const tour = await Tour.findById(id);
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    // If destination changed, update state, starting & ending point
    if (body.destinationId && body.destinationId !== tour.destinationId.toString()) {
      const dest = await Destination.findById(body.destinationId);
      if (dest) {
        body.state = dest.state;
        body.targetCity = dest.name;
      }
    }

    if (body.departures !== undefined) {
      const deps = await sanitizeDepartures(body.departures);
      if (deps.error) {
        return NextResponse.json({ error: deps.error }, { status: 400 });
      }
      const booked = await bookedSeatsByDeparture(tour._id);
      const kept = new Set((deps.data || []).filter((d: any) => d._id).map((d: any) => String(d._id)));
      for (const existing of tour.departures || []) {
        const id = String(existing._id);
        if ((booked[id] || 0) > 0 && !kept.has(id)) {
          return NextResponse.json(
            { error: "A date that already has bookings can't be removed. Cancel its bookings first." },
            { status: 400 }
          );
        }
      }
      for (const d of deps.data || []) {
        if (d._id && d.seats < (booked[String(d._id)] || 0)) {
          return NextResponse.json(
            { error: `A date already has ${booked[String(d._id)]} travellers booked, so seats can't go below that.` },
            { status: 400 }
          );
        }
      }
      if (!deps.data || deps.data.length === 0) {
        return NextResponse.json({ error: "Add at least one date." }, { status: 400 });
      }
      body.departures = deps.data;
      Object.assign(body, deriveFromDepartures(deps.data, deps.cities!));
    }

    const updated = await Tour.findByIdAndUpdate(id, body, { new: true }).populate(
      "destinationId",
      "name state coordinates coverImage"
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Tour deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
