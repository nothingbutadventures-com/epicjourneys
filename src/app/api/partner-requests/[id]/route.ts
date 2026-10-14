import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PartnerRequest from "@/models/PartnerRequest";
import { getAuthFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();

    const update: any = {};
    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      update.status = body.status;
      update.processedAt = body.status === "pending" ? null : new Date();
    }
    if (body.adminNotes !== undefined) update.adminNotes = String(body.adminNotes).slice(0, 1000);
    if (body.partnerId !== undefined) update.partnerId = body.partnerId || null;

    const updated = await PartnerRequest.findByIdAndUpdate(id, update, { new: true }).populate("destinationId", "name state partnerId");
    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    const { id } = await params;
    await connectToDatabase();
    await PartnerRequest.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
