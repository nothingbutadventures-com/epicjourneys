import Job from "@/models/Job";

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "role";

export async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; await Job.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i++) slug = `${base}-${i}`;
  return slug;
}

/** A job is publicly visible when open and its closing date (inclusive) hasn't passed. */
export function openFilter(): any {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { status: "open", $or: [{ closingDate: null }, { closingDate: { $exists: false } }, { closingDate: { $gte: start } }] };
}

const lines = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => String(x).trim()).filter(Boolean).slice(0, 30);

export function cleanJob(body: any) {
  const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  return {
    title: text(body.title, 120),
    department: text(body.department, 60),
    location: text(body.location, 80),
    workMode: ["onsite", "hybrid", "remote"].includes(body.workMode) ? body.workMode : "onsite",
    type: ["full-time", "part-time", "internship", "contract"].includes(body.type) ? body.type : "full-time",
    experience: text(body.experience, 60),
    salary: text(body.salary, 80),
    summary: text(body.summary, 300),
    description: text(body.description, 6000),
    responsibilities: lines(body.responsibilities),
    requirements: lines(body.requirements),
    niceToHave: lines(body.niceToHave),
    openings: Math.max(1, Math.min(100, Math.floor(Number(body.openings)) || 1)),
    status: ["draft", "open", "closed"].includes(body.status) ? body.status : "draft",
    closingDate: body.closingDate ? new Date(body.closingDate) : null,
  };
}
