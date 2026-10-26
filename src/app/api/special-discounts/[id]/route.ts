import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import SpecialDiscount from "@/models/SpecialDiscount";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanCampaign, toIstDay } from "@/lib/special-discounts";

const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await connectToDatabase();
    const existing: any = await SpecialDiscount.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    const body = await req.json();

    // A partial body (like the on/off switch) only changes what was sent.
    const merged = {
      name: existing.name,
      travelStyle: existing.travelStyle,
      percentage: existing.percentage,
      startDay: toIstDay(existing.startDate),
      endDay: toIstDay(existing.endDate),
      isActive: existing.isActive,
      ...body,
    };
    const c: any = await cleanCampaign(merged, id);
    if (c.error) return NextResponse.json({ error: c.error }, { status: c.status || 400 });
    const updated = await SpecialDiscount.findByIdAndUpdate(id, c.data, { new: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    const { id } = await params;
    await connectToDatabase();
    await SpecialDiscount.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
