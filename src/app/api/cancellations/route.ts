import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Cancellation from "@/models/Cancellation";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter: any = {};
    if (status && status !== "all") filter.status = status;

    const items = await Cancellation.find(filter).sort({ requestedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.bookingRef || !body.customerName || !body.tourTitle || !body.reason) {
      return NextResponse.json(
        { error: "Missing required cancellation fields" },
        { status: 400 }
      );
    }

    const cancellation = await Cancellation.create({
      bookingId: body.bookingId,
      bookingRef: body.bookingRef,
      customerName: body.customerName,
      customerEmail: body.customerEmail || "",
      customerPhone: body.customerPhone || "",
      tourTitle: body.tourTitle,
      reason: body.reason,
      refundAmountInr: Number(body.refundAmountInr) || 0,
      status: "pending",
      requestedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: cancellation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
