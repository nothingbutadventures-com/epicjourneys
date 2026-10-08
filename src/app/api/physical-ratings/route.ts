import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PhysicalRating from "@/models/PhysicalRating";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const filter: any = {};
    if (!all) filter.isActive = true;

    const items = await PhysicalRating.find(filter).sort({ level: 1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.level) {
      return NextResponse.json({ error: "Name and Level are required" }, { status: 400 });
    }

    const newRating = await PhysicalRating.create({
      name: body.name.trim(),
      level: Number(body.level),
      description: body.description || "",
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, data: newRating }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
