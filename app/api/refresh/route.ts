import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/feeds";
import { fetchAllForCategory } from "@/lib/rss";
import { upsertArticles, getSourcesForCategory } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Protect cron endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow Vercel cron (no auth header in some versions)
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results: Record<string, number> = {};

  await Promise.allSettled(
    CATEGORIES.map(async (cat) => {
      const sources = await getSourcesForCategory(cat.id);
      const articles = await fetchAllForCategory(sources);
      if (articles.length > 0) {
        await upsertArticles(cat.id, articles);
        results[cat.id] = articles.length;
      } else {
        results[cat.id] = 0;
      }
    })
  );

  return NextResponse.json({ ok: true, refreshed: results, at: new Date().toISOString() });
}
