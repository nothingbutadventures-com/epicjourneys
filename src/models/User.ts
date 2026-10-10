import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "partner" | "user";
  phone?: string;
  emailVerified?: boolean;
  otpHash?: string;
  otpExpires?: Date;
  otpAttempts?: number;
  otpLastSent?: Date;
  assignedDestination?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "partner", "user"],
      default: "user",
    },
    phone: { type: String, default: "" },
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
  },
  { timestamps: true }
);

// Prevent mongoose model overwrite error during hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
