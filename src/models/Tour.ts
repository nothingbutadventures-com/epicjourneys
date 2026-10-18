import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  meals?: string;
  stay?: string;
  destinationId?: mongoose.Types.ObjectId | null; // legacy single city
  destinationName?: string;
  destinations?: { destinationId: mongoose.Types.ObjectId; name: string }[];
}

export interface IExtraDay {
  title: string;
  description?: string;
  meals?: string;
  stay?: string;
  destinations?: { destinationId: mongoose.Types.ObjectId; name: string }[];
}

export interface IDeparture {
  _id: mongoose.Types.ObjectId;
  cityId: mongoose.Types.ObjectId;
  addressId?: mongoose.Types.ObjectId;
  price: number;
  extraPriceInr?: number | null;
  startItinerary?: IExtraDay[];
  endItinerary?: IExtraDay[];
  launchId?: mongoose.Types.ObjectId | null;
  partnerId?: mongoose.Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  seats: number;
  discountPercentage: number;
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
  targetCity?: string;
  durationDays: number;
  durationNights: number;
  priceInr: number;
  basePriceInr?: number;
  baseStartCityId?: mongoose.Types.ObjectId | null;
  baseAddressId?: mongoose.Types.ObjectId | null;
  highlights: string[];
  itinerary: IItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  travelStyles?: string[];
  physicalRating?: string;
  discountPercentage?: number;
  maxGroupSize: number;
  singleRoomPriceInr?: number;
  depositType?: "amount" | "percentage";
  depositValue?: number;
  departures: IDeparture[];
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
    // The city this day is spent in (a tour can span several).
    destinationId: { type: Schema.Types.ObjectId, ref: "Destination", default: null },
    destinationName: { type: String, default: "" },
    // Cities visited that day, in order: City1 → City2 → City3.
    destinations: {
      type: [{ destinationId: { type: Schema.Types.ObjectId, ref: "Destination" }, name: { type: String, default: "" }, _id: false }],
      default: [],
    },
  },
  { _id: false }
);

// Extra days a partner adds before / after the main itinerary for their city.
const ExtraDaySchema = new Schema<IExtraDay>(
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

const DepartureSchema = new Schema<IDeparture>({
  // Start & end city for this date (a Destination)
  cityId: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
  // One of the city's addresses (Destination.addresses) where this date starts.
  addressId: { type: Schema.Types.ObjectId, default: null },
  // Final per-person price for this date: tour base price + the city supplement (when launched via a partner).
  price: { type: Number, required: true, min: 0 },
  extraPriceInr: { type: Number, default: null },
  startItinerary: { type: [ExtraDaySchema], default: [] },
  endItinerary: { type: [ExtraDaySchema], default: [] },
  launchId: { type: Schema.Types.ObjectId, ref: "TourLaunch", default: null },
  partnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  seats: { type: Number, required: true, min: 1 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
});

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
    // Tours are no longer tied to a start/end city; those come from each partner launch.
    startingPoint: { type: String, default: "", trim: true },
    endingPoint: { type: String, default: "", trim: true },
    targetCity: { type: String, default: "", trim: true },
    durationDays: { type: Number, required: true, default: 3 },
    durationNights: { type: Number, required: true, default: 2 },
    priceInr: { type: Number, required: true },
    // Admin-set base price per person. City supplements are added on top for each launched date.
    basePriceInr: { type: Number, default: 0, min: 0 },
    // Where the basic tour itself starts and ends ("Joining / Leaving"). Falls back to the tour's destination.
    baseStartCityId: { type: Schema.Types.ObjectId, ref: "Destination", default: null },
    baseAddressId: { type: Schema.Types.ObjectId, default: null },
    highlights: [{ type: String }],
    itinerary: [ItineraryDaySchema],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    travelStyles: [{ type: String }],
    physicalRating: { type: String, default: "Easy / Relaxed" },
    discountPercentage: { type: Number, default: 0 },
    maxGroupSize: { type: Number, default: 15 },
    // Extra per-person charge for a private (single) room; shared rooms are included in the base price.
    singleRoomPriceInr: { type: Number, default: 0, min: 0 },
    // Minimum deposit to reserve a seat: ₹ per person (amount) or % of the total (percentage). 0 disables it.
    depositType: { type: String, enum: ["amount", "percentage"], default: "percentage" },
    depositValue: { type: Number, default: 30, min: 0 },
    departures: [DepartureSchema],
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
