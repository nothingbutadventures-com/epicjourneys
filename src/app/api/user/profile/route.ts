import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(auth.userId, { name, phone }, { new: true }).select("name email phone");
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ success: true, user: { name: user.name, email: user.email, phone: user.phone } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
