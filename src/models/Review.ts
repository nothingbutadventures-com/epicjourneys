import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  tourId?: mongoose.Types.ObjectId;
  tourTitle: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  comment: string;
  location?: string;
  status: "published" | "pending" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    tourId: { type: Schema.Types.ObjectId, ref: "Tour" },
    tourTitle: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    location: { type: String, default: "India" },
    status: {
      type: String,
      enum: ["published", "pending", "hidden"],
      default: "published",
    },
  },
  { timestamps: true }
);

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
