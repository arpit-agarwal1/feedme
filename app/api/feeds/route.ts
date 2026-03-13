import { NextRequest, NextResponse } from "next/server";
import { getCategoryById } from "@/lib/feeds";
import { fetchAllForCategory } from "@/lib/rss";
import { getCachedArticles, upsertArticles } from "@/lib/supabase";

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

  // Try cache first
  const cached = await getCachedArticles(category);
  if (cached && cached.length > 0) {
    return NextResponse.json({ articles: cached, source: "cache" });
  }

  // Fetch fresh
  const parsed = await fetchAllForCategory(config.feeds);
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
