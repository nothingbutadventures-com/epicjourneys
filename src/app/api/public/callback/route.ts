import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";

export const dynamic = "force-dynamic";

// Best-effort limit per IP (per server instance): 6 requests an hour.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
}

const clean = (v: unknown, max = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Public form posts from the homepage (callback requests and newsletter sign-ups) land in the CRM as new leads. */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await req.json().catch(() => ({}));
    if (body.website) return NextResponse.json({ success: true }); // honeypot: bots fill hidden fields
    if (limited(ip)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    await connectToDatabase();

    if (body.type === "newsletter") {
      const email = clean(body.email, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      await Lead.create({ title: "Newsletter sign-up", customerName: "Newsletter subscriber", customerEmail: email, stage: "new", priority: "low", source: "website", requirements: "Wants new tour and sale alerts." });
      return NextResponse.json({ success: true });
    }

    const name = clean(body.name, 80);
    const phone = String(body.phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const city = clean(body.city, 80);
    const destination = clean(body.destination, 120);
    if (name.length < 2) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    if (!city) return NextResponse.json({ error: "Tell us your city." }, { status: 400 });
    if (!destination) return NextResponse.json({ error: "Tell us where you want to go." }, { status: 400 });
    const group = Boolean(body.group);

    await Lead.create({
      title: `Callback: ${city} → ${destination}`,
      customerName: name,
      customerPhone: `+91${phone}`,
      destinationName: destination,
      numberOfTravelers: group ? 10 : 1,
      stage: "new",
      priority: group ? "high" : "medium",
      source: "website",
      requirements: `Callback request from the homepage. City: ${city}. Wants to go: ${destination}.${group ? " Planning a group departure (10 or more people)." : ""}`,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
