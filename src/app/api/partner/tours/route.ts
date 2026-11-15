import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanFoodPlan } from "@/lib/food-plans";
import { cleanFaqs } from "@/lib/faqs";
import { cleanItinerary, applyBaseDepartures } from "@/lib/launch";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "partner" && auth.role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized. Partner access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    if (!Destination || !User) {}

    const filter: any = {};
    if (auth.role === "partner") {
      filter.$or = [
        { partnerId: auth.userId },
        { createdByPartner: true, partnerId: auth.userId },
      ];
    } else {
      filter.createdByPartner = true;
    }

    const tours = await Tour.find(filter)
      .populate("destinationId", "name state coordinates coverImage")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tours });
  } catch (error: any) {
    console.error("GET /api/partner/tours error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "partner" && auth.role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized. Partner access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      title,
      shortDescription,
      description,
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

    const basePrice = Math.round(Number(body.basePriceInr ?? priceInr) || 0);
    if (!(basePrice > 0)) {
      return NextResponse.json({ error: "Enter a valid base price per person." }, { status: 400 });
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
      foodPlan: cleanFoodPlan(body.foodPlan),
      faqs: cleanFaqs(body.faqs),
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
      isActive: true, // Published directly by partner
      createdByPartner: true,
      partnerId: auth.userId || null,
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
    console.error("POST /api/partner/tours error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

