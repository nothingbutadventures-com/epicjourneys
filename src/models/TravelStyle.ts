import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITravelStyle extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TravelStyleSchema = new Schema<ITravelStyle>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "travel" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TravelStyle: Model<ITravelStyle> =
  mongoose.models.TravelStyle ||
  mongoose.model<ITravelStyle>("TravelStyle", TravelStyleSchema);

export default TravelStyle;
