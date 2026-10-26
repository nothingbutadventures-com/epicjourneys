import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    // Only profile fields can change here. Roles and passwords have their own, stricter flows.
    const patch: Record<string, unknown> = {};
    for (const k of ["name", "phone", "isActive"]) if (body[k] !== undefined) patch[k] = body[k];

    const updated = await User.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).select("-password");
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (auth?.role !== "admin") return deny();
    await connectToDatabase();
    const { id } = await params;
    if (auth.userId === id) return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
    const target: any = await User.findById(id).select("role");
    if (target?.role === "admin") return NextResponse.json({ error: "Admin accounts can't be deleted here. Remove their role first." }, { status: 400 });
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
