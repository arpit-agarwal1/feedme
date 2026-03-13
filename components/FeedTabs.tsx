"use client";

import { CATEGORIES } from "@/lib/feeds";

interface Props {
  active: string;
  onChange: (id: string) => void;
}

const DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  violet: "bg-violet-400",
  orange: "bg-orange-400",
  pink: "bg-pink-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
};

const UNDERLINE_COLORS: Record<string, string> = {
  blue: "border-blue-400",
  emerald: "border-emerald-400",
  violet: "border-violet-400",
  orange: "border-orange-400",
  pink: "border-pink-400",
  amber: "border-amber-400",
  rose: "border-rose-400",
};

export function FeedTabs({ active, onChange }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex overflow-x-auto tabs-scroll px-4 md:px-8 gap-0">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === active;
            return (
              <button
                key={cat.id}
                onClick={() => onChange(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-4 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors duration-150
                  ${isActive
                    ? `${UNDERLINE_COLORS[cat.color]} text-primary`
                    : "border-transparent text-subtle hover:text-secondary"
                  }
                `}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[cat.color]}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
