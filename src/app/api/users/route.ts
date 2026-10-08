import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Destination) {} // ensure model loaded

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const filter: any = {};
    if (role && role !== "all") filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .populate("assignedDestination", "name state")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
