import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";

const STAGE_LABELS: Record<string, string> = {
  new: "Qualified",
  contacted: "Contact Made",
  proposal: "Proposal / Demo",
  negotiation: "Negotiations Started",
  won: "Won / Confirmed",
  lost: "Lost / Closed",
};

export async function GET(
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
    if (!User || !Destination || !Tour) {}

    const { id } = await params;
    const lead = await Lead.findById(id)
      .populate({
        path: "partnerId",
        select: "name email companyName phone address assignedDestination",
        populate: { path: "assignedDestination", select: "name state" },
      })
      .populate("destinationId", "name state")
      .populate("tourId", "title slug priceInr coverImage")
      .populate("createdBy", "name email role")
      .lean();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Role security check for partner
    if (auth.role === "partner") {
      const partnerUser = await User.findById(auth.userId);
      const isAssigned = lead.partnerId?._id?.toString() === auth.userId;
      const isCreator = lead.createdBy?._id?.toString() === auth.userId;
      const isDestMatch =
        partnerUser?.assignedDestination &&
        lead.destinationId?._id?.toString() ===
          partnerUser.assignedDestination.toString();

      if (!isAssigned && !isCreator && !isDestMatch) {
        return NextResponse.json(
          { error: "Unauthorized access to this lead" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: lead });
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

    const existingLead = await Lead.findById(id);
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Partner access check
    if (auth.role === "partner") {
      const isAssigned = existingLead.partnerId?.toString() === auth.userId;
      const isCreator = existingLead.createdBy?.toString() === auth.userId;
      if (!isAssigned && !isCreator) {
        return NextResponse.json(
          { error: "You can only update leads assigned to or created by you" },
          { status: 403 }
        );
      }
    }

    const newActivities = [...(existingLead.activities || [])];

    // Check if stage changed
    if (body.stage && body.stage !== existingLead.stage) {
      const oldLabel = STAGE_LABELS[existingLead.stage] || existingLead.stage;
      const newLabel = STAGE_LABELS[body.stage] || body.stage;
      newActivities.push({
        type: "status_change",
        title: `Stage moved from ${oldLabel} to ${newLabel}`,
        description: body.stageChangeNote || `Moved to ${newLabel} by ${auth.name}`,
        createdBy: auth.name,
        createdAt: new Date(),
      });
    }

    // Check if partner assignment changed
    if (
      auth.role === "admin" &&
      body.partnerId !== undefined &&
      String(body.partnerId || "") !== String(existingLead.partnerId || "")
    ) {
      if (body.partnerId) {
        const partner = await User.findById(body.partnerId);
        newActivities.push({
          type: "note",
          title: `Assigned to Partner: ${partner ? partner.name : "Partner"}`,
          description: `Assigned by Admin (${auth.name})`,
          createdBy: auth.name,
          createdAt: new Date(),
        });
      } else {
        newActivities.push({
          type: "note",
          title: "Lead unassigned",
          description: `Unassigned by Admin (${auth.name})`,
          createdBy: auth.name,
          createdAt: new Date(),
        });
      }
    }

    // If destination changed, update destinationName
    if (body.destinationId && body.destinationId !== existingLead.destinationId?.toString()) {
      const dest = await Destination.findById(body.destinationId);
      if (dest) {
        body.destinationName = dest.name;
      }
    }

    // If tour changed, update tourTitle
    if (body.tourId && body.tourId !== existingLead.tourId?.toString()) {
      const tour = await Tour.findById(body.tourId);
      if (tour) {
        body.tourTitle = tour.title;
      }
    }

    // Allow adding a note or activity directly in the update request
    if (body.newActivity) {
      newActivities.push({
        type: body.newActivity.type || "note",
        title: body.newActivity.title,
        description: body.newActivity.description || "",
        dueDate: body.newActivity.dueDate ? new Date(body.newActivity.dueDate) : null,
        completed: false,
        createdBy: auth.name,
        createdAt: new Date(),
      });
    }

    body.activities = newActivities;

    const updated = await Lead.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "partnerId",
        select: "name email companyName phone address assignedDestination",
        populate: { path: "assignedDestination", select: "name state" },
      })
      .populate("destinationId", "name state")
      .populate("tourId", "title slug priceInr coverImage")
      .populate("createdBy", "name email role")
      .lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/leads/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Only admin can delete any lead; partner can only delete their own created lead
    if (auth.role === "partner" && lead.createdBy?.toString() !== auth.userId) {
      return NextResponse.json(
        { error: "Partners can only delete leads created by themselves" },
        { status: 403 }
      );
    }

    await Lead.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
