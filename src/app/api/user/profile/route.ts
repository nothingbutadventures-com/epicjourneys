import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A customer's mobile number is their login, so it can't be edited here. Name and (optional) email can.
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    await connectToDatabase();

    const update: any = { name };
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (email) {
        if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
        if (await User.exists({ email, _id: { $ne: auth.userId } })) return NextResponse.json({ error: "That email is already used by another account." }, { status: 409 });
        update.email = email;
      } else {
        update.$unset = { email: 1 };
      }
    }
    const { $unset, ...set } = update;
    const user = await User.findByIdAndUpdate(auth.userId, { $set: set, ...($unset ? { $unset } : {}) }, { new: true }).select("name email phone");
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ success: true, user: { name: user.name, email: user.email || "", phone: user.phone } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
