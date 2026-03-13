export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
  accent: string;       // Tailwind color class for badge bg
  textAccent: string;   // Tailwind color class for badge text
  borderAccent: string; // Tailwind border color class
  summaryLength: "short" | "long";
  feeds: FeedSource[];
}

export interface FeedSource {
  name: string;
  url: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "news",
    label: "News & Startups",
    color: "blue",
    accent: "bg-blue-950",
    textAccent: "text-blue-400",
    borderAccent: "border-blue-800",
    summaryLength: "short",
    feeds: [
      { name: "Hacker News", url: "https://news.ycombinator.com/rss" },
      { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
      { name: "Inc42", url: "https://inc42.com/feed/" },
      { name: "Product Hunt", url: "https://www.producthunt.com/feed" },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Investing",
    color: "emerald",
    accent: "bg-emerald-950",
    textAccent: "text-emerald-400",
    borderAccent: "border-emerald-800",
    summaryLength: "long",
    feeds: [
      { name: "ET Markets", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
      { name: "Mint Money", url: "https://www.livemint.com/rss/money" },
      { name: "Moneycontrol", url: "https://www.moneycontrol.com/rss/MCtopnews.xml" },
      { name: "Financial Times", url: "https://www.ft.com/rss/home" },
    ],
  },
  {
    id: "science",
    label: "Science & Psychology",
    color: "violet",
    accent: "bg-violet-950",
    textAccent: "text-violet-400",
    borderAccent: "border-violet-800",
    summaryLength: "long",
    feeds: [
      { name: "Quanta Magazine", url: "https://www.quantamagazine.org/feed/" },
      { name: "Scientific American", url: "https://www.scientificamerican.com/feed/rss/" },
      { name: "Psychology Today", url: "https://www.psychologytoday.com/us/front-page/feed" },
      { name: "Nature", url: "https://www.nature.com/nature.rss" },
    ],
  },
  {
    id: "sports",
    label: "Sports",
    color: "orange",
    accent: "bg-orange-950",
    textAccent: "text-orange-400",
    borderAccent: "border-orange-800",
    summaryLength: "short",
    feeds: [
      { name: "ESPNcricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml" },
      { name: "BBC Football", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
      { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
      { name: "Badminton World", url: "https://www.bwfbadminton.com/feed/" },
    ],
  },
  {
    id: "music",
    label: "Music Discovery",
    color: "pink",
    accent: "bg-pink-950",
    textAccent: "text-pink-400",
    borderAccent: "border-pink-800",
    summaryLength: "short",
    feeds: [
      { name: "Pitchfork", url: "https://pitchfork.com/rss/news/" },
      { name: "NME", url: "https://www.nme.com/feed" },
      { name: "Rolling Stone", url: "https://www.rollingstone.com/music/music-news/feed/" },
      { name: "Billboard", url: "https://www.billboard.com/feed/" },
    ],
  },
  {
    id: "india",
    label: "India & Cities",
    color: "amber",
    accent: "bg-amber-950",
    textAccent: "text-amber-400",
    borderAccent: "border-amber-800",
    summaryLength: "short",
    feeds: [
      { name: "The Hindu", url: "https://www.thehindu.com/feeder/default.rss" },
      { name: "Scroll.in", url: "https://scroll.in/feed" },
      { name: "Deccan Herald", url: "https://www.deccanherald.com/rss/bangalore-news" },
      { name: "Mumbai Mirror", url: "https://mumbaimirror.indiatimes.com/rssfeeds/1297681536.cms" },
      { name: "NDTV India", url: "https://feeds.feedburner.com/ndtvnews-india-news" },
    ],
  },
  {
    id: "cafes",
    label: "Cafes & Hospitality",
    color: "rose",
    accent: "bg-rose-950",
    textAccent: "text-rose-400",
    borderAccent: "border-rose-800",
    summaryLength: "short",
    feeds: [
      { name: "Eater", url: "https://www.eater.com/rss/index.xml" },
      { name: "CN Traveller India", url: "https://www.cntraveller.in/feed/" },
      { name: "Mint Leisure", url: "https://www.livemint.com/rss/leisure" },
      { name: "Food52", url: "https://food52.com/blog/feed" },
    ],
  },
];

export function getCategoryById(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
