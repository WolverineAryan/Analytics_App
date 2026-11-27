import mongoose, { Schema, Document } from "mongoose";

export type EventType = "page_view" | "click";

export interface IEvent extends Document {
  site_id?: string;
  session_id: string;
  event_type: EventType;
  url: string;
  timestamp: Date;
  x?: number;
  y?: number;
  viewport_w?: number;
  viewport_h?: number;
  element_tag?: string;
  element_text?: string;
}

const EventSchema = new Schema<IEvent>(
  {
    site_id: { type: String, trim: true, default: "default" },
    session_id: { type: String, required: true, trim: true },
    event_type: { type: String, enum: ["page_view", "click"], required: true },
    url: { type: String, required: true, trim: true },
    timestamp: { type: Date, required: true, default: Date.now },
    x: { type: Number },
    y: { type: Number },
    viewport_w: { type: Number },
    viewport_h: { type: Number },
    element_tag: { type: String, trim: true },
    element_text: { type: String, trim: true, maxlength: 80 },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Compound indexes for O(log n) session journey, site filtering & page heatmap queries
EventSchema.index({ session_id: 1, timestamp: 1 });
EventSchema.index({ url: 1, event_type: 1 });
EventSchema.index({ site_id: 1, timestamp: -1 });

export const Event = mongoose.model<IEvent>("Event", EventSchema);
