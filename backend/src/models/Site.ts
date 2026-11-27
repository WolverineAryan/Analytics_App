import mongoose, { Schema, Document } from "mongoose";

export interface ISite extends Document {
  site_id: string;
  name: string;
  url: string;
  origin: string;
  created_at: Date;
}

const SiteSchema = new Schema<ISite>(
  {
    site_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

SiteSchema.index({ origin: 1 });

export const Site = mongoose.model<ISite>("Site", SiteSchema);
