import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Job from "@/models/Job";
import JobApplication from "@/models/JobApplication";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanJob, openFilter, uniqueSlug } from "@/lib/careers";

const isAdmin = (req: NextRequest) => getAuthFromRequest(req)?.role === "admin";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const all = new URL(req.url).searchParams.get("all") === "true";
    if (all && !isAdmin(req)) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });

    const jobs: any[] = await Job.find(all ? {} : openFilter()).sort({ createdAt: -1 }).lean();
    if (all) {
      const counts = await JobApplication.aggregate([{ $match: { jobId: { $ne: null } } }, { $group: { _id: "$jobId", n: { $sum: 1 }, fresh: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } } } }]);
      const map = new Map(counts.map((c) => [String(c._id), c]));
      jobs.forEach((j) => {
        const c = map.get(String(j._id));
        j.applications = c?.n || 0;
        j.newApplications = c?.fresh || 0;
      });
    }
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    await connectToDatabase();
    const data = cleanJob(await req.json());
    if (!data.title || !data.department || !data.location) {
      return NextResponse.json({ error: "Title, department and location are required." }, { status: 400 });
    }
    const job = await Job.create({ ...data, slug: await uniqueSlug(data.title) });
    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
