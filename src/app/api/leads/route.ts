import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead, { ILeadActivity } from "@/models/Lead";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Tour from "@/models/Tour";
import { getAuthFromRequest } from "@/lib/auth";

// Initial realistic demo leads if collection is empty
const DEMO_LEADS = [
  {
    title: "Manali & Solang Valley 5D Expedition",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.sharma@example.com",
    customerPhone: "+91 98765 43210",
    destinationName: "Manali",
    tourTitle: "High Passes of Himachal",
    numberOfTravelers: 4,
    estimatedBudget: 78000,
    expectedTravelDate: new Date(Date.now() + 14 * 86400000),
    stage: "new",
    priority: "high",
    source: "website",
    createdRole: "system",
    requirements: "Family trip with 2 kids. Needs comfortable SUV transport and mountain view 4-star cottages.",
    nextFollowUp: new Date(Date.now() + 86400000),
    nextFollowUpNotes: "Initial introductory call & send itinerary PDF",
    activities: [
      {
        type: "note",
        title: "Lead received via website inquiry",
        description: "Customer inquired for 4 pax Manali trip for next month.",
        createdBy: "Website System",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        type: "task",
        title: "Introductory discovery call",
        description: "Call customer to confirm travel dates and hotel tier preferences.",
        dueDate: new Date(Date.now() + 86400000),
        completed: false,
        createdBy: "CRM Automation",
        createdAt: new Date(),
      },
    ],
  },
  {
    title: "Spiti 4x4 Circuit - Adventurers Club",
    customerName: "Aarav Patel",
    customerEmail: "aarav.p@techventures.in",
    customerPhone: "+91 98200 11223",
    destinationName: "Spiti Valley",
    tourTitle: "Spiti Valley Rugged Expedition",
    numberOfTravelers: 6,
    estimatedBudget: 195000,
    expectedTravelDate: new Date(Date.now() + 25 * 86400000),
    stage: "contacted",
    priority: "urgent",
    source: "whatsapp",
    createdRole: "admin",
    requirements: "Group of college friends. Need 2 reliable 4x4 Scorpios, camp stays at Chandratal, homestays in Kaza.",
    nextFollowUp: new Date(Date.now() + 2 * 86400000),
    nextFollowUpNotes: "Follow up on Chandratal tent confirmation",
    activities: [
      {
        type: "call",
        title: "Phone call completed",
        description: "Discussed route plan from Shimla to Kaza and return via Manali. Client wants river rafting included.",
        createdBy: "Admin Team",
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        type: "task",
        title: "Send revised Spiti quote",
        dueDate: new Date(Date.now() + 86400000),
        completed: false,
        createdBy: "Admin Team",
        createdAt: new Date(Date.now() - 86400000),
      },
    ],
  },
  {
    title: "Leh Ladakh Royal Enfield Tour",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram.m@malhotracorp.com",
    customerPhone: "+91 97110 55667",
    destinationName: "Leh Ladakh",
    tourTitle: "Ladakh High Altitude Odyssey",
    numberOfTravelers: 2,
    estimatedBudget: 94000,
    expectedTravelDate: new Date(Date.now() + 40 * 86400000),
    stage: "proposal",
    priority: "medium",
    source: "direct_call",
    createdRole: "partner",
    requirements: "Two Himalayan bikes required with backup mechanic vehicle, fuel support, oxygen cylinders.",
    nextFollowUp: new Date(Date.now() + 3 * 86400000),
    nextFollowUpNotes: "Client reviewing itinerary breakdown with spouse",
    activities: [
      {
        type: "proposal",
        title: "Customized Itinerary & Quote Sent",
        description: "Sent PDF with 8-day itinerary covering Pangong Tso, Nubra Valley, Khardung La.",
        createdBy: "Partner Agent",
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    ],
  },
  {
    title: "Kerala Backwaters & Munnar Honeymoon",
    customerName: "Pooja & Ankit Verma",
    customerEmail: "ankit.verma.90@gmail.com",
    customerPhone: "+91 99887 66554",
    destinationName: "Kerala",
    tourTitle: "Emerald Hills & Backwaters of Kerala",
    numberOfTravelers: 2,
    estimatedBudget: 65000,
    expectedTravelDate: new Date(Date.now() + 18 * 86400000),
    stage: "negotiation",
    priority: "high",
    source: "website",
    createdRole: "system",
    requirements: "Premium 1-bedroom private houseboat in Alleppey, candle light dinner, floral bed decoration.",
    nextFollowUp: new Date(Date.now() + 4 * 3600000),
    nextFollowUpNotes: "Final confirmation pending on 5% honeymoon discount",
    activities: [
      {
        type: "note",
        title: "Requested discount review",
        description: "Client agreed on itinerary, negotiated for ₹65,000 all inclusive. Ready to book today.",
        createdBy: "Sales Team",
        createdAt: new Date(Date.now() - 4 * 3600000),
      },
    ],
  },
  {
    title: "Rajasthan Heritage Forts & Desert Safari",
    customerName: "Sanjay Singhania",
    customerEmail: "sanjay@singhaniagroup.org",
    customerPhone: "+91 98111 22334",
    destinationName: "Rajasthan",
    tourTitle: "Royal Heritage of Rajasthan",
    numberOfTravelers: 5,
    estimatedBudget: 145000,
    expectedTravelDate: new Date(Date.now() + 10 * 86400000),
    stage: "won",
    priority: "medium",
    source: "partner_referral",
    createdRole: "admin",
    requirements: "Luxury heritage haveli stays in Jaipur & Udaipur with Sam sand dunes luxury Swiss tents.",
    bookingRef: "EJ-BKG-RAJ772",
    activities: [
      {
        type: "note",
        title: "Deal closed successfully",
        description: "Advance deposit received. Booking confirmed with reference EJ-BKG-RAJ772.",
        createdBy: "Admin Team",
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    ],
  },
  {
    title: "Rishikesh River Rafting & Bungee Trip",
    customerName: "Kunal Mehra",
    customerEmail: "kunal.m@outlook.com",
    customerPhone: "+91 91234 88990",
    destinationName: "Uttarakhand",
    tourTitle: "Rishikesh Thrill Weekend",
    numberOfTravelers: 3,
    estimatedBudget: 28000,
    stage: "lost",
    priority: "low",
    source: "social_media",
    createdRole: "partner",
    lossReason: "Client postponed trip due to monsoon travel advisory",
    requirements: "Budget river side camping with cliff jumping.",
    activities: [
      {
        type: "status_change",
        title: "Marked as Lost",
        description: "Client postponed travel due to weather concerns. Will reconnect in October.",
        createdBy: "Partner Agent",
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ],
  },
];

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
    if (!User || !Destination || !Tour) {}

    // Check if collection is empty, seed demo leads if needed
    const count = await Lead.countDocuments();
    if (count === 0) {
      await Lead.insertMany(DEMO_LEADS);
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");
    const partnerId = searchParams.get("partnerId");
    const destinationId = searchParams.get("destinationId");
    const search = searchParams.get("search");

    let filter: any = {};

    if (auth.role === "partner") {
      // Partner only sees leads assigned to them, created by them, or matching their assigned destination
      const partnerUser = await User.findById(auth.userId);
      const assignedDestId = partnerUser?.assignedDestination;

      filter = {
        $or: [
          { partnerId: auth.userId },
          { createdBy: auth.userId },
          ...(assignedDestId ? [{ destinationId: assignedDestId }] : []),
        ],
      };
    } else {
      // Admin filters
      if (partnerId) {
        if (partnerId === "unassigned") {
          filter.partnerId = null;
        } else if (partnerId !== "all") {
          filter.partnerId = partnerId;
        }
      }
    }

    if (stage && stage !== "all") {
      filter.stage = stage;
    }

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    if (source && source !== "all") {
      filter.source = source;
    }

    if (destinationId && destinationId !== "all") {
      filter.destinationId = destinationId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: regex },
          { customerName: regex },
          { customerEmail: regex },
          { customerPhone: regex },
          { destinationName: regex },
          { tourTitle: regex },
        ],
      });
    }

    const leads = await Lead.find(filter)
      .populate({
        path: "partnerId",
        select: "name email companyName phone address assignedDestination",
        populate: { path: "assignedDestination", select: "name state" },
      })
      .populate("destinationId", "name state")
      .populate("tourId", "title slug priceInr coverImage")
      .populate("createdBy", "name email role")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // Calculate aggregated metrics for the current view
    // Compute overall pipeline stats (across the user's scope)
    const baseScope =
      auth.role === "partner"
        ? {
            $or: [
              { partnerId: auth.userId },
              { createdBy: auth.userId },
            ],
          }
        : {};

    const allScopedLeads = await Lead.find(baseScope).select("stage estimatedBudget").lean();

    let totalPipelineValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let activeLeadsCount = 0;
    const stageCounts: Record<string, { count: number; totalValue: number }> = {
      new: { count: 0, totalValue: 0 },
      contacted: { count: 0, totalValue: 0 },
      proposal: { count: 0, totalValue: 0 },
      negotiation: { count: 0, totalValue: 0 },
      won: { count: 0, totalValue: 0 },
      lost: { count: 0, totalValue: 0 },
    };

    allScopedLeads.forEach((l) => {
      const b = Number(l.estimatedBudget) || 0;
      const st = l.stage || "new";

      if (stageCounts[st]) {
        stageCounts[st].count += 1;
        stageCounts[st].totalValue += b;
      }

      if (st === "won") {
        wonCount += 1;
        wonValue += b;
      }

      if (st !== "lost") {
        totalPipelineValue += b;
        activeLeadsCount += 1;
      }
    });

    const winRate =
      allScopedLeads.length > 0
        ? Math.round((wonCount / allScopedLeads.length) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: leads,
      stats: {
        totalLeads: allScopedLeads.length,
        activeLeads: activeLeadsCount,
        totalPipelineValue,
        wonValue,
        wonCount,
        winRate,
        stageCounts,
      },
    });
  } catch (error: any) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || (auth.role !== "admin" && auth.role !== "partner")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      title,
      customerName,
      customerEmail,
      customerPhone,
      destinationId,
      destinationName,
      tourId,
      tourTitle,
      numberOfTravelers,
      estimatedBudget,
      expectedTravelDate,
      stage,
      priority,
      source,
      partnerId,
      requirements,
      nextFollowUp,
      nextFollowUpNotes,
      tags,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    let finalTourTitle = tourTitle?.trim() || "";
    let finalDestId = destinationId || null;
    let finalDestName = destinationName?.trim() || "";

    if (tourId) {
      const t = await Tour.findById(tourId);
      if (t) {
        finalTourTitle = t.title;
        if (!finalDestId && t.destinationId) finalDestId = t.destinationId;
        if (!finalDestName && t.state) finalDestName = t.state;
      }
    }

    if (!title?.trim() && !finalTourTitle) {
      return NextResponse.json(
        { error: "Deal / Journey title is required" },
        { status: 400 }
      );
    }

    const dealTitle = title?.trim() || finalTourTitle || `Journey - ${customerName.trim()}`;
    if (!finalTourTitle) finalTourTitle = dealTitle;

    // Resolve assigned partner
    let assignedPartnerId = partnerId || null;
    if (auth.role === "partner") {
      assignedPartnerId = auth.userId;
    }

    // Lookup destination name if ID was provided
    if (finalDestId && !finalDestName) {
      const d = await Destination.findById(finalDestId);
      if (d) finalDestName = d.name;
    }

    const initialActivities: ILeadActivity[] = [
      {
        type: "note",
        title: "Lead created manually",
        description: `Created by ${auth.name} (${auth.role.toUpperCase()})`,
        createdBy: auth.name,
        createdAt: new Date(),
      },
    ];

    if (nextFollowUp) {
      initialActivities.push({
        type: "task",
        title: "Scheduled Follow-up",
        description: nextFollowUpNotes || "Follow up with customer",
        dueDate: new Date(nextFollowUp),
        completed: false,
        createdBy: auth.name,
        createdAt: new Date(),
      });
    }

    const newLead: any = await Lead.create({
      title: dealTitle,
      customerName: customerName.trim(),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : "",
      customerPhone: customerPhone ? customerPhone.trim() : "",
      destinationId: finalDestId,
      destinationName: finalDestName,
      tourId: tourId || null,
      tourTitle: finalTourTitle,
      numberOfTravelers: Number(numberOfTravelers) || 1,
      estimatedBudget: Number(estimatedBudget) || 0,
      expectedTravelDate: expectedTravelDate ? new Date(expectedTravelDate) : null,
      stage: stage || "new",
      priority: priority || "medium",
      source: source || (auth.role === "partner" ? "partner_referral" : "direct_call"),
      partnerId: assignedPartnerId,
      createdBy: auth.userId,
      createdRole: auth.role,
      requirements: requirements || "",
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      nextFollowUpNotes: nextFollowUpNotes || "",
      tags: Array.isArray(tags) ? tags : [],
      activities: initialActivities,
    });

    const populated = await Lead.findById(newLead._id)
      .populate("partnerId", "name email companyName phone")
      .populate("destinationId", "name state")
      .populate("tourId", "title slug priceInr coverImage")
      .populate("createdBy", "name email role")
      .lean();

    return NextResponse.json(
      { success: true, data: populated },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
