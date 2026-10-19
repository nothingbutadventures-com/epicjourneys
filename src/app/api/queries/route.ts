import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Query from "@/models/Query";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;

    const queries = await Query.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: queries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    const newQuery = await Query.create({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone || "",
      subject: body.subject.trim(),
      category: body.category || "General Inquiry",
      message: body.message,
      status: "open",
      adminNotes: "",
    });

    // Auto-create CRM lead so all customer inquiries feed into the CRM pipeline
    try {
      const Lead = (await import("@/models/Lead")).default;
      await Lead.create({
        title: `${body.subject.trim()} - ${body.name.trim()}`,
        customerName: body.name.trim(),
        customerEmail: body.email.trim().toLowerCase(),
        customerPhone: body.phone || "+91 00000 00000",
        source: "website",
        stage: "new",
        priority: body.category === "Tour Booking" ? "high" : "medium",
        requirements: `Category: ${body.category}\n\nInquiry Message:\n${body.message}`,
        estimatedBudget: 0,
        numberOfTravelers: 1,
        createdRole: "system",
        activities: [
          {
            type: "note",
            title: "Website Inquiry Received",
            description: `Subject: ${body.subject}\nCategory: ${body.category}\n\n${body.message}`,
            createdBy: "Website System",
            createdAt: new Date(),
          },
        ],
      });
    } catch (leadErr) {
      console.warn("Could not auto-create CRM lead for query:", leadErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your inquiry has been submitted. Our support team will get back to you shortly.",
        data: newQuery,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

