import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const status = searchParams.get("status");

    const filter: any = {};
    if (!all) {
      filter.status = "published";
    } else if (status && status !== "all") {
      filter.status = status;
    }

    const items = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.tourTitle || !body.customerName || !body.rating || !body.comment) {
      return NextResponse.json(
        { error: "Tour title, customer name, rating, and comment are required" },
        { status: 400 }
      );
    }

    const newReview = await Review.create({
      tourId: body.tourId,
      tourTitle: body.tourTitle,
      customerName: body.customerName,
      customerEmail: body.customerEmail || "",
      rating: Number(body.rating),
      comment: body.comment,
      location: body.location || "India",
      status: body.status || "published",
    });

    return NextResponse.json({ success: true, data: newReview }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
