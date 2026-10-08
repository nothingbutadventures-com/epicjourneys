import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateDistanceKm } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Destination) {}

    const { searchParams } = new URL(req.url);
    const destinationId = searchParams.get("destinationId");
    const state = searchParams.get("state");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius");

    const filter: any = {};
    if (!all) filter.isActive = true;
    if (destinationId) filter.destinationId = destinationId;
    if (state && state !== "All") filter.state = state;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { startingPoint: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    const tours = await Tour.find(filter)
      .populate("destinationId", "name state coordinates coverImage")
      .sort({ createdAt: -1 })
      .lean();

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;
    const radius = radiusStr && radiusStr !== "all" ? parseFloat(radiusStr) : null;

    let processedTours = tours.map((tour: any) => {
      let distanceKm: number | null = null;
      const destCoords = tour.destinationId?.coordinates;
      if (
        userLat !== null &&
        userLng !== null &&
        destCoords?.lat !== undefined &&
        destCoords?.lng !== undefined
      ) {
        distanceKm = calculateDistanceKm(
          userLat,
          userLng,
          destCoords.lat,
          destCoords.lng
        );
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

    if (!title || !destinationId || !priceInr || !state) {
      return NextResponse.json(
        { error: "Title, state, destination, and price are required." },
        { status: 400 }
      );
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

    // Starting destination and ending destination match
    const finalStartingPoint = startingPoint || dest.name;
    const finalEndingPoint = endingPoint || dest.name;

    const tour = await Tour.create({
      title: title.trim(),
      slug,
      shortDescription: shortDescription || "",
      description: description || "",
      state: state || dest.state,
      destinationId,
      startingPoint: finalStartingPoint,
      endingPoint: finalEndingPoint,
      durationDays: Number(durationDays) || 3,
      durationNights: Number(durationNights) || 2,
      priceInr: Number(priceInr),
      highlights: Array.isArray(highlights) ? highlights : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      travelStyles: Array.isArray(body.travelStyles) ? body.travelStyles : [],
      physicalRating: body.physicalRating || "Easy / Relaxed",
      journeyType: body.journeyType || "Guided Group Tour",
      discountPercentage: Number(body.discountPercentage) || 0,
      maxGroupSize: Number(maxGroupSize) || 15,
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
