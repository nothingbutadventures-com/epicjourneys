import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import { getAuthFromRequest, hashPassword } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    if (!Destination) {}

    const partner = await User.findById(id)
      .select("-password")
      .populate("assignedDestination");

    if (!partner || partner.role !== "partner") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: partner });
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
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();

    const partner = await User.findById(id);
    if (!partner || partner.role !== "partner") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email) {
      const email = body.email.toLowerCase().trim();
      if (email !== partner.email) {
        const taken = await User.findOne({ email, _id: { $ne: partner._id } });
        if (taken) return NextResponse.json({ error: "Another account already uses this email." }, { status: 409 });
      }
      updateData.email = email;
    }
    for (const k of ["secondaryPhone", "companyName", "address", "notes"] as const) {
      if (body[k] !== undefined) updateData[k] = String(body[k]).trim();
    }
    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    if (body.assignedDestination !== undefined) {
      const oldDestId = partner.assignedDestination?.toString();
      const newDestId = body.assignedDestination || null;

      if (oldDestId !== newDestId && newDestId) {
        const dest: any = await Destination.findById(newDestId).select("name partnerId");
        if (dest?.partnerId && String(dest.partnerId) !== String(partner._id)) {
          return NextResponse.json({ error: `${dest.name} already has a partner. A location can only have one.` }, { status: 409 });
        }
      }

      if (oldDestId !== newDestId) {
        if (oldDestId) {
          await Destination.findByIdAndUpdate(oldDestId, {
            $unset: { partnerId: 1 },
          });
        }
        if (newDestId) {
          await Destination.findByIdAndUpdate(newDestId, {
            partnerId: partner._id,
          });
        }
        updateData.assignedDestination = newDestId;
      }
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select("-password")
      .populate("assignedDestination");

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
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const partner = await User.findById(id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    if (partner.assignedDestination) {
      await Destination.findByIdAndUpdate(partner.assignedDestination, {
        $unset: { partnerId: 1 },
      });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
