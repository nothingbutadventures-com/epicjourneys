import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/Role";
import User from "@/models/User";
import { getAuthFromRequest, isSuperAdmin } from "@/lib/auth";
import { cleanRole } from "@/lib/roles";

const deny = () => NextResponse.json({ error: "Only a super admin can manage roles." }, { status: 403 });

export async function GET(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    await connectToDatabase();
    const [roles, counts] = await Promise.all([
      Role.find({}).sort({ createdAt: -1 }).lean(),
      User.aggregate([{ $match: { adminRoleId: { $ne: null } } }, { $group: { _id: "$adminRoleId", n: { $sum: 1 } } }]),
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c.n]));
    return NextResponse.json({ success: true, data: roles.map((r: any) => ({ ...r, userCount: map.get(String(r._id)) || 0 })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSuperAdmin(getAuthFromRequest(req))) return deny();
    await connectToDatabase();
    const data = cleanRole(await req.json());
    if (data.name.length < 2) return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
    if (data.invalid) return NextResponse.json({ error: "One of the selected permissions doesn't exist." }, { status: 400 });
    if (data.permissions.length === 0) return NextResponse.json({ error: "Select at least one page this role can access." }, { status: 400 });
    if (await Role.exists({ name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return NextResponse.json({ error: "A role with this name already exists." }, { status: 409 });
    }
    const role = await Role.create({ name: data.name, description: data.description, permissions: data.permissions });
    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
