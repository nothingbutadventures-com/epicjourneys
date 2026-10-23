import mongoose, { Schema, Document, Model } from "mongoose";

export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "interview", "offered", "hired", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface IJobApplication extends Document {
  jobId?: mongoose.Types.ObjectId | null;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  linkedin?: string;
  portfolio?: string;
  currentCompany?: string;
  experienceYears?: number;
  noticePeriod?: string;
  expectedSalary?: string;
  coverLetter?: string;
  resume?: { filename: string; contentType: string; size: number; data?: Buffer };
  status: ApplicationStatus;
  adminNotes?: string;
  history: { status: ApplicationStatus; at: Date; emailed?: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    // Empty for open (general) applications.
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null, index: true },
    jobTitle: { type: String, default: "Open application" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    portfolio: { type: String, default: "", trim: true },
    currentCompany: { type: String, default: "", trim: true },
    experienceYears: { type: Number, min: 0, max: 60 },
    noticePeriod: { type: String, default: "", trim: true },
    expectedSalary: { type: String, default: "", trim: true },
    coverLetter: { type: String, default: "" },
    resume: {
      filename: String,
      contentType: String,
      size: Number,
      data: { type: Buffer, select: false },
    },
    status: { type: String, enum: APPLICATION_STATUSES, default: "new", index: true },
    adminNotes: { type: String, default: "" },
    history: { type: [{ status: String, at: Date, emailed: Boolean, _id: false }], default: [] },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1, email: 1 });
JobApplicationSchema.index({ createdAt: -1 });

const JobApplication: Model<IJobApplication> =
  mongoose.models.JobApplication || mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);
export default JobApplication;
