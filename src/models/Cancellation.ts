import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICancellation extends Document {
  bookingId?: mongoose.Types.ObjectId;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tourTitle: string;
  reason: string;
  refundAmountInr: number;
  status: "pending" | "approved" | "rejected" | "refunded";
  adminNotes?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CancellationSchema = new Schema<ICancellation>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    bookingRef: { type: String, required: true, trim: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    tourTitle: { type: String, required: true },
    reason: { type: String, required: true },
    refundAmountInr: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "refunded"],
      default: "pending",
    },
    adminNotes: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const Cancellation: Model<ICancellation> =
  mongoose.models.Cancellation ||
  mongoose.model<ICancellation>("Cancellation", CancellationSchema);

export default Cancellation;
