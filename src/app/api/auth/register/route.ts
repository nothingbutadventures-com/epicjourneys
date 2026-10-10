import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { generateOtp, hashOtp, normalizePhone, sendOtpEmail, OTP_TTL_MS } from "@/lib/otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").toLowerCase().trim();
    const cleanPhone = normalizePhone(String(phone || ""));

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!cleanPhone) {
      return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing && existing.emailVerified !== false) {
      return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }

    const otp = generateOtp();
    const fields = {
      name: cleanName,
      phone: cleanPhone,
      password: await hashPassword(password),
      emailVerified: false,
      otpHash: hashOtp(cleanEmail, otp),
      otpExpires: new Date(Date.now() + OTP_TTL_MS),
      otpAttempts: 0,
      otpLastSent: new Date(),
    };

    if (existing) {
      // Re-registering an unverified account: refresh details and send a new code.
      await User.updateOne({ _id: existing._id }, { $set: fields });
    } else {
      await User.create({ ...fields, email: cleanEmail, role: "user" });
    }

    await sendOtpEmail(cleanEmail, cleanName, otp);

    return NextResponse.json({ success: true, email: cleanEmail });
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }
}
