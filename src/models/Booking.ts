import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingRef: string;
  tourId: mongoose.Types.ObjectId;
  tourTitle: string;
  departureId?: mongoose.Types.ObjectId;
  departureCity?: string;
  travelEndDate?: Date;
  destinationId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: Date;
  numberOfTravelers: number;
  pricePerPerson: number;
  totalAmountInr: number;
  specialRequests?: string;
  status: "confirmed" | "pending" | "cancelled";
  bookedByRole: "user" | "partner";
  partnerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: { type: String, required: true, unique: true },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    tourTitle: { type: String, required: true },
    departureId: { type: Schema.Types.ObjectId },
    departureCity: { type: String, default: "" },
    travelEndDate: { type: Date },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    travelDate: { type: Date, required: true },
    numberOfTravelers: { type: Number, required: true, min: 1, default: 1 },
    pricePerPerson: { type: Number, required: true },
    totalAmountInr: { type: Number, required: true },
    specialRequests: { type: String, default: "" },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
    bookedByRole: {
      type: String,
      enum: ["user", "partner"],
      default: "user",
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ bookingRef: 1 });
BookingSchema.index({ tourId: 1 });
BookingSchema.index({ tourId: 1, departureId: 1 });
BookingSchema.index({ partnerId: 1 });
BookingSchema.index({ destinationId: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
