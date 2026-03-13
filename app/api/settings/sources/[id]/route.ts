import { NextRequest, NextResponse } from "next/server";
import { updateFeedSource, deleteFeedSource, deleteArticlesForCategory } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { category, ...updates } = body as { category?: string; enabled?: boolean; name?: string; url?: string };

  try {
    const source = await updateFeedSource(id, updates);
    // Bust the article cache so changes are reflected on next load
    if (category) await deleteArticlesForCategory(category);
    return NextResponse.json({ source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const category = await deleteFeedSource(id);
    if (category) await deleteArticlesForCategory(category);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
