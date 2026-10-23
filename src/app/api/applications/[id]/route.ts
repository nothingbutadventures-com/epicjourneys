import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import JobApplication, { APPLICATION_STATUSES } from "@/models/JobApplication";
import { getAuthFromRequest } from "@/lib/auth";
import { NOTIFY_STATUSES, sendStatusEmail } from "@/lib/career-mail";

const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();
    const app = await JobApplication.findById(id).select("-resume.data");
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    if (body.adminNotes !== undefined) app.adminNotes = String(body.adminNotes).slice(0, 3000);

    let emailError: string | null = null;
    if (body.status !== undefined && body.status !== app.status) {
      if (!(APPLICATION_STATUSES as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      const status = body.status as (typeof APPLICATION_STATUSES)[number];
      let emailed = false;
      // Candidates are emailed on the key milestones unless the admin turns that off.
      if (body.notify !== false && (NOTIFY_STATUSES as string[]).includes(status)) {
        try {
          await sendStatusEmail({ to: app.email, name: app.name, jobTitle: app.jobTitle, status: status as any, message: String(body.message || "").slice(0, 1500) });
          emailed = true;
        } catch (e: any) {
          console.error("status email failed", e);
          emailError = "Status saved, but the email to the candidate could not be sent.";
        }
      }
      app.status = status;
      app.history.push({ status, at: new Date(), emailed });
    }
    await app.save();
    return NextResponse.json({ success: true, data: app, warning: emailError });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (getAuthFromRequest(req)?.role !== "admin") return deny();
    const { id } = await params;
    await connectToDatabase();
    await JobApplication.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
