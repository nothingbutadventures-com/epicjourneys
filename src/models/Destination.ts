import mongoose, { Schema, Document, Model } from "mongoose";

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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
