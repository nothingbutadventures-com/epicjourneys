import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { otpMatches, OTP_MAX_ATTEMPTS } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const cleanEmail = String(email || "").toLowerCase().trim();
    const code = String(otp || "").trim();

    if (!cleanEmail || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail }).select("+otpHash +otpExpires +otpAttempts");

    if (!user || user.emailVerified !== false || !user.otpHash || !user.otpExpires) {
      return NextResponse.json({ error: "No pending verification for this email" }, { status: 400 });
    }
    if (user.otpExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
    }
    if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    if (!otpMatches(cleanEmail, code, user.otpHash)) {
      await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerified: true }, $unset: { otpHash: "", otpExpires: "", otpLastSent: "" } }
    );

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
