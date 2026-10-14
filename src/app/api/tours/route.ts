import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateDistanceKm } from "@/lib/geo";
import { sanitizeDepartures, deriveFromDepartures } from "@/lib/departures";

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
    if (!all) filter.isActive = true;
    if (destinationId) filter.destinationId = destinationId;
    if (toCity) filter.destinationId = toCity;
    if (fromCity) filter["departures.cityId"] = fromCity;
    if (state && state !== "All") filter.state = state;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { startingPoint: { $regex: search, $options: "i" } },
        { targetCity: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    const isAdmin = getAuthFromRequest(req)?.role === "admin";
    const tours = await Tour.find(filter)
      .populate("destinationId", "name state coordinates coverImage")
      .populate(
        isAdmin
          ? { path: "departures.cityId", select: "name state coordinates addresses partnerId", populate: { path: "partnerId", select: "phone secondaryPhone" } }
          : { path: "departures.cityId", select: "name state coordinates" }
      )
      .sort({ createdAt: -1 })
      .lean();

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;
    const radius = radiusStr && radiusStr !== "all" ? parseFloat(radiusStr) : null;

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
      return {
        ...tour,
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
      startingPoint,
      endingPoint,
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
        { error: "Title and target city are required." },
        { status: 400 }
      );
    }

    const deps = await sanitizeDepartures(body.departures);
    if (deps.error) {
      return NextResponse.json({ error: deps.error }, { status: 400 });
    }
    if (!deps.data || deps.data.length === 0) {
      return NextResponse.json(
        { error: "Add at least one date with a start & end city and price." },
        { status: 400 }
      );
    }
    const derived: any = deriveFromDepartures(deps.data, deps.cities!);

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

    // Start/end city now lives on each date; the tour-level values mirror the first date.
    const finalStartingPoint = derived.startingPoint || dest.name;
    const finalEndingPoint = derived.endingPoint || dest.name;

    const tour = await Tour.create({
      title: title.trim(),
      slug,
      shortDescription: shortDescription || "",
      description: description || "",
      state: dest.state,
      destinationId,
      startingPoint: finalStartingPoint,
      endingPoint: finalEndingPoint,
      targetCity: dest.name,
      durationDays: Number(durationDays) || 3,
      durationNights: Number(durationNights) || 2,
      priceInr: derived.priceInr,
      highlights: Array.isArray(highlights) ? highlights : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      travelStyles: Array.isArray(body.travelStyles) ? body.travelStyles : [],
      physicalRating: body.physicalRating || "Easy / Relaxed",
      discountPercentage: derived.discountPercentage || 0,
      maxGroupSize: Number(maxGroupSize) || 15,
      singleRoomPriceInr: Math.max(0, Number(body.singleRoomPriceInr) || 0),
      depositType: body.depositType === "amount" ? "amount" : "percentage",
      depositValue: Math.max(0, Math.min(body.depositType === "amount" ? Infinity : 100, Number(body.depositValue) || 0)),
      departures: deps.data,
      coverImage:
        coverImage ||
        dest.coverImage ||
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
      images: Array.isArray(images) ? images : [],
      isActive: true,
    });

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
