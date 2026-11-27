export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface SiteSummary {
  site_id: string;
  name: string;
  url: string;
  origin: string;
  created_at: string;
  total_events: number;
  session_count: number;
  last_event_at: string | null;
  verified: boolean;
}

export interface SessionSummary {
  session_id: string;
  site_id?: string;
  event_count: number;
  page_views: number;
  clicks: number;
  first_seen: string;
  last_seen: string;
  entry_url: string;
}

export interface TrackedEvent {
  _id?: string;
  site_id?: string;
  session_id: string;
  event_type: "page_view" | "click";
  url: string;
  timestamp: string;
  x?: number;
  y?: number;
  viewport_w?: number;
  viewport_h?: number;
  element_tag?: string;
  element_text?: string;
}

export interface UrlSummary {
  url: string;
  site_id?: string;
  total_events: number;
  click_count: number;
}

export interface HeatmapClick {
  x: number;
  y: number;
  viewport_w?: number;
  viewport_h?: number;
  timestamp: string;
  element_tag?: string;
  element_text?: string;
}

export async function fetchSites(): Promise<SiteSummary[]> {
  const res = await fetch(`${API_BASE}/api/sites`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch websites");
  const data = await res.json();
  return data.sites ?? [];
}

export async function createSite(input: {
  url: string;
  name?: string;
}): Promise<{ site: SiteSummary; already_exists?: boolean }> {
  const res = await fetch(`${API_BASE}/api/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to add website URL");
  }
  return data;
}

export async function deleteSite(siteId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/sites/${encodeURIComponent(siteId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete website");
}

export async function fetchSessions(siteId?: string): Promise<SessionSummary[]> {
  const qs = siteId ? `?site_id=${encodeURIComponent(siteId)}` : "";
  const res = await fetch(`${API_BASE}/api/sessions${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions ?? [];
}

export async function fetchSessionEvents(
  sessionId: string
): Promise<TrackedEvent[]> {
  const res = await fetch(
    `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/events`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch session events");
  const data = await res.json();
  return data.events ?? [];
}

export async function fetchTrackedUrls(siteId?: string): Promise<UrlSummary[]> {
  const qs = siteId ? `?site_id=${encodeURIComponent(siteId)}` : "";
  const res = await fetch(`${API_BASE}/api/urls${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tracked URLs");
  const data = await res.json();
  return data.urls ?? [];
}

export async function fetchHeatmap(url: string): Promise<{
  url: string;
  total_clicks: number;
  clicks: HeatmapClick[];
}> {
  const res = await fetch(
    `${API_BASE}/api/heatmap?url=${encodeURIComponent(url)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch heatmap data");
  return res.json();
}
