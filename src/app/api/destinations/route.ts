import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";
import { sanitizeAddresses } from "@/lib/address";
import { resolvePlace } from "@/lib/location";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!User) {}

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const country = searchParams.get("country");
    const activeOnly = searchParams.get("all") !== "true";

    const filter: any = {};
    if (activeOnly) filter.isActive = true;
    if (state && state !== "All") filter.state = state;
    // Destinations saved before countries existed have no country: they are all India.
    if (country && country !== "All") filter.country = /^india$/i.test(country) ? { $in: ["India", null] } : country;

    // Optional server-side search with a cap, used by pickers so big lists stay fast.
    const q = (searchParams.get("search") || "").trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { state: rx }, { country: rx }, ...(/india/i.test(q) ? [{ country: null }] : [])];
    }
    const limit = Math.min(100, Math.max(0, parseInt(searchParams.get("limit") || "0", 10) || 0));

    let query = Destination.find(filter)
      .populate("partnerId", "name email phone secondaryPhone")
      .sort({ name: 1 });
    if (limit) query = query.limit(limit);
    const destinations = await query.lean();

    // Attach real tour counts from MongoDB
    const destinationIds = destinations.map((d) => d._id);
    const tourCounts = await Tour.aggregate([
      { $match: { destinationId: { $in: destinationIds }, isActive: true } },
      { $group: { _id: "$destinationId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    tourCounts.forEach((tc) => countMap.set(tc._id.toString(), tc.count));

    // Addresses and partner contact details are for admins only.
    const isAdmin = getAuthFromRequest(req)?.role === "admin";
    const destinationsWithCounts = destinations.map((dest: any) => {
      const { addresses, partnerId, ...rest } = dest;
      return {
        ...rest,
        // Public callers only learn whether a partner exists, never who.
        hasPartner: Boolean(partnerId),
        ...(isAdmin ? { addresses, partnerId } : {}),
        tourCount: countMap.get(dest._id.toString()) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: destinationsWithCounts,
    });
  } catch (error: any) {
    console.error("GET /api/destinations error:", error);
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
    const { name, coordinates, description, coverImage, partnerId } = body;

    const lat = Number(coordinates?.lat);
    const lng = Number(coordinates?.lng);
    if (!String(name ?? "").trim() || coordinates?.lat === "" || coordinates?.lng === "" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ error: "A name and valid coordinates (latitude and longitude) are required." }, { status: 400 });
    }
    const place = resolvePlace(body);
    if ("error" in place) return NextResponse.json({ error: place.error }, { status: 400 });
    const { country, state } = place;

    // The same city can't be added twice (the pickers search by name, so duplicates would be confusing).
    const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dupe = await Destination.findOne({ name: new RegExp(`^${esc(String(name).trim())}$`, "i"), state: new RegExp(`^${esc(state)}$`, "i") }).select("_id").lean();
    if (dupe) return NextResponse.json({ error: `${String(name).trim()}, ${state} already exists. Search for it instead.` }, { status: 409 });

    const addrs = sanitizeAddresses(body.addresses);
    if (addrs.error) return NextResponse.json({ error: addrs.error }, { status: 400 });

    const newDestination = await Destination.create({
      name: name.trim(),
      country,
      state,
      coordinates: { lat, lng },
      description: description || "",
      coverImage:
        coverImage ||
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
      partnerId: partnerId || null,
      addresses: addrs.data,
      isActive: true,
    });

    if (partnerId) {
      await User.findByIdAndUpdate(partnerId, {
        assignedDestination: newDestination._id,
      });
    }

    return NextResponse.json({
      success: true,
      data: newDestination,
    });
  } catch (error: any) {
    console.error("POST /api/destinations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
