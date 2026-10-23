import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import Tour from "@/models/Tour";

// Public directory: only active cities that have a partner, with the business contact details travellers need.
export async function GET() {
  try {
    await connectToDatabase();
    if (!User) {}
    const cities: any[] = await Destination.find({ isActive: true, partnerId: { $ne: null } })
      .populate("partnerId", "name companyName email phone secondaryPhone")
      .select("name state description coverImage addresses partnerId")
      .sort({ state: 1, name: 1 })
      .lean();

    const ids = cities.map((c) => c._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = await Tour.aggregate([
      { $match: { isActive: true, "departures.cityId": { $in: ids } } },
      { $unwind: "$departures" },
      { $match: { "departures.cityId": { $in: ids }, "departures.startDate": { $gte: today } } },
      { $group: { _id: { city: "$departures.cityId", tour: "$_id" } } },
      { $group: { _id: "$_id.city", tours: { $sum: 1 } } },
    ]);
    const tourMap = new Map(counts.map((c) => [String(c._id), c.tours]));

    const data = cities
      .filter((c) => c.partnerId)
      .map((c) => ({
        id: String(c._id),
        city: c.name,
        state: c.state,
        description: c.description || "",
        coverImage: c.coverImage || "",
        liveTours: tourMap.get(String(c._id)) || 0,
        partner: {
          name: c.partnerId.name,
          company: c.partnerId.companyName || "",
          email: c.partnerId.email,
          phone: c.partnerId.phone || "",
          secondaryPhone: c.partnerId.secondaryPhone || "",
        },
        meetingPoints: (c.addresses || []).map((a: any) => ({
          label: a.label,
          address: a.address,
          landmark: a.landmark || "",
          mapUrl: a.mapUrl || "",
          mobile: a.mobile || c.partnerId.phone || "",
        })),
      }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: "Could not load partners" }, { status: 500 });
  }
}
