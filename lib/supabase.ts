import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getCategoryById } from "./feeds";
import type { FeedSource } from "./feeds";

export interface Article {
  id: string;
  category: string;
  title: string;
  description: string | null;
  link: string;
  pub_date: string | null;
  source: string;
  image_url: string | null;
  fetched_at: string;
}

export interface FeedSourceRow {
  id: string;
  category: string;
  name: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

// Lazy singletons — only initialized on first request, never at build time
let _anon: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function getAnonClient(): SupabaseClient {
  if (_anon) return _anon;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  _anon = createClient(url, key);
  return _anon;
}

function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

const CACHE_TTL_HOURS = 6;

export async function getCachedArticles(category: string): Promise<Article[] | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const db = getAnonClient();

  const { data, error } = await db
    .from("articles")
    .select("*")
    .eq("category", category)
    .gte("fetched_at", cutoff)
    .order("pub_date", { ascending: false })
    .limit(40);

  if (error || !data || data.length === 0) return null;
  return data as Article[];
}

export async function upsertArticles(
  category: string,
  articles: Omit<Article, "id" | "fetched_at" | "category">[]
): Promise<Article[]> {
  const db = getAdminClient();
  const now = new Date().toISOString();
  const rows = articles.map((a) => ({ ...a, category, fetched_at: now }));

  const { data, error } = await db
    .from("articles")
    .upsert(rows, { onConflict: "link", ignoreDuplicates: false })
    .select();

  if (error) throw error;
  return (data ?? []) as Article[];
}

export async function getRecentArticlesForDigest(): Promise<Record<string, Article[]>> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const db = getAnonClient();

  const { data, error } = await db
    .from("articles")
    .select("*")
    .gte("pub_date", cutoff)
    .order("pub_date", { ascending: false });

  if (error || !data) return {};

  const grouped: Record<string, Article[]> = {};
  for (const article of data as Article[]) {
    if (!grouped[article.category]) grouped[article.category] = [];
    if (grouped[article.category].length < 5) {
      grouped[article.category].push(article);
    }
  }
  return grouped;
}

// --- Feed Sources ---

export async function getSourcesForCategory(category: string): Promise<FeedSource[]> {
  const db = getAnonClient();
  const { data, error } = await db
    .from("feed_sources")
    .select("name, url")
    .eq("category", category)
    .eq("enabled", true)
    .order("name");

  if (error || !data || data.length === 0) {
    // Fall back to static config
    return getCategoryById(category)?.feeds ?? [];
  }
  return data as FeedSource[];
}

export async function getAllFeedSources(): Promise<FeedSourceRow[]> {
  const db = getAnonClient();
  const { data, error } = await db
    .from("feed_sources")
    .select("*")
    .order("category")
    .order("name");

  if (error) throw error;
  return (data ?? []) as FeedSourceRow[];
}

export async function addFeedSource(
  source: Omit<FeedSourceRow, "id" | "created_at">
): Promise<FeedSourceRow> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("feed_sources")
    .insert(source)
    .select()
    .single();

  if (error) throw error;
  return data as FeedSourceRow;
}

export async function updateFeedSource(
  id: string,
  updates: Partial<Pick<FeedSourceRow, "name" | "url" | "enabled">>
): Promise<FeedSourceRow> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("feed_sources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FeedSourceRow;
}

export async function deleteFeedSource(id: string): Promise<string> {
  const db = getAdminClient();
  // Fetch category before deleting so we can bust the cache
  const { data: row } = await db
    .from("feed_sources")
    .select("category")
    .eq("id", id)
    .single();

  const { error } = await db.from("feed_sources").delete().eq("id", id);
  if (error) throw error;
  return (row as FeedSourceRow)?.category ?? "";
}

export async function deleteArticlesForCategory(category: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.from("articles").delete().eq("category", category);
  if (error) throw error;
}
