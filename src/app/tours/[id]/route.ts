import { NextRequest } from "next/server";
import { designPage } from "@/lib/design";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = req.nextUrl.origin;
  const get = (path: string) => fetch(origin + path, { cache: "no-store", headers: { cookie: req.headers.get("cookie") || "" } }).then((r) => r.json()).catch(() => null);
  const [tour, reviews, all] = await Promise.all([get(`/api/tours/${encodeURIComponent(id)}`), get("/api/reviews"), get("/api/tours")]);
  if (!tour?.success || !tour.data) {
    return new Response("<!doctype html><meta charset=utf-8><title>Tour not found</title><body style=\"font-family:sans-serif;text-align:center;padding:80px\"><h1>Tour not found</h1><p><a href=\"/tours\">Back to all tours</a></p>", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return designPage("tour.html", {
    tour: tour.data,
    reviews: reviews?.data || [],
    others: (all?.data || []).filter((t: any) => t._id !== tour.data._id).slice(0, 8),
    company: { whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "", tel: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "" },
  });
}
