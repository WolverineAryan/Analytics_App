import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { Site } from "../models/Site";
import { Event } from "../models/Event";

const router = Router();

const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(80).optional(),
  url: z
    .string()
    .min(1, "Website URL is required")
    .refine((val) => {
      try {
        const parsed = new URL(val.startsWith("http") ? val : `https://${val}`);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Must be a valid http:// or https:// URL"),
});

function normalizeUrl(raw: string): { fullUrl: string; origin: string; hostname: string } {
  const withProto = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  const parsed = new URL(withProto);
  return {
    fullUrl: parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname),
    origin: parsed.origin,
    hostname: parsed.hostname,
  };
}

/**
 * GET /api/sites
 * Lists all registered websites along with live event & session counts.
 */
router.get("/sites", async (_req: Request, res: Response) => {
  try {
    const sites = await Site.find().sort({ created_at: -1 }).lean();

    const stats = await Event.aggregate([
      {
        $group: {
          _id: "$site_id",
          total_events: { $sum: 1 },
          sessions: { $addToSet: "$session_id" },
          last_event_at: { $max: "$timestamp" },
        },
      },
      {
        $project: {
          _id: 0,
          site_id: "$_id",
          total_events: 1,
          session_count: { $size: "$sessions" },
          last_event_at: 1,
        },
      },
    ]);

    const statsMap = new Map(stats.map((s) => [s.site_id, s]));

    const enriched = sites.map((site) => {
      const st = statsMap.get(site.site_id);
      return {
        ...site,
        total_events: st?.total_events ?? 0,
        session_count: st?.session_count ?? 0,
        last_event_at: st?.last_event_at ?? null,
        verified: (st?.total_events ?? 0) > 0,
      };
    });

    res.json({ sites: enriched });
  } catch (err) {
    console.error("[GET /api/sites] error:", err);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

/**
 * POST /api/sites
 * Registers a live website URL and generates a unique site_id for tracker.js.
 */
router.post("/sites", async (req: Request, res: Response) => {
  try {
    const parsed = createSiteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid website URL",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { fullUrl, origin, hostname } = normalizeUrl(parsed.data.url.trim());
    const name = parsed.data.name?.trim() || hostname;

    const existing = await Site.findOne({ url: fullUrl }).lean();
    if (existing) {
      res.status(200).json({ site: existing, already_exists: true });
      return;
    }

    const site_id = `site_${crypto.randomBytes(5).toString("hex")}`;
    const site = await Site.create({
      site_id,
      name,
      url: fullUrl,
      origin,
    });

    res.status(201).json({ site });
  } catch (err) {
    console.error("[POST /api/sites] error:", err);
    res.status(500).json({ error: "Failed to register website" });
  }
});

/**
 * DELETE /api/sites/:siteId
 * Removes a registered website.
 */
router.delete("/sites/:siteId", async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const deleted = await Site.findOneAndDelete({ site_id: siteId });
    if (!deleted) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    res.json({ status: "deleted", site_id: siteId });
  } catch (err) {
    console.error("[DELETE /api/sites/:siteId] error:", err);
    res.status(500).json({ error: "Failed to delete site" });
  }
});

export default router;
