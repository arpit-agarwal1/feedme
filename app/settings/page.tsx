"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORIES } from "@/lib/feeds";
import type { FeedSourceRow } from "@/lib/supabase";

function twitterHandleToRssUrl(handle: string): string {
  const clean = handle.replace(/^@/, "").trim();
  return `https://rsshub.app/twitter/user/${clean}`;
}

function twitterHandleFromUrl(url: string): string {
  const match = url.match(/rsshub\.app\/twitter\/user\/([^/?]+)/);
  return match ? `@${match[1]}` : url;
}

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState("news");
  const [sources, setSources] = useState<FeedSourceRow[]>([]);
  const [twitterSources, setTwitterSources] = useState<FeedSourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Add RSS form
  const [addUrl, setAddUrl] = useState("");
  const [addName, setAddName] = useState("");
  const [fetchingName, setFetchingName] = useState(false);
  const [addError, setAddError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add Twitter form
  const [twitterHandle, setTwitterHandle] = useState("");
  const [twitterError, setTwitterError] = useState("");

  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

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

  const fetchTwitterSources = useCallback(async () => {
    const res = await fetch(`/api/settings/sources?category=twitter`);
    const json = await res.json();
    setTwitterSources(json.sources ?? []);
  }, []);

  useEffect(() => {
    fetchSources(selectedCategory);
  }, [selectedCategory, fetchSources]);

  useEffect(() => {
    fetchTwitterSources();
  }, [fetchTwitterSources]);

  // Auto-fetch feed name when URL changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!addUrl) { setAddName(""); return; }

    try { new URL(addUrl); } catch { return; }

    debounceRef.current = setTimeout(async () => {
      setFetchingName(true);
      try {
        const res = await fetch(`/api/settings/sources/preview?url=${encodeURIComponent(addUrl)}`);
        const json = await res.json();
        if (json.title) setAddName(json.title);
      } finally {
        setFetchingName(false);
      }
    }, 600);
  }, [addUrl]);

  const handleToggle = async (source: FeedSourceRow, isTwitter = false) => {
    setSaving(source.id);
    try {
      await fetch(`/api/settings/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !source.enabled, category: source.category }),
      });
      const updater = (prev: FeedSourceRow[]) =>
        prev.map((s) => (s.id === source.id ? { ...s, enabled: !s.enabled } : s));
      if (isTwitter) setTwitterSources(updater);
      else setSources(updater);
      showNotice("Saved · Hit Refresh on the feed to see changes");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (source: FeedSourceRow, isTwitter = false) => {
    if (!confirm(`Remove "${source.name}"?`)) return;
    setSaving(source.id);
    try {
      await fetch(`/api/settings/sources/${source.id}`, { method: "DELETE" });
      const remover = (prev: FeedSourceRow[]) => prev.filter((s) => s.id !== source.id);
      if (isTwitter) setTwitterSources(remover);
      else setSources(remover);
      showNotice("Removed · Hit Refresh on the feed to see changes");
    } finally {
      setSaving(null);
    }
  };

  const handleAddRss = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    try { new URL(addUrl); } catch { setAddError("Enter a valid URL"); return; }
    if (!addName.trim()) { setAddError("Enter a name for this source"); return; }

    setSaving("add-rss");
    try {
      const res = await fetch("/api/settings/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, name: addName.trim(), url: addUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "Failed to add"); return; }
      if (json.source.category === selectedCategory) setSources((prev) => [...prev, json.source]);
      setAddUrl("");
      setAddName("");
      showNotice("Added · Hit Refresh on the feed to see articles");
    } finally {
      setSaving(null);
    }
  };

  const handleAddTwitter = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwitterError("");
    const handle = twitterHandle.replace(/^@/, "").trim();
    if (!handle) { setTwitterError("Enter a handle"); return; }

    setSaving("add-twitter");
    try {
      const res = await fetch("/api/settings/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "twitter",
          name: `@${handle}`,
          url: twitterHandleToRssUrl(handle),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setTwitterError(json.error ?? "Failed to add"); return; }
      setTwitterSources((prev) => [...prev, json.source]);
      setTwitterHandle("");
      showNotice(`Added @${handle}`);
    } finally {
      setSaving(null);
    }
  };

  const feedCategories = CATEGORIES.filter((c) => c.id !== "twitter");
  const cat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-bg">
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

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-10">

        {/* Twitter section */}
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-1">Twitter</h2>
          <p className="text-[12px] text-subtle mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Follow public accounts via RSSHub. Tweets appear in the Twitter tab.
          </p>

          {/* Twitter sources list */}
          {twitterSources.length > 0 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden mb-4">
              <ul className="divide-y divide-border">
                {twitterSources.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={{ ...source, name: twitterHandleFromUrl(source.url) }}
                    saving={saving === source.id}
                    catColor="sky"
                    onToggle={() => handleToggle(source, true)}
                    onDelete={() => handleDelete(source, true)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Add Twitter handle form */}
          <form onSubmit={handleAddTwitter} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="@handle"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="flex-1 bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <button
                type="submit"
                disabled={saving === "add-twitter"}
                className="px-4 py-2 rounded text-[12px] font-medium border border-border text-primary hover:border-muted transition-colors disabled:opacity-40"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {saving === "add-twitter" ? "Adding…" : "Add"}
              </button>
            </div>
            {twitterError && (
              <p className="text-[11px] text-red-400 mt-2" style={{ fontFamily: "Inter, sans-serif" }}>{twitterError}</p>
            )}
          </form>
        </section>

        {/* Feed sources section */}
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Feed Sources</h2>

          {/* Category picker */}
          <div className="flex flex-wrap gap-2 mb-5">
            {feedCategories.map((c) => (
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
                  <SourceRow
                    key={source.id}
                    source={source}
                    saving={saving === source.id}
                    catColor={cat?.color ?? "blue"}
                    onToggle={() => handleToggle(source)}
                    onDelete={() => handleDelete(source)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Add RSS feed form */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <p className="text-[12px] text-subtle mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
              Add RSS feed to <span className="text-primary">{cat?.label}</span>
            </p>
            <form onSubmit={handleAddRss} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="RSS URL"
                  value={addUrl}
                  onChange={(e) => { setAddUrl(e.target.value); setAddError(""); }}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors pr-8"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                {fetchingName && (
                  <svg className="absolute right-2.5 top-2.5 w-4 h-4 text-subtle animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                placeholder="Source name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-primary placeholder:text-subtle focus:outline-none focus:border-muted transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {addError && (
                <p className="text-[11px] text-red-400" style={{ fontFamily: "Inter, sans-serif" }}>{addError}</p>
              )}
              <button
                type="submit"
                disabled={saving === "add-rss" || fetchingName}
                className="px-4 py-2 rounded text-[12px] font-medium border border-border text-primary hover:border-muted transition-colors disabled:opacity-40"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {saving === "add-rss" ? "Adding…" : "Add source"}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Toast */}
      {notice && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border px-4 py-2.5 rounded-lg text-[12px] text-primary shadow-lg z-50 whitespace-nowrap"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}

function SourceRow({
  source,
  saving,
  catColor,
  onToggle,
  onDelete,
}: {
  source: FeedSourceRow;
  saving: boolean;
  catColor: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={`flex items-center gap-3 px-5 py-3.5 ${saving ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <span
          className={`text-[13px] font-medium ${source.enabled ? "text-primary" : "text-subtle line-through"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {source.name}
        </span>
        <p className="text-[11px] text-subtle mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif" }}>
          {source.url}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${source.enabled ? getToggleColor(catColor) : "bg-zinc-700"}`}
        title={source.enabled ? "Disable" : "Enable"}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${source.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      <button
        onClick={onDelete}
        disabled={saving}
        className="text-subtle hover:text-red-400 transition-colors flex-shrink-0"
        title="Remove"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </li>
  );
}

function getToggleColor(color: string): string {
  const map: Record<string, string> = {
    blue: "bg-blue-500", emerald: "bg-emerald-500", violet: "bg-violet-500",
    orange: "bg-orange-500", pink: "bg-pink-500", amber: "bg-amber-500",
    rose: "bg-rose-500", sky: "bg-sky-500",
  };
  return map[color] ?? "bg-zinc-500";
}
