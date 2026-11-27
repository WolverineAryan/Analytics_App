"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import {
  fetchSessions,
  fetchSessionEvents,
  fetchSites,
  SessionSummary,
  TrackedEvent,
  SiteSummary,
} from "@/lib/api";
import {
  RefreshCw,
  MousePointerClick,
  Eye,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDelta(prevIso: string, currIso: string): string {
  const diffMs = Math.max(
    0,
    new Date(currIso).getTime() - new Date(prevIso).getTime()
  );
  if (diffMs < 1000) return `+${diffMs}ms`;
  const secs = diffMs / 1000;
  if (secs < 60) return `+${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const rem = Math.round(secs % 60);
  return `+${mins}m ${rem}s`;
}

export default function SessionsPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSite = params.get("site_id") || "";
    if (initialSite) setSiteFilter(initialSite);
    fetchSites().then(setSites).catch(() => {});
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSessions(siteFilter || undefined);
      setSessions(data);
      setSelectedId((prev) => {
        if (prev && data.some((s) => s.session_id === prev)) return prev;
        return data[0]?.session_id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect to backend API"
      );
    } finally {
      setLoadingSessions(false);
    }
  }, [siteFilter]);

  const loadEvents = useCallback(async (sessionId: string) => {
    setLoadingEvents(true);
    try {
      const data = await fetchSessionEvents(sessionId);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedId) {
      loadEvents(selectedId);
    } else {
      setEvents([]);
    }
  }, [selectedId, loadEvents]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadSessions();
      if (selectedId) loadEvents(selectedId);
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, selectedId, loadSessions, loadEvents]);

  const filteredSessions = sessions.filter((s) =>
    s.session_id.toLowerCase().includes(search.trim().toLowerCase()) ||
    s.entry_url.toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalEvents = sessions.reduce((sum, s) => sum + s.event_count, 0);
  const totalClicks = sessions.reduce((sum, s) => sum + s.clicks, 0);

  return (
    <AppShell>
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
            Session Telemetry
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
            User Sessions &amp; Journeys
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
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

          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              autoRefresh
                ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#18181B]"
                : "bg-[#F4F4F5] border-[#E4E4E7] text-[#71717A]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? "bg-[#FF4F00] animate-pulse" : "bg-[#A1A1AA]"
              }`}
            />
            Live Poll (5s)
          </button>

          <button
            type="button"
            onClick={() => {
              loadSessions();
              if (selectedId) loadEvents(selectedId);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#E4E4E7] bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#71717A]" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-[#FF4F00]/30 bg-[#FFF5F0] px-4 py-3 text-xs text-[#9A3412]">
          {error} — make sure the backend server is running.
        </div>
      )}

      {/* 30% Structural KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-4 py-3.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            Tracked Sessions
          </div>
          <div className="text-2xl font-semibold font-mono mt-1 text-[#18181B]">
            {sessions.length}
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-4 py-3.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            Total Events
          </div>
          <div className="text-2xl font-semibold font-mono mt-1 text-[#18181B]">
            {totalEvents}
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-4 py-3.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            Captured Clicks
          </div>
          <div className="text-2xl font-semibold font-mono mt-1 text-[#FF4F00]">
            {totalClicks}
          </div>
        </div>
      </div>

      {/* Master-Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Sessions List */}
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-[#E4E4E7] bg-[#F4F4F5]/60 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#71717A] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by session_id or URL..."
              className="w-full bg-transparent text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none font-mono"
            />
          </div>

          <div className="divide-y divide-[#E4E4E7] max-h-[560px] overflow-y-auto">
            {loadingSessions ? (
              <div className="p-8 text-center text-xs text-[#71717A]">
                Loading sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#71717A]">
                No sessions found. Visit the{" "}
                <a href="/demo" className="text-[#FF4F00] underline">
                  Live Demo Store
                </a>{" "}
                to generate events.
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = session.session_id === selectedId;
                return (
                  <button
                    key={session.session_id}
                    type="button"
                    onClick={() => setSelectedId(session.session_id)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#F4F4F5] border-l-2 border-l-[#FF4F00]"
                        : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[#18181B] truncate">
                          {session.session_id}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A] truncate mt-0.5">
                        {session.entry_url}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center px-2 py-0.5 rounded bg-[#F4F4F5] border border-[#E4E4E7] font-mono text-[11px] font-medium text-[#18181B]">
                        {session.event_count} events
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] mt-1">
                        {formatTime(session.last_seen)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Ordered User Journey Timeline */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#F4F4F5]/60 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#18181B]">
                Session Journey
              </h2>
              {selectedId && (
                <p className="text-[11px] font-mono text-[#71717A] mt-0.5">
                  {selectedId}
                </p>
              )}
            </div>
            {events.length > 0 && (
              <span className="text-[11px] font-mono text-[#71717A]">
                {events.length} ordered steps
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 max-h-[560px] overflow-y-auto">
            {!selectedId ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                Select a session on the left to inspect its event timeline.
              </div>
            ) : loadingEvents && events.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                Loading journey...
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                No events recorded for this session.
              </div>
            ) : (
              <ol className="relative border-l border-[#E4E4E7] ml-3 space-y-4">
                {events.map((ev, idx) => {
                  const isClick = ev.event_type === "click";
                  const prev = idx > 0 ? events[idx - 1] : null;
                  return (
                    <li
                      key={ev._id || `${ev.timestamp}-${idx}`}
                      className="ml-5 relative"
                    >
                      <span
                        className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FFFFFF] ${
                          isClick ? "bg-[#FF4F00]" : "bg-[#18181B]"
                        }`}
                      />

                      <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                isClick
                                  ? "bg-[#FFF0EA] text-[#FF4F00] border border-[#FF4F00]/20"
                                  : "bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]"
                              }`}
                            >
                              {isClick ? (
                                <MousePointerClick className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              {ev.event_type}
                            </span>

                            {prev && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#71717A]">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDelta(prev.timestamp, ev.timestamp)}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-mono text-[#71717A]">
                            {formatTime(ev.timestamp)}
                          </span>
                        </div>

                        <div className="mt-2 text-xs font-mono text-[#18181B] break-all flex items-center gap-1.5">
                          <ArrowRight className="h-3 w-3 text-[#A1A1AA] shrink-0" />
                          {ev.url}
                        </div>

                        {isClick && (
                          <div className="mt-2 pt-2 border-t border-[#E4E4E7] flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#52525B]">
                            <span>
                              coords:{" "}
                              <strong className="text-[#18181B]">
                                ({ev.x}, {ev.y})
                              </strong>
                            </span>
                            {ev.element_tag && (
                              <span>
                                target:{" "}
                                <code className="bg-[#FFFFFF] border border-[#E4E4E7] px-1.5 py-0.5 rounded text-[#18181B]">
                                  &lt;{ev.element_tag.toLowerCase()}&gt;
                                  {ev.element_text
                                    ? ` "${ev.element_text}"`
                                    : ""}
                                </code>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
