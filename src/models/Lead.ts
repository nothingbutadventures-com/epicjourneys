import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILeadActivity {
  _id?: mongoose.Types.ObjectId;
  type: "note" | "call" | "email" | "meeting" | "proposal" | "status_change" | "task";
  title: string;
  description?: string;
  dueDate?: Date | null;
  completed?: boolean;
  createdBy: string;
  createdAt?: Date;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadPriority = "low" | "medium" | "high" | "urgent";

export type LeadSource =
  | "website"
  | "custom_trip"
  | "direct_call"
  | "whatsapp"
  | "partner_referral"
  | "social_media"
  | "walk_in"
  | "other";

export interface ILead extends Document {
  title: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  destinationId?: mongoose.Types.ObjectId | null;
  destinationName?: string;
  tourId?: mongoose.Types.ObjectId | null;
  tourTitle?: string;
  numberOfTravelers: number;
  estimatedBudget: number;
  expectedTravelDate?: Date | null;
  stage: LeadStage;
  priority: LeadPriority;
  source: LeadSource;
  partnerId?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  createdRole: "admin" | "partner" | "system";
  lossReason?: string;
  bookingId?: mongoose.Types.ObjectId | null;
  bookingRef?: string;
  nextFollowUp?: Date | null;
  nextFollowUpNotes?: string;
  requirements?: string;
  tags: string[];
  activities: ILeadActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<ILeadActivity>(
  {
    type: {
      type: String,
      enum: ["note", "call", "email", "meeting", "proposal", "status_change", "task"],
      default: "note",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    createdBy: { type: String, default: "System" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const LeadSchema = new Schema<ILead>(
  {
    title: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: "", trim: true, lowercase: true },
    customerPhone: { type: String, default: "", trim: true },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
    },
    destinationName: { type: String, default: "" },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      default: null,
    },
    tourTitle: { type: String, default: "" },
    numberOfTravelers: { type: Number, default: 1, min: 1 },
    estimatedBudget: { type: Number, default: 0, min: 0 },
    expectedTravelDate: { type: Date, default: null },
    stage: {
      type: String,
      enum: ["new", "contacted", "proposal", "negotiation", "won", "lost"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    source: {
      type: String,
      enum: [
        "website",
        "custom_trip",
        "direct_call",
        "whatsapp",
        "partner_referral",
        "social_media",
        "walk_in",
        "other",
      ],
      default: "website",
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdRole: {
      type: String,
      enum: ["admin", "partner", "system"],
      default: "system",
    },
    lossReason: { type: String, default: "" },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    bookingRef: { type: String, default: "" },
    nextFollowUp: { type: Date, default: null },
    nextFollowUpNotes: { type: String, default: "" },
    requirements: { type: String, default: "" },
    tags: { type: [String], default: [] },
    activities: { type: [ActivitySchema], default: [] },
  },
  { timestamps: true }
);

LeadSchema.index({ stage: 1 });
LeadSchema.index({ partnerId: 1 });
LeadSchema.index({ destinationId: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ customerPhone: 1 });
LeadSchema.index({ customerEmail: 1 });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
