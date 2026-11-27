"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  API_BASE,
  fetchSites,
  createSite,
  deleteSite,
  SiteSummary,
} from "@/lib/api";
import {
  Globe,
  Plus,
  Copy,
  Check,
  Trash2,
  Activity,
  Flame,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSites = useCallback(async () => {
    try {
      const data = await fetchSites();
      setSites(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load websites"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSite({
        url: urlInput.trim(),
        name: nameInput.trim() || undefined,
      });
      setUrlInput("");
      setNameInput("");
      await loadSites();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not register website"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    try {
      await deleteSite(siteId);
      setSites((prev) => prev.filter((s) => s.site_id !== siteId));
    } catch {
      setError("Failed to delete website");
    }
  };

  const getSnippet = (siteId: string) =>
    `<script src="${API_BASE}/tracker.js" data-site-id="${siteId}" async></script>`;

  const handleCopy = (siteId: string) => {
    navigator.clipboard.writeText(getSnippet(siteId));
    setCopiedId(siteId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
          Site Registry
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
          Live Websites &amp; Tracking Snippets
        </h1>
        <p className="text-xs text-[#71717A] mt-1">
          Add any live website URL to generate a site-specific{" "}
          <code className="font-mono text-[#18181B]">tracker.js</code> embed
          snippet and isolate its sessions &amp; heatmaps.
        </p>
      </div>

      {/* Add Live Website URL Form */}
      <form
        onSubmit={handleAddSite}
        className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg p-4 sm:p-5 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label
              htmlFor="site-url"
              className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1.5"
            >
              Live Website URL *
            </label>
            <input
              id="site-url"
              type="text"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-store.com"
              className="w-full h-9 px-3 text-xs font-mono bg-[#FAFAFA] border border-[#E4E4E7] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#FF4F00]"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="site-name"
              className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1.5"
            >
              Display Name (Optional)
            </label>
            <input
              id="site-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="My Production Storefront"
              className="w-full h-9 px-3 text-xs bg-[#FAFAFA] border border-[#E4E4E7] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#FF4F00]"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-4 text-xs font-medium rounded-md bg-[#FF4F00] text-white hover:bg-[#E04600] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {submitting ? "Adding..." : "Add Website"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-[#DC2626] font-mono">{error}</div>
        )}
      </form>

      {/* Registered Websites List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg p-8 text-center text-xs text-[#71717A]">
            Loading registered websites...
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg p-8 text-center text-xs text-[#71717A]">
            No websites registered yet. Add a live URL above to get started.
          </div>
        ) : (
          sites.map((site) => {
            const snippet = getSnippet(site.site_id);
            return (
              <div
                key={site.site_id}
                className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Globe className="h-4 w-4 text-[#71717A] shrink-0" />
                      <h2 className="text-sm font-semibold text-[#18181B]">
                        {site.name}
                      </h2>
                      {site.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FFF0EA] text-[#FF4F00] border border-[#FF4F00]/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Receiving Events
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                          <Clock className="h-3 w-3" />
                          Waiting for Script
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs font-mono text-[#71717A]">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#18181B] truncate"
                      >
                        {site.url}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <span>·</span>
                      <span>{site.session_count} sessions</span>
                      <span>·</span>
                      <span>{site.total_events} events</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/sessions?site_id=${encodeURIComponent(
                        site.site_id
                      )}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-[#E4E4E7] bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[#18181B]"
                    >
                      <Activity className="h-3.5 w-3.5 text-[#71717A]" />
                      Sessions
                    </Link>
                    <Link
                      href={`/heatmap?site_id=${encodeURIComponent(
                        site.site_id
                      )}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-[#E4E4E7] bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[#18181B]"
                    >
                      <Flame className="h-3.5 w-3.5 text-[#FF4F00]" />
                      Heatmap
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(site.site_id)}
                      className="p-1.5 rounded border border-[#E4E4E7] text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                      aria-label={`Delete ${site.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Embed Snippet */}
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-[#18181B] overflow-x-auto">
                    {snippet}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(site.site_id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-[#18181B] text-white hover:bg-[#27272A] transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    {copiedId === site.site_id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Snippet
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
