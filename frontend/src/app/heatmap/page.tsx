"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import {
  API_BASE,
  fetchTrackedUrls,
  fetchHeatmap,
  fetchSites,
  UrlSummary,
  HeatmapClick,
  SiteSummary,
} from "@/lib/api";
import { Flame, Crosshair, RefreshCw, ExternalLink } from "lucide-react";

type ViewMode = "density" | "dots";

const LOGICAL_W = 1280;
const LOGICAL_H = 800;

export default function HeatmapPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [urls, setUrls] = useState<UrlSummary[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [clicks, setClicks] = useState<HeatmapClick[]>([]);
  const [mode, setMode] = useState<ViewMode>("density");
  const [hoveredClick, setHoveredClick] = useState<{
    click: HeatmapClick;
    pctX: number;
    pctY: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSite = params.get("site_id") || "";
    if (initialSite) setSiteFilter(initialSite);
    fetchSites().then(setSites).catch(() => {});
  }, []);

  const selectedSiteObj = sites.find((s) => s.site_id === siteFilter) || null;

  const loadUrls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrackedUrls(siteFilter || undefined);
      setUrls(data);
      if (data.length > 0) {
        setSelectedUrl((prev) =>
          prev && data.some((u) => u.url === prev) ? prev : data[0].url
        );
      } else {
        // No tracked events for this site yet — clear URL & clicks immediately
        setSelectedUrl("");
        setClicks([]);
      }
    } catch {
      setUrls([]);
      setSelectedUrl("");
      setClicks([]);
    } finally {
      setLoading(false);
    }
  }, [siteFilter]);

  const loadHeatmap = useCallback(async (url: string) => {
    if (!url) {
      setClicks([]);
      return;
    }
    try {
      const data = await fetchHeatmap(url);
      setClicks(data.clicks ?? []);
    } catch {
      setClicks([]);
    }
  }, []);

  useEffect(() => {
    setClicks([]);
    loadUrls();
  }, [loadUrls]);

  useEffect(() => {
    if (selectedUrl) {
      loadHeatmap(selectedUrl);
    } else {
      setClicks([]);
    }
  }, [selectedUrl, loadHeatmap]);

  const getNormalizedPct = (c: HeatmapClick) => {
    const baseW = c.viewport_w && c.viewport_w > 0 ? c.viewport_w : LOGICAL_W;
    const baseH = c.viewport_h && c.viewport_h > 0 ? c.viewport_h : LOGICAL_H;
    const pctX = Math.min(99, Math.max(1, (c.x / baseW) * 100));
    const pctY = Math.min(99, Math.max(1, (c.y / baseH) * 100));
    return { pctX, pctY };
  };

  // Draw Density Heat onto <canvas>
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (mode !== "density" || clicks.length === 0) return;

    clicks.forEach((c) => {
      const { pctX, pctY } = getNormalizedPct(c);
      const cx = (pctX / 100) * LOGICAL_W;
      const cy = (pctY / 100) * LOGICAL_H;
      const radius = 56;

      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
      grad.addColorStop(0, "rgba(255, 79, 0, 0.55)");
      grad.addColorStop(0.45, "rgba(255, 138, 0, 0.25)");
      grad.addColorStop(1, "rgba(255, 79, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [clicks, mode]);

  // Active URL to preview: either the selected tracked URL, or the registered site's URL
  const activePreviewUrl = selectedUrl || selectedSiteObj?.url || "";

  const getIframeSrc = (rawUrl: string): string | null => {
    if (!rawUrl) return null;
    try {
      const parsed = new URL(rawUrl);
      if (
        typeof window !== "undefined" &&
        parsed.origin === window.location.origin
      ) {
        return parsed.pathname;
      }
      // Route external live websites through backend preview proxy so X-Frame-Options doesn't block them
      return `${API_BASE}/api/preview?url=${encodeURIComponent(rawUrl)}`;
    } catch {
      return rawUrl.startsWith("/") ? rawUrl : null;
    }
  };

  const iframeSrc = getIframeSrc(activePreviewUrl);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
            Spatial Interaction
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
            Click Heatmap
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => {
              setClicks([]);
              setSelectedUrl("");
              setSiteFilter(e.target.value);
            }}
            aria-label="Filter by website"
            className="h-8 px-2.5 text-xs font-mono bg-[#FFFFFF] border border-[#E4E4E7] rounded-md text-[#18181B] focus:outline-none focus:border-[#FF4F00]"
          >
            <option value="">All Websites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Page URL Selector */}
          <select
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            aria-label="Select page URL"
            className="h-8 px-3 text-xs font-mono bg-[#FFFFFF] border border-[#E4E4E7] rounded-md text-[#18181B] focus:outline-none focus:border-[#FF4F00]"
          >
            {urls.length === 0 ? (
              <option value="">
                {selectedSiteObj
                  ? `${selectedSiteObj.url} (0 events yet)`
                  : "No tracked URLs yet"}
              </option>
            ) : (
              urls.map((u) => (
                <option key={u.url} value={u.url}>
                  {u.url} ({u.click_count} clicks)
                </option>
              ))
            )}
          </select>

          {/* Mode Toggle */}
          <div className="inline-flex rounded-md border border-[#E4E4E7] bg-[#FFFFFF] p-0.5">
            <button
              type="button"
              onClick={() => setMode("density")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                mode === "density"
                  ? "bg-[#FF4F00] text-white"
                  : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Density Heat
            </button>
            <button
              type="button"
              onClick={() => setMode("dots")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                mode === "dots"
                  ? "bg-[#FF4F00] text-white"
                  : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Precision Dots
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              loadUrls();
              if (selectedUrl) loadHeatmap(selectedUrl);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#E4E4E7] bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#71717A]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Heatmap Viewport Container */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E4E4E7] bg-[#F4F4F5]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#52525B]">
            <span className="h-2 w-2 rounded-full bg-[#FF4F00]" />
            <span>{activePreviewUrl || "No URL selected"}</span>
            {activePreviewUrl && (
              <a
                href={activePreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#71717A] hover:text-[#18181B]"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="font-mono text-[#71717A]">
            {loading
              ? "Loading..."
              : clicks.length === 0 && selectedSiteObj
                ? "0 recorded clicks — embed tracker.js on this site to capture clicks"
                : `${clicks.length} recorded clicks`}
          </div>
        </div>

        <div className="p-4 bg-[#FAFAFA]">
          <div
            className="relative w-full mx-auto bg-[#FFFFFF] border border-[#E4E4E7] rounded overflow-hidden"
            style={{ aspectRatio: "16 / 10", maxWidth: "1100px" }}
          >
            {iframeSrc ? (
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                title="Page preview"
                className="w-full h-full border-0 pointer-events-none opacity-85"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs font-mono text-[#A1A1AA]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #F4F4F5 1px, transparent 1px), linear-gradient(to bottom, #F4F4F5 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              >
                Select a website or tracked URL above
              </div>
            )}

            {/* Canvas Density Layer */}
            <canvas
              ref={canvasRef}
              width={LOGICAL_W}
              height={LOGICAL_H}
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity ${
                mode === "density" ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Precision Dots Layer */}
            {mode === "dots" &&
              clicks.map((c, idx) => {
                const { pctX, pctY } = getNormalizedPct(c);
                return (
                  <button
                    key={`${c.timestamp}-${idx}`}
                    type="button"
                    onMouseEnter={() =>
                      setHoveredClick({ click: c, pctX, pctY })
                    }
                    onMouseLeave={() => setHoveredClick(null)}
                    style={{
                      left: `${pctX}%`,
                      top: `${pctY}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#FF4F00]/85 border-2 border-[#FFFFFF] shadow-sm hover:scale-150 transition-transform cursor-crosshair"
                    aria-label={`Click at ${c.x}, ${c.y}`}
                  />
                );
              })}

            {/* Hover Tooltip */}
            {hoveredClick && (
              <div
                style={{
                  left: `${Math.min(82, hoveredClick.pctX)}%`,
                  top: `${Math.max(8, hoveredClick.pctY - 6)}%`,
                }}
                className="absolute z-20 -translate-y-full bg-[#18181B] text-white px-2.5 py-1.5 rounded text-[11px] font-mono pointer-events-none whitespace-nowrap shadow-md"
              >
                <div>
                  ({hoveredClick.click.x}, {hoveredClick.click.y})
                  {hoveredClick.click.element_tag
                    ? ` · <${hoveredClick.click.element_tag.toLowerCase()}>`
                    : ""}
                </div>
                {hoveredClick.click.element_text && (
                  <div className="text-[#A1A1AA] truncate max-w-[200px]">
                    &quot;{hoveredClick.click.element_text}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
