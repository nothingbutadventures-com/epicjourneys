import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Booking from "@/models/Booking";
import { getAuthFromRequest, hashPassword } from "@/lib/auth";
import Discount from "@/models/Discount";
import { PARTNER_DISCOUNT_FIELDS, sanitizePartnerDiscountIds } from "@/lib/partner-discounts";
import { settleApplicants } from "@/lib/partner-mail";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    if (!Destination || !Discount) {}

    const filter: any = { role: "partner" };
    if (auth.role === "partner") {
      filter._id = auth.userId;
    }

    const partners = await User.find(filter)
      .select("-password")
      .populate("assignedDestination")
      .populate("partnerDiscountIds", PARTNER_DISCOUNT_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    const partnerIds = partners.map((p) => p._id);
    const bookingStats = await Booking.aggregate([
      { $match: { partnerId: { $in: partnerIds } } },
      {
        $group: {
          _id: "$partnerId",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmountInr" },
        },
      },
    ]);

    const statsMap = new Map();
    bookingStats.forEach((s) => statsMap.set(s._id.toString(), s));

    const enrichedPartners = partners.map((partner) => {
      const stats = statsMap.get(partner._id.toString()) || {
        totalBookings: 0,
        totalRevenue: 0,
      };
      return {
        ...partner,
        stats,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedPartners,
    });
  } catch (error: any) {
    console.error("GET /api/partners error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone, assignedDestination } = body;
    const extra = {
      secondaryPhone: String(body.secondaryPhone ?? "").trim(),
      companyName: String(body.companyName ?? "").trim(),
      address: String(body.address ?? "").trim(),
      notes: String(body.notes ?? "").trim(),
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user or partner with this email already exists." },
        { status: 409 }
      );
    }

    if (assignedDestination) {
      const dest: any = await Destination.findById(assignedDestination).select("name partnerId");
      if (dest?.partnerId) {
        return NextResponse.json({ error: `${dest.name} already has a partner. A location can only have one.` }, { status: 409 });
      }
    }

    const disc = await sanitizePartnerDiscountIds(body.partnerDiscountIds ?? []);
    if (disc.error) return NextResponse.json({ error: disc.error }, { status: 400 });

    const hashedPassword = await hashPassword(password);

    const partner = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "partner",
      phone: phone || "",
      ...extra,
      assignedDestination: assignedDestination || null,
      partnerDiscountIds: disc.ids,
    });

    if (assignedDestination) {
      await Destination.findByIdAndUpdate(assignedDestination, {
        partnerId: partner._id,
      });
    }

    if (assignedDestination) {
      await settleApplicants({
        destinationId: String(assignedDestination),
        partnerId: String(partner._id),
        email: partner.email,
        name: partner.name,
        password,
        requestId: body.requestId || null,
      });
    }

    const created = await User.findById(partner._id)
      .select("-password")
      .populate("assignedDestination")
      .populate("partnerDiscountIds", PARTNER_DISCOUNT_FIELDS);

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    console.error("POST /api/partners error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
