import mongoose, { Schema, Document, Model } from "mongoose";

/** One key pair for one environment. The secret is stored encrypted and never leaves the server. */
export interface IKeyPair {
  keyId?: string;
  secretEnc?: string;
  updatedAt?: Date;
}

export interface IIntegration extends Document {
  provider: string;
  /** Which key pair checkout uses right now. */
  mode: "test" | "live";
  test: IKeyPair;
  live: IKeyPair;
  createdAt: Date;
  updatedAt: Date;
}

const KeyPairSchema = new Schema<IKeyPair>(
  { keyId: { type: String, trim: true }, secretEnc: { type: String }, updatedAt: { type: Date } },
  { _id: false }
);

const IntegrationSchema = new Schema<IIntegration>(
  {
    provider: { type: String, required: true, unique: true, trim: true },
    mode: { type: String, enum: ["test", "live"], default: "test" },
    test: { type: KeyPairSchema, default: {} },
    live: { type: KeyPairSchema, default: {} },
  },
  { timestamps: true }
);

const Integration: Model<IIntegration> = mongoose.models.Integration || mongoose.model<IIntegration>("Integration", IntegrationSchema);
export default Integration;
