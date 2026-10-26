import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/Role";
import User from "@/models/User";
import { getAuthFromRequest, isSuperAdmin } from "@/lib/auth";
import { cleanRole } from "@/lib/roles";

const deny = () => NextResponse.json({ error: "Only a super admin can manage roles." }, { status: 403 });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const { id } = await params;
    await connectToDatabase();
    const data = cleanRole(await req.json());
    if (data.name.length < 2) return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
    if (data.invalid) return NextResponse.json({ error: "One of the selected permissions doesn't exist." }, { status: 400 });
    if (data.permissions.length === 0) return NextResponse.json({ error: "Select at least one page this role can access." }, { status: 400 });
    if (await Role.exists({ _id: { $ne: id }, name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return NextResponse.json({ error: "A role with this name already exists." }, { status: 409 });
    }
    const role = await Role.findByIdAndUpdate(id, { name: data.name, description: data.description, permissions: data.permissions }, { new: true });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    const { id } = await params;
    await connectToDatabase();
    const users = await User.countDocuments({ adminRoleId: id });
    if (users > 0) {
      return NextResponse.json({ error: `${users} staff member${users === 1 ? " has" : "s have"} this role. Move or remove them first.` }, { status: 400 });
    }
    await Role.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
