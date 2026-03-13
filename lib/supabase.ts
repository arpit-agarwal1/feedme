import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
