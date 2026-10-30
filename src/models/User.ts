import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "partner" | "user";
  phone?: string;
  secondaryPhone?: string;
  companyName?: string;
  address?: string;
  notes?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  otpHash?: string;
  otpExpires?: Date;
  otpAttempts?: number;
  otpLastSent?: Date;
  assignedDestination?: mongoose.Types.ObjectId;
  partnerDiscountIds?: mongoose.Types.ObjectId[];
  adminRoleId?: mongoose.Types.ObjectId | null;
  commissionPercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    // Customers sign in with their mobile number, so email is optional for them (partners and admins always have one).
    email: { type: String, lowercase: true, trim: true, required: function (this: any) { return this.role !== "user"; } },
    // Customers sign in by mobile code and have no password (older email accounts keep theirs); partners and admins always do.
    password: { type: String, required: function (this: any) { return this.role !== "user"; } },
    role: {
      type: String,
      enum: ["admin", "partner", "user"],
      default: "user",
    },
    phone: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    // Extra partner details (managed by admins)
    secondaryPhone: { type: String, default: "" },
    companyName: { type: String, default: "" },
    address: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Accounts created before email verification existed have no value and are treated as verified.
    emailVerified: { type: Boolean },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLastSent: { type: Date, select: false },
    assignedDestination: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
    },
    // Partner-only discounts an admin has attached; the partner can apply them when booking for a customer.
    // Partners earn this % of the bookings made for their location. Set by admins.
    commissionPercent: { type: Number, default: 5, min: 0, max: 100 },
    // Staff: an admin-panel role limiting which pages and APIs this admin can use. Empty = super admin.
    adminRoleId: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    partnerDiscountIds: [{ type: Schema.Types.ObjectId, ref: "Discount" }],
  },
  { timestamps: true }
);

// Unique only where a value exists, so many customers can have no email.
UserSchema.index({ email: 1 }, { unique: true, name: "email_unique_partial", partialFilterExpression: { email: { $type: "string" } } });
// A unique customer-phone index is created by scripts/migrate-user-indexes.js once there are no duplicates; the sign-in code also checks.

// Prevent mongoose model overwrite error during hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
