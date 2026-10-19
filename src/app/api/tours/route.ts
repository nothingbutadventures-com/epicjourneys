import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { applyBaseDepartures, cleanItinerary } from "@/lib/launch";
import { calculateDistanceKm } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Destination || !User) {}

    const { searchParams } = new URL(req.url);
    const destinationId = searchParams.get("destinationId");
    const toCity = searchParams.get("to"); // target city (Destination id)
    const fromCity = searchParams.get("from"); // start & end city (Destination id)
    const state = searchParams.get("state");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius");

    const filter: any = {};
    const and: any[] = [];
    if (!all) filter.isActive = true;
    if (destinationId) filter.destinationId = destinationId;
    // A tour matches a "To" city when it is based there or when any day of its itinerary visits it.
    if (toCity) {
      and.push({ $or: [{ destinationId: toCity }, { "itinerary.destinations.destinationId": toCity }, { "itinerary.destinationId": toCity }] });
    }
    if (fromCity) filter["departures.cityId"] = fromCity;
    if (state && state !== "All") filter.state = state;
    if (search) {
      and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { startingPoint: { $regex: search, $options: "i" } },
          { targetCity: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
        ],
      });
    }
    if (and.length) filter.$and = and;

    const isAdmin = getAuthFromRequest(req)?.role === "admin";
    const tours = await Tour.find(filter)
      .populate("destinationId", "name state coordinates coverImage")
      .populate({
        path: "departures.cityId",
        select: "name state coordinates addresses partnerId",
        populate: {
          path: "partnerId",
          select: "name email companyName phone secondaryPhone assignedDestination",
        },
      })
      .populate({
        path: "departures.partnerId",
        select: "name email companyName phone assignedDestination",
      })
      .sort({ createdAt: -1 })
      .lean();

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;
    const radius = radiusStr && radiusStr !== "all" ? parseFloat(radiusStr) : null;

    // Every city visited on any itinerary day, so searches and filters can treat them as target cities.
    const dayCityIds = new Set<string>();
    const cityIdsOf = (d: any): string[] =>
      d.destinations?.length ? d.destinations.map((x: any) => String(x.destinationId)) : d.destinationId ? [String(d.destinationId)] : [];
    for (const t of tours as any[]) for (const d of t.itinerary || []) cityIdsOf(d).forEach((id) => dayCityIds.add(id));
    const cityDocs: any[] = dayCityIds.size ? await Destination.find({ _id: { $in: [...dayCityIds] } }).select("name state coordinates").lean() : [];
    const cityMap = new Map(cityDocs.map((c) => [String(c._id), c]));

    // Distance is measured to the nearest start/end city of the tour (or only the selected one),
    // falling back to the target city for tours without dated departures.
    let processedTours = tours.map((tour: any) => {
      let distanceKm: number | null = null;
      if (userLat !== null && userLng !== null) {
        let cities = (tour.departures || [])
          .map((d: any) => d.cityId)
          .filter((c: any) => c?.coordinates);
        if (fromCity) cities = cities.filter((c: any) => String(c._id) === fromCity);
        if (cities.length === 0 && tour.destinationId?.coordinates) cities = [tour.destinationId];
        const dists = cities.map((c: any) =>
          calculateDistanceKm(userLat, userLng, c.coordinates.lat, c.coordinates.lng)
        );
        if (dists.length) distanceKm = Math.min(...dists);
      }
      const seen = new Set<string>();
      const itineraryCities = (tour.itinerary || [])
        .flatMap((d: any) => cityIdsOf(d))
        .filter((id: string) => cityMap.has(id) && !seen.has(id) && seen.add(id))
        .map((id: string) => cityMap.get(id));
      return {
        ...tour,
        itineraryCities,
        distanceKm,
      };
    });

    if (userLat !== null && userLng !== null) {
      processedTours.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      if (radius !== null && !isNaN(radius)) {
        processedTours = processedTours.filter(
          (t) => t.distanceKm !== null && t.distanceKm <= radius
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: processedTours.length,
      data: processedTours,
    });
  } catch (error: any) {
    console.error("GET /api/tours error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      title,
      shortDescription,
      description,
      state,
      destinationId,
      durationDays,
      durationNights,
      priceInr,
      highlights,
      itinerary,
      inclusions,
      exclusions,
      maxGroupSize,
      coverImage,
      images,
    } = body;

    if (!title || !destinationId) {
      return NextResponse.json(
        { error: "Title and tour destination are required." },
        { status: 400 }
      );
    }

    // Dates and start/end cities come later, from partner launches. The admin only sets the base price.
    const basePrice = Math.round(Number(body.basePriceInr ?? priceInr) || 0);
    if (!(basePrice > 0)) {
      return NextResponse.json({ error: "Enter the base price per person." }, { status: 400 });
    }

    const dest = await Destination.findById(destinationId);
    if (!dest) {
      return NextResponse.json(
        { error: "Selected destination not found." },
        { status: 404 }
      );
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = baseSlug;
    let count = 1;
    while (await Tour.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const tour = await Tour.create({
      title: title.trim(),
      slug,
      shortDescription: shortDescription || "",
      description: description || "",
      state: dest.state,
      destinationId,
      startingPoint: "",
      endingPoint: "",
      targetCity: dest.name,
      durationDays: Number(durationDays) || 3,
      durationNights: Number(durationNights) || 2,
      priceInr: basePrice,
      basePriceInr: basePrice,
      highlights: Array.isArray(highlights) ? highlights : [],
      itinerary: cleanItinerary(itinerary),
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      travelStyles: Array.isArray(body.travelStyles) ? body.travelStyles : [],
      physicalRating: body.physicalRating || "Easy / Relaxed",
      discountPercentage: 0,
      maxGroupSize: Number(maxGroupSize) || 15,
      singleRoomPriceInr: Math.max(0, Number(body.singleRoomPriceInr) || 0),
      depositType: body.depositType === "amount" ? "amount" : "percentage",
      depositValue: Math.max(0, Math.min(body.depositType === "amount" ? Infinity : 100, Number(body.depositValue) || 0)),
      departures: [],
      coverImage:
        coverImage ||
        dest.coverImage ||
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
      images: Array.isArray(images) ? images : [],
      isActive: true,
    });

    // Basic tour setup: its own start/end location and dates ("Joining / Leaving").
    if (body.baseStartCityId !== undefined || body.baseDepartures !== undefined) {
      const r = await applyBaseDepartures(tour, {
        baseStartCityId: body.baseStartCityId,
        baseAddressId: body.baseAddressId,
        baseDepartures: body.baseDepartures,
      });
      if (r.error) {
        await Tour.deleteOne({ _id: tour._id });
        return NextResponse.json({ error: r.error }, { status: 400 });
      }
      await tour.save();
    }

    const populated = await Tour.findById(tour._id).populate(
      "destinationId",
      "name state coordinates coverImage"
    );

    return NextResponse.json({
      success: true,
      data: populated,
    });
  } catch (error: any) {
    console.error("POST /api/tours error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
