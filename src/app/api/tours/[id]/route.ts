import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateDistanceKm } from "@/lib/geo";
import { bookedSeatsByDeparture } from "@/lib/departures";
import { applyBaseDepartures, cleanItinerary, refreshTourDerived } from "@/lib/launch";

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
      .populate("departures.cityId", "name state coordinates addresses");

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
          isBase: !d.launchId,
          startItinerary: d.startItinerary || [],
          endItinerary: d.endItinerary || [],
          extraPriceInr: d.extraPriceInr ?? null,
          durationDays: Math.max(1, Math.round((+new Date(d.endDate) - +new Date(d.startDate)) / 86400000) + 1),
          addressId: d.addressId ? String(d.addressId) : null,
          address: (() => {
            const a = d.addressId ? (d.cityId?.addresses || []).find((x: any) => String(x._id) === String(d.addressId)) : null;
            // Public page: no phone numbers. The booking owner sees the full address on their booking page.
            return a ? { _id: a._id, label: a.label, address: a.address, landmark: a.landmark, pincode: a.pincode, mapUrl: a.mapUrl } : null;
          })(),
          price: d.price ?? tour.priceInr,
          startDate: d.startDate,
          endDate: d.endDate,
          seats: d.seats,
          discountPercentage: d.discountPercentage || 0,
          booked: bookedSeats,
          available: Math.max(0, d.seats - bookedSeats),
        };
      });

    // Where travellers can start: the basic tour's own location, plus every city that has a partner.
    const baseCityId = (tour as any).baseStartCityId || (tour.destinationId as any)?._id || tour.destinationId;
    const baseCity: any = baseCityId ? await Destination.findById(baseCityId).select("name state").lean() : null;
    const partnerCities: any[] = await Destination.find({ partnerId: { $ne: null }, isActive: true }).select("name state").sort({ name: 1 }).lean();

    // Day cities: show current names (cities can be renamed) and upgrade old single-city days.
    const tourObj: any = tour.toObject();
    const asList = (d: any) =>
      d.destinations?.length ? d.destinations : d.destinationId ? [{ destinationId: d.destinationId, name: d.destinationName }] : [];
    const dayIds = [...new Set<string>((tourObj.itinerary || []).flatMap((d: any) => asList(d).map((x: any) => String(x.destinationId))))];
    const nameMap = new Map<string, string>();
    if (dayIds.length) {
      const names: any[] = await Destination.find({ _id: { $in: dayIds } }).select("name").lean();
      names.forEach((n) => nameMap.set(String(n._id), n.name));
    }
    tourObj.itinerary = (tourObj.itinerary || []).map((d: any) => ({
      ...d,
      destinations: asList(d).map((x: any) => ({ destinationId: String(x.destinationId), name: nameMap.get(String(x.destinationId)) || x.name || "" })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...tourObj,
        departures,
        distanceKm,
        baseStartCity: baseCity ? { id: String(baseCity._id), name: baseCity.name, state: baseCity.state } : null,
        startCities: partnerCities.map((c) => ({ id: String(c._id), name: c.name, state: c.state })),
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

    if (body.itinerary !== undefined) body.itinerary = cleanItinerary(body.itinerary);

    // Dates are managed through partner launches, never through the tour form. Derived fields are protected too.
    delete body.departures;
    delete body.priceInr;
    delete body.discountPercentage;
    delete body.startingPoint;
    delete body.endingPoint;

    let newBase: number | null = null;
    if (body.basePriceInr !== undefined) {
      newBase = Math.round(Number(body.basePriceInr) || 0);
      if (!(newBase > 0)) return NextResponse.json({ error: "Enter a valid base price per person." }, { status: 400 });
      body.basePriceInr = newBase;
    }

    if (body.depositType !== undefined) body.depositType = body.depositType === "amount" ? "amount" : "percentage";
    if (body.depositValue !== undefined) {
      body.depositValue = Math.max(0, Math.min(body.depositType === "amount" ? Infinity : 100, Number(body.depositValue) || 0));
    }

    // Basic-tour location and dates are applied separately from the plain field update.
    const baseSetup = { baseStartCityId: body.baseStartCityId, baseAddressId: body.baseAddressId, baseDepartures: body.baseDepartures };
    delete body.baseStartCityId;
    delete body.baseAddressId;
    delete body.baseDepartures;

    let updated: any = await Tour.findByIdAndUpdate(id, body, { new: true });

    // A new base price flows into every date: launched dates = base + city supplement; basic dates that
    // were still at the old base price follow the new one.
    if (updated && (newBase !== null || baseSetup.baseDepartures !== undefined || baseSetup.baseStartCityId !== undefined)) {
      if (newBase !== null) {
                for (const d of updated.departures || []) {
          if (d.extraPriceInr !== null && d.extraPriceInr !== undefined) d.price = newBase + d.extraPriceInr;
          else if (!d.launchId) d.price = newBase;
        }
      }
      const r = await applyBaseDepartures(updated, baseSetup);
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      refreshTourDerived(updated);
      await updated.save();
    }
    updated = await Tour.findById(id).populate("destinationId", "name state coordinates coverImage");

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
