import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhysicalRating extends Document {
  name: string;
  level: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PhysicalRatingSchema = new Schema<IPhysicalRating>(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PhysicalRating: Model<IPhysicalRating> =
  mongoose.models.PhysicalRating ||
  mongoose.model<IPhysicalRating>("PhysicalRating", PhysicalRatingSchema);

export default PhysicalRating;
