import mongoose, { Schema, Document, Model } from "mongoose";

export type LaunchStatus =
  | "submitted" // partner sent the request; admin to review
  | "awaiting_partner" // admin edited & priced it; partner to confirm
  | "changes_requested" // partner asked for changes; admin to revise
  | "partner_approved" // partner agreed; admin to give final approval
  | "approved" // live on the website
  | "rejected"
  | "withdrawn"
  | "closed"; // taken offline after going live

export interface ILaunchDate {
  _id: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  seats: number;
  discountPercentage: number;
}

export interface ILaunchMessage {
  by: "partner" | "admin" | "system";
  name: string;
  kind: string; // request | message | sent | changes | agreed | approved | rejected | recalled | withdrawn | closed
  text: string;
  at: Date;
}

export interface ITourLaunch extends Document {
  tourId: mongoose.Types.ObjectId;
  cityId: mongoose.Types.ObjectId; // start & end city (the partner's city)
  partnerId?: mongoose.Types.ObjectId | null;
  addressId?: mongoose.Types.ObjectId | null;
  dates: ILaunchDate[];
  startItinerary: { title: string; description?: string; meals?: string; stay?: string; destinations?: { destinationId: mongoose.Types.ObjectId; name: string }[] }[];
  endItinerary: { title: string; description?: string; meals?: string; stay?: string; destinations?: { destinationId: mongoose.Types.ObjectId; name: string }[] }[];
  startNotes: string[]; // partner's ideas for days before the tour
  endNotes: string[]; // ...and days after
  extraPriceInr: number | null; // set by admin during review
  partnerNotes?: string;
  status: LaunchStatus;
  revision: number;
  messages: ILaunchMessage[];
  departureIds: mongoose.Types.ObjectId[]; // Tour.departures created when approved
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    meals: { type: String, default: "" },
    stay: { type: String, default: "" },
    destinations: {
      type: [{ destinationId: { type: Schema.Types.ObjectId, ref: "Destination" }, name: { type: String, default: "" }, _id: false }],
      default: [],
    },
  },
  { _id: false }
);

const LaunchDateSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  seats: { type: Number, required: true, min: 1 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
});

const MessageSchema = new Schema(
  {
    by: { type: String, enum: ["partner", "admin", "system"], required: true },
    name: { type: String, default: "" },
    kind: { type: String, default: "message" },
    text: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TourLaunchSchema = new Schema<ITourLaunch>(
  {
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    cityId: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    addressId: { type: Schema.Types.ObjectId, default: null },
    dates: { type: [LaunchDateSchema], default: [] },
    startItinerary: { type: [DaySchema], default: [] },
    endItinerary: { type: [DaySchema], default: [] },
    startNotes: { type: [String], default: [] },
    endNotes: { type: [String], default: [] },
    extraPriceInr: { type: Number, default: null, min: 0 },
    partnerNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "awaiting_partner", "changes_requested", "partner_approved", "approved", "rejected", "withdrawn", "closed"],
      default: "submitted",
    },
    revision: { type: Number, default: 1 },
    messages: { type: [MessageSchema], default: [] },
    departureIds: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

TourLaunchSchema.index({ status: 1, updatedAt: -1 });
TourLaunchSchema.index({ partnerId: 1, status: 1 });
TourLaunchSchema.index({ tourId: 1, cityId: 1 });

const TourLaunch: Model<ITourLaunch> =
  mongoose.models.TourLaunch || mongoose.model<ITourLaunch>("TourLaunch", TourLaunchSchema);

export default TourLaunch;
