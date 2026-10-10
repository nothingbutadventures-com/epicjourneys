import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtp, hashOtp, sendOtpEmail, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || "").toLowerCase().trim();
    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail }).select("+otpLastSent");

    // Same response whether or not the account exists, to avoid leaking registered emails.
    if (!user || user.emailVerified !== false) {
      return NextResponse.json({ success: true });
    }

    const last = user.otpLastSent?.getTime() || 0;
    const wait = OTP_RESEND_COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(wait / 1000)}s before requesting another code` },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          otpHash: hashOtp(cleanEmail, otp),
          otpExpires: new Date(Date.now() + OTP_TTL_MS),
          otpAttempts: 0,
          otpLastSent: new Date(),
        },
      }
    );
    await sendOtpEmail(cleanEmail, user.name, otp);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Could not send code. Please try again." }, { status: 500 });
  }
}
