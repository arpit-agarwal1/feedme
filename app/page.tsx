"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedTabs } from "@/components/FeedTabs";
import { FeedCard, FeedCardSkeleton } from "@/components/FeedCard";
import { CATEGORIES, getCategoryById } from "@/lib/feeds";
import type { Article } from "@/lib/supabase";

type FetchState = "idle" | "loading" | "loaded" | "error";

const STORAGE_KEY = "feed-active-tab";

function Header({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-border bg-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-primary leading-none">
            Daily Feed
          </h1>
          <p className="mt-1 text-[12px] text-subtle" style={{ fontFamily: "Inter, sans-serif" }}>
            {dateStr}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-[12px] font-medium border border-border text-subtle hover:text-secondary hover:border-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "Inter, sans-serif" }}
          title="Refresh current feed"
        >
          <svg
            className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}

function EmptyState({ category }: { category: string }) {
  const cat = getCategoryById(category);
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4">📭</div>
      <p className="text-secondary font-serif text-lg">No articles found</p>
      <p className="text-subtle text-sm mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
        {cat?.label} feeds may be temporarily unavailable
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-secondary font-serif text-lg">Failed to load</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-2 text-sm border border-border rounded text-subtle hover:text-primary hover:border-muted transition-colors"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Try again
      </button>
    </div>
  );
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) ?? "news" : "news")
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [forceRefresh, setForceRefresh] = useState(false);

  const activeCategory = getCategoryById(activeTab);

  const load = useCallback(
    async (tab: string, bust = false) => {
      setFetchState("loading");
      setArticles([]);

      try {
        const url = `/api/feeds?category=${tab}${bust ? `&bust=${Date.now()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setArticles(json.articles ?? []);
        setFetchState("loaded");
      } catch {
        setFetchState("error");
      }
    },
    []
  );

  // Load when tab changes
  useEffect(() => {
    load(activeTab);
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab, load]);

  // Force refresh (bypass cache by deleting cached articles would need backend support;
  // here we just reload and Supabase TTL governs freshness — or we hit /api/refresh)
  const handleRefresh = async () => {
    setForceRefresh(true);
    await load(activeTab, true);
    setForceRefresh(false);
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header onRefresh={handleRefresh} isRefreshing={forceRefresh} />
      <FeedTabs active={activeTab} onChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Category title + article count */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">
              {activeCategory?.label}
            </h2>
            {fetchState === "loaded" && articles.length > 0 && (
              <p className="text-[12px] text-subtle mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                {articles.length} article{articles.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Category source pills */}
          {fetchState !== "loading" && activeCategory && (
            <div className="hidden md:flex flex-wrap gap-1.5 justify-end max-w-sm">
              {activeCategory.feeds.map((f) => (
                <span
                  key={f.name}
                  className={`text-[10px] px-2 py-0.5 rounded border ${activeCategory.borderAccent} ${activeCategory.textAccent} opacity-60`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fetchState === "loading" &&
            Array.from({ length: 12 }).map((_, i) => <FeedCardSkeleton key={i} />)}

          {fetchState === "loaded" && articles.length === 0 && (
            <EmptyState category={activeTab} />
          )}

          {fetchState === "error" && <ErrorState onRetry={() => load(activeTab)} />}

          {fetchState === "loaded" &&
            activeCategory &&
            articles.map((article) => (
              <FeedCard key={article.id ?? article.link} article={article} category={activeCategory} />
            ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div
          className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between text-[11px] text-subtle"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span>Daily Feed · Refreshes every 6 hours · Morning digest at 7:30 AM</span>
          <span className="hidden md:block">
            {CATEGORIES.length} categories · {CATEGORIES.reduce((a, c) => a + c.feeds.length, 0)} sources
          </span>
        </div>
      </footer>
    </div>
  );
}
