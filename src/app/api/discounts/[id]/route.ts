import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Discount from "@/models/Discount";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const existing = await Discount.findById(id);
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    const type = body.discountType ?? existing.discountType;
    const value = body.value !== undefined ? Number(body.value) : existing.value;
    if (!Number.isFinite(value) || value <= 0 || (type === "percentage" && value > 100)) {
      return NextResponse.json({ error: "Enter a valid discount value (percentages max 100)." }, { status: 400 });
    }
    const patch: any = {};
    for (const k of ["name", "description", "isActive", "discountType", "value", "validUntil"]) {
      if (body[k] === undefined) continue;
      patch[k] = k === "value" ? value : k === "validUntil" ? (body[k] ? new Date(body[k]) : null) : body[k];
    }

    const updated = await Discount.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    await connectToDatabase();
    const { id } = await params;
    await Discount.findByIdAndDelete(id);
    // Detach it from every partner so nobody keeps a dangling reference.
    await User.updateMany({ partnerDiscountIds: id }, { $pull: { partnerDiscountIds: id } });
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
