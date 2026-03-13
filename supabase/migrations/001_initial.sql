-- Daily Feed: core articles table
create table if not exists articles (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  title       text not null,
  description text,
  link        text not null,
  pub_date    timestamptz,
  source      text not null,
  image_url   text,
  fetched_at  timestamptz not null default now(),

  constraint articles_link_key unique (link)
);

-- Index for fast category queries ordered by date
create index if not exists articles_category_pub_date_idx
  on articles (category, pub_date desc nulls last);

-- Index for cache TTL queries
create index if not exists articles_category_fetched_at_idx
  on articles (category, fetched_at desc);

-- Auto-delete articles older than 7 days (keep DB lean)
-- Run this as a scheduled job or via pg_cron if available
-- For now, we'll handle this via the refresh API
