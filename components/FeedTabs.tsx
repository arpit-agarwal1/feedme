"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, getCategoryById } from "@/lib/feeds";

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

const LEFT_BORDER_COLORS: Record<string, string> = {
  blue: "border-blue-400 text-blue-400",
  emerald: "border-emerald-400 text-emerald-400",
  violet: "border-violet-400 text-violet-400",
  orange: "border-orange-400 text-orange-400",
  pink: "border-pink-400 text-pink-400",
  amber: "border-amber-400 text-amber-400",
  rose: "border-rose-400 text-rose-400",
};

export function FeedTabs({ active, onChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const activeCategory = getCategoryById(active);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const t = setTimeout(() => setDrawerVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [drawerOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setDrawerOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-bg border-b border-border">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: active category + hamburger */}
          <div className="md:hidden flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {activeCategory && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[activeCategory.color]}`} />
              )}
              <span className="text-[13px] font-medium text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
                {activeCategory?.label ?? "Feed"}
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open categories"
              className="p-1.5 text-subtle hover:text-primary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="2" y1="4.5" x2="16" y2="4.5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13.5" x2="16" y2="13.5" />
              </svg>
            </button>
          </div>

          {/* Desktop: horizontal scroll tabs */}
          <div className="hidden md:flex overflow-x-auto tabs-scroll px-4 md:px-8 gap-0">
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

      {/* Mobile category drawer */}
      {drawerVisible && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-200 ${drawerOpen ? "opacity-60" : "opacity-0"}`}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={`relative bg-surface border-t border-border rounded-t-2xl transition-transform duration-200 ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            <div
              className="px-2 pb-safe pt-2 overflow-y-auto"
              style={{ maxHeight: "70vh", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
              role="dialog"
              aria-modal="true"
              aria-label="Select category"
            >
              {CATEGORIES.map((cat) => {
                const isActive = cat.id === active;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors border-l-2 ${
                      isActive
                        ? `${LEFT_BORDER_COLORS[cat.color]} bg-bg`
                        : "border-transparent text-subtle hover:text-secondary hover:bg-bg"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[cat.color]}`} />
                    <span className="text-[14px] font-medium">{cat.label}</span>
                    {isActive && (
                      <svg className="ml-auto w-4 h-4 opacity-60" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
