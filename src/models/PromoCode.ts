import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minBookingAmount: number;
  maxDiscountInr?: number;
  usageLimit: number;
  usageCount: number;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    value: { type: Number, required: true, min: 0 },
    minBookingAmount: { type: Number, default: 0 },
    maxDiscountInr: { type: Number, default: 5000 },
    usageLimit: { type: Number, default: 100 },
    usageCount: { type: Number, default: 0 },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PromoCode: Model<IPromoCode> =
  mongoose.models.PromoCode || mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);

export default PromoCode;
