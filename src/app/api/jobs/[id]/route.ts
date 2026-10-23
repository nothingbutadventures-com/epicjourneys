import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Job from "@/models/Job";
import JobApplication from "@/models/JobApplication";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanJob, openFilter, uniqueSlug } from "@/lib/careers";

const isAdmin = (req: NextRequest) => getAuthFromRequest(req)?.role === "admin";
const deny = () => NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const key = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
    const job = await Job.findOne(isAdmin(req) ? key : { ...key, ...openFilter() }).lean();
    if (!job) return NextResponse.json({ error: "This role is no longer open." }, { status: 404 });
    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return deny();
    const { id } = await params;
    await connectToDatabase();
    const existing = await Job.findById(id);
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const body = await req.json();

    // A partial body (e.g. just { status }) only changes what was sent.
    const full = cleanJob({ ...existing.toObject(), ...body });
    if (!full.title || !full.department || !full.location) {
      return NextResponse.json({ error: "Title, department and location are required." }, { status: 400 });
    }
    const slug = full.title !== existing.title ? await uniqueSlug(full.title, id) : existing.slug;
    const updated = await Job.findByIdAndUpdate(id, { ...full, slug }, { new: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return deny();
    const { id } = await params;
    await connectToDatabase();
    const apps = await JobApplication.countDocuments({ jobId: id });
    if (apps > 0) {
      return NextResponse.json({ error: `This role has ${apps} application${apps === 1 ? "" : "s"}. Close it instead of deleting so the applications are kept.` }, { status: 400 });
    }
    await Job.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
