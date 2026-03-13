import Parser from "rss-parser";
import type { FeedSource } from "./feeds";

export interface ParsedArticle {
  title: string;
  description: string | null;
  link: string;
  pub_date: string | null;
  source: string;
  image_url: string | null;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; DailyFeed/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

function extractImage(item: Record<string, unknown>): string | null {
  // Try media:content
  const media = item.mediaContent as Record<string, Record<string, string>> | undefined;
  if (media?.["$"]?.url) return media["$"].url;

  // Try media:thumbnail
  const thumb = item.mediaThumbnail as Record<string, Record<string, string>> | undefined;
  if (thumb?.["$"]?.url) return thumb["$"].url;

  // Try enclosure
  const enc = item.enclosure as Record<string, unknown> | undefined;
  if (enc?.url && typeof enc.url === "string" && enc.url.match(/\.(jpg|jpeg|png|webp)/i)) {
    return enc.url;
  }

  // Try og:image in content
  const content = (item.content || item["content:encoded"] || "") as string;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

export async function fetchFeed(source: FeedSource): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 20).map((item) => {
      const rawDesc =
        (item.contentSnippet || item.summary || item.content || "").trim();
      const description = rawDesc ? truncate(stripHtml(rawDesc), 400) : null;

      return {
        title: stripHtml(item.title || "Untitled"),
        description,
        link: item.link || item.guid || "",
        pub_date: item.pubDate || item.isoDate || null,
        source: source.name,
        image_url: extractImage(item as unknown as Record<string, unknown>),
      };
    }).filter((a) => a.link);
  } catch (err) {
    console.error(`[rss] Failed to fetch ${source.name}: ${(err as Error).message}`);
    return [];
  }
}

export async function fetchAllForCategory(sources: FeedSource[]): Promise<ParsedArticle[]> {
  const results = await Promise.allSettled(sources.map(fetchFeed));
  const articles: ParsedArticle[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  // Deduplicate by link
  const seen = new Set<string>();
  const deduped = articles.filter((a) => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  // Sort by date descending (newest first)
  return deduped.sort((a, b) => {
    const da = a.pub_date ? new Date(a.pub_date).getTime() : 0;
    const db = b.pub_date ? new Date(b.pub_date).getTime() : 0;
    return db - da;
  });
}
