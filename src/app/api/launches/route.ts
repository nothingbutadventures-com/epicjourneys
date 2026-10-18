import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import User from "@/models/User";
import Destination from "@/models/Destination";
import TourLaunch from "@/models/TourLaunch";
import { getAuthFromRequest } from "@/lib/auth";
import { addMessage, composePartnerMessage, isObjectId, sanitizeLaunchPatch, sanitizeNotes } from "@/lib/launch";
import type { LaunchStatus } from "@/lib/launch-shared";

const OPEN: LaunchStatus[] = ["submitted", "awaiting_partner", "changes_requested", "partner_approved"];

const populate = (q: any) =>
  q
    .populate("tourId", "title slug coverImage durationDays durationNights basePriceInr state")
    .populate("cityId", "name state")
    .populate("partnerId", "name email phone companyName");

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
    await connectToDatabase();
    if (!Tour || !User || !Destination) {}

    const filter: any = {};
    if (auth.role === "partner") filter.partnerId = auth.userId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const tourId = searchParams.get("tourId");
    if (status && status !== "all") filter.status = status;
    if (tourId && isObjectId(tourId)) filter.tourId = tourId;

    const items = await populate(TourLaunch.find(filter)).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("GET /api/launches error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** A partner asks to start a tour from their city (admins can also open one on a partner's behalf). */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
    await connectToDatabase();
    const body = await req.json();

    if (!isObjectId(body.tourId)) return NextResponse.json({ error: "Choose a tour." }, { status: 400 });
    const tour: any = await Tour.findById(body.tourId).lean();
    if (!tour || !tour.isActive) return NextResponse.json({ error: "Tour not found." }, { status: 404 });

    // Whose city is it?
    let partnerId: string | null = null;
    let cityId: string | null = null;
    if (auth.role === "partner") {
      const me: any = await User.findById(auth.userId).select("assignedDestination").lean();
      partnerId = auth.userId;
      cityId = me?.assignedDestination ? String(me.assignedDestination) : null;
      if (!cityId) return NextResponse.json({ error: "No city is assigned to your account yet. Please contact the admin." }, { status: 400 });
    } else {
      if (body.partnerId) {
        if (!isObjectId(body.partnerId)) return NextResponse.json({ error: "Invalid partner." }, { status: 400 });
        const p: any = await User.findOne({ _id: body.partnerId, role: "partner" }).select("assignedDestination").lean();
        if (!p) return NextResponse.json({ error: "Partner not found." }, { status: 404 });
        partnerId = String(body.partnerId);
        cityId = body.cityId || (p.assignedDestination ? String(p.assignedDestination) : null);
      } else cityId = body.cityId || null;
      if (!cityId || !isObjectId(cityId)) return NextResponse.json({ error: "Choose the start & end city." }, { status: 400 });
    }

    const city: any = await Destination.findById(cityId).select("name addresses").lean();
    if (!city) return NextResponse.json({ error: "City not found." }, { status: 404 });

    // Partners only describe the extra days they have in mind; the admin builds the actual itinerary.
    const isPartner = auth.role === "partner";
    const startNotes = isPartner ? sanitizeNotes(body.startNotes) : [];
    const endNotes = isPartner ? sanitizeNotes(body.endNotes) : [];
    if (isPartner) {
      delete body.startItinerary;
      delete body.endItinerary;
    }

    const parsed = sanitizeLaunchPatch(body, { tour, city }, { admin: auth.role === "admin" });
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const patch = parsed.data!;
    if (!patch.dates?.length) return NextResponse.json({ error: "Add at least one start date." }, { status: 400 });

    // Avoid piling up duplicate requests for the same city and date.
    const startKeys = patch.dates.map((d) => d.startDate);
    const dup = await TourLaunch.findOne({
      tourId: tour._id,
      cityId,
      status: { $in: OPEN },
      "dates.startDate": { $in: startKeys },
    }).select("_id");
    if (dup) return NextResponse.json({ error: "There is already an open request for this tour from this city on one of those dates." }, { status: 409 });

    const who: any = await User.findById(auth.userId).select("name").lean();
    const launch: any = new TourLaunch({
      tourId: tour._id,
      cityId,
      partnerId,
      addressId: patch.addressId || null,
      dates: patch.dates,
      startItinerary: patch.startItinerary || [],
      endItinerary: patch.endItinerary || [],
      extraPriceInr: patch.extraPriceInr ?? null,
      partnerNotes: patch.partnerNotes || "",
      startNotes,
      endNotes,
      status: "submitted",
      revision: 1,
    });
    addMessage(launch, auth.role === "admin" ? "admin" : "partner", who?.name || auth.name, "request", composePartnerMessage(startNotes, endNotes, patch.partnerNotes || ""));
    await launch.save();

    return NextResponse.json({ success: true, data: launch });
  } catch (error: any) {
    console.error("POST /api/launches error:", error);
    return NextResponse.json({ error: error.message || "Could not create the request" }, { status: 500 });
  }
}
