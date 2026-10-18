import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import PartnerRequest from "@/models/PartnerRequest";
import Destination from "@/models/Destination";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanMobile } from "@/lib/address";

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const validMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

// Public: anyone can ask to become the partner for a location.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Honeypot: real visitors never fill this hidden field.
    if (text(body.website, 100)) return NextResponse.json({ success: true });

    const name = text(body.name, 80);
    const email = text(body.email, 120).toLowerCase();
    const phone = cleanMobile(body.phone);
    const secondaryPhone = cleanMobile(body.secondaryPhone);
    const city = text(body.city, 80);
    const state = text(body.state, 80);

    if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!validMobile(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    if (secondaryPhone && !validMobile(secondaryPhone)) return NextResponse.json({ error: "Enter a valid 10-digit secondary mobile number." }, { status: 400 });
    if (!city || !state) return NextResponse.json({ error: "Tell us which city and state you want to partner for." }, { status: 400 });

    await connectToDatabase();

    const dup = await PartnerRequest.findOne({ email, city: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), status: "pending" });
    if (dup) {
      return NextResponse.json({ error: "You already have a pending request for this location. We'll be in touch soon." }, { status: 409 });
    }

    // One partner per location: refuse requests for a city that already has one.
    const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const taken = await Destination.findOne({
      partnerId: { $ne: null },
      $or: [
        ...(body.destinationId && mongoose.isValidObjectId(body.destinationId) ? [{ _id: body.destinationId }] : []),
        { name: new RegExp(`^${esc(city)}$`, "i"), state: new RegExp(`^${esc(state)}$`, "i") },
      ],
    }).select("_id");
    if (taken) {
      return NextResponse.json({ error: "This location already has a partner. Please choose a different location." }, { status: 409 });
    }

    let destinationId: string | undefined;
    if (body.destinationId && mongoose.isValidObjectId(body.destinationId)) {
      const d = await Destination.findById(body.destinationId).select("_id");
      if (d) destinationId = String(d._id);
    }

    await PartnerRequest.create({
      name,
      email,
      phone,
      secondaryPhone,
      companyName: text(body.companyName, 120),
      city,
      state,
      ...(destinationId ? { destinationId } : {}),
      address: text(body.address, 400),
      experience: text(body.experience, 1000),
      message: text(body.message, 1000),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/partner-requests error:", error);
    return NextResponse.json({ error: "Could not submit your request. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    await connectToDatabase();
    if (!Destination) {}
    const items = await PartnerRequest.find({}).populate("destinationId", "name state partnerId").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
