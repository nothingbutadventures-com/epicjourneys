import { NextResponse } from "next/server";
import { devSimulatorEnabled, firebaseServerConfigured } from "@/lib/phone-auth";

// Tells the login screen which way to send the code. Read on every request (never frozen at build time), so adding the
// Firebase variables to the server takes effect after a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ firebase: firebaseServerConfigured(), simulator: devSimulatorEnabled() });
}
