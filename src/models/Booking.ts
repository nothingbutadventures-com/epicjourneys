import mongoose, { Schema, Document, Model } from "mongoose";
import Destination from "@/models/Destination";

export interface IBookingTraveller {
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  email?: string;
  roomType: "shared" | "single";
}

export interface IInstallment {
  index: number;
  label: string;
  amountInr: number;
  dueDate: Date;
  status: "pending" | "paid";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  simulated?: boolean;
  offline?: boolean;
  paidAt?: Date;
}

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
  locationId?: mongoose.Types.ObjectId;
  commissionPartnerId?: mongoose.Types.ObjectId | null;
  userId?: mongoose.Types.ObjectId;
  travellers: IBookingTraveller[];
  roomSupplementInr: number;
  partnerDiscountId?: mongoose.Types.ObjectId;
  partnerDiscountName?: string;
  partnerDiscountInr: number;
  paymentStrategy: "full" | "deposit" | "emi";
  installments: IInstallment[];
  paymentStatus: "pending" | "partial" | "paid";
  amountPaidInr: number;
  holdExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TravellerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    email: { type: String, trim: true, lowercase: true },
    roomType: { type: String, enum: ["shared", "single"], default: "shared" },
  },
  { _id: false }
);

const InstallmentSchema = new Schema(
  {
    index: { type: Number, required: true },
    label: { type: String, required: true },
    amountInr: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    simulated: { type: Boolean, default: false },
    // Recorded manually by an admin (cash / bank transfer).
    offline: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { _id: false }
);

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
    // Customers who sign in with their mobile number may have no email.
    customerEmail: { type: String, default: "", trim: true, lowercase: true },
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
    // The location this booking belongs to. Partners see bookings by location, so a new partner inherits them.
    locationId: { type: Schema.Types.ObjectId, ref: "Destination", default: null, index: true },
    // The partner managing the location when the booking was made. They earn commission on it, even if the location later changes partner.
    commissionPartnerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    travellers: { type: [TravellerSchema], default: [] },
    roomSupplementInr: { type: Number, default: 0 },
    // Extra discount a partner applied when booking for a customer (already deducted from totalAmountInr).
    partnerDiscountId: { type: Schema.Types.ObjectId, ref: "Discount" },
    partnerDiscountName: { type: String, default: "" },
    partnerDiscountInr: { type: Number, default: 0 },
    // "emi" is legacy (early test bookings); new bookings use "full" or "deposit".
    paymentStrategy: { type: String, enum: ["full", "deposit", "emi"], default: "full" },
    installments: { type: [InstallmentSchema], default: [] },
    paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "paid" },
    amountPaidInr: { type: Number, default: 0 },
    // Pending (unpaid) checkouts hold their seats only until this time.
    holdExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Every new booking is tied to the location's partner at that moment (covers all creation paths).
BookingSchema.pre("save", async function () {
  if (!this.isNew || this.commissionPartnerId || !this.locationId) return;
  try {
    const dest: any = await Destination.findById(this.locationId).select("partnerId").lean();
    if (dest?.partnerId) this.commissionPartnerId = dest.partnerId;
  } catch (e) {
    console.error("commission partner lookup failed", e);
  }
});

BookingSchema.index({ bookingRef: 1 });
BookingSchema.index({ tourId: 1 });
BookingSchema.index({ tourId: 1, departureId: 1 });
BookingSchema.index({ partnerId: 1 });
BookingSchema.index({ userId: 1 });
BookingSchema.index({ destinationId: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
