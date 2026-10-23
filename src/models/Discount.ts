import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiscount extends Document {
  name: string;
  // "normal" discounts go on tour dates; "partner" discounts are attached to partner accounts.
  kind: "normal" | "partner";
  discountType: "percentage" | "fixed";
  value: number;
  description: string;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["normal", "partner"], default: "normal", index: true },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    value: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Discount: Model<IDiscount> =
  mongoose.models.Discount || mongoose.model<IDiscount>("Discount", DiscountSchema);

export default Discount;
