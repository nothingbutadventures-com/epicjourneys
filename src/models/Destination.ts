import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDestinationAddress {
  _id: mongoose.Types.ObjectId;
  label: string;
  address: string;
  landmark?: string;
  pincode?: string;
  mobile?: string;
  secondaryMobile?: string;
  mapUrl?: string;
}

export interface IDestination extends Document {
  name: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  coverImage?: string;
  partnerId?: mongoose.Types.ObjectId;
  addresses: IDestinationAddress[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Meeting / starting points in this city. A tour date picks one of them as its reporting address.
const AddressSchema = new Schema<IDestinationAddress>({
  label: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  landmark: { type: String, default: "", trim: true },
  pincode: { type: String, default: "", trim: true },
  mobile: { type: String, default: "", trim: true },
  secondaryMobile: { type: String, default: "", trim: true },
  mapUrl: { type: String, default: "", trim: true },
});

const DestinationSchema = new Schema<IDestination>(
  {
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    description: { type: String, default: "" },
    coverImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    addresses: { type: [AddressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DestinationSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });
DestinationSchema.index({ name: 1, state: 1 });

const Destination: Model<IDestination> =
  mongoose.models.Destination ||
  mongoose.model<IDestination>("Destination", DestinationSchema);

export default Destination;
