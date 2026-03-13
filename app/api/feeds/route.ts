import { NextRequest, NextResponse } from "next/server";
import { getCategoryById } from "@/lib/feeds";
import { fetchAllForCategory } from "@/lib/rss";
import { getCachedArticles, upsertArticles, getSourcesForCategory } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "category param required" }, { status: 400 });
  }

  const config = getCategoryById(category);
  if (!config) {
    return NextResponse.json({ error: "unknown category" }, { status: 404 });
  }

  // Try cache first (skip if force=1)
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force) {
    const cached = await getCachedArticles(category);
    if (cached && cached.length > 0) {
      return NextResponse.json({ articles: cached, source: "cache" });
    }
  }

  // Fetch fresh using DB sources (falls back to static config if DB has none)
  const sources = await getSourcesForCategory(category);
  const parsed = await fetchAllForCategory(sources);
  if (parsed.length === 0) {
    return NextResponse.json({ articles: [], source: "fresh" });
  }

  try {
    const saved = await upsertArticles(category, parsed);
    return NextResponse.json({ articles: saved, source: "fresh" });
  } catch {
    // Return unsaved articles if DB write fails
    return NextResponse.json({ articles: parsed.slice(0, 40), source: "fresh" });
  }
}
