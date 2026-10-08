import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Discount from "@/models/Discount";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const filter: any = {};
    if (!all) filter.isActive = true;

    const items = await Discount.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || body.value === undefined) {
      return NextResponse.json({ error: "Name and Value are required" }, { status: 400 });
    }

    const newDiscount = await Discount.create({
      name: body.name.trim(),
      discountType: body.discountType || "percentage",
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
