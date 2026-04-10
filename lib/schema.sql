-- Run this in Supabase SQL editor:

create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text unique not null,
  source text,
  published_at timestamptz,
  summary text,
  topics text[],
  reading_time_minutes int default 5,
  created_at timestamptz default now()
);

-- Index for fast topic filtering
create index if not exists articles_topics_idx on articles using gin(topics);
create index if not exists articles_published_idx on articles(published_at desc);
