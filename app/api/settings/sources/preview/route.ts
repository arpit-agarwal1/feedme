import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const maxDuration = 15;

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; DailyFeed/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url param required" }, { status: 400 });

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);
    const title = feed.title?.trim() ?? "";
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: "could not fetch feed" }, { status: 422 });
  }
}
