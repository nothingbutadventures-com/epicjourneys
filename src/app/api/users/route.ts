import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Role from "@/models/Role";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    await connectToDatabase();
    if (!Destination || !Role) {} // ensure models loaded

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const filter: any = {};
    if (role && role !== "all") filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .populate("assignedDestination", "name state")
      .populate("adminRoleId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
