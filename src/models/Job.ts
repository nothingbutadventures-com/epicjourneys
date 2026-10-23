import mongoose, { Schema, Document, Model } from "mongoose";

export const JOB_TYPES = ["full-time", "part-time", "internship", "contract"] as const;
export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;

export interface IJob extends Document {
  title: string;
  slug: string;
  department: string;
  location: string;
  workMode: (typeof WORK_MODES)[number];
  type: (typeof JOB_TYPES)[number];
  experience: string;
  salary?: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  openings: number;
  status: "draft" | "open" | "closed";
  closingDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    workMode: { type: String, enum: WORK_MODES, default: "onsite" },
    type: { type: String, enum: JOB_TYPES, default: "full-time" },
    experience: { type: String, default: "", trim: true },
    salary: { type: String, default: "", trim: true },
    summary: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    niceToHave: { type: [String], default: [] },
    openings: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["draft", "open", "closed"], default: "draft", index: true },
    closingDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
export default Job;
