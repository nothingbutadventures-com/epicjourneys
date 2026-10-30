import { NextRequest, NextResponse } from "next/server";
import { devSendCode, devSimulatorEnabled, toLocalPhone } from "@/lib/phone-auth";

// Local development only (no Firebase keys): no SMS is sent; the code is shown on screen and printed in the server console.
export async function POST(req: NextRequest) {
  if (!devSimulatorEnabled()) return NextResponse.json({ error: "Not available." }, { status: 404 });
  const { phone } = await req.json().catch(() => ({}));
  const local = toLocalPhone(phone);
  if (!local) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  const r = devSendCode(local);
  // The simulator only exists outside production, so showing the code on screen is safe and saves hunting in the console.
  return r.ok ? NextResponse.json({ success: true, devCode: r.code }) : NextResponse.json({ error: r.error }, { status: 429 });
}
