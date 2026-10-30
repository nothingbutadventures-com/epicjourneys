import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import { comparePassword, signToken } from "@/lib/auth";
import { loadStaffPerms } from "@/lib/staff";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Ensure Destination model is registered
    if (!Destination) {}

    const body = await req.json();
    const { email, password, requiredRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate(
      "assignedDestination"
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json({ error: "This account signs in with a mobile number. Use the mobile number option on the login page." }, { status: 401 });
    }
    const isMatch = await comparePassword(password, user.password as string);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.emailVerified === false) {
      return NextResponse.json(
        { error: "Please verify your email to continue", code: "EMAIL_NOT_VERIFIED", email: user.email },
        { status: 403 }
      );
    }

    if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
      return NextResponse.json(
        { error: `Access denied. You do not have ${requiredRole} privileges.` },
        { status: 403 }
      );
    }

    const perms = await loadStaffPerms(user as any);
    const token = signToken({
      ...(perms ? { perms } : {}),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      assignedDestination: user.assignedDestination
        ? (user.assignedDestination as any)._id?.toString()
        : undefined,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedDestination: user.assignedDestination,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: perms ? 2 * 60 * 60 : 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
