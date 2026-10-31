import { NextResponse } from "next/server";
import { devSimulatorEnabled, firebaseServerConfigured } from "@/lib/phone-auth";

// Tells the login screen which way to send the code. Read on every request (never frozen at build time), so adding the
// Firebase variables to the server takes effect after a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ firebase: firebaseServerConfigured(), simulator: devSimulatorEnabled() });
  } catch (e: any) {
    // Never a bare 500: the login screen can still fall back to email login.
    return NextResponse.json({ firebase: false, simulator: false, error: String(e?.message || e).slice(0, 200) });
  }
}
