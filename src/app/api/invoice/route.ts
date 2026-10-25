import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { loadOwnedBooking } from "@/lib/checkout-server";
import { buildInvoice } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

// The booking owner, the partner who made the booking, or an admin can open the invoice.
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref") || "";
    const found = await loadOwnedBooking(req, ref);
    if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });
    const b = found.booking.toObject();
    const partner: any = b.bookedByRole === "partner" && b.partnerId ? await User.findById(b.partnerId).select("name phone email").lean() : null;
    const invoice = buildInvoice(b, partner);

    if (searchParams.get("format") === "pdf") {
      const pdf = await generateInvoicePdf(invoice);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    console.error("GET /api/invoice error:", error);
    return NextResponse.json({ error: "Could not load the invoice" }, { status: 500 });
  }
}
