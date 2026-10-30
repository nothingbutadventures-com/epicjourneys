import { NextResponse } from "next/server";
import { devSimulatorEnabled, firebaseServerConfigured } from "@/lib/phone-auth";

// Tells the login screen which way to send the code.
export async function GET() {
  return NextResponse.json({ firebase: firebaseServerConfigured(), simulator: devSimulatorEnabled() });
}
