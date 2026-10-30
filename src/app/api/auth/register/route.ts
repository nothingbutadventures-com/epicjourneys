import { NextResponse } from "next/server";

// Customers now register with their mobile number (POST /api/auth/phone/verify). Email registration is closed.
export async function POST() {
  return NextResponse.json({ error: "Registration now uses your mobile number. Please use the sign-up page." }, { status: 410 });
}
