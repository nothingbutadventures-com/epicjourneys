import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { getAuthFromRequest, isSuperAdmin } from "@/lib/auth";

// Staff are admins with a custom role. Super admins are listed for reference; candidates are ordinary users.
export async function GET(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return NextResponse.json({ error: "Only a super admin can manage staff." }, { status: 403 });
    await connectToDatabase();
    if (!Role) {}
    const q = (new URL(req.url).searchParams.get("q") || "").trim();

    const [staff, supers] = await Promise.all([
      User.find({ role: "admin", adminRoleId: { $ne: null } }).select("name email phone adminRoleId createdAt").populate("adminRoleId", "name").sort({ name: 1 }).lean(),
      User.find({ role: "admin", $or: [{ adminRoleId: null }, { adminRoleId: { $exists: false } }] }).select("name email").sort({ name: 1 }).lean(),
    ]);

    let candidates: any[] = [];
    if (q.length >= 2) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      candidates = await User.find({ role: "user", $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("name email phone").sort({ name: 1 }).limit(15).lean();
    }
    return NextResponse.json({ success: true, data: { staff, supers, candidates } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
