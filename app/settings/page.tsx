"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES } from "@/lib/feeds";
import type { FeedSourceRow } from "@/lib/supabase";

function twitterHandleToRssUrl(handle: string): string {
  const clean = handle.replace(/^@/, "").trim();
  return `https://rsshub.app/twitter/user/${clean}`;
}

function isTwitterRssUrl(url: string): boolean {
  return url.includes("rsshub.app/twitter/user/");
}

function twitterHandleFromUrl(url: string): string {
  const match = url.match(/rsshub\.app\/twitter\/user\/([^/?]+)/);
  return match ? `@${match[1]}` : url;
}

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState("news");
  const [sources, setSources] = useState<FeedSourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Add RSS source form
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [addMode, setAddMode] = useState<"rss" | "twitter">("rss");

  // Twitter handle form
  const [twitterHandle, setTwitterHandle] = useState("");
  const [twitterCategory, setTwitterCategory] = useState("news");

  const [notice, setNotice] = useState("");

  const fetchSources = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/sources?category=${category}`);
      const json = await res.json();
      setSources(json.sources ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources(selectedCategory);
  }, [selectedCategory, fetchSources]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleToggle = async (source: FeedSourceRow) => {
    setSaving(source.id);
    try {
      await fetch(`/api/settings/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !source.enabled, category: source.category }),
      });
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, enabled: !s.enabled } : s))
      );
      showNotice("Saved · Refresh the feed to see changes");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (source: FeedSourceRow) => {
    if (!confirm(`Remove "${source.name}"?`)) return;
    setSaving(source.id);
    try {
      await fetch(`/api/settings/sources/${source.id}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== source.id));
      showNotice("Removed · Refresh the feed to see changes");
    } finally {
      setSaving(null);
    }
  };

  const handleAddRss = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    try {
      new URL(addUrl);
    } catch {
      setAddError("Enter a valid URL");
      return;
    }
    setSaving("add");
    try {
      const res = await fetch("/api/settings/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, name: addName.trim(), url: addUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "Failed to add"); return; }
      if (json.source.category === selectedCategory) {
        setSources((prev) => [...prev, json.source]);
      }
      setAddName("");
      setAddUrl("");
      showNotice("Added · Refresh the feed to see articles");
    } finally {
      setSaving(null);
    }
  };

  const handleAddTwitter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const handle = twitterHandle.replace(/^@/, "").trim();
    if (!handle) { setAddError("Enter a Twitter handle"); return; }
    const url = twitterHandleToRssUrl(handle);
    const name = `@${handle}`;
    setSaving("add");
    try {
      const res = await fetch("/api/settings/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: twitterCategory, name, url }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "Failed to add"); return; }
      if (json.source.category === selectedCategory) {
        setSources((prev) => [...prev, json.source]);
      }
      setTwitterHandle("");
      showNotice(`Added @${handle} to ${CATEGORIES.find(c => c.id === twitterCategory)?.label} · Refresh to see tweets`);
    } finally {
      setSaving(null);
    }
  };

  const cat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-bg">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-primary">Settings</h1>
            <p className="mt-0.5 text-[12px] text-subtle" style={{ fontFamily: "Inter, sans-serif" }}>
              Manage feed sources per category
            </p>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border border-border text-subtle hover:text-secondary hover:border-muted transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Twitter section */}
        <section className="bg-surface border border-border rounded-lg p-5">
          <h2 className="font-serif text-lg font-semibold text-primary mb-1">Twitter / X Feeds</h2>
          <p className="text-[12px] text-subtle mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Follow any public Twitter account via RSSHub. Tweets appear as articles in the category you choose.
          </p>
          <form onSubmit={handleAddTwitter} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="@handle or username"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <select
                value={twitterCategory}
                onChange={(e) => setTwitterCategory(e.target.value)}
                className="bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary focus:outline-none focus:border-muted transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving === "add"}
                className="px-4 py-2 rounded text-[12px] font-medium bg-surface border border-border text-primary hover:border-muted transition-colors disabled:opacity-40"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Add
              </button>
            </div>
            {addMode === "twitter" && addError && (
              <p className="text-[11px] text-red-400" style={{ fontFamily: "Inter, sans-serif" }}>{addError}</p>
            )}
          </form>
        </section>

        {/* Feed sources section */}
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Feed Sources</h2>

          {/* Category picker */}
          <div className="flex flex-wrap gap-2 mb-5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`text-[12px] px-3 py-1.5 rounded border font-medium transition-colors ${
                  selectedCategory === c.id
                    ? "border-muted text-primary bg-surface"
                    : "border-border text-subtle hover:border-muted hover:text-secondary"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sources list */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden mb-4">
            {loading ? (
              <div className="px-5 py-8 text-center text-subtle text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
                Loading…
              </div>
            ) : sources.length === 0 ? (
              <div className="px-5 py-8 text-center text-subtle text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
                No sources configured
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {sources.map((source) => (
                  <li key={source.id} className={`flex items-center gap-3 px-5 py-3.5 ${saving === source.id ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isTwitterRssUrl(source.url) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg border border-border text-subtle" style={{ fontFamily: "Inter, sans-serif" }}>
                            X
                          </span>
                        )}
                        <span className={`text-[13px] font-medium ${source.enabled ? "text-primary" : "text-subtle line-through"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {isTwitterRssUrl(source.url) ? twitterHandleFromUrl(source.url) : source.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-subtle mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                        {source.url}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(source)}
                      disabled={saving === source.id}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${source.enabled ? `${cat ? getToggleColor(cat.color) : "bg-zinc-600"}` : "bg-zinc-700"}`}
                      title={source.enabled ? "Disable" : "Enable"}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${source.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(source)}
                      disabled={saving === source.id}
                      className="text-subtle hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remove source"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add RSS source */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => { setAddMode("rss"); setAddError(""); }}
                className={`text-[12px] font-medium px-3 py-1.5 rounded border transition-colors ${addMode === "rss" ? "border-muted text-primary" : "border-border text-subtle hover:border-muted"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Add RSS feed
              </button>
            </div>

            <form onSubmit={handleAddRss} className="space-y-2">
              <input
                type="text"
                placeholder="Source name (e.g. Hacker News)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
                className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <input
                type="text"
                placeholder="RSS URL (e.g. https://news.ycombinator.com/rss)"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                required
                className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {addError && (
                <p className="text-[11px] text-red-400" style={{ fontFamily: "Inter, sans-serif" }}>{addError}</p>
              )}
              <button
                type="submit"
                disabled={saving === "add"}
                className="px-4 py-2 rounded text-[12px] font-medium border border-border text-primary hover:border-muted transition-colors disabled:opacity-40"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {saving === "add" ? "Adding…" : `Add to ${cat?.label ?? "category"}`}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Toast notice */}
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border px-4 py-2.5 rounded-lg text-[12px] text-primary shadow-lg z-50"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}

function getToggleColor(color: string): string {
  const map: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return map[color] ?? "bg-zinc-500";
}
