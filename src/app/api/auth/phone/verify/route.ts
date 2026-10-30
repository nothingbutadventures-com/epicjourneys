import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { devCheckCode, devConsumeCode, devSimulatorEnabled, firebaseServerConfigured, phoneFromFirebaseToken, toLocalPhone } from "@/lib/phone-auth";
import { sessionResponse } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One endpoint for customer login and registration. The caller proves the number with a Firebase ID token
 * (or, in local development without Firebase keys, with the code the simulator printed).
 *  - Number already registered  -> signed in.
 *  - New number, no name sent    -> 404 NEW_ACCOUNT, so the screen can ask for a name (and an optional email).
 *  - New number with a name      -> account created and signed in.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Prove the number
    let phone: string | null = null;
    let simulated = false;
    if (firebaseServerConfigured()) {
      if (!body.idToken) return NextResponse.json({ error: "Verify your mobile number first." }, { status: 400 });
      try {
        phone = await phoneFromFirebaseToken(String(body.idToken));
      } catch (e: any) {
        return NextResponse.json({ error: /Indian/.test(e.message) ? e.message : "Couldn't verify that code. Please try again." }, { status: 401 });
      }
    } else if (devSimulatorEnabled()) {
      phone = toLocalPhone(body.phone);
      if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
      const r = devCheckCode(phone, String(body.code || ""));
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 401 });
      simulated = true;
    } else {
      return NextResponse.json({ error: "Mobile login isn't set up yet. Please try again later.", code: "NOT_CONFIGURED" }, { status: 503 });
    }

    await connectToDatabase();

    // 2. Existing customer? (the oldest account wins if an old duplicate exists)
    const existing: any = await User.findOne({ phone, role: "user" }).sort({ createdAt: 1 });
    if (existing) {
      if (!existing.phoneVerified) {
        existing.phoneVerified = true;
        await existing.save();
      }
      if (simulated) devConsumeCode(phone);
      return sessionResponse(existing);
    }

    // 3. New customer
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return NextResponse.json({ error: "Tell us your name to finish creating your account.", code: "NEW_ACCOUNT", phone }, { status: 404 });
    const email = String(body.email ?? "").trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email address doesn't look right. Leave it empty if you'd rather skip it." }, { status: 400 });
    if (email && (await User.exists({ email }))) return NextResponse.json({ error: "That email is already used by another account. Leave it empty or use a different one." }, { status: 409 });

    const created = await User.create({ name, phone, phoneVerified: true, role: "user", ...(email ? { email, emailVerified: false } : {}) });
    if (simulated) devConsumeCode(phone);
    return sessionResponse(created, { created: true });
  } catch (error: any) {
    console.error("Phone auth error:", error);
    if (error?.code === 11000) return NextResponse.json({ error: "That email or number is already registered." }, { status: 409 });
    return NextResponse.json({ error: "Couldn't sign you in. Please try again." }, { status: 500 });
  }
}
