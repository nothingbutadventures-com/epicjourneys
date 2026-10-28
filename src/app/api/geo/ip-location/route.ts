import { NextRequest, NextResponse } from "next/server";

// Third-party lookups must never hold a request open: each one is capped, and results are cached briefly
// so a slow or rate-limited ipapi.co can't pile up pending requests (which freezes page navigation).
const LOOKUP_TIMEOUT_MS = 2500;
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    // Attempt to extract client IP from headers
    const forwarded = req.headers.get("x-forwarded-for");
    let clientIp = forwarded ? forwarded.split(",")[0].trim() : "";

    // Ignore localhost/private IPs for external lookup
    const isLocal =
      !clientIp ||
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.");

    let geoData = null;
    const cached = cache.get(isLocal ? "server" : clientIp);
    if (cached && Date.now() - cached.at < TTL_MS) return NextResponse.json({ success: true, data: cached.data });

    if (!isLocal) {
      try {
        const ipRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          headers: { "User-Agent": "EpicJourneys/1.0" },
          signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
        });
        if (ipRes.ok) {
          const data = await ipRes.json();
          if (data && data.latitude && data.longitude) {
            geoData = {
              lat: data.latitude,
              lng: data.longitude,
              city: data.city || "Detected Location",
              region: data.region || "India",
              country: data.country_name || "India",
              source: "ip",
            };
          }
        }
      } catch (e) {
        console.warn("ipapi.co lookup failed:", e);
      }
    }

    // If local dev or lookup failed, fallback to public IP lookup without specific IP
    if (!geoData) {
      try {
        const fallbackRes = await fetch("https://ipapi.co/json/", {
          headers: { "User-Agent": "EpicJourneys/1.0" },
          signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (data && data.latitude && data.longitude) {
            geoData = {
              lat: data.latitude,
              lng: data.longitude,
              city: data.city || "New Delhi",
              region: data.region || "Delhi",
              country: data.country_name || "India",
              source: "ip_server",
            };
          }
        }
      } catch {
        // Fallback default
      }
    }

    // Default to New Delhi (28.6139, 77.2090) if unable to resolve
    if (!geoData) {
      geoData = {
        lat: 28.6139,
        lng: 77.209,
        city: "New Delhi",
        region: "Delhi",
        country: "India",
        source: "fallback_default",
      };
    }

    cache.set(isLocal ? "server" : clientIp, { at: Date.now(), data: geoData });
    return NextResponse.json({
      success: true,
      data: geoData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: true,
        data: {
          lat: 28.6139,
          lng: 77.209,
          city: "New Delhi",
          region: "Delhi",
          country: "India",
          source: "fallback_default",
        },
      },
      { status: 200 }
    );
  }
}
