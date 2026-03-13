import { NextRequest, NextResponse } from "next/server";
import { getCategoryById } from "@/lib/feeds";
import { getAllFeedSources, addFeedSource } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const all = await getAllFeedSources();
  const sources = category ? all.filter((s) => s.category === category) : all;
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, name, url } = body as { category?: string; name?: string; url?: string };

  if (!category || !name || !url) {
    return NextResponse.json({ error: "category, name, and url are required" }, { status: 400 });
  }
  if (!getCategoryById(category)) {
    return NextResponse.json({ error: "unknown category" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const source = await addFeedSource({ category, name, url, enabled: true });
    return NextResponse.json({ source });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "source already exists for this category" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
