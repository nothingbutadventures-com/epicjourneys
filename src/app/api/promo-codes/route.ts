import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const filter: any = {};
    if (!all) filter.isActive = true;

    const items = await PromoCode.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.code || body.value === undefined) {
      return NextResponse.json({ error: "Code and Value are required" }, { status: 400 });
    }

    const newPromo = await PromoCode.create({
      code: body.code.toUpperCase().trim(),
      discountType: body.discountType || "percentage",
      value: Number(body.value),
      minBookingAmount: Number(body.minBookingAmount) || 0,
      maxDiscountInr: Number(body.maxDiscountInr) || 5000,
      usageLimit: Number(body.usageLimit) || 100,
      usageCount: 0,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, data: newPromo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
