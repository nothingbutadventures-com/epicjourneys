import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import JobApplication from "@/models/JobApplication";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    await connectToDatabase();
    // The resume file itself is excluded; it has its own download route.
    const items = await JobApplication.find({}).select("-resume.data").sort({ createdAt: -1 }).limit(2000).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
