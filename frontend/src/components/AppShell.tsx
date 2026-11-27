"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Flame,
  ShoppingBag,
  Globe,
  Code2,
  Check,
  Copy,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/sites", label: "Websites", icon: Globe },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/heatmap", label: "Heatmap", icon: Flame },
  { href: "/demo", label: "Live Demo Store", icon: ShoppingBag },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSnippet, setShowSnippet] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${API_BASE}/tracker.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B] flex flex-col">
      {/* Top Bar (30% structural surface) */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto">
            <Link
              href="/sessions"
              className="flex items-center gap-2.5 font-semibold tracking-tight text-sm text-[#18181B] shrink-0"
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#FF4F00]" />
              <span>PULSE//TELEMETRY</span>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? "bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]"
                        : "text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]/60"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        active ? "text-[#FF4F00]" : "text-[#71717A]"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            onClick={() => setShowSnippet((s) => !s)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#E4E4E7] bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B] transition-colors cursor-pointer shrink-0"
          >
            <Code2 className="h-3.5 w-3.5 text-[#71717A]" />
            <span>Embed Script</span>
          </button>
        </div>

        {showSnippet && (
          <div className="border-t border-[#E4E4E7] bg-[#F4F4F5] px-4 sm:px-6 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#52525B]">
                Add this tag to any live website, or register a site on the{" "}
                <Link href="/sites" className="text-[#FF4F00] underline">
                  Websites
                </Link>{" "}
                tab for a site-specific{" "}
                <code className="font-mono text-[#18181B]">data-site-id</code>:
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs bg-[#FFFFFF] border border-[#E4E4E7] px-2.5 py-1.5 rounded text-[#18181B] overflow-x-auto">
                  {snippet}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-[#FF4F00] text-white hover:bg-[#E04600] transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main 60% Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
