import mongoose, { Schema, Document, Model } from "mongoose";

// A time-boxed offer on every tour of one travel style. While it is live it overrides the dates' own discounts.
export interface ISpecialDiscount extends Document {
  name: string;
  travelStyle: string;
  percentage: number;
  startDate: Date; // start of the first day (IST)
  endDate: Date; // end of the last day (IST), inclusive
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialDiscountSchema = new Schema<ISpecialDiscount>(
  {
    name: { type: String, default: "", trim: true },
    travelStyle: { type: String, required: true, trim: true, index: true },
    percentage: { type: Number, required: true, min: 0.5, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SpecialDiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const SpecialDiscount: Model<ISpecialDiscount> =
  mongoose.models.SpecialDiscount || mongoose.model<ISpecialDiscount>("SpecialDiscount", SpecialDiscountSchema);
export default SpecialDiscount;
