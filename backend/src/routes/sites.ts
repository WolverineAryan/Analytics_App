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

/**
 * GET /api/preview?url=<encoded_url>
 * Fetches a live external page's HTML and injects <base href> so CSS/images
 * resolve inside the heatmap preview iframe without X-Frame-Options blocking.
 */
router.get("/preview", async (req: Request, res: Response) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    res.status(400).send("Missing url parameter");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      res.status(400).send("Invalid protocol");
      return;
    }
  } catch {
    res.status(400).send("Invalid URL");
    return;
  }

  // Basic SSRF guard: block private/link-local metadata IPs
  const host = parsed.hostname.toLowerCase();
  if (
    host === "169.254.169.254" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    res.status(403).send("Private network URLs are not allowed");
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);

    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !contentType.includes("text/html")) {
      res.status(502).send(
        `<html><body style="font-family:monospace;padding:32px;color:#52525B;background:#FAFAFA;">Preview unavailable (HTTP ${upstream.status}). Click coordinates will still render on this plane.</body></html>`
      );
      return;
    }

    let html = await upstream.text();
    const baseTag = `<base href="${parsed.origin}/" target="_blank" />`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${baseTag}`);
    } else {
      html = `${baseTag}\n${html}`;
    }

    // Strip any meta CSP frame-ancestors if present
    html = html.replace(
      /<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
      ""
    );

    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("[GET /api/preview] error:", err);
    res
      .status(502)
      .send(
        `<html><body style="font-family:monospace;padding:32px;color:#52525B;background:#FAFAFA;">Could not load live preview for ${parsed.origin}. Click coordinates will still render on this plane.</body></html>`
      );
  }
});

export default router;
