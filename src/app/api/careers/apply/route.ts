import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Job from "@/models/Job";
import JobApplication from "@/models/JobApplication";
import { cleanMobile } from "@/lib/address";
import { openFilter } from "@/lib/careers";
import { sendApplicationReceived, sendNewApplicationAlert } from "@/lib/career-mail";

const MAX_RESUME = 3 * 1024 * 1024;
const RESUME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};
const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const isUrl = (v: string) => !v || /^https?:\/\/\S+\.\S+/i.test(v);

// Public: anyone can apply to an open role (or send an open application).
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    // Honeypot: real visitors never fill this hidden field.
    if (text(form.get("website"), 100)) return NextResponse.json({ success: true });

    const name = text(form.get("name"), 80);
    const email = text(form.get("email"), 120).toLowerCase();
    const phone = cleanMobile(text(form.get("phone"), 20));
    const linkedin = text(form.get("linkedin"), 300);
    const portfolio = text(form.get("portfolio"), 300);
    const years = text(form.get("experienceYears"), 4);
    const experienceYears = years === "" ? undefined : Number(years);

    if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    if (!isUrl(linkedin) || !isUrl(portfolio)) return NextResponse.json({ error: "Profile links must start with http:// or https://" }, { status: 400 });
    if (experienceYears !== undefined && !(experienceYears >= 0 && experienceYears <= 60)) {
      return NextResponse.json({ error: "Enter your years of experience as a number." }, { status: 400 });
    }

    const file = form.get("resume");
    let resume: { filename: string; contentType: string; size: number; data: Buffer } | undefined;
    if (file && typeof file !== "string" && file.size > 0) {
      if (file.size > MAX_RESUME) return NextResponse.json({ error: "Your resume must be 3 MB or smaller." }, { status: 400 });
      if (!RESUME_TYPES[file.type]) return NextResponse.json({ error: "Upload your resume as a PDF, DOC or DOCX file." }, { status: 400 });
      resume = { filename: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120), contentType: file.type, size: file.size, data: Buffer.from(await file.arrayBuffer()) };
    }
    if (!resume) return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });

    await connectToDatabase();

    const jobId = text(form.get("jobId"), 40);
    let job: any = null;
    if (jobId) {
      job = mongoose.isValidObjectId(jobId) ? await Job.findOne({ _id: jobId, ...openFilter() }).select("title") : null;
      if (!job) return NextResponse.json({ error: "This role is no longer open." }, { status: 404 });
    }

    const dup = await JobApplication.findOne({ email, jobId: job ? job._id : null, status: { $ne: "rejected" } }).select("_id");
    if (dup) {
      return NextResponse.json({ error: job ? "You've already applied for this role. We'll be in touch soon." : "We already have your open application. We'll be in touch if there's a match." }, { status: 409 });
    }

    const app = await JobApplication.create({
      jobId: job ? job._id : null,
      jobTitle: job ? job.title : "Open application",
      name,
      email,
      phone,
      city: text(form.get("city"), 80),
      linkedin,
      portfolio,
      currentCompany: text(form.get("currentCompany"), 120),
      experienceYears,
      noticePeriod: text(form.get("noticePeriod"), 60),
      expectedSalary: text(form.get("expectedSalary"), 60),
      coverLetter: text(form.get("coverLetter"), 3000),
      resume,
      history: [{ status: "new", at: new Date() }],
    });

    // Emails never block the application from being saved.
    const jobTitle = app.jobTitle;
    await Promise.allSettled([
      sendApplicationReceived({ to: email, name, jobTitle, general: !job }),
      sendNewApplicationAlert({ name, email, phone, jobTitle, experienceYears, currentCompany: app.currentCompany }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/careers/apply error:", error);
    return NextResponse.json({ error: "Could not submit your application. Please try again." }, { status: 500 });
  }
}
