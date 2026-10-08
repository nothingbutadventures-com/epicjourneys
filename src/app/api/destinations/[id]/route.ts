import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    if (!User) {}

    const destination = await Destination.findById(id).populate(
      "partnerId",
      "name email phone"
    );

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: destination });
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

    const existingDest = await Destination.findById(id);
    if (!existingDest) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    if (body.partnerId !== undefined && body.partnerId !== existingDest.partnerId?.toString()) {
      if (existingDest.partnerId) {
        await User.findByIdAndUpdate(existingDest.partnerId, {
          $unset: { assignedDestination: 1 },
        });
      }
      if (body.partnerId) {
        await User.findByIdAndUpdate(body.partnerId, {
          assignedDestination: id,
        });
      }
    }

    const updated = await Destination.findByIdAndUpdate(
      id,
      {
        ...(body.name && { name: body.name.trim() }),
        ...(body.state && { state: body.state.trim() }),
        ...(body.coordinates && {
          coordinates: {
            lat: Number(body.coordinates.lat),
            lng: Number(body.coordinates.lng),
          },
        }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.partnerId !== undefined && { partnerId: body.partnerId || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      { new: true }
    ).populate("partnerId", "name email phone");

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

    const dest = await Destination.findById(id);
    if (!dest) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    if (dest.partnerId) {
      await User.findByIdAndUpdate(dest.partnerId, {
        $unset: { assignedDestination: 1 },
      });
    }

    await Destination.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
