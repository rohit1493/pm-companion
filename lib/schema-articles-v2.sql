-- Migration: Add v2 columns to articles table
-- Run this in Supabase SQL editor AFTER the base schema.sql

alter table articles
  add column if not exists summary_short   text,
  add column if not exists key_insight     text,
  add column if not exists hooks           jsonb,
  add column if not exists quiz_q1         text,
  add column if not exists quiz_a1         text,
  add column if not exists quiz_q2         text,
  add column if not exists quiz_a2         text,
  add column if not exists category        text,
  add column if not exists difficulty      int default 1,
  add column if not exists is_active       boolean default true;

-- difficulty: 1 = Introductory, 2 = Intermediate, 3 = Advanced
-- hooks: JSONB array of hook strings per archetype, e.g. {"faang_climber": "...", "scanner": "..."}
-- is_active: false = skip in feed (dead URL or retired article)

create index if not exists articles_category_idx    on articles(category);
create index if not exists articles_difficulty_idx  on articles(difficulty);
create index if not exists articles_is_active_idx   on articles(is_active);
