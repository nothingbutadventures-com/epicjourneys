import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  meals?: string;
  stay?: string;
}

export interface ITour extends Document {
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  state: string;
  destinationId: mongoose.Types.ObjectId;
  startingPoint: string;
  endingPoint: string;
  durationDays: number;
  durationNights: number;
  priceInr: number;
  highlights: string[];
  itinerary: IItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  travelStyles?: string[];
  physicalRating?: string;
  journeyType?: string;
  discountPercentage?: number;
  maxGroupSize: number;
  coverImage: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    meals: { type: String, default: "Breakfast" },
    stay: { type: String, default: "Standard Hotel / Resort" },
  },
  { _id: false }
);

const TourSchema = new Schema<ITour>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, required: true },
    state: { type: String, required: true, trim: true },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
      required: true,
    },
    startingPoint: { type: String, required: true, trim: true },
    endingPoint: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, default: 3 },
    durationNights: { type: Number, required: true, default: 2 },
    priceInr: { type: Number, required: true },
    highlights: [{ type: String }],
    itinerary: [ItineraryDaySchema],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    travelStyles: [{ type: String }],
    physicalRating: { type: String, default: "Easy / Relaxed" },
    journeyType: { type: String, default: "Guided Group Tour" },
    discountPercentage: { type: Number, default: 0 },
    maxGroupSize: { type: Number, default: 15 },
    coverImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
    },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TourSchema.index({ state: 1, destinationId: 1, isActive: 1 });
TourSchema.index({ slug: 1 });

const Tour: Model<ITour> =
  mongoose.models.Tour || mongoose.model<ITour>("Tour", TourSchema);

export default Tour;
