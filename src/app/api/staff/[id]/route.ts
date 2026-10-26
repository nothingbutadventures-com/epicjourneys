import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { getAuthFromRequest, isSuperAdmin } from "@/lib/auth";

// Assign (roleId) or remove (roleId: null) an admin-panel role. Only ordinary users and existing staff qualify.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!isSuperAdmin(auth)) return NextResponse.json({ error: "Only a super admin can manage staff." }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    if (auth!.userId === id) return NextResponse.json({ error: "You can't change your own access." }, { status: 400 });
    await connectToDatabase();
    const { roleId } = await req.json();

    const user: any = await User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const isStaff = user.role === "admin" && user.adminRoleId;
    if (user.role === "admin" && !user.adminRoleId) return NextResponse.json({ error: "Super admins always have full access." }, { status: 400 });
    if (user.role !== "user" && !isStaff) return NextResponse.json({ error: "Only customer accounts can be given an admin role." }, { status: 400 });

    if (roleId) {
      if (!mongoose.isValidObjectId(roleId) || !(await Role.exists({ _id: roleId }))) return NextResponse.json({ error: "Role not found" }, { status: 404 });
      user.role = "admin";
      user.adminRoleId = roleId;
    } else {
      user.role = "user";
      user.adminRoleId = null;
    }
    await user.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
