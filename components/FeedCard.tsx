"use client";

import Image from "next/image";
import type { Article } from "@/lib/supabase";
import type { CategoryConfig } from "@/lib/feeds";

interface Props {
  article: Article;
  category: CategoryConfig;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function FeedCard({ article, category }: Props) {
  const isLong = category.summaryLength === "long";

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface border border-border rounded-lg overflow-hidden hover:border-muted transition-colors duration-200"
    >
      {/* Article image (if available) */}
      {article.image_url && (
        <div className="relative w-full overflow-hidden bg-border" style={{ aspectRatio: "16/9" }}>
          <Image
            src={article.image_url}
            alt=""
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Source + time row */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${category.accent} ${category.textAccent}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {article.source}
          </span>
          {article.pub_date && (
            <span
              className="text-[11px] text-subtle shrink-0"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {timeAgo(article.pub_date)}
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className={`font-serif font-semibold leading-snug text-primary group-hover:text-white transition-colors ${
            isLong ? "text-[17px]" : "text-[15px]"
          }`}
        >
          {article.title}
        </h2>

        {/* Description */}
        {article.description && (
          <p
            className={`mt-2 text-secondary leading-relaxed ${
              isLong ? "text-[13px] line-clamp-4" : "text-[12px] line-clamp-2"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {article.description}
          </p>
        )}

        {/* Read more hint */}
        <div
          className={`mt-3 text-[11px] font-medium uppercase tracking-widest ${category.textAccent} opacity-0 group-hover:opacity-100 transition-opacity`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Read →
        </div>
      </div>
    </a>
  );
}

export function FeedCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-3 w-10 rounded" />
      </div>
      <div className="skeleton h-5 w-full rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-3/4 rounded" />
    </div>
  );
}
