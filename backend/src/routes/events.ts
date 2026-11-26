import { Router, Request, Response } from "express";
import { z } from "zod";
import { Event } from "../models/Event";

const router = Router();

const eventSchema = z
  .object({
    session_id: z.string().min(1, "session_id is required").max(128),
    event_type: z.enum(["page_view", "click"]),
    url: z.string().min(1, "url is required").max(2048),
    timestamp: z
      .union([z.string(), z.number(), z.date()])
      .optional()
      .transform((val) => (val ? new Date(val) : new Date())),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    viewport_w: z.number().positive().optional(),
    viewport_h: z.number().positive().optional(),
    element_tag: z.string().max(32).optional(),
    element_text: z.string().max(80).optional(),
  })
  .refine(
    (data) => {
      if (data.event_type === "click") {
        return typeof data.x === "number" && typeof data.y === "number";
      }
      return true;
    },
    { message: "click events require numeric x and y coordinates" }
  );

/**
 * POST /api/events
 * Accepts a single event object or an array of events.
 * Supports navigator.sendBeacon (text/plain) and standard application/json.
 */
router.post("/events", async (req: Request, res: Response) => {
  try {
    let payload = req.body;
    if (typeof payload === "string") {
      payload = JSON.parse(payload);
    }

    const items = Array.isArray(payload) ? payload : [payload];
    if (items.length === 0) {
      res.status(400).json({ error: "Empty event payload" });
      return;
    }

    const parsed = z.array(eventSchema).safeParse(items);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid event payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const inserted = await Event.insertMany(parsed.data);
    res.status(201).json({
      status: "ok",
      inserted: inserted.length,
    });
  } catch (err) {
    console.error("[POST /api/events] error:", err);
    res.status(500).json({ error: "Failed to store events" });
  }
});

/**
 * GET /api/sessions
 * Aggregates all sessions with total event counts, click counts, and timestamps.
 */
router.get("/sessions", async (_req: Request, res: Response) => {
  try {
    const sessions = await Event.aggregate([
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: "$session_id",
          event_count: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ["$event_type", "page_view"] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] },
          },
          first_seen: { $first: "$timestamp" },
          last_seen: { $last: "$timestamp" },
          entry_url: { $first: "$url" },
        },
      },
      {
        $project: {
          _id: 0,
          session_id: "$_id",
          event_count: 1,
          page_views: 1,
          clicks: 1,
          first_seen: 1,
          last_seen: 1,
          entry_url: 1,
        },
      },
      { $sort: { last_seen: -1 } },
    ]);

    res.json({ sessions });
  } catch (err) {
    console.error("[GET /api/sessions] error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

/**
 * GET /api/sessions/:sessionId/events
 * Fetches the ordered list of events (user journey) for a specific session.
 */
router.get("/sessions/:sessionId/events", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ session_id: sessionId, events });
  } catch (err) {
    console.error("[GET /api/sessions/:id/events] error:", err);
    res.status(500).json({ error: "Failed to fetch session events" });
  }
});

/**
 * GET /api/urls
 * Lists distinct tracked page URLs with their click counts for the heatmap selector.
 */
router.get("/urls", async (_req: Request, res: Response) => {
  try {
    const urls = await Event.aggregate([
      {
        $group: {
          _id: "$url",
          total_events: { $sum: 1 },
          click_count: {
            $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          url: "$_id",
          total_events: 1,
          click_count: 1,
        },
      },
      { $sort: { click_count: -1, url: 1 } },
    ]);

    res.json({ urls });
  } catch (err) {
    console.error("[GET /api/urls] error:", err);
    res.status(500).json({ error: "Failed to fetch tracked URLs" });
  }
});

/**
 * GET /api/heatmap?url=<encoded_url>
 * Returns click coordinates and viewport metadata for the requested page URL.
 */
router.get("/heatmap", async (req: Request, res: Response) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url : "";
    if (!url) {
      res.status(400).json({ error: "Query parameter 'url' is required" });
      return;
    }

    const clicks = await Event.find({ url, event_type: "click" })
      .select("x y viewport_w viewport_h timestamp element_tag element_text -_id")
      .sort({ timestamp: -1 })
      .lean();

    res.json({ url, total_clicks: clicks.length, clicks });
  } catch (err) {
    console.error("[GET /api/heatmap] error:", err);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

export default router;
