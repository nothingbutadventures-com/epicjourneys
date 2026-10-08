import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuery extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: "General Inquiry" | "Tour Booking" | "Cancellation & Refund" | "Feedback & Review" | "Partnership";
  message: string;
  status: "open" | "in_progress" | "resolved";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuerySchema = new Schema<IQuery>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "General Inquiry",
        "Tour Booking",
        "Cancellation & Refund",
        "Feedback & Review",
        "Partnership",
      ],
      default: "General Inquiry",
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Query: Model<IQuery> =
  mongoose.models.Query || mongoose.model<IQuery>("Query", QuerySchema);

export default Query;
