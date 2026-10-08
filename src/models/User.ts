import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "partner" | "user";
  phone?: string;
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
