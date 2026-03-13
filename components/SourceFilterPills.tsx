"use client";

import type { CategoryConfig } from "@/lib/feeds";

interface Props {
  sources: string[];
  active: Set<string>;
  onToggle: (source: string) => void;
  category: CategoryConfig;
}

export function SourceFilterPills({ sources, active, onToggle, category }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((src) => {
        const isActive = active.has(src);
        return (
          <button
            key={src}
            onClick={() => onToggle(src)}
            className={`text-[10px] px-2.5 py-1 rounded border font-medium transition-colors ${
              isActive
                ? `${category.borderAccent} ${category.textAccent} bg-surface`
                : "border-border text-subtle hover:border-muted hover:text-secondary"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {isActive && <span className="mr-1">✓</span>}
            {src}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={() => active.forEach((s) => onToggle(s))}
          className="text-[10px] px-2.5 py-1 rounded border border-border text-subtle hover:text-secondary transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
