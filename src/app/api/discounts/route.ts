import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Discount from "@/models/Discount";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

const isAdmin = (req: NextRequest) => getAuthFromRequest(req)?.role === "admin";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    // Tour pickers only ever see normal discounts; partner discounts are admin-only here.
    const kind = searchParams.get("kind") || "normal";
    if (kind !== "normal" && !isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const filter: any = {};
    if (kind === "normal") filter.kind = { $ne: "partner" };
    else if (kind === "partner") filter.kind = "partner";
    if (!all) filter.isActive = true;

    const items: any[] = await Discount.find(filter).sort({ createdAt: -1 }).lean();

    if (isAdmin(req)) {
      const counts = await User.aggregate([
        { $match: { role: "partner" } },
        { $unwind: "$partnerDiscountIds" },
        { $group: { _id: "$partnerDiscountIds", n: { $sum: 1 } } },
      ]);
      const map = new Map(counts.map((c) => [String(c._id), c.n]));
      items.forEach((i) => (i.assignedPartners = map.get(String(i._id)) || 0));
    }
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export function validateDiscountFields(body: any): string | null {
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return "Enter a discount value greater than 0.";
  if ((body.discountType || "percentage") === "percentage" && value > 100) return "A percentage discount can't be more than 100.";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    await connectToDatabase();
    const body = await req.json();

    if (!String(body.name || "").trim() || body.value === undefined) {
      return NextResponse.json({ error: "Name and Value are required" }, { status: 400 });
    }
    const bad = validateDiscountFields(body);
    if (bad) return NextResponse.json({ error: bad }, { status: 400 });

    const newDiscount = await Discount.create({
      name: String(body.name).trim(),
      kind: body.kind === "partner" ? "partner" : "normal",
      discountType: body.discountType === "fixed" ? "fixed" : "percentage",
      value: Number(body.value),
      description: body.description || "",
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, data: newDiscount }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
