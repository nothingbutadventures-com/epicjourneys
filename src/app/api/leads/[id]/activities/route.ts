import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { type, title, description, dueDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Activity title is required" },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const newActivity = {
      type: type || "note",
      title: title.trim(),
      description: description || "",
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: false,
      createdBy: auth.name,
      createdAt: new Date(),
    };

    lead.activities.unshift(newActivity as any);

    if (dueDate) {
      lead.nextFollowUp = new Date(dueDate);
      lead.nextFollowUpNotes = title.trim();
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Activity added successfully",
      data: lead,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { activityId, completed } = body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const act = (lead.activities as any).id(activityId);
    if (!act) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    act.completed = Boolean(completed);
    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Activity status updated",
      data: lead,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
