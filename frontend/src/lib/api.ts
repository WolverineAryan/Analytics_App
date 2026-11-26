export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface SessionSummary {
  session_id: string;
  event_count: number;
  page_views: number;
  clicks: number;
  first_seen: string;
  last_seen: string;
  entry_url: string;
}

export interface TrackedEvent {
  _id?: string;
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

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/sessions`, { cache: "no-store" });
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

export async function fetchTrackedUrls(): Promise<UrlSummary[]> {
  const res = await fetch(`${API_BASE}/api/urls`, { cache: "no-store" });
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
