-- Run in Supabase SQL editor:

alter table daily_articles
  add column if not exists read_at timestamptz,
  add column if not exists read boolean default false;

create index if not exists daily_articles_read_idx on daily_articles(user_id, read);
