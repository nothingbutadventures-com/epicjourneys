import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";
import { sanitizeAddresses } from "@/lib/address";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!User) {}

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const activeOnly = searchParams.get("all") !== "true";

    const filter: any = {};
    if (activeOnly) filter.isActive = true;
    if (state && state !== "All") filter.state = state;

    const destinations = await Destination.find(filter)
      .populate("partnerId", "name email phone secondaryPhone")
      .sort({ name: 1 })
      .lean();

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
    const { name, state, coordinates, description, coverImage, partnerId } = body;

    if (!name || !state || !coordinates?.lat || !coordinates?.lng) {
      return NextResponse.json(
        { error: "Name, state, and valid coordinates (lat, lng) are required." },
        { status: 400 }
      );
    }

    const addrs = sanitizeAddresses(body.addresses);
    if (addrs.error) return NextResponse.json({ error: addrs.error }, { status: 400 });

    const newDestination = await Destination.create({
      name: name.trim(),
      state: state.trim(),
      coordinates: {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      },
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
