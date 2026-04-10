-- Run in Supabase SQL editor:
alter table user_profiles
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists user_profiles_user_id_idx on user_profiles(user_id);
