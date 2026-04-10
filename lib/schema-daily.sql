-- Run in Supabase SQL editor:

create table if not exists daily_articles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  assigned_date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, assigned_date)
);

create index if not exists daily_articles_user_date_idx on daily_articles(user_id, assigned_date);
