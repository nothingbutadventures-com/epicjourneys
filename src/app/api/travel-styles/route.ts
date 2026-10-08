import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TravelStyle from "@/models/TravelStyle";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const filter: any = {};
    if (!all) filter.isActive = true;

    const items = await TravelStyle.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newStyle = await TravelStyle.create({
      name: body.name.trim(),
      slug,
      description: body.description || "",
      icon: body.icon || "travel",
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, data: newStyle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
