import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJourneyType extends Document {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JourneyTypeSchema = new Schema<IJourneyType>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const JourneyType: Model<IJourneyType> =
  mongoose.models.JourneyType ||
  mongoose.model<IJourneyType>("JourneyType", JourneyTypeSchema);

export default JourneyType;
