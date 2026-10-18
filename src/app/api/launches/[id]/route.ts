import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Tour from "@/models/Tour";
import User from "@/models/User";
import Destination from "@/models/Destination";
import TourLaunch from "@/models/TourLaunch";
import { getAuthFromRequest } from "@/lib/auth";
import { addMessage, isObjectId, publishLaunch, refreshEndDates, sanitizeLaunchPatch, unpublishLaunch } from "@/lib/launch";
import type { LaunchStatus } from "@/lib/launch-shared";

const EDITABLE: LaunchStatus[] = ["submitted", "changes_requested"];
const OPEN: LaunchStatus[] = ["submitted", "awaiting_partner", "changes_requested", "partner_approved"];

async function load(id: string) {
  return TourLaunch.findById(id)
    .populate("tourId")
    .populate("cityId", "name state addresses")
    .populate("partnerId", "name email phone secondaryPhone companyName");
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) return bad("Unauthorized access", 403);
    const { id } = await params;
    if (!isObjectId(id)) return bad("Not found", 404);
    await connectToDatabase();
    if (!Tour || !User || !Destination) {}
    const launch: any = await load(id);
    if (!launch) return bad("Request not found", 404);
    if (auth.role === "partner" && String(launch.partnerId?._id) !== auth.userId) return bad("This request belongs to another partner.", 403);
    return NextResponse.json({ success: true, data: launch });
  } catch (error: any) {
    return bad(error.message, 500);
  }
}

/**
 * Workflow actions. Admin: update, send, recall, approve, reject, close, message.
 * Partner: agree, request_changes, withdraw, message.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) return bad("Unauthorized access", 403);
    const { id } = await params;
    if (!isObjectId(id)) return bad("Not found", 404);
    await connectToDatabase();
    if (!Tour || !User || !Destination) {}

    const body = await req.json();
    const action = String(body.action || "");
    const note = String(body.text ?? "").trim();

    const launch: any = await TourLaunch.findById(id);
    if (!launch) return bad("Request not found", 404);
    const isAdmin = auth.role === "admin";
    if (!isAdmin && String(launch.partnerId) !== auth.userId) return bad("This request belongs to another partner.", 403);

    const who: any = await User.findById(auth.userId).select("name").lean();
    const name = who?.name || auth.name;
    const status: LaunchStatus = launch.status;
    const by = isAdmin ? "admin" : "partner";

    const adminOnly = ["update", "send", "recall", "approve", "reject", "close"];
    const partnerOnly = ["agree", "request_changes", "withdraw"];
    if (adminOnly.includes(action) && !isAdmin) return bad("Only admins can do that.", 403);
    if (partnerOnly.includes(action) && isAdmin) return bad("Only the partner can do that.", 403);

    switch (action) {
      case "update": {
        if (!EDITABLE.includes(status)) return bad("This request can only be edited while it is with the admin. Recall it first.");
        const tour: any = await Tour.findById(launch.tourId).lean();
        const city: any = await Destination.findById(launch.cityId).select("name addresses").lean();
        const parsed = sanitizeLaunchPatch(body, { tour, city, current: { startItinerary: launch.startItinerary, endItinerary: launch.endItinerary } }, { admin: true });
        if (parsed.error) return bad(parsed.error);
        const p = parsed.data!;
        if (p.startItinerary !== undefined) launch.startItinerary = p.startItinerary;
        if (p.endItinerary !== undefined) launch.endItinerary = p.endItinerary;
        if (p.addressId !== undefined) launch.addressId = p.addressId;
        if (p.partnerNotes !== undefined) launch.partnerNotes = p.partnerNotes;
        if (p.extraPriceInr !== undefined) launch.extraPriceInr = p.extraPriceInr;
        if (p.dates !== undefined) launch.dates = p.dates;
        else if (p.startItinerary !== undefined || p.endItinerary !== undefined) refreshEndDates(launch, tour);
        break;
      }
      case "send": {
        if (!EDITABLE.includes(status)) return bad("Only requests that are with the admin can be sent to the partner.");
        if (!launch.partnerId) return bad("This request has no partner to send it to.");
        if (launch.extraPriceInr === null || launch.extraPriceInr === undefined) return bad("Set the extra price for this city before sending.");
        if (!launch.dates.length) return bad("Add at least one date before sending.");
        launch.status = "awaiting_partner";
        launch.revision += 1;
        addMessage(launch, "admin", name, "sent", note);
        break;
      }
      case "recall": {
        if (status !== "awaiting_partner" && status !== "partner_approved") return bad("Nothing to recall.");
        launch.status = "submitted";
        addMessage(launch, "admin", name, "recalled", note);
        break;
      }
      case "agree": {
        if (status !== "awaiting_partner") return bad("There is nothing to approve right now.");
        launch.status = "partner_approved";
        addMessage(launch, "partner", name, "agreed", note);
        break;
      }
      case "request_changes": {
        if (status !== "awaiting_partner") return bad("There is nothing to change right now.");
        if (!note) return bad("Tell the admin what you'd like changed.");
        launch.status = "changes_requested";
        addMessage(launch, "partner", name, "changes", note);
        break;
      }
      case "approve": {
        if (status !== "partner_approved") return bad("The partner must agree before the final approval.");
        const r = await publishLaunch(launch);
        if (r.error) return bad(r.error);
        launch.status = "approved";
        addMessage(launch, "admin", name, "approved", note);
        break;
      }
      case "reject": {
        if (!OPEN.includes(status)) return bad("This request is already closed.");
        if (!note) return bad("Add a reason so the partner knows why.");
        launch.status = "rejected";
        addMessage(launch, "admin", name, "rejected", note);
        break;
      }
      case "withdraw": {
        if (!OPEN.includes(status)) return bad("This request can't be withdrawn.");
        launch.status = "withdrawn";
        addMessage(launch, "partner", name, "withdrawn", note);
        break;
      }
      case "close": {
        if (status !== "approved") return bad("Only live requests can be taken offline.");
        const r = await unpublishLaunch(launch);
        if (r.error) return bad(r.error);
        launch.status = "closed";
        addMessage(launch, "admin", name, "closed", note);
        break;
      }
      case "message": {
        if (!note) return bad("Write a message first.");
        addMessage(launch, by, name, "message", note);
        break;
      }
      default:
        return bad("Unknown action");
    }

    await launch.save();
    const fresh = await load(id);
    return NextResponse.json({ success: true, data: fresh });
  } catch (error: any) {
    console.error("PATCH /api/launches/[id] error:", error);
    return bad(error.message || "Update failed", 500);
  }
}
