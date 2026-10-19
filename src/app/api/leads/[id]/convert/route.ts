import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Booking from "@/models/Booking";
import Tour from "@/models/Tour";
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
    const body = await req.json().catch(() => ({}));

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Determine tour
    const tourId = body.tourId || lead.tourId;
    let selectedTour: any = null;
    if (tourId) {
      selectedTour = await Tour.findById(tourId);
    }
    if (!selectedTour) {
      // Pick first active tour
      selectedTour = await Tour.findOne();
    }

    if (!selectedTour) {
      return NextResponse.json(
        { error: "No tour packages found to associate with this booking" },
        { status: 400 }
      );
    }

    const pax = Number(body.numberOfTravelers) || lead.numberOfTravelers || 1;
    const totalAmount =
      Number(body.totalAmountInr) ||
      lead.estimatedBudget ||
      selectedTour.priceInr * pax;
    const pricePerPerson = Math.round(totalAmount / pax);
    const travelDate = body.travelDate
      ? new Date(body.travelDate)
      : lead.expectedTravelDate || new Date(Date.now() + 14 * 86400000);

    const bookingRef = `EJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const nameParts = (lead.customerName || "Customer").trim().split(" ");
    const firstName = nameParts[0] || "Traveler";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    const travellers: {
      firstName: string;
      lastName: string;
      phone: string;
      age: number;
      email?: string;
      roomType: "shared" | "single";
    }[] = [];
    for (let i = 0; i < pax; i++) {
      travellers.push({
        firstName: i === 0 ? firstName : `Traveler ${i + 1}`,
        lastName: i === 0 ? lastName : lastName,
        phone: lead.customerPhone || "+91 00000 00000",
        age: 30,
        email: lead.customerEmail,
        roomType: "shared",
      });
    }

    const booking: any = await Booking.create({
      bookingRef,
      tourId: selectedTour._id,
      tourTitle: selectedTour.title,
      destinationId: selectedTour.destinationId || lead.destinationId || undefined,
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      customerPhone: lead.customerPhone,
      travelDate,
      numberOfTravelers: pax,
      pricePerPerson,
      totalAmountInr: totalAmount,
      specialRequests: body.specialRequests || lead.requirements || "Converted from CRM Lead",
      status: "confirmed",
      bookedByRole: auth.role === "partner" ? "partner" : "user",
      partnerId: lead.partnerId || (auth.role === "partner" ? auth.userId : undefined),
      travellers,
      roomSupplementInr: 0,
      paymentStrategy: "full",
      installments: [],
      paymentStatus: "paid",
      amountPaidInr: totalAmount,
    });

    // Update lead to Won stage and attach booking
    lead.stage = "won";
    lead.bookingId = booking._id;
    lead.bookingRef = booking.bookingRef;
    lead.activities.unshift({
      type: "status_change",
      title: `Converted to Booking ${booking.bookingRef}`,
      description: `Lead converted to confirmed booking for ₹${totalAmount.toLocaleString("en-IN")} by ${auth.name}`,
      createdBy: auth.name,
      createdAt: new Date(),
    } as any);

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Lead converted to booking successfully",
      data: {
        booking,
        lead,
      },
    });
  } catch (error: any) {
    console.error("POST /api/leads/[id]/convert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
