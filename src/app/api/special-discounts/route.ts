import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SpecialDiscount from "@/models/SpecialDiscount";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";
import { campaignStatus, cleanCampaign, toIstDay } from "@/lib/special-discounts";

const isAdmin = (req: NextRequest) => getAuthFromRequest(req)?.role === "admin";
const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const liveOnly = new URL(req.url).searchParams.get("active") === "true";
    const now = new Date();

    // Public (and the tour form): only offers that are live right now.
    if (liveOnly) {
      const list: any[] = await SpecialDiscount.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).lean();
      return NextResponse.json({ success: true, data: list.map((c) => ({ _id: c._id, name: c.name, travelStyle: c.travelStyle, percentage: c.percentage, endsAt: c.endDate })) });
    }

    if (!isAdmin(req)) return deny();
    const list: any[] = await SpecialDiscount.find({}).sort({ startDate: -1 }).lean();
    const styles = [...new Set(list.map((c) => c.travelStyle))];
    const counts = await Tour.aggregate([{ $match: { isActive: true, travelStyles: { $in: styles } } }, { $unwind: "$travelStyles" }, { $match: { travelStyles: { $in: styles } } }, { $group: { _id: "$travelStyles", n: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [c._id, c.n]));
    return NextResponse.json({
      success: true,
      data: list.map((c) => ({ ...c, startDay: toIstDay(c.startDate), endDay: toIstDay(c.endDate), status: campaignStatus(c, now), tours: countMap.get(c.travelStyle) || 0 })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return deny();
    await connectToDatabase();
    const c: any = await cleanCampaign(await req.json());
    if (c.error) return NextResponse.json({ error: c.error }, { status: c.status || 400 });
    const created = await SpecialDiscount.create(c.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
