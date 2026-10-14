import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPartnerRequest extends Document {
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  companyName?: string;
  city: string;
  state: string;
  destinationId?: mongoose.Types.ObjectId;
  address?: string;
  experience?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  partnerId?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerRequestSchema = new Schema<IPartnerRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    secondaryPhone: { type: String, default: "", trim: true },
    companyName: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    destinationId: { type: Schema.Types.ObjectId, ref: "Destination" },
    address: { type: String, default: "" },
    experience: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNotes: { type: String, default: "" },
    partnerId: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

PartnerRequestSchema.index({ status: 1, createdAt: -1 });

const PartnerRequest: Model<IPartnerRequest> =
  mongoose.models.PartnerRequest || mongoose.model<IPartnerRequest>("PartnerRequest", PartnerRequestSchema);

export default PartnerRequest;
