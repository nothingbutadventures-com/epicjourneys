import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import { getAuthFromRequest, signToken } from "@/lib/auth";
import { loadStaffPerms } from "@/lib/staff";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await connectToDatabase();
    if (!Destination) {}

    const user = await User.findById(auth.userId)
      .select("-password")
      .populate("assignedDestination");

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Admin panel access: "all" for super admins, the role's page list for staff. Staff get a fresh token
    // so role changes made by a super admin apply on their next page load.
    const perms = user.role === "admin" ? await loadStaffPerms(user as any) : undefined;
    const staffToken = perms && user.role === "admin" ? signToken({ userId: user._id.toString(), email: user.email, role: "admin", name: user.name, perms }) : undefined;
    const response = NextResponse.json({
      authenticated: true,
      permissions: user.role === "admin" ? perms ?? "all" : undefined,
      ...(staffToken ? { token: staffToken } : {}),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedDestination: user.assignedDestination,
      },
    });
    if (staffToken) response.cookies.set("token", staffToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60, path: "/" });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("token");
  return response;
}
