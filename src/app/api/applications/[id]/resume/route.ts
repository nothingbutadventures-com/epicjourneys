import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import JobApplication from "@/models/JobApplication";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (getAuthFromRequest(req)?.role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  const app: any = await JobApplication.findById(id).select("resume +resume.data").lean();
  if (!app?.resume?.data) return NextResponse.json({ error: "No resume on file" }, { status: 404 });
  const buf = Buffer.from(app.resume.data.buffer ?? app.resume.data);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": app.resume.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${app.resume.filename || "resume"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
