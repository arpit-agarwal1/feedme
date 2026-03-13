-- Feed sources table: user-configurable RSS feeds per category
create table if not exists feed_sources (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,
  name       text not null,
  url        text not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),

  constraint feed_sources_category_url_key unique (category, url)
);

create index if not exists feed_sources_category_enabled_idx
  on feed_sources (category, enabled);

-- Seed with defaults (safe to re-run via ON CONFLICT DO NOTHING)
insert into feed_sources (category, name, url) values
  -- news
  ('news', 'Hacker News',   'https://news.ycombinator.com/rss'),
  ('news', 'TechCrunch',    'https://techcrunch.com/feed/'),
  ('news', 'Inc42',         'https://inc42.com/feed/'),
  ('news', 'Product Hunt',  'https://www.producthunt.com/feed'),
  ('news', 'The Verge',     'https://www.theverge.com/rss/index.xml'),
  -- finance
  ('finance', 'ET Markets',     'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'),
  ('finance', 'Mint Money',     'https://www.livemint.com/rss/money'),
  ('finance', 'Moneycontrol',   'https://www.moneycontrol.com/rss/MCtopnews.xml'),
  ('finance', 'Financial Times','https://www.ft.com/rss/home'),
  -- science
  ('science', 'Quanta Magazine',     'https://www.quantamagazine.org/feed/'),
  ('science', 'Scientific American', 'https://www.scientificamerican.com/feed/rss/'),
  ('science', 'Psychology Today',    'https://www.psychologytoday.com/us/front-page/feed'),
  ('science', 'Nature',              'https://www.nature.com/nature.rss'),
  -- sports
  ('sports', 'ESPNcricinfo',   'https://www.espncricinfo.com/rss/content/story/feeds/0.xml'),
  ('sports', 'BBC Football',   'https://feeds.bbci.co.uk/sport/football/rss.xml'),
  ('sports', 'BBC Sport',      'https://feeds.bbci.co.uk/sport/rss.xml'),
  ('sports', 'Badminton World','https://www.bwfbadminton.com/feed/'),
  -- music
  ('music', 'Pitchfork',    'https://pitchfork.com/rss/news/'),
  ('music', 'NME',          'https://www.nme.com/feed'),
  ('music', 'Rolling Stone', 'https://www.rollingstone.com/music/music-news/feed/'),
  ('music', 'Billboard',    'https://www.billboard.com/feed/'),
  -- india
  ('india', 'The Hindu',     'https://www.thehindu.com/feeder/default.rss'),
  ('india', 'Scroll.in',     'https://scroll.in/feed'),
  ('india', 'Deccan Herald', 'https://www.deccanherald.com/rss/bangalore-news'),
  ('india', 'Mumbai Mirror', 'https://mumbaimirror.indiatimes.com/rssfeeds/1297681536.cms'),
  ('india', 'NDTV India',    'https://feeds.feedburner.com/ndtvnews-india-news'),
  -- cafes
  ('cafes', 'Eater',             'https://www.eater.com/rss/index.xml'),
  ('cafes', 'CN Traveller India','https://www.cntraveller.in/feed/'),
  ('cafes', 'Mint Leisure',      'https://www.livemint.com/rss/leisure'),
  ('cafes', 'Food52',            'https://food52.com/blog/feed')
on conflict (category, url) do nothing;
