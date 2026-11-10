import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { designPage } from "@/lib/design";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  if (!User) {}
  const res = await fetch(req.nextUrl.origin + "/api/tours", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
  const dests: any[] = await Destination.find({ isActive: true }).select("name state partnerId coordinates").populate("partnerId", "name companyName").lean();
  const byId = new Map(dests.map((d) => [String(d._id), d]));

  const lounges = dests
    .filter((d) => d.partnerId)
    .map((d) => ({ id: String(d._id), city: d.name, state: d.state, partner: d.partnerId.companyName || d.partnerId.name || "", lat: d.coordinates?.lat, lng: d.coordinates?.lng }));

  const apiTours: any[] = res?.data || [];
  const now = Date.now();
  const cities = new Map<string, any>();
  const tours = apiTours.map((t) => {
    const base = byId.get(String(t.baseStartCityId || "")) || t.destinationId;
    const bc = base && (base.coordinates || base);
    if (base) cities.set(base.name, { name: base.name, km: 0, lat: bc?.lat ?? base.coordinates?.lat, lng: bc?.lng ?? base.coordinates?.lng });
    const up = (t.departures || []).filter((d: any) => new Date(d.startDate).getTime() >= now);
    return {
      name: t.title, slug: t.slug || t._id, img: t.coverImage, loc: [t.targetCity, t.state].filter(Boolean).join(", "), state: t.state,
      city: base?.name || t.targetCity || "", km: 0, days: t.durationDays, dur: `${t.durationDays}D / ${t.durationNights}N`,
      price: t.priceInr, ...(t.discountPercentage > 0 ? { was: t.listPriceInr, off: t.discountPercentage } : {}),
      themes: t.travelStyles || [], blurb: String(t.shortDescription || t.description || "").slice(0, 140),
      months: [...new Set(up.map((d: any) => new Date(d.startDate).toISOString().slice(0, 7)))].sort(), for: [],
      _deps: up.map((d: any) => ({ date: new Date(d.startDate).toISOString().slice(0, 10), seats: d.available ?? d.seats, of: d.seats })),
    };
  });
  const schedule = tours
    .flatMap((t) => t._deps.map((d: any) => ({ ...d, name: t.name, guaranteed: false })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);
  tours.forEach((t: any) => delete t._deps);

  const group = (key: (t: any) => string[]) => {
    const m = new Map<string, any[]>();
    tours.forEach((t) => key(t).forEach((k) => m.set(k, [...(m.get(k) || []), t])));
    return [...m.entries()].map(([name, ts]) => ({ name, img: ts[0].img, tours: ts.length, from: Math.min(...ts.map((x) => x.price)), note: [...new Set(ts.map((x) => x.loc.split(",")[0]))].slice(0, 3).join(" · ") }));
  };
  const states = group((t) => (t.state ? [t.state] : []));
  const home = {
    tours, schedule, cities: [...cities.values()].filter((c) => c.lat != null),
    regions: { states, themes: group((t) => t.themes) },
    live: states.map((s) => ({ name: s.name, count: s.tours })),
  };
  return designPage("index.html", { lounges, towns: [], home });
}
