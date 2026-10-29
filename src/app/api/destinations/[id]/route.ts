import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Destination from "@/models/Destination";
import User from "@/models/User";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";
import { sanitizeAddresses } from "@/lib/address";
import { settleApplicants } from "@/lib/partner-mail";
import { resolvePlace } from "@/lib/location";

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
      "name email phone secondaryPhone"
    );

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    if (getAuthFromRequest(req)?.role !== "admin") {
      const { addresses, partnerId, ...publicData } = destination.toObject();
      return NextResponse.json({ success: true, data: publicData });
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

    let addresses: any[] | undefined;
    if (body.addresses !== undefined) {
      const addrs = sanitizeAddresses(body.addresses);
      if (addrs.error) return NextResponse.json({ error: addrs.error }, { status: 400 });
      addresses = addrs.data;
      // An address that tour dates point at can't be removed.
      const keep = new Set((addresses || []).filter((a) => a._id).map((a) => String(a._id)));
      for (const old of existingDest.addresses || []) {
        if (keep.has(String(old._id))) continue;
        const used = await Tour.countDocuments({ departures: { $elemMatch: { cityId: id, addressId: old._id } } });
        if (used > 0) {
          return NextResponse.json(
            { error: `"${old.label}" is used as the starting address of ${used} tour${used === 1 ? "" : "s"}. Change those dates first.` },
            { status: 400 }
          );
        }
      }
    }

    const willHavePartner = body.partnerId !== undefined ? Boolean(body.partnerId) : Boolean(existingDest.partnerId);
    if (willHavePartner) body.openForPartner = false;

    // Country / state: an Indian city needs a state, any other country keeps its cities directly under it.
    let place: { country: string; state: string } | null = null;
    if (body.country !== undefined || body.state !== undefined) {
      const r = resolvePlace(body, existingDest as any);
      if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
      place = r;
    }

    const updated = await Destination.findByIdAndUpdate(
      id,
      {
        ...(body.name && { name: body.name.trim() }),
        ...(place && { country: place.country, state: place.state }),
        ...(body.coordinates && {
          coordinates: {
            lat: Number(body.coordinates.lat),
            lng: Number(body.coordinates.lng),
          },
        }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.partnerId !== undefined && { partnerId: body.partnerId || null }),
        ...(addresses !== undefined && { addresses }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.openForPartner !== undefined && { openForPartner: Boolean(body.openForPartner) }),
      },
      { new: true }
    ).populate("partnerId", "name email phone secondaryPhone");

    // Tours copy the destination's name and state, so keep them in step when those change.
    if (updated) {
      const tourPatch: Record<string, string> = {};
      if (place && place.state !== existingDest.state) tourPatch.state = place.state;
      if (body.name && String(body.name).trim() !== existingDest.name) tourPatch.targetCity = String(body.name).trim();
      if (Object.keys(tourPatch).length) await Tour.updateMany({ destinationId: id }, { $set: tourPatch });
    }

    if (body.partnerId && body.partnerId !== existingDest.partnerId?.toString()) {
      const u: any = await User.findById(body.partnerId).select("name email");
      if (u) await settleApplicants({ destinationId: id, partnerId: String(u._id), email: u.email, name: u.name });
    }

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
