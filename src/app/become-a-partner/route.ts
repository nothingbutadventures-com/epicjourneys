import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { designPage } from "@/lib/design";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  if (!User) {}
  const dests: any[] = await Destination.find({ isActive: true, $or: [{ partnerId: { $ne: null } }, { openForPartner: true }] })
    .select("name state partnerId openForPartner coordinates")
    .populate("partnerId", "name companyName")
    .lean();
  const lounges = dests
    .filter((d) => d.partnerId)
    .map((d) => ({ id: String(d._id), city: d.name, state: d.state, partner: d.partnerId.companyName || d.partnerId.name || "", lat: d.coordinates?.lat, lng: d.coordinates?.lng }));
  const towns = dests
    .filter((d) => !d.partnerId && d.openForPartner)
    .map((d) => ({ id: String(d._id), city: d.name, state: d.state, lat: d.coordinates?.lat, lng: d.coordinates?.lng }));
  return designPage("partners.html", { lounges, towns });
}
